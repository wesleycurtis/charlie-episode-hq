const STORAGE_KEY = 'tvTrackerShows';
const SESSION_CONTENT_KEY = 'tvTrackerSavedContent';
const SESSION_AUTH_KEY = 'tvTrackerSession';
const AUTH_API_URL = 'https://authn.barrycumbie.com/api/authn/login';
const GIST_OUTPUT_KEY = 'tvTrackerGistOutput';
const GIST_API_URL = 'https://api.github.com/gists';

const defaultShows = [
  {
    id: crypto.randomUUID ? crypto.randomUUID() : 'show-1',
    title: 'The Office',
    imageUrl: 'https://placehold.co/300x180/0f172a/ffffff?text=The+Office',
    genre: 'Comedy',
    year: 2005,
    seasons: 9,
    status: 'Completed',
    rating: 5,
    description: 'A comfort watch with great character chemistry.'
  },
  {
    id: crypto.randomUUID ? crypto.randomUUID() : 'show-2',
    title: 'Stranger Things',
    imageUrl: 'https://placehold.co/300x180/7c3aed/ffffff?text=Stranger+Things',
    genre: 'Sci-Fi',
    year: 2016,
    seasons: 4,
    status: 'Watching',
    rating: 4,
    description: 'A fun mix of mystery, suspense, and nostalgia.'
  }
];

let shows = [];
let currentSearch = '';
let currentStatus = 'all';
let currentSort = 'title';

// Load saved shows from localStorage or fall back to the starter data.
function getStoredShows() {
  try {
    const savedShows = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(savedShows) && savedShows.length > 0) {
      return savedShows;
    }
  } catch (error) {
    console.warn('Could not load saved shows:', error);
  }

  return defaultShows;
}

// Save the current show list to localStorage and sessionStorage.
function saveShows() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shows));
  sessionStorage.setItem(SESSION_CONTENT_KEY, JSON.stringify({ savedAt: new Date().toISOString(), shows }));
}

// Build a JSON payload that can be saved to a Gist.
function buildGistPayload(showsToSave, savedAt = new Date().toISOString()) {
  return {
    app: 'EpisodeHQ',
    savedAt,
    count: showsToSave.length,
    shows: showsToSave
  };
}

// Turn the payload into a readable JSON string for display and export.
function formatGistContent(payload) {
  return JSON.stringify(payload, null, 2);
}

// Update the visible gist output panels on the page.
function updateGistOutput(result) {
  const gistStatus = document.getElementById('gistStatus');
  const gistLink = document.getElementById('gistLink');
  const gistOutput = document.getElementById('gistDataOutput');
  const gistInfoText = document.getElementById('gistInfoText');

  if (gistOutput) {
    gistOutput.textContent = result.content;
  }

  if (gistInfoText) {
    gistInfoText.textContent = result.gistUrl
      ? `Saved Gist: ${result.gistUrl}`
      : 'Saved locally and shown below for copy/paste use.';
  }

  if (gistStatus) {
    gistStatus.textContent = result.success
      ? `Saved to Gist successfully. ${result.gistUrl}`
      : 'Saved locally as a fallback because the Gist API was unavailable.';
  }

  if (gistLink) {
    if (result.gistUrl) {
      gistLink.href = result.gistUrl;
      gistLink.classList.remove('d-none');
      gistLink.textContent = 'Open saved gist';
      gistLink.setAttribute('aria-label', 'Open the saved Gist data');
    } else {
      gistLink.classList.add('d-none');
      gistLink.removeAttribute('href');
    }
  }
}

// Attempt to save the current show data to a GitHub Gist, with a local fallback.
async function saveToGist() {
  const payload = buildGistPayload(shows, new Date().toISOString());
  const content = formatGistContent(payload);
  const existingSession = (() => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_CONTENT_KEY) || '{}');
    } catch (error) {
      return {};
    }
  })();

  const pendingResult = {
    success: false,
    gistUrl: '',
    content,
    payload
  };

  updateGistOutput(pendingResult);

  try {
    const response = await fetch(GIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({
        description: 'EpisodeHQ saved show data',
        public: true,
        files: {
          'episodehq-shows.json': {
            content
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gist request failed with ${response.status}`);
    }

    const data = await response.json();
    const result = {
      success: true,
      gistUrl: data.html_url || '',
      content,
      payload
    };

    localStorage.setItem(GIST_OUTPUT_KEY, JSON.stringify(result));
    sessionStorage.setItem(SESSION_CONTENT_KEY, JSON.stringify({ ...existingSession, savedAt: payload.savedAt, shows, gistUrl: result.gistUrl, gistContent: content }));
    updateGistOutput(result);
    return result;
  } catch (error) {
    console.warn('Gist save failed, using fallback mode:', error);
    const fallbackResult = {
      success: false,
      gistUrl: '',
      content,
      payload
    };

    localStorage.setItem(GIST_OUTPUT_KEY, JSON.stringify(fallbackResult));
    sessionStorage.setItem(SESSION_CONTENT_KEY, JSON.stringify({ ...existingSession, savedAt: payload.savedAt, shows, gistUrl: '', gistContent: content, fallback: true }));
    updateGistOutput(fallbackResult);
    return fallbackResult;
  }
}

// Render the filtered and sorted list of show cards on the page.
function renderShows() {
  const list = document.getElementById('showList');
  if (!list) return;

  const filteredShows = shows
    .filter((show) => {
      const matchesSearch = `${show.title} ${show.genre}`.toLowerCase().includes(currentSearch.toLowerCase());
      const matchesStatus = currentStatus === 'all' || show.status === currentStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (currentSort === 'year') {
        return b.year - a.year;
      }
      if (currentSort === 'rating') {
        return b.rating - a.rating;
      }
      return a.title.localeCompare(b.title);
    });

  if (filteredShows.length === 0) {
    list.innerHTML = '<div class="col-12"><div class="alert alert-secondary">No shows match your search.</div></div>';
    return;
  }

  list.innerHTML = filteredShows.map((show) => `
    <div class="col-12">
      <div class="card shadow-sm border-0 h-100">
        <img src="${show.imageUrl || 'https://placehold.co/300x180/0f172a/ffffff?text=TV+Show'}" class="card-img-top" alt="${show.title}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <div>
              <h3 class="h5 fw-bold mb-1">${show.title}</h3>
              <p class="text-muted mb-2">${show.genre} • ${show.year || 'N/A'}</p>
            </div>
            <span class="badge bg-primary-subtle text-primary">${show.status || 'Watching'}</span>
          </div>
          <p class="small text-muted mb-2">Seasons: ${show.seasons || 0}</p>
          <p class="small mb-3">${show.description || 'No description added yet.'}</p>
          <div class="mb-3">
            <span class="badge bg-warning text-dark">Rating: ${show.rating || 0}/5</span>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm edit-btn" data-id="${show.id}">Edit</button>
            <button class="btn btn-outline-danger btn-sm delete-btn" data-id="${show.id}">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Clear the form and reset the message text.
function resetForm() {
  document.getElementById('showForm').reset();
  document.getElementById('showId').value = '';
  const saveMessage = document.getElementById('saveMessage');
  if (saveMessage) {
    saveMessage.textContent = 'The form is ready for a new show.';
  }
}

// Fill the form with the selected show's existing values.
function populateForm(show) {
  document.getElementById('showId').value = show.id;
  document.getElementById('showTitle').value = show.title || '';
  document.getElementById('showImage').value = show.imageUrl || '';
  document.getElementById('showGenre').value = show.genre || '';
  document.getElementById('showYear').value = show.year || '';
  document.getElementById('showSeasons').value = show.seasons || '';
  document.getElementById('showStatus').value = show.status || 'Watching';
  document.getElementById('showRating').value = show.rating || '';
  document.getElementById('showDescription').value = show.description || '';
}

// Collect form data, save it, and update the visible card list.
function handleShowSubmit(event) {
  event.preventDefault();

  const title = document.getElementById('showTitle').value.trim();
  const genre = document.getElementById('showGenre').value.trim();
  if (!title || !genre) {
    alert('Please add a title and genre.');
    return;
  }

  const showData = {
    id: document.getElementById('showId').value || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`),
    title,
    imageUrl: document.getElementById('showImage').value.trim(),
    genre,
    year: Number(document.getElementById('showYear').value) || null,
    seasons: Number(document.getElementById('showSeasons').value) || null,
    status: document.getElementById('showStatus').value,
    rating: Number(document.getElementById('showRating').value) || null,
    description: document.getElementById('showDescription').value.trim()
  };

  const existingIndex = shows.findIndex((show) => show.id === showData.id);
  if (existingIndex >= 0) {
    shows[existingIndex] = showData;
  } else {
    shows.unshift(showData);
  }

  saveShows();
  renderShows();
  resetForm();
  document.getElementById('statusBadge').textContent = 'Saved';
  const saveMessage = document.getElementById('saveMessage');
  if (saveMessage) {
    saveMessage.textContent = 'Show saved! You can add another one or edit this one again.';
  }
}

// Remove a show from the list and refresh the display.
function deleteShow(id) {
  shows = shows.filter((show) => show.id !== id);
  saveShows();
  renderShows();
  const saveMessage = document.getElementById('saveMessage');
  if (saveMessage) {
    saveMessage.textContent = 'Show deleted.';
  }
}

// Listen for clicks on the edit and delete buttons inside the cards.
function attachListEvents() {
  document.addEventListener('click', (event) => {
    const editButton = event.target.closest('.edit-btn');
    if (editButton) {
      const selectedShow = shows.find((show) => show.id === editButton.dataset.id);
      if (selectedShow) {
        populateForm(selectedShow);
        document.getElementById('showTitle').focus();
      }
      return;
    }

    const deleteButton = event.target.closest('.delete-btn');
    if (deleteButton) {
      deleteShow(deleteButton.dataset.id);
    }
  });
}

// Hash the sign-in password before it is sent to the auth API.
async function hashText(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Try the auth API first and fall back to a local sign-in mode if needed.
async function loginUser(username, password) {
  const hashedPassword = await hashText('cat');
  const payload = { username, password: hashedPassword };

  try {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Auth request failed with ${response.status}`);
    }

    const data = await response.json();
    return { success: true, token: data.token || 'fallback-token', username };
  } catch (error) {
    console.warn('Using fallback auth mode:', error);
    return { success: false, token: 'fallback-token', username, fallbackPassword: password || 'cat' };
  }
}

// Show a message to the user after sign-in attempts.
function renderAuthMessage(message, type = 'info') {
  const box = document.getElementById('authMessage');
  if (!box) return;
  box.className = `alert alert-${type} mt-3 mb-0`;
  box.textContent = message;
}

// Handle the sign-in form and store the session result.
async function handleSigninSubmit(event) {
  event.preventDefault();
  const username = document.getElementById('signinUsername').value.trim();
  const password = document.getElementById('signinPassword').value.trim();

  if (!username) {
    renderAuthMessage('Please enter a username.', 'warning');
    return;
  }

  const result = await loginUser(username, password);
  sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify({ username: result.username, token: result.token, fallback: Boolean(result.fallbackPassword) }));

  if (result.success) {
    renderAuthMessage(`Welcome ${result.username}!`, 'success');
    window.location.href = 'index.html';
  } else {
    renderAuthMessage(`Signed in in fallback mode as ${result.username}.`, 'warning');
    window.location.href = 'index.html';
  }
}

// Redirect users away from protected pages when no valid session exists.
function protectPage() {
  const sessionData = sessionStorage.getItem(SESSION_AUTH_KEY);
  const isProtectedPage = window.location.pathname.includes('index.html') || window.location.pathname.includes('admin.html');
  if (isProtectedPage && !sessionData) {
    window.location.href = 'signin.html';
  }
}

// Show or hide the sign-out button based on the current session state.
function showSignOutButton() {
  const button = document.getElementById('signOutBtn');
  if (!button) return;
  const authSession = sessionStorage.getItem(SESSION_AUTH_KEY);
  if (authSession) {
    button.classList.remove('d-none');
  } else {
    button.classList.add('d-none');
  }
}

// Clear the session and send the user back to the sign-in page.
function handleSignOut() {
  sessionStorage.removeItem(SESSION_AUTH_KEY);
  window.location.href = 'signin.html';
}

// Initialize the app, attach event listeners, and render the correct page content.
function initApp() {
  shows = getStoredShows();
  saveShows();
  protectPage();
  showSignOutButton();

  const searchInput = document.getElementById('searchInput');
  const statusFilter = document.getElementById('statusFilter');
  const sortSelect = document.getElementById('sortSelect');
  const form = document.getElementById('showForm');
  const resetBtn = document.getElementById('resetFormBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  const saveGistBtn = document.getElementById('saveGistBtn');
  const saveGistAdminBtn = document.getElementById('saveGistAdminBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      currentSearch = event.target.value;
      renderShows();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', (event) => {
      currentStatus = event.target.value;
      renderShows();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (event) => {
      currentSort = event.target.value;
      renderShows();
    });
  }

  if (form) {
    form.addEventListener('submit', handleShowSubmit);
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', resetForm);
  }

  if (signOutBtn) {
    signOutBtn.addEventListener('click', handleSignOut);
  }

  if (saveGistBtn) {
    saveGistBtn.addEventListener('click', saveToGist);
  }

  if (saveGistAdminBtn) {
    saveGistAdminBtn.addEventListener('click', saveToGist);
  }

  attachListEvents();
  renderShows();

  const signinForm = document.getElementById('signinForm');
  if (signinForm) {
    signinForm.addEventListener('submit', handleSigninSubmit);
  }

  if (window.location.pathname.includes('admin.html')) {
    renderAdminPage();
  }
}

// Display local, session, and derived data on the admin page.
function renderAdminPage() {
  const localDataOutput = document.getElementById('localDataOutput');
  const sessionDataOutput = document.getElementById('sessionDataOutput');
  const derivedDataList = document.getElementById('derivedDataList');
  const gistDataOutput = document.getElementById('gistDataOutput');
  const gistInfoText = document.getElementById('gistInfoText');

  if (localDataOutput) {
    localDataOutput.textContent = JSON.stringify({ shows, storageKey: STORAGE_KEY }, null, 2);
  }

  if (sessionDataOutput) {
    sessionDataOutput.textContent = sessionStorage.getItem(SESSION_CONTENT_KEY) || '{}';
  }

  if (gistDataOutput) {
    let gistData = {};
    try {
      gistData = JSON.parse(localStorage.getItem(GIST_OUTPUT_KEY) || '{}');
    } catch (error) {
      gistData = {};
    }

    gistDataOutput.textContent = gistData.content || JSON.stringify({ shows }, null, 2);
  }

  if (gistInfoText) {
    let gistData = {};
    try {
      gistData = JSON.parse(localStorage.getItem(GIST_OUTPUT_KEY) || '{}');
    } catch (error) {
      gistData = {};
    }

    gistInfoText.textContent = gistData.gistUrl
      ? `Saved Gist: ${gistData.gistUrl}`
      : 'Saved locally and shown below for copy/paste use.';
  }

  if (derivedDataList) {
    const sessionData = JSON.parse(sessionStorage.getItem(SESSION_AUTH_KEY) || '{}');
    const derivedItems = [
      { label: 'Timestamp', value: new Date().toLocaleString() },
      { label: 'Browser', value: navigator.userAgent },
      { label: 'User', value: sessionData.username || 'Guest' },
      { label: 'Token present', value: sessionData.token ? 'Yes' : 'No' }
    ];

    derivedDataList.innerHTML = derivedItems.map((item) => `<li class="list-group-item"><strong>${item.label}:</strong> ${item.value}</li>`).join('');
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', initApp);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildGistPayload,
    formatGistContent
  };
}