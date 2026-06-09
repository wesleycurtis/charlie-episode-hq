console.log("App Loaded");
console.log("TV Show Tracker Initialized");

// store shows
let shows = JSON.parse(localStorage.getItem("shows")) || [];

// handle form submission (home page)
$(document).ready(function () {

  $("#showForm").on("submit", function (e) {
    e.preventDefault();

    const show = {
      name: $("#showName").val(),
      genre: $("#genre").val(),
      episodes: $("#episodes").val()
    };

    shows.push(show);
    localStorage.setItem("shows", JSON.stringify(shows));

    console.log("Show added:", show);

    console.log("Show added successfully");

    $("#showForm")[0].reset();
  });

  // admin page rendering
  if (window.location.pathname.includes("admin.html")) {
    $("#showCount").text("Shows Loaded: " + shows.length);

    shows.forEach(s => {
      $("#showList").append(`
        <div>
          <h4>${s.name}</h4>
          <p>Genre: ${s.genre}</p>
          <p>Episodes: ${s.episodes}</p>
        </div>
      `);
    });
  }

});