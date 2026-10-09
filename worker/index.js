const GOOGLE_AUTHORIZE = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO = 'https://openidconnect.googleapis.com/v1/userinfo';
const DRIVE_HOST = 'www.googleapis.com';
const REFRESH_KEY = 'google:refresh:v1';
const SESSION_TTL = 60 * 60 * 24 * 30;

let cachedAccessToken = '';
let cachedAccessExpires = 0;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/oauth/callback' && request.method === 'GET') return await callback(request, env);
      if (url.pathname === '/auth/start' && request.method === 'GET') return await startAuth(request, env);
      if (url.pathname === '/api/session' && request.method === 'OPTIONS') return preflight(request, env);
      if (url.pathname === '/api/session' && request.method === 'GET') return await sessionInfo(request, env);
      if (url.pathname === '/api/logout' && request.method === 'OPTIONS') return preflight(request, env);
      if (url.pathname === '/api/logout' && request.method === 'POST') return await logout(request, env);
      if (url.pathname === '/api/drive' && request.method === 'OPTIONS') return preflight(request, env);
      if (url.pathname === '/api/drive' && request.method === 'POST') return await driveProxy(request, env);
      return new Response('Not found', { status: 404 });
    } catch (error) {
      return json(request, env, { error: safeMessage(error) }, error.status || 500);
    }
  }
};

async function startAuth(request, env) {
  const state = randomToken();
  const verifier = randomToken() + randomToken();
  const challenge = bytesToBase64(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  await env.HEC_OAUTH_KV.put(`state:${state}`, JSON.stringify({ verifier }), { expirationTtl: 600 });
  const redirectUri = `${new URL(request.url).origin}/oauth/callback`;
  const auth = new URL(GOOGLE_AUTHORIZE);
  auth.search = new URLSearchParams({
    client_id: required(env.GOOGLE_CLIENT_ID),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email https://www.googleapis.com/auth/drive.appdata',
    access_type: 'offline',
    prompt: 'consent',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state
  }).toString();
  return Response.redirect(auth.toString(), 302);
}

async function callback(request, env) {
  const url = new URL(request.url);
  const state = url.searchParams.get('state') || '';
  const stateRecord = state ? await env.HEC_OAUTH_KV.get(`state:${state}`) : null;
  if (!stateRecord) return new Response('Invalid or expired OAuth state.', { status: 400 });
  await env.HEC_OAUTH_KV.delete(`state:${state}`);
  if (url.searchParams.has('error')) return redirectToApp(env, `#hec-drive-error=${encodeURIComponent(url.searchParams.get('error'))}`);
  const code = url.searchParams.get('code');
  if (!code) return new Response('Missing OAuth authorization code.', { status: 400 });
  const { verifier } = JSON.parse(stateRecord);

  const redirectUri = `${url.origin}/oauth/callback`;
  const tokens = await tokenRequest({
    client_id: required(env.GOOGLE_CLIENT_ID),
    client_secret: required(env.GOOGLE_CLIENT_SECRET),
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  });
  const profile = await fetch(GOOGLE_USERINFO, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  if (!profile.ok) throw new Error('Google account verification failed.');
  const user = await profile.json();
  const allowedEmail = required(env.ALLOWED_GOOGLE_EMAIL).trim().toLowerCase();
  if (!user.email_verified || String(user.email || '').trim().toLowerCase() !== allowedEmail) {
    throw new Error('This Google account is not authorized for HEC TECH.');
  }

  const oldRefresh = await env.HEC_OAUTH_KV.get(REFRESH_KEY);
  if (tokens.refresh_token) {
    await env.HEC_OAUTH_KV.put(REFRESH_KEY, await encryptSecret(tokens.refresh_token, required(env.GOOGLE_CLIENT_SECRET)));
  } else if (!oldRefresh) {
    throw new Error('Google did not return offline access. Reconnect and approve Drive access.');
  }
  const sessionToken = randomToken();
  const sessionHash = await sha256(sessionToken);
  await env.HEC_OAUTH_KV.put(`session:${sessionHash}`, JSON.stringify({ email: allowedEmail }), { expirationTtl: SESSION_TTL });
  return redirectToApp(env, `#hec-drive-session=${sessionToken}`);
}

async function sessionInfo(request, env) {
  const session = await requireSession(request, env);
  return json(request, env, { connected: true, email: session.email });
}

async function logout(request, env) {
  const originError = checkOrigin(request, env);
  if (originError) return originError;
  const token = bearer(request);
  if (token) await env.HEC_OAUTH_KV.delete(`session:${await sha256(token)}`);
  return json(request, env, { connected: false });
}

async function driveProxy(request, env) {
  const originError = checkOrigin(request, env);
  if (originError) return originError;
  await requireSession(request, env);
  const rawUrl = request.headers.get('X-Drive-URL') || '';
  const target = new URL(rawUrl);
  if (target.protocol !== 'https:' || target.hostname !== DRIVE_HOST || !/^\/(?:upload\/)?drive\/v3\/files(?:\/[^/]+)?$/.test(target.pathname)) {
    return json(request, env, { error: 'Drive endpoint is not allowed.' }, 400);
  }
  const method = (request.headers.get('X-Drive-Method') || 'GET').toUpperCase();
  if (!['GET', 'POST', 'PATCH'].includes(method)) return json(request, env, { error: 'Drive method is not allowed.' }, 405);
  let accessToken;
  try {
    accessToken = await getAccessToken(env);
  } catch (error) {
    if (error.status === 401) {
      await env.HEC_OAUTH_KV.delete(REFRESH_KEY);
      const sessionToken = bearer(request);
      await env.HEC_OAUTH_KV.delete(`session:${await sha256(sessionToken)}`);
    }
    throw error;
  }
  const headers = new Headers();
  const contentType = request.headers.get('Content-Type');
  if (contentType) headers.set('Content-Type', contentType);
  headers.set('Authorization', `Bearer ${accessToken}`);
  const upstream = await fetch(target, { method, headers, body: method === 'GET' ? undefined : request.body, redirect: 'manual' });
  const responseHeaders = new Headers();
  for (const key of ['Content-Type', 'Content-Length']) {
    const value = upstream.headers.get(key);
    if (value) responseHeaders.set(key, value);
  }
  addCors(request, env, responseHeaders);
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

async function getAccessToken(env) {
  if (cachedAccessToken && Date.now() < cachedAccessExpires) return cachedAccessToken;
  const encrypted = await env.HEC_OAUTH_KV.get(REFRESH_KEY);
  if (!encrypted) throw new Error('Google Drive is not connected. Tap Back up to Drive to reconnect.');
  const refreshToken = await decryptSecret(encrypted, required(env.GOOGLE_CLIENT_SECRET));
  const tokens = await tokenRequest({
    client_id: required(env.GOOGLE_CLIENT_ID),
    client_secret: required(env.GOOGLE_CLIENT_SECRET),
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });
  cachedAccessToken = tokens.access_token;
  cachedAccessExpires = Date.now() + Math.max(60, (Number(tokens.expires_in) || 3600) - 90) * 1000;
  return cachedAccessToken;
}

async function tokenRequest(fields) {
  const response = await fetch(GOOGLE_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields)
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    const error = new Error('Google OAuth token request failed. Reconnect Google Drive.');
    if (data.error === 'invalid_grant') error.status = 401;
    throw error;
  }
  return data;
}

async function requireSession(request, env) {
  const originError = checkOrigin(request, env);
  if (originError) throw Object.assign(new Error('Request origin is not allowed.'), { status: 403 });
  const token = bearer(request);
  if (!token) throw Object.assign(new Error('Drive session expired. Tap Back up to Drive to reconnect.'), { status: 401 });
  const raw = await env.HEC_OAUTH_KV.get(`session:${await sha256(token)}`);
  if (!raw) throw Object.assign(new Error('Drive session expired. Tap Back up to Drive to reconnect.'), { status: 401 });
  return JSON.parse(raw);
}

function bearer(request) {
  const match = /^Bearer\s+(.+)$/i.exec(request.headers.get('Authorization') || '');
  return match?.[1] || '';
}

function preflight(request, env) {
  const denied = checkOrigin(request, env);
  if (denied) return denied;
  const headers = new Headers({ 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Drive-URL, X-Drive-Method', 'Access-Control-Max-Age': '86400' });
  addCors(request, env, headers);
  return new Response(null, { status: 204, headers });
}

function checkOrigin(request, env) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== required(env.APP_ORIGIN)) return new Response('Origin not allowed.', { status: 403 });
  return null;
}

function addCors(request, env, headers) {
  const origin = request.headers.get('Origin');
  if (origin === required(env.APP_ORIGIN)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
  }
}

function json(request, env, value, status = 200) {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  addCors(request, env, headers);
  return new Response(JSON.stringify(value), { status, headers });
}

function redirectToApp(env, fragment) {
  const target = new URL(required(env.APP_RETURN_URL));
  target.hash = fragment.replace(/^#/, '');
  return Response.redirect(target.toString(), 302);
}

function required(value) {
  if (!value) throw new Error('Worker configuration is incomplete.');
  return value;
}

function safeMessage(error) {
  return error?.status === 401 || error?.status === 403 ? error.message : (error?.message || 'Request failed.');
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
}

function base64ToBytes(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(normalized), char => char.charCodeAt(0));
}

function bytesToBase64(value) {
  return btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function encryptionKey(secret) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    'HKDF',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('hec-tech-drive-refresh-v1'),
      info: new TextEncoder().encode('hec-tech-worker-aes-gcm-v1')
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptSecret(value, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await encryptionKey(secret), new TextEncoder().encode(value));
  return JSON.stringify({ v: 1, iv: bytesToBase64(iv), data: bytesToBase64(encrypted) });
}

async function decryptSecret(value, secret) {
  const record = JSON.parse(value);
  if (record.v !== 1) throw new Error('Stored Google credentials have an unsupported format.');
  const clear = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(record.iv) }, await encryptionKey(secret), base64ToBytes(record.data));
  return new TextDecoder().decode(clear);
}
