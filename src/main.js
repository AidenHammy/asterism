document.getElementById("datepicker").addEventListener("change", () => {
  const date = document.querySelector("#datepicker").value;
  const API_KEY = import.meta.env.VITE_NASA_API_KEY;
  document.querySelector("#app").innerHTML = "<p>Hello world</p>";

  fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`);
});

const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY;

const APOD_ENDPOINT = "https://api.nasa.gov/planetary/apod";
const APOD_FIRST_DATE = "1995-06-16" // apod didn't exist before this, had to search this up because who would've known

const els = {
  dateInput = document.getElementById('date-input'),
  prevDay = document.getElementById('prev-day'),
  nextDay = document.getElementById('next-day'),
  todayBtn = document.getElementById('today-btn'),
  randomBtn = document.getElementById('random-btn'),

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
  drawerClose: document.getElementById('logbook-close'),
  drawerBackdrop: document.getElementById('logbook-backdrop'),

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
  return date.toLocaleDateString({
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
  els.plate.classList.add('hidden');

  updateSaveButton();
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