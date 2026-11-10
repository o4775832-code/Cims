/* ===== Amigos ===== */
let unsubR=null,seenReq=null,seenSh=null,ALLU=[];
const pendSh=()=>S.shares.filter(s=>s.toK===me());
const me=()=>lk(S.session.username);
const nFr=n=>S.reqs.filter(r=>r.accepted&&(r.fromK===lk(n)||r.toK===lk(n))).length;
const relOf=n=>{const k=lk(n),m=me(),r=S.reqs.find(x=>(x.fromK===m&&x.toK===k)||(x.toK===m&&x.fromK===k));return !r?"none":r.accepted?"friend":r.fromK===m?"sent":"recv"};
const friends=()=>S.reqs.filter(r=>r.accepted&&(r.fromK===me()||r.toK===me())).map(r=>r.fromK===me()?r.to:r.from);
const incoming=()=>S.reqs.filter(r=>!r.accepted&&r.toK===me());
const reqBanner=()=>{const n=incoming().length+pendSh().length;return n?`<button data-go="friends" class="w-full bg-emerald-100 text-emerald-800 rounded-2xl p-3 text-left text-sm font-semibold">📬 Tienes ${n} aviso${n>1?"s":""} sin revisar ›</button>`:""};
function toast(m,err,go){const t=document.createElement("div");t.className="sheet fixed top-16 inset-x-3 max-w-md mx-auto z-[60] "+(err===true?"bg-red-600":"bg-emerald-700")+" text-white rounded-xl px-4 py-3 shadow-lg text-sm cursor-pointer";t.textContent=m;t.onclick=()=>{t.remove();if(!err){S.tab=go||(S.session&&S.session.role==="admin"?"admin":"friends");render()}};t.classList.add("toastx");t.setAttribute("role","status");t.setAttribute("aria-live","polite");t.style.top=(64+document.querySelectorAll(".toastx").length*72)+"px";document.body.appendChild(t);setTimeout(()=>t.remove(),err===true?Math.max(8000,String(m).length*90):4500)}
window.alert=m=>toast(String(m),true);
let unsubPK=null,seenPK=null,prevPK=null;
const pendPK=()=>S.pk.filter(r=>r.status==="pending");
function watchPK(){
  if(unsubPK){unsubPK();unsubPK=null}
  seenPK=null;prevPK=null;
  unsubPK=ST.watchPeakReqs(l=>{
    S.pk=l;if(!S.session)return;
    if(S.session.role==="admin"){
      const p=pendPK();
      if(seenPK===null){if(p.length)toast("🏔️ Tienes "+p.length+" solicitud"+(p.length>1?"es":"")+" de cima por revisar")}
      else{const nw=p.filter(r=>!seenPK.includes(r.id));if(nw.length)toast("🏔️ "+nw.map(r=>r.user+" solicita "+r.name).join(" · ")+": revísalo en Admin")}
      seenPK=p.map(r=>r.id);
      const b=$("#pkb");if(b){b.textContent=p.length;b.style.display=p.length?"":"none"}
      if(S.tab==="admin")paintPK();
    }else{
      const mine=S.pk.filter(r=>r.userK===me());
      if(prevPK!==null)mine.forEach(r=>{if(prevPK[r.id]==="pending"&&r.status!=="pending")toast(r.status==="ok"?"✅ Tu cima «"+r.name+"» ha sido aceptada":"❌ Tu solicitud de «"+r.name+"» no ha sido aceptada"+(r.note?": "+r.note:""),false,"ask")});
      prevPK={};mine.forEach(r=>prevPK[r.id]=r.status);
      if(S.tab==="ask")paintAsk();
    }})}
function watchReqs(){
  if(unsubR){unsubR();unsubR=null}
  seenReq=null;seenSh=null;
  unsubR=ST.watchReqs(l=>{
    S.reqs=l;const inc=incoming();
    if(seenReq===null){if(inc.length)toast("📬 Tienes "+inc.length+" solicitud"+(inc.length>1?"es":"")+" de amistad pendiente"+(inc.length>1?"s":""))}
    else{const nw=inc.filter(r=>!seenReq.includes(r.fromK));if(nw.length)toast("👋 "+nw.map(r=>r.from).join(", ")+" te ha enviado una solicitud de amistad")}
    seenReq=inc.map(r=>r.fromK);refreshFriends()});
  const u1=unsubR,u2=ST.watchShares(l=>{
    S.shares=l;const p=pendSh(),key=s=>s.fromK+"|"+s.peakId,nm=s=>(S.peaks.find(x=>x.id===s.peakId)||{}).name||"una cima";
    if(seenSh===null){if(p.length)toast("📨 Tienes "+p.length+" cima"+(p.length>1?"s":"")+" por confirmar")}
    else{const nw=p.filter(s=>!seenSh.includes(key(s)));if(nw.length)toast("📨 "+nw.map(s=>s.from+" te ha añadido como acompañante en "+nm(s)).join(" · ")+": confírmalo en Amigos")}
    seenSh=p.map(key);refreshFriends()});
  unsubR=()=>{u1();u2()}}
function refreshFriends(){
  if(!S.session||S.session.role!=="user")return;
  const n=incoming().length+pendSh().length,b=$("#nb");if(b){b.textContent=n;b.style.display=n?"":"none"}
  const rb=$("#rb");if(rb)rb.innerHTML=reqBanner();
  if(S.tab==="friends")paintFriends()}
function friendsView(){return `<div class="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3"><div class="text-3xl w-14 h-14 flex items-center justify-center rounded-full bg-slate-100 overflow-hidden">${avImg(S.av,"w-14 h-14")}</div><div class="flex-1 min-w-0"><div class="font-bold truncate">${esc(S.session.username)}</div><div class="text-xs text-slate-500">Tu avatar</div></div><button data-av="1" class="text-sm px-3 py-1.5 rounded-lg bg-slate-800 text-white">Cambiar</button></div><div id="fsh"></div><div id="freq"></div>${friendSeg()}<div id="p-fr" class="space-y-4"><div class="bg-white rounded-2xl p-3 shadow-sm space-y-2"><h2 class="font-bold">🔎 Buscar usuarios</h2><input id="fq" placeholder="Nombre de usuario…" autocomplete="off" class="w-full border rounded-lg px-3 py-2"><div id="fres" class="space-y-2"></div></div><div id="flist"></div></div><div id="p-rank" class="hidden space-y-2"></div><div id="p-feed" class="hidden space-y-2"></div>`}
const relBtn=(n,r)=>r==="friend"?`<span class="text-xs text-emerald-700 font-semibold">✓ Amigos</span>`:r==="sent"?`<button data-a="cancel" data-n="${esc(n)}" class="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700">⏳ Enviada</button>`:r==="recv"?`<button data-a="accept" data-n="${esc(n)}" class="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white">Aceptar</button>`:`<button data-a="send" data-n="${esc(n)}" class="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white">➕ Añadir</button>`;
function paintSearch(){
  const el=$("#fres");if(!el)return;const q=($("#fq").value||"").trim().toLowerCase();
  if(q.length<2){el.innerHTML=`<p class="text-xs text-slate-500">Escribe al menos 2 letras para buscar.</p>`;return}
  const L=ALLU.filter(u=>lk(u.username)!==me()&&lk(u.username).includes(q)).sort((a,b)=>a.username.localeCompare(b.username)).slice(0,15);
  el.innerHTML=L.map(u=>`<div class="flex items-center gap-2"><div class="flex-1 min-w-0"><div class="font-medium truncate">${avImg(u.avatar,"w-6 h-6")} ${esc(u.username)}</div></div>${relBtn(u.username,relOf(u.username))}</div>`).join("")||`<p class="text-sm text-slate-500">No se ha encontrado a nadie.</p>`}
function paintFriends(){
  paintSearch();
  const rq=$("#freq"),fl=$("#flist"),sh=$("#fsh");if(!rq||!fl||!sh)return;
  const P=pendSh();paneSwitch();
  sh.innerHTML=P.length?`<div class="bg-white rounded-2xl p-3 shadow-sm space-y-3"><h2 class="font-bold">🏔️ Cimas por confirmar <span class="text-red-600">(${P.length})</span></h2>${P.map(s=>{const pk=S.peaks.find(x=>x.id===s.peakId);return `<div class="space-y-1"><div class="text-sm"><b>${esc(s.from)}</b> te ha añadido como acompañante en <b>${esc(pk?pk.name:"una cima")}</b> (${esc(s.date)}). Si confirmas, también contará en tu lista.</div><div class="flex gap-2"><button data-sa="ok" data-sf="${esc(s.from)}" data-sp="${s.peakId}" class="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white">✅ Confirmar</button><button data-sa="no" data-sf="${esc(s.from)}" data-sp="${s.peakId}" class="text-sm px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700">Rechazar</button></div></div>`}).join("")}</div>`:"";
  const L=incoming();
  rq.innerHTML=L.length?`<div class="bg-white rounded-2xl p-3 shadow-sm space-y-2"><h2 class="font-bold">📬 Solicitudes recibidas <span class="text-red-600">(${L.length})</span></h2>${L.map(r=>`<div class="flex items-center gap-2"><div class="flex-1 min-w-0 font-medium truncate">${avImg(avOf(r.from),"w-6 h-6")} ${esc(r.from)}</div><button data-a="accept" data-n="${esc(r.from)}" class="text-sm px-3 py-1.5 rounded-lg bg-emerald-600 text-white">Aceptar</button><button data-a="decline" data-n="${esc(r.from)}" class="text-sm px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700">Rechazar</button></div>`).join("")}</div>`:"";
  const F=friends().sort((a,b)=>a.localeCompare(b));
  fl.innerHTML=`<div class="bg-white rounded-2xl p-3 shadow-sm space-y-2"><h2 class="font-bold">👥 Mis amigos (${F.length})</h2>${F.map(n=>`<div class="flex items-center gap-2"><button data-v="${esc(n)}" class="flex-1 min-w-0 text-left font-medium truncate">${avImg(avOf(n),"w-6 h-6")} ${esc(n)} ›</button><button data-a="unfriend" data-n="${esc(n)}" class="text-xs text-red-600 px-2 py-1">Eliminar</button></div>`).join("")||`${empty(t("noFr"),"f")}`}</div>`}
async function friendAct(b){
  const n=b.dataset.n,a=b.dataset.a;
  if(a==="unfriend"&&!b.dataset.arm){b.dataset.arm=1;b.textContent="¿Seguro?";return}
  b.disabled=true;
  try{
    if(a==="send"){if(relOf(n)==="none")await ST.sendReq(S.session.username,n)}
    else{const k=lk(n),m=me(),r=S.reqs.find(x=>(x.fromK===m&&x.toK===k)||(x.toK===m&&x.fromK===k));if(r)await ST.answerReq(r,a==="accept")}
  }catch(e){alert(errMsg(e));b.disabled=false;return}
  refreshFriends()}
async function shareAct(b){
  const s=S.shares.find(x=>x.toK===me()&&x.fromK===lk(b.dataset.sf)&&x.peakId===+b.dataset.sp);if(!s)return;
  b.disabled=true;
  try{await ST.answerShare(s,b.dataset.sa==="ok")}catch(e){alert(errMsg(e));b.disabled=false;return}
  if(b.dataset.sa==="ok")toast("✅ Cima añadida a tu lista","ok");
  refreshFriends()}
function initFriends(){
  $("#fq").oninput=paintSearch;paintFriends();
  if(CLOUD)ST.discover().then(l=>{S.shares=l;refreshFriends()}).catch(()=>{});
  ST.allUsers().then(l=>{ALLU=l;paintFriends()}).catch(e=>{$("#fres").textContent=errMsg(e)})}
document.addEventListener("click",e=>{
  const mo=e.target.closest("[data-more]");if(mo){S.lim+=40;renderList();return}
  const fo=e.target.closest("[data-fo]");if(fo){S.fo=!S.fo;render();return}
  const g=e.target.closest("[data-go]");if(g){S.tab=g.dataset.go;render();return}
  const b=e.target.closest("[data-a]");if(b){friendAct(b);return}
  const ty=e.target.closest("[data-t]");if(ty){S.t=ty.dataset.t;render();return}
  const dp=e.target.closest("[data-dp]");if(dp){const p=S.peaks.find(x=>x.id===+dp.dataset.dp);if(p){const ess=isEss(p);confirmPeakChange({ess,title:"Eliminar "+p.name,okText:"Eliminar cima",body:`<div><b>${esc(p.name)}</b></div><div class="text-xs text-slate-500">${p.alt?p.alt+" m · ":""}${esc(p.area||"—")}</div><p class="text-xs text-slate-500 pt-1">${ess?"Dejará de aparecer para todos y no contará en el reto de los 100. Los registros de los usuarios no se borran y podrás restaurarla desde «Esenciales eliminadas».":"Dejará de aparecer en el catálogo para todos los usuarios."}</p>`,onOk:async()=>{await ST.delPeak(p.id);render()}})}return}
  const rs=e.target.closest("[data-rs]");if(rs){const id=+rs.dataset.rs,o=S.eov[id];if(o)ST.ovSave(id,{name:o.name,alt:o.alt,area:o.area}).then(()=>render()).catch(e2=>alert(errMsg(e2)));return}
  const de=e.target.closest("[data-de]");if(de){const p=S.peaks.find(x=>x.id===+de.dataset.de);if(p)openEditPeak(p);return}
  const w=e.target.closest("[data-w]");if(w){toggleWish(+w.dataset.w);return}
  const ft=e.target.closest("[data-ft]");if(ft){S.ft=ft.dataset.ft;render();return}
  const av=e.target.closest("[data-av]");if(av){openAvatar();return}
  const sa=e.target.closest("[data-sa]");if(sa){shareAct(sa);return}
  const o=e.target.closest("[data-o]");if(o){const v=o.dataset.o;if(v&&v===(S.o||""))S.od=!S.od;else{S.o=v;S.od=false}render();return}
  const v=e.target.closest("[data-v]");if(v)openUser(v.dataset.v,true)});

