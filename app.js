function logError(message) {
  const debugDiv = document.getElementById("debug");
  if (debugDiv) {
      debugDiv.style.display = "block";
      debugDiv.innerHTML += `<div>❌ ${message}</div>`;
  }
}

try {
  const SUPABASE_URL = "https://wdkrylqauvlahvbvdzfh.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indka3J5bHFhdXZsYWh2YnZkemZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1OTQ1NDMsImV4cCI6MjA5MjE3MDU0M30.4mRynrWCAwJPHuDclh2I7tevRAzvc4W9W7XV2Lwc8s4"; 

  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const API_KEY = "978a4bc3138be0d1caacc278f7b6acfe";

  async function initializeFeed() {
    try {
      const movieRes = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`);
      if (!movieRes.ok) throw new Error("TMDB Network response failed");
      const movieData = await movieRes.json();

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
        
        const movieReviews = allReviews ? allReviews.filter(r => r.movie_id === movie.id) : [];
        
        let reviewsHTML = "";
        if (movieReviews.length > 0) {
            movieReviews.forEach(r => {
                // Generate the visual stars based on the saved number, default to 1 if it's an old test review
                const starCount = r.rating ? r.rating : 1; 
                const starsVisual = '⭐'.repeat(starCount);

                reviewsHTML += `
                <div style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin: 10px 0;">
                  <div style="font-size: 1.1em; margin-bottom: 4px;">${starsVisual}</div>
                  <div style="color: #333;">💬 ${r.content}</div>
                </div>`;
            });
        } else {
            reviewsHTML = `<em>No reviews yet. Be the first!</em>`;
        }

        // Added the rating dropdown to the input area
        div.innerHTML = `
          <h3 style="margin-top: 0;">${movie.title}</h3>
          <div style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
              <select id="rating-${movie.id}" style="padding: 8px; border-radius: 6px; border: 1px solid #ccc; background: white;">
                  <option value="5">⭐⭐⭐⭐⭐</option>
                  <option value="4">⭐⭐⭐⭐</option>
                  <option value="3">⭐⭐⭐</option>
                  <option value="2">⭐⭐</option>
                  <option value="1">⭐</option>
              </select>
              <input id="input-${movie.id}" placeholder="Write a review..." style="flex-grow: 1; padding: 8px; border: 1px solid #ccc; border-radius: 6px;" />
              <button onclick="addReview(${movie.id})" style="padding: 8px 16px; background: #1da1f2; color: white; border: none; border-radius: 6px; font-weight: bold;">Post</button>
          </div>
          <div id="reviews-${movie.id}" style="font-size: 0.9em;">
             ${reviewsHTML}
          </div>
        `;
        container.appendChild(div);
      });
      
    } catch(err) {
       logError("Feed Load Error: " + err.message);
    }
  }

  initializeFeed();

  window.addReview = async function(movieId) {
    try {
      const input = document.getElementById(`input-${movieId}`);
      const text = input.value;
      
      // Grab the star value from the dropdown
      const ratingDropdown = document.getElementById(`rating-${movieId}`);
      const ratingValue = parseInt(ratingDropdown.value);

      if (!text.trim()) {
        alert("Please write something first!");
        return;
      }

      // Tell Supabase to save the rating number too
      const { error } = await supabaseClient
        .from("reviews")
        .insert([{ movie_id: movieId, content: text, rating: ratingValue }]);

      if (error) {
        logError("Insert Error: " + error.message);
        return;
      }

      window.location.reload(); 
    } catch(err) {
      logError("Add Review Code Error: " + err.message);
    }
  };

} catch(err) {
  logError("Initialization Error: " + err.message);
}
