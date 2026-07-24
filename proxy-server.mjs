/**
 * Local proxy for Family Dashboard:
 * - iCal feeds (Google/Outlook CORS workaround)
 * - TVMaze API (for file:// dashboard)
 * - Shared TV favorites (synced from TV Tracker app)
 *
 * Usage: node proxy-server.mjs
 */

import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 8787;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FAVORITES_FILE = path.join(__dirname, 'tv-favorites.json');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'FamilyDashboard/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8'), headers: res.headers }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function readFavorites() {
  try {
    if (!fs.existsSync(FAVORITES_FILE)) return [];
    const parsed = JSON.parse(fs.readFileSync(FAVORITES_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFavorites(data) {
  fs.writeFileSync(FAVORITES_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/favorites') {
    if (req.method === 'GET') {
      sendJson(res, 200, readFavorites());
      return;
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      try {
        const body = await readBody(req);
        const parsed = JSON.parse(body);
        if (!Array.isArray(parsed)) throw new Error('Expected array');
        writeFavorites(parsed);
        sendJson(res, 200, { ok: true, count: parsed.length });
      } catch (err) {
        sendJson(res, 400, { error: err.message });
      }
      return;
    }
  }

  if (url.pathname.startsWith('/tvmaze/')) {
    const targetPath = url.pathname.slice('/tvmaze'.length) + url.search;
    const target = `https://api.tvmaze.com${targetPath}`;
    try {
      const { status, body, headers } = await fetchUrl(target);
      res.writeHead(status, { 'Content-Type': headers['content-type'] || 'application/json; charset=utf-8' });
      res.end(body);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Proxy error: ${err.message}`);
    }
    return;
  }

  if (url.pathname === '/ics') {
    const target = url.searchParams.get('url');
    if (!target || !/^https?:\/\//i.test(target)) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing or invalid url parameter');
      return;
    }

    try {
      const { status, body } = await fetchUrl(target);
      res.writeHead(status, { 'Content-Type': 'text/calendar; charset=utf-8' });
      res.end(body);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end(`Proxy error: ${err.message}`);
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Endpoints: /ics?url=, /favorites, /tvmaze/...');
});

server.listen(PORT, () => {
  console.log(`Family Dashboard proxy running at http://localhost:${PORT}`);
  console.log('  Calendar: /ics?url=');
  console.log('  TV favorites: /favorites');
  console.log('  TVMaze API:   /tvmaze/schedule/full?country=US');
  console.log('Leave this window open while the dashboard is running.');
});
