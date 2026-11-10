# Reto 100 Cims

Web para registrar las cimas del reto **100 Cims de la FEEC**: marca cada cima con fecha, notas, fotos y acompañantes, compite con tus amigos y desbloquea logros.

## Estructura

```
reto-100-c# Reto 100 Cims

Web para registrar las cimas del reto **100 Cims de la FEEC**: marca cada cima con fecha, notas, fotos y acompañantes, compite con tus amigos y desbloquea logros.

## Estructura

```
reto-100-cims/
├── index.html                  # Página principal (carga los CSS y los JS en orden)
├── firestore.rules             # Reglas de seguridad de Firestore (se pegan en la consola de Firebase)
├── css/
│   ├── estilos.css             # Estilos base
│   └── tema.css                # Tema (colores claro/oscuro)
└── js/
    ├── catalogo.js             # Catálogo de cimas esenciales (datos)
    ├── estado.js               # Estado global, ajustes y guardado local
    ├── almacenamiento.js       # Capa de almacenamiento (nube / local), usuarios, registros
    ├── amigos.js               # Amistades, solicitudes, ranking y actividad
    ├── avatares-celebracion.js # Avatares, celebración al completar cima, pull-to-refresh
    ├── seguridad.js            # Contraseñas (PBKDF2)
    ├── perfil.js               # Iconos, nivel, panel de inicio, perfil, copia de seguridad
    ├── retos-ficha.js          # Retos y ficha de cada cima
    ├── vistas.js               # Render principal, insignias, comarcas, inicio
    ├── registro.js             # Listado de cimas y formulario de registro
    ├── admin.js                # Panel de administración (usuarios, catálogo, solicitudes)
    ├── firebase-config.js      # Configuración de Firebase (base de datos en la nube)
    └── arranque.js             # Arranque de la app y gestos
```

**Importante:** los `<script>` de `index.html` deben cargarse en ese orden, porque comparten variables globales. `arranque.js` va el último y llama a `boot()`.

## Ejecutar en local

Es una web estática, sin compilación. Abre `index.html` en el navegador o sirve la carpeta:

```bash
python3 -m http.server 8000
# y abre http://localhost:8000
```

## Publicar en GitHub Pages

1. Sube la carpeta a un repositorio de GitHub.
2. En *Settings → Pages*, elige la rama `main` y la carpeta `/ (root)`.
3. La web quedará en `https://TU_USUARIO.github.io/NOMBRE_DEL_REPO/`.

## Base de datos y autenticación (Firebase)

La app guarda los datos en **Firestore** (proyecto `reto-100-cims`) y los usuarios inician sesión con **Firebase Authentication** (email/contraseña). El nombre de usuario se convierte internamente en un email (`<usuario>@usuarios.reto-100-cims.app`); no se envía ningún correo. Si Firebase no carga, la app funciona en modo local (datos solo en el navegador, sin administrador).

### Puesta en marcha (una sola vez)

1. **Authentication → Sign-in method**: activa *Correo electrónico/contraseña*.
2. **Crea la cuenta del administrador**: *Authentication → Users → Add user* con el email `admin_07@usuarios.reto-100-cims.app` y una contraseña nueva y fuerte (la antigua estuvo en el código público: considérala comprometida). Copia su **UID**.
3. **Firestore Database → Start collection** `admins` → ID del documento = ese UID, con cualquier campo (p. ej. `rol: "admin"`). Solo se puede crear desde la consola; las reglas impiden escribirlo desde la app.
4. **Firestore → Reglas**: pega `firestore.rules` y pulsa **Publicar**. Pruébalas antes en el *Rules Playground*.
5. **Authentication → Settings → Authorized domains**: deja solo `localhost` y tu dominio de GitHub Pages.

### Migración de cuentas antiguas

Las cuentas creadas antes tenían un hash PBKDF2 en Firestore. Al iniciar sesión por primera vez con la versión nueva, la app comprueba ese hash, crea la cuenta en Authentication con la misma contraseña y borra el hash. Cuando todos los usuarios activos hayan entrado una vez, quita de `firestore.rules` las líneas marcadas como TRANSITORIO.

Colecciones: `users`, `records`, `friendreqs`, `peakreqs`, `peaks`, `peaksov`, `admins`.

## Notas

- Usa Tailwind por CDN, Google Fonts y el SDK de Firebase por CDN, así que necesita conexión a internet.
- La sesión la mantiene Firebase Authentication (token firmado). Ya no se guarda el nombre de usuario en `localStorage` en modo nube.
- El administrador se identifica en las reglas por su UID (documento `admins/<uid>`), no por una contraseña en el código: solo él puede escribir `peaks` y `peaksov`, y borrar o modificar datos de otros usuarios.
- Limitaciones sin servidor propio: el administrador no puede restablecer contraseñas ni borrar cuentas de Authentication desde la app (hay que hacerlo en la consola de Firebase). Para eso haría falta una Cloud Function.
- Las claves de `FIREBASE_CONFIG` no son secretas; la protección está en las reglas y en Authentication.
ims/
├── index.html                  # Página principal (carga los CSS y los JS en orden)
├── firestore.rules             # Reglas de seguridad de Firestore (se pegan en la consola de Firebase)
├── css/
│   ├── estilos.css             # Estilos base
│   └── tema.css                # Tema (colores claro/oscuro)
└── js/
    ├── catalogo.js             # Catálogo de cimas esenciales (datos)
    ├── estado.js               # Estado global, ajustes y guardado local
    ├── almacenamiento.js       # Capa de almacenamiento (nube / local), usuarios, registros
    ├── amigos.js               # Amistades, solicitudes, ranking y actividad
    ├── avatares-celebracion.js # Avatares, celebración al completar cima, pull-to-refresh
    ├── seguridad.js            # Contraseñas (PBKDF2)
    ├── perfil.js               # Iconos, nivel, panel de inicio, perfil, copia de seguridad
    ├── retos-ficha.js          # Retos y ficha de cada cima
    ├── vistas.js               # Render principal, insignias, comarcas, inicio
    ├── registro.js             # Listado de cimas y formulario de registro
    ├── admin.js                # Panel de administración (usuarios, catálogo, solicitudes)
    ├── firebase-config.js      # Configuración de Firebase (base de datos en la nube)
    └── arranque.js             # Arranque de la app y gestos
```

**Importante:** los `<script>` de `index.html` deben cargarse en ese orden, porque comparten variables globales. `arranque.js` va el último y llama a `boot()`.

## Ejecutar en local

Es una web estática, sin compilación. Abre `index.html` en el navegador o sirve la carpeta:

```bash
python3 -m http.server 8000
# y abre http://localhost:8000
```

## Publicar en GitHub Pages

1. Sube la carpeta a un repositorio de GitHub.
2. En *Settings → Pages*, elige la rama `main` y la carpeta `/ (root)`.
3. La web quedará en `https://TU_USUARIO.github.io/NOMBRE_DEL_REPO/`.

## Base de datos (Firebase Firestore)

La app guarda los datos de los usuarios en **Firestore** (proyecto `reto-100-cims`), así que se ven desde cualquier dispositivo. Si Firebase no carga, usa el modo local (datos solo en el navegador).

Para que funcione hay que publicar las reglas: en la consola de Firebase ve a *Firestore Database → Reglas*, pega el contenido de `firestore.rules` y pulsa **Publicar**.

Colecciones que crea la app: `users`, `records`, `friendreqs`, `peakreqs`, `peaks`, `peaksov`.

## Notas

- Usa Tailwind por CDN, Google Fonts y el SDK de Firebase por CDN, así que necesita conexión a internet.
- Los usuarios y contraseñas los gestiona la propia app (las contraseñas se guardan como hash PBKDF2), no Firebase Authentication. Las reglas de Firestore no pueden distinguir entre usuarios, así que cualquiera con conocimientos técnicos podría leer o modificar los datos. Para una seguridad real habría que migrar el inicio de sesión a Firebase Authentication.
- La contraseña del admin se comprueba en el navegador (guardada como hash) y no es una seguridad real frente a alguien con acceso al código.
