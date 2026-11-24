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

### 2. Strict Naming Convention & Custom Image Renaming
- **Automatic Dot-to-Hyphen Rule**:
  - Converts dots in titles to hyphens:
    - `"1.1.1"` &rarr; **`1-1-1.jpg`**
    - `"1.1.2"` &rarr; **`1-1-2.jpg`**
    - `"2.64"` &rarr; **`2-64.jpg`**
- **🏷️ Custom Image Renaming**:
  - **Clickable Filename Badge**: Click directly on the `🏷️ <filename>.jpg ✏️` badge or the **`Rename`** button in the card header to rename the image file at any time.
  - **Hover Overlay & Footer Rename Buttons**: Quick rename triggers in the image hover overlay actions (`🏷️`) and the card footer (`🏷️ Rename`).
  - **Full Preview Rename**: Rename images directly from the full-screen Zoom Preview modal.
  - **Real-time Disk Rename (`/api/rename-image`)**: If the image is already saved or exists locally on disk, renaming it in the UI automatically renames the physical file on disk in `assets/content/images/<folder>/` without losing image data or git tracking.
  - Preview each image's destination path directly on each card:
    `assets/content/images/<folder>/<filename>.jpg`

### 3. Smart Vedic Prompt Synthesis
- Automatically analyzes the Sanskrit shloka, Hindi meaning, and commentary to synthesize vivid visual prompts (e.g., *Sage Uddalaka at the holy Vishvajit fire altar, boy Nachiketa contemplating sacred cows, chariot of the body and mind*).
- Multiple authentic art styles to choose from:
  - **Minimalist Black & White Vector Line Art (9:16)** (Continuous contour line drawing, beautifully drawn Lord Krishna with peacock crown & warrior Arjuna, pure white background, coloring-book vector aesthetic)
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

### 8. Dedicated Gita 9:16 Line Art Pipeline with Human-in-the-Loop (`gita-pipeline.html`)
A dedicated interactive web studio and pipeline for batch generating exquisite minimalist black & white vector line art of Lord Krishna and Arjuna (9:16) for all 700+ shlokas of the Bhagavad Gita:
👉 **[http://localhost:8085/tools/image-generator/gita-pipeline.html](http://localhost:8085/tools/image-generator/gita-pipeline.html)**

- **Smart Visual Hierarchy & Concept-as-Hero Art Direction**:
  - **Strictly Pure Visuals Only (Zero Text)**: Explicitly enforces that no text, words, word meanings, letters, Sanskrit transliteration, labels, subtitles, or typography appear inside the generated image artwork. All spiritual principles are conveyed purely through visual symbolism, composition, and metaphorical imagery.
  - **Tier 1: Teaching / Philosophical Metaphor as Primary Hero (70–80% of canvas)**: For verses conveying philosophical allegories (e.g. Tortoise withdrawing limbs 2.58, boat tossed by storm 2.67, soul changing clothes 2.22, indestructible soul 2.23, lamp in windless shelter 6.19, ocean absorbing rivers 2.70, lotus untouched by water 5.10, noble hands releasing seeds 2.47, inverted cosmic tree 15.1), the metaphor is the central dominant visual subject. Lord Krishna and warrior Arjuna are creatively weaved in an elegant circular inset medallion or subtle foreground observant silhouettes so the teaching never takes a back seat.
  - **Tier 2: Full Dramatic View of Krishna & Arjuna**: Reserved for direct emotional crisis, personal confrontation, command, prayer, or surrender (e.g. 2.1 Arjuna weeping collapsed on the chariot floor; 2.2–2.3 Krishna standing tall, pointing finger, sternly rebuking and commanding Arjuna to arise; 2.4 Arjuna pleading about Bhishma and Drona; 11.15 Arjuna trembling before Vishwaroopa; 18.66 total surrender).
  - **Tier 3: Battlefield Scene Depiction Primary**: Battlefield panoramas when Sanjaya is narrating to Dhritarashtra (opposing armies, blowing conches with radiating sonic contour lines, chariot positioned in neutral ground).
- **Seamless Image Pasting & External Import (Cmd+V / Drag & Drop)**:
  - **Direct Clipboard Paste**: Generated an image in ChatGPT, Google Gemini, Midjourney, or locally? Simply copy the image to your clipboard (`Cmd+C` / `Ctrl+C`), click any verse card (or hover over it), and press **`Cmd+V` / `Ctrl+V`**!
  - **📥 Paste Image Buttons**: Each card (both blank placeholders and existing cards) provides an **`📥 Paste Image`** / **`📥 Paste`** button for 1-click clipboard import.
  - **Automatic 9:16 Portrait Canvas Formatting**: Any pasted or dropped image is automatically placed on an exact 9:16 vertical canvas (720×1280) on a pure white background without stretching or distorting.
  - **Instant Auto-Save to Disk**: Upon paste, the artwork is automatically written to `assets/content/images/shrimad-bhagwad-gita/<chapter>-<verse>.jpg` and marked as approved on disk.
  - **Drag & Drop Support**: Drag image files directly from your desktop or file manager and drop them onto any verse card.
- **Default Full-Chapter Grid View**: When any chapter is selected, all verses are displayed immediately by default:
  - **Saved on Disk**: Automatically displays existing images (e.g. `2-20.jpg`, `2-47.jpg`, `2-48.jpg`, etc.) with a green `💾 Saved on Disk` badge, full preview zoom, and quick redo/regenerate.
  - **Blank Placeholders**: Ungenerated verses appear as distinct blank placeholder cards with Sanskrit shloka text, English meanings, and a prominent **`⚡ Generate 9:16 Line Art`** button.
- **On-Demand Single Verse Generation**: Click **`⚡ Generate Now`** directly inside any individual card to generate and save that specific verse on demand without starting a batch.
- **Batch Generation Options**:
  - **`⚡ Generate Missing (${count})`**: 1-click batch generation that targets only ungenerated/blank verses in configured rounds.
  - **`🚀 Start Batch`**: Runs generation for any selected verse range with human-in-the-loop review between rounds.
- **Interactive Workspace Filters & Search**: Filter cards instantly by **`All`**, **`💾 Saved on Disk`**, **`⚪ Not Generated`**, or **`⚡ Under Review`**, or type into the search box to find verses by number or theme (e.g. `tortoise`, `boat`, `47`).
- **Batch Size Control**: Select generation batch sizes per round (`1 (One at a time)`, `3`, `5`, `10`, or custom). Allows reviewing one verse at a time or in sets.
- **1-Click Single Verse Selection**: Click any verse number chip in the Chapter Progress Map to scroll directly to that card and highlight it.
- **Automated Human Check Post Every Round**: Automatically pauses after each round and presents generated 9:16 line art alongside Sanskrit verse text and English meanings for human review and approval before proceeding to the next round.
- **Card-Level Modifications**:
  - **Edit Prompt**: Tweak the synthesized visual prompt directly in each verse card's prompt box.
  - **Re-synthesize with Gemini**: Re-run Gemini 1.5 Flash to generate a fresh Vedic art direction prompt.
  - **Regenerate Image**: Re-generate only that single verse image without restarting the batch.
  - **Rename File**: Click on the filename badge to rename (e.g. `2-47.jpg`).
  - **Zoom Preview**: Full-screen 9:16 high-resolution preview modal.
  - **Approve & Save**: Save approved images directly to `assets/content/images/shrimad-bhagwad-gita/<chapter>-<verse>.jpg`.
- **Low-Cost & Zero-Cost Image Engines**:
  - **Gemini 3.1 Flash-Image (Nano Banana 2)**: Native 9:16 multimodal image generation at lightning speed and minimal cost via Google AI Studio.
  - **Gemini 3.1 Flash-Lite**: High-speed, cost-effective Vedic Art Director synthesizing unique verse-specific allegorical prompts (temperature 0.75, strictly avoiding generic chariot repetitions).
  - **Puter.js AI**: 100% Free, zero-setup Stable Diffusion running directly in the browser with no API key or credit card needed.
  - **Pollinations AI**: Free 9:16 vertical image generation.
  - **Smart Cascade Fallback**: If a selected model is restricted, unsupported, or unavailable on your API key, the pipeline automatically falls back to Puter AI and Pollinations so generation never fails.
- **Interactive Chapter Progress Map**: Visual 1..N verse chips color-coded by status (green = saved on disk, gold = under review, slate = pending).

### 9. Python CLI Batch Generator (`generate_gita_lineart.py`)
A dedicated command-line script to automate generation directly from the terminal:
```bash
# 1. Dry run test (synthesize prompts for Chapter 2 without calling image model):
python3 tools/image-generator/generate_gita_lineart.py --chapter 2 --verse 1-3 --dry-run

# 2. Generate a single verse using Google Gemini (Gemini 3.1 Flash-Image in 9:16):
export GEMINI_API_KEY="your-key-here"
python3 tools/image-generator/generate_gita_lineart.py --chapter 2 --verse 47 --provider gemini --text-model gemini-3.1-flash-lite --image-model gemini-3.1-flash-image

# 3. Generate all verses of Chapter 2 (skips already saved images automatically):
python3 tools/image-generator/generate_gita_lineart.py --chapter 2 --verse all --provider gemini

# 4. Generate using OpenAI DALL-E 3 (1024x1792 vertical format):
export OPENAI_API_KEY="your-key-here"
python3 tools/image-generator/generate_gita_lineart.py --chapter 2 --verse 47 --provider openai
```

---

## 📂 File Structure

```
tools/image-generator/
├── index.html                    # Scripture Image Studio & GitHub Publisher
├── gita-pipeline.html            # Gita 9:16 Line Art Studio (Human-in-the-Loop)
├── gita-pipeline.css             # Dedicated dark & gold styling for 9:16 cards & pipeline
├── gita-pipeline.js              # Pipeline controller, Gemini synthesis & batch state
├── gita_verses.json              # Complete offline Bhagavad Gita 701-verse dataset
├── styles.css                    # Studio spiritual dark/light theme CSS
├── app.js                        # App state, AI generators, and API handlers
├── generate_gita_lineart.py      # Automated 9:16 Gita Line Art Batch CLI
├── server.py                     # Zero-dependency Python HTTP server
├── server.js                     # Zero-dependency Node.js HTTP server
├── run.sh                        # One-click shell launcher
├── sample-katha-upanishad.json   # Sample Katha Upanishad chapter JSON
└── README.md                     # Documentation
```

