export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/stories") {
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
          WHERE status = 'published'
          ORDER BY created_at DESC
        `)
        .all();

      return Response.json(result.results);
    }

    return env.ASSETS.fetch(request);
  }
};
