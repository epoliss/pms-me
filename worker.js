export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/stories") {

      if (request.method === "GET") {
        const result = await env.pms_me_db
          .prepare(`
            SELECT
              id,
              story,
              category,
              public_name,
              created_at,
              reaction_been_there,
              reaction_funny
            FROM stories
            ORDER BY created_at DESC
          `)
          .all();

        return Response.json(result);
      }

      if (request.method === "POST") {
        try {
          const data = await request.json();

          const story = String(data.story || "").trim();
          const category = String(data.category || "").trim();
          const displayName = String(data.display_name || "").trim();
          const email = String(data.email || "").trim();
          const anonymousRequested = data.anonymous_requested ? 1 : 0;

          if (!story || !category) {
            return Response.json(
              { error: "Story and category are required." },
              { status: 400 }
            );
          }

          const publicName =
            anonymousRequested || !displayName
              ? "Anonymous"
              : displayName;

          await env.pms_me_db
            .prepare(`
              INSERT INTO stories
              (
                story,
                category,
                display_name,
                email,
                anonymous_requested,
                public_name,
                status
              )
              VALUES (?, ?, ?, ?, ?, ?, 'pending')
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

      return Response.json(
        { error: "Method not allowed." },
        { status: 405 }
      );
    }

    return env.ASSETS.fetch(request);
  }
};
