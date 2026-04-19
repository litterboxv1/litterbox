function logError(message) {
  const debugDiv = document.getElementById("debug");
  if (debugDiv) {
      debugDiv.style.display = "block";
      debugDiv.innerHTML += `<div>❌ ${message}</div>`;
  }
}

// Modal Controls
window.openModal = function() {
  document.getElementById('review-modal').style.display = 'flex';
}

window.closeModal = function() {
  document.getElementById('review-modal').style.display = 'none';
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

      // Populate Modal Dropdown
      const selectBox = document.getElementById("new-movie-select");
      let movieOptions = '<option value="" disabled selected>Select a movie...</option>';
      movieData.results.forEach(m => {
          movieOptions += `<option value="${m.id}">${m.title}</option>`;
      });
      selectBox.innerHTML = movieOptions;

      // Render Feed
      const container = document.getElementById("movies");
      container.innerHTML = ""; 

      const ratedReviews = allReviews ? allReviews.filter(r => r.rating && r.rating >= 1) : [];

      // Reverse it so the newest posts are at the top
      ratedReviews.reverse().forEach(r => {
          const div = document.createElement("div");
          div.className = "post";
          
          const movie = movieData.results.find(m => m.id === r.movie_id);
          const movieTitle = movie ? movie.title : "Unknown Movie";
          
          // Hardcoded username to lft
          const author = "lft";

          const starCount = r.rating; 
          const starsVisual = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
          
          // X-style Post HTML Injection
          div.innerHTML = `
            <div class="avatar"></div>
            <div class="post-content-area">
              <div class="post-header">
                <span class="username">@${author}</span>
                <span class="movie-title-row"> · <a href="#" class="movie-link">${movieTitle}</a> | <span class="stars-inline">${starsVisual}</span></span>
              </div>
              <div class="post-text">${r.content}</div>
              
              <div class="post-metrics">
                <span>4.5 Avg [★★★★★]</span>
                <span>💬 45</span>
              </div>
            </div>
          `;
          container.appendChild(div);
      });
      
    } catch(err) {
       logError("Feed Load Error: " + err.message);
    }
  }

  initializeFeed();

  // Handle star tapping in the modal
  window.setRating = function(prefix, clickedRating) {
    const container = document.getElementById(`star-rating-${prefix}`);
    container.setAttribute("data-rating", clickedRating);

    for (let i = 1; i <= 5; i++) {
        const star = document.getElementById(`star-${prefix}-${i}`);
        if (i <= clickedRating) {
            star.innerText = "★";
            star.style.color = "#ffd700"; // Gold stars when selected
        } else {
            star.innerText = "☆";
            star.style.color = "#2f3336"; // Dark gray when empty
        }
    }
  };

  // Add the review from the modal
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

      // Save to Supabase
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

      closeModal();
      window.location.reload(); 
    } catch(err) {
      logError("Add Review Code Error: " + err.message);
    }
  };

} catch(err) {
  logError("Initialization Error: " + err.message);
}
