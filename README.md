# EpisodeHQ

> Track your favorite shows in one simple place.

## Author

- Name: Wesley Curtis
- GitHub: [wesleycurtis](https://github.com/wesleycurtis)
- Alfa version link: [Alfa branch](https://github.com/wesleycurtis/charlie-episode-hq/tree/alfa)
- Early App Concept: [Wireframe](https://github.com/wesleycurtis/charlie-episode-hq/wiki/charlie-wireframe)

## Deployments
Dev Server: https://wesleycurtis.github.io/charlie-episode-hq/
Video Production Server: hhtp://34.67.214.35

## Spring 99 / Future Dev Ideas

- Check out this [milestone](https://github.com/wesleycurtis/charlie-episode-hq/milestone/1) for future dev ideas!

## User Story

As a user, I want to track the TV shows I am watching so I can stay organized and quickly find the shows I want to revisit.

## Narrative

EpisodeHQ is a beginner-friendly web app built for the Charlie branch. It helps users manage a personal watchlist with a simple interface for adding, editing, sorting, and saving show information. The app also includes a sign-in experience, an admin page for viewing saved data, and JSON export support for a GitHub Gist.

## Resources

- Languages: HTML, CSS, JavaScript
- Styling: Bootstrap 5, Normalize.css, Google Fonts, Bootstrap Icons
- Libraries and tools: jQuery, GitHub Pages, GitHub Gist, Live Server, Markdown
- Development workflow: GitHub repository, branch structure, issues, and project planning

## Code Snippets

### HTML example: button in the form

```html
<button class="btn btn-primary" type="submit">Save Show</button>
```

This button submits the form so the user can save a new or edited show.

### JavaScript example: event listener for form submission

```js
const form = document.getElementById("showForm");
form.addEventListener("submit", handleShowSubmit);
```

This listens for the form submission and calls the main save function.

### JavaScript example: save function

```js
function handleShowSubmit(event) {
  event.preventDefault();
  // collect form values and save the show
}
```

This function gathers the user's input, creates show data, and stores it in the app.

### HTML example: result area for saved content

```html
<pre id="gistDataOutput"></pre>
```

This element displays the saved JSON output for the user to view or copy.

## Project Links

- GitHub repository: [charlie-episode-hq](https://github.com/wesleycurtis/charlie-episode-hq)
- GitHub Pages: [Live App](https://wesleycurtis.github.io/charlie-episode-hq/)
- GitHub profile: [wesleycurtis](https://github.com/wesleycurtis)

## Project Structure

- /css - styling
- /js - app logic
- /tests - basic checks
- index.html - main app page
- signin.html - sign-in page
- admin.html - admin dashboard
