
https://ananth183.github.io/PhotoAlbum/Code/index.html

## Managing photos

Photos are read from the `Images/` folder — nothing is hard-coded in `script.js`.

- **Add / remove / rename** pictures in `Images/`.
- The page reads `Images/images.json`. It is rebuilt automatically by the
  *Update image list* GitHub Action whenever you push changes under `Images/`.
  To rebuild it locally instead, run `.\update-images.ps1`.
- Pages follow filename order (numbers sort naturally, so `Week 2` comes before `Week 10`).
- **Captions:** edit `Images/captions.json`, one line per photo:
  `"photo.jpg": "Week 12 — our first scan"`. Running `.\update-images.ps1` (or the GitHub Action)
  adds new photos to that file with an empty caption for you to fill in, keeps the captions you
  wrote, and drops entries for deleted photos. If a caption is left empty the filename is used
  instead (`Week 12 - First scan.jpg` → "Week 12 - First scan"); camera/screenshot style names
  (`IMG_…`, `Screenshot …`) fall back to "Moment N". Long captions wrap to two lines.
- Supported: png, jpg/jpeg, gif, webp, avif, bmp.
- Running locally with a server that lists folders (e.g. `python -m http.server`) also works
  without `images.json`.

