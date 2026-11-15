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

### 1. JSON Upload & Parsing
- Drag and drop or browse any scripture JSON file.
- Or click **"Paste JSON"** to paste raw JSON text directly.
- Or click **"✨ Load Sample"** to instantly test with the Katha Upanishad sample data.
- Recognizes:
  - `contentId`: e.g. `"katha-upanishad_hi"` &rarr; sets the target subfolder automatically.
  - `sections`: each section's `id`, `title` (e.g. `"1.1.1"`), Sanskrit `passage`, Hindi `meaning`, `commentary`, and `wordMeanings`.

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

### 4. Image Copy, Paste & Visually Lossless Compression
- **📥 Paste Image Directly**:
  - Click **`📥 Paste Image`** on any verse card to paste directly from your clipboard (e.g. from Google Gemini, Midjourney, ChatGPT, or your screenshot tool).
  - Or click any card to select it and press **`Cmd + V`** (or `Ctrl + V`).
  - Or **Drag & Drop** an image file directly onto the card.
- **📋 Copy Image to Clipboard**:
  - Click the **`📋 Copy Img`** button on the card or overlay to copy the image directly to your OS clipboard as a PNG blob, ready to paste into any application.
- **⚡ Visually Lossless Compression**:
  - Automatically crops and optimizes uploaded and pasted images to 1024x1024 square.
  - Multi-step bicubic downscaling preserves sharp text, intricate details, and natural colors.
  - Slashes file sizes from 5MB–10MB down to **~150KB–250KB** (typically **85%–95% space saved**) with zero visible degradation.
  - Displays live compression statistics (`💾 185 KB`) on every card.
  - Quality selector in settings: **High Fidelity (88%)**, **Maximum (95%)**, or **Web Optimized (82%)**.

### 5. Multiple Image AI Providers
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

### 6. Saving to GitHub & Local Repository
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

