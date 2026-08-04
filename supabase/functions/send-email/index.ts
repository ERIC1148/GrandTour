/**
 * Supabase Send Email Hook → Microsoft Graph.
 *
 * Auth calls this instead of sending mail itself, and we relay through Graph's
 * `sendMail` using OAuth client credentials. That sidesteps Exchange Online's
 * retirement of Basic auth for SMTP client submission (disabled by default for
 * existing tenants at the end of December 2026, removal announced for 2027) —
 * Supabase's custom SMTP only speaks username/password, so the SMTP route has
 * a hard expiry date and this one does not.
 *
 * Mail genuinely originates from the mailbox: it lands in Sent Items, and SPF
 * and DKIM are unchanged because Microsoft is still the sender.
 */

import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

// ---------------------------------------------------------------------------
// Templates. Inlined rather than imported: the deploy path uploads a single
// entrypoint, and a second file is one more thing to get out of sync.
// ---------------------------------------------------------------------------

interface Copy {
  subject: string;
  heading: string;
  body: string;
  cta?: string;
  /** Security notices carry no link — they just tell you something happened. */
  notice?: boolean;
  footer?: string;
}

const COPY: Record<string, Copy> = {
  signup: {
    subject: '确认你的 Grand Tour 邮箱',
    heading: '确认你的邮箱',
    body: '点下面的按钮完成注册，之后住过的每一间房都会记进这本册子。',
    cta: '确认邮箱',
    footer: '不是你本人操作的话，忽略这封信就好。',
  },
  invite: {
    subject: '邀请你加入 Grand Tour',
    heading: '邀请你加入',
    body: '有人邀请你使用 Grand Tour 记录住过的酒店。',
    cta: '接受邀请',
    footer: '不认识邀请人的话，忽略这封信就好。',
  },
  magiclink: {
    subject: '登录 Grand Tour',
    heading: '登录',
    body: '点下面的按钮直接登录，不用输密码。链接短时间内有效。',
    cta: '登录',
    footer: '不是你申请的？忽略即可。',
  },
  recovery: {
    subject: '重设 Grand Tour 密码',
    heading: '重设密码',
    body: '点下面的按钮设置一个新密码。链接短时间内有效。',
    cta: '设置新密码',
    footer: '不是你申请的？忽略即可，密码不会改变。',
  },
  email_change: {
    subject: '确认更换 Grand Tour 邮箱',
    heading: '确认新邮箱',
    body: '点下面的按钮确认把账号绑定到这个邮箱。',
    cta: '确认更换',
    footer: '不是你申请的？忽略即可，邮箱不会变更。',
  },
  reauthentication: {
    subject: 'Grand Tour 验证码',
    heading: '验证码',
    body: '在应用里输入下面这组数字完成验证。',
    footer: '不是你申请的？忽略即可。',
  },
  password_changed_notification: {
    subject: 'Grand Tour 密码已修改',
    heading: '密码已修改',
    body: '你的登录密码刚刚被修改。',
    notice: true,
    footer: '不是你操作的？请立刻重设密码。',
  },
  email_changed_notification: {
    subject: 'Grand Tour 邮箱已变更',
    heading: '邮箱已变更',
    body: '账号绑定的邮箱地址刚刚被修改。',
    notice: true,
    footer: '不是你操作的？请立刻联系处理。',
  },
};

const FALLBACK: Copy = {
  subject: 'Grand Tour 账号通知',
  heading: '账号通知',
  body: '你的 Grand Tour 账号有一项安全设置发生了变化。',
  notice: true,
  footer: '不是你操作的？请检查账号安全。',
};

const INK = '#ece5e6';
const MUTE = '#a8969b';
const FAINT = '#83737a';
const BRASS = '#b07a63';
const WINE = '#8a5a46';
const CARD = '#2a1b21';
const EDGE = '#3d2a31';
const PAGE = '#161013';

const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function subjectFor(action: string): string {
  return (COPY[action] ?? FALLBACK).subject;
}

function render(action: string, opts: { url?: string; token?: string }): string {
  const c = COPY[action] ?? FALLBACK;
  const url = opts.url ? escape(opts.url) : '';

  // Reauthentication is the one flow that hands the user a code to type back,
  // not a link to follow.
  const codeBlock =
    action === 'reauthentication' && opts.token
      ? `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
              <tr>
                <td bgcolor="#1f1419" style="padding:16px 26px;border:1px solid ${EDGE};">
                  <span style="font-family:${SERIF};font-size:30px;letter-spacing:.22em;color:${INK};">${escape(opts.token)}</span>
                </td>
              </tr>
            </table>`
      : '';

  const button =
    c.cta && url
      ? `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td bgcolor="${WINE}" style="padding:13px 30px;">
                  <a href="${url}" style="font-family:${SANS};font-size:14px;font-weight:bold;color:#f6efec;text-decoration:none;display:inline-block;">${c.cta}</a>
                </td>
              </tr>
            </table>

            <p style="margin:28px 0 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${FAINT};">
              按钮打不开就复制这个地址：<br>
              <span style="color:${BRASS};word-break:break-all;">${url}</span>
            </p>`
      : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Grand Tour</title>
</head>
<body style="margin:0;padding:0;background-color:${PAGE};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;padding:0;background-color:${PAGE};">
  <tr>
    <td align="center" style="padding:40px 16px;">

      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${PAGE};font-size:1px;line-height:1px;">${c.body}</div>

      <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:480px;max-width:100%;background-color:${CARD};border:1px solid ${EDGE};">
        <tr>
          <td style="padding:36px 36px 32px 36px;">

            <p style="margin:0 0 28px 0;font-family:${SERIF};font-style:italic;font-size:26px;line-height:1.1;color:${INK};">Grand&nbsp;Tour</p>

            <p style="margin:0 0 14px 0;font-family:${SERIF};font-size:19px;line-height:1.45;color:${INK};">${c.heading}</p>

            <p style="margin:0 0 28px 0;font-family:${SANS};font-size:14px;line-height:1.65;color:${MUTE};">${c.body}</p>
${codeBlock}${button}

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-top:28px;border-top:1px solid ${EDGE};">
                  <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${FAINT};">${c.footer ?? ''}</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>

      <p style="margin:20px 0 0 0;font-family:${SERIF};font-style:italic;font-size:12px;color:#6b5b62;">Grand Tour</p>

    </td>
  </tr>
</table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Transport
// ---------------------------------------------------------------------------

const env = (k: string): string => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`missing secret: ${k}`);
  return v;
};

// Graph tokens last about an hour. A warm instance handling a burst of
// sign-ups would otherwise re-authenticate for every message.
let cached: { token: string; expiresAt: number } | null = null;

async function graphToken(): Promise<string> {
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const res = await fetch(
    `https://login.microsoftonline.com/${env('MS_TENANT_ID')}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env('MS_CLIENT_ID'),
        client_secret: env('MS_CLIENT_SECRET'),
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    },
  );

  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      `token request failed (${res.status}): ${json.error_description ?? json.error ?? 'unknown'}`,
    );
  }

  cached = {
    token: json.access_token,
    // 60s of slack so a token can't expire mid-send.
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  };
  return cached.token;
}

async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const sender = env('MS_SENDER');
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`,
    {
      method: 'POST',
      headers: {
        authorization: `Bearer ${await graphToken()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: 'HTML', content: html },
          toRecipients: [{ emailAddress: { address: to } }],
        },
        saveToSentItems: true,
      }),
    },
  );

  // Graph answers 202 Accepted with an empty body on success.
  if (!res.ok) {
    throw new Error(`sendMail failed (${res.status}): ${await res.text()}`);
  }
}

function confirmationUrl(d: Record<string, string>): string {
  const params = new URLSearchParams({
    token: d.token_hash,
    type: d.email_action_type,
  });
  if (d.redirect_to) params.set('redirect_to', d.redirect_to);
  return `${env('SUPABASE_URL')}/auth/v1/verify?${params.toString()}`;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.text();

    // The hook secret arrives as "v1,whsec_<base64>"; standardwebhooks wants
    // only the base64 part.
    const wh = new Webhook(env('SEND_EMAIL_HOOK_SECRET').replace('v1,whsec_', ''));
    const { user, email_data } = wh.verify(
      payload,
      Object.fromEntries(req.headers),
    ) as {
      user: { email: string };
      email_data: Record<string, string>;
    };

    const action = email_data.email_action_type;
    const html = render(action, {
      url: email_data.token_hash ? confirmationUrl(email_data) : undefined,
      token: email_data.token,
    });

    await sendMail(user.email, subjectFor(action), html);

    return new Response('{}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[send-email]', message);

    // Auth surfaces this to the caller, so keep it terse but not silent —
    // a failed send should not look like a successful sign-up.
    return new Response(
      JSON.stringify({ error: { http_code: 500, message } }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
});
