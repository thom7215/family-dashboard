const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Family-Token',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function text(body, status = 200, contentType = 'text/plain') {
  return new Response(body, {
    status,
    headers: { ...CORS, 'Content-Type': contentType },
  });
}

function unauthorized() {
  return json({ error: 'Invalid or missing family token' }, 401);
}

function checkAuth(request, env) {
  const token = request.headers.get('X-Family-Token') || '';
  const expected = env.FAMILY_TOKEN || '';
  if (!expected || token !== expected) return false;
  return true;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function kvGet(env, key, fallback) {
  const raw = await env.DATA.get(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function kvPut(env, key, value) {
  await env.DATA.put(key, JSON.stringify(value));
}

async function fetchRemote(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'FamilyDashboard/1.0' },
  });
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location');
    if (loc) return fetchRemote(loc);
  }
  return res;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Public health check
    if (path === '/' || path === '/api/health') {
      return json({ ok: true, service: 'family-dashboard-api' });
    }

    // TVMaze proxy (no auth — read-only public API)
    if (path.startsWith('/api/tvmaze/')) {
      const target = `https://api.tvmaze.com${path.slice('/api/tvmaze'.length)}${url.search}`;
      try {
        const res = await fetchRemote(target);
        const body = await res.text();
        return text(body, res.status, res.headers.get('content-type') || 'application/json');
      } catch (err) {
        return text(`Proxy error: ${err.message}`, 502);
      }
    }

    // iCal proxy (no auth — URL is the secret)
    if (path === '/api/ics') {
      const target = url.searchParams.get('url');
      if (!target || !/^https?:\/\//i.test(target)) {
        return text('Missing or invalid url parameter', 400);
      }
      try {
        const res = await fetchRemote(target.replace(/^webcal:\/\//i, 'https://'));
        const body = await res.text();
        return text(body, res.status, 'text/calendar; charset=utf-8');
      } catch (err) {
        return text(`Proxy error: ${err.message}`, 502);
      }
    }

    // Protected routes below
    if (!checkAuth(request, env)) return unauthorized();

    if (path === '/api/groceries') {
      if (request.method === 'GET') {
        return json(await kvGet(env, 'groceries', []));
      }
      if (request.method === 'PUT') {
        const body = await readJson(request);
        if (!Array.isArray(body)) return json({ error: 'Expected array' }, 400);
        await kvPut(env, 'groceries', body);
        return json({ ok: true, count: body.length });
      }
      if (request.method === 'POST') {
        const body = await readJson(request);
        const text = body?.text?.trim();
        if (!text) return json({ error: 'Missing text' }, 400);
        const groceries = await kvGet(env, 'groceries', []);
        groceries.push({ id: Date.now(), text, done: false });
        await kvPut(env, 'groceries', groceries);
        return json(groceries);
      }
    }

    if (path.startsWith('/api/groceries/') && request.method === 'PATCH') {
      const id = path.split('/').pop();
      const body = await readJson(request);
      const groceries = await kvGet(env, 'groceries', []);
      const item = groceries.find(g => String(g.id) === id);
      if (!item) return json({ error: 'Not found' }, 404);
      if (typeof body?.done === 'boolean') item.done = body.done;
      if (typeof body?.text === 'string') item.text = body.text.trim();
      await kvPut(env, 'groceries', groceries);
      return json(groceries);
    }

    if (path === '/api/favorites') {
      if (request.method === 'GET') {
        return json(await kvGet(env, 'favorites', []));
      }
      if (request.method === 'PUT' || request.method === 'POST') {
        const body = await readJson(request);
        if (!Array.isArray(body)) return json({ error: 'Expected array' }, 400);
        await kvPut(env, 'favorites', body);
        return json({ ok: true, count: body.length });
      }
    }

    if (path === '/api/settings') {
      if (request.method === 'GET') {
        return json(await kvGet(env, 'settings', {}));
      }
      if (request.method === 'PUT') {
        const body = await readJson(request);
        if (!body || typeof body !== 'object') return json({ error: 'Expected object' }, 400);
        await kvPut(env, 'settings', body);
        return json({ ok: true });
      }
    }

    return text('Not found', 404);
  },
};
