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

### 4. Multiple Image AI Providers
1. **Pollinations AI (Flux / SDXL)**:
   - **100% Free, Zero Setup, No API Key needed.**
   - Generates high quality 1024x1024 square artwork instantly.
2. **Google Gemini / Imagen 3**:
   - Uses your Gemini API Key with `imagen-3.0-generate-002`.
3. **OpenAI DALL-E 3**:
   - Uses your OpenAI API Key with `dall-e-3`.
4. **Custom Image Upload**:
   - Drag & drop or upload existing images to any verse slot (automatically centered and formatted to 1024x1024 JPG).

### 5. Saving to GitHub & Local Repository
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

