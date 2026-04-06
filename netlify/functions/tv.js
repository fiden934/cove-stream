const TMDB_BASE = "https://api.themoviedb.org/3";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

async function tmdbFetch(path, apiKey) {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${TMDB_BASE}${path}${sep}api_key=${apiKey}`);
  if (!res.ok) throw new Error(`TMDB ${res.status} on ${path}`);
  return res.json();
}

exports.handler = async (event) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "TMDB API key not configured" }),
      };
    }

    const {
      id,
      season,
      episode,
      action = "details",
      page = "1",
    } = event.queryStringParameters || {};

    // GET /api/tv?action=trending
    // GET /api/tv?action=popular
    // GET /api/tv?action=top_rated
    // GET /api/tv?id=1396              → full show details
    // GET /api/tv?id=1396&season=1     → season details + episode list
    // GET /api/tv?id=1396&season=1&episode=1 → single episode + embed URL

    if (action === "trending") {
      const data = await tmdbFetch(`/trending/tv/week?page=${page}`, apiKey);
      const results = (data.results || []).map((item) => ({
        id: item.id,
        title: item.name,
        overview: item.overview,
        media_type: "tv",
        poster_path: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        backdrop_path: item.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
          : null,
        first_air_date: item.first_air_date,
        vote_average: item.vote_average,
        popularity: item.popularity,
        genre_ids: item.genre_ids,
      }));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ page: data.page, total_pages: data.total_pages, results }),
      };
    }

    if (action === "popular") {
      const data = await tmdbFetch(`/tv/popular?page=${page}`, apiKey);
      const results = (data.results || []).map((item) => ({
        id: item.id,
        title: item.name,
        overview: item.overview,
        media_type: "tv",
        poster_path: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        backdrop_path: item.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
          : null,
        first_air_date: item.first_air_date,
        vote_average: item.vote_average,
        popularity: item.popularity,
        genre_ids: item.genre_ids,
      }));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ page: data.page, total_pages: data.total_pages, results }),
      };
    }

    if (action === "top_rated") {
      const data = await tmdbFetch(`/tv/top_rated?page=${page}`, apiKey);
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Missing id. Use ?id=TMDB_ID or ?action=trending|popular|top_rated",
        }),
      };
    }

    // Single episode with embed URL
    if (id && season && episode) {
      const [showData, epData] = await Promise.all([
        tmdbFetch(`/tv/${id}?append_to_response=credits`, apiKey),
        tmdbFetch(`/tv/${id}/season/${season}/episode/${episode}`, apiKey),
      ]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          show_id: Number(id),
          show_title: showData.name,
          season: Number(season),
          episode: Number(episode),
          episode_title: epData.name,
          overview: epData.overview,
          air_date: epData.air_date,
          runtime: epData.runtime,
          vote_average: epData.vote_average,
          still_path: epData.still_path
            ? `https://image.tmdb.org/t/p/w780${epData.still_path}`
            : null,
          total_seasons: showData.number_of_seasons,
          total_episodes: showData.number_of_episodes,
          // embed URL with all features
          embed_url: `https://www.vidking.net/embed/tv/${id}/${season}/${episode}?autoPlay=true&nextEpisode=true&episodeSelector=true`,
        }),
      };
    }

    // Season details — episode list
    if (id && season) {
      const data = await tmdbFetch(`/tv/${id}/season/${season}`, apiKey);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          show_id: Number(id),
          season_number: data.season_number,
          name: data.name,
          overview: data.overview,
          air_date: data.air_date,
          poster_path: data.poster_path
            ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
            : null,
          episodes: (data.episodes || []).map((ep) => ({
            episode_number: ep.episode_number,
            name: ep.name,
            overview: ep.overview,
            air_date: ep.air_date,
            runtime: ep.runtime,
            vote_average: ep.vote_average,
            still_path: ep.still_path
              ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
              : null,
            embed_url: `https://www.vidking.net/embed/tv/${id}/${season}/${ep.episode_number}?autoPlay=true&nextEpisode=true&episodeSelector=true`,
          })),
        }),
      };
    }

    // Full show details
    const data = await tmdbFetch(
      `/tv/${id}?append_to_response=credits,videos,similar`,
      apiKey
    );

    const show = {
      id: data.id,
      title: data.name,
      original_title: data.original_name,
      tagline: data.tagline || null,
      overview: data.overview,
      status: data.status,
      type: data.type,
      first_air_date: data.first_air_date,
      last_air_date: data.last_air_date,
      vote_average: data.vote_average,
      vote_count: data.vote_count,
      popularity: data.popularity,
      number_of_seasons: data.number_of_seasons,
      number_of_episodes: data.number_of_episodes,
      genres: data.genres || [],
      poster_path: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : null,
      backdrop_path: data.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`
        : null,
      // seasons list
      seasons: (data.seasons || [])
        .filter((s) => s.season_number > 0)
        .map((s) => ({
          season_number: s.season_number,
          name: s.name,
          episode_count: s.episode_count,
          air_date: s.air_date,
          poster_path: s.poster_path
            ? `https://image.tmdb.org/t/p/w300${s.poster_path}`
            : null,
        })),
      // cast top 10
      cast: (data.credits?.cast || []).slice(0, 10).map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_path: c.profile_path
          ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
          : null,
      })),
      // trailer
      trailer:
        (data.videos?.results || []).find(
          (v) => v.type === "Trailer" && v.site === "YouTube"
        ) || null,
      // base embed (season 1 ep 1 by default)
      embed_url: `https://www.vidking.net/embed/tv/${id}/1/1?autoPlay=true&nextEpisode=true&episodeSelector=true`,
      // similar
      similar: (data.similar?.results || []).slice(0, 6).map((item) => ({
        id: item.id,
        title: item.name,
        poster_path: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        vote_average: item.vote_average,
        first_air_date: item.first_air_date,
      })),
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(show),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
