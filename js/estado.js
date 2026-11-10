const KEY = "cims-v5";


const fixAlt = a => {
  a = Number(a) || 0;

  return a > 0 && a < 20 ? Math.round(a * 1000) : a;
},
parseAlt = raw => {
  let r = String(raw).trim().replace(/\s/g, "");

  if (/^\d{1,2}\.\d{3}$/.test(r)) r = r.replace(".", "");

  return Number(r.replace(",", "."));
};


const SEED = CAT.split("|").map(t => {
  const [name, area, alt, id] = t.split("~");

  return { id: +id, name, alt: +alt, area };
});


const BADGES = [
  [1, "🥾", "Primera cima"],
  [10, "⛰️", "10 cims"],
  [25, "🏔️", "25 cims"],
  [50, "🦅", "50 cims"],
  [100, "🏆", "100 cims"]
];


let S = {
  tab: "home",
  pk: [],
  extra: [],
  eov: {},
  peaks: SEED,
  users: [],
  data: {},
  session: null,
  authMode: "login",
  done: {},
  companions: [],
  reqs: [],
  shares: [],
  wish: [],
  q: "",
  f: "all",
  sel: null,
  c: ""
};


const ESS = new Set(SEED.map(p => p.id)),

      isEss = p => ESS.has(p.id) || p.ess === true,

      SEEDN = SEED.length,

      nextId = () => Math.max(
        0,
        ...SEED.map(p => p.id),
        ...S.extra.map(p => p.id),
        ...Object.keys(S.eov).map(Number)
      ) + 1,

      rebuild = () => {
        S.extra.forEach(p => {
          p.area = String(p.area || "—").replace(/'/g, "’");
        });

        S.peaks = SEED
          .filter(p => !(S.eov[p.id] && S.eov[p.id].del))
          .map(p => {
            const o = S.eov[p.id];

            return o
              ? {
                  ...p,
                  name: o.name,
                  alt: o.alt,
                  area: String(o.area || p.area).replace(/'/g, "’")
                }
              : p;
          })
          .concat(S.extra);
      };


try {
  const r = localStorage.getItem(KEY);

  if (r) {
    const j = JSON.parse(r);

    S.users = j.users || [];
    S.data = j.data || {};

    S.extra = (j.peaks || [])
      .filter(p => p.id > 113 && !SEED.some(s => s.id === p.id))
      .map(p => ({
        id: p.id,
        name: p.name,
        alt: fixAlt(p.alt),
        area: p.area || "—",
        ...(p.ess === true ? { ess: true } : {})
      }));

    S.reqs = j.reqs || [];
    S.shares = j.shares || [];
    S.pk = j.pk || [];
    S.eov = j.eov && typeof j.eov === "object" ? j.eov : {};
  }
} catch (e) {}


rebuild();


const SKEY = "cims-session";

const ADMIN_HASH = "pbkdf2$8hHsL0fzdQGLnfmyXDQEYg==$b3w9xOgDmt4ISn6qw+FCg3no6pvetKamqA4AoEC8K/A=";


const saveLocal = () => {
  try {
    if (S.session && S.session.role === "user") {
      S.data[S.session.username] = {
        done: S.done,
        companions: S.companions,
        wish: S.wish
      };
    }

    localStorage.setItem(KEY, JSON.stringify({
      peaks: S.extra,
      eov: S.eov,
      users: S.users,
      data: S.data,
      reqs: S.reqs,
      shares: S.shares,
      pk: S.pk
    }));

    return true;
  } catch (e) {
    return false;
  }
};