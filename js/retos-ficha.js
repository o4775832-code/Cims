/* ===== Retos y ficha de montaña ===== */

document.addEventListener("click", e => {
  const b = e.target.closest("[data-fi]");

  if (b && S.session) openPeak(+b.dataset.fi);
});


function retosView(n) {
  const D = S.peaks.filter(p => isEss(p) && S.done[p.id]),
        byM = {};

  D.forEach(p => {
    const k = (S.done[p.id].date || "").slice(0, 7);

    if (k) byM[k] = (byM[k] || 0) + 1;
  });

  const grp = Math.max(
    0,
    ...comarcas().map(c => {
      const T = S.peaks.filter(p =>
        isEss(p) && p.area.split(" / ").some(a => a.split(" (")[0] === c)
      );

      return T.length
        ? Math.round(T.filter(p => S.done[p.id]).length / T.length * 100)
        : 0;
    })
  );

  const R = [
    [
      "📅",
      "5 cimas en un mes",
      "Haz 5 cimas esenciales en el mismo mes",
      Math.max(0, ...Object.values(byM)),
      5,
      "Insignia Mes de oro"
    ],
    [
      "❄️",
      "Tres tresmils",
      "Corona 3 cimas de 3.000 m o más",
      S.peaks.filter(p => S.done[p.id] && p.alt >= 3000).length,
      3,
      "Insignia Tresmilero"
    ],
    [
      "🧭",
      "Explorador de comarcas",
      "Visita 10 comarcas distintas",
      new Set(D.flatMap(p => p.area.split(" / ").map(a => a.split(" (")[0]))).size,
      10,
      "Insignia Brújula"
    ],
    [
      "🤝",
      "10 cimas con amigos",
      "Registra 10 cimas acompañado de amigos",
      S.peaks.filter(p => S.done[p.id] && (S.done[p.id].comp || []).length).length,
      10,
      "Insignia Cordada"
    ],
    [
      "🧭",
      "Comarca completa",
      "Completa todas las cimas esenciales de una comarca (mejor avance en %)",
      grp,
      100,
      "Insignia Señor de la comarca"
    ]
  ];

  return `<h2 class="font-bold text-lg px-1">🎯 Retos</h2>${R.map(r=>{const ok=r[3]>=r[4],pc=Math.min(100,Math.round(r[3]/r[4]*100));return `<div class="bg-white rounded-2xl p-3 shadow-sm flex gap-3"><div class="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${ok?"":"grayscale opacity-60"}" style="background:var(--chip)">${r[0]}</div><div class="flex-1 min-w-0"><div class="flex justify-between gap-2"><div class="font-bold text-sm">${r[1]}</div><div class="text-xs font-bold text-emerald-700">${Math.min(r[3],r[4])}/${r[4]}</div></div><div class="text-xs text-slate-500">${r[2]}</div><div class="h-2 bg-slate-200 rounded-full overflow-hidden my-1.5"><div class="h-full bar" style="width:${pc}%"></div></div><div class="text-[11px] ${ok?"text-emerald-700 font-semibold":"text-slate-500"}">${ok?"🏆 Conseguido · ":"Recompensa: "}${r[5]}</div></div></div>`}).join("")}`;
}


function openPeak(id, recordOverride, readOnly = false) {
  const p = S.peaks.find(x => x.id === id);

  if (!p) return;

  const d = recordOverride === undefined ? S.done[id] : recordOverride,
        ph = ((d && d.photos && d.photos.length) ? d.photos : [d && d.photo]).filter(isImg),
        el = document.createElement("div");

  el.id = "modal";
  el.className = "fixed inset-0 z-50 bg-black/50 flex items-end justify-center";

  const tabs = {
    info: `<div class="grid grid-cols-2 gap-2 text-center">${[["Altitud",p.alt?p.alt+" m":"—"],["Comarca",esc(p.area)],["Estado",d?"✅ "+esc(d.date):"Pendiente"],["Tipo",isEss(p)?"Esencial":"No esencial"]].map(x=>`<div class="bg-slate-100 rounded-xl p-2"><div class="text-[11px] text-slate-500">${x[0]}</div><div class="text-sm font-bold">${x[1]}</div></div>`).join("")}</div>
   ${d&&d.notes?`<div class="bg-slate-100 rounded-xl p-3"><div class="text-[11px] text-slate-500 font-semibold mb-1">📝 Tus notas</div><div class="text-sm whitespace-pre-wrap">${esc(d.notes)}</div></div>`:""}
   ${d&&d.dates&&d.dates.length?`<div class="bg-slate-100 rounded-xl p-3"><div class="text-[11px] text-slate-500 font-semibold mb-1">🔁 Otras subidas</div><div class="text-sm">${d.dates.map(esc).join(", ")}</div></div>`:""}
   ${d&&d.comp&&d.comp.length?`<div class="bg-slate-100 rounded-xl p-3"><div class="text-[11px] text-slate-500 font-semibold mb-1">👥 Cordada</div><div class="text-sm">${d.comp.map(esc).join(", ")}</div></div>`:""}
   <div class="grid grid-cols-2 gap-2"><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name+" "+p.area)}" class="text-center rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">📍 Ver en mapa ↗</a><a target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(p.name+" ruta montaña")}" class="text-center rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">🥾 Buscar rutas ↗</a></div>
   <div class="grid grid-cols-2 gap-2"><button type="button" id="psh" class="text-center rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">📤 ${t("shr")}</button><a target="_blank" rel="noopener" href="https://www.meteo.cat/" class="text-center rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold">⛅ ${t("wx")} ↗</a></div>
   ${ph.length?`<div class="flex gap-2 overflow-x-auto">${ph.map(s=>`<img src="${s}" loading="lazy" decoding="async" class="h-40 rounded-xl cursor-zoom-in" data-lb="${ph.indexOf(s)}" alt="Foto de ${esc(p.name)}">`).join("")}</div>`:""}`,

    consejos: `<ul class="text-sm space-y-1.5 list-disc pl-5"><li><a href="tel:112" class="font-bold text-red-600 underline">${LANG==="ca"?"Emergències: 112":"Emergencias: 112"}</a> · ${LANG==="ca"?"indica la teva posició i la cim.":"indica tu posición y la cima."}</li><li>Consulta la <a href="https://www.meteo.cat/" target="_blank" rel="noopener" class="underline">previsión de Meteocat</a> y el estado de la ruta el mismo día.</li><li>Sal temprano y fija una hora de retorno.</li><li>Lleva agua, comida, abrigo, frontal y calzado de montaña.</li><li>Avisa a alguien de tu ruta y compañía.</li>${p.alt>=2800?"<li>A esta altitud puede haber nieve, hielo o tormentas aun en verano.</li>":""}</ul><p class="text-xs text-slate-500">Consejos generales, no específicos de esta cima.</p>`
  };

  el.innerHTML = `<div class="sheet bg-white w-full max-w-md rounded-t-3xl overflow-hidden max-h-[92vh] overflow-y-auto"><div class="pano text-white p-5 pt-8" style="${ph[0]?`background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.65)),url(${ph[0]}) center/cover;min-height:210px;display:flex;flex-direction:column;justify-content:flex-end`:""}"><div class="text-2xl font-extrabold">${esc(p.name)}</div><div class="text-sm opacity-90">${p.alt?p.alt+" m · ":""}${esc(p.area)}</div></div><div class="p-4 space-y-3"><div class="flex bg-slate-100 rounded-xl p-1 gap-1">${[["info","Información"],["consejos","Consejos"]].map((t,i)=>`<button data-pt="${t[0]}" class="flex-1 py-1.5 rounded-lg text-sm ${i?"":"seg-on bg-white shadow font-semibold"}">${t[1]}</button>`).join("")}</div><div id="pb" class="space-y-2">${tabs.info}</div><div class="flex gap-2">${readOnly?"":`<button id="pg" class="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 font-medium">${d?"Editar registro":"✓ Marcar como realizada"}</button>`}<button id="px" class="${readOnly?"w-full":"px-4"} rounded-xl bg-slate-100 py-2.5">Cerrar</button></div></div></div>`;

  document.body.appendChild(el);

  el.querySelectorAll("[data-pt]").forEach(b =>
    b.onclick = () => {
      el.querySelectorAll("[data-pt]").forEach(x =>
        x.className = "flex-1 py-1.5 rounded-lg text-sm"
      );

      b.className = "flex-1 py-1.5 rounded-lg text-sm seg-on bg-white shadow font-semibold";

      $("#pb").innerHTML = tabs[b.dataset.pt];
    }
  );

  $("#px").onclick = () => el.remove();

  el.onclick = ev => {
    if (ev.target === el) el.remove();
  };

  el.addEventListener("click", ev => {
    const lb = ev.target.closest("[data-lb]");

    if (lb) lightbox(ph, +lb.dataset.lb);
  });

  el.addEventListener("click", async ev => {
    if (!ev.target.closest("#psh")) return;

    const msg = p.name
      + (p.alt ? " (" + p.alt + " m)" : "")
      + (d ? " · " + d.date : "")
      + " — "
      + (LANG === "ca" ? "Repte 100 Cims" : "Reto 100 Cims");

    try {
      if (navigator.share) {
        await navigator.share({ title: p.name, text: msg });
      } else {
        await navigator.clipboard.writeText(msg);
        toast(t("copied"), "ok");
      }
    } catch (e) {}
  });

  const pg = $("#pg");

  if (pg) pg.onclick = () => {
    el.remove();
    openForm(id);
  };
}