let _lt = null;

function render() {
  const y = window.scrollY,
        tb = S.tab;

  render0();
  fabUpd();

  if (_lt === tb && S.tab === tb) window.scrollTo(0, y);

  _lt = S.tab;
}

function render0() {
  if (!S.session) return renderAuth();

  const n = nDone(),
        adm = S.session.role === "admin";

  if (adm && S.tab === "home") S.tab = "admin";
  if (!adm && S.tab === "admin") S.tab = "home";

  const tabs = adm
    ? [
        ["admin", ICONS.admin, "Admin"]
      ]
    : [
        ["home", ICONS.home, "Inicio"],
        ["logros", ICONS.logros, "Retos"],
        ["friends", ICONS.friends, "Amigos"],
        ["profile", ICONS.profile, "Perfil"]
      ];

  $("#app").innerHTML = `
  <header class="hdr sticky top-0 z-20 bg-emerald-700 text-white px-4 py-3 shadow">
    <div class="flex items-center justify-between gap-2">
      <h1 class="font-extrabold text-lg flex items-center gap-2"><span class="inline-flex w-8 h-8 rounded-xl bg-white/20 items-center justify-center">⛰️</span>Reto 100 Cims</h1>
      <div class="flex items-center gap-2">${themeBtn("text-base bg-white/20 rounded-lg px-2.5 py-1")}<button id="out" class="text-sm bg-white/20 rounded-lg px-3 py-1 whitespace-nowrap">${adm?"🛡️ admin_07":avImg(S.av,"w-5 h-5")+" "+esc(S.session.username)} · Salir</button></div>
    </div></header>
  <main class="p-4 space-y-4 ${S.tab!==LT?"tabin":""}">${S.tab==="home"?home(n):S.tab==="logros"?logros(n):S.tab==="friends"?friendsView():S.tab==="ask"?askView():S.tab==="profile"?profileView(n):admin()}</main>
  <nav class="fixed bottom-0 inset-x-0 z-20 bg-white border-t" style="padding-bottom:env(safe-area-inset-bottom,0px)">
    <div class="max-w-md mx-auto flex">${tabs.map(t=>`<button data-tab="${t[0]}" aria-label="${t[2]}" class="relative flex-1 py-2 text-xs ${S.tab===t[0]?"text-emerald-700 font-bold navon":"text-slate-500"}"><div>${t[1]}</div>${t[2]}${t[0]==="friends"?`<span id="nb" class="absolute top-0.5 left-1/2 ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-[18px]" style="${incoming().length+pendSh().length?"":"display:none"}">${incoming().length+pendSh().length}</span>`:""}${t[0]==="admin"?`<span id="pkb" class="absolute top-0.5 left-1/2 ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-[18px]" style="${pendPK().length?"":"display:none"}">${pendPK().length}</span>`:""}</button>`).join("")}</div></nav>`;

  LT = S.tab;

  $("#out").onclick = logout;

  document.querySelectorAll("[data-tab]").forEach(b =>
    b.onclick = () => {
      S.tab = b.dataset.tab;
      render();
    }
  );

  if (S.tab === "home") {
    document.querySelectorAll("[data-open]").forEach(b =>
      b.onclick = () => openForm(+b.dataset.open)
    );

    renderList();

    $("#q").oninput = e => {
      S.q = e.target.value;
      renderList();
    };

    $("#c").onchange = e => {
      S.c = e.target.value;
      renderList();
    };

    document.querySelectorAll("[data-f]").forEach(b =>
      b.onclick = () => {
        S.f = b.dataset.f;
        render();
      }
    );
  }

  if (S.tab === "ask") initAsk();
  if (S.tab === "profile") initProfile();
  if (S.tab === "admin") initAdmin();
  if (S.tab === "friends") initFriends();
}


const MYTH = [
  [p => p.name === "Pedraforca", "🪨", "Pedraforca"],
  [p => p.name === "Pica d’Estats", "👑", "Pica d’Estats"],
  [p => p.name === "Puigmal", "🌄", "Puigmal"],
  [p => p.name === "Canigó", "🔥", "Canigó"],
  [p => p.name.startsWith("Sant Jeroni"), "🎶", "Montserrat"],
  [p => p.name === "Matagalls", "🌲", "Matagalls"],
  [p => p.name === "Carlit", "🦌", "Carlit"],
  [p => p.name.startsWith("Caro"), "🌊", "Mont Caro"],
  [p => p.alt >= 3000, "❄️", "Tresmil"]
];


const badgeList = n =>
  BADGES
    .map(b => [
      b[1],
      b[2],
      n >= b[0],
      b[0] === 1 ? "Completa tu primera cima" : "Completa " + b[0] + " cimas"
    ])
    .concat(
      MYTH.map(m => [
        m[1],
        m[2],
        S.peaks.some(p => isEss(p) && S.done[p.id] && m[0](p)),
        m[2] === "Tresmil" ? "Corona una cima de 3000 m o más" : "Corona " + m[2]
      ])
    );


const badges = n =>
  badgeList(n)
    .map(b => {
      const m = MYTH.find(x => x[2] === b[1]),
            peak = m
              ? (S.peaks.find(p => S.done[p.id] && m[0](p)) || S.peaks.find(p => m[0](p)))
              : null,
            body = `<div class="text-4xl ${b[2]?"":"grayscale"}">${b[0]}</div><div class="text-sm font-semibold mt-1">${b[1]}</div><div class="text-[11px] text-slate-500 leading-tight">${b[2]?"✅ Conseguido":"🔒 "+b[3]}</div>`;

      return peak
        ? `<button type="button" data-fi="${peak.id}" class="badge-card rounded-2xl p-3 text-center ${b[2]?"bg-white shadow-sm":"bg-slate-100 opacity-60"} w-full">${body}</button>`
        : `<div class="rounded-2xl p-3 text-center ${b[2]?"bg-white shadow-sm":"bg-slate-100 opacity-60"}">${body}</div>`;
    })
    .join("");


const comarcas = () =>
  [...new Set(
    S.peaks.flatMap(p =>
      p.area.split(" / ").map(a => a.split(" (")[0])
    )
  )].sort((a, b) => a.localeCompare(b, "ca"));


const COMARCAS_BASE = [
  "Alt Camp", "Alt Empordà", "Alt Penedès", "Alt Urgell", "Alta Ribagorça", "Anoia",
  "Bages", "Baix Camp", "Baix Ebre", "Baix Empordà", "Baix Llobregat", "Baix Penedès",
  "Barcelonès", "Berguedà", "Cerdanya", "Conca de Barberà", "Garraf", "Garrigues",
  "Garrotxa", "Gironès", "Lluçanès", "Maresme", "Moianès", "Montsià",
  "Noguera", "Osona", "Pallars Jussà", "Pallars Sobirà", "Pla d'Urgell", "Pla de l'Estany",
  "Priorat", "Ribera d'Ebre", "Ripollès", "Segarra", "Segrià", "Selva",
  "Solsonès", "Tarragonès", "Terra Alta", "Urgell", "Vallès Occidental", "Vallès Oriental",
  "Val d'Aran"
];


const COMARCAS_VALIDAS = [
  ...new Set([
    ...COMARCAS_BASE.map(c => c.replace(/'/g, "’")),
    ...SEED.flatMap(p =>
      p.area.split(" / ").map(a => a.split(" (")[0])
    )
  ])
].sort((a, b) => a.localeCompare(b, "ca"));


const normalizaComarca = v =>
  (v || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`´]/g, "'")
    .toLocaleLowerCase("ca");


const comarcaValida = v =>
  COMARCAS_VALIDAS.find(c => normalizaComarca(c) === normalizaComarca(v)) || null;


const listaComarcas = () =>
  `<datalist id="comarcas-list">${COMARCAS_VALIDAS.map(c=>`<option value="${esc(c)}"></option>`).join("")}</datalist>`;


function logros(n) {
  const L = badgeList(n),
        k = L.filter(b => b[2]).length;

  return `${retosView(n)}${statsView()}<h2 class="font-bold text-lg px-1 pt-2">🏅 Logros</h2><div class="bg-white rounded-2xl p-4 shadow-sm text-center"><div class="text-3xl font-bold text-emerald-700">${k}/${L.length}</div><div class="text-xs text-slate-500">logros desbloqueados</div><div class="h-2 bg-slate-200 rounded-full overflow-hidden mt-2"><div class="h-full bg-emerald-600" style="width:${Math.round(k/L.length*100)}%"></div></div></div><div class="grid grid-cols-2 gap-3">${badges(n)}</div>`;
}


function home(n) {
  return `<div id="rb">${reqBanner()}</div>${dash(n)}
  <p class="text-xs text-slate-500 -mt-2">${Math.min(n,100)}/100 · Completa 100 de las ${S.peaks.filter(isEss).length} cimas esenciales de la FEEC</p>
  <div class="flex gap-2"><input id="q" value="${esc(S.q)}" placeholder="Buscar cima o comarca…" class="flex-1 min-w-0 rounded-xl border border-slate-300 px-3 py-2 bg-white"><button data-fo="1" aria-expanded="${S.fo?"true":"false"}" class="rounded-xl border border-slate-300 px-3 py-2 bg-white text-sm font-semibold whitespace-nowrap">⚙️ Filtros${(S.c?1:0)+(S.t?1:0)+(S.o?1:0)?" ("+((S.c?1:0)+(S.t?1:0)+(S.o?1:0))+")":""}</button></div>
  <div class="flex gap-2">${[["all","Todas"],["done","Completadas"],["todo","Pendientes"],["wish","⭐ Deseadas"]].map(f=>`<button data-f="${f[0]}" class="px-3 py-1 rounded-full text-sm ${S.f===f[0]?"bg-emerald-700 text-white":"bg-white border"}">${f[1]}</button>`).join("")}</div>
  <div id="fp" class="${S.fo?"":"hidden"} bg-white rounded-2xl p-3 shadow-sm space-y-2"><select id="c" class="w-full rounded-xl border border-slate-300 px-2 py-2 bg-white text-sm"><option value="">Todas las comarcas</option>${comarcas().map(c=>`<option ${S.c===c?"selected":""}>${esc(c)}</option>`).join("")}</select><div class="flex gap-2">${[["","Cualquier tipo"],["e","Esenciales"],["n","No esenciales"]].map(f=>`<button data-t="${f[0]}" class="px-3 py-1 rounded-full text-xs ${(S.t||"")===f[0]?"bg-emerald-700 text-white":"bg-white border"}">${f[1]}</button>`).join("")}</div>
  <div class="flex items-center gap-2 text-xs text-slate-500">Orden:${[["","Catálogo"],["date","📅 Fecha"+(S.o==="date"?(S.od?" ↑":" ↓"):"")],["az",S.o==="az"&&S.od?"🔤 Z–A":"🔤 A–Z"],["alt","⛰️ Altura"+(S.o==="alt"?(S.od?" ↑":" ↓"):"")]].map(o=>`<button data-o="${o[0]}" class="px-3 py-1 rounded-full ${(S.o||"")===o[0]?"bg-emerald-700 text-white":"bg-white border"}">${o[1]}</button>`).join("")}</div></div>
  <div id="list" class="space-y-2"></div>`;
}