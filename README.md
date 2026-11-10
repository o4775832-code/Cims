# Reto 100 Cims

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

## Base de datos (Firebase Firestore)

La app guarda los datos de los usuarios en **Firestore** (proyecto `reto-100-cims`), así que se ven desde cualquier dispositivo. Si Firebase no carga, usa el modo local (datos solo en el navegador).

Para que funcione hay que publicar las reglas: en la consola de Firebase ve a *Firestore Database → Reglas*, pega el contenido de `firestore.rules` y pulsa **Publicar**.

Colecciones que crea la app: `users`, `records`, `friendreqs`, `peakreqs`, `peaks`, `peaksov`.

## Notas

- Usa Tailwind por CDN, Google Fonts y el SDK de Firebase por CDN, así que necesita conexión a internet.
- Los usuarios y contraseñas los gestiona la propia app (las contraseñas se guardan como hash PBKDF2), no Firebase Authentication. Las reglas de Firestore no pueden distinguir entre usuarios, así que cualquiera con conocimientos técnicos podría leer o modificar los datos. Para una seguridad real habría que migrar el inicio de sesión a Firebase Authentication.
- La contraseña del admin se comprueba en el navegador (guardada como hash) y no es una seguridad real frente a alguien con acceso al código.
