// Add or remove entries here; the book rebuilds itself.
const photos = [
  { file: "Screenshot 2026-09-30 123723.png", caption: "Page one" },
  { file: "Screenshot 2026-09-30 123741.png", caption: "Page two" },
  { file: "Screenshot 2026-09-30 141931.png", caption: "Page three" },
  { file: "Screenshot 2026-10-01 091028.png", caption: "Page four" },
  { file: "Screenshot 2026-10-01 091528.png", caption: "Page five" },
  { file: "Screenshot 2026-10-02 115338.png", caption: "Page six" },
];

const book = document.getElementById("book");
const count = document.getElementById("count");

const cover = `<div class="cover-art"><span class="ornament">&#10084;</span>
  <p class="cover-kicker">The journey of</p><h1>Chandana</h1>
  <p class="cover-sub">A mother in the making</p><span class="ornament">&#10087;</span></div>`;
const intro = `<div class="page-inner intro"><span class="ornament">&#10048;</span><h2>Our Little Miracle</h2>
  <p>Every week, every kick, every dream &mdash; a journey of love, captured page by page.</p></div>`;
const ending = `<div class="page-inner intro"><span class="ornament">&#10084;</span><h2>To Be Continued</h2>
  <p>With love, Chandana &mdash; the best chapter is yet to come.</p></div>`;

const photoPage = (p, n) => `<figure class="page-inner">
  <div class="photo"><img src="../Images/${encodeURIComponent(p.file)}" alt="${p.caption}" loading="lazy"></div>
  <figcaption>${p.caption}</figcaption><span class="num">${n}</span></figure>`;

// Sequence of faces: cover, intro, photos..., ending (padded to even)
const faces = [cover, intro, ...photos.map((p, i) => photoPage(p, i + 1)), ending];
if (faces.length % 2) faces.splice(faces.length - 1, 0, `<div class="page-inner"></div>`);

const leaves = [];
for (let i = 0; i < faces.length; i += 2) {
  const leaf = document.createElement("div");
  leaf.className = "leaf" + (i === 0 ? " hard" : "");
  leaf.innerHTML = `<div class="face front">${faces[i]}</div><div class="face back">${faces[i + 1]}</div>`;
  leaf.style.zIndex = faces.length - i;
  book.appendChild(leaf);
  leaves.push(leaf);
}

let current = 0; // number of flipped leaves

function render() {
  leaves.forEach((l, i) => {
    l.classList.toggle("flipped", i < current);
    l.style.zIndex = i < current ? i + 1 : leaves.length - i;
  });
  book.classList.toggle("closed-front", current === 0);
  book.classList.toggle("closed-back", current === leaves.length);
  count.textContent = `${current} / ${leaves.length}`;
  document.getElementById("prev").disabled = current === 0;
  document.getElementById("next").disabled = current === leaves.length;
}

const next = () => { if (current < leaves.length) { current++; render(); } };
const prev = () => { if (current > 0) { current--; render(); } };

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
leaves.forEach((l, i) => l.addEventListener("click", () => {
  if (Date.now() < suppressClickUntil) return;
  if (i < current) prev();
  else next();
}));
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
render();
