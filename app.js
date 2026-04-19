function logError(message) {
  const debugDiv = document.getElementById("debug");
  if (debugDiv) {
      debugDiv.style.display = "block";
      debugDiv.innerHTML += `<div>❌ ${message}</div>`;
  }
}

window.openModal = function() { document.getElementById('review-modal').style.display = 'flex'; }
window.closeModal = function() { document.getElementById('review-modal').style.display = 'none'; }

try {
  const SUPABASE_URL = "https://wdkrylqauvlahvbvdzfh.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indka3J5bHFhdXZsYWh2YnZkemZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1OTQ1NDMsImV4cCI6MjA5MjE3MDU0M30.4mRynrWCAwJPHuDclh2I7tevRAzvc4W9W7XV2Lwc8s4"; 
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  const API_KEY = "978a4bc3138be0d1caacc278f7b6acfe";

  // Simple Router Logic
  const urlParams = new URLSearchParams(window.location.search);
  const currentMovieId = urlParams.get('movie');

  async function initApp() {
    // 1. Always load the Modal Dropdown options first
    try {
        const popRes = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`);
        const popData = await popRes.json();
        const selectBox = document.getElementById("new-movie-select");
        let movieOptions = '<option value="" disabled selected>Select a movie...</option>';
        popData.results.forEach(m => { movieOptions += `<option value="${m.id}">${m.title}</option>`; });
        selectBox.innerHTML = movieOptions;
    } catch(err) { logError("Dropdown load failed"); }

    // 2. Decide which view to render based on URL
    if (currentMovieId) {
        document.getElementById('nav-movies').classList.add('active');
        document.getElementById('view-home').style.display = 'none';
        document.getElementById('view-movie').style.display = 'block';
        loadMovieView(currentMovieId);
    } else {
        document.getElementById('nav-home').classList.add('active');
        loadHomeView();
    }
  }

  // --- HOME FEED VIEW ---
  async function loadHomeView() {
    try {
      const movieRes = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`);
      const movieData = await movieRes.json();

      const { data: allReviews, error: reviewError } = await supabaseClient.from("reviews").select("*");
      if (reviewError) throw reviewError;

      const container = document.getElementById("home-feed-container");
      container.innerHTML = ""; 

      const ratedReviews = allReviews ? allReviews.filter(r => r.rating && r.rating >= 1) : [];

      ratedReviews.reverse().forEach(r => {
          const div = document.createElement("div");
          div.className = "post";
          const movie = movieData.results.find(m => m.id === r.movie_id);
          const movieTitle = movie ? movie.title : "Unknown Movie";
          const author = "lft";
          const starsVisual = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
          
          div.innerHTML = `
            <div class="avatar"></div>
            <div class="post-content-area">
              <div class="post-header">
                <div class="username">@${author}</div>
                <div class="movie-title-row" style="margin-top: 4px;">
                  <a href="?movie=${r.movie_id}" class="movie-link">${movieTitle}</a> | <span class="stars-inline">${starsVisual}</span>
                </div>
              </div>
              <div class="post-text" style="margin-top: 8px;">${r.content}</div>
              <div class="post-metrics" style="margin-top: 14px;">
                <span style="display: flex; gap: 16px; align-items: center; font-size: 14px; font-weight: bold; color: var(--text-light);">
                  <span>4.5K ⭐</span><span>3.8K 💩</span><span>45 💬</span>
                </span>
              </div>
            </div>
          `;
          container.appendChild(div);
      });
    } catch(err) { logError("Home Load Error: " + err.message); }
  }

  // --- MOVIE DETAILS VIEW ---
  async function loadMovieView(movieId) {
    try {
        // Fetch TMDB info (appending credits for Director/Writers)
        const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`);
        if (!movieRes.ok) throw new Error("TMDB Error");
        const movie = await movieRes.json();

        // Fetch Supabase data specifically for this movie
        const { data: dbReviews, error: reviewError } = await supabaseClient.from("reviews").select("*").eq('movie_id', movieId);
        if (reviewError) throw reviewError;

        // Calculate custom DB metrics
        const reviewCount = dbReviews ? dbReviews.length : 0;
        let avgRating = 0.0;
        if (reviewCount > 0) {
            const totalStars = dbReviews.reduce((sum, r) => sum + r.rating, 0);
            avgRating = (totalStars / reviewCount).toFixed(1);
        }

        // Render Top Header
        const headerContainer = document.getElementById("movie-header-container");
        const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : "N/A";
        const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : "N/A";
        
        // Grab Director safely
        const directorObj = movie.credits && movie.credits.crew ? movie.credits.crew.find(c => c.job === 'Director') : null;
        const directorName = directorObj ? directorObj.name : "Unknown";

        headerContainer.innerHTML = `
            <div class="movie-header-card">
               <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" class="movie-poster">
               <div class="movie-info">
                  <div class="movie-title">${movie.title}</div>
                  <div class="movie-meta">${releaseYear} • ${runtime}</div>
                  
                  <div class="movie-rating-row">
                     <span style="color: #ffd700; font-size: 0.95rem;">Rated ${avgRating}</span> 
                     <span style="font-weight: normal; font-size: 0.95rem;">across ${reviewCount} Reviews</span>
                  </div>
                  
                  <div class="movie-tagline">${movie.tagline || ""}</div>
                  <div class="movie-overview-title">Overview</div>
                  <div class="movie-overview">${movie.overview}</div>
                  
                  <div class="movie-crew-grid">
                      <div><div class="crew-name">${directorName}</div><div class="crew-job">Director</div></div>
                  </div>
               </div>
            </div>
        `;

        // Render the reviews specific to this movie (No movie titles!)
        const reviewsContainer = document.getElementById("movie-reviews-container");
        dbReviews.reverse().forEach(r => {
            const div = document.createElement("div");
            div.className = "post";
            const starsVisual = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
            
            div.innerHTML = `
                <div class="avatar"></div>
                <div class="post-content-area">
                <div class="post-header">
                    <div class="username">@lft</div>
                    <div style="margin-top: 4px;"><span class="stars-inline">${starsVisual}</span></div>
                </div>
                <div class="post-text" style="margin-top: 8px;">${r.content}</div>
                <div class="post-metrics" style="margin-top: 14px;">
                    <span style="display: flex; gap: 16px; align-items: center; font-size: 14px; font-weight: bold; color: var(--text-light);">
                    <span>4.5 ⭐</span><span>3.8 💩</span><span>45 💬</span>
                    </span>
                </div>
                </div>
            `;
            reviewsContainer.appendChild(div);
        });

    } catch(err) { logError("Movie View Error: " + err.message); }
  }

  // Start the application
  initApp();

  // Handle stars in modal
  window.setRating = function(prefix, clickedRating) {
    const container = document.getElementById(`star-rating-${prefix}`);
    container.setAttribute("data-rating", clickedRating);
    for (let i = 1; i <= 5; i++) {
        const star = document.getElementById(`star-${prefix}-${i}`);
        if (i <= clickedRating) {
            star.innerText = "★"; star.style.color = "#ffd700"; 
        } else {
            star.innerText = "☆"; star.style.color = "#2f3336"; 
        }
    }
  };

  // Add review
  window.addReview = async function() {
    try {
      const selectBox = document.getElementById("new-movie-select");
      const movieId = selectBox.value;
      const input = document.getElementById("input-new");
      const text = input.value;
      const ratingContainer = document.getElementById("star-rating-new");
      const ratingValue = parseInt(ratingContainer.getAttribute("data-rating"));

      if (!movieId) return alert("Select a movie!");
      if (ratingValue === 0) return alert("Tap the stars!");
      if (!text.trim()) return alert("Write a review!");
      if (text.length > 140) return alert("Max 140 characters!");

      const postBtn = document.getElementById("post-btn-new");
      postBtn.disabled = true; postBtn.innerText = "Posting...";

      const { error } = await supabaseClient.from("reviews").insert([{ movie_id: movieId, content: text, rating: ratingValue}]);
      if (error) throw error;

      closeModal();
      window.location.reload(); 
    } catch(err) { logError("Insert Error: " + err.message); }
  };

} catch(err) { logError("Init Error: " + err.message); }
