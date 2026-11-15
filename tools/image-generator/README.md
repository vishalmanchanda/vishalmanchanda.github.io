# Scripture Image Studio & GitHub Publisher 🕉️

A specialized UI tool to generate AI artwork for scripture chapters and verses (such as Katha Upanishad, Bhagavad Gita, etc.) from JSON files and save/publish them directly into:
```
assets/content/images/<folder>/<filename>.jpg
```
Matching the repository structure:
`https://github.com/vishalmanchanda/vishalmanchanda.github.io/tree/master/assets/content/images`

---

## 🚀 Quick Start

Run the launcher script from the repository root:
```bash
./tools/image-generator/run.sh
```

Or start the server directly using Python 3 or Node.js:
```bash
# Using Python (zero external dependencies)
python3 tools/image-generator/server.py

# OR using Node.js
node tools/image-generator/server.js
```

Then open your browser at:
👉 **[http://localhost:8085/tools/image-generator/](http://localhost:8085/tools/image-generator/)**

---

## 📋 Features

### 1. Searchable Slide-over Folder Drawer & Local Repo Images
- **Visual Folder Picker Bar**: Replaces static dropdowns with an interactive, stylish destination bar in Step 2 displaying the active folder's formatted title, disk path (`assets/content/images/<folder>/`), and total image count with uncommitted badges.
- **Searchable Slide-over Drawer (`#folderDrawer`)**:
  - Click the folder picker bar or **`🔍 Browse Folders`** to slide in a modern, semi-transparent backdrop blurred drawer from the right.
  - **Instant Real-Time Search**: Search through available scripture folders by name or keywords (e.g. `katha`, `gita`, `skanda`, `aitareya`).
  - **Folder Cards with Mini-Thumbnails**: Each folder card displays:
    - Formatted title and full disk slug.
    - Status badges: `✓ Current` active indicator, total image count badge, and `⚡ X uncommitted` badge if local edits exist.
    - **Visual Image Chips**: Mini 38×38 preview thumbnails showing the first 4 images inside that folder, plus a `+N more` counter.
  - **Inline Folder Creation**: Quickly create a new destination subfolder directly inside the drawer with **`➕ Create & Select`**.
  - **1-Click Search-to-Create**: If a search query yields no matches, a 1-click button allows creating that folder immediately.
  - **Drawer Actions**: Rescan disk folders at any time with **`🔄 Rescan`**, close with **`✕`**, backdrop click, or **`Esc`** key.
  - **Manual Path Override**: Click **`✏️ Edit Path`** in Step 2 to toggle a collapsible text input for custom typing.
- **Direct Local Disk Scanning**: Choose any subfolder and view local disk images instantly.
- **See Uncommitted Files Instantly**: Scans files directly on the local filesystem in `assets/content/images/<folder>/`—even if they are **uncommitted, newly created, untracked, or modified** in git.
- **Git Status Indicators**:
  - `⚡ Uncommitted (Disk)`: Highlighted with an orange badge indicating the file has local uncommitted changes.
  - `💾 Saved (Git)`: Highlighted with a green badge indicating the file is committed cleanly in git.
- **⚡ Uncommitted Filter**: Filter specifically for uncommitted images (`⚡ Uncommitted (X)`) to easily review local changes before committing.
- **Cache-Busting Direct Serving**: Images are fetched with real-time modification timestamps (`?t=timestamp`), guaranteeing you always see the latest disk version without stale browser caching.
- **Dynamic Simple JSON**: Automatically generates a lightweight JSON with `id` and `title` derived from image filenames (e.g., `1-1-1.jpg` &rarr; `1.1.1`, `cover.jpg` &rarr; `Cover`).
- **➕ Add New Card**: Click **`➕ Add Card`** in the toolbar or click the placeholder card at the end of the grid. It auto-suggests the next verse number (e.g. `1.1.4`), creates the card, and lets you immediately paste (`Cmd+V`), upload, or generate an image!
- **Card Controls**: Rename any title with **`✏️`** (which updates its target filename) or delete with **`🗑️`** (with optional disk deletion).
- **JSON Upload & Parsing**: You can still upload or paste a complete chapter JSON with Sanskrit passages, Hindi meanings, and commentaries whenever you want full textual metadata.

### 2. Strict Naming Convention
- Converts dots in titles to hyphens:
  - `"1.1.1"` &rarr; **`1-1-1.jpg`**
  - `"1.1.2"` &rarr; **`1-1-2.jpg`**
  - `"2.64"` &rarr; **`2-64.jpg`**
- Preview each image's destination path directly on each card:
  `assets/content/images/katha-upanishad_hi/1-1-1.jpg`

### 3. Smart Vedic Prompt Synthesis
- Automatically analyzes the Sanskrit shloka, Hindi meaning, and commentary to synthesize vivid visual prompts (e.g., *Sage Uddalaka at the holy Vishvajit fire altar, boy Nachiketa contemplating sacred cows, chariot of the body and mind*).
- Multiple authentic art styles to choose from:
  - **Raja Ravi Varma Oil Painting** (Vedic realism, rich oil canvas)
  - **Divine Golden Radiance** (Ethereal glow, sacred aura)
  - **Cinematic Vedic Realism (3D)**
  - **Ancient Indian Temple Fresco / Mural**
  - **Mythological Watercolor**
  - **Custom Art Style description**
- **Prompt Actions**:
  - **📋 Copy Prompt**: One-click copy of any verse's visual prompt to your clipboard.
  - **✨ Open in Gemini**: Copies the prompt and opens Google Gemini in a new browser tab with the prompt pre-formatted for image generation (`Cmd+V` / `Ctrl+V` to paste).
  - **📋 Copy All Prompts**: Batch copies all prompts for all verses in the chapter at once.
- Prompts are fully editable on every card before generating.

### 4. Uncropped Pasting & Hover-to-View-Full Display
- **📥 Paste As Is (No Auto-Cropping)**:
  - When an image is pasted (via **`📥 Paste Image`**, **`Cmd + V`**, or drag-and-drop), it is **not** cropped to a square.
  - Its natural aspect ratio (widescreen 16:9, portrait 9:16, standard 4:3) is strictly preserved without cutting off any edges.
  - Automatically compressed using visually lossless multi-step downsampling (keeps file size small, e.g. ~150KB–250KB, without losing visual quality).
- **👁️ Display Fully on Hover**:
  - In the verse card grid, images maintain a clean, uniform card layout.
  - Hovering your cursor over the card's image box instantly transitions to **`object-fit: contain`**, displaying the **full, uncropped image** with zero edges clipped.
  - An illuminated, frosted backdrop softly matches the artwork's colors in the margins.
  - An aspect ratio badge (e.g. `📐 16:9 Wide`) appears on non-square artwork, and a glowing gold pill (`👁️ Full uncropped view`) appears on hover.
- **📋 Copy Image to Clipboard**:
  - Click **`📋 Copy Img`** on the card or overlay to copy the image directly to your OS clipboard as a PNG blob, ready to paste into any external app.

### 5. Interactive Crop & Save Studio ✂️
- **✂️ Optional Crop On Demand**:
  - If you decide you want a 1:1 square image or custom framing for the website scripture grid, click the **`✂️ Crop`** button on the card footer or on the image overlay.
- **Interactive Cropping Box**:
  - Drag inside the box to reposition.
  - 8 resize handles (corners and edges) for precise framing.
  - Rule-of-thirds composition grid overlay.
- **Aspect Ratio Modes**:
  - **1:1 Square** (default preset, optimal for scripture cards)
  - **4:3 Standard**
  - **16:9 Widescreen**
  - **9:16 Portrait** (Reel / Story / Mobile vertical view)
  - **Freeform** (unconstrained custom selection)
- **Quick Actions**:
  - **⬛ Max Square**: Centers the maximum possible 1:1 square inside the image.
  - **🔄 Full Frame**: Expands crop box to the entire image.
  - **↺ Revert Original**: Non-destructive editing allows reverting back to the original uncropped image at any time.
- **Live Preview & Dimension Readout**:
  - Real-time preview canvas shows the exact cropped result alongside pixel dimensions (e.g. `1024 × 1024 px`).
- **Save Options**:
  - **`✂️ Apply Crop`**: Updates the card in memory with the cropped artwork.
  - **`💾 Crop & Save to Repo`**: Applies the crop and immediately writes the optimized JPEG to `assets/content/images/<folder>/<filename>.jpg` on disk!

### 6. Multiple Image AI Providers
1. **Pollinations AI (Flux / Turbo / SDXL)**:
   - **100% Free, Zero Setup, No API Key needed.**
   - Generates high quality 1024x1024 square artwork instantly with automatic fallback.
2. **Puter.js AI**:
   - Free in-browser AI generation (no key needed).
3. **Google Gemini / Imagen 3**:
   - Uses your Gemini API Key with `imagen-3.0-generate-002`.
4. **OpenAI DALL-E 3**:
   - Uses your OpenAI API Key with `dall-e-3`.
5. **Custom Image Upload**:
   - Drag & drop or upload existing images to any verse slot with automatic lossless compression.

### 7. Saving to GitHub & Local Repository
- **💾 Save to Local Repo**: Directly writes the `.jpg` into `assets/content/images/<folder>/<filename>.jpg`. Creates the subfolder automatically if it doesn't already exist.
- **⚡ Batch Generate All & Save All**: One-click generation for all verses with a real-time progress bar.
- **🐙 Git Commit**: One-click local git commit for the newly generated images.
- **📦 Download as ZIP**: Exports a complete `.zip` archive structured with the target folder path.
- **🔑 GitHub API PAT Upload**: Allows direct remote commit to GitHub's `master` branch via personal access token.

---

## 📂 File Structure

```
tools/image-generator/
├── index.html                    # Responsive Web UI
├── styles.css                    # Spiritual dark/light theme CSS
├── app.js                        # App state, AI generators, and API handlers
├── server.py                     # Zero-dependency Python HTTP server
├── server.js                     # Zero-dependency Node.js HTTP server
├── run.sh                        # One-click shell launcher
├── sample-katha-upanishad.json   # Sample Katha Upanishad chapter JSON
└── README.md                     # Documentation
```

