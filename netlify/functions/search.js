const TMDB_BASE = "https://api.themoviedb.org/3";

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { q, type = "multi", page = "1" } = event.queryStringParameters || {};

    if (!q) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing query parameter: q" }),
      };
    }

    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "TMDB API key not configured" }),
      };
    }

    // type can be: multi | movie | tv
    const validTypes = ["multi", "movie", "tv"];
    const searchType = validTypes.includes(type) ? type : "multi";

    const url = `${TMDB_BASE}/search/${searchType}?api_key=${apiKey}&query=${encodeURIComponent(q)}&page=${page}&include_adult=false`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`TMDB returned ${res.status}`);
    }

    const data = await res.json();

    // Clean up — only send what frontend needs
    const results = (data.results || []).map((item) => ({
      id: item.id,
      title: item.title || item.name,
      original_title: item.original_title || item.original_name,
      media_type: item.media_type || searchType,
      overview: item.overview,
      poster_path: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      backdrop_path: item.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
        : null,
      release_date: item.release_date || item.first_air_date,
      vote_average: item.vote_average,
      vote_count: item.vote_count,
      popularity: item.popularity,
      genre_ids: item.genre_ids || [],
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        page: data.page,
        total_pages: data.total_pages,
        total_results: data.total_results,
        results,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
