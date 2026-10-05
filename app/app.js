import { DATA, DISHES, ALL_DISHES, TPL, HINTS } from './data.js';

/* ---------- persistence ---------- */

const STATE_KEY = 'qqm.state.v1';
const PHOTOS_KEY = 'qqm.photos.v1';
const AUTOPHOTOS_KEY = 'qqm.autophotos.v1';

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const persisted = Object.assign(
  { picks: {}, custom: {}, history: [], invent: true, avoidRecent: true },
  loadJSON(STATE_KEY, {})
);
let photos = loadJSON(PHOTOS_KEY, {});
let autoPhotos = loadJSON(AUTOPHOTOS_KEY, {}); // slug -> {url,title,pageUrl} | null (looked up, no match found)
const autoPhotoPending = new Set();

function savePersisted() {
  saveJSON(STATE_KEY, {
    picks: persisted.picks,
    custom: persisted.custom,
    history: persisted.history,
    invent: persisted.invent,
    avoidRecent: persisted.avoidRecent
  });
}

function savePhotos() {
  return saveJSON(PHOTOS_KEY, photos);
}

/* ---------- auto-fetched dish photo (Wikipedia/Wikimedia — free, keyless, CORS-enabled) ---------- */
/* No manual image search tool is available in this app's runtime, and Google Images has no
   public, hotlink-safe, CORS-enabled API — so an appetizing default photo is pulled from French
   Wikipedia's article images instead. A user's own uploaded photo always takes priority. */

async function wikiImageSearch(query) {
  const u = 'https://fr.wikipedia.org/w/api.php?' + new URLSearchParams({
    action: 'query', generator: 'search', gsrsearch: query, gsrlimit: '1', gsrnamespace: '0',
    prop: 'pageimages|info', piprop: 'thumbnail', pithumbsize: '800', inprop: 'url', format: 'json', origin: '*'
  });
  const res = await fetch(u, { credentials: 'omit' });
  if (!res.ok) return null;
  const data = await res.json();
  const pages = data && data.query && data.query.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0];
  if (!page || !page.thumbnail || !page.thumbnail.source) return null;
  if (page.thumbnail.width && page.thumbnail.width < 180) return null; // too small to be a real photo (icon/logo)
  return { url: page.thumbnail.source, title: page.title, pageUrl: page.fullurl };
}

async function resolveDishPhoto(name, tags) {
  const tries = [name].concat((tags || []).filter(t => t && t !== name));
  for (const q of tries) {
    try {
      const found = await wikiImageSearch(q);
      if (found) return found;
    } catch {
      // network/offline — try the next candidate, fall through to null below
    }
  }
  return null;
}

function ensureAutoPhoto(slug, name, tags) {
  if (!slug || slug in autoPhotos || autoPhotoPending.has(slug)) return;
  autoPhotoPending.add(slug);
  resolveDishPhoto(name, tags)
    .then(result => {
      autoPhotos[slug] = result;
      saveJSON(AUTOPHOTOS_KEY, autoPhotos);
    })
    .catch(() => {})
    .finally(() => {
      autoPhotoPending.delete(slug);
      if (ui.screen === 'dish' && ui.chosen && slugify(ui.chosen.name) === slug) render();
    });
}

/* ---------- transient ui state ---------- */

const ui = {
  screen: 'home',
  openCat2: null,
  catId: DATA[0].id,
  query: '',
  filter: 'Tout',
  newName: '',
  newCat: DATA[0].id,
  proposals: null,
  chosen: null,
  hQuery: '',
  panel: null,
  toast: ''
};

let toastTimer = null;

/* ---------- engine (ported from the prototype's Component class) ---------- */

function cats() {
  return DATA.map(c => Object.assign({}, c, { items: c.items.concat(persisted.custom[c.id] || []) }));
}

function yesSet() {
  const s = {};
  for (const k in persisted.picks) if (persisted.picks[k] === 1) s[k] = 1;
  return s;
}

function noSet() {
  const s = {};
  for (const k in persisted.picks) if (persisted.picks[k] === 2) s[k] = 1;
  return s;
}

function affinity() {
  const a = {};
  persisted.history.forEach(h => h.tags.forEach(t => { a[t] = (a[t] || 0) + 1; }));
  return a;
}

function pickBy(catId, yes) {
  const c = cats().find(c => c.id === catId);
  const hit = c.items.filter(n => yes[n]);
  return hit.length ? hit[Math.floor(Math.random() * hit.length)] : null;
}

function makeProposals() {
  const yes = yesSet(), no = noSet(), aff = affinity();
  const recent = persisted.avoidRecent ? persisted.history.slice(-4).map(h => h.name) : [];
  const out = ALL_DISHES
    .filter(d => !no[d.n] && !d.t.some(t => no[t]) && recent.indexOf(d.n) < 0)
    .map(d => {
      const hits = d.t.filter(t => yes[t]);
      const bonus = d.t.reduce((s, t) => s + Math.min(aff[t] || 0, 3) * 1.2, 0);
      return { name: d.n, tags: d.t, kind: 'De ta liste', hits, self: !!yes[d.n],
        score: (yes[d.n] ? 7 : 0) + hits.length * 3 + bonus + Math.random() * 1.6 };
    })
    .sort((a, b) => b.score - a.score);
  const gated = out.filter(d => d.score > 1.6);
  const base = gated.length >= 3 ? gated : out;

  const invented = [];
  if (persisted.invent) {
    const p = pickBy('viandes', yes), f = pickBy('feculents', yes),
      l = pickBy('legumes', yes), s = pickBy('sauces', yes), h = pickBy('epices', yes);
    const seen = {};
    TPL.forEach(fn => {
      const n = fn(p, f, l, s, h);
      if (!n || seen[n]) return;
      seen[n] = 1;
      const tags = [p, f, l, s, h].filter(x => x && n.toLowerCase().indexOf(x.toLowerCase()) >= 0);
      invented.push({ name: n.charAt(0).toUpperCase() + n.slice(1), tags, hits: tags, kind: 'Inventé',
        score: tags.length * 3.4 + Math.random() * 2 });
    });
    invented.sort((a, b) => b.score - a.score);
  }

  const merged = base.slice(0, 4).concat(invented.slice(0, 2)).sort((a, b) => b.score - a.score);
  const seenN = {};
  return merged.filter(d => (seenN[d.name] ? false : (seenN[d.name] = 1))).slice(0, 3);
}

function cycle(name) {
  const cur = persisted.picks[name] || 0;
  const next = (cur + 1) % 3;
  if (next === 0) delete persisted.picks[name];
  else persisted.picks[name] = next;
  ui.toast = '';
  ui.proposals = null;
  savePersisted();
}

function get(name) { return persisted.picks[name] || 0; }

function skinClass(st) {
  return st === 1 ? 'pill-yes' : st === 2 ? 'pill-no' : 'pill-neutral';
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* ---------- small utils ---------- */

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- history / back-button support ---------- */

const BACK_ACTIONS = { cat: goHome, result: goHome, dish: goResult, settings: goHome, add: backFromAdd };

function pushNav() {
  history.pushState({ qqm: true }, '', location.href);
}

window.addEventListener('popstate', () => {
  const fn = BACK_ACTIONS[ui.screen];
  if (fn) fn(true);
});

/* ---------- navigation actions ---------- */

function goHome(silent) {
  ui.screen = 'home';
  if (!silent) pushNav();
  render();
}

function goSettings() {
  ui.screen = 'settings';
  pushNav();
  render();
}

function goResult(silent) {
  if (!ui.proposals) ui.proposals = makeProposals();
  ui.screen = 'result';
  if (!silent) pushNav();
  render();
}

function reroll() {
  ui.proposals = makeProposals();
  render();
}

function openCatFull(id) {
  ui.screen = 'cat';
  ui.catId = id;
  ui.query = '';
  ui.filter = 'Tout';
  pushNav();
  render();
}

function goAdd() {
  ui.screen = 'add';
  ui.newCat = ui.catId;
  ui.newName = '';
  pushNav();
  render();
}

function backFromAdd(silent) {
  ui.screen = 'cat';
  if (!silent) pushNav();
  render();
}

function openDish(p) {
  ui.screen = 'dish';
  ui.chosen = p;
  pushNav();
  render();
}

function confirmDish() {
  const d = ui.chosen;
  if (!d) return;
  persisted.history.push({ name: d.name, tags: d.tags, ts: Date.now() });
  savePersisted();
  ui.proposals = null;
  ui.screen = 'home';
  ui.toast = d.name + ' — noté pour ce soir';
  pushNav();
  render();
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { ui.toast = ''; render(); }, 3200);
}

/* ---------- render: values (mirrors the prototype's appVals()) ---------- */

function computeVals() {
  const yes = yesSet(), no = noSet();
  const allCats = cats();
  const nYes = Object.keys(yes).length, nNo = Object.keys(no).length;

  const catsP = allCats.map(c => {
    const open = ui.openCat2 === c.id;
    const y = c.items.filter(n => yes[n]).length;
    return {
      id: c.id, name: c.name, emoji: c.emoji, open, y,
      hasMore: c.items.length > 14,
      more: c.items.length - 14,
      items: c.items.filter((n, i) => i < 14 || yes[n] || no[n])
    };
  });

  const hq = ui.hQuery.trim().toLowerCase();
  const all = [];
  allCats.forEach(c => c.items.forEach(n => { if (all.indexOf(n) < 0) all.push(n); }));
  const matches = hq ? all.filter(n => n.toLowerCase().indexOf(hq) >= 0) : [];
  const panelNames = ui.panel ? all.filter(n => (ui.panel === 'yes' ? yes[n] : no[n])) : [];

  const cat = allCats.find(c => c.id === ui.catId) || allCats[0];
  const q = ui.query.trim().toLowerCase();
  const catItems = cat.items
    .filter(n => !q || n.toLowerCase().indexOf(q) >= 0)
    .filter(n => ui.filter === 'Tout' || (ui.filter === 'Envies' ? yes[n] : !yes[n] && !no[n]));

  const props = ui.proposals || [];
  const proposals = props.map((p, i) => ({
    name: p.name, kind: p.kind, rank: i === 0 ? (nYes ? 'Le plus proche de tes envies' : 'Au hasard') : '',
    why: p.self ? 'Tu l’as coché toi-même.' : p.hits.length
      ? 'Parce que tu as envie de ' + p.hits.slice(0, 4).join(', ').toLowerCase() + '.'
      : 'Une valeur sûre, rien de ce que tu as écarté dedans.',
    invented: p.kind === 'Inventé', p
  }));

  const d = ui.chosen || { name: '', tags: [], hits: [] };
  const slug = encodeURIComponent(d.name);
  const recipes = d.name ? [
    { site: 'Marmiton', initial: 'M', label: 'Recettes notées par la communauté',
      href: 'https://www.marmiton.org/recettes/recherche.aspx?aqt=' + slug },
    { site: 'CuisineAZ', initial: 'C', label: 'Fiches détaillées, pas à pas',
      href: 'https://www.cuisineaz.com/recettes/recherche_v2.aspx?recherche=' + slug },
    { site: '750g', initial: '7', label: 'Versions rapides et variantes',
      href: 'https://www.750g.com/recherche.htm?q=' + slug }
  ] : [];
  const dishSlug = slugify(d.name);

  const aff = affinity();
  const affList = Object.keys(aff).sort((a, b) => aff[b] - aff[a]).slice(0, 6);
  const max = affList.length ? aff[affList[0]] : 1;
  const affinities = affList.map(n => ({ name: n, n_: aff[n], pct: Math.round((aff[n] / max) * 100) }));

  return {
    yes, no, allCats, nYes, nNo, catsP, hq, matches, panelNames, cat, catItems,
    proposals, noProposals: props.length === 0,
    resultIntro: nYes
      ? (nYes > 1 ? 'Trois pistes à partir de tes ' + nYes + ' envies cochées.' : 'Trois pistes à partir de ton envie cochée.')
      : 'Rien de coché — voilà trois idées au hasard.',
    d, recipes, dishSlug,
    dishWhy: d.hits && d.hits.length ? 'Tu avais coché ' + d.hits.join(', ').toLowerCase() + '.' : 'Choisi dans tes habitudes.',
    affinities, noAffinity: affinities.length === 0,
    yesLabel: nYes + (nYes > 1 ? ' envies' : ' envie'),
    noLabel: nNo + (nNo > 1 ? ' exclus' : ' exclu'),
    historyLine: persisted.history.length
      ? persisted.history.length + (persisted.history.length > 1 ? ' plats validés : ' : ' plat validé : ') + persisted.history.map(h => h.name).join(', ')
      : 'Aucun plat validé pour l’instant.'
  };
}

/* ---------- pill / row builders ---------- */

function pill(name, opts) {
  opts = opts || {};
  const st = get(name);
  const cls = skinClass(st) + (opts.big ? ' pill-big' : '');
  return `<span class="pill ${cls}" data-act="cycle" data-name="${esc(name)}">${esc(name)}</span>`;
}

function panelPill(name) {
  const st = get(name);
  return `<span class="pill pill-clear ${skinClass(st)}" data-act="clear-item" data-name="${esc(name)}">${esc(name)} <span class="pill-clear-x">✕</span></span>`;
}

/* ---------- screens ---------- */

function screenHome(v) {
  const searching = !!v.hq;
  const panelOpen = !searching && !!ui.panel;
  const showCats = !searching && !ui.panel;

  let mid = '';
  if (searching) {
    const count = v.matches.length ? v.matches.length + (v.matches.length > 1 ? ' résultats' : ' résultat') : 'Aucun résultat';
    mid = `<div class="muted-label">${esc(count)}</div>
      <div class="pill-wrap">${v.matches.slice(0, 60).map(n => pill(n)).join('')}</div>`;
  } else if (panelOpen) {
    const hint = ui.panel === 'yes' ? 'Tape un item pour retirer l’envie.' : 'Tape un item pour le remettre en jeu.';
    const emptyText = ui.panel === 'yes' ? 'Aucune envie cochée pour l’instant.' : 'Tu n’as rien écarté.';
    mid = `<div class="panel-head">
        <span class="muted-label">${esc(hint)}</span>
        <span class="link-action" data-act="clear-panel">Tout annuler</span>
      </div>
      <div class="pill-wrap">${v.panelNames.map(panelPill).join('')}</div>
      ${v.panelNames.length === 0 ? `<div class="empty-note">${esc(emptyText)}</div>` : ''}`;
  } else if (showCats) {
    mid = v.catsP.map(c => `
      <div class="cat-card">
        <div class="cat-card-row">
          <span class="cat-card-main" data-act="toggle-cat" data-id="${c.id}">
            <span class="cat-emoji" style="background:${c.y ? 'var(--color-accent-100)' : 'rgba(32,30,29,.06)'}">${c.emoji}</span>
            <span class="cat-name">${esc(c.name)}</span>
            <span class="cat-count">${c.y ? c.y + ' ✓' : ''}</span>
            <span class="cat-chevron" style="transform:rotate(${c.open ? '180deg' : '0deg'})">▼</span>
          </span>
          <span class="cat-open-btn" data-act="open-cat" data-id="${c.id}">→</span>
        </div>
        ${c.open ? `<div class="cat-card-body">
          <div class="pill-wrap">${c.items.map(n => pill(n)).join('')}
          ${c.hasMore ? `<span class="pill pill-more" data-act="open-cat" data-id="${c.id}">+ ${c.more} autres →</span>` : ''}
          </div>
        </div>` : ''}
      </div>`).join('');
  }

  return `
    <div class="scr-head">
      <div class="home-title-row">
        <div class="app-title">Qu'est ce qu'on mange ?</div>
        <button class="icon-btn" data-act="go-settings" aria-label="Réglages">${iconGear()}</button>
      </div>
      <div class="chip-row">
        <span class="chip chip-yes ${ui.panel === 'yes' ? 'chip-active' : ''}" data-act="toggle-yes-panel">✓ <span>${esc(v.yesLabel)}</span></span>
        <span class="chip chip-no ${ui.panel === 'no' ? 'chip-active' : ''}" data-act="toggle-no-panel">✕ <span>${esc(v.noLabel)}</span></span>
      </div>
      <input class="search-input" type="text" data-bind="hQuery" value="${esc(ui.hQuery)}" placeholder="Chercher un plat, un ingrédient…">
    </div>
    <div class="scrl" style="padding-bottom:120px">${mid}</div>
    <div class="bottom-bar"><div class="btn btn-primary" data-act="go-result">Proposer 3 plats</div></div>
    ${ui.toast ? `<div class="toast">${esc(ui.toast)}</div>` : ''}
  `;
}

function screenCat(v) {
  const filters = ['Tout', 'Envies', 'Pas encore vus'];
  return `
    <div class="scr-head">
      <div class="row-with-back">
        <button class="icon-btn" data-act="go-home" aria-label="Retour">←</button>
        <div class="screen-title">${esc(v.cat.name)}</div>
      </div>
      <input class="search-input" type="text" data-bind="query" value="${esc(ui.query)}" placeholder="Chercher dans la catégorie" style="margin-top:14px">
      <div class="filter-row">
        ${filters.map(f => `<span class="filter-chip ${ui.filter === f ? 'filter-active' : ''}" data-act="set-filter" data-name="${f}">${f}</span>`).join('')}
      </div>
    </div>
    <div class="scrl" style="padding-bottom:110px">
      <div class="pill-wrap">${v.catItems.map(n => pill(n, { big: true })).join('')}</div>
      ${v.catItems.length === 0 ? `<div class="empty-note">Rien de ce nom dans cette catégorie. Tu peux l’ajouter.</div>` : ''}
    </div>
    <div class="bottom-bar"><div class="btn btn-outline" data-act="go-add">＋ Ajouter un item</div></div>
  `;
}

function screenResult(v) {
  return `
    <div class="scr-head" style="padding-bottom:8px">
      <div class="row-with-back">
        <button class="icon-btn" data-act="go-home" aria-label="Retour">←</button>
        <div class="screen-title">Ce soir</div>
      </div>
    </div>
    <div class="scrl" style="padding-top:10px;padding-bottom:110px">
      <div class="result-intro">${esc(v.resultIntro)}</div>
      ${v.proposals.map(p => `
        <div class="proposal-card ${p.invented ? 'proposal-invented' : ''}" data-act="open-dish" data-name="${esc(p.p.name)}">
          <div class="proposal-tag-row">
            <span class="tag-pill ${p.invented ? 'tag-invented' : 'tag-list'}">${esc(p.kind)}</span>
            ${p.rank ? `<span class="proposal-rank">${esc(p.rank)}</span>` : ''}
          </div>
          <div class="proposal-name">${esc(p.name)}</div>
          <div class="proposal-why">${esc(p.why)}</div>
        </div>`).join('')}
      <div class="btn btn-dashed" data-act="reroll">↻ Trois autres idées</div>
      ${v.noProposals ? `<div class="empty-note">Coche au moins deux ou trois envies et je te sors quelque chose.</div>` : ''}
    </div>
  `;
}

function screenDish(v) {
  const d = v.d;
  const slug = v.dishSlug;
  const userPhoto = photos[slug];
  const auto = autoPhotos[slug];
  const pending = autoPhotoPending.has(slug);

  if (!userPhoto && d.name) ensureAutoPhoto(slug, d.name, d.tags);

  let slotInner;
  if (userPhoto) {
    slotInner = `<img src="${userPhoto}" alt="${esc(d.name)}"><button class="photo-remove" type="button" data-act="remove-photo" data-slug="${esc(slug)}" aria-label="Retirer la photo">✕</button>`;
  } else if (auto && auto.url) {
    slotInner = `<img src="${auto.url}" alt="${esc(d.name)}" data-act="pick-photo" data-slug="${esc(slug)}" style="cursor:pointer">
      <a class="photo-credit" href="${esc(auto.pageUrl)}" target="_blank" rel="noopener noreferrer">Photo : Wikipédia</a>
      <div class="photo-replace-hint">${iconCamera()}</div>`;
  } else {
    slotInner = `<div class="photo-placeholder" data-act="pick-photo" data-slug="${esc(slug)}">${iconCamera()}<span>${pending ? 'Recherche d’une photo…' : 'Dépose une photo du plat'}</span></div>`;
  }

  return `
    <div class="scr-head" style="padding-bottom:0">
      <button class="icon-btn" data-act="go-result" aria-label="Retour">←</button>
    </div>
    <div class="scrl" style="padding-top:18px;padding-bottom:120px">
      <div class="photo-slot" data-slug="${esc(slug)}">
        ${slotInner}
        <input type="file" accept="image/*" class="photo-input" data-slug="${esc(slug)}" hidden>
      </div>
      <div class="dish-name">${esc(d.name)}</div>
      <div class="dish-why">${esc(v.dishWhy)}</div>
      ${(d.tags && d.tags.length) ? `
      <div class="section-label" style="margin-top:24px">Ce qu’il te faut</div>
      <div class="pill-wrap" style="margin-top:12px">
        ${d.tags.map(t => `<span class="tag-pill ${v.yes[t] ? 'tag-have' : 'tag-neutral'}">${esc(t)}</span>`).join('')}
      </div>` : ''}
      <div class="section-label" style="margin-top:26px">Trouver la recette</div>
      <div class="recipe-list">
        ${v.recipes.map(r => `
          <a class="recipe-row" href="${r.href}" target="_blank" rel="noopener noreferrer">
            <span class="recipe-badge">${r.initial}</span>
            <span class="recipe-text"><span class="recipe-site">${r.site}</span><span class="recipe-label">${esc(r.label)}</span></span>
            <span class="recipe-arrow">↗</span>
          </a>`).join('')}
      </div>
    </div>
    <div class="bottom-bar bottom-bar-split">
      <div class="btn btn-primary" style="flex:1" data-act="confirm-dish">C’est parti</div>
      <div class="btn btn-circle" data-act="go-result" aria-label="Autre idée">↻</div>
    </div>
  `;
}

function screenSettings(v) {
  return `
    <div class="scr-head" style="padding-bottom:8px">
      <div class="row-with-back">
        <button class="icon-btn" data-act="go-home" aria-label="Retour">←</button>
        <div class="screen-title">Réglages</div>
      </div>
    </div>
    <div class="scrl" style="padding-top:12px;padding-bottom:40px">
      <div class="section-label">Ce que l’app a retenu</div>
      <div class="card">
        ${v.noAffinity
          ? `<div class="body-text">Rien encore. Valide un plat et tes ingrédients récurrents remonteront ici — ils pèseront dans les propositions suivantes.</div>`
          : v.affinities.map(a => `
            <div class="affinity-row">
              <div class="affinity-label"><span>${esc(a.name)}</span><span class="muted">${a.n_}×</span></div>
              <div class="affinity-track"><div class="affinity-fill" style="width:${a.pct}%"></div></div>
            </div>`).join('')}
      </div>
      <div class="section-label" style="margin-top:26px">Propositions</div>
      <div class="toggle-row" data-act="toggle-setting" data-key="invent">
        <div class="toggle-text"><div class="toggle-name">Inventer des plats</div><div class="toggle-desc">Compose aussi des plats hors liste à partir de tes envies.</div></div>
        <div class="switch ${persisted.invent ? 'switch-on' : ''}"><div class="switch-knob"></div></div>
      </div>
      <div class="toggle-row" data-act="toggle-setting" data-key="avoidRecent">
        <div class="toggle-text"><div class="toggle-name">Éviter les répétitions</div><div class="toggle-desc">Écarte les plats validés ces derniers jours.</div></div>
        <div class="switch ${persisted.avoidRecent ? 'switch-on' : ''}"><div class="switch-knob"></div></div>
      </div>
      <div class="btn btn-outline btn-warn" data-act="reset-all">Remettre toutes les envies à zéro</div>
      <div class="history-line">${esc(v.historyLine)}</div>
    </div>
  `;
}

function screenAdd(v) {
  return `
    <div class="scr-head" style="padding-bottom:8px">
      <div class="row-with-back">
        <button class="icon-btn" data-act="back-from-add" aria-label="Retour">←</button>
        <div class="screen-title">Ajouter un item</div>
      </div>
    </div>
    <div class="scrl" style="padding-top:16px;padding-bottom:120px">
      <div class="section-label">Nom</div>
      <input class="search-input" type="text" data-bind="newName" value="${esc(ui.newName)}" placeholder="Aubergine grillée, pâtes au citron…" style="margin-top:10px;height:48px">
      <div class="section-label" style="margin-top:24px">Catégorie</div>
      <div class="pill-wrap" style="margin-top:10px">
        ${v.allCats.map(c => `<span class="cat-choice ${ui.newCat === c.id ? 'cat-choice-active' : ''}" data-act="pick-add-cat" data-id="${c.id}">${esc(c.name)}</span>`).join('')}
      </div>
      <div class="info-box">Les items ajoutés entrent dans le tirage comme les autres. Coche-les une fois pour dire que tu en as envie ce soir.</div>
    </div>
    <div class="bottom-bar"><div class="btn ${ui.newName.trim() ? 'btn-primary' : 'btn-disabled'}" data-act="save-new">Ajouter à ma liste</div></div>
  `;
}

function iconGear() {
  return `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
}

function iconCamera() {
  return `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`;
}

/* ---------- root render ---------- */

const root = document.getElementById('screen');

function render() {
  const scrl = root.querySelector('.scrl');
  const savedScroll = scrl ? scrl.scrollTop : 0;
  const active = document.activeElement;
  const bindName = active && active.dataset ? active.dataset.bind : null;
  const selStart = active && 'selectionStart' in active ? active.selectionStart : null;
  const selEnd = active && 'selectionEnd' in active ? active.selectionEnd : null;

  const v = computeVals();
  let html = '';
  if (ui.screen === 'home') html = screenHome(v);
  else if (ui.screen === 'cat') html = screenCat(v);
  else if (ui.screen === 'result') html = screenResult(v);
  else if (ui.screen === 'dish') html = screenDish(v);
  else if (ui.screen === 'settings') html = screenSettings(v);
  else if (ui.screen === 'add') html = screenAdd(v);

  root.className = 'screen screen-' + ui.screen + (ui.screen === 'cat' && v.catItems.length === 0 ? '' : '');
  root.innerHTML = html;

  const newScrl = root.querySelector('.scrl');
  if (newScrl) newScrl.scrollTop = savedScroll;

  if (bindName) {
    const el = root.querySelector(`[data-bind="${bindName}"]`);
    if (el) {
      el.focus();
      if (selStart != null && el.setSelectionRange) {
        try { el.setSelectionRange(selStart, selEnd); } catch {}
      }
    }
  }
}

/* ---------- photo handling ---------- */

function storePhoto(slug, file) {
  if (!file || !/^image\//.test(file.type)) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 900;
      let w = img.width, h = img.height;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio); h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      photos[slug] = dataUrl;
      const ok = savePhotos();
      if (!ok) {
        delete photos[slug];
        ui.toast = 'Photo trop lourde pour être enregistrée.';
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { ui.toast = ''; render(); }, 3200);
      }
      render();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/* ---------- event delegation ---------- */

const app = document.getElementById('app');

app.addEventListener('click', e => {
  const actEl = e.target.closest('[data-act]');
  if (!actEl) return;
  const act = actEl.dataset.act;
  const name = actEl.dataset.name;
  const id = actEl.dataset.id;

  switch (act) {
    case 'cycle': cycle(name); render(); break;
    case 'clear-item': {
      delete persisted.picks[name];
      ui.proposals = null;
      savePersisted();
      render();
      break;
    }
    case 'toggle-cat':
      ui.openCat2 = ui.openCat2 === id ? null : id;
      render();
      break;
    case 'open-cat': openCatFull(id); break;
    case 'go-home': goHome(); break;
    case 'go-settings': goSettings(); break;
    case 'go-result': goResult(); break;
    case 'go-add': goAdd(); break;
    case 'back-from-add': backFromAdd(); break;
    case 'reroll': reroll(); break;
    case 'toggle-yes-panel':
      ui.panel = ui.panel === 'yes' ? null : 'yes';
      ui.hQuery = '';
      render();
      break;
    case 'toggle-no-panel':
      ui.panel = ui.panel === 'no' ? null : 'no';
      ui.hQuery = '';
      render();
      break;
    case 'clear-panel': {
      const v = computeVals();
      v.panelNames.forEach(n => { delete persisted.picks[n]; });
      ui.panel = null;
      ui.proposals = null;
      savePersisted();
      render();
      break;
    }
    case 'set-filter': ui.filter = name; render(); break;
    case 'open-dish': {
      const v = computeVals();
      const p = (ui.proposals || []).find(p => p.name === name);
      if (p) openDish(p);
      break;
    }
    case 'confirm-dish': confirmDish(); break;
    case 'toggle-setting': {
      const key = actEl.dataset.key;
      persisted[key] = !persisted[key];
      ui.proposals = null;
      savePersisted();
      render();
      break;
    }
    case 'reset-all':
      persisted.picks = {};
      ui.proposals = null;
      ui.toast = '';
      savePersisted();
      render();
      break;
    case 'pick-add-cat': ui.newCat = id; render(); break;
    case 'save-new': {
      const n = ui.newName.trim();
      if (!n) return;
      persisted.custom[ui.newCat] = (persisted.custom[ui.newCat] || []).concat([n]);
      persisted.picks[n] = 1;
      savePersisted();
      ui.screen = 'cat';
      ui.catId = ui.newCat;
      ui.query = '';
      ui.filter = 'Tout';
      ui.newName = '';
      ui.proposals = null;
      render();
      break;
    }
    case 'pick-photo': {
      const input = root.querySelector(`.photo-input[data-slug="${CSS.escape(actEl.dataset.slug)}"]`);
      if (input) input.click();
      break;
    }
    case 'remove-photo': {
      delete photos[actEl.dataset.slug];
      savePhotos();
      render();
      break;
    }
    default: break;
  }
});

app.addEventListener('input', e => {
  const bind = e.target.dataset && e.target.dataset.bind;
  if (!bind) return;
  if (bind === 'hQuery') { ui.hQuery = e.target.value; ui.panel = null; }
  else if (bind === 'query') { ui.query = e.target.value; }
  else if (bind === 'newName') { ui.newName = e.target.value; }
  render();
});

app.addEventListener('change', e => {
  if (e.target.classList && e.target.classList.contains('photo-input')) {
    const slug = e.target.dataset.slug;
    const file = e.target.files && e.target.files[0];
    if (file) storePhoto(slug, file);
  }
});

app.addEventListener('dragover', e => {
  const slot = e.target.closest && e.target.closest('.photo-slot');
  if (slot) { e.preventDefault(); slot.classList.add('drag-over'); }
});

app.addEventListener('dragleave', e => {
  const slot = e.target.closest && e.target.closest('.photo-slot');
  if (slot) slot.classList.remove('drag-over');
});

app.addEventListener('drop', e => {
  const slot = e.target.closest && e.target.closest('.photo-slot');
  if (!slot) return;
  e.preventDefault();
  slot.classList.remove('drag-over');
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) storePhoto(slot.dataset.slug, file);
});

/* ---------- boot ---------- */

history.replaceState({ qqm: true }, '', location.href);
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
