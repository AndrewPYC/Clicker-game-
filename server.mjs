import http from 'node:http';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import './model.js';

const derive = promisify(scrypt);
const root = path.dirname(fileURLToPath(import.meta.url));
const { validate, initial, figures, restrictedFigures, skins, allShopSkins, weeklyShop } = globalThis.ClickerModel;
const passwordValid = value => typeof value === 'string' && [...value].length >= 8 && !/\s/u.test(value) && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[^A-Za-z0-9\s]/u.test(value);
const usernameValid = value => typeof value === 'string' && /^[A-Za-z0-9_-]{3,24}$/.test(value);
const fail = (status, message) => Object.assign(new Error(message), { status });

export function runtimeConfig(env={}){
  const secure=env.NODE_ENV==='production';
  const configured=env.APP_ORIGIN||env.RENDER_EXTERNAL_URL||'';
  let origin='';
  if(configured){
    const url=new URL(configured);
    if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('APP_ORIGIN must be the game URL without a path, credentials or query.');
    origin=url.origin;
  }
  if(secure&&(!origin||!origin.startsWith('https://')))throw Error('Production accounts require an HTTPS APP_ORIGIN (or RENDER_EXTERNAL_URL).');
  const port=Number(env.PORT||8000);
  if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT must be a valid port number.');
  return {port,host:env.HOST||(env.PORT?'0.0.0.0':'127.0.0.1'),origin,secure,dataDir:env.DATA_DIR||path.join(root,'data')};
}

// One server process owns the data directory. Account creation is exclusive;
// save writes are serialized per user and replaced atomically on the same disk.
export async function createGameServer({ dataDir = path.join(root, 'data'), origin = '', secure = false, accessFile = path.join(root,'skin-access.json'), clock = Date.now } = {}) {
  await mkdir(dataDir, { recursive: true });
  const sessions = new Map(), queues = new Map(), attempts = new Map();
  const accountFile = username => path.join(dataDir, 'account-' + username.toLowerCase() + '.json');
  const load = async username => JSON.parse(await readFile(accountFile(username), 'utf8'));
  async function allowedFigures(username){
    let grants={};
    try{grants=JSON.parse(await readFile(accessFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
    const ids=Object.entries(grants).find(([name])=>name.toLowerCase()===username.toLowerCase())?.[1];
    return Array.isArray(ids)?restrictedFigures.filter(id=>ids.includes(id)):[];
  }
  function ownedSkins(account){return allShopSkins.filter(s=>Array.isArray(account.skins)&&account.skins.includes(s.id)).map(s=>s.id);}
  function restrictSave(save,allowed,owned){
    if(!save)return null;
    const figure=figures.find(f=>f.id===save.figure);
    if((figure?.restricted&&!allowed.includes(figure.id))||(figure?.shop&&!owned.includes(figure.id)))return {...save,figure:'luna'};
    return save;
  }
  async function profile(account,csrf){
    const allowed=await allowedFigures(account.username),owned=ownedSkins(account);
    return {username:account.username,csrf,save:restrictSave(account.save,allowed,owned),revision:account.revision,allowedFigures:allowed,ownedSkins:owned,shop:weeklyShop(clock())};
  }
  async function writeAccount(account){
    const target=accountFile(account.username),temporary=target+'.'+randomBytes(6).toString('hex')+'.tmp';
    try{await writeFile(temporary,JSON.stringify(account),{mode:0o600});await rename(temporary,target);}
    finally{await unlink(temporary).catch(()=>{});}
  }
  function limited(key, maximum) {
    const now = Date.now();
    for (const [id, entry] of attempts) if (entry.until < now) attempts.delete(id);
    const entry = attempts.get(key) || { count: 0, until: now + 10 * 60000 };
    entry.count++; attempts.set(key, entry);
    if (entry.count > maximum) throw fail(429, 'Too many attempts. Try again in 10 minutes.');
  }
  function session(req) {
    const token = /(?:^|;\s*)clicker_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || '')?.[1];
    const found = sessions.get(token);
    if (!found || found.expires < Date.now()) { if (token) sessions.delete(token); throw fail(401, 'Please sign in again.'); }
    return { ...found, token };
  }
  function cookie(token, remove = false) {
    return `clicker_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${remove ? 0 : 86400 * 7}${secure ? '; Secure' : ''}`;
  }
  async function body(req) {
    let size = 0, chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 100000) throw fail(413, 'Request is too large.');
      chunks.push(chunk);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw fail(400, 'Invalid request.'); }
  }
  async function lock(username, task) {
    const prior = queues.get(username) || Promise.resolve();
    const next = prior.catch(() => {}).then(task);
    queues.set(username, next);
    try { return await next; } finally { if (queues.get(username) === next) queues.delete(username); }
  }
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    if (secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    const json = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
    try {
      const expectedOrigin = origin || `http://${req.headers.host}`;
      // Prevent cross-site mutations and DNS rebinding on the default local setup.
      if (!origin && !/^localhost(?::\d+)?$|^127\.0\.0\.1(?::\d+)?$|^\[::1\](?::\d+)?$/.test(req.headers.host || '')) throw fail(403, 'Set APP_ORIGIN for this host.');
      if (origin && req.headers.host !== new URL(origin).host) throw fail(403, 'Unrecognized host.');
      const url = new URL(req.url, expectedOrigin);
      if (url.pathname.startsWith('/api/')) {
        if (req.method !== 'GET') {
          if (req.headers.origin !== expectedOrigin || !String(req.headers['content-type']).startsWith('application/json')) throw fail(403, 'Request must come from this game.');
        }
        if(url.pathname==='/api/health'&&req.method==='GET')return json(200,{service:'clicker-co',accounts:true});
        if(url.pathname==='/api/shop'&&req.method==='GET')return json(200,weeklyShop(clock()));
        if (['/api/register', '/api/login'].includes(url.pathname) && req.method === 'POST') {
          limited('ip:' + req.socket.remoteAddress, 120);
          const input = await body(req);
          if (!usernameValid(input?.username)) throw fail(400, 'Use a username of 3–24 letters, numbers, underscores or hyphens.');
          const key = input.username.toLowerCase();
          limited('user:' + key, 15);
          if (typeof input.password !== 'string' || input.password.length > 128) throw fail(400, 'Enter a password of at most 128 characters.');
          let account;
          if (url.pathname === '/api/register') {
            if (!passwordValid(input.password)) throw fail(400, 'Use at least 8 characters, no spaces, with an uppercase letter, a lowercase letter and a special character.');
            const salt = randomBytes(16).toString('hex');
            const hash = (await derive(input.password, salt, 64)).toString('hex');
            account = { username: input.username, salt, hash, save: null, revision: 0 };
            try { await writeFile(accountFile(key), JSON.stringify(account), { flag: 'wx', mode: 0o600 }); }
            catch (error) { if (error.code === 'EEXIST') throw fail(409, 'That username is already taken. Choose another.'); throw error; }
          } else {
            try { account = await load(key); } catch (error) { if (error.code !== 'ENOENT') throw error; }
            // Always perform a hash, including unknown usernames.
            const hash = await derive(input.password, account?.salt || '00000000000000000000000000000000', 64);
            if (!account || !timingSafeEqual(hash, Buffer.from(account.hash, 'hex'))) throw fail(401, 'Username or password is incorrect.');
          }
          const oldToken = /clicker_session=([a-f0-9]{64})/.exec(req.headers.cookie || '')?.[1];
          if (oldToken) sessions.delete(oldToken);
          for (const [id, value] of sessions) if (value.expires < Date.now()) sessions.delete(id);
          const token = randomBytes(32).toString('hex'), csrf = randomBytes(32).toString('hex');
          sessions.set(token, { username: account.username, csrf, expires: Date.now() + 7 * 86400000 });
          res.setHeader('Set-Cookie', cookie(token));
          return json(200, await profile(account,csrf));
        }
        const current = session(req);
        if (req.method !== 'GET' && req.headers['x-csrf-token'] !== current.csrf) throw fail(403, 'Your session changed. Sign in again before saving.');
        if (url.pathname === '/api/session' && req.method === 'GET') {
          const account = await load(current.username);
          return json(200, await profile(account,current.csrf));
        }
        if (url.pathname === '/api/logout' && req.method === 'POST') {
          sessions.delete(current.token); res.setHeader('Set-Cookie', cookie('', true));
          return json(200, { ok: true });
        }
        if (url.pathname === '/api/save' && req.method === 'POST') {
          const input = await body(req);
          let save;
          try { save = validate(input?.save); } catch (error) { throw fail(400, error.message); }
          return await lock(current.username.toLowerCase(), async () => {
            const account = await load(current.username);
            if (input.revision !== account.revision) throw fail(409, 'Progress changed on another device. Sign in again to load the latest save.');
            account.save = restrictSave(save,await allowedFigures(account.username),ownedSkins(account)); account.revision++;
            await writeAccount(account);
            return json(200, { revision: account.revision,figure:account.save.figure });
          });
        }
        if(url.pathname==='/api/shop/buy'&&req.method==='POST'){
          const input=await body(req);
          return await lock(current.username.toLowerCase(),async()=>{
            const account=await load(current.username),offer=weeklyShop(clock()).offers.find(s=>s.id===input?.id);
            if(input?.revision!==account.revision)throw fail(409,'Progress changed. Sign in again before buying a skin.');
            if(!offer)throw fail(400,'This skin is not in the current weekly shop.');
            if(ownedSkins(account).includes(offer.id))throw fail(409,'You already own this skin.');
            const save=validate(account.save||initial());
            if(save.balance<offer.cost)throw fail(400,'Not enough TOCKENS for this skin.');
            save.balance-=offer.cost;save.figure=offer.id;save.lastSaved=clock();
            account.save=save;account.skins=[...ownedSkins(account),offer.id];account.revision++;
            await writeAccount(account);
            return json(200,await profile(account,current.csrf));
          });
        }
        throw fail(404, 'API route not found.');
      }
      if (!['GET', 'HEAD'].includes(req.method)) throw fail(405, 'Method not allowed.');
      const file = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
      // Only public game assets may be served; never account data or source tooling.
      if (!/^(index\.html|style\.css|model\.js|controls\.js|game\.js|auth\.js|assets\/[a-z0-9-]+\.(svg|png|wav))$/.test(file)) throw fail(404, 'Not found.');
      let content;
      try { content = await readFile(path.join(root, file)); } catch (error) { if (error.code === 'ENOENT') throw fail(404, 'Not found.'); throw error; }
      const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.wav': 'audio/wav' };
      res.writeHead(200, { 'Content-Type': types[path.extname(file)], 'Cache-Control': 'no-cache' }); res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (!res.headersSent) json(error.status || 500, { error: error.status ? error.message : 'The server could not complete that request. Try again.' });
      else res.end();
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}

if (typeof process !== 'undefined' && process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const {port,host,...config}=runtimeConfig(process.env);
  const server = await createGameServer(config);
  server.listen(port, host, () => console.log(`CLICKER CO: http://${host}:${port}`));
}
