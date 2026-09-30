// PMS-ME deployment trigger 4

const SITE_URL =
  "https://pms-me-site.epoliss.workers.dev";

const PBKDF2_ITERATIONS = 100000;

function generateAnonymousName() {
  const words = [
    "catliver",
    "squirrel",
    "toenail",
    "pigeon",
    "hamster",
    "pickle",
    "waffle",
    "muffin",
    "turnip",
    "goose",
    "banjo",
    "potato",
    "meatloaf",
    "crouton",
    "picklejuice",
    "cheeseball",
    "spatula",
    "cabbage",
    "tater",
    "noodle"
  ];

  const word =
    words[Math.floor(Math.random() * words.length)];

  const number =
    Math.floor(100 + Math.random() * 900);

  return `${word}${number}`;
}

function jsonResponse(
  data,
  status = 200,
  extraHeaders = {}
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        ...extraHeaders
      }
    }
  );
}

function applyThemeControls(html) {
  const themeHead = `
<style id="pms-me-theme-styles">
html[data-theme="dark"] {
  color-scheme: dark;
}
html[data-theme="dark"] body {
  background:#181818 !important;
  color:#e8e8e8 !important;
}
html[data-theme="dark"] nav,
html[data-theme="dark"] .story,
html[data-theme="dark"] .loading,
html[data-theme="dark"] .empty,
html[data-theme="dark"] .settings,
html[data-theme="dark"] .card,
html[data-theme="dark"] .panel,
html[data-theme="dark"] form {
  background:#242424 !important;
  color:#e8e8e8 !important;
  border-color:#444 !important;
}
html[data-theme="dark"] nav button {
  color:#d8d8d8;
}
html[data-theme="dark"] .story-title,
html[data-theme="dark"] h1,
html[data-theme="dark"] h2,
html[data-theme="dark"] h3,
html[data-theme="dark"] label,
html[data-theme="dark"] strong {
  color:#f2f2f2 !important;
}
html[data-theme="dark"] .meta,
html[data-theme="dark"] .small,
html[data-theme="dark"] footer,
html[data-theme="dark"] .settings-description,
html[data-theme="dark"] .title-help {
  color:#aaa !important;
}
html[data-theme="dark"] a {
  color:#8fc7ff !important;
}
html[data-theme="dark"] .check,
html[data-theme="dark"] .check a {
  color:#f2f2f2 !important;
}
html[data-theme="dark"] .check a {
  text-decoration:underline;
  text-decoration-color:#8fc7ff;
}
html[data-theme="dark"] input,
html[data-theme="dark"] textarea,
html[data-theme="dark"] select {
  background:#303030 !important;
  color:#f2f2f2 !important;
  border-color:#555 !important;
}
html[data-theme="dark"] .reaction {
  background:#303030;
  color:#ddd;
  border-color:#555;
}
html[data-theme="dark"] .actions,
html[data-theme="dark"] .share-actions,
html[data-theme="dark"] .bottom-account-links {
  border-color:#444 !important;
}
#pmsThemeToggle {
  position:fixed;
  right:14px;
  bottom:14px;
  z-index:99999;
  width:44px;
  height:44px;
  border:1px solid #bbb;
  border-radius:50%;
  background:#fff;
  color:#222;
  padding:0;
  margin:0;
  font-size:21px;
  line-height:1;
  cursor:pointer;
  box-shadow:0 2px 8px rgba(0,0,0,.18);
  display:flex;
  align-items:center;
  justify-content:center;
}
#pmsThemeToggle:hover {
  transform:translateY(-1px);
}
html[data-theme="dark"] #pmsThemeToggle {
  background:#2d2d2d;
  color:#fff;
  border-color:#666;
}
</style>
<script>
(function(){
  try {
    var saved = localStorage.getItem('pmsme_theme');
    var theme = saved === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
</script>`;

  const themeBody = `
<button id="pmsThemeToggle" type="button" aria-label="Switch to dark mode" title="Dark mode">☾</button>
<script>
(function(){
  var button = document.getElementById('pmsThemeToggle');
  if (!button) return;

  function syncButton() {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    button.textContent = dark ? '☀' : '☾';
    button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    button.setAttribute('title', dark ? 'Light mode' : 'Dark mode');
  }

  button.addEventListener('click', function(){
    var dark = document.documentElement.getAttribute('data-theme') === 'dark';
    var next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('pmsme_theme', next);
    } catch (e) {}
    syncButton();
  });

  syncButton();
})();
</script>`;

  let output = String(html || "");

  if (/<\/head>/i.test(output)) {
    output = output.replace(/<\/head>/i, themeHead + "\n</head>");
  } else {
    output = themeHead + output;
  }

  if (/<\/body>/i.test(output)) {
    output = output.replace(/<\/body>/i, themeBody + "\n</body>");
  } else {
    output += themeBody;
  }

  return output;
}

function htmlResponse(
  html,
  status = 200,
  extraHeaders = {}
) {
  return new Response(
    applyThemeControls(html),
    {
      status,
      headers: {
        "Content-Type":
          "text/html; charset=utf-8",
        ...extraHeaders
      }
    }
  );
}

function base64UrlEncode(bytes) {
  let binary = "";
  const chunkSize = 0x8000;

  for (
    let i = 0;
    i < bytes.length;
    i += chunkSize
  ) {
    binary += String.fromCharCode(
      ...bytes.subarray(
        i,
        i + chunkSize
      )
    );
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const padded =
    value
      .replace(/-/g, "+")
      .replace(/_/g, "/") +
    "=".repeat(
      (4 - (value.length % 4)) % 4
    );

  const binary = atob(padded);
  const bytes =
    new Uint8Array(binary.length);

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes;
}

function randomToken() {
  const bytes =
    new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return base64UrlEncode(bytes);
}

async function sha256(value) {
  const data =
    new TextEncoder().encode(value);

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return base64UrlEncode(
    new Uint8Array(digest)
  );
}

async function hmacSign(
  value,
  secret
) {
  const keyData =
    new TextEncoder().encode(secret);

  const key =
    await crypto.subtle.importKey(
      "raw",
      keyData,
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(value)
    );

  return base64UrlEncode(
    new Uint8Array(signature)
  );
}

async function hashPassword(password) {
  const salt =
    new Uint8Array(16);

  crypto.getRandomValues(salt);

  const key =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      {
        name: "PBKDF2"
      },
      false,
      ["deriveBits"]
    );

  const bits =
    await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256"
      },
      key,
      256
    );

  return [
    "pbkdf2",
    PBKDF2_ITERATIONS,
    base64UrlEncode(salt),
    base64UrlEncode(
      new Uint8Array(bits)
    )
  ].join("$");
}

async function verifyPassword(
  password,
  stored
) {
  try {
    const parts =
      stored.split("$");

    if (
      parts.length !== 4 ||
      parts[0] !== "pbkdf2"
    ) {
      return false;
    }

    const iterations =
      Number(parts[1]);

    const salt =
      base64UrlDecode(parts[2]);

    const expected =
      base64UrlDecode(parts[3]);

    const key =
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        {
          name: "PBKDF2"
        },
        false,
        ["deriveBits"]
      );

    const bits =
      await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt,
          iterations,
          hash: "SHA-256"
        },
        key,
        256
      );

    const actual =
      new Uint8Array(bits);

    if (
      actual.length !==
      expected.length
    ) {
      return false;
    }

    let difference = 0;

    for (
      let i = 0;
      i < actual.length;
      i++
    ) {
      difference |=
        actual[i] ^ expected[i];
    }

    return difference === 0;
  } catch {
    return false;
  }
}

async function createModeratorSession(env) {
  const expiresAt =
    Date.now() +
    8 * 60 * 60 * 1000;

  const payload =
    base64UrlEncode(
      new TextEncoder().encode(
        String(expiresAt)
      )
    );

  const signature =
    await hmacSign(
      payload,
      env.MODERATOR_SESS_SEC
    );

  return `${payload}.${signature}`;
}

async function isModeratorAuthenticated(
  request,
  env
) {
  if (!env.MODERATOR_SESS_SEC) {
    return false;
  }

  const cookieHeader =
    request.headers.get("Cookie") || "";

  const match =
    cookieHeader.match(
      /(?:^|;\s*)pms_me_moderator=([^;]+)/
    );

  if (!match) {
    return false;
  }

  const token = match[1];

  const parts =
    token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [
    payload,
    suppliedSignature
  ] = parts;

  let expectedSignature;

  try {
    expectedSignature =
      await hmacSign(
        payload,
        env.MODERATOR_SESS_SEC
      );
  } catch {
    return false;
  }

  if (
    expectedSignature !==
    suppliedSignature
  ) {
    return false;
  }

  let expiresAt;

  try {
    expiresAt =
      Number(
        new TextDecoder().decode(
          base64UrlDecode(payload)
        )
      );
  } catch {
    return false;
  }

  if (!Number.isFinite(expiresAt)) {
    return false;
  }

  return Date.now() < expiresAt;
}

function unauthorizedResponse() {
  return jsonResponse(
    { error: "Unauthorized" },
    401,
    {
      "Cache-Control": "no-store"
    }
  );
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function validEmail(email) {
  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  );
}

function accountCookie(token) {
  return (
    `pms_me_session=${token}; ` +
    "Path=/; " +
    "HttpOnly; " +
    "Secure; " +
    "SameSite=Lax; " +
    "Max-Age=2592000"
  );
}

function clearAccountCookie() {
  return (
    "pms_me_session=; " +
    "Path=/; " +
    "HttpOnly; " +
    "Secure; " +
    "SameSite=Lax; " +
    "Max-Age=0"
  );
}

async function createUserSession(
  env,
  userId
) {
  const token =
    randomToken();

  const tokenHash =
    await sha256(token);

  const expires =
    new Date(
      Date.now() +
        30 * 24 * 60 * 60 * 1000
    ).toISOString();

  await env.pms_me_db
    .prepare(
      `INSERT INTO user_sessions
       (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`
    )
    .bind(
      userId,
      tokenHash,
      expires
    )
    .run();

  return token;
}

async function getCurrentUser(
  request,
  env
) {
  const cookieHeader =
    request.headers.get("Cookie") || "";

  const match =
    cookieHeader.match(
      /(?:^|;\s*)pms_me_session=([^;]+)/
    );

  if (!match) {
    return null;
  }

  const token = match[1];

  const tokenHash =
    await sha256(token);

  const user =
    await env.pms_me_db
      .prepare(
        `SELECT
           u.id,
           u.email,
           u.notification_email,
           u.email_verified,
           u.story_frequency,
           u.sponsor_emails,
           u.rss_enabled,
           u.unsubscribe_token,
           u.rss_token,
           u.created_at,
           s.expires_at
         FROM user_sessions s
         JOIN users u
           ON u.id = s.user_id
         WHERE s.token_hash = ?
           AND s.expires_at > CURRENT_TIMESTAMP`
      )
      .bind(tokenHash)
      .first();

  return user || null;
}

async function sendEmail(
  env,
  to,
  subject,
  text,
  html = null
) {
  if (!env.RESEND_API_KEY) {
    throw new Error(
      "RESEND_API_KEY is missing"
    );
  }

  const emailBody = {
    from:
      "HOA-PMS <accounts@hoapms.com>",
    to: [to],
    subject,
    text
  };

  if (html) {
    emailBody.html = html;
  }

  const response =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          "Authorization":
            `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type":
            "application/json"
        },
        body:
          JSON.stringify(emailBody)
      }
    );

  if (!response.ok) {
    const body =
      await response.text();

    throw new Error(
      `Email sending failed: ${body}`
    );
  }

  return response.json();
}

function accountLink(path) {
  return `${SITE_URL}${path}`;
}

function storyLink(id) {
  return (
    `${SITE_URL}/?story=${encodeURIComponent(id)}`
  );
}

function makeStoryHeading(story) {
  const title =
    story.title ||
    "HOA-PMS Story";

  const category =
    story.category ||
    "";

  const city =
    story.city ||
    "";

  const publicName =
    story.public_name ||
    "Anonymous";

  const pieces = [
    title
  ];

  if (category) {
    pieces.push(category);
  }

  if (city) {
    pieces.push(city);
  }

  if (publicName) {
    pieces.push(publicName);
  }

  return (
    `${pieces[0]}: ` +
    pieces.slice(1).join(", ")
  );
}

function makeTeaser(
  storyText,
  maxLength = 180
) {
  const clean =
    String(storyText || "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

  if (clean.length <= maxLength) {
    return clean;
  }

  let teaser =
    clean.slice(
      0,
      maxLength
    );

  const lastSpace =
    teaser.lastIndexOf(" ");

  if (lastSpace > 80) {
    teaser =
      teaser.slice(
        0,
        lastSpace
      );
  }

  return `${teaser}....`;
}

function storyEmailText(story) {
  const heading =
    makeStoryHeading(story);

  const teaser =
    makeTeaser(story.story);

  return (
    `${heading}\n\n` +
    `${teaser}\n\n` +
    `Read the full story on HOA-PMS:\n` +
    `${storyLink(story.id)}\n\n` +
    `Change account settings:\n` +
    `${accountLink("/account")}\n\n` +
    `Unsubscribe from HOA-PMS account emails:\n` +
    `${accountLink(
      `/unsubscribe?token=${encodeURIComponent(
        story._unsubscribeToken || ""
      )}`
    )}`
  );
}

function storyEmailHtml(
  story,
  unsubscribeToken
) {
  const heading =
    escapeHtml(
      makeStoryHeading(story)
    );

  const teaser =
    escapeHtml(
      makeTeaser(story.story)
    );

  const fullStoryUrl =
    escapeHtml(
      storyLink(story.id)
    );

  const settingsUrl =
    escapeHtml(
      accountLink("/account")
    );

  const unsubscribeUrl =
    escapeHtml(
      accountLink(
        `/unsubscribe?token=${encodeURIComponent(
          unsubscribeToken
        )}`
      )
    );

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1">
</head>

<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#222;">

<div style="padding:30px 15px;background:#f4f4f4;">

<div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #ddd;padding:32px 36px;">

<h2 style="margin:0 0 20px 0;font-size:22px;line-height:1.35;">
${heading}
</h2>

<p style="font-size:16px;line-height:1.6;margin:0 0 24px 0;">
${teaser}
</p>

<p style="margin:0 0 28px 0;">
<a href="${fullStoryUrl}"
   style="display:inline-block;padding:12px 18px;background:#222;color:#fff;text-decoration:none;border-radius:5px;">
Read the Full Story
</a>
</p>

<p style="font-size:12px;line-height:1.5;margin:0;color:#777;">
<a href="${settingsUrl}" style="color:#777;">Change account settings</a>
</p>

</div>

</div>

</body>
</html>`;
}

async function sendNewStoryNotification(
  env,
  story
) {
  const settings =
    await env.pms_me_db
      .prepare(
        `SELECT
           email,
           frequency,
           last_digest_at
         FROM notification_settings
         WHERE id = 1`
      )
      .first();

  if (
    !settings ||
    !settings.email
  ) {
    return;
  }

  if (
    settings.frequency !==
    "immediately"
  ) {
    return;
  }

  const subject =
    "HOA-PMS — New Story Submitted";

  const text =
`A new story has been submitted to HOA-PMS.

Title: ${story.title || "(not provided)"}

City: ${story.city || "(not provided)"}

Category: ${story.category}

Display Name: ${
  story.display_name ||
  "(not provided)"
}

Anonymous Requested: ${
  story.anonymous_requested
    ? "Yes"
    : "No"
}

Story:

${story.story}

Review it in the moderator dashboard:

${SITE_URL}/moderate.html`;

  await sendEmail(
    env,
    settings.email,
    subject,
    text
  );
}

async function sendRejectionEmail(
  env,
  story,
  reason
) {
  if (!story.email) {
    return;
  }

  const subject =
    "HOA-PMS — Story Submission Update";

  const greetingName =
    story.display_name ||
    "there";

  const safeGreetingName =
    escapeHtml(greetingName);

  const safeModeratorNotes =
    escapeHtml(
      reason ||
        "The submission did not meet the site's submission guidelines."
    );

  const safeStory =
    escapeHtml(story.story);

  const safeTitle =
    escapeHtml(
      story.title ||
        "(not provided)"
    );

  const safeCity =
    escapeHtml(
      story.city ||
        "(not provided)"
    );

  const safeCategory =
    escapeHtml(
      story.category
    );

  const text =
`Hello ${greetingName},

Thank you for submitting your story to HOA-PMS.
After review, your submission was not approved for publication.

Title: ${
  story.title ||
  "(not provided)"
}

City: ${
  story.city ||
  "(not provided)"
}

Category: ${story.category}

MODERATOR'S COMMENT:

${
  reason ||
  "The submission did not meet the site's submission guidelines."
}

YOUR SUBMITTED STORY:

${story.story}

Thank you,

HOA-PMS`;

  const html =
`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1">
</head>

<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#222;">

<div style="margin:0;padding:30px 15px;background:#f4f4f4;">

<div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #ddd;padding:32px 36px;">

<p style="font-size:16px;margin:0 0 22px 0;">
Hello ${safeGreetingName},
</p>

<p style="font-size:16px;line-height:1.6;margin:0 0 22px 0;">
Thank you for submitting your story to HOA-PMS.
After review, your submission was not approved for publication.
</p>

<table style="width:100%;border-collapse:collapse;margin:0 0 25px 0;font-size:15px;">

<tr>
<td style="padding:7px 10px 7px 0;font-weight:bold;width:90px;vertical-align:top;">
Title:
</td>
<td style="padding:7px 0;">
${safeTitle}
</td>
</tr>

<tr>
<td style="padding:7px 10px 7px 0;font-weight:bold;vertical-align:top;">
City:
</td>
<td style="padding:7px 0;">
${safeCity}
</td>
</tr>

<tr>
<td style="padding:7px 10px 7px 0;font-weight:bold;vertical-align:top;">
Category:
</td>
<td style="padding:7px 0;">
${safeCategory}
</td>
</tr>

</table>

<p style="font-size:15px;font-weight:bold;margin:0 0 8px 0;">
MODERATOR'S COMMENT:
</p>

<div style="margin:0 0 25px 0;padding:15px 18px;background:#f3f3f3;border-left:4px solid #999;font-family:Georgia,serif;font-size:15px;line-height:1.6;white-space:pre-wrap;">
${safeModeratorNotes}
</div>

<p style="font-size:15px;font-weight:bold;margin:0 0 8px 0;">
YOUR SUBMITTED STORY:
</p>

<div style="margin:0 0 25px 0;padding:15px 18px;background:#f3f3f3;border-left:4px solid #999;font-family:Georgia,serif;font-size:15px;line-height:1.6;white-space:pre-wrap;">
${safeStory}
</div>

<p style="font-size:16px;line-height:1.6;margin:0;">
Thank you,<br>
<strong>HOA-PMS</strong>
</p>

</div>

</div>

</body>
</html>`;

  await sendEmail(
    env,
    story.email,
    subject,
    text,
    html
  );
}

async function sendVerificationEmail(
  env,
  email,
  token
) {
  const url =
    accountLink(
      `/verify-email?token=${encodeURIComponent(
        token
      )}`
    );

  const text =
`Welcome to HOA-PMS.

Please verify your email address by opening this link:

${url}

After verification, your HOA-PMS account will be ready.

If you did not create this account, you can ignore this email.`;

  const html =
`<!doctype html>
<html>
<body style="margin:0;padding:30px;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">

<div style="max-width:650px;margin:auto;background:#fff;border:1px solid #ddd;padding:32px;">

<h2>Welcome to HOA-PMS</h2>

<p>Please verify your email address to activate your account.</p>

<p>
<a href="${escapeHtml(url)}"
style="display:inline-block;padding:12px 18px;background:#222;color:#fff;text-decoration:none;border-radius:5px;">
Verify My Email
</a>
</p>

<p style="font-size:13px;color:#666;">
If you did not create this account, you can ignore this email.
</p>

</div>

</body>
</html>`;

  await sendEmail(
    env,
    email,
    "HOA-PMS — Verify Your Email",
    text,
    html
  );
}

async function sendPasswordResetEmail(
  env,
  email,
  token
) {
  const url =
    accountLink(
      `/reset-password?token=${encodeURIComponent(
        token
      )}`
    );

  const text =
`A password reset was requested for your HOA-PMS account.

Reset your password here:

${url}

This link expires in one hour.

If you did not request this, you can ignore this email.`;

  await sendEmail(
    env,
    email,
    "HOA-PMS — Password Reset",
    text
  );
}

async function sendImmediatePublishedStoryEmail(
  env,
  user,
  story
) {
  const subject =
    `HOA-PMS — ${makeStoryHeading(
      story
    )}`;

  const text =
`A new HOA-PMS story has been published.

${makeStoryHeading(story)}

${makeTeaser(story.story)}

Read the full story:

${storyLink(story.id)}

Change account settings:

${accountLink("/account")}

Unsubscribe from HOA-PMS account emails:

${accountLink(
  `/unsubscribe?token=${encodeURIComponent(
    user.unsubscribe_token
  )}`
)}`;

  const html =
    storyEmailHtml(
      story,
      user.unsubscribe_token
    );

  await sendEmail(
    env,
    user.delivery_email || user.email,
    subject,
    text,
    html
  );

  await env.pms_me_db
    .prepare(
      `INSERT INTO email_deliveries
       (user_id, story_id, email_type)
       VALUES (?, ?, 'immediate')`
    )
    .bind(
      user.id,
      story.id
    )
    .run();
}
async function sendPublishedStoryNotifications(
  env,
  story
) {
  const users =
    await env.pms_me_db
      .prepare(
        `SELECT
           id,
           email,
           COALESCE(notification_email, email) AS delivery_email,
           story_frequency,
           unsubscribe_token
         FROM users
         WHERE email_verified = 1
           AND story_frequency = 'immediate'`
      )
      .all();

  if (
    !users.results ||
    users.results.length === 0
  ) {
    return;
  }

  for (
    const user of users.results
  ) {
    try {
      const alreadySent =
        await env.pms_me_db
          .prepare(
            `SELECT id
             FROM email_deliveries
             WHERE user_id = ?
               AND story_id = ?
               AND email_type = 'immediate'
             LIMIT 1`
          )
          .bind(
            user.id,
            story.id
          )
          .first();

      if (alreadySent) {
        continue;
      }

      await sendImmediatePublishedStoryEmail(
        env,
        user,
        story
      );
    } catch (error) {
      console.error(
        "Published story email failed:",
        user.email,
        error
      );
    }
  }
}

async function sendWeeklyDigests(
  env
) {
  const users =
    await env.pms_me_db
      .prepare(
        `SELECT
           id,
           email,
           COALESCE(notification_email, email) AS delivery_email,
           story_frequency,
           unsubscribe_token
         FROM users
         WHERE email_verified = 1
           AND story_frequency = 'weekly'`
      )
      .all();

  if (
    !users.results ||
    users.results.length === 0
  ) {
    return;
  }

  const stories =
    await env.pms_me_db
      .prepare(
        `SELECT
           id,
           title,
           city,
           story,
           category,
           public_name,
           published_at
         FROM stories
         WHERE status = 'published'
           AND published_at IS NOT NULL
           AND published_at >= datetime(
             'now',
             '-7 days'
           )
         ORDER BY published_at DESC`
      )
      .all();

  if (
    !stories.results ||
    stories.results.length === 0
  ) {
    return;
  }

  for (
    const user of users.results
  ) {
    try {
      const recentDigest =
        await env.pms_me_db
          .prepare(
            `SELECT id
             FROM email_deliveries
             WHERE user_id = ?
               AND email_type = 'weekly_digest'
               AND sent_at >= datetime(
                 'now',
                 '-7 days'
               )
             LIMIT 1`
          )
          .bind(user.id)
          .first();

      if (recentDigest) {
        continue;
      }

      const blocks = [];

      for (
        const story of stories.results
      ) {
        blocks.push(
          `${makeStoryHeading(story)}\n\n` +
          `${makeTeaser(story.story)}\n\n` +
          `Read the full story:\n` +
          `${storyLink(story.id)}`
        );
      }

      const text =
`Here are the latest stories published on HOA-PMS.

${blocks.join(
  "\n\n------------------------------\n\n"
)}

Change account settings:

${accountLink("/account")}

Unsubscribe from HOA-PMS account emails:

${accountLink(
  `/unsubscribe?token=${encodeURIComponent(
    user.unsubscribe_token
  )}`
)}`;

      const digestHtml =
`<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#222;">
<div style="padding:30px 15px;">
<div style="max-width:680px;margin:0 auto;background:#fff;border:1px solid #ddd;padding:32px 36px;">
<h2 style="margin-top:0;">HOA-PMS — Weekly Story Digest</h2>
${stories.results.map(story => `
<div style="margin:0 0 28px 0;padding-bottom:24px;border-bottom:1px solid #ddd;">
<h3 style="margin:0 0 10px 0;">${escapeHtml(makeStoryHeading(story))}</h3>
<p style="font-size:15px;line-height:1.55;">${escapeHtml(makeTeaser(story.story))}</p>
<a href="${escapeHtml(storyLink(story.id))}">Read the full story</a>
</div>`).join("")}
<p style="font-size:12px;line-height:1.5;margin:24px 0 0;color:#777;">
<a href="${escapeHtml(accountLink("/account"))}" style="color:#777;">Change account settings</a>
</p>
</div>
</div>
</body>
</html>`;

      await sendEmail(
        env,
        user.delivery_email || user.email,
        "HOA-PMS — Weekly Story Digest",
        text,
        digestHtml
      );

      await env.pms_me_db
        .prepare(
          `INSERT INTO email_deliveries
           (user_id, story_id, email_type)
           VALUES (?, NULL, 'weekly_digest')`
        )
        .bind(user.id)
        .run();
    } catch (error) {
      console.error(
        "Weekly digest failed:",
        user.email,
        error
      );
    }
  }
}

async function sendDailyDigest(
  env
) {
  const settings =
    await env.pms_me_db
      .prepare(
        `SELECT
           email,
           frequency,
           last_digest_at
         FROM notification_settings
         WHERE id = 1`
      )
      .first();

  if (
    !settings ||
    !settings.email ||
    settings.frequency !== "daily"
  ) {
    return;
  }

  const stories =
    await env.pms_me_db
      .prepare(
        `SELECT
           id,
           title,
           city,
           story,
           category,
           display_name,
           anonymous_requested,
           created_at
         FROM stories
         WHERE status = 'pending'
         ORDER BY created_at ASC`
      )
      .all();

  if (
    !stories.results ||
    stories.results.length === 0
  ) {
    return;
  }

  const lines = [];

  lines.push(
    "The following HOA-PMS stories are awaiting moderation."
  );

  lines.push("");

  for (
    const story of stories.results
  ) {
    lines.push(
      `ID: ${story.id}`
    );

    lines.push(
      `Title: ${
        story.title ||
        "(not provided)"
      }`
    );

    lines.push(
      `City: ${
        story.city ||
        "(not provided)"
      }`
    );

    lines.push(
      `Category: ${story.category}`
    );

    lines.push(
      `Display Name: ${
        story.display_name ||
        "(not provided)"
      }`
    );

    lines.push(
      `Anonymous Requested: ${
        story.anonymous_requested
          ? "Yes"
          : "No"
      }`
    );

    lines.push("");

    lines.push(story.story);

    lines.push("");

    lines.push(
      "------------------------------"
    );

    lines.push("");
  }

  lines.push(
    "Moderator dashboard:"
  );

  lines.push(
    `${SITE_URL}/moderate.html`
  );

  await sendEmail(
    env,
    settings.email,
    "HOA-PMS — Daily Story Digest",
    lines.join("\n")
  );

  await env.pms_me_db
    .prepare(
      `UPDATE notification_settings
       SET last_digest_at =
         CURRENT_TIMESTAMP
       WHERE id = 1`
    )
    .run();
}

function moderatorLoginPage() {
  return htmlResponse(
`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1">
<title>PMS-ME — Moderator Login</title>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f4f4;
  font-family: Arial, Helvetica, sans-serif;
  color: #222;
}

.login-box {
  width: min(420px, calc(100% - 32px));
  background: white;
  padding: 32px;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0,0,0,.12);
}

h1 {
  margin: 0 0 10px;
  font-size: 28px;
}

p {
  margin: 0 0 24px;
  color: #666;
  line-height: 1.5;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
}

input {
  width: 100%;
  padding: 12px;
  border: 1px solid #bbb;
  border-radius: 6px;
  font-size: 16px;
  margin-bottom: 16px;
}

button {
  width: 100%;
  padding: 12px;
  border: 0;
  border-radius: 6px;
  background: #222;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

button:hover {
  background: #444;
}

#error {
  display: none;
  margin-bottom: 16px;
  padding: 10px;
  border-radius: 6px;
  background: #fbe9e7;
  color: #b71c1c;
}
</style>
</head>

<body>

<div class="login-box">

<h1>Moderator Login</h1>

<p>
Enter the moderator password to access the PMS-ME moderation dashboard.
</p>

<div id="error"></div>

<form id="loginForm">

<label for="password">
Password
</label>

<input
  id="password"
  name="password"
  type="password"
  autocomplete="current-password"
  required
  autofocus
>

<button type="submit">
Log In
</button>

</form>

</div>

<script>
const form =
  document.getElementById("loginForm");

const password =
  document.getElementById("password");

const error =
  document.getElementById("error");

form.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    error.style.display = "none";

    try {
      const response =
        await fetch(
          "/api/moderator-login",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            credentials:
              "same-origin",
            body:
              JSON.stringify({
                password:
                  password.value
              })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        error.textContent =
          data.error ||
          "Login failed.";

        error.style.display =
          "block";

        password.select();

        return;
      }

      window.location.href =
        "/moderate.html";

    } catch (err) {
      error.textContent =
        "Unable to contact the server.";

      error.style.display =
        "block";
    }
  }
);
</script>

</body>
</html>`,
    401,
    {
      "Cache-Control":
        "no-store"
    }
  );
}

function accountPage(
  user
) {
  const verified = !!user.email_verified;
  const notificationEmail =
    user.notification_email ||
    user.email;

  return htmlResponse(
`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>HOA-PMS — Account Settings</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#f4f4f4;color:#222;font-family:Arial,Helvetica,sans-serif}
header{background:#fff;border-bottom:1px solid #ddd;padding:24px 15px;text-align:center}
.logo{font-size:38px;font-weight:900;letter-spacing:-2px}
.container{width:min(680px,calc(100% - 30px));margin:30px auto}
.card{background:#fff;border:1px solid #ddd;padding:28px;margin-bottom:20px}
h1{margin-top:0} h2{font-size:20px;margin:28px 0 8px}
label{display:block;margin:14px 0 7px;font-weight:bold}
input,select{width:100%;padding:11px;border:1px solid #bbb;border-radius:5px;font-size:16px;background:#fff}
button{margin-top:20px;padding:11px 18px;border:0;border-radius:5px;background:#222;color:#fff;cursor:pointer}
button.secondary{background:#777}
.notice{padding:12px;background:#f5f5f5;border-left:4px solid #777;margin-bottom:20px}
.success{color:#176b2c}.error{color:#b71c1c}
a{color:#222}.small{color:#666;font-size:14px;line-height:1.5}.username{padding:11px;background:#f3f3f3;border:1px solid #ddd;border-radius:5px;overflow-wrap:anywhere}
.danger{border-top:1px solid #ddd;margin-top:28px;padding-top:22px}
.danger a{color:#8b0000}
</style>
</head>
<body>
<header><a href="/" style="color:inherit;text-decoration:none;"><div class="logo">HOA-PMS</div></a></header>
<div class="container">
<div class="card">
<h1>Account Settings</h1>
${!verified ? '<div class="notice">Your account email has not yet been verified.</div>' : ''}
<div id="message"></div>

<h2>Login Email</h2>
<p class="small">This is your account username and cannot be changed.</p>
<div class="username">${escapeHtml(user.email)}</div>

<h2>Notification Email</h2>
<p class="small">HOA-PMS story notifications will be sent here. Changing this does not change your login email.</p>
<label for="notificationEmail">Email address for notifications</label>
<input id="notificationEmail" type="email" value="${escapeHtml(notificationEmail)}" autocomplete="email">

<h2>Notification Preferences</h2>
<label for="frequency">Story notifications</label>
<select id="frequency">
<option value="weekly" ${user.story_frequency === "weekly" ? "selected" : ""}>Weekly Digest</option>
<option value="immediate" ${user.story_frequency === "immediate" ? "selected" : ""}>Individual Post — email me when each story is published</option>
<option value="off" ${user.story_frequency === "off" ? "selected" : ""}>No Emails</option>
</select>

<button id="saveButton" type="button">Save Account Settings</button>

<h2>Password</h2>
<p class="small">Change your account password using the secure password-reset process.</p>
<a href="/forgot-password">Change Password</a>

<div class="danger">
<a href="#" id="closeAccountLink">Delete Account</a>
<p class="small">Deleting your account removes your login, settings and account email records. Stories you submitted are not deleted.</p>
</div>

<button id="logoutButton" class="secondary" type="button">Log Out</button>
</div>
</div>
<script>
const frequency=document.getElementById("frequency");
const notificationEmail=document.getElementById("notificationEmail");
const saveButton=document.getElementById("saveButton");
const logoutButton=document.getElementById("logoutButton");
const closeAccountLink=document.getElementById("closeAccountLink");
const message=document.getElementById("message");

saveButton.addEventListener("click",async()=>{
  message.className="";
  message.textContent="Saving...";
  try{
    const response=await fetch("/api/account/preferences",{
      method:"PUT",
      headers:{"Content-Type":"application/json"},
      credentials:"same-origin",
      body:JSON.stringify({
        frequency:frequency.value,
        notification_email:notificationEmail.value
      })
    });
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||"Unable to save account settings.");
    notificationEmail.value=data.notification_email;
    message.className="success";
    message.textContent="Your account settings have been saved.";
  }catch(error){
    message.className="error";
    message.textContent=error.message;
  }
});

logoutButton.addEventListener("click",async()=>{
  await fetch("/api/account/logout",{method:"POST",credentials:"same-origin"});
  window.location.href="/";
});

closeAccountLink.addEventListener("click",async(event)=>{
  event.preventDefault();
  if(!window.confirm("Permanently delete your HOA-PMS account? This cannot be undone. Published or submitted stories will not be deleted.")) return;
  try{
    const response=await fetch("/api/account",{method:"DELETE",credentials:"same-origin"});
    const data=await response.json();
    if(!response.ok) throw new Error(data.error||"Unable to delete account.");
    window.location.href="/";
  }catch(error){
    message.className="error";
    message.textContent=error.message;
  }
});
</script>
</body>
</html>`,
    200,
    {"Cache-Control":"no-store"}
  );
}

function registerPage() {
  return htmlResponse(
`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1">
<title>PMS-ME — Create Account</title>

<style>
* {
  box-sizing:border-box;
}

body {
  margin:0;
  background:#f4f4f4;
  font-family:Arial,Helvetica,sans-serif;
  color:#222;
}

header {
  background:#fff;
  border-bottom:1px solid #ddd;
  padding:24px;
  text-align:center;
}

.logo {
  font-size:38px;
  font-weight:900;
  letter-spacing:-2px;
}

.container {
  width:min(520px,calc(100% - 30px));
  margin:30px auto;
}

.card {
  background:#fff;
  border:1px solid #ddd;
  padding:28px;
}

h1 {
  margin-top:0;
}

label {
  display:block;
  margin:15px 0 7px;
  font-weight:bold;
}

input[type=email],
input[type=password],
input[type=text] {
  width:100%;
  padding:11px;
  border:1px solid #bbb;
  border-radius:5px;
  font-size:16px;
}

.password-wrap {
  position:relative;
}

.password-wrap input {
  padding-right:46px;
}

.password-toggle {
  position:absolute;
  right:1px;
  top:1px;
  bottom:1px;
  z-index:2;
  width:44px;
  margin:0;
  padding:0;
  border:0;
  border-radius:0 5px 5px 0;
  background:transparent;
  color:#555;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
}

.password-toggle:hover {
  background:transparent;
  color:#000;
}

.password-toggle svg {
  width:22px;
  height:22px;
  fill:none;
  stroke:currentColor;
  stroke-width:2;
  stroke-linecap:round;
  stroke-linejoin:round;
}

.check {
  font-weight:normal;
  line-height:1.5;
}

button:not(.password-toggle) {
  width:100%;
  margin-top:20px;
  padding:13px 16px;
  border:0;
  border-radius:8px;
  background:#222;
  color:#fff;
  font-size:16px;
  font-weight:700;
  cursor:pointer;
  cursor:pointer;
}

.account-switch {
  margin-top:22px;
  padding-top:20px;
  border-top:1px solid #e1e1e1;
  text-align:center;
  color:#666;
  font-size:14px;
}

.account-switch .secondary-action {
  display:block;
  width:100%;
  margin-top:10px;
  padding:11px 14px;
  border:1px solid #bbb;
  border-radius:8px;
  background:#fff;
  color:#222;
  text-decoration:none;
  font-weight:700;
}

.account-switch .secondary-action:hover {
  background:#f1f1f1;
  border-color:#999;
}

.quiet-link {
  text-align:center;
  margin:16px 0 0;
  font-size:14px;
}

#error {
  display:none;
  color:#b71c1c;
  margin-bottom:15px;
}

.small {
  color:#666;
  font-size:14px;
  line-height:1.5;
}

a {
  color:#222;
}
</style>
</head>

<body>

<header>
<a href="/"
style="color:inherit;text-decoration:none;">
<div class="logo">PMS-ME</div>
</a>
</header>

<div class="container">

<div class="card">

<h1>Create Your PMS-ME Account</h1>

<p>
Create an account to receive updates when new stories are published.
</p>

<div id="error"></div>

<form id="registerForm">

<label for="email">
Email Address
</label>

<input
  id="email"
  type="email"
  autocomplete="email"
  required
>

<label for="password">
Password
</label>

<div class="password-wrap">
<input
  id="password"
  type="password"
  autocomplete="new-password"
  minlength="8"
  required
>
<button type="button" class="password-toggle" data-target="password" aria-label="Show password" title="Show password">
<svg class="eye-open" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
<svg class="eye-closed" viewBox="0 0 24 24" aria-hidden="true" style="display:none"><path d="M3 3l18 18"></path><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path><path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.1 3.2"></path><path d="M6.6 6.6C3.5 8.7 2 12 2 12s3.5 8 10 8a10.5 10.5 0 0 0 4.1-.8"></path></svg>
</button>
</div>

<label for="confirmPassword">
Confirm Password
</label>

<div class="password-wrap">
<input
  id="confirmPassword"
  type="password"
  autocomplete="new-password"
  minlength="8"
  required
>
<button type="button" class="password-toggle" data-target="confirmPassword" aria-label="Show password" title="Show password">
<svg class="eye-open" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
<svg class="eye-closed" viewBox="0 0 24 24" aria-hidden="true" style="display:none"><path d="M3 3l18 18"></path><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path><path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.1 3.2"></path><path d="M6.6 6.6C3.5 8.7 2 12 2 12s3.5 8 10 8a10.5 10.5 0 0 0 4.1-.8"></path></svg>
</button>
</div>

<label class="check">
<input
  id="terms"
  type="checkbox"
  required
>
I agree to the
<a href="/terms-of-service.pdf"
target="_blank">
PMS-ME Terms of Service
</a>.
</label>

<button type="submit">
Create Account
</button>

</form>

<div class="account-switch">
  <div>Already have an account?</div>
  <a class="secondary-action" href="/login">
    Log In
  </a>
</div>

</div>

</div>

<script>
const eyeOpenIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12"></path>' +
  '<circle cx="12" cy="12" r="3"></circle>' +
  '</svg>';

const eyeClosedIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M3 3l18 18"></path>' +
  '<path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>' +
  '<path d="M9.9 4.2A11.4 11.4 0 0 1 12 4c6.5 0 10 8 10 8a18.4 18.4 0 0 1-2.1 3.2"></path>' +
  '<path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 8 10 8a10 10 0 0 0 5.4-1.6"></path>' +
  '</svg>';

document
  .querySelectorAll(
    ".password-toggle"
  )
  .forEach((toggle) => {
    toggle.addEventListener(
      "click",
      () => {
        const input =
          document.getElementById(
            toggle.dataset.target
          );

        const showing =
          input.type === "text";

        input.type =
          showing
            ? "password"
            : "text";

        toggle.querySelector(
          ".eye-open"
        ).style.display =
          showing ? "" : "none";

        toggle.querySelector(
          ".eye-closed"
        ).style.display =
          showing ? "none" : "";

        toggle.setAttribute(
          "aria-label",
          showing
            ? "Show password"
            : "Hide password"
        );

        toggle.title =
          showing
            ? "Show password"
            : "Hide password";
      }
    );
  });

const form =
  document.getElementById(
    "registerForm"
  );

const error =
  document.getElementById(
    "error"
  );

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    error.style.display =
      "none";

    const password =
      document.getElementById(
        "password"
      ).value;

    const confirmPassword =
      document.getElementById(
        "confirmPassword"
      ).value;

    if (
      password !==
      confirmPassword
    ) {
      error.textContent =
        "The passwords do not match.";

      error.style.display =
        "block";

      return;
    }

    try {

      const response =
        await fetch(
          "/api/account/register",
          {
            method:"POST",
            headers:{
              "Content-Type":
                "application/json"
            },
            body:
              JSON.stringify({
                email:
                  document.getElementById(
                    "email"
                  ).value,
                password,
                terms_accepted:
                  document.getElementById(
                    "terms"
                  ).checked
              })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Unable to create account."
        );
      }

      document.querySelector(
        ".card"
      ).innerHTML =
        "<h1>Check Your Email</h1>" +
        "<p>Your PMS-ME account has been created.</p>" +
        "<p>We sent a verification link to <strong>" +
        data.email +
        "</strong>.</p>" +
        "<p>Please verify your email address before using your account.</p>" +
        "<p><a href='/login'>Go to Login</a></p>";

    } catch (err) {

      error.textContent =
        err.message;

      error.style.display =
        "block";
    }
  }
);
</script>

</body>
</html>`,
    200,
    {
      "Cache-Control":
        "no-store"
    }
  );
}

function loginPage() {
  return htmlResponse(
`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1">
<title>PMS-ME — Log In</title>

<style>
* {
  box-sizing:border-box;
}

body {
  margin:0;
  background:#f4f4f4;
  font-family:Arial,Helvetica,sans-serif;
  color:#222;
}

header {
  background:#fff;
  border-bottom:1px solid #ddd;
  padding:24px;
  text-align:center;
}

.logo {
  font-size:38px;
  font-weight:900;
  letter-spacing:-2px;
}

.container {
  width:min(480px,calc(100% - 30px));
  margin:30px auto;
}

.card {
  background:#fff;
  border:1px solid #ddd;
  padding:28px;
}

h1 {
  margin-top:0;
}

label {
  display:block;
  margin:15px 0 7px;
  font-weight:bold;
}

input {
  width:100%;
  padding:11px;
  border:1px solid #bbb;
  border-radius:5px;
  font-size:16px;
}

.password-wrap {
  position:relative;
}

.password-wrap input {
  padding-right:46px;
}

.password-toggle {
  position:absolute;
  right:1px;
  top:1px;
  bottom:1px;
  z-index:2;
  width:44px;
  margin:0;
  padding:0;
  border:0;
  border-radius:0 5px 5px 0;
  background:transparent;
  color:#555;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
}

.password-toggle:hover {
  background:transparent;
  color:#000;
}

.password-toggle svg {
  width:22px;
  height:22px;
  fill:none;
  stroke:currentColor;
  stroke-width:2;
  stroke-linecap:round;
  stroke-linejoin:round;
}

button:not(.password-toggle) {
  width:100%;
  margin-top:20px;
  padding:13px 16px;
  border:0;
  border-radius:8px;
  background:#222;
  color:#fff;
  font-size:16px;
  font-weight:700;
  cursor:pointer;
}

.account-switch {
  margin-top:22px;
  padding-top:20px;
  border-top:1px solid #e1e1e1;
  text-align:center;
  color:#666;
  font-size:14px;
}

.account-switch .secondary-action {
  display:block;
  width:100%;
  margin-top:10px;
  padding:11px 14px;
  border:1px solid #bbb;
  border-radius:8px;
  background:#fff;
  color:#222;
  text-decoration:none;
  font-weight:700;
}

.account-switch .secondary-action:hover {
  background:#f1f1f1;
  border-color:#999;
}

.quiet-link {
  text-align:center;
  margin:16px 0 0;
  font-size:14px;
}

#error {
  display:none;
  color:#b71c1c;
  margin-bottom:15px;
}

a {
  color:#222;
}
</style>
</head>

<body>

<header>
<a href="/"
style="color:inherit;text-decoration:none;">
<div class="logo">PMS-ME</div>
</a>
</header>

<div class="container">

<div class="card">

<h1>Log In</h1>

<div id="error"></div>

<form id="loginForm">

<label for="email">
Email Address
</label>

<input
  id="email"
  type="email"
  autocomplete="email"
  required
>

<label for="password">
Password
</label>

<div class="password-wrap">
<input
  id="password"
  type="password"
  autocomplete="current-password"
  required
>
<button type="button" class="password-toggle" data-target="password" aria-label="Show password" title="Show password">
<svg class="eye-open" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
<svg class="eye-closed" viewBox="0 0 24 24" aria-hidden="true" style="display:none"><path d="M3 3l18 18"></path><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path><path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.1 3.2"></path><path d="M6.6 6.6C3.5 8.7 2 12 2 12s3.5 8 10 8a10.5 10.5 0 0 0 4.1-.8"></path></svg>
</button>
</div>

<button type="submit">
Log In
</button>

</form>

<p class="quiet-link">
<a href="/forgot-password">
Forgot your password?
</a>
</p>

<div class="account-switch">
  <div>Don't have an account?</div>
  <a class="secondary-action" href="/register">
    Create Account
  </a>
</div>

</div>

</div>

<script>
const eyeOpenIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12"></path>' +
  '<circle cx="12" cy="12" r="3"></circle>' +
  '</svg>';

const eyeClosedIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M3 3l18 18"></path>' +
  '<path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>' +
  '<path d="M9.9 4.2A11.4 11.4 0 0 1 12 4c6.5 0 10 8 10 8a18.4 18.4 0 0 1-2.1 3.2"></path>' +
  '<path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 8 10 8a10 10 0 0 0 5.4-1.6"></path>' +
  '</svg>';

document
  .querySelectorAll(
    ".password-toggle"
  )
  .forEach((toggle) => {
    toggle.addEventListener(
      "click",
      () => {
        const input =
          document.getElementById(
            toggle.dataset.target
          );

        const showing =
          input.type === "text";

        input.type =
          showing
            ? "password"
            : "text";

        toggle.querySelector(
          ".eye-open"
        ).style.display =
          showing ? "" : "none";

        toggle.querySelector(
          ".eye-closed"
        ).style.display =
          showing ? "none" : "";

        toggle.setAttribute(
          "aria-label",
          showing
            ? "Show password"
            : "Hide password"
        );

        toggle.title =
          showing
            ? "Show password"
            : "Hide password";
      }
    );
  });

const form =
  document.getElementById(
    "loginForm"
  );

const error =
  document.getElementById(
    "error"
  );

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    error.style.display =
      "none";

    try {

      const response =
        await fetch(
          "/api/account/login",
          {
            method:"POST",
            headers:{
              "Content-Type":
                "application/json"
            },
            credentials:
              "same-origin",
            body:
              JSON.stringify({
                email:
                  document.getElementById(
                    "email"
                  ).value,
                password:
                  document.getElementById(
                    "password"
                  ).value
              })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Login failed."
        );
      }

      window.location.href =
        "/account";

    } catch (err) {

      error.textContent =
        err.message;

      error.style.display =
        "block";
    }
  }
);
</script>

</body>
</html>`,
    200,
    {
      "Cache-Control":
        "no-store"
    }
  );
}

function forgotPasswordPage() {
  return htmlResponse(
`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1">
<title>PMS-ME — Reset Password</title>

<style>
* {
  box-sizing:border-box;
}

body {
  margin:0;
  background:#f4f4f4;
  font-family:Arial,Helvetica,sans-serif;
}

.container {
  width:min(480px,calc(100% - 30px));
  margin:60px auto;
}

.card {
  background:#fff;
  border:1px solid #ddd;
  padding:30px;
}

input {
  width:100%;
  padding:11px;
  font-size:16px;
  margin:10px 0;
}

button:not(.password-toggle) {
  width:100%;
  padding:12px;
  background:#222;
  color:#fff;
  border:0;
  cursor:pointer;
}

#error {
  color:#b71c1c;
}
</style>
</head>

<body>

<div class="container">

<div class="card">

<h1>Reset Password</h1>

<div id="error"></div>

<form id="form">

<input
  id="email"
  type="email"
  placeholder="Email address"
  required
>

<button>
Send Reset Link
</button>

</form>

</div>

</div>

<script>
document
  .getElementById("form")
  .addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const error =
        document.getElementById(
          "error"
        );

      try {

        const response =
          await fetch(
            "/api/account/forgot-password",
            {
              method:"POST",
              headers:{
                "Content-Type":
                  "application/json"
              },
              body:
                JSON.stringify({
                  email:
                    document.getElementById(
                      "email"
                    ).value
                })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
            "Unable to process request."
          );
        }

        document.querySelector(
          ".card"
        ).innerHTML =
          "<h1>Check Your Email</h1>" +
          "<p>If an account exists for that email address, a password-reset link has been sent.</p>";

      } catch (err) {

        error.textContent =
          err.message;
      }
    }
  );
</script>

</body>
</html>`,
    200,
    {
      "Cache-Control":
        "no-store"
    }
  );
}

function resetPasswordPage(
  token
) {
  return htmlResponse(
`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1">
<title>PMS-ME — Choose New Password</title>

<style>
* {
  box-sizing:border-box;
}

body {
  margin:0;
  background:#f4f4f4;
  font-family:Arial,Helvetica,sans-serif;
}

.container {
  width:min(480px,calc(100% - 30px));
  margin:60px auto;
}

.card {
  background:#fff;
  border:1px solid #ddd;
  padding:30px;
}

input {
  width:100%;
  padding:11px;
  font-size:16px;
  margin:10px 0 16px;
}

.password-wrap {
  position:relative;
}

.password-wrap input {
  padding-right:46px;
}

.password-toggle {
  position:absolute;
  right:8px;
  top:calc(50% - 3px);
  transform:translateY(-50%);
  width:36px;
  height:36px;
  margin:0;
  padding:0;
  border:0;
  background:transparent;
  color:#555;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
}

.password-toggle:hover {
  background:transparent;
  color:#000;
}

.password-toggle svg {
  width:22px;
  height:22px;
  fill:none;
  stroke:currentColor;
  stroke-width:2;
  stroke-linecap:round;
  stroke-linejoin:round;
}

button:not(.password-toggle) {
  width:100%;
  padding:12px;
  background:#222;
  color:#fff;
  border:0;
}

#error {
  color:#b71c1c;
}
</style>
</head>

<body>

<div class="container">

<div class="card">

<h1>Choose a New Password</h1>

<div id="error"></div>

<form id="form">

<div class="password-wrap">
<input
  id="password"
  type="password"
  minlength="8"
  placeholder="New password"
  required
>
<button type="button" class="password-toggle" data-target="password" aria-label="Show password" title="Show password">
<svg class="eye-open" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
<svg class="eye-closed" viewBox="0 0 24 24" aria-hidden="true" style="display:none"><path d="M3 3l18 18"></path><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path><path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.1 3.2"></path><path d="M6.6 6.6C3.5 8.7 2 12 2 12s3.5 8 10 8a10.5 10.5 0 0 0 4.1-.8"></path></svg>
</button>
</div>

<div class="password-wrap">
<input
  id="confirm"
  type="password"
  minlength="8"
  placeholder="Confirm new password"
  required
>
<button type="button" class="password-toggle" data-target="confirm" aria-label="Show password" title="Show password">
<svg class="eye-open" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
<svg class="eye-closed" viewBox="0 0 24 24" aria-hidden="true" style="display:none"><path d="M3 3l18 18"></path><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path><path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.1 3.2"></path><path d="M6.6 6.6C3.5 8.7 2 12 2 12s3.5 8 10 8a10.5 10.5 0 0 0 4.1-.8"></path></svg>
</button>
</div>

<button>
Set New Password
</button>

</form>

</div>

</div>

<script>
const eyeOpenIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12"></path>' +
  '<circle cx="12" cy="12" r="3"></circle>' +
  '</svg>';

const eyeClosedIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true">' +
  '<path d="M3 3l18 18"></path>' +
  '<path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>' +
  '<path d="M9.9 4.2A11.4 11.4 0 0 1 12 4c6.5 0 10 8 10 8a18.4 18.4 0 0 1-2.1 3.2"></path>' +
  '<path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 8 10 8a10 10 0 0 0 5.4-1.6"></path>' +
  '</svg>';

document
  .querySelectorAll(
    ".password-toggle"
  )
  .forEach((toggle) => {
    toggle.addEventListener(
      "click",
      () => {
        const input =
          document.getElementById(
            toggle.dataset.target
          );

        const showing =
          input.type === "text";

        input.type =
          showing
            ? "password"
            : "text";

        toggle.querySelector(
          ".eye-open"
        ).style.display =
          showing ? "" : "none";

        toggle.querySelector(
          ".eye-closed"
        ).style.display =
          showing ? "none" : "";

        toggle.setAttribute(
          "aria-label",
          showing
            ? "Show password"
            : "Hide password"
        );

        toggle.title =
          showing
            ? "Show password"
            : "Hide password";
      }
    );
  });

const token =
  ${JSON.stringify(token)};

document
  .getElementById("form")
  .addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const error =
        document.getElementById(
          "error"
        );

      const password =
        document.getElementById(
          "password"
        ).value;

      const confirm =
        document.getElementById(
          "confirm"
        ).value;

      if (
        password !== confirm
      ) {
        error.textContent =
          "The passwords do not match.";

        return;
      }

      try {

        const response =
          await fetch(
            "/api/account/reset-password",
            {
              method:"POST",
              headers:{
                "Content-Type":
                  "application/json"
              },
              body:
                JSON.stringify({
                  token,
                  password
                })
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
            "Unable to reset password."
          );
        }

        document.querySelector(
          ".card"
        ).innerHTML =
          "<h1>Password Updated</h1>" +
          "<p>Your password has been changed.</p>" +
          "<p><a href='/login'>Log In</a></p>";

      } catch (err) {

        error.textContent =
          err.message;
      }
    }
  );
</script>

</body>
</html>`,
    200,
    {
      "Cache-Control":
        "no-store"
    }
  );
}

function verifyEmailPage(
  success
) {
  return htmlResponse(
`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1">
<title>PMS-ME — Email Verification</title>
<style>
body {
  margin:0;
  background:#f4f4f4;
  font-family:Arial,Helvetica,sans-serif;
}

.card {
  width:min(560px,calc(100% - 30px));
  margin:80px auto;
  background:#fff;
  border:1px solid #ddd;
  padding:30px;
}
</style>
</head>

<body>

<div class="card">

<h1>
${
  success
    ? "Email Verified"
    : "Verification Problem"
}
</h1>

<p>
${
  success
    ? "Your PMS-ME account is now active."
    : "This verification link is invalid or has expired."
}
</p>

<p>
<a href="${
  success
    ? "/account"
    : "/login"
}">
${
  success
    ? "Go to My Account"
    : "Go to Login"
}
</a>
</p>

</div>

</body>
</html>`,
    200,
    {
      "Cache-Control":
        "no-store"
    }
  );
}

function unsubscribePage() {
  return htmlResponse(
`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1">
<title>PMS-ME — Unsubscribe</title>
<style>
body {
  margin:0;
  background:#f4f4f4;
  font-family:Arial,Helvetica,sans-serif;
}

.card {
  width:min(560px,calc(100% - 30px));
  margin:80px auto;
  background:#fff;
  border:1px solid #ddd;
  padding:30px;
}
</style>
</head>

<body>

<div class="card">

<h1>PMS-ME Email Preferences</h1>

<p>
Your PMS-ME account email updates have been turned off.
</p>

<p>
You can change your preferences at any time by logging into your account.
</p>

<p>
<a href="/login">
Log In
</a>
</p>

</div>

</body>
</html>`,
    200,
    {
      "Cache-Control":
        "no-store"
    }
  );
}

function rssXml(
  stories
) {
  const items =
    stories.map(
      story => {

        const title =
          escapeHtml(
            makeStoryHeading(
              story
            )
          );

        const description =
          escapeHtml(
            makeTeaser(
              story.story,
              300
            )
          );

        const link =
          escapeHtml(
            storyLink(
              story.id
            )
          );

        const pubDate =
          new Date(
            story.published_at
          ).toUTCString();

        return `
<item>
<title>${title}</title>
<link>${link}</link>
<guid>${link}</guid>
<description>${description}</description>
<pubDate>${pubDate}</pubDate>
</item>`;
      }
    ).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>PMS-ME — Property Manager Stories</title>
<link>${SITE_URL}</link>
<description>Latest published stories from PMS-ME.</description>
${items}
</channel>
</rss>`;
}

export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(request.url);

    try {
      await env.pms_me_db
        .prepare(
          `ALTER TABLE users
           ADD COLUMN notification_email TEXT`
        )
        .run();
    } catch (error) {
      if (!String(error && error.message || error).toLowerCase().includes("duplicate column")) {
        console.error("notification_email schema check failed:",error);
      }
    }

    try {
      await env.pms_me_db
        .prepare(
          `ALTER TABLE stories
           ADD COLUMN user_id INTEGER`
        )
        .run();
    } catch (error) {
      if (!String(error && error.message || error).toLowerCase().includes("duplicate column")) {
        console.error("story user_id schema check failed:",error);
      }
    }

    await env.pms_me_db
      .prepare(
        `CREATE TABLE IF NOT EXISTS user_story_interactions (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           user_id INTEGER NOT NULL,
           story_id INTEGER NOT NULL,
           interaction_type TEXT NOT NULL,
           created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
           UNIQUE(user_id, story_id, interaction_type)
         )`
      )
      .run();

    /*
     * =========================================================
     * ACCOUNT PAGES
     * =========================================================
     */

    if (
      url.pathname === "/register" &&
      request.method === "GET"
    ) {
      return registerPage();
    }

    if (
      url.pathname === "/login" &&
      request.method === "GET"
    ) {
      const user =
        await getCurrentUser(
          request,
          env
        );

      if (user) {
        return new Response(
          null,
          {
            status: 302,
            headers: {
              Location:
                "/account"
            }
          }
        );
      }

      return loginPage();
    }

    if (
      url.pathname === "/account" &&
      request.method === "GET"
    ) {
      const user =
        await getCurrentUser(
          request,
          env
        );

      if (!user) {
        return new Response(
          null,
          {
            status: 302,
            headers: {
              Location:
                "/login"
            }
          }
        );
      }

      return accountPage(
        user
      );
    }

    if (
      url.pathname === "/forgot-password" &&
      request.method === "GET"
    ) {
      return forgotPasswordPage();
    }

    if (
      url.pathname === "/reset-password" &&
      request.method === "GET"
    ) {
      const token =
        url.searchParams.get(
          "token"
        ) || "";

      if (!token) {
        return htmlResponse(
          "<h1>Invalid reset link.</h1>",
          400
        );
      }

      return resetPasswordPage(
        token
      );
    }

    /*
     * =========================================================
     * ACCOUNT REGISTRATION
     * =========================================================
     */

    if (
      url.pathname ===
        "/api/account/register" &&
      request.method === "POST"
    ) {

      let body;

      try {
        body =
          await request.json();
      } catch {
        return jsonResponse(
          {
            error:
              "Invalid request body."
          },
          400
        );
      }

      const email =
        normalizeEmail(
          body.email
        );

      const password =
        typeof body.password ===
        "string"
          ? body.password
          : "";

      if (!validEmail(email)) {
        return jsonResponse(
          {
            error:
              "Please enter a valid email address."
          },
          400
        );
      }

      if (
        password.length < 8
      ) {
        return jsonResponse(
          {
            error:
              "Password must be at least 8 characters."
          },
          400
        );
      }

      if (
        !body.terms_accepted
      ) {
        return jsonResponse(
          {
            error:
              "You must agree to the Terms of Service."
          },
          400
        );
      }

      const existing =
        await env.pms_me_db
          .prepare(
            `SELECT
               id,
               email_verified
             FROM users
             WHERE email = ?`
          )
          .bind(email)
          .first();

      if (existing) {

        if (
          !existing.email_verified
        ) {
          const token =
            randomToken();

          const tokenHash =
            await sha256(token);

          const expires =
            new Date(
              Date.now() +
                24 * 60 * 60 * 1000
            ).toISOString();

          await env.pms_me_db
            .prepare(
              `DELETE FROM
               email_verification_tokens
               WHERE user_id = ?`
            )
            .bind(existing.id)
            .run();

          await env.pms_me_db
            .prepare(
              `INSERT INTO
               email_verification_tokens
               (
                 user_id,
                 token_hash,
                 expires_at
               )
               VALUES (?, ?, ?)`
            )
            .bind(
              existing.id,
              tokenHash,
              expires
            )
            .run();

          let verificationEmailSent =
            true;

          try {
            await sendVerificationEmail(
              env,
              email,
              token
            );
          } catch (error) {
            verificationEmailSent =
              false;

            console.error(
              "Verification email resend failed:",
              error
            );
          }

          return jsonResponse(
            {
              error:
                verificationEmailSent
                  ? "Your account already exists, but your email address still needs to be confirmed. Please check your email for the verification link."
                  : "Your account already exists, but your email address still needs to be confirmed. Verification email delivery is temporarily unavailable; please try again later."
            },
            409
          );
        }

        return jsonResponse(
          {
            error:
              "Your account already exists. Please sign in."
          },
          409
        );
      }

      const passwordHash =
        await hashPassword(
          password
        );

      const unsubscribeToken =
        randomToken();

      const rssToken =
        randomToken();

      const result =
        await env.pms_me_db
          .prepare(
            `INSERT INTO users
             (
               email,
               password_hash,
               email_verified,
               story_frequency,
               sponsor_emails,
               rss_enabled,
               unsubscribe_token,
               rss_token,
               terms_accepted_at
             )
             VALUES (
               ?, ?, 0, 'weekly', 0, 1, ?, ?, CURRENT_TIMESTAMP
             )`
          )
          .bind(
            email,
            passwordHash,
            unsubscribeToken,
            rssToken
          )
          .run();

      const userId =
        result.meta.last_row_id;

      const token =
        randomToken();

      const tokenHash =
        await sha256(token);

      const expires =
        new Date(
          Date.now() +
            24 * 60 * 60 * 1000
        ).toISOString();

      await env.pms_me_db
        .prepare(
          `INSERT INTO
           email_verification_tokens
           (
             user_id,
             token_hash,
             expires_at
           )
           VALUES (?, ?, ?)`
        )
        .bind(
          userId,
          tokenHash,
          expires
        )
        .run();

      try {
        await sendVerificationEmail(
          env,
          email,
          token
        );
      } catch (error) {
        return jsonResponse(
          {
            error:
              "Verification email failed: " +
              (error && error.message
                ? error.message
                : String(error))
          },
          500
        );
      }

      return jsonResponse(
        {
          ok: true,
          email
        },
        201
      );
    }

    /*
     * =========================================================
     * EMAIL VERIFICATION
     * =========================================================
     */

    if (
      url.pathname ===
        "/verify-email" &&
      request.method === "GET"
    ) {

      const token =
        url.searchParams.get(
          "token"
        ) || "";

      if (!token) {
        return verifyEmailPage(
          false
        );
      }

      const tokenHash =
        await sha256(token);

      const verification =
        await env.pms_me_db
          .prepare(
            `SELECT
               id,
               user_id
             FROM email_verification_tokens
             WHERE token_hash = ?
               AND expires_at > CURRENT_TIMESTAMP`
          )
          .bind(tokenHash)
          .first();

      if (!verification) {
        return verifyEmailPage(
          false
        );
      }

      await env.pms_me_db
        .prepare(
          `UPDATE users
           SET email_verified = 1
           WHERE id = ?`
        )
        .bind(
          verification.user_id
        )
        .run();

      await env.pms_me_db
        .prepare(
          `DELETE FROM
           email_verification_tokens
           WHERE id = ?`
        )
        .bind(
          verification.id
        )
        .run();

      return verifyEmailPage(
        true
      );
    }

    /*
     * =========================================================
     * ACCOUNT LOGIN
     * =========================================================
     */

    if (
      url.pathname ===
        "/api/account/login" &&
      request.method === "POST"
    ) {

      let body;

      try {
        body =
          await request.json();
      } catch {
        return jsonResponse(
          {
            error:
              "Invalid request body."
          },
          400
        );
      }

      const email =
        normalizeEmail(
          body.email
        );

      const password =
        typeof body.password ===
        "string"
          ? body.password
          : "";

      const user =
        await env.pms_me_db
          .prepare(
            `SELECT *
             FROM users
             WHERE email = ?`
          )
          .bind(email)
          .first();

      if (
        !user ||
        !(await verifyPassword(
          password,
          user.password_hash
        ))
      ) {
        return jsonResponse(
          {
            error:
              "Invalid email address or password."
          },
          401
        );
      }
            if (!user.email_verified) {
        return jsonResponse(
          {
            error:
              "Please verify your email address before logging in."
          },
          403
        );
      }

      const session =
        await createUserSession(
          env,
          user.id
        );

      await env.pms_me_db
        .prepare(
          `UPDATE users
           SET last_login_at =
             CURRENT_TIMESTAMP
           WHERE id = ?`
        )
        .bind(user.id)
        .run();

      return jsonResponse(
        {
          ok: true
        },
        200,
        {
          "Set-Cookie":
            accountCookie(session),
          "Cache-Control":
            "no-store"
        }
      );
    }

    /*
     * =========================================================
     * ACCOUNT LOGOUT
     * =========================================================
     */

    if (
      url.pathname ===
        "/api/account/logout" &&
      request.method === "POST"
    ) {

      const cookieHeader =
        request.headers.get(
          "Cookie"
        ) || "";

      const match =
        cookieHeader.match(
          /(?:^|;\s*)pms_me_session=([^;]+)/
        );

      if (match) {
        const tokenHash =
          await sha256(
            match[1]
          );

        await env.pms_me_db
          .prepare(
            `DELETE FROM
             user_sessions
             WHERE token_hash = ?`
          )
          .bind(tokenHash)
          .run();
      }

      return jsonResponse(
        {
          ok: true
        },
        200,
        {
          "Set-Cookie":
            clearAccountCookie(),
          "Cache-Control":
            "no-store"
        }
      );
    }

    /*
     * =========================================================
     * CLOSE USER ACCOUNT
     * =========================================================
     */

    if (
      url.pathname ===
        "/api/account" &&
      request.method === "DELETE"
    ) {
      const user =
        await getCurrentUser(
          request,
          env
        );

      if (!user) {
        return unauthorizedResponse();
      }

      await env.pms_me_db.batch([
        env.pms_me_db
          .prepare(
            `DELETE FROM email_deliveries
             WHERE user_id = ?`
          )
          .bind(user.id),
        env.pms_me_db
          .prepare(
            `DELETE FROM email_verification_tokens
             WHERE user_id = ?`
          )
          .bind(user.id),
        env.pms_me_db
          .prepare(
            `DELETE FROM password_reset_tokens
             WHERE user_id = ?`
          )
          .bind(user.id),
        env.pms_me_db
          .prepare(
            `DELETE FROM user_story_interactions
             WHERE user_id = ?`
          )
          .bind(user.id),
        env.pms_me_db
          .prepare(
            `DELETE FROM user_sessions
             WHERE user_id = ?`
          )
          .bind(user.id),
        env.pms_me_db
          .prepare(
            `DELETE FROM users
             WHERE id = ?`
          )
          .bind(user.id)
      ]);

      return jsonResponse(
        {
          ok: true
        },
        200,
        {
          "Set-Cookie":
            clearAccountCookie(),
          "Cache-Control":
            "no-store"
        }
      );
    }

    /*
     * =========================================================
     * ACCOUNT PREFERENCES
     * =========================================================
     */

    if (
      url.pathname ===
        "/api/account/preferences" &&
      request.method === "PUT"
    ) {
      const user = await getCurrentUser(request,env);
      if (!user) return unauthorizedResponse();

      let body;
      try { body=await request.json(); }
      catch { return jsonResponse({error:"Invalid request body."},400); }

      const frequency=["weekly","immediate","off"].includes(body.frequency)
        ? body.frequency
        : "weekly";

      const notificationEmail=normalizeEmail(body.notification_email);
      if(!validEmail(notificationEmail)){
        return jsonResponse({error:"Please enter a valid notification email address."},400);
      }

      await env.pms_me_db
        .prepare(
          `UPDATE users
           SET story_frequency = ?,
               notification_email = ?
           WHERE id = ?`
        )
        .bind(frequency,notificationEmail,user.id)
        .run();

      return jsonResponse({
        ok:true,
        frequency,
        notification_email:notificationEmail
      });
    }

    /*
     * =========================================================
     * FORGOT PASSWORD
     * =========================================================
     */

    if (
      url.pathname ===
        "/api/account/forgot-password" &&
      request.method === "POST"
    ) {

      let body;

      try {
        body =
          await request.json();
      } catch {
        return jsonResponse(
          {
            error:
              "Invalid request body."
          },
          400
        );
      }

      const email =
        normalizeEmail(
          body.email
        );

      const user =
        await env.pms_me_db
          .prepare(
            `SELECT id, email
             FROM users
             WHERE email = ?`
          )
          .bind(email)
          .first();

      /*
       * Always return the same response whether
       * the email exists or not.
       */

      if (user) {

        const token =
          randomToken();

        const tokenHash =
          await sha256(token);

        const expires =
          new Date(
            Date.now() +
              60 * 60 * 1000
          ).toISOString();

        await env.pms_me_db
          .prepare(
            `DELETE FROM
             password_reset_tokens
             WHERE user_id = ?`
          )
          .bind(user.id)
          .run();

        await env.pms_me_db
          .prepare(
            `INSERT INTO
             password_reset_tokens
             (
               user_id,
               token_hash,
               expires_at
             )
             VALUES (?, ?, ?)`
          )
          .bind(
            user.id,
            tokenHash,
            expires
          )
          .run();

        try {
          await sendPasswordResetEmail(
            env,
            user.email,
            token
          );
        } catch (error) {
          console.error(
            "Password reset email failed:",
            error
          );
        }
      }

      return jsonResponse({
        ok: true
      });
    }

    /*
     * =========================================================
     * RESET PASSWORD
     * =========================================================
     */

    if (
      url.pathname ===
        "/api/account/reset-password" &&
      request.method === "POST"
    ) {

      let body;

      try {
        body =
          await request.json();
      } catch {
        return jsonResponse(
          {
            error:
              "Invalid request body."
          },
          400
        );
      }

      const token =
        typeof body.token ===
        "string"
          ? body.token
          : "";

      const password =
        typeof body.password ===
        "string"
          ? body.password
          : "";

      if (
        password.length < 8
      ) {
        return jsonResponse(
          {
            error:
              "Password must be at least 8 characters."
          },
          400
        );
      }

      const tokenHash =
        await sha256(token);

      const reset =
        await env.pms_me_db
          .prepare(
            `SELECT
               id,
               user_id
             FROM password_reset_tokens
             WHERE token_hash = ?
               AND expires_at > CURRENT_TIMESTAMP`
          )
          .bind(tokenHash)
          .first();

      if (!reset) {
        return jsonResponse(
          {
            error:
              "This password-reset link is invalid or has expired."
          },
          400
        );
      }

      const passwordHash =
        await hashPassword(
          password
        );

      await env.pms_me_db
        .prepare(
          `UPDATE users
           SET password_hash = ?
           WHERE id = ?`
        )
        .bind(
          passwordHash,
          reset.user_id
        )
        .run();

      await env.pms_me_db
        .prepare(
          `DELETE FROM
           password_reset_tokens
           WHERE id = ?`
        )
        .bind(reset.id)
        .run();

      await env.pms_me_db
        .prepare(
          `DELETE FROM
           user_sessions
           WHERE user_id = ?`
        )
        .bind(
          reset.user_id
        )
        .run();

      return jsonResponse({
        ok: true
      });
    }

    /*
     * =========================================================
     * UNSUBSCRIBE
     * =========================================================
     */

    if (
      url.pathname ===
        "/unsubscribe" &&
      request.method === "GET"
    ) {

      const token =
        url.searchParams.get(
          "token"
        ) || "";

      if (token) {

        await env.pms_me_db
          .prepare(
            `UPDATE users
             SET story_frequency = 'off',
                 sponsor_emails = 0
             WHERE unsubscribe_token = ?`
          )
          .bind(token)
          .run();
      }

      return unsubscribePage();
    }

    /*
     * =========================================================
     * RSS FEED
     * =========================================================
     */

    if (
      url.pathname ===
        "/rss.xml" &&
      request.method === "GET"
    ) {

      const token =
        url.searchParams.get(
          "token"
        );

      if (token) {

        const user =
          await env.pms_me_db
            .prepare(
              `SELECT id
               FROM users
               WHERE rss_token = ?
                 AND rss_enabled = 1
                 AND email_verified = 1`
            )
            .bind(token)
            .first();

        if (!user) {
          return new Response(
            "RSS feed not available.",
            {
              status: 403,
              headers: {
                "Content-Type":
                  "text/plain; charset=utf-8"
              }
            }
          );
        }
      }

      const stories =
        await env.pms_me_db
          .prepare(
            `SELECT
               id,
               title,
               city,
               story,
               category,
               public_name,
               published_at
             FROM stories
             WHERE status = 'published'
             ORDER BY published_at DESC
             LIMIT 50`
          )
          .all();

      return new Response(
        rssXml(
          stories.results || []
        ),
        {
          status: 200,
          headers: {
            "Content-Type":
              "application/rss+xml; charset=utf-8",
            "Cache-Control":
              "no-cache"
          }
        }
      );
    }

    /*
     * =========================================================
     * MODERATOR PAGE
     * =========================================================
     */

    if (
      url.pathname ===
        "/moderate.html"
    ) {
      if (
        !(await isModeratorAuthenticated(
          request,
          env
        ))
      ) {
        return moderatorLoginPage();
      }
    }

    /*
     * =========================================================
     * MODERATOR LOGIN
     * =========================================================
     */

    if (
      url.pathname ===
        "/api/moderator-login" &&
      request.method === "POST"
    ) {

      if (!env.MODERATOR_PASSWORD) {
        return jsonResponse(
          {
            error:
              "MODERATOR_PASSWORD is missing"
          },
          500
        );
      }

      if (!env.MODERATOR_SESS_SEC) {
        return jsonResponse(
          {
            error:
              "MODERATOR_SESS_SEC is missing"
          },
          500
        );
      }

      let body;

      try {
        body =
          await request.json();
      } catch {
        return jsonResponse(
          {
            error:
              "Invalid request body"
          },
          400
        );
      }

      if (
        !body ||
        typeof body.password !==
          "string"
      ) {
        return jsonResponse(
          {
            error:
              "Password is required"
          },
          400
        );
      }

      if (
        body.password !==
        env.MODERATOR_PASSWORD
      ) {
        return jsonResponse(
          {
            error:
              "Invalid password"
          },
          401
        );
      }

      const session =
        await createModeratorSession(
          env
        );

      return jsonResponse(
        {
          ok: true
        },
        200,
        {
          "Set-Cookie":
            `pms_me_moderator=${session}; ` +
            "Path=/; " +
            "HttpOnly; " +
            "Secure; " +
            "SameSite=Strict; " +
            "Max-Age=28800",
          "Cache-Control":
            "no-store"
        }
      );
    }

    /*
     * =========================================================
     * MODERATOR LOGOUT
     * =========================================================
     */

    if (
      url.pathname ===
        "/api/moderator-logout" &&
      request.method === "POST"
    ) {

      return jsonResponse(
        {
          ok: true
        },
        200,
        {
          "Set-Cookie":
            "pms_me_moderator=; " +
            "Path=/; " +
            "HttpOnly; " +
            "Secure; " +
            "SameSite=Strict; " +
            "Max-Age=0",
          "Cache-Control":
            "no-store"
        }
      );
    }

    /*
     * =========================================================
     * MODERATOR API AUTHENTICATION
     * =========================================================
     */

    const isModeratorApi =
      url.pathname ===
        "/api/notification-settings" ||
      url.pathname ===
        "/api/moderator/accounts" ||
      url.pathname ===
        "/api/moderator/accounts/approve" ||
      url.pathname ===
        "/api/moderator/accounts/update" ||
      url.pathname ===
        "/api/moderator/accounts/purge" ||
      (
        url.pathname.startsWith(
          "/api/stories"
        ) &&
        (
          url.searchParams.has(
            "status"
          ) ||
          request.method ===
            "PATCH" ||
          request.method ===
            "DELETE"
        )
      );

    if (isModeratorApi) {

      if (
        !(await isModeratorAuthenticated(
          request,
          env
        ))
      ) {
        return unauthorizedResponse();
      }
    }

    /*
     * =========================================================
     * MODERATOR — REGISTERED ACCOUNTS
     * =========================================================
     */

    if (
      url.pathname === "/api/moderator/accounts" &&
      request.method === "GET"
    ) {
      const accounts =
        await env.pms_me_db
          .prepare(
            `SELECT
               u.id,
               u.email,
               COALESCE(u.notification_email, u.email) AS notification_email,
               u.email_verified,
               u.story_frequency,
               u.created_at,
               u.last_login_at,
               (
                 SELECT COUNT(*)
                 FROM stories s
                 WHERE s.user_id = u.id
                    OR (
                      s.user_id IS NULL
                      AND LOWER(COALESCE(s.email,'')) = LOWER(u.email)
                    )
               ) AS stories_posted,
               (
                 SELECT COUNT(*)
                 FROM user_story_interactions i
                 WHERE i.user_id = u.id
               ) AS post_interactions
             FROM users u
             ORDER BY u.created_at DESC, u.id DESC`
          )
          .all();

      return jsonResponse({
        results: accounts.results || []
      });
    }

    if (
      url.pathname === "/api/moderator/accounts/update" &&
      request.method === "PATCH"
    ) {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({error:"Invalid request body."},400);
      }

      const userId = Number(body.user_id);
      const frequency = ["weekly","immediate","off"].includes(body.frequency)
        ? body.frequency
        : null;
      const notificationEmail = normalizeEmail(body.notification_email);

      if (!Number.isInteger(userId) || userId < 1) {
        return jsonResponse({error:"Invalid account."},400);
      }
      if (!frequency) {
        return jsonResponse({error:"Invalid notification option."},400);
      }
      if (!validEmail(notificationEmail)) {
        return jsonResponse({error:"Please enter a valid notification email address."},400);
      }

      const result = await env.pms_me_db
        .prepare(
          `UPDATE users
           SET story_frequency = ?,
               notification_email = ?
           WHERE id = ?`
        )
        .bind(frequency,notificationEmail,userId)
        .run();

      if (!result.meta || !result.meta.changes) {
        return jsonResponse({error:"Account not found."},404);
      }

      return jsonResponse({
        ok:true,
        user_id:userId,
        frequency,
        notification_email:notificationEmail
      });
    }

    if (
      url.pathname === "/api/moderator/accounts/approve" &&
      request.method === "PATCH"
    ) {
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({error:"Invalid request body."},400);
      }

      const email = normalizeEmail(body.email);
      if (!validEmail(email)) {
        return jsonResponse({error:"Please enter a valid email address."},400);
      }

      const user =
        await env.pms_me_db
          .prepare(
            `SELECT id, email, email_verified
             FROM users
             WHERE email = ?`
          )
          .bind(email)
          .first();

      if (!user) {
        return jsonResponse({error:"Account not found."},404);
      }

      await env.pms_me_db.batch([
        env.pms_me_db
          .prepare(
            `UPDATE users
             SET email_verified = 1
             WHERE id = ?`
          )
          .bind(user.id),
        env.pms_me_db
          .prepare(
            `DELETE FROM email_verification_tokens
             WHERE user_id = ?`
          )
          .bind(user.id)
      ]);

      return jsonResponse({
        ok:true,
        email:user.email,
        already_verified:!!user.email_verified
      });
    }

    /*
     * =========================================================
     * MODERATOR — PURGE USER ACCOUNT
     * =========================================================
     */

    if (
      url.pathname ===
        "/api/moderator/accounts/purge" &&
      request.method === "DELETE"
    ) {
      let body;

      try {
        body =
          await request.json();
      } catch {
        return jsonResponse(
          {
            error:
              "Invalid request body."
          },
          400
        );
      }

      const email =
        normalizeEmail(
          body.email
        );

      if (!validEmail(email)) {
        return jsonResponse(
          {
            error:
              "Please enter a valid email address."
          },
          400
        );
      }

      const user =
        await env.pms_me_db
          .prepare(
            `SELECT id, email
             FROM users
             WHERE email = ?`
          )
          .bind(email)
          .first();

      if (!user) {
        return jsonResponse(
          {
            error:
              "Account not found."
          },
          404
        );
      }

      await env.pms_me_db.batch([
        env.pms_me_db
          .prepare(
            `DELETE FROM email_deliveries
             WHERE user_id = ?`
          )
          .bind(user.id),
        env.pms_me_db
          .prepare(
            `DELETE FROM email_verification_tokens
             WHERE user_id = ?`
          )
          .bind(user.id),
        env.pms_me_db
          .prepare(
            `DELETE FROM password_reset_tokens
             WHERE user_id = ?`
          )
          .bind(user.id),
        env.pms_me_db
          .prepare(
            `DELETE FROM user_story_interactions
             WHERE user_id = ?`
          )
          .bind(user.id),
        env.pms_me_db
          .prepare(
            `DELETE FROM user_sessions
             WHERE user_id = ?`
          )
          .bind(user.id),
        env.pms_me_db
          .prepare(
            `DELETE FROM users
             WHERE id = ?`
          )
          .bind(user.id)
      ]);

      return jsonResponse({
        ok: true,
        email: user.email
      });
    }

    /*
     * =========================================================
     * NOTIFICATION SETTINGS
     * =========================================================
     */

    if (
      url.pathname ===
        "/api/notification-settings"
    ) {

      if (
        request.method === "GET"
      ) {

        const settings =
          await env.pms_me_db
            .prepare(
              `SELECT
                 email,
                 frequency,
                 last_digest_at
               FROM notification_settings
               WHERE id = 1`
            )
            .first();

        return jsonResponse(
          settings || {
            email: "",
            frequency: "off",
            last_digest_at: null
          }
        );
      }

      if (
        request.method === "PUT"
      ) {

        let body;

        try {
          body =
            await request.json();
        } catch {
          return jsonResponse(
            {
              error:
                "Invalid request body"
            },
            400
          );
        }

        const email =
          typeof body.email ===
          "string"
            ? body.email.trim()
            : "";

        const frequency =
          [
            "off",
            "immediately",
            "daily"
          ].includes(
            body.frequency
          )
            ? body.frequency
            : "off";

        await env.pms_me_db
          .prepare(
            `UPDATE notification_settings
             SET email = ?,
                 frequency = ?
             WHERE id = 1`
          )
          .bind(
            email || null,
            frequency
          )
          .run();

        return jsonResponse({
          ok: true,
          email,
          frequency
        });
      }

      return jsonResponse(
        {
          error:
            "Method not allowed"
        },
        405
      );
    }

    /*
     * =========================================================
     * STORY SUBMISSION — ANTI-SPAM SESSION / TURNSTILE CONFIG
     * =========================================================
     */

    if (
      url.pathname === "/api/submission-session" &&
      request.method === "POST"
    ) {
      await env.pms_me_db
        .prepare(
          `CREATE TABLE IF NOT EXISTS submission_sessions (
             token_hash TEXT PRIMARY KEY,
             created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
           )`
        )
        .run();

      await env.pms_me_db
        .prepare(
          `DELETE FROM submission_sessions
           WHERE created_at <= datetime('now', '-30 minutes')`
        )
        .run();

      const token = randomToken();
      const tokenHash = await sha256(token);

      await env.pms_me_db
        .prepare(
          `INSERT INTO submission_sessions (token_hash)
           VALUES (?)`
        )
        .bind(tokenHash)
        .run();

      return jsonResponse({ token });
    }

    if (
      url.pathname === "/api/turnstile-config" &&
      request.method === "GET"
    ) {
      const enabled =
        Boolean(
          env.TURNSTILE_SITE_KEY &&
          env.TURNSTILE_SECRET_KEY
        );

      return jsonResponse({
        enabled,
        sitekey:
          enabled
            ? env.TURNSTILE_SITE_KEY
            : null
      });
    }

    /*
     * =========================================================
     * STORIES — GET
     * =========================================================
     */

    if (
      url.pathname ===
        "/api/stories" &&
      request.method === "GET"
    ) {

      const status =
        url.searchParams.get(
          "status"
        );

      if (status) {

        const result =
          await env.pms_me_db
            .prepare(
              `SELECT
                 id,
                 title,
                 city,
                 story,
                 category,
                 display_name,
                 email,
                 anonymous_requested,
                 force_anonymous,
                 public_name,
                 status,
                 moderator_notes,
                 created_at,
                 published_at,
                 reaction_been_there,
                 reaction_funny
               FROM stories
               WHERE status = ?
               ORDER BY created_at DESC`
            )
            .bind(status)
            .all();

        return jsonResponse(
          result.results || []
        );
      }

      const result =
        await env.pms_me_db
          .prepare(
            `SELECT
               id,
               title,
               city,
               story,
               category,
               public_name,
               published_at,
               reaction_been_there,
               reaction_funny
             FROM stories
             WHERE status = 'published'
             ORDER BY published_at DESC`
          )
          .all();

      return jsonResponse(
        result.results || []
      );
    }

    /*
     * =========================================================
     * STORIES — POST
     * =========================================================
     */

    if (
      url.pathname ===
        "/api/stories" &&
      request.method === "POST"
    ) {

      let body;

      try {
        body =
          await request.json();
      } catch {
        return jsonResponse(
          {
            error:
              "Invalid request body"
          },
          400
        );
      }

      const clientIp =
        request.headers.get("CF-Connecting-IP") ||
        "unknown";

      const ipHash =
        await sha256(clientIp);

      await env.pms_me_db
        .prepare(
          `CREATE TABLE IF NOT EXISTS story_submission_events (
             id INTEGER PRIMARY KEY AUTOINCREMENT,
             ip_hash TEXT NOT NULL,
             created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
           )`
        )
        .run();

      await env.pms_me_db
        .prepare(
          `DELETE FROM story_submission_events
           WHERE created_at <= datetime('now', '-24 hours')`
        )
        .run();

      const recent15 =
        await env.pms_me_db
          .prepare(
            `SELECT COUNT(*) AS count
             FROM story_submission_events
             WHERE ip_hash = ?
               AND created_at > datetime('now', '-15 minutes')`
          )
          .bind(ipHash)
          .first();

      const recent24 =
        await env.pms_me_db
          .prepare(
            `SELECT COUNT(*) AS count
             FROM story_submission_events
             WHERE ip_hash = ?
               AND created_at > datetime('now', '-24 hours')`
          )
          .bind(ipHash)
          .first();

      if (
        Number(recent15?.count || 0) >= 3 ||
        Number(recent24?.count || 0) >= 10
      ) {
        return jsonResponse(
          {
            error:
              "Too many story submissions from this connection. Please wait and try again later."
          },
          429
        );
      }

      await env.pms_me_db
        .prepare(
          `INSERT INTO story_submission_events (ip_hash)
           VALUES (?)`
        )
        .bind(ipHash)
        .run();

      const spamReasons = [];

      const honeypot =
        typeof body.website === "string"
          ? body.website.trim()
          : "";

      if (honeypot) {
        spamReasons.push(
          "Hidden honeypot field was populated."
        );
      }

      const submissionSession =
        typeof body.submission_session === "string"
          ? body.submission_session
          : "";

      if (submissionSession) {
        await env.pms_me_db
          .prepare(
            `CREATE TABLE IF NOT EXISTS submission_sessions (
               token_hash TEXT PRIMARY KEY,
               created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
             )`
          )
          .run();

        const sessionHash =
          await sha256(submissionSession);

        const sessionRow =
          await env.pms_me_db
            .prepare(
              `SELECT
                 created_at,
                 (julianday('now') - julianday(created_at)) * 86400 AS age_seconds
               FROM submission_sessions
               WHERE token_hash = ?`
            )
            .bind(sessionHash)
            .first();

        await env.pms_me_db
          .prepare(
            `DELETE FROM submission_sessions
             WHERE token_hash = ?`
          )
          .bind(sessionHash)
          .run();

        if (
          sessionRow &&
          Number(sessionRow.age_seconds) < 3
        ) {
          spamReasons.push(
            "Form was submitted in under 3 seconds."
          );
        }
      } else {
        spamReasons.push(
          "Submission did not include a valid form-session marker."
        );
      }

      if (
        env.TURNSTILE_SITE_KEY &&
        env.TURNSTILE_SECRET_KEY
      ) {
        const turnstileToken =
          typeof body.turnstile_token === "string"
            ? body.turnstile_token
            : "";

        let turnstileValid = false;

        if (turnstileToken) {
          try {
            const verification =
              await fetch(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    secret:
                      env.TURNSTILE_SECRET_KEY,
                    response:
                      turnstileToken,
                    remoteip:
                      clientIp
                  })
                }
              );

            const verificationResult =
              await verification.json();

            turnstileValid =
              Boolean(
                verificationResult.success
              );
          } catch (error) {
            console.error(
              "Turnstile verification failed:",
              error
            );
          }
        }

        if (!turnstileValid) {
          return jsonResponse(
            {
              error:
                "Security verification failed. Please try submitting again."
            },
            403
          );
        }
      }

      const title =
        typeof body.title ===
        "string"
          ? body.title.trim()
          : "";

      const city =
        typeof body.city ===
        "string"
          ? body.city.trim()
          : "";

      const story =
        typeof body.story ===
        "string"
          ? body.story.trim()
          : "";

      const category =
        typeof body.category ===
        "string"
          ? body.category.trim()
          : "";

      const displayName =
        typeof body.display_name ===
        "string"
          ? body.display_name.trim()
          : "";

      const email =
        typeof body.email ===
        "string"
          ? body.email.trim()
          : "";

      const anonymousRequested =
        body.anonymous_requested
          ? 1
          : 0;

      if (
        !anonymousRequested &&
        !displayName
      ) {
        return jsonResponse(
          {
            error:
              "Display Name is required unless you choose to publish this story anonymously."
          },
          400
        );
      }

      if (!city) {
        return jsonResponse(
          {
            error:
              "City is required"
          },
          400
        );
      }

      if (!story) {
        return jsonResponse(
          {
            error:
              "Story is required"
          },
          400
        );
      }

      if (!category) {
        return jsonResponse(
          {
            error:
              "Category is required"
          },
          400
        );
      }

      if (
        title.length > 150
      ) {
        return jsonResponse(
          {
            error:
              "Title must be 150 characters or fewer."
          },
          400
        );
      }

      if (
        city.length > 100
      ) {
        return jsonResponse(
          {
            error:
              "City must be 100 characters or fewer."
          },
          400
        );
      }

      if (
        story.length > 2000
      ) {
        return jsonResponse(
          {
            error:
              "Story must be 2000 characters or fewer."
          },
          400
        );
      }

      const allowedCategories = [
        "Owner Moaner",
        "Vendor Woes",
        "Legally Blunt",
        "Board to Tears"
      ];

      if (
        !allowedCategories.includes(
          category
        )
      ) {
        return jsonResponse(
          {
            error:
              "Invalid category"
          },
          400
        );
      }

      const submittingUser =
        await getCurrentUser(request,env);

      const result =
        await env.pms_me_db
          .prepare(
            `INSERT INTO stories (
               title,
               city,
               story,
               category,
               display_name,
               email,
               anonymous_requested,
               status,
               moderator_notes,
               user_id
             )
             VALUES (
               ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?
             )`
          )
          .bind(
            title || null,
            city,
            story,
            category,
            displayName || null,
            email || null,
            anonymousRequested,
            spamReasons.length
              ? "[SPAM ANALYST] " + spamReasons.join(" ")
              : null,
            submittingUser ? submittingUser.id : null
          )
          .run();

      const insertedId =
        result.meta.last_row_id;

      const insertedStory =
        await env.pms_me_db
          .prepare(
            `SELECT *
             FROM stories
             WHERE id = ?`
          )
          .bind(
            insertedId
          )
          .first();

      try {
        await sendNewStoryNotification(
          env,
          insertedStory
        );
      } catch (error) {
        console.error(
          "Immediate notification failed:",
          error
        );
      }

      return jsonResponse(
        {
          ok: true,
          id: insertedId
        },
        201
      );
    }

    /*
     * =========================================================
     * STORIES — REACTIONS
     * =========================================================
     */

    if (
      url.pathname.startsWith(
        "/api/stories/"
      ) &&
      url.pathname.endsWith(
        "/reaction"
      ) &&
      request.method === "POST"
    ) {

      const parts =
        url.pathname.split("/");

      const id =
        parts[3];

      if (
        !/^\d+$/.test(id)
      ) {
        return jsonResponse(
          {
            error:
              "Invalid story ID"
          },
          400
        );
      }

      let body;

      try {
        body =
          await request.json();
      } catch {
        return jsonResponse(
          {
            error:
              "Invalid request body"
          },
          400
        );
      }

      const reaction =
        typeof body.reaction ===
        "string"
          ? body.reaction
          : "";

      let column;

      if (
        reaction ===
        "trainwreck"
      ) {
        column =
          "reaction_been_there";
      } else if (
        reaction === "right"
      ) {
        column =
          "reaction_funny";
      } else {
        return jsonResponse(
          {
            error:
              "Invalid reaction"
          },
          400
        );
      }

      const existing =
        await env.pms_me_db
          .prepare(
            `SELECT
               id,
               reaction_been_there,
               reaction_funny
             FROM stories
             WHERE id = ?
               AND status = 'published'`
          )
          .bind(id)
          .first();

      if (!existing) {
        return jsonResponse(
          {
            error:
              "Story not found"
          },
          404
        );
      }

      await env.pms_me_db
        .prepare(
          `UPDATE stories
           SET ${column} =
             COALESCE(
               ${column},
               0
             ) + 1
           WHERE id = ?
             AND status = 'published'`
        )
        .bind(id)
        .run();

      const reactingUser =
        await getCurrentUser(request,env);

      if (reactingUser) {
        await env.pms_me_db
          .prepare(
            `INSERT OR IGNORE INTO user_story_interactions
             (user_id, story_id, interaction_type)
             VALUES (?, ?, ?)`
          )
          .bind(
            reactingUser.id,
            Number(id),
            reaction
          )
          .run();
      }

      const updated =
        await env.pms_me_db
          .prepare(
            `SELECT
               reaction_been_there,
               reaction_funny
             FROM stories
             WHERE id = ?`
          )
          .bind(id)
          .first();

      return jsonResponse({
        ok: true,
        reaction_been_there:
          updated.reaction_been_there ||
          0,
        reaction_funny:
          updated.reaction_funny ||
          0
      });
    }

    /*
     * =========================================================
     * STORIES — PATCH
     * =========================================================
     */

    if (
      url.pathname.startsWith(
        "/api/stories/"
      ) &&
      request.method === "PATCH"
    ) {

      const id =
        url.pathname
          .split("/")
          .pop();

      if (
        !/^\d+$/.test(id)
      ) {
        return jsonResponse(
          {
            error:
              "Invalid story ID"
          },
          400
        );
      }

      let body;

      try {
        body =
          await request.json();
      } catch {
        return jsonResponse(
          {
            error:
              "Invalid request body"
          },
          400
        );
      }

      const existing =
        await env.pms_me_db
          .prepare(
            `SELECT *
             FROM stories
             WHERE id = ?`
          )
          .bind(id)
          .first();

      if (!existing) {
        return jsonResponse(
          {
            error:
              "Story not found"
          },
          404
        );
      }

      const action =
        typeof body.action ===
        "string"
          ? body.action
          : "";

      const moderatorNotes =
        typeof body.moderator_notes ===
        "string"
          ? body.moderator_notes.trim()
          : "";

      const title =
        typeof body.title ===
        "string"
          ? body.title.trim()
          : "";

      const category =
        typeof body.category ===
        "string"
          ? body.category.trim()
          : "";

      if (
        ![
          "approve",
          "approve_anonymously",
          "reject",
          "restore_pending"
        ].includes(action)
      ) {
        return jsonResponse(
          {
            error:
              "Invalid moderation action"
          },
          400
        );
      }

      if (
        action === "reject"
      ) {

        await env.pms_me_db
          .prepare(
            `UPDATE stories
             SET status = 'rejected',
                 moderator_notes = ?,
                 published_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          )
          .bind(
            moderatorNotes ||
              null,
            id
          )
          .run();

        try {
          await sendRejectionEmail(
            env,
            existing,
            moderatorNotes
          );
        } catch (error) {
          console.error(
            "Rejection email failed:",
            error
          );
        }

        return jsonResponse({
          ok: true
        });
      }

      if (
        action === "restore_pending"
      ) {
        await env.pms_me_db
          .prepare(
            `UPDATE stories
             SET status = 'pending',
                 published_at = NULL
             WHERE id = ?`
          )
          .bind(id)
          .run();

        return jsonResponse({
          ok: true
        });
      }

      if (!title) {
        return jsonResponse(
          {
            error:
              "A title is required before the story can be approved. Enter a title in the Title field."
          },
          400
        );
      }

      if (
        title.length > 150
      ) {
        return jsonResponse(
          {
            error:
              "Title must be 150 characters or fewer."
          },
          400
        );
      }

      const allowedCategories = [
        "Owner Moaner",
        "Vendor Woes",
        "Legally Blunt",
        "Board to Tears"
      ];

      const finalCategory =
        allowedCategories.includes(
          category
        )
          ? category
          : existing.category;

      const anonymize =
        action ===
        "approve_anonymously";

      let publicName;

      if (anonymize) {
        publicName =
          generateAnonymousName();
      } else if (
        existing.anonymous_requested
      ) {
        publicName =
          generateAnonymousName();
      } else {
        publicName =
          existing.display_name ||
          generateAnonymousName();
      }

      await env.pms_me_db
        .prepare(
          `UPDATE stories
           SET title = ?,
               category = ?,
               status = 'published',
               public_name = ?,
               moderator_notes = ?,
               published_at =
                 CURRENT_TIMESTAMP,
               force_anonymous = ?
           WHERE id = ?`
        )
        .bind(
          title,
          finalCategory,
          publicName,
          moderatorNotes ||
            null,
          anonymize ? 1 : 0,
          id
        )
        .run();

      const publishedStory =
        await env.pms_me_db
          .prepare(
            `SELECT
               id,
               title,
               city,
               story,
               category,
               public_name,
               published_at
             FROM stories
             WHERE id = ?`
          )
          .bind(id)
          .first();

      try {
        await sendPublishedStoryNotifications(
          env,
          publishedStory
        );
      } catch (error) {
        console.error(
          "Published-story notifications failed:",
          error
        );
      }

      return jsonResponse({
        ok: true,
        public_name:
          publicName,
        title,
        category:
          finalCategory
      });
    }

    /*
     * =========================================================
     * STORIES — DELETE
     * =========================================================
     */

    if (
      url.pathname.startsWith(
        "/api/stories/"
      ) &&
      request.method === "DELETE"
    ) {

      const id =
        url.pathname
          .split("/")
          .pop();

      if (
        !/^\d+$/.test(id)
      ) {
        return jsonResponse(
          {
            error:
              "Invalid story ID"
          },
          400
        );
      }

      const result =
        await env.pms_me_db
          .prepare(
            `DELETE FROM stories
             WHERE id = ?`
          )
          .bind(id)
          .run();

      if (
        !result.meta ||
        result.meta.changes === 0
      ) {
        return jsonResponse(
          {
            error:
              "Story not found"
          },
          404
        );
      }

      return jsonResponse({
        ok: true
      });
    }

    /*
     * =========================================================
     * STATIC ASSETS
     * =========================================================
     */

    const assetResponse =
      await env.ASSETS.fetch(
        request
      );

    const contentType =
      assetResponse.headers.get(
        "Content-Type"
      ) || "";

    if (
      contentType
        .toLowerCase()
        .includes("text/html")
    ) {

      const headers =
        new Headers(
          assetResponse.headers
        );

      headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate"
      );

      headers.set(
        "Pragma",
        "no-cache"
      );

      headers.set(
        "Expires",
        "0"
      );

      const html =
        await assetResponse.text();

      headers.delete(
        "Content-Length"
      );

      return new Response(
        applyThemeControls(html),
        {
          status:
            assetResponse.status,
          statusText:
            assetResponse.statusText,
          headers
        }
      );
    }

    return assetResponse;
  },

  async scheduled(
    event,
    env
  ) {

    try {
      await env.pms_me_db
        .prepare(
          `DELETE FROM stories
           WHERE status = 'rejected'
             AND published_at IS NOT NULL
             AND published_at <= datetime('now', '-30 days')`
        )
        .run();
    } catch (error) {
      console.error(
        "Rejected story cleanup failed:",
        error
      );
    }

    try {
      await sendDailyDigest(
        env
      );
    } catch (error) {
      console.error(
        "Moderator daily digest failed:",
        error
      );
    }

    try {
      await sendWeeklyDigests(
        env
      );
    } catch (error) {
      console.error(
        "Weekly user digest failed:",
        error
      );
    }
  }
};
