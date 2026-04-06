const TMDB_BASE = "https://api.themoviedb.org/3";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

exports.handler = async (event) => {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "TMDB API key not configured" }) };
    }

    const { type = "movie" } = event.queryStringParameters || {};
    const mediaType = type === "tv" ? "tv" : "movie";

    const res = await fetch(`${TMDB_BASE}/genre/${mediaType}/list?api_key=${apiKey}`);
    const data = await res.json();

    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
