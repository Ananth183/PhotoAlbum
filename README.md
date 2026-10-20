
https://ananth183.github.io/PhotoAlbum/Code/index.html

## Managing photos

Photos are read from the `Images/` folder — nothing is hard-coded in `script.js`.

- **Add / remove / rename** pictures in `Images/`.
- The page reads `Images/images.json`. It is rebuilt automatically by the
  *Update image list* GitHub Action whenever you push changes under `Images/`.
  To rebuild it locally instead, run `.\update-images.ps1`.
- Pages follow filename order (numbers sort naturally, so `Week 2` comes before `Week 10`).
- The caption is the filename without its extension, e.g. `Week 12 - First scan.jpg`
  shows "Week 12 - First scan". Camera/screenshot style names (`IMG_…`, `Screenshot …`)
  get a generic "Moment N" caption.
- Supported: png, jpg/jpeg, gif, webp, avif, bmp.
- Running locally with a server that lists folders (e.g. `python -m http.server`) also works
  without `images.json`.

