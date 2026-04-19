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
      container.innerHTML = ""; 

      // 1. GLOBAL POST BOX 
      let movieOptions = "";
      movieData.results.forEach(m => {
          movieOptions += `<option value="${m.id}">${m.title}</option>`;
      });

      const postBox = document.createElement("div");
      postBox.className = "movie-card";
      postBox.style.border = "2px solid #1da1f2"; 
      postBox.innerHTML = `
        <h3 style="margin-top: 0; color: #1da1f2;">Write a Review</h3>
        <select id="new-movie-select" style="width: 100%; padding: 10px; margin-bottom: 10px; border-radius: 6px; border: 1px solid #ccc; background: white;">
            <option value="" disabled selected>Select a movie...</option>
            ${movieOptions}
        </select>
        
        <div style="display: flex; gap: 12px; margin-bottom: 10px; align-items: center;">
            <div id="star-rating-new" data-rating="0" style="display: flex; font-size: 1.8em; cursor: pointer; user-select: none;">
                <span id="star-new-1" onclick="setRating('new', 1)" style="color: #ccc;">☆</span>
                <span id="star-new-2" onclick="setRating('new', 2)" style="color: #ccc;">☆</span>
                <span id="star-new-3" onclick="setRating('new', 3)" style="color: #ccc;">☆</span>
                <span id="star-new-4" onclick="setRating('new', 4)" style="color: #ccc;">☆</span>
                <span id="star-new-5" onclick="setRating('new', 5)" style="color: #ccc;">☆</span>
            </div>
        </div>

        <div style="display: flex; gap: 8px;">
            <input id="input-new" maxlength="140" placeholder="Write a review (max 140 chars)..." style="flex-grow: 1; padding: 10px; border: 1px solid #ccc; border-radius: 6px;" />

            <button id="post-btn-new" onclick="addReview()" style="padding: 10px 18px; background: #1da1f2; color: white; border: none; border-radius: 6px; font-weight: bold;">Post</button>
        </div>
      `;
      container.appendChild(postBox);

      // 2. THE FEED (Only showing posts with a rating >= 1)
      const ratedReviews = allReviews ? allReviews.filter(r => r.rating && r.rating >= 1) : [];

      // Reverse it so the newest posts are at the top
      ratedReviews.reverse().forEach(r => {
          const div = document.createElement("div");
          div.className = "movie-card";
          
          const movie = movieData.results.find(m => m.id === r.movie_id);
          const movieTitle = movie ? movie.title : "Unknown Movie";
          
          // Defaulting to klt for the feed display
          const author = "klt";

          const starCount = r.rating; 
          const starsVisual = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
          
          div.innerHTML = `
            <div style="font-weight: bold; color: #555; margin-bottom: 2px;">@${author}</div>
            <div style="font-size: 0.85em; color: #888; margin-bottom: 8px; font-weight: bold;">🎬 ${movieTitle}</div>
            <div style="font-size: 1.1em; margin-bottom: 4px; color: #1da1f2;">${starsVisual}</div>
            <div style="color: #333; font-size: 1.05em;">💬 ${r.content}</div>
          `;
          container.appendChild(div);
      });
      
    } catch(err) {
       logError("Feed Load Error: " + err.message);
    }
  }

  initializeFeed();

  // Handle star tapping
  window.setRating = function(prefix, clickedRating) {
    const container = document.getElementById(`star-rating-${prefix}`);
    container.setAttribute("data-rating", clickedRating);

    for (let i = 1; i <= 5; i++) {
        const star = document.getElementById(`star-${prefix}-${i}`);
        if (i <= clickedRating) {
            star.innerText = "★";
            star.style.color = "#1da1f2"; 
        } else {
            star.innerText = "☆";
            star.style.color = "#ccc"; 
        }
    }
  };

  // Add the review
  window.addReview = async function() {
    try {
      const selectBox = document.getElementById("new-movie-select");
      const movieId = selectBox.value;
      
      const input = document.getElementById("input-new");
      const text = input.value;
      
      const ratingContainer = document.getElementById("star-rating-new");
      const ratingValue = parseInt(ratingContainer.getAttribute("data-rating"));

      if (!movieId) {
        alert("Please select a movie from the dropdown!");
        return;
      }

      if (ratingValue === 0) {
        alert("Please tap the stars to leave a rating!");
        return;
      }

      if (!text.trim()) {
        alert("Please write a review!");
        return;
      }

      if (text.length > 140) {
        alert("Reviews must be 140 characters or less.");
        return;
      }

      // Disable button to prevent double-posting
      const postBtn = document.getElementById("post-btn-new");
      postBtn.disabled = true;
      postBtn.innerText = "Posting...";
      postBtn.style.opacity = "0.5";

      // Save to Supabase with hardcoded 'klt' username
      const { error } = await supabaseClient
        .from("reviews")
        .insert([{ movie_id: movieId, content: text, rating: ratingValue}]);

      if (error) {
        postBtn.disabled = false;
        postBtn.innerText = "Post";
        postBtn.style.opacity = "1";
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


