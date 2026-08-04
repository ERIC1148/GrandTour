# Entra setup for send-email

Goal: let the Edge Function send as `noreply@your-domain.com` through Microsoft Graph,
without granting it the ability to send as anyone else in the tenant.

Roles needed: **Application Administrator** (or Global Admin) in Entra for the
app registration, and **Organization Management** in Exchange Online for the
RBAC scoping.

---

## 1. Register the application

Entra admin centre → **Identity → Applications → App registrations → New
registration**.

- Name: `Grand Tour mailer`
- Supported account types: **Accounts in this organizational directory only**
- Redirect URI: leave empty — this is a daemon app, there is no user sign-in

Register, then copy from the **Overview** page:

| Value | Goes into Supabase secret |
|---|---|
| Application (client) ID | `MS_CLIENT_ID` |
| Directory (tenant) ID | `MS_TENANT_ID` |

## 2. Client secret

**Certificates & secrets → Client secrets → New client secret.**

Copy the **Value** column immediately — it is shown once and is unrecoverable
afterwards. The Secret ID is not it.

→ Supabase secret `MS_CLIENT_SECRET`.

> Secrets expire. Whatever expiry you pick, put a reminder in the calendar:
> when it lapses, password-reset mail stops and the only visible symptom is a
> 500 from the hook.

## 3. Grant Mail.Send, then scope it down

Two stages on purpose — get it sending, then restrict it — because the scoping
step is the one that silently does nothing if you get it wrong.

### Stage A — make it work

**API permissions → Add a permission → Microsoft Graph → Application
permissions → `Mail.Send` → Add**, then **Grant admin consent**.

At this point the app can send as **any mailbox in the tenant**. Test that mail
flows, then continue.

### Stage B — restrict to one mailbox

Application Access Policies are the old mechanism and Microsoft says not to
create new ones; **RBAC for Applications** replaces them.

Find the IDs on **Entra → Enterprise applications →** your app. Use this page,
**not** App registrations — the Object ID differs between the two, and the one
here is the service principal.

```powershell
Install-Module ExchangeOnlineManagement -Scope CurrentUser
Connect-ExchangeOnline -UserPrincipalName noreply@your-domain.com

# Pointer to the Entra service principal
New-ServicePrincipal -AppId <Application ID> -ObjectId <Object ID from Enterprise applications> -DisplayName "Grand Tour mailer"

# The one mailbox it may act on
New-ManagementScope -Name "Grand Tour sender" -RecipientRestrictionFilter "PrimarySmtpAddress -eq 'noreply@your-domain.com'"

# Scoped grant
New-ManagementRoleAssignment -App <Object ID> -Role "Application Mail.Send" -CustomResourceScope "Grand Tour sender"
```

Then **remove the `Mail.Send` grant from Entra API permissions.**

This part is easy to miss and it is the whole point. Permissions from the two
systems are a **union**: an unscoped Entra grant plus a scoped RBAC grant
leaves the app unscoped. Leaving the Entra consent in place means the scope
does nothing.

### Verify

```powershell
Test-ServicePrincipalAuthorization -Identity "Grand Tour mailer" -Resource noreply@your-domain.com | Format-Table
```

`InScope` must be `True` for `Application Mail.Send`. Run it against another
mailbox — it should come back `False`.

> Permission changes are cached for **30 minutes to 2 hours**. `Test-ServicePrincipalAuthorization`
> bypasses the cache; a live send does not. If the test passes but sending
> still fails, wait it out before assuming the config is wrong.

---

## 4. Supabase

**Edge Functions → Secrets:**

| Secret | Value |
|---|---|
| `MS_TENANT_ID` | Directory (tenant) ID |
| `MS_CLIENT_ID` | Application (client) ID |
| `MS_CLIENT_SECRET` | the secret **Value** from step 2 |
| `MS_SENDER` | `noreply@your-domain.com` |

**Authentication → Hooks → Send Email Hook** → HTTPS →
`https://<project-ref>.supabase.co/functions/v1/send-email`.
Copy the generated `v1,whsec_…` into the secret `SEND_EMAIL_HOOK_SECRET`.

**Authentication → Sign In / Providers → Email → Confirm email: off.**
Sign-up then creates a session directly and sends nothing; mail is only for
password resets and the like.

**Authentication → URL Configuration → Site URL:** `https://grandtour.cyg.world`,
and add `https://grandtour.cyg.world/**` to the redirect allow list. Reset links
are built from this.

## 5. Test

Trigger a password reset from the app. Then check the Edge Function logs — a
failure surfaces the exact Graph or token error rather than a generic message.

| Symptom | Cause |
|---|---|
| `token request failed (401): invalid_client` | wrong secret, or the Secret ID was copied instead of the Value |
| `sendMail failed (403)` | `Mail.Send` not consented, or RBAC scope excludes the mailbox, or still cached |
| `sendMail failed (404)` | `MS_SENDER` is not a real mailbox in the tenant |
| hook 401 | `SEND_EMAIL_HOOK_SECRET` mismatch |
