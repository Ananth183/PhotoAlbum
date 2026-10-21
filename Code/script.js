// Photos come from the ../Images folder. Drop images in there (see README):
// the photo list comes from Images/album-data.js, or falls back to the folder listing.
const IMAGES_DIR = "../Images/";
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|bmp)$/i;
const GENERATED_NAME = /^(screenshot|img|dsc|pxl|image|photo|whatsapp|\d)/i;
// Browsers block fetch() for pages opened from disk, so album-data.js is loaded as a script.
const IS_LOCAL_FILE = location.protocol === "file:";
const bundled = window.ALBUM_DATA || {};

async function loadImageFiles() {
  if (Array.isArray(bundled.images) && bundled.images.length) return bundled.images;
  if (IS_LOCAL_FILE) return [];
  try {
    const res = await fetch(IMAGES_DIR, { cache: "no-cache" });
    if (res.ok) {
      const doc = new DOMParser().parseFromString(await res.text(), "text/html");
      const files = [...doc.querySelectorAll("a[href]")]
        .map(a => decodeURIComponent(a.getAttribute("href").split("?")[0].split("/").pop()))
        .filter(name => IMAGE_EXT.test(name));
      return [...new Set(files)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }
  } catch (e) { /* no listing available */ }
  return [];
}

// Optional Images/captions.json: { "photo.jpg": "My caption" }. Blank or missing entries fall back to the filename.
async function loadCaptions() {
  if (IS_LOCAL_FILE) return bundled.captions || {};
  try {
    const res = await fetch(IMAGES_DIR + "captions.json", { cache: "no-cache" });
    if (res.ok) return await res.json();
  } catch (e) { /* captions are optional */ }
  return bundled.captions || {};
}
let captions = {};

// "Week 12 - First scan.jpg" -> "Week 12 - First scan"; camera/screenshot names get a generic caption
function captionFor(file, index) {
  const custom = typeof captions[file] === "string" ? captions[file].trim() : "";
  if (custom) return custom;
  const name = file.replace(IMAGE_EXT, "").replace(/[_]+/g, " ").trim();
  return !name || GENERATED_NAME.test(name) ? `Moment ${index + 1}` : name;
}

const escapeHtml = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const book = document.getElementById("book");
const count = document.getElementById("count");

const cover = `<div class="cover-art"><span class="ornament">&#10084;</span>
  <p class="cover-kicker">The journey of</p><h1>Chandana</h1>
  <p class="cover-sub">A mother in the making</p><span class="ornament">&#10087;</span></div>`;
const intro = `<div class="page-inner intro"><span class="ornament">&#10048;</span><h2>Our Little Miracle</h2>
  <p>Every week, every kick, every dream &mdash; a journey of love, captured page by page.</p></div>`;
const ending = `<div class="page-inner intro"><span class="ornament">&#10084;</span><h2>To Be Continued</h2>
  <p>With love, Chandana &mdash; the best chapter is yet to come.</p></div>`;

const photoPage = (file, n) => {
  const caption = escapeHtml(captionFor(file, n - 1));
  return `<figure class="page-inner">
  <div class="photo"><img data-src="${IMAGES_DIR}${encodeURIComponent(file)}" alt="${caption}"></div>
  <figcaption>${caption}</figcaption><span class="num">${n}</span></figure>`;
};

const leaves = [];
let current = 0; // number of flipped leaves
let isTurning = false;

function buildBook(files) {
  // Sequence of faces: cover, intro, photos..., ending (padded to even)
  const faces = [cover, intro, ...files.map((f, i) => photoPage(f, i + 1)), ending];
  if (faces.length % 2) faces.splice(faces.length - 1, 0, `<div class="page-inner"></div>`);
  for (let i = 0; i < faces.length; i += 2) {
    const leaf = document.createElement("div");
    leaf.className = "leaf" + (i === 0 ? " hard" : "");
    leaf.innerHTML = `<div class="face front">${faces[i]}</div><div class="face back">${faces[i + 1]}</div>`;
    leaf.style.zIndex = faces.length - i;
    book.appendChild(leaf);
    leaves.push(leaf);
  }
}

function render() {
  leaves.forEach((l, i) => {
    l.classList.toggle("flipped", i < current);
    l.style.zIndex = i < current ? i + 1 : leaves.length - i;
  });
  book.classList.toggle("closed-front", current === 0);
  book.classList.toggle("closed-back", current === leaves.length);
  count.textContent = `${current} / ${leaves.length}`;
  document.getElementById("prev").disabled = isTurning || current === 0;
  document.getElementById("next").disabled = isTurning || current === leaves.length;
  scheduleAutoFlip();
}

// Auto-flip: advance every 3s; the timer restarts after any page change,
// so manual turns get a full 3s before the next automatic flip. Loops at the end.
const AUTO_FLIP_MS = 3000;
const autoButton = document.getElementById("autoplay");
let autoPlaying = true;
let autoTimer = null;

function scheduleAutoFlip() {
  clearTimeout(autoTimer);
  if (!autoPlaying || document.hidden) return;
  autoTimer = setTimeout(() => {
    if (current === leaves.length) { current = 0; render(); preloadAround(current); }
    else next();
  }, AUTO_FLIP_MS);
}

function setAutoPlay(on) {
  autoPlaying = on;
  autoButton.setAttribute("aria-pressed", on);
  autoButton.innerHTML = on ? "&#10074;&#10074; <span>Pause</span>" : "&#9654; <span>Play</span>";
  scheduleAutoFlip();
}
autoButton.addEventListener("click", () => setAutoPlay(!autoPlaying));
document.addEventListener("visibilitychange", scheduleAutoFlip);

// Photos start loading before their page is turned to, and a turn waits until the
// photos on the destination spread are decoded, so pages never flip to a blank photo.
const PHOTO_TIMEOUT_MS = 20000;
const PRELOAD_SPREADS_AHEAD = 2;
const imageLoads = new WeakMap();

function showPhotoError(img) {
  const photo = img.closest(".photo");
  if (photo.classList.contains("image-error")) return;
  photo.classList.add("image-error");
  const message = document.createElement("span");
  message.className = "photo-error";
  message.textContent = "Photo could not be loaded";
  photo.appendChild(message);
}

function loadImage(img) {
  if (!imageLoads.has(img)) {
    const source = img.dataset.src;
    img.removeAttribute("data-src");
    img.src = source;
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Timed out after ${PHOTO_TIMEOUT_MS / 1000}s`)), PHOTO_TIMEOUT_MS);
    });
    const load = Promise.race([img.decode(), timeout])
      .catch(error => {
        console.error(`Unable to load album photo: ${source}`, error);
        img.removeAttribute("src");
        showPhotoError(img);
      })
      .finally(() => {
        clearTimeout(timer);
        load.done = true;
      });
    imageLoads.set(img, load);
  }
  return imageLoads.get(img);
}

// Photos visible when `spread` leaves are flipped: back of the last flipped leaf, front of the next one.
function spreadImages(spread) {
  return [[spread - 1, ".back"], [spread, ".front"]].flatMap(([leafIndex, face]) =>
    leafIndex >= 0 && leafIndex < leaves.length
      ? [...leaves[leafIndex].querySelectorAll(`${face} .photo img`)]
      : []
  );
}

const loadSpread = spread => Promise.all(spreadImages(spread).map(loadImage));

function preloadAround(spread) {
  for (let s = spread + 1; s <= spread + PRELOAD_SPREADS_AHEAD; s++) loadSpread(s);
  loadSpread(spread - 1);
}

async function turn(direction) {
  if (isTurning) return;
  const destination = current + direction;
  if (destination < 0 || destination > leaves.length) return;

  isTurning = true;
  book.setAttribute("aria-busy", "true");
  document.getElementById("prev").disabled = true;
  document.getElementById("next").disabled = true;

  try {
    const pending = spreadImages(destination).map(loadImage);
    if (pending.some(load => !load.done)) count.textContent = "Loading photo…";
    await Promise.all(pending);
    current = destination;
  } finally {
    isTurning = false;
    book.removeAttribute("aria-busy");
    render();
    preloadAround(current);
  }
}

const next = () => turn(1);
const prev = () => turn(-1);

document.getElementById("next").onclick = next;
document.getElementById("prev").onclick = prev;
let touchStart = null;
let suppressClickUntil = 0;

book.addEventListener("pointerdown", event => {
  if (event.pointerType === "touch") touchStart = { x: event.clientX, y: event.clientY };
});
book.addEventListener("pointerup", event => {
  if (!touchStart || event.pointerType !== "touch") return;
  const dx = event.clientX - touchStart.x;
  const dy = event.clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
  suppressClickUntil = Date.now() + 500;
  if (dx < 0) next();
  else prev();
});
book.addEventListener("pointercancel", () => { touchStart = null; });
book.addEventListener("click", e => {
  const leaf = e.target.closest(".leaf");
  if (!leaf || Date.now() < suppressClickUntil) return;
  if (leaves.indexOf(leaf) < current) prev();
  else next();
});
const fsButton = document.getElementById("fullscreen");
const root = document.documentElement;
const fsSupported = root.requestFullscreen || root.webkitRequestFullscreen;
if (!fsSupported) fsButton.hidden = true;
fsButton.addEventListener("click", () => {
  const active = document.fullscreenElement || document.webkitFullscreenElement;
  if (active) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  else (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
});
const syncFullscreen = () => {
  const active = !!(document.fullscreenElement || document.webkitFullscreenElement);
  document.body.classList.toggle("is-fullscreen", active);
  fsButton.setAttribute("aria-pressed", active);
  fsButton.querySelector("span").textContent = active ? "Exit full screen" : "Full screen";
};
document.addEventListener("fullscreenchange", syncFullscreen);
document.addEventListener("webkitfullscreenchange", syncFullscreen);

document.addEventListener("keydown", e => {
  if (e.key === "f" || e.key === "F") fsButton.click();
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") prev();
});

(async function init() {
  book.classList.add("closed-front");
  count.textContent = "Loading…";
  let files;
  [captions, files] = await Promise.all([loadCaptions(), loadImageFiles()]);
  buildBook(files);
  render();
  preloadAround(current);
})();
