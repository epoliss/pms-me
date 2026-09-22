export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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

      return `${word}${number}`;
    }

    async function sendRejectionEmail(email, story, moderatorNotes) {
      if (!email) {
        return;
      }

      const message =
        moderatorNotes ||
        "Your story was not approved for publication.";

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
            to: [email],
            subject: "Your PMS-ME story was not approved",
            text:
`Hello,

Your story submitted to PMS-ME was not approved for publication.

Moderator's comment:

${message}

Your submitted story was:

${story}

Thank you,
PMS-ME — Property Manager Stories`
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Email sending failed: ${errorText}`
        );
      }
    }

    if (url.pathname === "/api/stories") {

      if (request.method === "GET") {
        const status = url.searchParams.get("status");

        let query = `
          SELECT
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
        `;

        if (status) {
          query += ` WHERE status = ?`;
        } else {
          query += ` WHERE status = 'published'`;
        }

        query += ` ORDER BY created_at DESC`;

        const statement = status
          ? env.pms_me_db.prepare(query).bind(status)
          : env.pms_me_db.prepare(query);

        const result = await statement.all();

        return Response.json(result);
      }

      if (request.method === "POST") {
        try {
          const data = await request.json();

          const story = String(data.story || "").trim();
          const category = String(data.category || "").trim();
          const displayName = String(data.display_name || "").trim();
          const email = String(data.email || "").trim();

          const anonymousRequested =
            data.anonymous_requested ? 1 : 0;

          if (!story || !category) {
            return Response.json(
              { error: "Story and category are required." },
              { status: 400 }
            );
          }

          const publicName =
            anonymousRequested
              ? generateAnonymousName()
              : (displayName || generateAnonymousName());

          await env.pms_me_db
            .prepare(`
              INSERT INTO stories
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
              VALUES (?, ?, ?, ?, ?, 0, ?, 'pending')
            `)
            .bind(
              story,
              category,
              displayName || null,
              email || null,
              anonymousRequested,
              publicName
            )
            .run();

          return Response.json({
            success: true,
            message: "Story submitted for review."
          });

        } catch (error) {
          return Response.json(
            { error: error.message || "Submission failed." },
            { status: 500 }
          );
        }
      }
    }

    if (
      url.pathname.startsWith("/api/stories/") &&
      request.method === "PATCH"
    ) {
      try {
        const id = Number(
          url.pathname.split("/").pop()
        );

        if (!Number.isInteger(id)) {
          return Response.json(
            { error: "Invalid story ID." },
            { status: 400 }
          );
        }

        const data = await request.json();

        const status = String(data.status || "").trim();

        if (!["published", "rejected"].includes(status)) {
          return Response.json(
            { error: "Invalid status." },
            { status: 400 }
          );
        }

        const forceAnonymous =
          data.force_anonymous ? 1 : 0;

        const moderatorNotes =
          String(data.moderator_notes || "").trim();

        const storyResult = await env.pms_me_db
          .prepare(`
            SELECT
              display_name,
              anonymous_requested,
              public_name,
              email,
              story
            FROM stories
            WHERE id = ?
          `)
          .bind(id)
          .first();

        if (!storyResult) {
          return Response.json(
            { error: "Story not found." },
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
            storyResult.public_name !== "Anonymous"
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
            .prepare(`
              UPDATE stories
              SET
                status = 'published',
                force_anonymous = ?,
                public_name = ?,
                moderator_notes = ?,
                published_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `)
            .bind(
              forceAnonymous,
              publicName,
              moderatorNotes || null,
              id
            )
            .run();

        } else {

          await env.pms_me_db
            .prepare(`
              UPDATE stories
              SET
                status = 'rejected',
                force_anonymous = ?,
                public_name = ?,
                moderator_notes = ?
              WHERE id = ?
            `)
            .bind(
              forceAnonymous,
              publicName,
              moderatorNotes || null,
              id
            )
            .run();

          if (storyResult.email) {
            await sendRejectionEmail(
              storyResult.email,
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
          { error: error.message || "Update failed." },
          { status: 500 }
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};
