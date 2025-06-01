/* ------------------------------------------------------------------
   recommend.js  – Movie Recommendation Front-End
   ------------------------------------------------------------------
   • Uses TMDB API for movie data
   • Talks to Flask back-end routes `/similarity` and `/recommend`
   • All network calls are asynchronous (async/await + fetch / $.ajax)
-------------------------------------------------------------------*/

(() => {
  // ───────────────────────────────────────────────────────── helpers
  const apiKey = "603e19ffe04402de9bf6b94cbf4ab870";

  /** show/hide loaders, error blocks, result blocks  */
  const ui = {
    showLoader: () => $("#loader").fadeIn(),
    hideLoader: () => $("#loader").delay(500).fadeOut(),
    showError: () => {
      $(".fail").show();
      $(".results").hide();
    },
    showResults: () => {
      $(".fail").hide();
      $(".results").show();
    },
  };

  /** simple GET helper that returns JSON or throws */
  const getJSON = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  };

  /** POST helper (for Flask routes) that returns text */
  const postForm = async (url, data) => {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => fd.append(k, v));
    const res = await fetch(url, { method: "POST", body: fd });
    if (!res.ok) throw new Error("Flask route error");
    return res.text();
  };

  // ───────────────────────────────────────────── core async functions
  async function searchMovie(title) {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(title)}`;
    const data = await getJSON(url);
    return data.results[0]; // first hit or undefined
  }

  async function getMovieDetails(id) {
    const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`;
    return getJSON(url);
  }

  async function getMovieCast(id) {
    const url = `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${apiKey}`;
    const data = await getJSON(url);
    return data.cast.slice(0, 10); // top 10 cast
  }

  async function getPersonDetails(id) {
    const url = `https://api.themoviedb.org/3/person/${id}?api_key=${apiKey}`;
    return getJSON(url);
  }

  /** get posters for every movie title in arr */
  async function getPosters(arr) {
    const posters = [];
    for (const title of arr) {
      const m = await searchMovie(title);
      posters.push(m?.poster_path ? `https://image.tmdb.org/t/p/original${m.poster_path}` : "/static/images/placeholder.jpg");
    }
    return posters;
  }

  // ────────────────────────────────────────────── high-level workflow
  async function loadDetails(title) {
    try {
      ui.showLoader();
      const movie = await searchMovie(title);
      if (!movie) return ui.showError();

      const details = await getMovieDetails(movie.id);
      const cast    = await getMovieCast(movie.id);

      // ask Flask for similar movies
      const recText = await postForm("/similarity", { name: movie.original_title });
      if (recText.startsWith("Sorry!")) return ui.showError();

      const recArr     = recText.split("---").filter(Boolean);
      const recPosters = await getPosters(recArr);

      // build cast detail arrays
      const castIds   = cast.map((c) => c.id);
      const castNames = cast.map((c) => c.name);
      const castChars = cast.map((c) => c.character);
      const castProfiles = cast.map((c) =>
        c.profile_path ? `https://image.tmdb.org/t/p/original${c.profile_path}` : "/static/images/placeholder.jpg"
      );

      const indCast = await Promise.all(castIds.map(getPersonDetails));
      const castBdays  = indCast.map((p) => new Date(p.birthday).toDateString().split(" ").slice(1).join(" "));
      const castBios   = indCast.map((p) => p.biography);
      const castPlaces = indCast.map((p) => p.place_of_birth);

      /* ---------- compile payload for Flask `/recommend` ---------- */
      const payload = {
        title: movie.original_title,
        cast_ids: JSON.stringify(castIds),
        cast_names: JSON.stringify(castNames),
        cast_chars: JSON.stringify(castChars),
        cast_profiles: JSON.stringify(castProfiles),
        cast_bdays: JSON.stringify(castBdays),
        cast_bios: JSON.stringify(castBios),
        cast_places: JSON.stringify(castPlaces),
        imdb_id: details.imdb_id,
        poster: details.poster_path
          ? `https://image.tmdb.org/t/p/original${details.poster_path}`
          : "/static/images/placeholder.jpg",
        genres: details.genres.map((g) => g.name).join(", "),
        overview: details.overview,
        rating: details.vote_average,
        vote_count: details.vote_count.toLocaleString(),
        release_date: new Date(details.release_date).toDateString().split(" ").slice(1).join(" "),
        runtime:
          details.runtime % 60 === 0
            ? `${Math.floor(details.runtime / 60)} hour(s)`
            : `${Math.floor(details.runtime / 60)} hour(s) ${details.runtime % 60} min(s)`,
        status: details.status,
        rec_movies: JSON.stringify(recArr),
        rec_posters: JSON.stringify(recPosters),
      };

      /* ---------- send to Flask `/recommend` route ---------- */
      const html = await postForm("/recommend", payload);

      /* ---------- update UI ---------- */
      $(".results").html(html);
      $("#autoComplete").val("");
      ui.showResults();
      ui.hideLoader();
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      ui.showError();
      ui.hideLoader();
    }
  }

  // ────────────────────────────────────── DOM events / initial setup
  $(document).ready(() => {
    // enable/disable search button
    $("#autoComplete").on("input", function () {
      $(".movie-button").prop("disabled", this.value.trim() === "");
    });

    // primary search button
    $(".movie-button").on("click", () => {
      const title = $("#autoComplete").val().trim();
      if (title) loadDetails(title);
    });
  });

  // called by inline HTML onclick from each movie card
  window.recommendcard = (el) => loadDetails(el.getAttribute("title"));
})();
