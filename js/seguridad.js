/* ===== Contraseñas: PBKDF2 con sal (migra hashes antiguos al entrar) ===== */

const b64 = b => btoa(String.fromCharCode(...new Uint8Array(b)));


const pbk = async (t, salt) => {
  const k = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(t),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  return crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: 210000
    },
    k,
    256
  );
};


const hashNew = async t => {
  try {
    const s = crypto.getRandomValues(new Uint8Array(16));

    return "pbkdf2$" + b64(s) + "$" + b64(await pbk(t, s));
  } catch (e) {
    throw { code: "nocrypto" };
  }
};


const verifyPw = async (t, h) => {
  if (h && h.startsWith("pbkdf2$")) {
    const p = h.split("$"),
          salt = Uint8Array.from(atob(p[1]), c => c.charCodeAt(0));

    return b64(await pbk(t, salt)) === p[2];
  }

  return h === await hash(t);
};