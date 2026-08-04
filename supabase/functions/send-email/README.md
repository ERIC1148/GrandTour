# send-email

Supabase **Send Email Hook** → Microsoft Graph `sendMail`.

Enabling this hook makes Auth stop sending mail itself and stop rendering its
own templates; it hands us the raw token and we do both. The dashboard's Email
Templates page becomes inert — the copy lives in `index.ts`.

## Why Graph instead of SMTP

Supabase's custom SMTP only speaks username/password. Exchange Online is
retiring Basic auth for SMTP client submission: unchanged through December
2026, disabled by default for existing tenants at the end of that month
(admins can re-enable), unavailable for new tenants after it, with a final
removal date to be announced in the second half of 2027.

Graph with OAuth client credentials has no such expiry. Mail still originates
from the mailbox, so it lands in Sent Items and SPF/DKIM are untouched.

## Secrets

Set under Edge Functions → Secrets. Never commit them.

| Name | Value |
|---|---|
| `MS_TENANT_ID` | Entra directory (tenant) ID |
| `MS_CLIENT_ID` | Application (client) ID |
| `MS_CLIENT_SECRET` | Client secret value |
| `MS_SENDER` | `noreply@your-domain.com` |
| `SEND_EMAIL_HOOK_SECRET` | Generated when the hook is enabled, `v1,whsec_…` |

`SUPABASE_URL` is injected by the platform.

## Entra app registration

1. Entra admin centre → App registrations → New registration (single tenant).
2. API permissions → Microsoft Graph → **Application** permissions → `Mail.Send`
   → Grant admin consent.
3. Certificates & secrets → New client secret → copy the *Value*.

`Mail.Send` as an application permission grants send-as **any** mailbox in the
tenant. Scope it to the one mailbox:

```powershell
New-ApplicationAccessPolicy -AppId <client-id> `
  -PolicyScopeGroupId noreply@your-domain.com `
  -AccessRight RestrictAccess `
  -Description "Grand Tour auth mail"
```

Without this, a leaked secret can send mail as anyone in the organisation.

## Deploy

`verify_jwt` must stay **off**: Auth authenticates with a webhook signature,
not a JWT. The handler verifies that signature itself.
