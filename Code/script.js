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

const cover = `<div class="cover-art"><span class="ornament">&#10087;</span>
  <h1>Photo Album</h1><p>Memories &amp; moments</p><span class="ornament">&#10087;</span></div>`;
const intro = `<div class="page-inner intro"><h2>Welcome</h2>
  <p>Turn the pages to relive the moments.</p></div>`;
const ending = `<div class="page-inner intro"><h2>The End</h2>
  <p>Thank you for looking.</p></div>`;

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
leaves.forEach((l, i) => l.addEventListener("click", () => (i < current ? prev() : next())));
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") next();
  if (e.key === "ArrowLeft") prev();
});
render();
