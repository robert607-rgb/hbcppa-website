import {ApiError, validateItems, imageExtension} from './domain.mjs';
const encoder = new TextEncoder();
const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
const digest = async value => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
async function passwordHash(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations}, key, 256));
}
function same(a,b) {
  let mismatch = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ (b.charCodeAt(i) || 0);
  return mismatch === 0;
}
function allowedOrigin(origin) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && !url.port && (['hbcppa-website.pages.dev','hbcppa.org','www.hbcppa.org'].includes(url.hostname) || url.hostname.endsWith('.hbcppa-website.pages.dev'));
  } catch { return false; }
}
export function createHandler({url, key, fetcher = fetch}) {
  async function db(path, method = 'GET', body) {
    const response = await fetcher(`${url}/rest/v1/${path}`, {method, headers: {
      apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation'
    }, body: body === undefined ? undefined : JSON.stringify(body)});
    if (!response.ok) throw new ApiError(503, 'Saving is temporarily unavailable. Please try again.');
    const raw = await response.text();
    return raw ? JSON.parse(raw) : null;
  }
  async function content(admin = false) {
    const rows = await db('hbcppa_content?select=key,value,revision,updated_at');
    const fixtureRow = rows.find(r => r.key === 'fixtures');
    const newsRow = rows.find(r => r.key === 'news');
    if (!fixtureRow || !newsRow) throw new ApiError(503, 'The editor is being prepared. Please try again shortly.');
    return {fixtures: fixtureRow.value, news: admin ? newsRow.value : newsRow.value.filter(n => n.status === 'published'),
      ...(admin ? {revisions: {fixtures: fixtureRow.revision, news: newsRow.revision}} : {}),
      updatedAt: fixtureRow.updated_at > newsRow.updated_at ? fixtureRow.updated_at : newsRow.updated_at};
  }
  async function session(request) {
    const token = request.headers.get('Authorization')?.replace(/^Bearer /, '') ?? '';
    if (!/^[a-f0-9]{64}$/.test(token)) throw new ApiError(401, 'Please sign in again.');
    const hash = await digest(token);
    const rows = await db(`hbcppa_admin_sessions?token_hash=eq.${hash}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=token_hash`);
    if (!rows.length) throw new ApiError(401, 'Your session has expired. Please sign in again.');
    return hash;
  }
  async function bodyJson(request) {
    if (Number(request.headers.get('Content-Length')) > 1500000) throw new ApiError(413, 'This update is too large.');
    const raw = await request.text();
    if (raw.length > 1500000) throw new ApiError(413, 'This update is too large.');
    try { return JSON.parse(raw); } catch { throw new ApiError(400, 'Invalid request.'); }
  }
  return async request => {
    const origin = request.headers.get('Origin') ?? '';
    const headers = {'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Headers': 'authorization, content-type, apikey', 'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS', Vary: 'Origin'};
    if (allowedOrigin(origin) && origin) headers['Access-Control-Allow-Origin'] = origin;
    const reply = (data, status = 200) => new Response(JSON.stringify(data), {status, headers});
    try {
      if (!allowedOrigin(origin)) throw new ApiError(403, 'This website is not allowed to use the editor.');
      if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers});
      const route = new URL(request.url).pathname.split('/').filter(Boolean).at(-1);
      if (route === 'public' && request.method === 'GET') return reply(await content());
      if (route === 'login' && request.method === 'POST') {
        const body = await bodyJson(request);
        if (typeof body.password !== 'string' || body.password.length > 200) throw new ApiError(401, 'The password is incorrect.');
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const attempts = await db('rpc/hbcppa_take_login_attempt', 'POST', {p_bucket: await digest(ip)});
        if (attempts > 10) throw new ApiError(429, 'Too many sign-in attempts. Please try again in 15 minutes.');
        const auth = (await db('hbcppa_admin_auth?select=password_hash,salt,iterations&limit=1'))[0];
        if (!auth || !same(await passwordHash(body.password, auth.salt, auth.iterations), auth.password_hash)) throw new ApiError(401, 'The password is incorrect.');
        const token = hex(crypto.getRandomValues(new Uint8Array(32)));
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
        await db('hbcppa_admin_sessions', 'POST', {token_hash: await digest(token), expires_at: expiresAt});
        // Maintenance is confined to this site's session and attempt records.
        await db(`hbcppa_admin_sessions?expires_at=lt.${encodeURIComponent(new Date().toISOString())}`, 'DELETE');
        await db(`hbcppa_login_attempts?window_start=lt.${encodeURIComponent(new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())}`, 'DELETE');
        return reply({token, expiresAt});
      }
      const tokenHash = await session(request);
      if (route === 'admin' && request.method === 'GET') return reply(await content(true));
      if (route === 'logout' && request.method === 'POST') {
        await db(`hbcppa_admin_sessions?token_hash=eq.${tokenHash}`, 'DELETE');
        return reply({ok: true});
      }
      if (['fixtures', 'news'].includes(route) && request.method === 'PUT') {
        const body = await bodyJson(request);
        if (!Number.isSafeInteger(body.revision) || body.revision < 1) throw new ApiError(400, 'Reload the editor before saving.');
        const items = validateItems(route, body.items, url);
        const previous = route === 'news' ? (await db('hbcppa_content?key=eq.news&select=value'))[0]?.value ?? [] : [];
        const updated = await db(`hbcppa_content?key=eq.${route}&revision=eq.${body.revision}`, 'PATCH',
          {value: items, revision: body.revision + 1, updated_at: new Date().toISOString()});
        if (!updated.length) throw new ApiError(409, 'Someone else has updated this section. Your changes are still in the form. Reload the latest records before trying again.');
        const inUse = new Set(items.map(item => item.image).filter(Boolean));
        const prefix = `${url}/storage/v1/object/public/hbcppa-news/`;
        const unused = [...new Set(previous.map(item => item.image).filter(image => image?.startsWith(prefix) && !inUse.has(image)))].map(image => image.slice(prefix.length));
        if (unused.length) {
          // A completed news save remains successful if optional photo cleanup fails.
          try {await fetcher(`${url}/storage/v1/object/hbcppa-news`, {method: 'DELETE', headers: {apikey:key, Authorization:`Bearer ${key}`, 'Content-Type':'application/json'}, body:JSON.stringify({prefixes:unused})});}
          catch {console.error('HBCPPA unused-photo cleanup deferred');}
        }
        return reply({items: updated[0].value, revision: updated[0].revision});
      }
      if (route === 'upload' && request.method === 'POST') {
        if (Number(request.headers.get('Content-Length')) > 5242880) throw new ApiError(413, 'Choose a photo up to 5 MB.');
        const bytes = new Uint8Array(await request.arrayBuffer());
        const type = request.headers.get('Content-Type')?.split(';')[0] ?? '';
        const ext = imageExtension(bytes, type);
        const name = `${crypto.randomUUID()}.${ext}`;
        const result = await fetcher(`${url}/storage/v1/object/hbcppa-news/${name}`, {method: 'POST', headers: {
          apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': type, 'x-upsert': 'false'}, body: bytes});
        if (!result.ok) throw new ApiError(503, 'The photo could not be uploaded. Please try again.');
        return reply({url: `${url}/storage/v1/object/public/hbcppa-news/${name}`});
      }
      throw new ApiError(404, 'This editor action was not found.');
    } catch (error) {
      if (!(error instanceof ApiError)) console.error('HBCPPA API request failed');
      return reply({error: error instanceof ApiError ? error.message : 'The editor is temporarily unavailable. Please try again.'}, error instanceof ApiError ? error.status : 503);
    }
  };
}
