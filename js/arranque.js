async function boot() {
  $("#app").innerHTML = `<div class="p-4 space-y-3" role="status" aria-label="Cargando"><div class="sk" style="height:56px"></div><div class="sk" style="height:190px"></div><div class="sk" style="height:72px"></div><div class="sk" style="height:72px"></div><div class="sk" style="height:72px"></div></div>`;

  try {
    if (window.firebase && typeof FIREBASE_CONFIG !== "undefined" && FIREBASE_CONFIG.projectId) {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      DB = firebase.firestore();
    }
  } catch (e) {
    DB = null;
  }

  if (!DB) {
    try {
      if (window.claude && claude.use) DB = await withTO(claude.use("db"), 10000);
    } catch (e) {
      DB = null;
    }
  }

  CLOUD = !!DB;

  if (CLOUD) {
    try {
      DB.collection("peaksov").onSnapshot(
        s => {
          S.eov = {};

          s.docs.forEach(d => {
            const o = d.data();

            if (o && o.id != null) {
              S.eov[o.id] = {
                name: o.name,
                alt: fixAlt(o.alt),
                area: o.area || "—",
                ...(o.del ? { del: true } : {})
              };
            }
          });

          rebuild();

          const a = document.activeElement;

          if (
            S.session &&
            !$("#modal") &&
            !document.querySelector('[class*="z-[90]"]') &&
            !(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName))
          ) render();
        },
        () => {}
      );
    } catch (e) {}
  }

  if (CLOUD) {
    try {
      DB.collection("peaks").onSnapshot(
        s => {
          S.extra = s.docs
            .map(d => d.data())
            .filter(p => p && p.name)
            .map(p => ({
              id: p.id,
              name: p.name,
              alt: fixAlt(p.alt),
              area: p.area || "—",
              ...(p.ess === true ? { ess: true } : {})
            }))
            .sort((a, b) => a.id - b.id);

          rebuild();

          const a = document.activeElement;

          if (S.session && !$("#modal") && !(a && /INPUT|TEXTAREA|SELECT/.test(a.tagName))) render();
        },
        () => {}
      );
    } catch (e) {}
  }

  let u = null;

  try {
    u = localStorage.getItem(SKEY);
  } catch (e) {}

  if (u) {
    try {
      const x = await ST.getUser(u);

      if (x) {
        await enter(x.username);
        return;
      }
    } catch (e) {}
  }

  render();
}


const blocked = t => !!(t && t.closest && t.closest("input,textarea,select,[contenteditable],#modal,.overflow-x-auto,#fab"));


document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (document.querySelector('[class*="z-[90]"]')) return;

  const m = [...document.querySelectorAll("#modal")].pop();

  if (m) m.remove();
});


/* Deslizar entre pantallas: la siguiente se ve mientras arrastras */
(function () {
  let st = null,
      busy = false;

  const order = () => S.session.role === "admin" ? ["admin"] : ["home", "logros", "friends", "profile"];

  const html = t => {
    const n = nDone();

    return t === "home" ? home(n)
      : t === "logros" ? logros(n)
      : t === "friends" ? friendsView()
      : t === "ask" ? askView()
      : t === "profile" ? profileView(n)
      : admin();
  };

  const dur = () => matchMedia("(prefers-reduced-motion:reduce)").matches ? 0 : 220;


  function makeGhost(s, side) {
    const tab = order()[s.i + side],
          host = s.main.parentElement,
          el = document.createElement("main");

    el.className = "p-4 space-y-4";
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = "position:absolute;pointer-events:none;box-sizing:border-box;left:" + (side > 0 ? s.W : -s.W) + "px;top:" + (s.main.offsetTop + window.scrollY) + "px;width:" + s.W + "px";
    el.innerHTML = html(tab);

    host.appendChild(el);

    try {
      if (tab === "home") renderList();
      else if (tab === "friends") paintFriends();
      else if (tab === "admin") {
        paintUsers();
        paintPK();
      }
      else if (tab === "ask") paintAsk();
    } catch (_) {}

    el.querySelectorAll("[id]").forEach(x => x.removeAttribute("id"));

    return el;
  }


  function begin(s) {
    const host = s.main.parentElement;

    s.hostPos = host.style.position;

    if (getComputedStyle(host).position === "static") host.style.position = "relative";

    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";

    s.main.style.willChange = "transform";
  }


  function cleanup(s) {
    Object.values(s.ghosts).forEach(g => g.remove());
    s.ghosts = {};

    if (document.contains(s.main)) {
      s.main.style.transform = "";
      s.main.style.transition = "";
      s.main.style.willChange = "";
      s.main.parentElement.style.position = s.hostPos || "";
    }

    document.documentElement.style.overflowX = "";
    document.body.style.overflowX = "";
  }


  function drag(s, dx) {
    const side = dx < 0 ? 1 : -1,
          j = s.i + side,
          has = j >= 0 && j < order().length;

    dx = Math.max(-s.W, Math.min(s.W, dx));

    if (has && !s.ghosts[side]) s.ghosts[side] = makeGhost(s, side);

    const x = has ? dx : dx * 0.3;

    s.main.style.transform = "translateX(" + x + "px)";
    Object.values(s.ghosts).forEach(g => g.style.transform = "translateX(" + x + "px)");
  }


  function finish(s, cancel) {
    if (!document.contains(s.main)) {
      cleanup(s);
      return;
    }

    const dx = cancel ? 0 : s.dx,
          dt = Math.max(1, Date.now() - s.t),
          side = dx < 0 ? 1 : -1,
          j = s.i + side,
          has = j >= 0 && j < order().length;

    const commit = !cancel && has && (Math.abs(dx) > s.W * 0.3 || (Math.abs(dx) / dt > 0.5 && Math.abs(dx) > 40));

    busy = true;

    const d = dur(),
          els = [s.main, ...Object.values(s.ghosts)];

    els.forEach(el => el.style.transition = "transform " + d + "ms ease-out");
    els.forEach(el => el.style.transform = "translateX(" + (commit ? -side * s.W : 0) + "px)");

    setTimeout(() => {
      cleanup(s);

      if (commit && S.session) {
        const tab = order()[j];

        LT = tab;
        S.tab = tab;

        render();
        window.scrollTo(0, 0);
      }

      busy = false;
    }, d + 20);
  }


  document.addEventListener("touchstart", e => {
    st = null;

    if (busy || !S.session || e.touches.length !== 1 || blocked(e.target)) return;

    const main = document.querySelector("main");

    if (!main) return;

    const i = order().indexOf(S.tab);

    if (i < 0) return;

    st = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      t: Date.now(),
      main,
      mode: 0,
      ghosts: {},
      W: main.offsetWidth,
      i,
      dx: 0
    };
  }, { passive: true });


  document.addEventListener("touchmove", e => {
    if (!st || busy) return;

    const t = e.touches[0],
          dx = t.clientX - st.x,
          dy = t.clientY - st.y;

    if (st.mode === 0) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

      if (Math.abs(dx) > Math.abs(dy) * 1.2) {
        st.mode = 2;
        begin(st);
      } else {
        st = null;
        return;
      }
    }

    if (e.cancelable) e.preventDefault();

    st.dx = dx;
    drag(st, dx);
  }, { passive: false });


  document.addEventListener("touchend", () => {
    if (!st) return;

    const s = st;

    st = null;

    if (s.mode === 2) finish(s, false);
  }, { passive: true });


  document.addEventListener("touchcancel", () => {
    if (!st) return;

    const s = st;

    st = null;

    if (s.mode === 2) finish(s, true);
  }, { passive: true });
})();


boot();