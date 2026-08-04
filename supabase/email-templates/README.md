# Email templates

Paste into **Dashboard → Authentication → Emails**, one template per file. There
is no CLI or Management API path wired up here, so these are the source of
truth and the dashboard is a copy.

| File | Template | Suggested subject |
|---|---|---|
| `confirm-signup.html` | Confirm signup | 确认你的 Grand Tour 邮箱 |
| `reset-password.html` | Reset password | 重设 Grand Tour 密码 |

Both use `{{ .ConfirmationURL }}`. Other variables available: `{{ .Token }}`,
`{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .RedirectTo }}`, `{{ .Data }}`,
`{{ .Email }}`.

## Why the markup looks dated

Mail clients are not browsers. Outlook on Windows renders with Word, which
ignores `border-radius`, gradients, flexbox and grid, and drops `<style>` blocks
in some configurations. So: table layout, every style inlined, solid background
colours, and buttons built as a padded `<td>` rather than a styled `<a>`.

Playfair Display can't be relied on — remote fonts are blocked by most clients.
Georgia is the stand-in: it's installed nearly everywhere and has a real italic
rather than a synthesised slant.

The design is dark to begin with, which sidesteps the usual dark-mode problem of
clients inverting light templates unpredictably.

## Set the reply-to and sender name

Under **Authentication → Emails → SMTP Settings**, once custom SMTP is on.
Without custom SMTP, Supabase's shared sender is used and **delivery is refused
to any address that isn't a member of the project's team**.
