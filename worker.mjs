// ============================================================
// PMS-ME — Property Manager Stories
// worker.mjs
// ============================================================

// ============================================================
// ANONYMOUS NAME GENERATOR
// ============================================================

function generateAnonymousName() {
  const words = [
    "catliver",
    "toejam",
    "moldyspoon",
    "parkingcone",
    "leakyfaucet",
    "poolnoodle",
    "trashpanda",
    "grassclippings",
    "ducttape",
    "sprinklerhead",
    "mailbox",
    "guttergoblin",
    "hoaferret",
    "sidewalkwizard",
    "assessmentbat",
    "roofpickle",
    "budgetgremlin",
    "boardbanana",
    "vendorwaffle",
    "condopirate"
  ];

  const word =
    words[Math.floor(Math.random() * words.length)];

  const number =
    Math.floor(Math.random() * 900) + 100;

  return `${word}${number}`;
}


// ============================================================
// HTML ESCAPING
// ============================================================

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ============================================================
// EMAIL
// ============================================================

async function sendEmail(env, { to, subject, html }) {
  const response = await fetch(
    "https://api.resend.com/emails",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "PMS-ME <onboarding@resend.dev>",
        to: [to],
        subject,
        html
      })
    }
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Email sending failed: ${text}`
    );
  }

  return response.json();
}


// ============================================================
// NOTIFICATION SETTINGS
// ============================================================

async function getNotificationSettings(env) {
  let result =
    await env.pms_me_db
      .prepare(
        `SELECT id, email, frequency, last_digest_at
         FROM notification_settings
         WHERE id = 1`
      )
      .first();

  if (!result) {
    await env.pms_me_db
      .prepare(
        `INSERT INTO notification_settings
         (id, email, frequency, last_digest_at)
         VALUES (1, NULL, 'off', NULL)`
      )
      .run();

    result = {
      id: 1,
      email: null,
      frequency: "off",
      last_digest_at: null
    };
  }

  return result;
}


// ============================================================
// REJECTION EMAIL
// ============================================================

async function sendRejectionEmail(
  env,
  story,
  reason
) {
  if (!story.email) {
    return;
  }

  const safeReason =
    escapeHtml(reason || "No specific reason was provided.");

  const safeStory =
    escapeHtml(story.story);

  await sendEmail(env, {
    to: story.email,
    subject: "Your PMS-ME story was not published",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;">
        <h2>PMS-ME</h2>

        <p>
          Thank you for submitting a story to PMS-ME.
        </p>

        <p>
          After review, your submission was not approved
          for publication.
        </p>

        <p>
          <strong>Moderator note:</strong><br>
          ${safeReason}
        </p>

        <hr>

        <p>
          <strong>Your submitted story:</strong>
        </p>

        <p>
          ${safeStory}
        </p>
      </div>
    `
  });
}


// ============================================================
// NEW STORY NOTIFICATION
// ============================================================

async function sendNewStoryNotification(
  env,
  story
) {
  const settings =
    await getNotificationSettings(env);

  if (
    settings.frequency !== "immediate" ||
    !settings.email
  ) {
    return;
  }

  const safeStory =
    escapeHtml(story.story);

  const safeCategory =
    escapeHtml(story.category);

  const safeName =
    escapeHtml(story.display_name || "");

  await sendEmail(env, {
    to: settings.email,
    subject: "New PMS-ME story submitted",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;">
        <h2>New PMS-ME Story</h2>

        <p>
          <strong>Category:</strong>
          ${safeCategory}
        </p>

        <p>
          <strong>Submitted by:</strong>
          ${safeName || "Not provided"}
        </p>

        <hr>

        <p>
          ${safeStory}
        </p>

        <p>
          Log in to the PMS-ME moderator page to review
          this submission.
        </p>
      </div>
    `
  });
}


// ============================================================
// DAILY DIGEST
// ============================================================

async function sendDailyDigest(env) {
  const settings =
    await getNotificationSettings(env);

  if (
    settings.frequency !== "daily" ||
    !settings.email
  ) {
    return;
  }

  const stories =
    await env.pms_me_db
      .prepare(
        `SELECT id, story, category, display_name, created_at
         FROM stories
         WHERE status = 'pending'
         ORDER BY created_at ASC`
      )
      .all();

  if (!stories.results.length) {
    return;
  }

  let storyHtml = "";

  for (const story of stories.results) {
    storyHtml += `
      <div style="
        margin-bottom:24px;
        padding-bottom:18px;
        border-bottom:1px solid #ddd;
      ">
        <p>
          <strong>
            ${escapeHtml(story.category)}
          </strong>
        </p>

        <p>
          ${escapeHtml(story.story)}
        </p>

        <p style="color:#666;font-size:13px;">
          Submitted by:
          ${escapeHtml(story.display_name || "Not provided")}
        </p>
      </div>
    `;
  }

  await sendEmail(env, {
    to: settings.email,
    subject: `PMS-ME daily digest — ${stories.results.length} pending`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;">
        <h2>PMS-ME Daily Digest</h2>

        <p>
          You have
          <strong>${stories.results.length}</strong>
          pending story submission(s).
        </p>

        ${storyHtml}
      </div>
    `
  });

  await env.pms_me_db
    .prepare(
      `UPDATE notification_settings
       SET last_digest_at = CURRENT_TIMESTAMP
       WHERE id = 1`
    )
    .run();
}


// ============================================================
// MODERATOR AUTHENTICATION
// ============================================================

function base64UrlEncode(bytes) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
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
      .replace(/_/g, "/")
      .padEnd(
        value.length + (4 - value.length % 4) % 4,
        "="
      );

  const binary = atob(padded);

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}


async function hmacSign(secret, value) {
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


async function createModeratorSession(env) {
  const payload = {
    role: "moderator",
    expires:
      Date.now() + 8 * 60 * 60 * 1000
  };

  const encoded =
    base64UrlEncode(
      new TextEncoder().encode(
        JSON.stringify(payload)
      )
    );

  const signature =
    await hmacSign(
      env.MODERATOR_SESSION_SECRET,
      encoded
    );

  return `${encoded}.${signature}`;
}


async function isModeratorAuthenticated(
  request,
  env
) {
  const cookie =
    request.headers.get("Cookie") || "";

  const match =
    cookie.match(
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

  const encoded = parts[0];
  const signature = parts[1];

  try {
    const expectedSignature =
      await hmacSign(
        env.MODERATOR_SESSION_SECRET,
        encoded
      );

    if (
      signature.length !==
      expectedSignature.length
    ) {
      return false;
    }

    const signatureBytes =
      new TextEncoder().encode(signature);

    const expectedBytes =
      new TextEncoder().encode(
        expectedSignature
      );

    let difference = 0;

    for (
      let i = 0;
      i < signatureBytes.length;
      i++
    ) {
      difference |=
        signatureBytes[i] ^
        expectedBytes[i];
    }

    if (difference !== 0) {
      return false;
    }

    const payload =
      JSON.parse(
        new TextDecoder().decode(
          base64UrlDecode(encoded)
        )
      );

    if (payload.role !== "moderator") {
      return false;
    }

    if (
      !payload.expires ||
      Date.now() > payload.expires
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}


function unauthorizedResponse() {
  return new Response(
    JSON.stringify({
      error: "Unauthorized"
    }),
    {
      status: 401,
      headers: {
        "Content-Type":
          "application/json"
      }
    }
  );
}


// ============================================================
// MODERATOR LOGIN PAGE
// ============================================================

function moderatorLoginPage() {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport"
      content="width=device-width, initial-scale=1.0">
<title>PMS-ME Moderator Login</title>

<style>
body {
  margin: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f4f4;
  font-family: Arial, sans-serif;
}

.login-box {
  width: 100%;
  max-width: 380px;
  background: white;
  padding: 32px;
  box-sizing: border-box;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,.12);
}

h1 {
  margin-top: 0;
  text-align: center;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  font-size: 16px;
  margin-bottom: 16px;
}

button {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  cursor: pointer;
}

#error {
  color: #b00020;
  margin-top: 15px;
  text-align: center;
}
</style>
</head>

<body>

<div class="login-box">

  <h1>PMS-ME Moderator Login</h1>

  <form id="loginForm">

    <label for="password">
      Moderator Password
    </label>

    <input
      id="password"
      type="password"
      autocomplete="current-password"
      required
    >

    <button type="submit">
      Log In
    </button>

    <div id="error"></div>

  </form>

</div>

<script>
document
  .getElementById("loginForm")
  .addEventListener("submit", async function(event) {

    event.preventDefault();

    const error =
      document.getElementById("error");

    error.textContent = "";

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
            body:
              JSON.stringify({
                password:
                  document.getElementById(
                    "password"
                  ).value
              })
          }
        );

      if (!response.ok) {
        error.textContent =
          "Incorrect password.";
        return;
      }

      window.location.href =
        "/moderate.html";

    } catch (err) {

      error.textContent =
        "Unable to log in. Please try again.";
    }
  });
</script>

</body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type":
          "text/html; charset=UTF-8",
        "Cache-Control":
          "no-store"
      }
    }
  );
}


// ============================================================
// WORKER
// ============================================================

export default {

  async fetch(request, env) {

    const url =
      new URL(request.url);

    // ========================================================
    // MODERATOR LOGIN
    // ========================================================

    if (
      url.pathname ===
      "/api/moderator-login" &&
      request.method === "POST"
    ) {

      try {

        const body =
          await request.json();

        const password =
          body.password || "";

        if (
          !env.MODERATOR_PASSWORD ||
          !env.MODERATOR_SESSION_SECRET
        ) {
          return new Response(
            JSON.stringify({
              error:
                "Moderator authentication is not configured."
            }),
            {
              status: 500,
              headers: {
                "Content-Type":
                  "application/json"
              }
            }
          );
        }

        if (
          password !==
          env.MODERATOR_PASSWORD
        ) {
          return new Response(
            JSON.stringify({
              error:
                "Invalid password"
            }),
            {
              status: 401,
              headers: {
                "Content-Type":
                  "application/json"
              }
            }
          );
        }

        const session =
          await createModeratorSession(
            env
          );

        return new Response(
          JSON.stringify({
            success: true
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
              "Set-Cookie":
                `pms_me_moderator=${session}; Path=/; Max-Age=28800; HttpOnly; Secure; SameSite=Strict`
            }
          }
        );

      } catch (error) {

        return new Response(
          JSON.stringify({
            error:
              "Invalid login request"
          }),
          {
            status: 400,
            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );
      }
    }


    // ========================================================
    // MODERATOR LOGOUT
    // ========================================================

    if (
      url.pathname ===
      "/api/moderator-logout" &&
      request.method === "POST"
    ) {

      return new Response(
        JSON.stringify({
          success: true
        }),
        {
          status: 200,
          headers: {
            "Content-Type":
              "application/json",
            "Set-Cookie":
              "pms_me_moderator=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict"
          }
        }
      );
    }


    // ========================================================
    // MODERATOR PAGE
    // ========================================================

    if (
      url.pathname ===
      "/moderate.html"
    ) {

      const authenticated =
        await isModeratorAuthenticated(
          request,
          env
        );

      if (!authenticated) {
        return moderatorLoginPage();
      }
    }


    // ========================================================
    // NOTIFICATION SETTINGS
    // ========================================================

    if (
      url.pathname ===
      "/api/notification-settings"
    ) {

      const authenticated =
        await isModeratorAuthenticated(
          request,
          env
        );

      if (!authenticated) {
        return unauthorizedResponse();
      }

      if (request.method === "GET") {

        const settings =
          await getNotificationSettings(
            env
          );

        return new Response(
          JSON.stringify(settings),
          {
            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );
      }


      if (request.method === "PUT") {

        const body =
          await request.json();

        const email =
          body.email || null;

        const frequency =
          body.frequency || "off";

        const validFrequencies = [
          "off",
          "immediate",
          "daily"
        ];

        if (
          !validFrequencies.includes(
            frequency
          )
        ) {
          return new Response(
            JSON.stringify({
              error:
                "Invalid notification frequency"
            }),
            {
              status: 400,
              headers: {
                "Content-Type":
                  "application/json"
              }
            }
          );
        }

        await env.pms_me_db
          .prepare(
            `UPDATE notification_settings
             SET email = ?, frequency = ?
             WHERE id = 1`
          )
          .bind(
            email,
            frequency
          )
          .run();

        return new Response(
          JSON.stringify({
            success: true
          }),
          {
            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );
      }
    }


    // ========================================================
    // STORIES
    // ========================================================

    if (
      url.pathname ===
      "/api/stories"
    ) {

      // ------------------------------------------------------
      // GET STORIES
      // ------------------------------------------------------

      if (request.method === "GET") {

        const status =
          url.searchParams.get(
            "status"
          );

        // Public site:
        // /api/stories
        if (!status) {

          const results =
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
                 ORDER BY
                   published_at DESC,
                   id DESC`
              )
              .all();

          return new Response(
            JSON.stringify(
              results.results
            ),
            {
              headers: {
                "Content-Type":
                  "application/json"
              }
            }
          );
        }

        // Moderator:
        // /api/stories?status=pending
        const authenticated =
          await isModeratorAuthenticated(
            request,
            env
          );

        if (!authenticated) {
          return unauthorizedResponse();
        }

        const results =
          await env.pms_me_db
            .prepare(
              `SELECT *
               FROM stories
               WHERE status = ?
               ORDER BY created_at ASC`
            )
            .bind(status)
            .all();

        return new Response(
          JSON.stringify(
            results.results
          ),
          {
            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );
      }


      // ------------------------------------------------------
      // SUBMIT STORY
      // ------------------------------------------------------

      if (request.method === "POST") {

        try {

          const body =
            await request.json();

          const story =
            String(
              body.story || ""
            ).trim();

          const category =
            String(
              body.category || ""
            ).trim();

          const displayName =
            String(
              body.display_name || ""
            ).trim();

          const email =
            String(
              body.email || ""
            ).trim();

          const anonymousRequested =
            body.anonymous_requested
              ? 1
              : 0;

          if (!story) {
            return new Response(
              JSON.stringify({
                error:
                  "Story is required."
              }),
              {
                status: 400,
                headers: {
                  "Content-Type":
                    "application/json"
                }
              }
            );
          }

          if (!category) {
            return new Response(
              JSON.stringify({
                error:
                  "Category is required."
              }),
              {
                status: 400,
                headers: {
                  "Content-Type":
                    "application/json"
                }
              }
            );
          }

          if (story.length > 2000) {
            return new Response(
              JSON.stringify({
                error:
                  "Story must be 2000 characters or fewer."
              }),
              {
                status: 400,
                headers: {
                  "Content-Type":
                    "application/json"
                }
              }
            );
          }

          const result =
            await env.pms_me_db
              .prepare(
                `INSERT INTO stories
                 (
                   story,
                   category,
                   display_name,
                   email,
                   anonymous_requested,
                   force_anonymous,
                   public_name,
                   status
                 )
                 VALUES (?, ?, ?, ?, ?, 0, NULL, 'pending')`
              )
              .bind(
                story,
                category,
                displayName || null,
                email || null,
                anonymousRequested
              )
              .run();

          const storyId =
            result.meta.last_row_id;

          const newStory =
            await env.pms_me_db
              .prepare(
                `SELECT *
                 FROM stories
                 WHERE id = ?`
              )
              .bind(storyId)
              .first();

          try {
            await sendNewStoryNotification(
              env,
              newStory
            );
          } catch (emailError) {
            console.error(
              "New story notification failed:",
              emailError
            );
          }

          return new Response(
            JSON.stringify({
              success: true,
              id: storyId
            }),
            {
              status: 201,
              headers: {
                "Content-Type":
                  "application/json"
              }
            }
          );

        } catch (error) {

          console.error(
            "Story submission error:",
            error
          );

          return new Response(
            JSON.stringify({
              error:
                "Unable to submit story."
            }),
            {
              status: 500,
              headers: {
                "Content-Type":
                  "application/json"
              }
            }
          );
        }
      }
    }


    // ========================================================
    // DELETE STORY
    // ========================================================

    if (
      request.method === "DELETE" &&
      url.pathname.startsWith(
        "/api/stories/"
      )
    ) {

      const authenticated =
        await isModeratorAuthenticated(
          request,
          env
        );

      if (!authenticated) {
        return unauthorizedResponse();
      }

      const id =
        url.pathname.split("/").pop();

      if (!id) {
        return new Response(
          JSON.stringify({
            error:
              "Story ID is required."
          }),
          {
            status: 400,
            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );
      }

      await env.pms_me_db
        .prepare(
          `DELETE FROM stories
           WHERE id = ?`
        )
        .bind(id)
        .run();

      return new Response(
        JSON.stringify({
          success: true
        }),
        {
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }


    // ========================================================
    // UPDATE / MODERATE STORY
    // ========================================================

    if (
      request.method === "PATCH" &&
      url.pathname.startsWith(
        "/api/stories/"
      )
    ) {

      const authenticated =
        await isModeratorAuthenticated(
          request,
          env
        );

      if (!authenticated) {
        return unauthorizedResponse();
      }

      const id =
        url.pathname.split("/").pop();

      const body =
        await request.json();

      const action =
        body.action || "";

      const moderatorNotes =
        body.moderator_notes || "";

      // ------------------------------------------------------
      // APPROVE
      // ------------------------------------------------------

      if (
        action === "approve"
      ) {

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
          return new Response(
            JSON.stringify({
              error:
                "Story not found."
            }),
            {
              status: 404,
              headers: {
                "Content-Type":
                  "application/json"
              }
            }
          );
        }

        let publicName =
          existing.display_name ||
          "propertymanager";

        if (
          existing.anonymous_requested ||
          existing.force_anonymous
        ) {
          publicName =
            existing.public_name ||
            generateAnonymousName();
        }

        await env.pms_me_db
          .prepare(
            `UPDATE stories
             SET
               status = 'published',
               public_name = ?,
               moderator_notes = ?,
               published_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          )
          .bind(
            publicName,
            moderatorNotes,
            id
          )
          .run();

        return new Response(
          JSON.stringify({
            success: true
          }),
          {
            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );
      }


      // ------------------------------------------------------
      // APPROVE ANONYMOUSLY
      // ------------------------------------------------------

      if (
        action ===
        "approve_anonymously"
      ) {

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
          return new Response(
            JSON.stringify({
              error:
                "Story not found."
            }),
            {
              status: 404,
              headers: {
                "Content-Type":
                  "application/json"
              }
            }
          );
        }

        const publicName =
          generateAnonymousName();

        await env.pms_me_db
          .prepare(
            `UPDATE stories
             SET
               status = 'published',
               force_anonymous = 1,
               public_name = ?,
               moderator_notes = ?,
               published_at = CURRENT_TIMESTAMP
             WHERE id = ?`
          )
          .bind(
            publicName,
            moderatorNotes,
            id
          )
          .run();

        return new Response(
          JSON.stringify({
            success: true,
            public_name: publicName
          }),
          {
            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );
      }


      // ------------------------------------------------------
      // REJECT
      // ------------------------------------------------------

      if (
        action === "reject"
      ) {

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
          return new Response(
            JSON.stringify({
              error:
                "Story not found."
            }),
            {
              status: 404,
              headers: {
                "Content-Type":
                  "application/json"
              }
            }
          );
        }

        await env.pms_me_db
          .prepare(
            `UPDATE stories
             SET
               status = 'rejected',
               moderator_notes = ?
             WHERE id = ?`
          )
          .bind(
            moderatorNotes,
            id
          )
          .run();

        try {
          await sendRejectionEmail(
            env,
            existing,
            moderatorNotes
          );
        } catch (emailError) {
          console.error(
            "Rejection email failed:",
            emailError
          );
        }

        return new Response(
          JSON.stringify({
            success: true
          }),
          {
            headers: {
              "Content-Type":
                "application/json"
            }
          }
        );
      }


      return new Response(
        JSON.stringify({
          error:
            "Invalid moderation action."
        }),
        {
          status: 400,
          headers: {
            "Content-Type":
              "application/json"
          }
        }
      );
    }


    // ========================================================
    // EVERYTHING ELSE — STATIC ASSETS
    // ========================================================

    return env.ASSETS.fetch(
      request
    );
  },


  // ==========================================================
  // DAILY CRON
  // ==========================================================

  async scheduled(
    event,
    env,
    ctx
  ) {

    ctx.waitUntil(
      sendDailyDigest(env)
        .catch(error => {
          console.error(
            "Daily digest failed:",
            error
          );
        })
    );
  }

};
