#!/usr/bin/env node
/**
 * Node.js Server for Scripture Image Studio
 * Zero external dependencies (uses native Node.js http, https, fs, path, child_process).
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 8085;
const BASE_DIR = path.resolve(__dirname, '../../');
const IMAGES_BASE = path.join(BASE_DIR, 'assets', 'content', 'images');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, data, status = 200) {
  const body = Buffer.from(JSON.stringify(data), 'utf-8');
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Length': body.length
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Redirect root to tool
  if (pathname === '/' || pathname === '') {
    res.writeHead(302, { Location: '/tools/image-generator/' });
    res.end();
    return;
  }

  // API Status & Folders Detail
  if (req.method === 'GET' && (pathname === '/api/status' || pathname === '/api/folders')) {
    const foldersDetails = [];
    if (fs.existsSync(IMAGES_BASE)) {
      const dirs = fs.readdirSync(IMAGES_BASE, { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('.'))
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const d of dirs) {
        const dirPath = path.join(IMAGES_BASE, d.name);
        const files = fs.readdirSync(dirPath, { withFileTypes: true });
        const imgFiles = files
          .filter(f => f.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(f.name))
          .map(f => f.name)
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

        let uncommitted = 0;
        try {
          const relDir = path.join('assets/content/images', d.name);
          const out = execSync(`git status --porcelain "${relDir}"`, { cwd: BASE_DIR }).toString();
          uncommitted = out.split('\n').filter(l => l.trim().length >= 4).length;
        } catch (e) {}

        foldersDetails.push({
          name: d.name,
          imageCount: imgFiles.length,
          sampleImages: imgFiles.slice(0, 4),
          uncommittedCount: uncommitted
        });
      }
    }

    const folders = foldersDetails.map(f => f.name);
    let gitBranch = 'unknown';
    try {
      gitBranch = execSync('git branch --show-current', { cwd: BASE_DIR }).toString().trim();
    } catch (e) {}

    sendJson(res, {
      status: 'connected',
      repoRoot: BASE_DIR,
      imagesBase: IMAGES_BASE,
      existingFolders: folders,
      foldersDetails,
      gitBranch
    });
    return;
  }

  // Get Images in a Subfolder
  if (req.method === 'GET' && pathname === '/api/folder-images') {
    const folder = parsedUrl.searchParams.get('folder') || '';
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const targetDir = path.join(IMAGES_BASE, safeFolder);
    const images = [];
    const gitStatuses = {};
    let uncommittedCount = 0;

    if (safeFolder && fs.existsSync(targetDir) && fs.statSync(targetDir).isDirectory()) {
      try {
        const relDir = path.join('assets/content/images', safeFolder);
        const out = execSync(`git status --porcelain "${relDir}"`, { cwd: BASE_DIR }).toString();
        for (const line of out.split('\n')) {
          const trimmed = line.trimEnd();
          if (trimmed.length >= 4) {
            const code = trimmed.slice(0, 2).trim();
            const filePath = trimmed.slice(3).trim();
            const fname = path.basename(filePath);
            gitStatuses[fname] = code;
          }
        }
      } catch (e) {}

      const files = fs.readdirSync(targetDir, { withFileTypes: true });
      for (const f of files) {
        if (f.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(f.name)) {
          const stats = fs.statSync(path.join(targetDir, f.name));
          const code = gitStatuses[f.name] || 'clean';
          const isCommitted = (code === 'clean');
          if (!isCommitted) uncommittedCount++;
          images.push({
            filename: f.name,
            size: stats.size,
            modified: Math.round(stats.mtimeMs),
            isCommitted,
            gitStatus: isCommitted ? 'committed' : 'uncommitted',
            gitCode: code
          });
        }
      }
      images.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' }));
    }

    sendJson(res, {
      folder: safeFolder,
      exists: safeFolder ? fs.existsSync(targetDir) : false,
      images,
      totalCount: images.length,
      uncommittedCount,
      committedCount: images.length - uncommittedCount
    });
    return;
  }

  // POST APIs
  if (req.method === 'POST') {
    let bodyChunks = [];
    req.on('data', chunk => bodyChunks.push(chunk));
    req.on('end', () => {
      let data = {};
      try {
        const raw = Buffer.concat(bodyChunks).toString('utf-8');
        if (raw) data = JSON.parse(raw);
      } catch (e) {
        return sendJson(res, { error: 'Invalid JSON payload' }, 400);
      }

      if (pathname === '/api/proxy-image') {
        const targetUrl = data.url;
        if (!targetUrl) return sendJson(res, { error: 'Missing url' }, 400);

        try {
          const client = targetUrl.startsWith('https') ? https : http;
          client.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (resp) => {
            if (resp.statusCode >= 400) {
              return sendJson(res, { error: `HTTP ${resp.statusCode}` }, 502);
            }
            const chunks = [];
            resp.on('data', c => chunks.push(c));
            resp.on('end', () => {
              const buf = Buffer.concat(chunks);
              const mime = resp.headers['content-type'] || 'image/jpeg';
              sendJson(res, { dataUrl: `data:${mime};base64,${buf.toString('base64')}` });
            });
          }).on('error', (err) => {
            sendJson(res, { error: err.message }, 502);
          });
        } catch (err) {
          sendJson(res, { error: err.message }, 500);
        }
        return;
      }

      if (pathname === '/api/save-image') {
        const { folder, filename, imageData } = data;
        if (!folder || !filename || !imageData) {
          return sendJson(res, { error: 'Missing required fields' }, 400);
        }

        const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
        let safeFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
        if (!/\.(jpg|jpeg|png|webp)$/i.test(safeFilename)) {
          safeFilename += '.jpg';
        }

        const targetDir = path.join(IMAGES_BASE, safeFolder);
        fs.mkdirSync(targetDir, { recursive: true });
        const targetPath = path.join(targetDir, safeFilename);

        try {
          let base64Content = imageData;
          if (imageData.includes(',')) {
            base64Content = imageData.split(',')[1];
          }
          const buffer = Buffer.from(base64Content, 'base64');
          fs.writeFileSync(targetPath, buffer);

          return sendJson(res, {
            success: true,
            path: `assets/content/images/${safeFolder}/${safeFilename}`,
            bytes: buffer.length,
            filename: safeFilename,
            folder: safeFolder
          });
        } catch (err) {
          return sendJson(res, { error: err.message }, 500);
        }
      }

      if (pathname === '/api/check-images') {
        const safeFolder = (data.folder || '').replace(/[^a-zA-Z0-9_-]/g, '');
        const targetDir = path.join(IMAGES_BASE, safeFolder);
        const results = {};
        const gitStatuses = {};

        if (safeFolder && fs.existsSync(targetDir)) {
          try {
            const relDir = path.join('assets/content/images', safeFolder);
            const out = execSync(`git status --porcelain "${relDir}"`, { cwd: BASE_DIR }).toString();
            for (const line of out.split('\n')) {
              const trimmed = line.trimEnd();
              if (trimmed.length >= 4) {
                const code = trimmed.slice(0, 2).trim();
                const filePath = trimmed.slice(3).trim();
                const fname = path.basename(filePath);
                gitStatuses[fname] = code;
              }
            }
          } catch (e) {}
        }

        for (const fname of (data.filenames || [])) {
          let safeFname = fname.replace(/[^a-zA-Z0-9_.-]/g, '');
          if (!/\.(jpg|jpeg|png|webp)$/i.test(safeFname)) safeFname += '.jpg';
          const p = path.join(targetDir, safeFname);
          const exists = fs.existsSync(p);
          const code = gitStatuses[safeFname] || 'clean';
          const isCommitted = (code === 'clean');
          let size = 0;
          let modified = 0;
          if (exists) {
            try {
              const stats = fs.statSync(p);
              size = stats.size;
              modified = Math.round(stats.mtimeMs);
            } catch (e) {}
          }
          results[fname] = {
            exists,
            isCommitted: exists ? isCommitted : false,
            gitStatus: exists ? (isCommitted ? 'committed' : 'uncommitted') : 'none',
            gitCode: exists ? code : '',
            size,
            modified
          };
        }
        return sendJson(res, { exists: results });
      }

      if (pathname === '/api/delete-image') {
        const safeFolder = (data.folder || '').replace(/[^a-zA-Z0-9_-]/g, '');
        const safeFilename = (data.filename || '').replace(/[^a-zA-Z0-9_.-]/g, '');
        const targetPath = path.join(IMAGES_BASE, safeFolder, safeFilename);

        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
          try {
            fs.unlinkSync(targetPath);
            return sendJson(res, { success: true, deleted: safeFilename });
          } catch (err) {
            return sendJson(res, { error: err.message }, 500);
          }
        } else {
          return sendJson(res, { success: false, message: 'File not found' }, 404);
        }
      }

      if (pathname === '/api/create-folder') {
        const safeFolder = (data.folder || '').replace(/[^a-zA-Z0-9_-]/g, '');
        if (!safeFolder) return sendJson(res, { error: 'Invalid folder name' }, 400);
        const targetDir = path.join(IMAGES_BASE, safeFolder);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        return sendJson(res, { success: true, folder: safeFolder });
      }

      if (pathname === '/api/git-commit') {
        const folder = (data.folder || '').replace(/[^a-zA-Z0-9_-]/g, '');
        const message = data.message || `Add generated images for ${folder}`;
        try {
          execSync(`git add assets/content/images/${folder}`, { cwd: BASE_DIR });
          const out = execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: BASE_DIR });
          return sendJson(res, { success: true, output: out.toString() });
        } catch (err) {
          return sendJson(res, { error: err.message }, 500);
        }
      }

      return sendJson(res, { error: 'Endpoint not found' }, 404);
    });
    return;
  }

  // Static file handler
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(BASE_DIR, safePath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('='.repeat(65));
  console.log('🕉️  Scripture Image Studio Server (Node.js) - vishalmanchanda.github.io');
  console.log('='.repeat(65));
  console.log(`📁 Repository Root: ${BASE_DIR}`);
  console.log(`🖼️ Images Directory: ${IMAGES_BASE}`);
  console.log(`🌐 Server URL:       http://localhost:${PORT}/tools/image-generator/`);
  console.log('='.repeat(65));
});
