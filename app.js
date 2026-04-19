// iPad Debug Helper: Prints errors directly to the webpage
function logError(message) {
  const debugDiv = document.getElementById("debug");
  debugDiv.style.display = "block";
  debugDiv.innerHTML += `<div>❌ ${message}</div>`;
}

try {
  const SUPABASE_URL = "https://wdkrylqauvlahvbdzfh.supabase.co";
  const SUPABASE_KEY = "sb_publishable_Q6Rlx_PBj0yf-6fTyBGj6g_dZc-MfzQ";

  // Initialize Supabase
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const API_KEY = "978a4bc3138be0d1caacc278f7b6acfe";

  // Load movies from TMDB
  fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`)
    .then(res => {
      if (!res.ok) throw new Error("TMDB Network response failed");
      return res.json();
    })
    .then(data => {
      const container = document.getElementById("movies");

      if (!data.results) {
         logError("No movie results found. Check TMDB API Key.");
         return;
      }

      data.results.forEach(movie => {
        const div = document.createElement("div");
        div.className = "movie-card";

        div.innerHTML = `
          <h3 style="margin-top: 0;">${movie.title}</h3>
          <div style="display: flex; gap: 8px; margin-bottom: 10px;">
              <input id="input-${movie.id}" placeholder="Write a review..." style="flex-grow: 1; padding: 8px; border: 1px solid #ccc; border-radius: 6px;" />
              <button onclick="addReview(${movie.id})" style="padding: 8px 16px; background: #1da1f2; color: white; border: none; border-radius: 6px; font-weight: bold;">Post</button>
          </div>
          <div id="reviews-${movie.id}" style="font-size: 0.9em; color: #555;">
             <em>Loading reviews...</em>
          </div>
        `;

        container.appendChild(div);

        // Fetch reviews for this specific movie
        loadReviews(movie.id);
      });
    })
    .catch(err => logError("TMDB Fetch Error: " + err.message));

  // Global function to add a review
  window.addReview = async function(movieId) {
    try {
      const input = document.getElementById(`input-${movieId}`);
      const text = input.value;

      if (!text.trim()) {
        alert("Please write something first!");
        return;
      }

      const { error } = await supabaseClient
        .from("reviews")
        .insert([{ movie_id: movieId, content: text }]);

      if (error) {
        logError("Supabase Insert Error: " + error.message);
        return;
      }

      input.value = ""; // Clear input box
      loadReviews(movieId); // Refresh the reviews list
    } catch(err) {
      logError("Add Review Code Error: " + err.message);
    }
  };

  // Global function to load reviews
  window.loadReviews = async function(movieId) {
    try {
      const { data, error } = await supabaseClient
        .from("reviews")
        .select("*")
        .eq("movie_id", movieId);

      const container = document.getElementById(`reviews-${movieId}`);
      container.innerHTML = ""; // Clear the "Loading..." text

      if (error) {
        container.innerHTML = `<span style="color:red">Failed to load reviews.</span>`;
        logError(`Supabase Select Error (Movie ${movieId}): ` + error.message);
        return;
      }

      // If data exists and isn't empty, display it
      if (data && data.length > 0) {
        data.forEach(r => {
          const p = document.createElement("p");
          p.style.borderBottom = "1px solid #eee";
          p.style.paddingBottom = "8px";
          p.style.margin = "8px 0";
          p.innerText = "💬 " + r.content;
          container.appendChild(p);
        });
      } else {
         container.innerHTML = `<em>No reviews yet. Be the first!</em>`;
      }
    } catch(err) {
       logError("Load Reviews Code Error: " + err.message);
    }
  };

} catch(err) {
  logError("Initialization Error: " + err.message);
}
