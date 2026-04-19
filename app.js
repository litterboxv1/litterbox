// iPad Debug Helper
function logError(message) {
  const debugDiv = document.getElementById("debug");
  if (debugDiv) {
      debugDiv.style.display = "block";
      debugDiv.innerHTML += `<div>❌ ${message}</div>`;
  }
}

try {
  //
  const SUPABASE_URL = "https://wdkrylqauvlahvbvdzfh.supabase.co";
  
  // 
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indka3J5bHFhdXZsYWh2YnZkemZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1OTQ1NDMsImV4cCI6MjA5MjE3MDU0M30.4mRynrWCAwJPHuDclh2I7tevRAzvc4W9W7XV2Lwc8s4"; 

  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const API_KEY = "978a4bc3138be0d1caacc278f7b6acfe";

  // Fetch Movies AND Reviews
  async function initializeFeed() {
    try {
      // 1. Get the 20 movies from TMDB
      const movieRes = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`);
      if (!movieRes.ok) throw new Error("TMDB Network response failed");
      const movieData = await movieRes.json();

      // 2. Get ALL reviews in ONE request
      const { data: allReviews, error: reviewError } = await supabaseClient
        .from("reviews")
        .select("*");

      if (reviewError) {
          logError("Supabase Error: " + reviewError.message);
          return;
      }

      const container = document.getElementById("movies");

      movieData.results.forEach(movie => {
        const div = document.createElement("div");
        div.className = "movie-card";
        
        // Match reviews to the current movie
        const movieReviews = allReviews ? allReviews.filter(r => r.movie_id === movie.id) : [];
        
        let reviewsHTML = "";
        if (movieReviews.length > 0) {
            movieReviews.forEach(r => {
                reviewsHTML += `<p style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin: 8px 0;">💬 ${r.content}</p>`;
            });
        } else {
            reviewsHTML = `<em>No reviews yet. Be the first!</em>`;
        }

        div.innerHTML = `
          <h3 style="margin-top: 0;">${movie.title}</h3>
          <div style="display: flex; gap: 8px; margin-bottom: 10px;">
              <input id="input-${movie.id}" placeholder="Write a review..." style="flex-grow: 1; padding: 8px; border: 1px solid #ccc; border-radius: 6px;" />
              <button onclick="addReview(${movie.id})" style="padding: 8px 16px; background: #1da1f2; color: white; border: none; border-radius: 6px; font-weight: bold;">Post</button>
          </div>
          <div id="reviews-${movie.id}" style="font-size: 0.9em; color: #555;">
             ${reviewsHTML}
          </div>
        `;
        container.appendChild(div);
      });
      
    } catch(err) {
       logError("Feed Load Error: " + err.message);
    }
  }

  // Run the combined feed function
  initializeFeed();

  // Add a new review
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
        logError("Insert Error: " + error.message);
        return;
      }

      // If successful, reload the page to see the new review!
      window.location.reload(); 
    } catch(err) {
      logError("Add Review Code Error: " + err.message);
    }
  };

} catch(err) {
  logError("Initialization Error: " + err.message);
}
