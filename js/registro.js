function renderList() {
  const q = nz(S.q);

  const L = S.peaks.filter(p =>
    nz(p.name + " " + p.area).includes(q)
    && (!S.t || (S.t === "e") === isEss(p))
    && (!S.c || p.area.split(" / ").some(a => a.split(" (")[0] === S.c))
    && (S.f === "all" || (S.f === "wish" ? S.wish.includes(p.id) : (S.f === "done") === !!S.done[p.id]))
  );

  const dir = S.od ? -1 : 1;

  if (S.o === "az") {
    L.sort((a, b) => dir * a.name.localeCompare(b.name, "ca"));
  } else if (S.o === "alt") {
    L.sort((a, b) => dir * ((b.alt || 0) - (a.alt || 0)) || a.name.localeCompare(b.name, "ca"));
  } else if (S.o === "date") {
    L.sort((a, b) => {
      const x = S.done[a.id],
            y = S.done[b.id];

      return x && y
        ? dir * (y.date || "").localeCompare(x.date || "") || a.name.localeCompare(b.name, "ca")
        : x ? -1 : y ? 1 : 0;
    });
  }

  const _k = [S.q, S.f, S.t, S.o, S.c, S.od].join("|");

  if (_k !== S._k) {
    S._k = _k;
    S.lim = 40;
  }

  S.lim = S.lim || 40;

  const _tot = L.length;

  L.length = Math.min(L.length, S.lim);

  $("#list").innerHTML = L.length
    ? L.map(p => {
        const d = S.done[p.id];

        return `<div class="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3 ${d?"is-done":""}">
    <div class="w-1.5 self-stretch rounded-full ${d?"bg-green-500":S.wish.includes(p.id)?"bg-amber-400":"bg-slate-300"}"></div>${d&&isImg(d.photo)?`<img src="${d.photo}" loading="lazy" decoding="async" alt="Foto de ${esc(p.name)}" class="w-14 h-14 rounded-xl object-cover">`:`<div class="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style="background:var(--chip)" aria-hidden="true">⛰️</div>`}
    <div class="flex-1 min-w-0"><button data-fi="${p.id}" class="font-medium truncate text-left max-w-full block">${esc(p.name)}</button>
    ${p.alt?`<div class="altbar my-1" aria-hidden="true"><i style="width:${Math.round(p.alt/3143*100)}%"></i></div>`:""}<div class="text-xs text-slate-500">${chipEs(p)}${p.alt?`<span class="alt text-sm">${p.alt} m</span> · `:""}${esc(p.area)}${d?` · ${esc(fmtD(d.date))} · ${d.comp.length?esc(d.comp.join(", ")):"en solitario"}`:""}</div></div>
    ${d?"":`<button data-w="${p.id}" class="text-xl px-1 ${S.wish.includes(p.id)?"":"grayscale opacity-40"}" aria-label="Deseada">⭐</button>`}<button data-reg="${p.id}" aria-label="${d?"Editar":"Hecha"}" class="${d?"reg-d":""}">${d?"✎":"✓"}</button></div>`;
      }).join("")
      + (_tot > S.lim
          ? `<button type="button" data-more="1" class="col-span-full w-full rounded-xl bg-white border py-2.5 text-sm font-semibold">${t("more")} (${_tot-S.lim})</button>`
          : "")
    : `${empty(t("noRes"),"m")}`;

  document.querySelectorAll("[data-reg]").forEach(b =>
    b.onclick = () => openForm(+b.dataset.reg)
  );
}


function openForm(id) {
  const p = S.peaks.find(x => x.id === id),
        d = S.done[id];

  form = {
    id,
    comp: d ? [...d.comp] : [],
    photos: d
      ? (d.photos && d.photos.length ? [...d.photos] : (d.photo ? [d.photo] : []))
      : [],
    dates: d && d.dates ? [...d.dates] : []
  };

  form.photos = form.photos.filter(isImg);

  const el = document.createElement("div");

  el.id = "modal";
  el.className = "fixed inset-0 z-50 bg-black/50 flex items-end justify-center";

  el.innerHTML = `<div class="sheet bg-white w-full max-w-md rounded-t-3xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
    <div class="flex justify-between items-start"><div><h3 class="font-bold text-lg">${esc(p.name)}</h3><p class="text-xs text-slate-500">${chipEs(p)}${p.alt?p.alt+" m · ":""}${esc(p.area)}</p></div><button id="x" class="text-2xl leading-none">×</button></div>
    <label class="block text-sm">Fecha<input id="date" type="date" max="${today()}" value="${d?d.date:today()}" class="mt-1 w-full border rounded-lg px-3 py-2"></label>
    <label class="block text-sm">Notas<textarea id="notes" rows="2" maxlength="500" class="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Condiciones, sensaciones…">${d?esc(d.notes):""}</textarea></label>
    <div class="text-sm">Acompañantes</div>
    <div id="comp"></div>
    <div class="text-sm">Fotos (máx. 4)<div id="ph" class="mt-1 flex gap-2 flex-wrap"></div><label id="fl" class="inline-block mt-1 px-3 py-2 rounded-lg bg-slate-100 cursor-pointer">📷 Añadir foto<input id="file" type="file" accept="image/*" class="hidden"></label></div><div class="text-sm">Otras subidas (si repites la cima)<div id="dts" class="flex flex-wrap gap-1 my-1"></div><div class="flex gap-2"><input id="dn" type="date" max="${today()}" class="flex-1 border rounded-lg px-3 py-2 text-sm"><button type="button" id="da" class="px-3 rounded-lg bg-slate-800 text-white text-sm">Añadir</button></div></div>
    <div class="flex gap-2"><button id="save" class="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 font-medium">Guardar cima</button>
    ${d?`<button id="del" class="px-4 rounded-xl bg-red-50 text-red-600">Quitar</button>`:""}</div></div>`;

  document.body.appendChild(el);

  const close = () => el.remove();

  el.onclick = e => {
    if (e.target === el) close();
  };

  $("#x").onclick = close;

  el.onpointerdown = e => {
    el._d = e.target === el;
  };

  el.onclick = e => {
    if (e.target === el && el._d) close();
  };


  const paint = () => {
    const avail = friends().filter(x => !form.comp.includes(x));
    const c = $("#comp");

    c.innerHTML = `<div class="flex flex-wrap gap-1 mb-2">${form.comp.map((x,i)=>`<span class="bg-emerald-100 text-emerald-800 rounded-full px-2 py-0.5 text-sm">${esc(x)} <button data-rm="${i}">×</button></span>`).join("")||`<span class="text-xs text-slate-400">Solo (sin acompañantes)</span>`}</div>
      <select id="pick" class="w-full border rounded-lg px-2 py-2 mb-2 text-sm"><option value="">Nadie</option>${avail.map(x=>`<option>${esc(x)}</option>`).join("")}</select>
      <div class="flex gap-2"><input id="nn" placeholder="Otro nombre (no hace falta que sea amigo)" class="flex-1 border rounded-lg px-3 py-2 text-sm"><button type="button" id="add" class="px-3 rounded-lg bg-slate-800 text-white text-sm">Añadir</button></div>`;

    $("#pick").onchange = e => {
      if (e.target.value) {
        form.comp.push(e.target.value);
        paint();
      }
    };

    const add = () => {
            try {
              addRaw();
            } catch (e) {
              console.error(e);
            }
          },
          addRaw = () => {
            const v = $("#nn").value.trim();

            if (!v) return;

            const ex = friends().find(x => lk(x) === lk(v));
            const nm = ex || v;

            if (!form.comp.some(x => lk(x) === lk(nm))) form.comp.push(nm);

            paint();
          };

    let lastAdd = 0;

    const go = e => {
            if (e) e.preventDefault();

            const t = Date.now();

            if (t - lastAdd < 500) return;

            lastAdd = t;
            add();
          },
          ab = $("#add");

    ab.addEventListener("touchstart", e => e.preventDefault(), { passive: false });
    ab.addEventListener("touchend", go, { passive: false });
    ab.addEventListener("mousedown", e => e.preventDefault());
    ab.addEventListener("click", go);

    $("#nn").onkeydown = e => {
      if (e.key === "Enter") {
        e.preventDefault();
        go();
      }
    };

    c.querySelectorAll("[data-rm]").forEach(b =>
      b.onclick = () => {
        form.comp.splice(+b.dataset.rm, 1);
        paint();
      }
    );
  };

  paint();


  const ph = () => {
    $("#ph").innerHTML = form.photos.map((x,i)=>`<div class="relative"><img src="${x}" alt="Foto ${i+1}" class="w-24 h-24 object-cover rounded-xl"><button type="button" data-px="${i}" aria-label="Quitar foto" class="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-600 text-white text-sm">×</button></div>`).join("");

    $("#fl").style.display = form.photos.length >= 4 ? "none" : "";

    $("#ph").querySelectorAll("[data-px]").forEach(b =>
      b.onclick = () => {
        form.photos.splice(+b.dataset.px, 1);
        ph();
      }
    );
  };

  ph();


  const pd = () => {
    $("#dts").innerHTML = form.dates.map((x,i)=>`<span class="bg-emerald-100 text-emerald-800 rounded-full px-2 py-0.5 text-sm">${esc(x)} <button type="button" data-dx="${i}" aria-label="Quitar fecha">×</button></span>`).join("");

    $("#dts").querySelectorAll("[data-dx]").forEach(b =>
      b.onclick = () => {
        form.dates.splice(+b.dataset.dx, 1);
        pd();
      }
    );
  };

  pd();


  $("#da").onclick = () => {
    const v = $("#dn").value;

    if (!v || v > today()) return toast("Elige una fecha válida.", true);

    if (!form.dates.includes(v)) {
      form.dates.push(v);
      form.dates.sort().reverse();
    }

    $("#dn").value = "";

    pd();
  };


  const onFile = e => {
    const f = e.target.files[0];

    if (!f) return;

    const r = new FileReader();

    r.onload = () => {
      const im = new Image();

      im.onload = () => {
        const k = Math.min(1, 640 / Math.max(im.width, im.height)),
              c = document.createElement("canvas");

        c.width = im.width * k;
        c.height = im.height * k;
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);

        if (form.photos.length < 4) form.photos.push(c.toDataURL("image/jpeg", .6));

        e.target.value = "";

        ph();
      };

      im.src = r.result;
    };

    r.readAsDataURL(f);
  };

  $("#file").onchange = onFile;


  $("#save").onclick = async () => {
    {
      const dv = $("#date").value;

      if (!dv) {
        toast("Elige la fecha.", true);
        return;
      }

      if (dv > today()) {
        toast("La fecha no puede ser futura.", true);
        return;
      }
    }

    const pend = $("#nn") && $("#nn").value.trim();

    if (pend && !form.comp.some(x => lk(x) === lk(pend))) {
      form.comp.push(friends().find(x => lk(x) === lk(pend)) || pend);
    }

    const btn = $("#save"),
          prev = S.done[id],
          rec = {
            date: $("#date").value,
            notes: $("#notes").value,
            comp: form.comp,
            photo: form.photos[0] || "",
            photos: form.photos,
            dates: form.dates
          };

    if (JSON.stringify(rec).length > 700000) {
      toast(t("big"), true);
      return;
    }

    btn.disabled = true;
    btn.textContent = "Guardando…";
    S.done[id] = rec;

    try {
      await ST.saveRec(S.session.username, id, rec, Object.keys(S.done).length);
    } catch (e) {
      if (prev) S.done[id] = prev;
      else delete S.done[id];

      btn.disabled = false;
      btn.textContent = "Guardar cima";

      alert(errMsg(e));
      return;
    }

    if (!prev) {
      celebrate(p);
      S.q = "";

      if (isEss(p) && nDone() === 100) setTimeout(finale, 1500);
    }

    if (S.wish.includes(id)) {
      S.wish = S.wish.filter(x => x !== id);

      ST.saveWish(S.session.username, S.wish).catch(e => toast(errMsg(e), true));
    }

    {
      const fr = friends().filter(f =>
        rec.comp.some(c => lk(c) === lk(f))
        && !(prev && (prev.comp || []).some(c => lk(c) === lk(f)))
      );

      if (fr.length) {
        ST.sendShare(fr, id, rec, S.session.username)
          .then(r => {
            if (r && r.length) {
              toast("📨 Aviso enviado a " + r.join(", ") + ": les saldrá la cima cuando la confirmen", "ok");
            }
          })
          .catch(e => alert("Tu cima se guardó, pero no se pudo avisar a tus amigos: " + errMsg(e)));
      }
    }

    {
      const nf = rec.comp.filter(c => !friends().some(f => lk(f) === lk(c)));

      if (nf.length) {
        ST.allUsers()
          .then(l => {
            const us = nf.filter(c => lk(c) !== me() && l.some(u => lk(u.username) === lk(c)));

            if (us.length) {
              toast(
                "ℹ️ " + us.join(", ")
                + (us.length > 1 ? " usan la app pero aún no son amigos tuyos" : " usa la app pero aún no es amigo tuyo")
                + ": envía una solicitud desde Amigos para poder avisar"
                + (us.length > 1 ? "les" : "le")
                + " de la cima",
                "ok"
              );
            }
          })
          .catch(() => {});
      }
    }

    close();
    render();
  };


  if ($("#del")) $("#del").onclick = async () => {
    if (!$("#del").dataset.arm) {
      $("#del").dataset.arm = 1;
      $("#del").textContent = "¿Seguro?";
      return;
    }

    const prev = S.done[id];

    delete S.done[id];

    try {
      await ST.saveRec(S.session.username, id, null, Object.keys(S.done).length);
    } catch (e) {
      S.done[id] = prev;
      alert(errMsg(e));
      return;
    }

    close();
    render();
  };
}