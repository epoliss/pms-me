export default {
async fetch(request, env, ctx) {
const url = new URL(request.url);

```
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
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

    throw new Error(
      "Email sending failed: " +
      errorText
    );
  }

  return response;
}

async function sendRejectionEmail(
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
      "PMS-ME <onboarding@resend.dev>",
    to: [email],
    subject:
      "Your PMS-ME story was not approved",
    html: html,
    text: text
  });
}

async function getNotificationSettings() {
  return await env.pms_me_db
    .prepare(
      "SELECT id, email, frequency, last_digest_at " +
      "FROM notification_settings " +
      "WHERE id = 1"
    )
    .first();
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
    await getNotificationSettings();

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
    escapeHtml(di
```
