#!/usr/bin/env python3
"""
Local Scripture Image Studio Server for vishalmanchanda.github.io
Zero-dependency HTTP server that serves the UI and directly saves generated
images into assets/content/images/<folder>/<filename>.jpg
"""

import os
import sys
import json
import re
import base64
import urllib.request
import urllib.parse
import subprocess
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8085
BASE_DIR = Path(__file__).resolve().parent.parent.parent
IMAGES_BASE = BASE_DIR / "assets" / "content" / "images"

class ImageStudioHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def _send_json(self, data, status=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Root redirect to image generator UI
        if path == "/" or path == "":
            self.send_response(302)
            self.send_header("Location", "/tools/image-generator/")
            self.end_headers()
            return

        if path == "/api/status":
            folders = []
            if IMAGES_BASE.exists():
                folders = [d.name for d in IMAGES_BASE.iterdir() if d.is_dir() and not d.name.startswith(".")]
                folders.sort()

            git_branch = "unknown"
            try:
                res = subprocess.run(["git", "branch", "--show-current"], capture_output=True, text=True, cwd=str(BASE_DIR))
                if res.returncode == 0:
                    git_branch = res.stdout.strip()
            except Exception:
                pass

            self._send_json({
                "status": "connected",
                "repoRoot": str(BASE_DIR),
                "imagesBase": str(IMAGES_BASE),
                "existingFolders": folders,
                "gitBranch": git_branch
            })
            return

        if path == "/api/folder-images":
            query = urllib.parse.parse_qs(parsed.query)
            folder = query.get("folder", [""])[0].strip()
            safe_folder = "".join(c for c in folder if c.isalnum() or c in ("-", "_")).strip()
            target_dir = IMAGES_BASE / safe_folder
            images = []
            git_statuses = {}
            uncommitted_count = 0

            if safe_folder and target_dir.exists() and target_dir.is_dir():
                # Inspect git status to see which files are uncommitted, modified, or untracked
                try:
                    rel_dir = f"assets/content/images/{safe_folder}"
                    res = subprocess.run(["git", "status", "--porcelain", rel_dir], capture_output=True, text=True, cwd=str(BASE_DIR))
                    if res.returncode == 0:
                        for line in res.stdout.splitlines():
                            line = line.rstrip()
                            if len(line) >= 4:
                                code = line[:2].strip()
                                path_part = line[3:].strip()
                                fname = Path(path_part).name
                                git_statuses[fname] = code
                except Exception:
                    pass

                for f in target_dir.iterdir():
                    if f.is_file() and f.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"):
                        status_code = git_statuses.get(f.name, "clean")
                        is_committed = (status_code == "clean")
                        if not is_committed:
                            uncommitted_count += 1
                        images.append({
                            "filename": f.name,
                            "size": f.stat().st_size,
                            "modified": int(f.stat().st_mtime * 1000),
                            "isCommitted": is_committed,
                            "gitStatus": "uncommitted" if not is_committed else "committed",
                            "gitCode": status_code
                        })
                # Natural sort: 1-1, 1-2, 1-10
                images.sort(key=lambda x: [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', x["filename"])])

            self._send_json({
                "folder": safe_folder,
                "exists": target_dir.exists() if safe_folder else False,
                "images": images,
                "totalCount": len(images),
                "uncommittedCount": uncommitted_count if safe_folder and target_dir.exists() else 0,
                "committedCount": (len(images) - uncommitted_count) if safe_folder and target_dir.exists() else 0
            })
            return

        # Serve static files as usual
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)
        data = {}
        if body:
            try:
                data = json.loads(body.decode("utf-8"))
            except Exception as e:
                self._send_json({"error": f"Invalid JSON payload: {e}"}, status=400)
                return

        if path == "/api/proxy-image":
            url = data.get("url", "")
            if not url:
                self._send_json({"error": "Missing 'url' parameter"}, status=400)
                return
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
                with urllib.request.urlopen(req, timeout=35) as resp:
                    content = resp.read()
                    mime = resp.headers.get("Content-Type", "image/jpeg")
                    b64 = base64.b64encode(content).decode("utf-8")
                    self._send_json({"dataUrl": f"data:{mime};base64,{b64}"})
            except Exception as e:
                self._send_json({"error": f"Proxy download failed: {e}"}, status=502)
            return

        if path == "/api/save-image":
            # Saves base64 image data to assets/content/images/<folder>/<filename>
            folder = data.get("folder", "").strip()
            filename = data.get("filename", "").strip()
            image_data = data.get("imageData", "")

            if not folder or not filename:
                self._send_json({"error": "Missing 'folder' or 'filename'"}, status=400)
                return

            safe_folder = "".join(c for c in folder if c.isalnum() or c in ("-", "_")).strip()
            safe_filename = "".join(c for c in filename if c.isalnum() or c in ("-", "_", ".")).strip()

            if not safe_filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                safe_filename += ".jpg"

            target_dir = IMAGES_BASE / safe_folder
            target_dir.mkdir(parents=True, exist_ok=True)
            target_path = target_dir / safe_filename

            try:
                if "," in image_data:
                    image_data = image_data.split(",", 1)[1]

                if image_data.startswith("http://") or image_data.startswith("https://"):
                    req = urllib.request.Request(image_data, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
                    with urllib.request.urlopen(req, timeout=30) as resp:
                        binary_content = resp.read()
                else:
                    binary_content = base64.b64decode(image_data)

                with open(target_path, "wb") as f:
                    f.write(binary_content)

                rel_path = f"assets/content/images/{safe_folder}/{safe_filename}"
                self._send_json({
                    "success": True,
                    "path": rel_path,
                    "absolutePath": str(target_path),
                    "bytes": len(binary_content),
                    "filename": safe_filename,
                    "folder": safe_folder
                })
            except Exception as e:
                self._send_json({"error": f"Failed to save image: {e}"}, status=500)
            return

        if path == "/api/check-images":
            folder = data.get("folder", "").strip()
            filenames = data.get("filenames", [])
            safe_folder = "".join(c for c in folder if c.isalnum() or c in ("-", "_")).strip()
            target_dir = IMAGES_BASE / safe_folder

            git_statuses = {}
            if safe_folder and target_dir.exists():
                try:
                    rel_dir = f"assets/content/images/{safe_folder}"
                    res = subprocess.run(["git", "status", "--porcelain", rel_dir], capture_output=True, text=True, cwd=str(BASE_DIR))
                    if res.returncode == 0:
                        for line in res.stdout.splitlines():
                            line = line.rstrip()
                            if len(line) >= 4:
                                code = line[:2].strip()
                                path_part = line[3:].strip()
                                fname = Path(path_part).name
                                git_statuses[fname] = code
                except Exception:
                    pass

            results = {}
            for fname in filenames:
                safe_fname = "".join(c for c in fname if c.isalnum() or c in ("-", "_", ".")).strip()
                if not safe_fname.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                    safe_fname += ".jpg"
                p = target_dir / safe_fname
                exists = p.exists()
                status_code = git_statuses.get(safe_fname, "clean") if exists else "none"
                is_committed = (status_code == "clean") if exists else False
                results[fname] = {
                    "exists": exists,
                    "isCommitted": is_committed,
                    "gitStatus": "committed" if is_committed else "uncommitted",
                    "gitCode": status_code,
                    "size": p.stat().st_size if exists else 0,
                    "modified": int(p.stat().st_mtime * 1000) if exists else 0
                }

            self._send_json({"exists": results})
            return

        if path == "/api/delete-image":
            folder = data.get("folder", "").strip()
            filename = data.get("filename", "").strip()
            safe_folder = "".join(c for c in folder if c.isalnum() or c in ("-", "_")).strip()
            safe_filename = "".join(c for c in filename if c.isalnum() or c in ("-", "_", ".")).strip()
            target_path = IMAGES_BASE / safe_folder / safe_filename
            if target_path.exists() and target_path.is_file():
                try:
                    target_path.unlink()
                    self._send_json({"success": True, "deleted": safe_filename})
                except Exception as e:
                    self._send_json({"error": str(e)}, status=500)
            else:
                self._send_json({"success": False, "message": "File not found"}, status=404)
            return

        if path == "/api/git-status":
            try:
                res = subprocess.run(
                    ["git", "status", "--porcelain", "assets/content/images"],
                    capture_output=True, text=True, cwd=str(BASE_DIR)
                )
                self._send_json({"status": res.stdout, "returncode": res.returncode})
            except Exception as e:
                self._send_json({"error": str(e)}, status=500)
            return

        if path == "/api/git-commit":
            folder = data.get("folder", "").strip()
            message = data.get("message", f"Add generated images for {folder}").strip()
            try:
                folder_path = f"assets/content/images/{folder}"
                add_res = subprocess.run(["git", "add", folder_path], capture_output=True, text=True, cwd=str(BASE_DIR))
                if add_res.returncode != 0:
                    self._send_json({"error": add_res.stderr or "git add failed"}, status=500)
                    return

                commit_res = subprocess.run(["git", "commit", "-m", message], capture_output=True, text=True, cwd=str(BASE_DIR))
                self._send_json({
                    "success": True,
                    "output": commit_res.stdout or commit_res.stderr
                })
            except Exception as e:
                self._send_json({"error": str(e)}, status=500)
            return

        self._send_json({"error": f"Not found: {path}"}, status=404)

def main():
    print("=" * 65)
    print("🕉️  Scripture Image Studio Server - vishalmanchanda.github.io")
    print("=" * 65)
    print(f"📁 Repository Root: {BASE_DIR}")
    print(f"🖼️ Images Directory: {IMAGES_BASE}")
    print(f"🌐 Server URL:       http://localhost:{PORT}/tools/image-generator/")
    print("=" * 65)
    print("Press Ctrl+C to stop the server.")

    server = HTTPServer(("127.0.0.1", PORT), ImageStudioHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        server.server_close()

if __name__ == "__main__":
    main()
