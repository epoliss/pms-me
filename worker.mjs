// PMS-ME deployment trigger 3

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

  const word = words[Math.floor(Math.random() * words.length)];
  const number = Math.floor(100 + Math.random() * 900);

  return `${word}${number}`;
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  });
}

function htmlResponse(html, status = 200, extraHeaders = {}) {
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...extraHeaders
    }
  });
}

function base64UrlEncode(bytes) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, i + chunkSize)
    );
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (value.length % 4)) % 4);

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

async function hmacSign(value, secret) {
  const keyData = new TextEncoder().encode(secret);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );

  return base64UrlEncode(new Uint8Array(signature));
}

async function createModeratorSession(env) {
  const expiresAt = Date.now() + 8 * 60 * 60 * 1000;

  const payload = base64UrlEncode(
    new TextEncoder().encode(String(expiresAt))
  );

  const signature = await hmacSign(
    payload,
    env.MODERATOR_SESS_SEC
  );

  return `${payload}.${signature}`;
}

async function isModeratorAuthenticated(request, env) {
  if (!env.MODERATOR_SESS_SEC) {
    return false;
  }

  const cookieHeader = request.headers.get("Cookie") || "";

  const match = cookieHeader.match(
    /(?:^|;\s*)pms_me_moderator=([^;]+)/
  );

  if (!match) {
    return false;
  }

  const token = match[1];
  const parts = token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const [payload, suppliedSignature] = parts;

  let expectedSignature;

  try {
    expectedSignature = await hmacSign(
      payload,
      env.MODERATOR_SESS_SEC
    );
  } catch {
    return false;
  }

  if (expectedSignature !== suppliedSignature) {
    return false;
  }

  let expiresAt;

  try {
    expiresAt = Number(
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

function moderatorLoginPage() {
  return htmlResponse(
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
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
    <label for="password">Password</label>

    <input
      id="password"
      name="password"
      type="password"
      autocomplete="current-password"
      required
      autofocus
    >

    <button type="submit">Log In</button>
  </form>
</div>

<script>
const form = document.getElementById("loginForm");
const password = document.getElementById("password");
const error = document.getElementById("error");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  error.style.display = "none";

  try {
    const response = await fetch("/api/moderator-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({
        password: password.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      error.textContent =
        data.error || "Login failed.";

      error.style.display = "block";
      password.select();
      return;
    }

    window.location.href = "/moderate.html";

  } catch (err) {
    error.textContent =
      "Unable to contact the server.";

    error.style.display = "block";
  }
});
</script>

</body>
</html>`,
    401,
    {
      "Cache-Control": "no-store"
    }
  );
}

async function sendEmail(env, to, subject, text, html = null) {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing");
  }

  const emailBody = {
    from: "PMS-ME <onboarding@resend.dev>",
    to: [to],
    subject,
    text
  };

  if (html) {
    emailBody.html = html;
  }

  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(emailBody)
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Email sending failed: ${body}`
    );
  }

  return response.json();
}

async function sendNewStoryNotification(env, story) {
  const settings = await env.pms_me_db
    .prepare(
      `SELECT email, frequency
       FROM notification_settings
       WHERE id = 1`
    )
    .first();

  if (!settings || !settings.email) {
    return;
  }

  if (settings.frequency !== "immediately") {
    return;
  }

  const subject =
    "PMS-ME — New Story Submitted";

  const text =
`A new story has been submitted to PMS-ME.

Category: ${story.category}

Display Name: ${story.display_name || "(not provided)"}

Anonymous Requested: ${
  story.anonymous_requested ? "Yes" : "No"
}

Story:

${story.story}

Review it in the moderator dashboard:
https://pms-me-site.epoliss.workers.dev/moderate.html`;

  await sendEmail(
    env,
    settings.email,
    subject,
    text
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendRejectionEmail(env, story, reason) {
  if (!story.email) {
    return;
  }

  const subject =
    "PMS-ME — Story Submission Update";

  const moderatorComment =
    reason ||
    "The submission did not meet the site's submission guidelines.";

  const text =
`Hello ${story.display_name || "there"},

Your story submitted to PMS-ME was not approved for publication.

Moderator's comment

${moderatorComment}

Your submitted story

${story.story}

Thank you,

PMS-ME — Property Manager Stories`;

  const html =
`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>

<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#222222;">

<div style="max-width:600px;margin:0 auto;padding:32px 24px;">

  <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">
    Hello <strong>${escapeHtml(story.display_name || "there")}</strong>,
  </p>

  <p style="margin:0 0 28px;font-size:16px;line-height:1.6;">
    Your story submitted to PMS-ME was not approved for publication.
  </p>

  <p style="margin:0 0 8px;font-size:16px;line-height:1.5;">
    <strong>Moderator's comment</strong>
  </p>

  <div style="background:#f2f2f2;padding:14px 16px;margin:0 0 24px;font-size:16px;line-height:1.6;">
    ${escapeHtml(moderatorComment).replace(/\n/g, "<br>")}
  </div>

  <p style="margin:0 0 8px;font-size:16px;line-height:1.5;">
    <strong>Your submitted story</strong>
  </p>

  <div style="background:#f2f2f2;padding:14px 16px;margin:0 0 28px;font-size:16px;line-height:1.6;">
    ${escapeHtml(story.story).replace(/\n/g, "<br>")}
  </div>

  <p style="margin:0;font-size:16px;line-height:1.6;">
    Thank you,
  </p>

  <p style="margin:4px 0 0;font-size:16px;line-height:1.6;">
    <strong>PMS-ME — Property Manager Stories</strong>
  </p>

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

async function sendDailyDigest(env) {
  const settings = await env.pms_me_db
    .prepare(
      `SELECT email, frequency, last_digest_at
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

  const stories = await env.pms_me_db
    .prepare(
      `SELECT id, story, category, display_name,
              anonymous_requested, created_at
       FROM stories
       WHERE status = 'pending'
       ORDER BY created_at ASC`
    )
    .all();

  if (!stories.results || stories.results.length === 0) {
    return;
  }

  const lines = [];

  lines.push(
    "The following PMS-ME stories are awaiting moderation."
  );
  lines.push("");

  for (const story of stories.results) {
    lines.push(`ID: ${story.id}`);
    lines.push(`Category: ${story.category}`);
    lines.push(
      `Display Name: ${story.display_name || "(not provided)"}`
    );
    lines.push(
      `Anonymous Requested: ${
        story.anonymous_requested ? "Yes" : "No"
      }`
    );
    lines.push("");
    lines.push(story.story);
    lines.push("");
    lines.push("------------------------------");
    lines.push("");
  }

  lines.push(
    "Moderator dashboard:"
  );
  lines.push(
    "https://pms-me-site.epoliss.workers.dev/moderate.html"
  );

  await sendEmail(
    env,
    settings.email,
    "PMS-ME — Daily Story Digest",
    lines.join("\n")
  );

  await env.pms_me_db
    .prepare(
      `UPDATE notification_settings
       SET last_digest_at = CURRENT_TIMESTAMP
       WHERE id = 1`
    )
    .run();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    /*
     * =========================================================
     * MODERATOR PAGE
     * =========================================================
     */
    if (url.pathname === "/moderate.html") {
      if (!(await isModeratorAuthenticated(request, env))) {
        return moderatorLoginPage();
      }
    }

    /*
     * =========================================================
     * MODERATOR LOGIN
     * =========================================================
     */
    if (
      url.pathname === "/api/moderator-login" &&
      request.method === "POST"
    ) {
      if (!env.MODERATOR_PASSWORD) {
        return jsonResponse(
          {
            error: "MODERATOR_PASSWORD is missing"
          },
          500
        );
      }

      if (!env.MODERATOR_SESS_SEC) {
        return jsonResponse(
          {
            error: "MODERATOR_SESS_SEC is missing"
          },
          500
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return jsonResponse(
          { error: "Invalid request body" },
          400
        );
      }

      if (
        !body ||
        typeof body.password !== "string"
      ) {
        return jsonResponse(
          { error: "Password is required" },
          400
        );
      }

      if (body.password !== env.MODERATOR_PASSWORD) {
        return jsonResponse(
          { error: "Invalid password" },
          401
        );
      }

      const session =
        await createModeratorSession(env);

      return jsonResponse(
        { ok: true },
        200,
        {
          "Set-Cookie":
            `pms_me_moderator=${session}; ` +
            "Path=/; " +
            "HttpOnly; " +
            "Secure; " +
            "SameSite=Strict; " +
            "Max-Age=28800",
          "Cache-Control": "no-store"
        }
      );
    }

    /*
     * =========================================================
     * MODERATOR LOGOUT
     * =========================================================
     */
    if (
      url.pathname === "/api/moderator-logout" &&
      request.method === "POST"
    ) {
      return jsonResponse(
        { ok: true },
        200,
        {
          "Set-Cookie":
            "pms_me_moderator=; " +
            "Path=/; " +
            "HttpOnly; " +
            "Secure; " +
            "SameSite=Strict; " +
            "Max-Age=0",
          "Cache-Control": "no-store"
        }
      );
    }

    /*
     * =========================================================
     * MODERATOR API AUTHENTICATION
     * =========================================================
     */
    const isModeratorApi =
      url.pathname === "/api/notification-settings" ||
      (
        url.pathname.startsWith("/api/stories") &&
        (
          url.searchParams.has("status") ||
          request.method === "PATCH" ||
          request.method === "DELETE"
        )
      );

    if (isModeratorApi) {
      if (
        !(await isModeratorAuthenticated(request, env))
      ) {
        return unauthorizedResponse();
      }
    }

    /*
     * =========================================================
     * NOTIFICATION SETTINGS
     * =========================================================
     */
    if (
      url.pathname === "/api/notification-settings"
    ) {
      if (request.method === "GET") {
        const settings =
          await env.pms_me_db
            .prepare(
              `SELECT email, frequency, last_digest_at
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

      if (request.method === "PUT") {
        let body;

        try {
          body = await request.json();
        } catch {
          return jsonResponse(
            { error: "Invalid request body" },
            400
          );
        }

        const email =
          typeof body.email === "string"
            ? body.email.trim()
            : "";

        const frequency =
          ["off", "immediately", "daily"].includes(
            body.frequency
          )
            ? body.frequency
            : "off";

        await env.pms_me_db
          .prepare(
            `UPDATE notification_settings
             SET email = ?, frequency = ?
             WHERE id = 1`
          )
          .bind(email || null, frequency)
          .run();

        return jsonResponse({
          ok: true,
          email,
          frequency
        });
      }

      return jsonResponse(
        { error: "Method not allowed" },
        405
      );
    }

    /*
     * =========================================================
     * STORIES — GET
     * =========================================================
     */
    if (
      url.pathname === "/api/stories" &&
      request.method === "GET"
    ) {
      const status =
        url.searchParams.get("status");

      if (status) {
        const result =
          await env.pms_me_db
            .prepare(
              `SELECT
                 id,
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
      url.pathname === "/api/stories" &&
      request.method === "POST"
    ) {
      let body;

      try {
        body = await request.json();
      } catch {
        return jsonResponse(
          { error: "Invalid request body" },
          400
        );
      }

      const story =
        typeof body.story === "string"
          ? body.story.trim()
          : "";

      const category =
        typeof body.category === "string"
          ? body.category.trim()
          : "";

      const displayName =
        typeof body.display_name === "string"
          ? body.display_name.trim()
          : "";

      const email =
        typeof body.email === "string"
          ? body.email.trim()
          : "";

      const anonymousRequested =
        body.anonymous_requested ? 1 : 0;

      if (!story) {
        return jsonResponse(
          { error: "Story is required" },
          400
        );
      }

      if (!category) {
        return jsonResponse(
          { error: "Category is required" },
          400
        );
      }

      if (story.length > 2000) {
        return jsonResponse(
          {
            error:
              "Story must be 2000 characters or fewer."
          },
          400
        );
      }

      const allowedCategories = [
        "Homeowner of the Year",
        "Vendor Blues",
        "Legally Blunt",
        "Board to Tears",
        "Audit This"
      ];

      if (!allowedCategories.includes(category)) {
        return jsonResponse(
          { error: "Invalid category" },
          400
        );
      }

      const result =
        await env.pms_me_db
          .prepare(
            `INSERT INTO stories (
               story,
               category,
               display_name,
               email,
               anonymous_requested,
               status
             )
             VALUES (?, ?, ?, ?, ?, 'pending')`
          )
          .bind(
            story,
            category,
            displayName || null,
            email || null,
            anonymousRequested
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
          .bind(insertedId)
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
     * STORIES — PATCH
     * =========================================================
     */
    if (
      url.pathname.startsWith("/api/stories/") &&
      request.method === "PATCH"
    ) {
      const id =
        url.pathname.split("/").pop();

      if (!/^\d+$/.test(id)) {
        return jsonResponse(
          { error: "Invalid story ID" },
          400
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return jsonResponse(
          { error: "Invalid request body" },
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
          { error: "Story not found" },
          404
        );
      }

      const action =
        typeof body.action === "string"
          ? body.action
          : "";

      const moderatorNotes =
        typeof body.moderator_notes === "string"
          ? body.moderator_notes.trim()
          : "";

      if (
        ![
          "approve",
          "approve_anonymously",
          "reject"
        ].includes(action)
      ) {
        return jsonResponse(
          { error: "Invalid moderation action" },
          400
        );
      }

      /*
       * =======================================================
       * REJECT
       * =======================================================
       */
      if (action === "reject") {
        await env.pms_me_db
          .prepare(
            `UPDATE stories
             SET status = 'rejected',
                 moderator_notes = ?
             WHERE id = ?`
          )
          .bind(
            moderatorNotes || null,
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

      /*
       * =======================================================
       * APPROVAL
       * =======================================================
       *
       * The moderator may change the category before approval.
       */
      const allowedCategories = [
        "Homeowner of the Year",
        "Vendor Blues",
        "Legally Blunt",
        "Board to Tears",
        "Audit This"
      ];

      const requestedCategory =
        typeof body.category === "string"
          ? body.category.trim()
          : existing.category;

      if (
        !allowedCategories.includes(
          requestedCategory
        )
      ) {
        return jsonResponse(
          { error: "Invalid category" },
          400
        );
      }

      const anonymize =
        action === "approve_anonymously";

      let publicName;

      if (anonymize) {
        publicName =
          generateAnonymousName();
      } else if (existing.anonymous_requested) {
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
           SET status = 'published',
               category = ?,
               public_name = ?,
               moderator_notes = ?,
               published_at = CURRENT_TIMESTAMP,
               force_anonymous = ?
           WHERE id = ?`
        )
        .bind(
          requestedCategory,
          publicName,
          moderatorNotes || null,
          anonymize ? 1 : 0,
          id
        )
        .run();

      return jsonResponse({
        ok: true,
        public_name: publicName,
        category: requestedCategory
      });
    }

    /*
     * =========================================================
     * STORIES — DELETE
     * =========================================================
     */
    if (
      url.pathname.startsWith("/api/stories/") &&
      request.method === "DELETE"
    ) {
      const id =
        url.pathname.split("/").pop();

      if (!/^\d+$/.test(id)) {
        return jsonResponse(
          { error: "Invalid story ID" },
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
          { error: "Story not found" },
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
    return env.ASSETS.fetch(request);
  },

  async scheduled(event, env) {
    try {
      await sendDailyDigest(env);
    } catch (error) {
      console.error(
        "Daily digest failed:",
        error
      );
    }
  }
};
