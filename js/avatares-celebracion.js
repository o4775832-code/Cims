/* ===== Avatares, celebración y pull-to-refresh ===== */

const ago = d => {
  if (!d) return "";

  const t = Math.round((new Date(new Date().toDateString()) - new Date(d + "T00:00:00")) / 864e5);

  return t <= 0 ? "hoy"
    : t === 1 ? "ayer"
    : t < 30 ? "hace " + t + " días"
    : t < 365 ? "hace " + Math.round(t / 30) + " meses"
    : d;
};


function statsView() {
  const D = S.peaks.filter(p => isEss(p) && S.done[p.id]),
        allDone = S.peaks.filter(p => S.done[p.id]),
        alt = allDone.reduce((s, p) => s + (p.alt || 0), 0),
        top = D.slice().sort((a, b) => b.alt - a.alt)[0],

        withF = D.filter(p => (S.done[p.id].comp || []).length).length,
        now = new Date(),
        yr = String(now.getFullYear()),

        thisY = D.filter(p => (S.done[p.id].date || "").startsWith(yr)).length,

        M = [...Array(12)].map((_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1),
                k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");

          return {
            l: d.toLocaleDateString((LANG === "ca" ? "ca-ES" : "es-ES"), { month: "short" }).slice(0, 3),
            v: D.filter(p => (S.done[p.id].date || "").startsWith(k)).length
          };
        }),

        mx = Math.max(1, ...M.map(m => m.v)),

        CM = comarcas()
          .map(c => {
            const T = S.peaks.filter(p => isEss(p) && p.area.split(" / ").some(a => a.split(" (")[0] === c));

            return { c, t: T.length, d: T.filter(p => S.done[p.id]).length };
          })
          .filter(x => x.d)
          .sort((a, b) => b.d / b.t - a.d / a.t || b.d - a.d)
          .slice(0, 5),

        card = (i, v, l, peakId = null) => peakId
          ? `<button type="button" data-fi="${peakId}" aria-label="Abrir ficha de ${esc(String(v))}" class="stat-card bg-white rounded-2xl p-3 shadow-sm text-left w-full"><div class="text-lg">${i}</div><div class="text-xl font-extrabold text-emerald-700 leading-tight">${v}</div><div class="text-[11px] text-slate-500 leading-tight">${l}</div></button>`
          : `<div class="bg-white rounded-2xl p-3 shadow-sm"><div class="text-lg">${i}</div><div class="text-xl font-extrabold text-emerald-700 leading-tight">${v}</div><div class="text-[11px] text-slate-500 leading-tight">${l}</div></div>`;

  return `<h2 class="font-bold text-lg px-1">📊 Estadísticas</h2><div class="grid grid-cols-2 gap-3">${card("📈",alt.toLocaleString((LANG==="ca"?"ca-ES":"es-ES"))+" m","suma de altitudes")}${card("🏔️",top?esc(top.name):"—",top?top.alt+" m · tu cima más alta":"tu cima más alta",top?top.id:null)}${card("👥",withF,"cimas con amigos")}${card("🗓️",thisY,"cimas en "+yr)}</div>
  <div class="bg-white rounded-2xl p-3 shadow-sm"><div class="text-sm font-semibold mb-2">Cimas por mes</div><div class="flex items-end gap-1 h-24">${M.map(m=>`<div class="flex-1 flex flex-col items-center justify-end h-full"><div class="text-[10px] text-slate-500">${m.v||""}</div><div class="w-full rounded-t bar" style="height:${Math.max(m.v?8:2,m.v/mx*70)}%;opacity:${m.v?1:.25}"></div></div>`).join("")}</div><div class="flex gap-1 mt-1">${M.map(m=>`<div class="flex-1 text-center text-[9px] text-slate-500">${m.l}</div>`).join("")}</div></div>
  <div class="bg-white rounded-2xl p-3 shadow-sm space-y-2"><div class="text-sm font-semibold">Comarcas más avanzadas</div>${CM.map(x=>`<div><div class="flex justify-between text-xs"><span>${esc(x.c)}</span><span class="text-slate-500">${x.d}/${x.t}</span></div><div class="h-2 bg-slate-200 rounded-full overflow-hidden"><div class="h-full bar" style="width:${Math.round(x.d/x.t*100)}%"></div></div></div>`).join("")||`<p class="text-xs text-slate-500">Completa tu primera cima para ver estadísticas.</p>`}</div>`;
}


const friendSeg = () => `<div class="flex bg-slate-100 rounded-xl p-1 text-sm gap-1">${[["friends","👥 Amigos"],["rank","🏆 Ranking"],["feed","📰 Actividad"]].map(t=>`<button data-ft="${t[0]}" class="flex-1 py-2 rounded-lg ${(S.ft||"friends")===t[0]?"seg-on bg-white shadow font-semibold":""}">${t[1]}</button>`).join("")}</div>`;


function paneSwitch() {
  const ft = S.ft || "friends";

  [["friends", "p-fr"], ["rank", "p-rank"], ["feed", "p-feed"]].forEach(k => {
    const e = $("#" + k[1]);

    if (e) e.classList.toggle("hidden", k[0] !== ft);
  });

  if (ft === "rank") paintRank();
  if (ft === "feed") paintFeed();
}


async function paintRank() {
  const el = $("#p-rank");

  if (!el) return;

  const m = S.rk || "c",
        ym = today().slice(0, 7);

  const ess = id => S.peaks.some(p => p.id === id && isEss(p)),

        recs = n => CLOUD
          ? (S.feed || []).filter(x => lk(x.u) === lk(n)).map(x => ({ id: x.peakId, d: x.date || "" }))
          : Object.entries(((S.data[n] || {}).done) || {}).map(e => ({ id: +e[0], d: e[1].date || "" })),

        mine = Object.entries(S.done).map(e => ({ id: +e[0], d: e[1].date || "" })),

        val = (n, me) => {
          const R = me ? mine : recs(n);

          return new Set(R.filter(x => ess(x.id) && (m === "c" || x.d.startsWith(ym))).map(x => x.id)).size;
        },

        L = [{ n: S.session.username, me: 1 }, ...friends().map(n => ({ n }))]
          .map(x => ({ ...x, c: val(x.n, x.me) }))
          .sort((a, b) => b.c - a.c || a.n.localeCompare(b.n)),

        mx = Math.max(1, L[0].c),
        med = ["🥇", "🥈", "🥉"],
        u = "",

        seg = [["c", "Cimas"], ["m", "Este mes"]]
          .map(t => `<button data-rk="${t[0]}" class="flex-1 py-1.5 rounded-lg text-xs ${m===t[0]?"seg-on bg-white shadow font-semibold":""}">${t[1]}</button>`)
          .join(""),

        pod = L.length >= 2
          ? `<div class="flex items-end justify-center gap-2 pt-2">${[1,0,2].filter(i=>L[i]).map(i=>`<div class="text-center w-24"><div class="text-2xl">${med[i]}</div><div class="flex justify-center">${avImg(avOf(L[i].n),"w-10 h-10")}</div><div class="text-xs font-semibold truncate">${esc(L[i].n)}</div><div class="rounded-t-xl text-white font-extrabold text-sm py-1 mt-1" style="background:var(--brand);height:${[64,44,32][i]}px">${L[i].c}${u}</div></div>`).join("")}</div>`
          : "";

  el.innerHTML = `<div class="bg-white rounded-2xl p-3 shadow-sm space-y-2"><h2 class="font-bold">🏆 Ranking entre amigos</h2><div class="flex bg-slate-100 rounded-xl p-1 gap-1">${seg}</div>${L.length<2?`<p class="text-sm text-slate-500">Añade amigos para competir con ellos.</p>`:""}${pod}${L.slice(3).map((x,i)=>`<div class="rankrow ${x.me?"rankme":""}"><div class="w-7 text-center">${i+4}</div><div class="flex-1 min-w-0 text-sm font-semibold truncate">${esc(x.n)}${x.me?" (tú)":""}</div><div class="font-extrabold text-emerald-700">${x.c}${u}</div></div>`).join("")}</div>`;

  el.querySelectorAll("[data-rk]").forEach(b => b.onclick = () => {
    S.rk = b.dataset.rk;
    paintRank();
  });
}


function paintFeed() {
  const el = $("#p-feed");

  if (!el) return;

  const mine = S.peaks
          .filter(p => S.done[p.id])
          .map(p => ({
            u: S.session.username,
            peakId: p.id,
            date: S.done[p.id].date || "",
            n: (S.done[p.id].comp || []).length,
            me: 1
          })),

        F = CLOUD
          ? (S.feed || [])
          : friends().flatMap(n =>
              Object.entries(((S.data[n] || {}).done) || {}).map(e => ({
                u: n,
                peakId: +e[0],
                date: e[1].date || "",
                n: (e[1].comp || []).length
              }))
            ),

        L = [...mine, ...F].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);

  el.innerHTML = `<div class="bg-white rounded-2xl p-3 shadow-sm space-y-3"><h2 class="font-bold">📰 Actividad reciente</h2>${L.map(x=>{const p=S.peaks.find(q=>q.id===x.peakId);return p?`<div class="flex items-center gap-3"><div class="text-2xl">${avImg(avOf(x.u),"w-8 h-8")}</div><div class="flex-1 min-w-0 text-sm"><b>${x.me?"Tú":esc(x.u)}</b> ${x.me?"hiciste":"hizo"} <b>${esc(p.name)}</b> ${chipEs(p)}<div class="text-[11px] text-slate-500">${p.alt?p.alt+" m · ":""}${ago(x.date)}${x.n?" · con "+x.n+" acompañante"+(x.n>1?"s":""):""}</div></div></div>`:""}).join("")||`${empty("Aún no hay actividad.","f")}`}</div>`;
}


async function toggleWish(id) {
  const had = S.wish.includes(id);

  S.wish = had ? S.wish.filter(x => x !== id) : [...S.wish, id];
  render();

  try {
    await ST.saveWish(S.session.username, S.wish);
  } catch (e) {
    S.wish = had ? [...S.wish, id] : S.wish.filter(x => x !== id);
    render();
    alert(errMsg(e));
  }
}


const chipEs = p => isEss(p) ? `<span class="chip-e">Esencial</span>` : `<span class="chip-n">No esencial</span>`;

const avRe = new RegExp("^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$");

const avImg = (v, c) => avRe.test(v || "")
  ? `<img src="${v}" class="${c||"w-6 h-6"} rounded-full object-cover inline-block align-middle">`
  : esc((v || "👤").slice(0, 8));

const avOf = n => {
  if (S.session && S.session.role === "user" && lk(n) === me()) return S.av || "";

  const u = [...ALLU, ...USERS, ...S.users].find(x => lk(x.username) === lk(n));

  return (u && u.avatar) || "";
};


function celebrate(p) {
  const el = document.createElement("div"),
        C = ["#22c55e", "#facc15", "#f97316", "#38bdf8", "#f472b6", "#a78bfa"];

  el.className = "fixed inset-0 z-[70] flex items-center justify-center pointer-events-none overflow-hidden";
  el.style.animation = "fo .4s 2.4s forwards";

  let h = `<div class="stamp"><div class="text-3xl">🏔️</div><div class="text-xl tracking-wider">¡CIMA!</div><div class="text-[11px] font-semibold px-3 leading-tight">${esc(p.name)}</div><div class="text-[10px] opacity-70">${isEss(p)?"nº "+nDone():"no esencial"} · ${new Date().toLocaleDateString((LANG==="ca"?"ca-ES":"es-ES"))}</div></div>`;

  for (let i = 0; i < 48; i++) h += `<i class="cf" style="left:${Math.random()*100}%;background:${C[i%6]};animation-delay:${(Math.random()*.5).toFixed(2)}s;--dx:${Math.round(Math.random()*160-80)}px;--r:${Math.round(Math.random()*720)}deg"></i>`;

  el.innerHTML = h;
  document.body.appendChild(el);

  try {
    navigator.vibrate && navigator.vibrate(40);
  } catch (e) {}

  setTimeout(() => el.remove(), 2900);
}


function openAvatar() {
  const el = document.createElement("div");

  el.id = "modal";
  el.className = "fixed inset-0 z-50 bg-black/50 flex items-end justify-center";

  const E = ["🦊", "🐻", "🐺", "🦅", "🐐", "🦌", "🐿️", "🦉", "🐗", "🦫", "🐢", "🐸", "🥾", "🧗", "🏔️", "🌲", "🌄", "🔥", "⭐", "🦋", "🐝", "🍄", "🌻", "🎒"];

  el.innerHTML = `<div class="sheet bg-white w-full max-w-md rounded-t-3xl p-5 space-y-3 max-h-[90vh] overflow-y-auto"><div class="flex justify-between items-start"><h3 class="font-bold text-lg">Tu avatar</h3><button id="x" class="text-2xl leading-none">×</button></div><div class="grid grid-cols-6 gap-2 text-3xl text-center">${E.map(e=>`<button data-e="${e}" class="rounded-xl py-2 bg-slate-100 ${S.av===e?"ring-2 ring-emerald-600":""}">${e}</button>`).join("")}</div><label class="block text-center px-3 py-2 rounded-lg bg-slate-100 cursor-pointer text-sm">📷 Subir foto<input id="avf" type="file" accept="image/*" class="hidden"></label>${S.av?`<button id="avx" class="w-full text-sm text-red-600 py-1">Quitar avatar</button>`:""}</div>`;

  document.body.appendChild(el);

  const close = () => el.remove();

  el.onclick = e => {
    if (e.target === el) close();
  };

  $("#x").onclick = close;

  const save = async v => {
    try {
      await ST.setAvatar(S.session.username, v);
    } catch (e) {
      alert(errMsg(e));
      return;
    }

    S.av = v;
    close();
    render();
  };

  el.querySelectorAll("[data-e]").forEach(b => b.onclick = () => save(b.dataset.e));

  if ($("#avx")) $("#avx").onclick = () => save("");

  $("#avf").onchange = e => {
    const f = e.target.files[0];

    if (!f) return;

    const r = new FileReader();

    r.onload = () => {
      const im = new Image();

      im.onload = () => {
        const s = Math.min(im.width, im.height),
              c = document.createElement("canvas");

        c.width = c.height = 128;
        c.getContext("2d").drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 128, 128);

        save(c.toDataURL("image/jpeg", .8));
      };

      im.src = r.result;
    };

    r.readAsDataURL(f);
  };
}


async function refreshAll() {
  if (!S.session) return;

  try {
    if (S.session.role === "user") {
      const d = await ST.load(S.session.username);

      S.done = d.done;
      S.companions = d.companions;
      S.declined = d.declined || [];
      S.av = d.avatar || "";
      S.wish = d.wish || [];

      if (CLOUD) S.shares = await ST.discover();
    }
  } catch (e) {
    alert(errMsg(e));
  }

  render();

  if (S.session && S.session.role === "user") refreshFriends();
}


(() => {
  let y0 = null,
      dy = 0;

  const ind = document.createElement("div");

  ind.textContent = "🔄";
  ind.style.cssText = "position:fixed;left:50%;top:-50px;width:40px;height:40px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:20px;z-index:65;pointer-events:none;box-shadow:0 4px 14px #0004;background:var(--card);transform:translate(-50%,0)";

  document.body.appendChild(ind);

  addEventListener("touchstart", e => {
    y0 = (scrollY <= 0 && S.session && true && !$("#modal")) ? e.touches[0].clientY : null;
    dy = 0;
  }, { passive: true });

  addEventListener("touchmove", e => {
    if (y0 === null) return;

    dy = Math.max(0, e.touches[0].clientY - y0);

    ind.style.transition = "none";
    ind.style.transform = "translate(-50%," + (Math.min(dy, 130) * .7 + (dy > 0 ? 20 : 0)) + "px) rotate(" + dy * 3 + "deg)";
  }, { passive: true });

  addEventListener("touchend", async () => {
    if (y0 === null) return;

    const go = dy > 90;

    y0 = null;
    ind.style.transition = "transform .2s";

    if (go) {
      ind.style.transform = "translate(-50%,90px)";
      ind.style.animation = "ptr .8s linear infinite";

      await refreshAll();

      ind.style.animation = "";
    }

    ind.style.transform = "translate(-50%,0)";
    dy = 0;
  });
})();


async function enter(u) {
  const d = await ST.load(u);

  S.session = { role: "user", username: u };
  S.done = d.done;
  S.companions = d.companions;
  S.declined = d.declined || [];
  S.av = d.avatar || "";
  S.tab = "home";
  S.q = "";
  S.f = "all";
  S.c = "";

  watchReqs();
  watchPK();

  S.wish = d.wish || [];

  if (CLOUD) DB.doc("users/" + sid(u)).update({ count: nDone() }).catch(() => {});

  try {
    localStorage.setItem(SKEY, u);
  } catch (e) {}

  render();

  try {
    if (!localStorage.getItem("cims-onb")) setTimeout(onboarding, 500);
  } catch (e) {}
}


function logout() {
  if (unsubR) {
    unsubR();
    unsubR = null;
  }

  if (unsubU) {
    unsubU();
    unsubU = null;
  }

  if (unsubPK) {
    unsubPK();
    unsubPK = null;
  }

  try {
    localStorage.removeItem(SKEY);
  } catch (e) {}

  S.session = null;
  S.done = {};
  S.companions = [];
  S.av = "";
  S.wish = [];
  S.declined = [];
  S.feed = [];
  USERS = [];
  ALLU = [];

  if (CLOUD) {
    S.reqs = [];
    S.shares = [];
    S.pk = [];
  }

  S.authMode = "login";

  render();
}


function renderAuth() {
  const reg = S.authMode === "register";

  $("#app").innerHTML = `<div class="min-h-screen flex flex-col justify-center p-6">
    ${themeBtn("fixed top-3 right-3 z-30 w-10 h-10 rounded-full bg-white shadow text-xl")}
    <div class="text-center mb-6"><div class="logo">⛰️</div><h1 class="text-2xl font-bold text-emerald-800 mt-2">Reto 100 Cims</h1><p class="text-sm text-slate-500">Registra tus cimas de Catalunya</p></div>
    <div class="bg-white rounded-2xl shadow-sm p-4 space-y-3">
      <div class="flex bg-slate-100 rounded-xl p-1 text-sm"><button data-m="login" class="flex-1 py-2 rounded-lg ${!reg?"seg-on bg-white shadow font-semibold":""}">Iniciar sesión</button><button data-m="register" class="flex-1 py-2 rounded-lg ${reg?"seg-on bg-white shadow font-semibold":""}">Registrarse</button></div>
      <input id="u" autocomplete="username" ${reg?'maxlength="20"':""} placeholder="Usuario" class="w-full border rounded-lg px-3 py-2">
            <div class="relative"><input id="pw" type="password" autocomplete="${reg?"new-password":"current-password"}" placeholder="Contraseña${reg?" (mín. 6 caracteres)":""}" class="w-full border rounded-lg px-3 py-2 pr-11"><button type="button" id="eye" aria-label="Mostrar u ocultar contraseña" class="absolute right-2 top-1/2 -translate-y-1/2 text-xl">👁️</button></div>
      <p id="err" class="text-sm text-red-600 min-h-[1.25rem]"></p>
      <button id="go" class="w-full bg-emerald-600 text-white rounded-xl py-2.5 font-medium disabled:opacity-60">${reg?"Crear cuenta":"Entrar"}</button>
    </div>
    <p class="text-[11px] text-center text-slate-500 mt-3">${CLOUD?"☁️ Tus datos se guardan en la nube: puedes entrar desde cualquier dispositivo.":"💾 Modo local: los datos solo se guardan en este navegador."}</p></div>`;

  document.querySelectorAll("[data-m]").forEach(b => b.onclick = () => {
    S.authMode = b.dataset.m;
    renderAuth();
  });

  const go = async () => {
    const u = $("#u").value.trim(),
          pw = $("#pw").value,
          err = t => {
            $("#err").textContent = t;
          };

    if (!u || !pw) return err("Rellena todos los campos.");

    const btn = $("#go");

    btn.disabled = true;
    err("");

    try {
      if (!reg) {
        if (lk(u) === "admin_07") {
          if (!(await verifyPw(pw, ADMIN_HASH))) return err("Usuario o contraseña incorrectos.");

          S.session = { role: "admin" };
          S.done = {};
          S.companions = [];
          S.tab = "admin";

          watchPK();

          return render();
        }

        const x = await ST.getUser(u);

        if (!x || !(await verifyPw(pw, x.hash))) return err("Usuario o contraseña incorrectos.");

        if (!String(x.hash).startsWith("pbkdf2$")) {
          try {
            await ST.setPassword(x.username, await hashNew(pw));
          } catch (_) {}
        }

        return await enter(x.username);
      }

      if (!/^[\p{L}\p{N}._-]{3,20}$/u.test(u)) return err("Usuario: 3–20 caracteres (letras, números, . _ -).");
      if (pw.length < 6) return err("La contraseña necesita al menos 6 caracteres.");
      if (lk(u) === "admin_07" || await ST.getUser(u)) return err("Ese usuario ya existe.");

      await ST.createUser({ username: u, hash: await hashNew(pw), date: new Date().toISOString().slice(0, 10) });
      await enter(u);
    } catch (e) {
      err(errMsg(e));
    } finally {
      const b = $("#go");

      if (b) b.disabled = false;
    }
  };

  $("#eye").onclick = () => {
    const i = $("#pw"),
          show = i.type === "password";

    i.type = show ? "text" : "password";
    $("#eye").textContent = show ? "🙈" : "👁️";
  };

  $("#go").onclick = go;

  document.querySelectorAll("#app input").forEach(i => i.onkeydown = e => {
    if (e.key === "Enter") go();
  });
}