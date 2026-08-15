const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY;

const APOD_ENDPOINT = "https://api.nasa.gov/planetary/apod";
const APOD_FIRST_DATE = "1995-06-16" // apod didn't exist before this, had to search this up because who would've known

// this is literally the very first thing i wrote for this project, back
// when i was just checking the api actually returned data before building
// any of the real UI. never deleted it, feels wrong to at this point.
// it's basically a fossil
function _originalTest() {
  document.querySelector("#app").innerHTML = "<p>Hello world</p>";
}

const els = {
  dateInput: document.getElementById('date-input'),
  prevDay: document.getElementById('prev-day'),
  nextDay: document.getElementById('next-day'),
  todayBtn: document.getElementById('today-btn'),
  randomBtn: document.getElementById('random-btn'),

  loading: document.getElementById('loading'),
  error: document.getElementById('error'),
  errorMessage: document.getElementById('error-message'),
  retryBtn: document.getElementById('retry-btn'),
  plate: document.getElementById('plate'),
  
  img: document.getElementById('apod-img'),
  video: document.getElementById('apod-video'),
  expandBtn: document.getElementById('expand-btn'),
  metaDate: document.getElementById('meta-date'),
  metaCopyrightRow: document.getElementById('meta-copyright-row'),
  metaCopyright: document.getElementById('meta-copyright'),
  title: document.getElementById('apod-title'),
  explanation: document.getElementById('apod-explanation'),
  hdLink: document.getElementById('hd-link'),
  saveBtn: document.getElementById('save-btn'),

  // archive

  archiveBtn: document.getElementById('archive-btn'),
  archiveView: document.getElementById('archive-view'),
  archiveClose: document.getElementById('archive-close'),
  archiveGrid: document.getElementById('archive-grid'),
  archiveLoading: document.getElementById('archive-loading'),
  archiveMonthLabel: document.getElementById('archive-month-label'),
  archivePrevMonth: document.getElementById('archive-prev-month'),
  archiveNextMonth: document.getElementById('archive-next-month'),

  onThisDay: document.getElementById('on-this-day'),
  pastYearsStrip: document.getElementById('past-years-strip'),

  //saved entries drawer thing
  logbookToggle: document.getElementById('logbook-toggle'),
  logbookCount: document.getElementById('logbook-count'),
  logbookDrawer: document.getElementById('logbook-drawer'),
  logbookList: document.getElementById('logbook-list'),
  logbookEmpty: document.getElementById('logbook-empty'),
  drawerClose: document.getElementById('drawer-close'),
  drawerBackdrop: document.getElementById('drawer-backdrop'),

  lightbox: document.getElementById('lightbox'),
  lightboxImg: document.getElementById('lightbox-img'),
  lightboxClose: document.getElementById('lightbox-close'),
};

let currentEntry = null;

const cache = new Map(); // flipping back to a date you already looked at doesn't re-fetch it BUT it resets on refresh

function toDateStr(date){
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() is 0-indexed
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayStr() {
  return toDateStr(new Date());
}

function shiftDate(dateStr, days){
  var date = new Date(dateStr + 'T00:00:00'); // the T00:00:00 matters or it can shift a day depending on timezone
                                              // learned that the hard way
  date.setDate(date.getDate() + days);
  return toDateStr(date);
}

function randomDateStr() {
  const earliestTime = new Date(APOD_FIRST_DATE + 'T00:00:00').getTime();
  const latestTime = new Date(todayStr() + 'T00:00:00').getTime();
  const randomTime = earliestTime + Math.random() * (latestTime - earliestTime);
  return toDateStr(new Date(randomTime));
}

const formatDisplayDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
};

// lemme talk to nasa

function setLoading() {
  els.loading.classList.remove('hidden');
  els.error.classList.add('hidden');
  els.plate.classList.add('hidden');
}

function setError(message) {
  els.errorMessage.textContent = message;
  els.loading.classList.add('hidden');
  els.error.classList.remove('hidden');
  els.plate.classList.add('hidden');
}

function renderApod(data) {
  currentEntry = data;

  els.title.textContent = data.title || 'Untitled plate';
  els.explanation.textContent = data.explanation || '';
  els.metaDate.textContent = formatDisplayDate(data.date);

  if(data.copyright){
    els.metaCopyrightRow.classList.remove('hidden');
    els.metaCopyright.textContent = data.copyright.trim();
  } else {
    els.metaCopyrightRow.classList.add('hidden');
  }

  const isVideo = data.media_type == 'video';

  els.img.classList.toggle('hidden', isVideo);
  els.video.classList.toggle('hidden', !isVideo);
  els.expandBtn.classList.toggle('hidden', isVideo);

  if (isVideo) {
    els.video.src = data.url;
    els.hdLink.href = data.url;
  } else {
    els.img.src = data.url
    els.img.alt = data.title || 'NASA APOD';
    els.hdLink.href = data.hdurl || data.url // not everything has an hdurl apparently
  }

  els.loading.classList.add('hidden');
  els.error.classList.add('hidden');
  els.plate.classList.remove('hidden');

  updateSaveButton();
}

async function buildApodError(response, dateStr){ 
  if(response.status === 400 || response.status === 404) {
    if (dateStr && dateStr < APOD_FIRST_DATE) {
      return new Error('nothing exists for that date! apod started at june 16 1995 (i swear i had to search this up. DON\'T call me a nerd!)');
    }
    if (dateStr && dateStr >= todayStr()) {
      return new Error("today's plate isn't up yet! NASA usually posts it later in the day. try again in a bit or check yesterday");
    }
    return new Error("no plate found for that date");
  }

  const body = await response.json().catch(() => ({}));
  return new Error(body.msg || `archive returned an error (${response.status})`);
}

async function loadApod(dateStr){
  setLoading();
  els.dateInput.value = dateStr;

  try {
    let data = cache.get(dateStr);
    if (!data) {
      const url = APOD_ENDPOINT + "?api_key=" + encodeURIComponent(NASA_API_KEY) + "&date=" + dateStr + "&thumbs=true";
      const response = await fetch(url);
      if(!response.ok) throw await buildApodError(response, dateStr);
      data = await response.json();
      cache.set(dateStr, data);
    }
    renderApod(data);
    loadOnThisDay(dateStr);
  } catch (err) {
    console.error(err);
    setError(err.message);
  }
}

// date nav buttons

els.dateInput.addEventListener('change', () => {
  if (els.dateInput.value) loadApod(els.dateInput.value);
});

els.prevDay.addEventListener('click', () => {
  const currentDate = els.dateInput.value || todayStr();
  loadApod(shiftDate(currentDate, -1));
});

els.nextDay.addEventListener('click', () => {
  const currentDate = els.dateInput.value || todayStr();
  const nextDate = shiftDate(currentDate, 1);
  if (nextDate <= todayStr()) loadApod(nextDate); // next SHALL NOT. go past today! RAH
})

function goToToday() {
  loadApod(todayStr());
}

els.todayBtn.addEventListener('click', goToToday);
els.randomBtn.addEventListener('click', () => loadApod(randomDateStr()));
els.retryBtn.addEventListener('click', () => loadApod(els.dateInput.value || todayStr()));

// lightbox

els.expandBtn.addEventListener('click', () => {
  if (!currentEntry) return;
  els.lightboxImg.src = currentEntry.hdurl || currentEntry.url;
  els.lightboxImg.alt = currentEntry.title || "";
  els.lightbox.classList.remove('hidden');
});

function closeLightbox(){
  els.lightbox.classList.add('hidden');
}

els.lightboxClose.addEventListener('click', closeLightbox);

els.lightbox.addEventListener('click', (e) => {
  // closing if backgruond is clicked and not the image itself
  if (e.target === els.lightbox) closeLightbox();
});


// keyboard shortcuts, idk personally it helps a lot

document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape'){
    closeLightbox();
    closeDrawer();
    closeArchive();
    return;
  }

  if (document.activeElement === els.dateInput) return; // lets NOT fight the native datepicker's own arrow key behaviour

  const archiveIsOpen = !els.archiveView.classList.contains('hidden');
  const lightboxIsOpen = !els.lightbox.classList.contains('hidden');
  if (archiveIsOpen || lightboxIsOpen) return;
  if (e.key === 'ArrowLeft') els.prevDay.click();
  if (e.key === 'ArrowRight') els.nextDay.click();

});

// logbook or call it saved favourites, same thing
// using localstorage so it doesn't need backend and survives a refresh asw

const STORAGE_KEY = "fieldlog.entries";

function getSavedEntries(){
  try{
    const stored = localStorage.getItem(STORAGE_KEY) || "[]";
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function setSavedEntries(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  renderLogbook();
}

function isSaved(dateStr) {
  return getSavedEntries().some(entry => entry.date == dateStr);
}

function updateSaveButton() {
  if (!currentEntry) return;
  const saved = isSaved(currentEntry.date);
  els.saveBtn.textContent = saved ? "Saved to log" : "Add to log";
  els.saveBtn.classList.toggle("is-saved", saved);
}

els.saveBtn.addEventListener('click', () => {
  if(!currentEntry) return;

  const savedList = getSavedEntries();
  const existingIndex = savedList.findIndex((entry) => entry.date === currentEntry.date);

  if(existingIndex >= 0){
    savedList.splice(existingIndex, 1); // already saved, remove it
  } else {
    // don't need the whole apod object, just enough to show it in the drawer later
    savedList.unshift({
      date: currentEntry.date,
      title: currentEntry.title,
      media_type: currentEntry.media_type,
      thumb: currentEntry.media_type === 'video' ? (currentEntry.thumbnail_url || '') : currentEntry.url
    });
  }
  setSavedEntries(savedList);
  updateSaveButton();
});

function renderLogbook() {
  const savedList = getSavedEntries();
 
  els.logbookCount.textContent = savedList.length;
  els.logbookList.innerHTML = '';
  els.logbookEmpty.classList.toggle('hidden', savedList.length > 0);
 
  savedList.forEach((entry) => {
    els.logbookList.appendChild(buildLogbookRow(entry));
  });
}

function buildLogbookRow(entry) {
  const row = document.createElement("li");
  row.className = "logbook-item";
 
  var thumbnail = document.createElement("img");
  thumbnail.src = entry.thumb || "";
  thumbnail.alt = "";
  thumbnail.loading = "lazy";
 
  const textWrap = document.createElement("div");
  textWrap.className = "logbook-item-info";
 
  const titleEl = document.createElement("p");
  titleEl.className = "logbook-item-title";
  titleEl.textContent = entry.title || "Untitled plate";
 
  const dateEl = document.createElement("p");
  dateEl.className = "logbook-item-date";
  dateEl.textContent = formatDisplayDate(entry.date);
 
  textWrap.append(titleEl, dateEl);
 
  const removeBtn = document.createElement("button");
  removeBtn.className = "logbook-item-remove";
  removeBtn.textContent = "✕";
  removeBtn.addEventListener("click", function (e) {
    e.stopPropagation(); // otherwise clicking remove also opens the row underneath it, annoying bug I hit while testing
    const withoutThisEntry = getSavedEntries().filter((e2) => e2.date !== entry.date);
    setSavedEntries(withoutThisEntry);
    if (currentEntry && currentEntry.date === entry.date) updateSaveButton();
  });
 
  row.addEventListener("click", () => {
    loadApod(entry.date);
    closeDrawer();
  });
 
  row.append(thumbnail, textWrap, removeBtn);
  return row;
}

function openDrawer() {
  els.logbookDrawer.classList.add('open');
  els.drawerBackdrop.classList.remove('hidden');
}
 
function closeDrawer() {
  els.logbookDrawer.classList.remove('open');
  els.drawerBackdrop.classList.add('hidden');
}
 
els.logbookToggle.addEventListener('click', openDrawer);
els.drawerClose.addEventListener('click', closeDrawer);
els.drawerBackdrop.addEventListener('click', closeDrawer);

// "on this day" strip (same date, past years) 
 
const onThisDayCache = new Map();
 
async function loadOnThisDay(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const firstYear = Number(APOD_FIRST_DATE.slice(0, 4));
 
  const pastYears = [];
  for (let y = year - 1; y >= firstYear && pastYears.length < 4; y--) {
    pastYears.push(y);
  }
 
  if (pastYears.length === 0) {
    els.onThisDay.classList.add('hidden');
    return;
  }
 
  if (onThisDayCache.has(dateStr)) {
    renderOnThisDay(onThisDayCache.get(dateStr));
    return;
  }
 
  const pastDates = pastYears
    .map((y) => `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
    .filter((d) => !(month === 2 && day === 29 && !isLeapYear(Number(d.slice(0, 4))))); // feb 29 doesn't exist most years lol
 
  // fetching these one at a time instead of Promise.all-ing them. slightly
  // slower but only 4 requests so who cares and it's easier to follow
  const foundEntries = [];
  for (const pastDate of pastDates) {
    const entry = await fetchApodQuietly(pastDate);
    if (entry) foundEntries.push(entry);
  }
 
  onThisDayCache.set(dateStr, foundEntries);
  renderOnThisDay(foundEntries);
}
 
// same as loadApod's fetch but swallows errors instead of throwing 
// one missing past year shouldn't nuke the whole strip
async function fetchApodQuietly(dateStr) {
  if (cache.has(dateStr)) return cache.get(dateStr);
 
  try {
    const url = `${APOD_ENDPOINT}?api_key=${encodeURIComponent(NASA_API_KEY)}&date=${dateStr}`;
    const response = await fetch(url);
    if (!response.ok) return null;
 
    const data = await response.json();
    cache.set(dateStr, data);
    return data;
  } catch {
    return null;
  }
}
 
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
 
function renderOnThisDay(entries) {
  if (entries.length === 0) {
    els.onThisDay.classList.add('hidden');
    return;
  }
 
  els.onThisDay.classList.remove('hidden');
  els.pastYearsStrip.innerHTML = '';
 
  entries.forEach((entry) => {
    els.pastYearsStrip.appendChild(buildOnThisDayCard(entry));
  });
}
 
function buildOnThisDayCard(entry) {
  const card = document.createElement('div');
  card.className = 'past-year-card';
 
  const thumb = entry.media_type === 'video' ? (entry.thumbnail_url || '') : entry.url;
  const year = entry.date.slice(0, 4);
 
  card.innerHTML = `
    <img src="${thumb}" alt="" loading="lazy">
    <div class="past-year-info">
      <p class="past-year-label">${year}</p>
      <p class="past-year-title"></p>
    </div>`;
  
  card.querySelector('.past-year-title').textContent = entry.title || 'Untitled plate';
 
  card.addEventListener('click', () => loadApod(entry.date));
  return card;
}

//  archive (browse a whole month)
 
let archiveCursor = new Date(); // whatever month is currently showing
const archiveCache = new Map();
 
function openArchive() {
  const baseDate = els.dateInput.value ? new Date(els.dateInput.value + 'T00:00:00') : new Date();
  archiveCursor = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
 
  els.archiveView.classList.remove('hidden');
  loadArchiveMonth();
}
 
function closeArchive(){
  els.archiveView.classList.add('hidden');
}
 
async function loadArchiveMonth() {
  const year = archiveCursor.getFullYear();
  const month = archiveCursor.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
 
  els.archiveMonthLabel.textContent = archiveCursor.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
 
  const now = new Date();
  els.archiveNextMonth.disabled =
    archiveCursor.getFullYear() === now.getFullYear() &&
    archiveCursor.getMonth() === now.getMonth(); // no point letting people page into a month with nothing in it yet
 
  els.archiveGrid.innerHTML = '';
  els.archiveLoading.classList.remove('hidden');
 
  try {
    let monthEntries = archiveCache.get(monthKey);
 
    if (!monthEntries) {
      const startDate = `${monthKey}-01`;
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate(); // "day 0 of next month" rolls back to the last day of this one
      const endDate = `${monthKey}-${String(lastDayOfMonth).padStart(2, '0')}`;
      const cappedEndDate = endDate > todayStr() ? todayStr() : endDate;
 
      const url = `${APOD_ENDPOINT}?api_key=${encodeURIComponent(NASA_API_KEY)}&start_date=${startDate}&end_date=${cappedEndDate}`;
      const response = await fetch(url);
      if (!response.ok) throw await buildApodError(response);
 
      monthEntries = await response.json();
      archiveCache.set(monthKey, monthEntries);
      monthEntries.forEach((entry) => cache.set(entry.date, entry));
    }
 
    renderArchiveGrid(monthEntries);
  } catch (err) {
    els.archiveGrid.innerHTML = `<p class="drawer-hint">${err.message}</p>`;
  } finally {
    els.archiveLoading.classList.add('hidden');
  }
}
 
function renderArchiveGrid(entries) {
  els.archiveGrid.innerHTML = '';
 
  // nasa gives these oldest-first, flipping it feels more natural to scroll through
  const newestFirst = [...entries].reverse();
 
  newestFirst.forEach((entry) => {
    els.archiveGrid.appendChild(buildArchiveCard(entry));
  });
}
 
function buildArchiveCard(entry) {
  const card = document.createElement('div');
  card.className = 'archive-card';
 
  const thumb = entry.media_type === 'video' ? (entry.thumbnail_url || '') : entry.url;
  const dayNumber = Number(entry.date.slice(8, 10));
 
  card.innerHTML = `
    <img src="${thumb}" alt="" loading="lazy">
    <div class="archive-card-info">
      <p class="archive-card-day">Day ${dayNumber}</p>
      <p class="archive-card-title"></p>
    </div>`;
 
  card.querySelector('.archive-card-title').textContent = entry.title || 'Untitled plate';
 
  card.addEventListener('click', () => {
    loadApod(entry.date);
    closeArchive();
  });
 
  return card;
}
 
els.archiveBtn.addEventListener('click', openArchive);
els.archiveClose.addEventListener('click', closeArchive);
 
els.archivePrevMonth.addEventListener('click', () => {
  archiveCursor = new Date(archiveCursor.getFullYear(), archiveCursor.getMonth() - 1, 1);
  loadArchiveMonth();
});
 
els.archiveNextMonth.addEventListener('click', () => {
  archiveCursor = new Date(archiveCursor.getFullYear(), archiveCursor.getMonth() + 1, 1);
  loadArchiveMonth();
});

// starfield bg, i mean decoration is nice. just draws twinkly dots behind everything
// couldn't do this myself so i had to go to google and also see a tutorial.
// actually fun fact, most of my js is from tutorials. i don't like to use ai because
// what's the point when you're just gonna copy without understanding anything?
// atleast the tutorials explain what you're doing so you can recall it the next time!
 
function initStarfield() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];
 
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
  function layoutStars() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
 
    const starCount = Math.floor((canvas.width * canvas.height) / 9000); 
 
    stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.1 + 0.2,
      baseAlpha: Math.random() * 0.6 + 0.2,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
    }));
  }
 
  function drawFrame(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
 
    for (const star of stars) {
      const twinkle = prefersReducedMotion
        ? 0
        : Math.sin(time * star.twinkleSpeed + star.phase) * 0.35;
      const alpha = Math.max(0, Math.min(1, star.baseAlpha + twinkle));
 
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#e8e4d8';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
 
    ctx.globalAlpha = 1;
    if (!prefersReducedMotion) requestAnimationFrame(drawFrame);
  }
 
  window.addEventListener('resize', layoutStars);
  layoutStars();
  requestAnimationFrame(drawFrame);
}
 
 
// -kicking everything off

els.dateInput.max = todayStr();
els.dateInput.min = APOD_FIRST_DATE;
 
initStarfield();
renderLogbook();
loadApod(todayStr());