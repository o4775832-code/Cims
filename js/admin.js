let unsubU = null,
    USERS = [];

function admin() {
  return `<div id="pkq"></div><div class="flex items-center justify-between"><h2 class="font-bold">Usuarios registrados</h2><span class="text-xs text-slate-500">${CLOUD?"☁️ Nube":"💾 Local"}</span></div>
  <div id="ut" class="bg-white rounded-2xl shadow-sm overflow-x-auto"></div>
  <p class="text-xs text-slate-500 -mt-2">Toca un usuario para ver todo su progreso.</p>
  <h2 class="font-bold">Añadir cima</h2>
  <div class="bg-white rounded-2xl p-3 shadow-sm space-y-2">
    <input id="a_n" placeholder="Nombre" class="w-full border rounded-lg px-3 py-2">
    <div class="grid grid-cols-2 gap-2"><input id="a_h" type="number" placeholder="Altitud (m)" class="border rounded-lg px-3 py-2"><input id="a_c" list="comarcas-list" autocomplete="off" placeholder="Comarca" class="border rounded-lg px-3 py-2"></div>${listaComarcas()}
    <select id="a_t" class="w-full border rounded-lg px-3 py-2 bg-white"><option value="n">No esencial (no cuenta para el reto de los 100)</option><option value="e">⚠️ Esencial (cuenta para el reto de los 100)</option></select>
    <p id="a_e" class="text-xs text-red-600"></p>
    <button id="a_b" class="w-full bg-emerald-600 text-white rounded-xl py-2.5 font-medium">➕ Añadir cima</button>
    <p class="text-xs text-slate-500">Catálogo: ${S.peaks.filter(isEss).length} esenciales + ${S.peaks.filter(p=>!isEss(p)).length} no esenciales. Las no esenciales no cuentan para el reto de los 100. Antes de cada cambio se pedirá confirmación.</p></div>
  <div class="flex items-center justify-between"><h2 class="font-bold">Catálogo de cimas</h2><span id="cat_n" class="text-xs text-slate-500"></span></div>
  <div class="bg-white rounded-2xl p-3 shadow-sm space-y-2">
    <input id="cat_q" placeholder="Buscar cima o comarca…" autocomplete="off" class="w-full border rounded-lg px-3 py-2">
    <div class="flex gap-2">${[["","Todas"],["e","Esenciales"],["n","No esenciales"]].map(f=>`<button data-cf="${f[0]}" class="${cfCls(f[0])}">${f[1]}</button>`).join("")}</div>
    <div id="cat_l"></div></div><div id="cat_del"></div>`;
}

function askView() {
  return `<h2 class="font-bold text-lg px-1">➕ Solicitar una cima</h2>
  <p class="text-xs text-slate-500 -mt-2 px-1">¿Falta una cima en el catálogo? Pídesela al admin indicando su nombre, altitud y comarca. Si la acepta, aparecerá como cima no esencial (no cuenta para el reto de los 100).</p>
  <div class="bg-white rounded-2xl p-3 shadow-sm space-y-2">
    <input id="k_n" placeholder="Nombre" class="w-full border rounded-lg px-3 py-2">
    <div class="grid grid-cols-2 gap-2"><input id="k_h" type="number" min="0" placeholder="Altitud (m)" class="border rounded-lg px-3 py-2"><input id="k_c" list="comarcas-list" autocomplete="off" placeholder="Comarca" class="border rounded-lg px-3 py-2"></div>${listaComarcas()}
    <p id="k_e" class="text-xs text-red-600"></p>
    <button id="k_b" class="w-full bg-emerald-600 text-white rounded-xl py-2.5 font-medium">📨 Enviar solicitud al admin</button></div>
  <h2 class="font-bold px-1">Mis solicitudes</h2><div id="k_l" class="space-y-2"></div>`;
}

function paintAsk() {
  const el = $("#k_l");
  if (!el) return;

  const L = S.pk.filter(r => r.userK === me()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const chip = t => t === "ok"
    ? `<span class="text-xs font-semibold text-emerald-700">✅ Aceptada</span>`
    : t === "no"
      ? `<span class="text-xs font-semibold text-red-600">❌ Rechazada</span>`
      : `<span class="text-xs font-semibold text-amber-600">⏳ Pendiente</span>`;

  el.innerHTML = L.map(r => `<div class="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-2"><div class="flex-1 min-w-0"><div class="text-sm font-medium truncate">${esc(r.name)}</div><div class="text-xs text-slate-500">${r.alt?r.alt+" m · ":""}${esc(r.area||"—")}</div>${r.note?`<div class="text-xs text-red-600">Motivo: ${esc(r.note)}</div>`:""}</div>${chip(r.status)}${r.status!=="pending"?`<button data-pkx="${esc(r.id)}" class="text-xs text-slate-500 px-2 py-1">Quitar</button>`:""}</div>`).join("") || `${empty("Aún no has pedido ninguna cima.", "m")}`;

  el.querySelectorAll("[data-pkx]").forEach(b => b.onclick = async () => {
    try {
      await ST.delPeakReq(b.dataset.pkx);
    } catch (e) {
      alert(errMsg(e));
      return;
    }
    paintAsk();
  });
}

function initAsk() {
  paintAsk();

  $("#k_b").onclick = async () => {
    const e = $("#k_e"),
      er = m => {
        e.className = "text-xs text-red-600";
        e.textContent = m;
      };

    const name = $("#k_n").value.trim(),
      rawAlt = $("#k_h").value,
      alt = parseAlt(rawAlt),
      area = comarcaValida($("#k_c").value);

    if (!name) return er("Escribe el nombre de la cima.");
    if (rawAlt === "" || !Number.isFinite(alt) || alt <= 0) return er("Indica una altitud válida en metros.");
    if (!area) return er("Selecciona o escribe una comarca válida de la lista.");
    if (S.peaks.some(p => lk(p.name) === lk(name))) return er("Esa cima ya está en el catálogo.");
    if (S.pk.some(r => r.status === "pending" && lk(r.name) === lk(name))) return er("Ya hay una solicitud pendiente para esa cima.");

    const b = $("#k_b");
    b.disabled = true;

    try {
      await ST.sendPeakReq({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        user: S.session.username,
        userK: me(),
        name,
        alt,
        area,
        status: "pending",
        date: new Date().toISOString()
      });
    } catch (x) {
      b.disabled = false;
      return er(errMsg(x));
    }

    b.disabled = false;
    ["k_n", "k_h", "k_c"].forEach(i => $("#" + i).value = "");
    e.className = "text-xs text-emerald-700";
    e.textContent = "✅ Solicitud enviada. El admin la revisará.";
    paintAsk();
  };
}

function paintPK() {
  const el = $("#pkq");
  if (!el) return;

  const P = S.pk.filter(r => r.status === "pending").sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  el.innerHTML = P.length ? `<h2 class="font-bold">🏔️ Solicitudes de cimas <span class="text-red-600">(${P.length})</span></h2><div class="bg-white rounded-2xl p-3 shadow-sm space-y-3">${P.map(r=>`<div data-peak-request="${esc(r.id)}" class="space-y-2 border-b last:border-0 pb-3 last:pb-0">
    <div class="text-sm"><b>${esc(r.user)}</b> solicita <b>${esc(r.name)}</b></div>
    <div class="text-xs text-slate-500">${r.alt?r.alt+" m · ":"Altitud no indicada · "}${esc(r.area||"—")}</div>
    <input data-pkn="${esc(r.id)}" maxlength="200" placeholder="Motivo si rechazas (opcional)" class="w-full border rounded-lg px-3 py-2 text-sm"><div class="flex gap-2"><button data-pka="ok" data-pki="${esc(r.id)}" class="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white">✅ Aceptar cima</button><button data-pka="no" data-pki="${esc(r.id)}" class="text-sm px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700">Rechazar</button></div>
  </div>`).join("")}</div>` : "";

  el.querySelectorAll("[data-pka]").forEach(b => b.onclick = async () => {
    const r = S.pk.find(x => x.id === b.dataset.pki);
    if (!r) return;

    el.querySelectorAll("button").forEach(x => x.disabled = true);

    try {
      const ni = el.querySelector('[data-pkn="' + CSS.escape(r.id) + '"]'),
        added = await ST.answerPeakReq(r, b.dataset.pka === "ok", ni ? ni.value.trim().slice(0, 200) : "");
      if (b.dataset.pka === "ok" && !added) alert("Esa cima ya estaba en el catálogo: solicitud cerrada.");
    } catch (e) {
      alert(errMsg(e));
      paintPK();
      return;
    }

    render();
  });
}

const cfCls = k => "px-3 py-1 rounded-full text-xs " + ((S.cf || "") === k ? "bg-emerald-700 text-white" : "bg-white border");

function paintCatalog() {
  const el = $("#cat_l");
  if (!el) return;

  const q = nz(S.cq || ""),
    f = S.cf || "";

  const L = S.peaks
    .filter(p => nz(p.name + " " + (p.area || "")).includes(q) && (!f || (f === "e") === isEss(p)))
    .sort((a, b) => a.name.localeCompare(b.name, "ca"));

  $("#cat_n").textContent = L.length + " de " + S.peaks.length;

  el.innerHTML = L.map(p => `<div class="flex items-center gap-2 py-1.5 border-t first:border-t-0"><div class="flex-1 min-w-0"><div class="text-sm font-medium truncate">${esc(p.name)}</div><div class="text-xs text-slate-500">${p.alt?p.alt+" m · ":""}${esc(p.area||"—")}</div></div>${chipEs(p)}<button data-de="${p.id}" class="text-xs text-emerald-700 px-2 py-1">Editar</button><button data-dp="${p.id}" class="text-xs text-red-600 px-2 py-1">Eliminar</button></div>`).join("") || `<p class="text-sm text-slate-500 py-2">Sin resultados.</p>`;

  const dl = $("#cat_del");
  if (dl) {
    const Dl = SEED.filter(x => S.eov[x.id] && S.eov[x.id].del);
    dl.innerHTML = Dl.length ? `<div class="bg-white rounded-2xl p-3 shadow-sm space-y-1"><h3 class="text-sm font-bold">🗑️ Esenciales eliminadas (${Dl.length})</h3>${Dl.map(x=>`<div class="flex items-center gap-2 py-1"><span class="flex-1 min-w-0 text-sm truncate">${esc(S.eov[x.id].name||x.name)}</span><button data-rs="${x.id}" class="text-xs text-emerald-700 px-2 py-1">Restaurar</button></div>`).join("")}</div>` : "";
  }
}

function confirmPeakChange({ ess, title, body, okText, onOk }) {
  const el = document.createElement("div");
  el.className = "fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4";

  const warn = ess
    ? `<div class="rounded-xl bg-red-50 text-red-700 p-3 text-sm font-semibold">⚠️ Cima ESENCIAL: forma parte del reto de los 100. Este cambio afecta al progreso y a las estadísticas de todos los usuarios.</div>`
    : `<div class="rounded-xl bg-slate-100 text-slate-600 p-3 text-xs">⛰️ Cima no esencial: no cuenta para el reto de los 100.</div>`;

  el.innerHTML = `<div role="alertdialog" class="bg-white w-full max-w-sm rounded-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto ${ess?"border-2 border-red-500":""}"><h3 class="font-bold text-lg">${ess?"⚠️ ":""}${esc(title)}</h3>${warn}<div class="space-y-1 text-sm">${body}</div>${ess?`<label class="flex items-start gap-2 text-sm"><input id="cf_k" type="checkbox" class="mt-1"><span>Entiendo que este cambio afecta a todos los usuarios.</span></label>`:""}<p id="cf_e" class="text-xs text-red-600"></p><div class="flex gap-2"><button id="cf_n" class="flex-1 bg-slate-100 rounded-xl py-2.5 text-sm font-medium">Cancelar</button><button id="cf_y" ${ess?"disabled":""} class="flex-1 ${ess?"bg-red-600":"bg-emerald-600"} text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40">${esc(okText)}</button></div></div>`;

  document.body.appendChild(el);

  const onKey = e => {
      if (e.key === "Escape") close();
    },
    close = () => {
      removeEventListener("keydown", onKey);
      el.remove();
    };
  addEventListener("keydown", onKey);

  const y = el.querySelector("#cf_y"),
    k = el.querySelector("#cf_k");

  if (k) k.onchange = () => {
    y.disabled = !k.checked;
  };

  el.querySelector("#cf_n").onclick = close;

  y.onclick = async () => {
    y.disabled = true;
    el.querySelector("#cf_e").textContent = "";
    try {
      await onOk();
      close();
    } catch (e) {
      el.querySelector("#cf_e").textContent = errMsg(e);
      y.disabled = ess && !(k && k.checked);
    }
  };
}

function openEditPeak(p) {
  if (!S.session || S.session.role !== "admin") return;

  const el = document.createElement("div");
  el.id = "modal";
  el.className = "fixed inset-0 z-[65] bg-black/55 flex items-end justify-center";

  el.innerHTML = `<div class="sheet bg-white w-full max-w-md rounded-t-3xl p-5 space-y-3 max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between"><h3 class="font-bold text-lg">✏️ Editar cima ${isEss(p)?"esencial":"no esencial"}</h3><button id="ep_x" class="text-2xl leading-none">×</button></div><input id="ep_n" value="${esc(p.name)}" placeholder="Nombre" class="w-full border rounded-lg px-3 py-2"><div class="grid grid-cols-2 gap-2"><input id="ep_h" type="number" min="1" value="${Number(p.alt)||0}" placeholder="Altitud (m)" class="border rounded-lg px-3 py-2"><input id="ep_c" list="comarcas-list" value="${esc(p.area||"")}" placeholder="Comarca" class="border rounded-lg px-3 py-2"></div>${listaComarcas()}<p id="ep_e" class="text-xs text-red-600"></p><button id="ep_save" class="w-full bg-emerald-600 text-white rounded-xl py-2.5 font-semibold">Guardar cambios</button></div>`;

  document.body.appendChild(el);

  const close = () => el.remove();
  el.onclick = e => {
    if (e.target === el) close();
  };
  $("#ep_x").onclick = close;

  $("#ep_save").onclick = async () => {
    const name = $("#ep_n").value.trim(),
      raw = $("#ep_h").value,
      alt = parseAlt(raw),
      area = comarcaValida($("#ep_c").value),
      err = $("#ep_e");

    if (!name) {
      err.textContent = "Escribe el nombre de la cima.";
      return;
    }
    if (raw === "" || !Number.isFinite(alt) || alt <= 0) {
      err.textContent = "Indica una altitud válida en metros.";
      return;
    }
    if (!area) {
      err.textContent = "Selecciona o escribe una comarca válida de la lista.";
      return;
    }
    if (S.peaks.some(x => x.id !== p.id && lk(x.name) === lk(name))) {
      err.textContent = "Ya existe una cima con ese nombre.";
      return;
    }

    err.textContent = "";

    const ch = [];
    if (name !== p.name) ch.push(["Nombre", p.name, name]);
    if (alt !== (Number(p.alt) || 0)) ch.push(["Altitud", (p.alt || 0) + " m", alt + " m"]);
    if (area !== (p.area || "")) ch.push(["Comarca", p.area || "—", area]);

    if (!ch.length) {
      close();
      return;
    }

    confirmPeakChange({
      ess: isEss(p),
      title: "Guardar cambios en " + p.name,
      okText: "Guardar cambios",
      body: ch.map(c => `<div class="text-xs"><span class="text-slate-500">${c[0]}:</span> <s>${esc(c[1])}</s> → <b>${esc(c[2])}</b></div>`).join("") + `<p class="text-xs text-slate-500 pt-1">${isEss(p)?"Se cambiará para todos los usuarios, también para quienes ya la hayan hecho.":"Se cambiará para todos los usuarios."}</p>`,
      onOk: async () => {
        await ST.updatePeak({ id: p.id, name, alt, area });
        close();
        render();
      }
    });
  };
}

function paintUsers() {
  const el = $("#ut");
  if (!el) return;

  const L = [...USERS].sort((a, b) => (b.count || 0) - (a.count || 0) || a.username.localeCompare(b.username));

  el.innerHTML = `<table class="w-full text-sm"><thead class="bg-slate-50 text-left text-xs text-slate-500"><tr><th class="p-2">Nombre</th><th class="p-2">Alta</th><th class="p-2">Amigos</th><th class="p-2">Cims</th></tr></thead>
  <tbody>${L.map(u=>`<tr data-u="${esc(u.username)}" class="border-t cursor-pointer"><td class="p-2 font-medium">${esc(u.username)}</td><td class="p-2 whitespace-nowrap">${esc(u.date||"")}</td><td class="p-2">${nFr(u.username)}</td><td class="p-2 font-bold text-emerald-700">${u.count||0} ›</td></tr>`).join("")}</tbody></table>${L.length?"":`${empty("Aún no hay usuarios registrados.","f")}`}`;

  el.querySelectorAll("[data-u]").forEach(r => r.onclick = () => openUser(r.dataset.u));
}

function adminInfo(name, u) {
  const k = lk(name),
    F = S.reqs.filter(r => r.accepted && (r.fromK === k || r.toK === k)).map(r => r.fromK === k ? r.to : r.from),
    P = S.reqs.filter(r => !r.accepted && (r.fromK === k || r.toK === k)).map(r => r.fromK === k ? "→ " + r.to : "← " + r.from),
    C = u.companions || (S.data[name] || {}).companions || [],
    row = (t, v) => `<div><span class="text-slate-500">${t}:</span> ${v}</div>`;

  return `<div class="bg-slate-100 rounded-xl p-3 text-sm space-y-1">${row("Usuario",esc(name))}${row("Alta",esc(u.date||"—"))}${row("Último registro",esc(u.last||"—"))}${row("Amigos ("+F.length+")",F.length?F.map(x=>esc(x)).join(", "):"—")}${row("Solicitudes pendientes",P.length?P.map(x=>esc(x)).join(", "):"—")}${row("Acompañantes guardados",C.length?C.map(x=>esc(x)).join(", "):"—")}${row("Contraseña","🔒 cifrada, no se puede ver. Usa «Restablecer» más abajo")}</div>`;
}

async function openUser(name, fr) {
  const el = document.createElement("div");
  el.id = "modal";
  el.className = "fixed inset-0 z-50 bg-black/50 flex items-end justify-center";

  el.innerHTML = `<div class="sheet bg-white w-full max-w-md rounded-t-3xl p-5 space-y-3 max-h-[90vh] overflow-y-auto"><div class="flex justify-between items-start"><h3 class="font-bold text-lg">👤 ${esc(name)}</h3><button id="x" class="text-2xl leading-none">×</button></div><div id="ub" class="text-sm text-slate-500">Cargando…</div></div>`;

  document.body.appendChild(el);

  const close = () => el.remove();
  el.onclick = e => {
    if (e.target === el) close();
  };
  $("#x").onclick = close;

  let done;
  try {
    done = await ST.userRecs(name);
  } catch (e) {
    $("#ub").textContent = errMsg(e);
    return;
  }

  const u = USERS.find(v => v.username === name) || {},
    ids = Object.keys(done),
    n = ids.filter(i => S.peaks.some(p => p.id == i && isEss(p))).length;

  const rows = ids
    .map(i => ({ i, p: S.peaks.find(x => x.id == i), d: done[i] }))
    .sort((a, b) => (b.d.date || "").localeCompare(a.d.date || ""));

  $("#ub").className = "space-y-3";

  $("#ub").innerHTML = `<div class="text-xs text-slate-500">${esc(u.email||"")}${u.date?" · alta "+esc(u.date):""}</div>${fr?"":adminInfo(name,u)}
    <div class="grid grid-cols-2 gap-2 text-center"><div class="bg-slate-100 rounded-xl p-2"><div class="text-2xl font-bold text-emerald-700">${n}</div><div class="text-xs text-slate-500">cimas</div></div><div class="bg-slate-100 rounded-xl p-2"><div class="text-2xl font-bold text-emerald-700">${Math.min(100,n)}%</div><div class="text-xs text-slate-500">del reto</div></div></div>
    <div class="h-2 bg-slate-200 rounded-full overflow-hidden"><div class="h-full bg-emerald-600" style="width:${Math.min(n,100)}%"></div></div>
    <div class="space-y-2">${rows.map(r=>`<div ${fr&&r.p?`role="button" tabindex="0" data-friend-peak="${r.i}" class="cursor-pointer hover:brightness-105 active:scale-[.99] transition bg-slate-100 rounded-xl p-2 flex gap-2 items-center"`:`class="bg-slate-100 rounded-xl p-2 flex gap-2 items-center"`}>${isImg(r.d.photo)?`<img src="${r.d.photo}" class="w-14 h-14 rounded-lg object-cover">`:""}<div class="min-w-0 flex-1"><div class="font-medium text-sm truncate flex items-center flex-wrap gap-1">${esc(r.p?r.p.name:"Cima #"+r.i)}${r.p&&r.p.alt?" · "+r.p.alt+" m":""} ${r.p?chipEs(r.p):""}</div><div class="text-xs text-slate-500">${esc(r.d.date||"")} · ${r.d.comp&&r.d.comp.length?esc(r.d.comp.join(", ")):"en solitario"}</div>${r.d.notes?`<div class="text-xs text-slate-500 italic">${esc(r.d.notes)}</div>`:""}${fr?"":`<div class="flex gap-3 mt-1">${r.d.photo?`<button data-rph="${r.i}" class="text-xs text-slate-600 underline">Quitar foto</button>`:""}<button data-rdel="${r.i}" class="text-xs text-red-600 font-medium">🗑️ Borrar cima</button></div>`}</div>${fr&&r.p?`<span class="text-slate-500">›</span>`:""}</div>`).join("")||`<p class="text-center text-slate-500 py-2">Todavía no ha registrado ninguna cima.</p>`}</div>
    ${fr?"":'<div class="flex gap-2"><input id="np" placeholder="Nueva contraseña (mín. 6)" autocomplete="off" class="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm"><button id="rp" class="px-3 rounded-lg bg-slate-800 text-white text-sm">Restablecer</button></div><button id="du" class="w-full rounded-xl bg-red-50 text-red-600 py-2 text-sm">Eliminar usuario</button>'}`;

  if (fr) $('#ub').querySelectorAll('[data-friend-peak]').forEach(row => {
    const open = () => openPeak(+row.dataset.friendPeak, done[row.dataset.friendPeak], true);
    row.onclick = open;
    row.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    };
  });

  let armed = false;

  const reload = () => {
    close();
    openUser(name, fr);
    if (!CLOUD) {
      USERS = ST.localUsers();
    }
    paintUsers();
  };

  $("#ub").querySelectorAll("[data-rdel]").forEach(b => {
    let a = false;
    b.onclick = async () => {
      if (!a) {
        a = true;
        b.textContent = "¿Seguro? Pulsa otra vez";
        return;
      }
      try {
        await ST.delRec(name, b.dataset.rdel);
      } catch (e) {
        alert(errMsg(e));
        return;
      }
      reload();
    };
  });

  $("#ub").querySelectorAll("[data-rph]").forEach(b => b.onclick = async () => {
    try {
      await ST.setRecPhoto(name, b.dataset.rph);
    } catch (e) {
      alert(errMsg(e));
      return;
    }
    reload();
  });

  if ($("#rp")) $("#rp").onclick = async () => {
    const pw = $("#np").value;
    if (pw.length < 6) {
      alert("La contraseña necesita al menos 6 caracteres.");
      return;
    }
    try {
      await ST.setPassword(name, await hashNew(pw));
    } catch (e) {
      alert(errMsg(e));
      return;
    }
    $("#np").value = "";
    toast("Contraseña restablecida. Díasela al usuario.", "ok");
  };

  if ($("#du")) $("#du").onclick = async () => {
    if (!armed) {
      armed = true;
      $("#du").textContent = "¿Seguro? Pulsa otra vez para borrar usuario y progreso";
      return;
    }
    try {
      await ST.delUser(name);
    } catch (e) {
      alert(errMsg(e));
      return;
    }
    close();
    if (!CLOUD) {
      USERS = ST.localUsers();
    }
    paintUsers();
  };
}

function initAdmin() {
  {
    const cq = $("#cat_q");
    if (cq) {
      cq.value = S.cq || "";
      cq.oninput = e => {
        S.cq = e.target.value;
        paintCatalog();
      };
    }

    document.querySelectorAll("[data-cf]").forEach(b => b.onclick = () => {
      S.cf = b.dataset.cf;
      document.querySelectorAll("[data-cf]").forEach(x => x.className = cfCls(x.dataset.cf));
      paintCatalog();
    });

    paintCatalog();
    paintPK();
  }

  if (!unsubR) unsubR = ST.watchReqs(l => {
    S.reqs = l;
    if (S.tab === "admin") paintUsers();
  });

  if (!CLOUD) {
    USERS = ST.localUsers();
    paintUsers();
  } else if (!unsubU) {
    unsubU = ST.watchUsers(l => {
      USERS = l;
      paintUsers();
    });
  } else {
    paintUsers();
  }

  $("#a_b").onclick = async () => {
    const name = $("#a_n").value.trim(),
      rawAlt = $("#a_h").value,
      alt = parseAlt(rawAlt),
      area = comarcaValida($("#a_c").value);

    if (!name) {
      $("#a_e").textContent = "Escribe el nombre de la cima.";
      return;
    }
    if (!area) {
      $("#a_e").textContent = "Selecciona o escribe una comarca válida de la lista.";
      return;
    }
    if (rawAlt === "" || !Number.isFinite(alt) || alt <= 0) {
      $("#a_e").textContent = "Indica una altitud válida en metros.";
      return;
    }
    if (S.peaks.some(p => lk(p.name) === lk(name))) {
      $("#a_e").textContent = "Esa cima ya está en el catálogo.";
      return;
    }

    $("#a_e").textContent = "";

    const ess = $("#a_t").value === "e";

    confirmPeakChange({
      ess,
      title: "Añadir cima " + (ess ? "esencial" : "no esencial"),
      okText: "Añadir cima",
      body: `<div><b>${esc(name)}</b></div><div class="text-xs text-slate-500">${alt} m · ${esc(area)}</div><p class="text-xs text-slate-500 pt-1">${ess?"Pasará a contar para el reto de los 100 de todos los usuarios.":"Se añadirá al catálogo de todos los usuarios."}</p>`,
      onOk: async () => {
        await ST.addPeak({ id: nextId(), name, alt, area, ...(ess ? { ess: true } : {}) });
        render();
      }
    });
  };
}