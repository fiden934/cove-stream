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

function formatMovie(item) {
  return {
    id: item.id,
    title: item.title,
    original_title: item.original_title,
    tagline: item.tagline || null,
    overview: item.overview,
    status: item.status,
    runtime: item.runtime,
    release_date: item.release_date,
    vote_average: item.vote_average,
    vote_count: item.vote_count,
    popularity: item.popularity,
    genres: item.genres || [],
    poster_path: item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : null,
    backdrop_path: item.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
      : null,
    // embed URL — assembled server-side
    embed_url: `https://www.vidking.net/embed/movie/${item.id}`,
    // cast — top 10
    cast: (item.credits?.cast || []).slice(0, 10).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profile_path: c.profile_path
        ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
        : null,
    })),
    // trailer
    trailer: (item.videos?.results || []).find(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    ) || null,
  };
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

    const { id, action = "details", page = "1" } = event.queryStringParameters || {};

    // GET /api/movie?action=trending
    // GET /api/movie?action=popular
    // GET /api/movie?action=top_rated
    // GET /api/movie?action=nowplaying
    // GET /api/movie?id=299534

    if (action === "trending") {
      const data = await tmdbFetch(`/trending/movie/week?page=${page}`, apiKey);
      const results = (data.results || []).map((item) => ({
        id: item.id,
        title: item.title,
        overview: item.overview,
        media_type: "movie",
        poster_path: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        backdrop_path: item.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
          : null,
        release_date: item.release_date,
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
      const data = await tmdbFetch(`/movie/popular?page=${page}`, apiKey);
      const results = (data.results || []).map((item) => ({
        id: item.id,
        title: item.title,
        overview: item.overview,
        media_type: "movie",
        poster_path: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        backdrop_path: item.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
          : null,
        release_date: item.release_date,
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
      const data = await tmdbFetch(`/movie/top_rated?page=${page}`, apiKey);
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (action === "nowplaying") {
      const data = await tmdbFetch(`/movie/now_playing?page=${page}`, apiKey);
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    // specific movie details
    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing id parameter. Use ?id=TMDB_ID or ?action=trending|popular|top_rated|nowplaying" }),
      };
    }

    const data = await tmdbFetch(
      `/movie/${id}?append_to_response=credits,videos,similar`,
      apiKey
    );

    const movie = formatMovie(data);

    // similar movies — top 6
    movie.similar = (data.similar?.results || []).slice(0, 6).map((item) => ({
      id: item.id,
      title: item.title,
      poster_path: item.poster_path
        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
        : null,
      vote_average: item.vote_average,
      release_date: item.release_date,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(movie),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
