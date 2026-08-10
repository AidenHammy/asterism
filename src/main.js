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
  return date.toISOString().slice(0, 10);
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

async function buildApodError(response){ 
  if(response.status === 429) {
    return new Error("NASA's demo key hit its hourly limit. add your own key (readme) or just wait a bit");
  }
  if(response.status === 400 || response.status === 404) {
    return new Error('nothing exists for that date! apod started at june 16 1995');
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
      if(!response.ok) throw await buildApodError(response);
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

