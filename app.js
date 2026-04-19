const SUPABASE_URL = "https://wdkrylqauvlahvbdzfh.supabase.co";
const SUPABASE_KEY = "sb_publishable_Q6Rlx_PBj0yf-6fTyBGj6g_dZc-MfzQ";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const API_KEY = "978a4bc3138be0d1caacc278f7b6acfe";

// Load movies
fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`)
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("movies");

    data.results.forEach(movie => {
      const div = document.createElement("div");

      div.innerHTML = `
        <h3>${movie.title}</h3>
        <input id="input-${movie.id}" placeholder="Write review (max 140)" />
        <button onclick="addReview(${movie.id})">Post</button>
        <div id="reviews-${movie.id}"></div>
      `;

      container.appendChild(div);

      loadReviews(movie.id);
    });
  });

// Add review
async function addReview(movieId) {
  const input = document.getElementById(`input-${movieId}`);
  const text = input.value;

  if (!text) return;
  if (text.length > 140) {
    alert("Max 140 characters!");
    return;
  }

  await supabaseClient.from("reviews").insert([
    { movie_id: movieId, content: text }
  ]);

  input.value = "";
  loadReviews(movieId);
}

// Load reviews
async function loadReviews(movieId) {
  const { data } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("movie_id", movieId);

  const container = document.getElementById(`reviews-${movieId}`);
  container.innerHTML = "";

  data.forEach(r => {
    const p = document.createElement("p");
    p.innerText = r.content;
    container.appendChild(p);
  });
}