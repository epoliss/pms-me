function generateAnonymousName() {
const words = [
"catliver",
"toenail",
"hamster",
"pickle",
"waffle",
"turnip",
"goose",
"meatball",
"pigeon",
"muffin",
"spatula",
"cabbage",
"banjo",
"squirrel",
"potato",
"nacho",
"penguin",
"mustache",
"noodle",
"donut",
"walrus",
"tater",
"beetle",
"picklejuice",
"moose",
"rubberduck"
];

const word =
words[Math.floor(Math.random() * words.length)];

const number =
Math.floor(Math.random() * 900) + 100;

return word + number;
}

function escapeHtml(value) {
return String(value || "")
.replace(/&/g, "&")
.replace(/</g, "<")
.replace(/>/g, ">")
.replace(/"/g, """)
.replace(/'/g, "'");
}

async function sendEmail(env, emailData) {
const response = await fetch(
"https://api.resend.com/emails",
{
method: "POST",
headers: {
"Authorization":
"Bearer " + env.RESEND_API_KEY,
"Content-Type":
"application/json"
},
body: JSON.stringify(emailData)
}
);

if (!response.ok) {
const errorText =
await response.text();

```
throw new Error(
  "Email sending failed: " +
  errorText
);
```

}

return response;
}

async function getNotificationSettings(env) {
return await env.pms_me_db
.prepare(
"SELECT id, email, frequency, last_digest_at " +
"FROM notification_settings " +
"WHERE id = 1"
)
.first();
}

async function sendRejectionEmail(
env,
email,
displayName,
story,
moderatorNotes
) {
if (!email) {
return;
}

const message =
moderatorNotes ||
"Your story was not approved for publication.";

const greetingName =
displayName || "there";

const safeGreetingName =
escapeHtml(greetingName);

const safeMessage =
escapeHtml(message);

const safeStory =
escapeHtml(story);

const html =
"<!DOCTYPE html>" +
"<html>" +
"<head>" +
'<meta charset="UTF-8">' +
"<title>Your PMS-ME story was not approved</title>" +
"</head>" +
'<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#222222;">' +
'<div style="max-width:680px;margin:30px auto;background-color:#ffffff;padding:32px;border:1px solid #dddddd;">' +

```
'<p style="margin:0 0 22px 0;font-size:16px;line-height:1.5;">' +
"Hello <strong>" +
safeGreetingName +
"</strong>," +
"</p>" +

'<p style="margin:0 0 24px 0;font-size:16px;line-height:1.5;">' +
"Your story submitted to PMS-ME was not approved for publication." +
"</p>" +

'<p style="margin:0 0 8px 0;font-size:15px;font-weight:bold;">' +
"Moderator's comment" +
"</p>" +

'<div style="margin:0 0 26px 18px;padding:14px 18px;background-color:#f3f3f3;border-left:4px solid #777777;font-family:Georgia,Times New Roman,serif;font-size:16px;line-height:1.6;white-space:pre-wrap;">' +
safeMessage +
"</div>" +

'<p style="margin:0 0 8px 0;font-size:15px;font-weight:bold;">' +
"Your submitted story" +
"</p>" +

'<div style="margin:0 0 28px 18px;padding:14px 18px;background-color:#f3f3f3;border-left:4px solid #777777;font-family:Georgia,Times New Roman,serif;font-size:16px;line-height:1.6;white-space:pre-wrap;">' +
safeStory +
"</div>" +

'<p style="margin:0;font-size:16px;line-height:1.5;">' +
"Thank you," +
"</p>" +

'<p style="margin:4px 0 0 0;font-size:16px;line-height:1.5;font-weight:bold;">' +
"PMS-ME — Property Manager Stories" +
"</p>" +

"</div>" +
"</body>" +
"</html>";
```

const text =
"Hello " +
greetingName +
",\n\n" +
"Your story submitted to PMS-ME was not approved for publication.\n\n" +
"MODERATOR'S COMMENT:\n\n" +
"    " +
message +
"\n\n" +
"YOUR SUBMITTED STORY:\n\n" +
"    " +
story +
"\n\n" +
"Thank you,\n\n" +
"PMS-ME — Property Manager Stories";

await sendEmail(env, {
from:
"PMS-ME [onboarding@resend.dev](mailto:onboarding@resend.dev)",
to: [email],
subject:
"Your PMS-ME story was not approved",
html: html,
text: text
});
}

async function sendNewStoryNotification(
env,
storyId,
story,
category,
displayName,
anonymousRequested
) {
const settings =
await getNotificationSettings(env);

if (
!settings ||
settings.frequency !== "immediate" ||
!settings.email
) {
return;
}

const safeStory =
escapeHtml(story);

const safeCategory =
escapeHtml(category);

const safeDisplayName =
escapeHtml(displayName || "Not provided");

const anonymousText =
anonymousRequested
? "Yes"
: "No";

const html =
"<!DOCTYPE html>" +
"<html>" +
"<head>" +
'<meta charset="UTF-8">' +
"<title>New PMS-ME Story Submitted</title>" +
"</head>" +
'<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#222222;">' +
'<div style="max-width:680px;margin:30px auto;background-color:#ffffff;padding:32px;border:1px solid #dddddd;">' +

```
'<h2 style="margin:0 0 24px 0;">New PMS-ME Story Submitted</h2>' +

'<p><strong>Story ID:</strong> ' +
storyId +
"</p>" +

'<p><strong>Category:</strong> ' +
safeCategory +
"</p>" +

'<p><strong>Display name:</strong> ' +
safeDisplayName +
"</p>" +

'<p><strong>Requested anonymous:</strong> ' +
anonymousText +
"</p>" +

'<p style="margin:24px 0 8px 0;font-weight:bold;">Submitted story</p>' +

'<div style="padding:16px 18px;background-color:#f3f3f3;border-left:4px solid #777777;font-family:Georgia,Times New Roman,serif;font-size:16px;line-height:1.6;white-space:pre-wrap;">' +
safeStory +
"</div>" +

'<p style="margin-top:28px;">Log in to the PMS-ME moderator page to review this story.</p>' +

"</div>" +
"</body>" +
"</html>";
```

const text =
"NEW PMS-ME STORY SUBMITTED\n\n" +
"Story ID: " +
storyId +
"\n" +
"Category: " +
category +
"\n" +
"Display name: " +
(displayName || "Not provided") +
"\n" +
"Requested anonymous: " +
anonymousText +
"\n\n" +
"SUBMITTED STORY:\n\n" +
story;

try {
await sendEmail(env, {
from:
"PMS-ME [onboarding@resend.dev](mailto:onboarding@resend.dev)",
to: [settings.email],
subject:
"New PMS-ME story submitted (#" +
storyId +
")",
html: html,
text: text
});
} catch (error) {
console.error(
"Immediate notification failed:",
error.message
);
}
}

async function sendDailyDigest(env) {
const settings =
await getNotificationSettings(env);

if (
!settings ||
settings.frequency !== "daily" ||
!settings.email
) {
return;
}

const digestCutoff =
new Date().toISOString();

let query =
"SELECT id, story, category, display_name, " +
"anonymous_requested, created_at " +
"FROM stories " +
"WHERE created_at <= ? ";

const bindings = [
digestCutoff
];

if (settings.last_digest_at) {
query +=
"AND created_at > ? ";

```
bindings.push(
  settings.last_digest_at
);
```

}

query +=
"ORDER BY created_at ASC";

const result =
await env.pms_me_db
.prepare(query)
.bind(...bindings)
.all();

const stories =
result.results || [];

if (stories.length === 0) {
await env.pms_me_db
.prepare(
"UPDATE notification_settings " +
"SET last_digest_at = ? " +
"WHERE id = 1"
)
.bind(digestCutoff)
.run();

```
return;
```

}

let htmlStories = "";
let textStories = "";

for (const item of stories) {
htmlStories +=
'<div style="margin:0 0 28px 0;padding:18px;background-color:#f3f3f3;border:1px solid #dddddd;">' +

```
  '<p style="margin:0 0 8px 0;"><strong>Story #' +
  item.id +
  "</strong> — " +
  escapeHtml(item.category) +
  "</p>" +

  '<p style="margin:0 0 8px 0;"><strong>Display name:</strong> ' +
  escapeHtml(
    item.display_name ||
    "Not provided"
  ) +
  "</p>" +

  '<p style="margin:0 0 8px 0;"><strong>Requested anonymous:</strong> ' +
  (
    item.anonymous_requested
      ? "Yes"
      : "No"
  ) +
  "</p>" +

  '<div style="margin-top:14px;font-family:Georgia,Times New Roman,serif;font-size:16px;line-height:1.6;white-space:pre-wrap;">' +
  escapeHtml(item.story) +
  "</div>" +

  "</div>";

textStories +=
  "STORY #" +
  item.id +
  "\n" +
  "Category: " +
  item.category +
  "\n" +
  "Display name: " +
  (
    item.display_name ||
    "Not provided"
  ) +
  "\n" +
  "Requested anonymous: " +
  (
    item.anonymous_requested
      ? "Yes"
      : "No"
  ) +
  "\n\n" +
  item.story +
  "\n\n" +
  "----------------------------------------\n\n";
```

}

const html =
"<!DOCTYPE html>" +
"<html>" +
"<head>" +
'<meta charset="UTF-8">' +
"<title>PMS-ME Daily Digest</title>" +
"</head>" +
'<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#222222;">' +
'<div style="max-width:680px;margin:30px auto;background-color:#ffffff;padding:32px;border:1px solid #dddddd;">' +

```
'<h2 style="margin:0 0 10px 0;">PMS-ME Daily Digest</h2>' +

'<p style="margin:0 0 28px 0;">' +
stories.length +
(
  stories.length === 1
    ? " new story was"
    : " new stories were"
) +
" submitted since the previous digest.</p>" +

htmlStories +

'<p style="margin-top:28px;">Review these submissions on the PMS-ME moderator page.</p>' +

"</div>" +
"</body>" +
"</html>";
```

const text =
"PMS-ME DAILY DIGEST\n\n" +
stories.length +
(
stories.length === 1
? " new story was"
: " new stories were"
) +
" submitted since the previous digest.\n\n" +
textStories;

try {
await sendEmail(env, {
from:
"PMS-ME [onboarding@resend.dev](mailto:onboarding@resend.dev)",
to: [settings.email],
subject:
"PMS-ME Daily Digest — " +
stories.length +
(
stories.length === 1
? " new story"
: " new stories"
),
html: html,
text: text
});

```
await env.pms_me_db
  .prepare(
    "UPDATE notification_settings " +
    "SET last_digest_at = ? " +
    "WHERE id = 1"
  )
  .bind(digestCutoff)
  .run();
```

} catch (error) {
console.error(
"Daily digest failed:",
error.message
);
}
}

export default {
async fetch(request, env, ctx) {
const url = new URL(request.url);

```
if (url.pathname === "/api/notification-settings") {

  if (request.method === "GET") {
    try {
      const settings =
        await getNotificationSettings(env);

      return Response.json({
        email:
          settings?.email || "",
        frequency:
          settings?.frequency || "off"
      });

    } catch (error) {
      return Response.json(
        {
          error:
            error.message ||
            "Unable to load notification settings."
        },
        { status: 500 }
      );
    }
  }

  if (request.method === "PUT") {
    try {
      const data =
        await request.json();

      const email =
        String(
          data.email || ""
        ).trim();

      const frequency =
        String(
          data.frequency || "off"
        ).trim();

      if (
        !["off", "immediate", "daily"]
          .includes(frequency)
      ) {
        return Response.json(
          {
            error:
              "Invalid notification frequency."
          },
          { status: 400 }
        );
      }

      if (
        frequency !== "off" &&
        !email
      ) {
        return Response.json(
          {
            error:
              "An email address is required when notifications are enabled."
          },
          { status: 400 }
        );
      }

      if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(email)
      ) {
        return Response.json(
          {
            error:
              "Please enter a valid email address."
          },
          { status: 400 }
        );
      }

      const current =
        await getNotificationSettings(env);

      let lastDigestAt =
        current?.last_digest_at ||
        null;

      if (
        frequency === "daily" &&
        (
          !current ||
          current.frequency !== "daily"
        )
      ) {
        lastDigestAt =
          new Date().toISOString();
      }

      if (
        frequency !== "daily"
      ) {
        lastDigestAt = null;
      }

      await env.pms_me_db
        .prepare(
          "INSERT INTO notification_settings " +
          "(id, email, frequency, last_digest_at) " +
          "VALUES (1, ?, ?, ?) " +
          "ON CONFLICT(id) DO UPDATE SET " +
          "email = excluded.email, " +
          "frequency = excluded.frequency, " +
          "last_digest_at = excluded.last_digest_at"
        )
        .bind(
          email || null,
          frequency,
          lastDigestAt
        )
        .run();

      return Response.json({
        success: true,
        email: email,
        frequency: frequency
      });

    } catch (error) {
      return Response.json(
        {
          error:
            error.message ||
            "Unable to save notification settings."
        },
        { status: 500 }
      );
    }
  }
}

if (url.pathname === "/api/stories") {

  if (request.method === "GET") {
    const status =
      url.searchParams.get("status");

    let query =
      "SELECT " +
      "id, " +
      "story, " +
      "category, " +
      "display_name, " +
      "email, " +
      "anonymous_requested, " +
      "force_anonymous, " +
      "public_name, " +
      "status, " +
      "moderator_notes, " +
      "created_at, " +
      "published_at, " +
      "reaction_been_there, " +
      "reaction_funny " +
      "FROM stories";

    if (status) {
      query +=
        " WHERE status = ?";
    } else {
      query +=
        " WHERE status = 'published'";
    }

    query +=
      " ORDER BY created_at DESC";

    const statement = status
      ? env.pms_me_db
          .prepare(query)
          .bind(status)
      : env.pms_me_db
          .prepare(query);

    const result =
      await statement.all();

    return Response.json(result);
  }

  if (request.method === "POST") {
    try {
      const data =
        await request.json();

      const story =
        String(data.story || "").trim();

      const category =
        String(data.category || "").trim();

      const displayName =
        String(
          data.display_name || ""
        ).trim();

      const email =
        String(
          data.email || ""
        ).trim();

      const anonymousRequested =
        data.anonymous_requested
          ? 1
          : 0;

      if (!story || !category) {
        return Response.json(
          {
            error:
              "Story and category are required."
          },
          { status: 400 }
        );
      }

      const publicName =
        anonymousRequested
          ? generateAnonymousName()
          : (
              displayName ||
              generateAnonymousName()
            );

      const insertResult =
        await env.pms_me_db
          .prepare(
            "INSERT INTO stories " +
            "(story, category, display_name, email, " +
            "anonymous_requested, force_anonymous, " +
            "public_name, status) " +
            "VALUES (?, ?, ?, ?, ?, 0, ?, 'pending')"
          )
          .bind(
            story,
            category,
            displayName || null,
            email || null,
            anonymousRequested,
            publicName
          )
          .run();

      const storyId =
        insertResult.meta &&
        insertResult.meta.last_row_id
          ? insertResult.meta.last_row_id
          : null;

      ctx.waitUntil(
        sendNewStoryNotification(
          env,
          storyId,
          story,
          category,
          displayName,
          anonymousRequested
        )
      );

      return Response.json({
        success: true,
        message:
          "Story submitted for review."
      });

    } catch (error) {
      return Response.json(
        {
          error:
            error.message ||
            "Submission failed."
        },
        { status: 500 }
      );
    }
  }
}

if (
  url.pathname.startsWith(
    "/api/stories/"
  ) &&
  request.method === "PATCH"
) {
  try {
    const id =
      Number(
        url.pathname
          .split("/")
          .pop()
      );

    if (!Number.isInteger(id)) {
      return Response.json(
        {
          error:
            "Invalid story ID."
        },
        { status: 400 }
      );
    }

    const data =
      await request.json();

    const status =
      String(
        data.status || ""
      ).trim();

    if (
      !["published", "rejected"]
        .includes(status)
    ) {
      return Response.json(
        {
          error:
            "Invalid status."
        },
        { status: 400 }
      );
    }

    const forceAnonymous =
      data.force_anonymous
        ? 1
        : 0;

    const moderatorNotes =
      String(
        data.moderator_notes || ""
      ).trim();

    const storyResult =
      await env.pms_me_db
        .prepare(
          "SELECT " +
          "display_name, " +
          "anonymous_requested, " +
          "public_name, " +
          "email, " +
          "story " +
          "FROM stories " +
          "WHERE id = ?"
        )
        .bind(id)
        .first();

    if (!storyResult) {
      return Response.json(
        {
          error:
            "Story not found."
        },
        { status: 404 }
      );
    }

    let publicName;

    if (
      forceAnonymous ||
      storyResult.anonymous_requested
    ) {
      publicName =
        storyResult.public_name &&
        storyResult.public_name !==
          "Anonymous"
          ? storyResult.public_name
          : generateAnonymousName();
    } else {
      publicName =
        storyResult.display_name ||
        storyResult.public_name ||
        generateAnonymousName();
    }

    if (status === "published") {

      await env.pms_me_db
        .prepare(
          "UPDATE stories SET " +
          "status = 'published', " +
          "force_anonymous = ?, " +
          "public_name = ?, " +
          "moderator_notes = ?, " +
          "published_at = CURRENT_TIMESTAMP " +
          "WHERE id = ?"
        )
        .bind(
          forceAnonymous,
          publicName,
          moderatorNotes || null,
          id
        )
        .run();

    } else {

      await env.pms_me_db
        .prepare(
          "UPDATE stories SET " +
          "status = 'rejected', " +
          "force_anonymous = ?, " +
          "public_name = ?, " +
          "moderator_notes = ? " +
          "WHERE id = ?"
        )
        .bind(
          forceAnonymous,
          publicName,
          moderatorNotes || null,
          id
        )
        .run();

      if (storyResult.email) {
        await sendRejectionEmail(
          env,
          storyResult.email,
          storyResult.display_name,
          storyResult.story,
          moderatorNotes
        );
      }
    }

    return Response.json({
      success: true,
      message:
        status === "published"
          ? "Story approved."
          : "Story rejected."
    });

  } catch (error) {
    return Response.json(
      {
        error:
          error.message ||
          "Update failed."
      },
      { status: 500 }
    );
  }
}

return env.ASSETS.fetch(request);
```

},

async scheduled(controller, env, ctx) {
if (controller.cron === "0 13 * * *") {
await sendDailyDigest(env);
}
}
};
