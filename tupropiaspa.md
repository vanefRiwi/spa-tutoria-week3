# Cómo hacer tu propia SPA desde cero

Este README es una guía de referencia para construir una Single Page Application simple con HTML, CSS y JavaScript vanilla, usando JSON Server como backend. El objetivo es aplicarlo a cualquier proyecto propio.

El ejemplo que se usa a lo largo de la guía es una app de tareas (todo list) con login, lista de tareas y cerrar sesión.

> Para ver cómo se aplicó un patrón similar en un proyecto más completo como SPA Coders: 
> ver aquí [README.md](./README.md).

---

## Dos enfoques para estructurar una SPA

Antes de empezar, hay que saber que existen dos formas de organizar el HTML:

**Enfoque A — HTML con las vistas declaradas** ← el que usa esta guía  
Todas las secciones existen en el HTML desde el inicio. JavaScript solo muestra u oculta las que ya están ahí. Es más directo para aprender y para proyectos pequeños.

```html
<section id="vista-login" class="vista activa"> ... </section>
<section id="vista-home"  class="vista oculto"> ... </section>
```

**Enfoque B — HTML casi vacío, JavaScript construye todo**  
El HTML tiene un solo contenedor vacío. JavaScript crea e inyecta el HTML de cada vista dinámicamente. Es la base de frameworks como React y Vue.

```html
<div id="app"></div> <!-- JavaScript llena este contenedor en tiempo de ejecución -->
```

> Esta guía usa el **enfoque A**. El enfoque B escala mejor en proyectos grandes
> y es lo que los frameworks modernos hacen por dentro.

---

## Lo que se va a construir

Una app de tareas con dos vistas y un servidor real:

- **Login** — el usuario escribe su nombre para entrar
- **Tareas** — muestra las tareas guardadas en el servidor y permite agregar nuevas

```
mi-spa/
├── db.json          ← base de datos de JSON Server
├── package.json     ← dependencias y scripts
└── public/
    ├── index.html
    ├── style.css
    └── js/
        ├── app.js      ← punto de entrada
        ├── router.js   ← navegación entre vistas
        ├── api.js      ← comunicación con el servidor
        └── views.js    ← lógica de cada vista
```

---

## Paso 0 — Configurar el servidor con JSON Server

### Instalación

```bash
npm init -y
npm install json-server axios
```

### `db.json` — la base de datos

```json
{
  "usuarios": [
    { "id": 1, "nombre": "Ana" },
    { "id": 2, "nombre": "Luis" }
  ],
  "tareas": [
    { "id": 1, "texto": "Aprender JavaScript", "completada": false },
    { "id": 2, "texto": "Construir una SPA",   "completada": false }
  ]
}
```

### `package.json` — agregar el script de inicio

```json
{
  "scripts": {
    "start": "json-server --watch db.json --port 3000 --static public"
  }
}
```

> `--static public` le dice a JSON Server que sirva los archivos de la
> carpeta `public/` — ahí van el HTML, CSS y JS del cliente.

### Correr el servidor

```bash
npm start
```

Luego abrir `http://localhost:3000` en el navegador. El servidor imprime
en consola los endpoints disponibles:

```
GET  http://localhost:3000/usuarios
GET  http://localhost:3000/tareas
POST http://localhost:3000/tareas
...
```

> ⚠️ **No usar Live Server.** Cada vez que `db.json` cambia (con cada POST
> o DELETE), Live Server detecta el cambio y recarga la página — lo que
> interrumpe cualquier operación en curso. Siempre usar `http://localhost:3000`.

---

## Paso 1 — El HTML: todas las vistas juntas

Todas las "pantallas" se escriben en el mismo `index.html`. Cada una es un `<section>` con un ID único. Solo una estará visible a la vez.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Mi SPA</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>

  <!-- VISTA 1: Login — visible al cargar -->
  <section id="vista-login" class="vista activa">
    <h1>Bienvenido</h1>
    <input type="text" id="input-nombre" placeholder="Tu nombre" />
    <button id="btn-entrar">Entrar</button>
    <p id="error-login" class="oculto">Por favor escribe tu nombre.</p>
  </section>

  <!-- VISTA 2: Tareas — oculta al cargar -->
  <section id="vista-tareas" class="vista oculto">
    <h2>Mis tareas</h2>
    <p id="saludo"></p>

    <div>
      <input type="text" id="input-tarea" placeholder="Nueva tarea..." />
      <button id="btn-agregar">Agregar</button>
    </div>

    <ul id="lista-tareas"></ul>

    <button id="btn-salir">Cerrar sesión</button>
  </section>

  <!-- axios debe cargarse antes que los módulos JS -->
  <script src="https://cdn.jsdelivr.net/npm/axios@1.7.2/dist/axios.min.js"></script>
  <script type="module" src="./js/app.js"></script>
</body>
</html>
```

Puntos clave:
- `class="vista activa"` → visible al cargar
- `class="vista oculto"` → oculta al cargar
- Solo existe **un** archivo HTML — no hay `tareas.html` ni `login.html`

---

## Paso 2 — El CSS: visibilidad controlada por clases

JavaScript nunca cambia estilos directamente. Solo agrega y quita clases — el CSS hace el resto.

```css
/* style.css */

/* todas las vistas ocultas por defecto */
.vista {
  display: none;
}

/* solo la que tiene .activa se muestra */
.vista.activa {
  display: block;
  animation: entrada 0.3s ease forwards; /* opcional */
}

/* clase utilitaria para ocultar cualquier elemento */
.oculto {
  display: none;
}

@keyframes entrada {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

---

## Paso 3 — `api.js`: comunicación con el servidor

Todas las llamadas HTTP se centralizan aquí. El resto de la app nunca usa axios directamente — solo importa el objeto `api`.

```javascript
// js/api.js

// axios está disponible como variable global porque index.html
// lo carga con el <script> del CDN antes que este módulo

// se crea una instancia con la URL base del servidor
// así los demás módulos solo pasan la ruta relativa: '/tareas', '/usuarios', etc.
const http = axios.create({
  baseURL: 'http://localhost:3000'
});

export const api = {

  // GET: obtener datos del servidor
  // axios parsea el JSON automáticamente — los datos llegan en response.data
  get: async (param) => {
    try {
      const response = await http.get(param);
      return response.data;
    } catch (error) {
      console.error('Error en GET:', error.message);
      throw error; // re-lanza para que el módulo llamador muestre el error al usuario
    }
  },

  // POST: crear un recurso nuevo
  // axios serializa el objeto a JSON y agrega Content-Type automáticamente
  post: async (param, data) => {
    try {
      const response = await http.post(param, data);
      return response.data; // el servidor devuelve el objeto creado con su ID asignado
    } catch (error) {
      console.error('Error en POST:', error.message);
      throw error;
    }
  },

  // DELETE: eliminar un recurso
  del: async (param) => {
    try {
      const response = await http.delete(param);
      return response.data ?? {}; // ?? {} cubre HTTP 204 (sin body) — evita undefined
    } catch (error) {
      console.error('Error en DELETE:', error.message);
      throw error;
    }
  }
};
```

> Si en el futuro se cambia axios por `fetch` nativo u otra librería,
> solo se toca este archivo. El resto de la app no se entera.

---

## Paso 4 — `router.js`: la función que cambia de vista

El router es la única parte de la app que decide qué vista está visible. Ningún otro archivo manipula las clases de las vistas.

```javascript
// js/router.js

// relaciona cada nombre de ruta con el ID del <section> en el HTML
// agregar una vista nueva solo requiere añadir una línea aquí
const rutas = {
  login:  'vista-login',
  tareas: 'vista-tareas'
};

export function irA(nombreRuta) {
  const idDestino = rutas[nombreRuta];
  if (!idDestino) {
    console.warn(`La ruta "${nombreRuta}" no existe.`);
    return;
  }

  // 1. ocultar todas las vistas
  document.querySelectorAll('.vista').forEach(vista => {
    vista.classList.remove('activa');
    vista.classList.add('oculto');
  });

  // 2. mostrar solo la vista destino
  const destino = document.getElementById(idDestino);
  if (destino) {
    destino.classList.remove('oculto');
    void destino.offsetWidth; // fuerza reflow: reinicia la animación CSS desde cero
    destino.classList.add('activa');
  }
}
```

---

## Paso 5 — `views.js`: lógica de cada vista

Cada función `init` configura una vista: registra los listeners de sus botones y define qué hace cada uno.

```javascript
// js/views.js

import { api } from './api.js';
import { irA } from './router.js';

// ── LOGIN ─────────────────────────────────────────────────────────────────────

export function initLogin() {
  const btnEntrar   = document.getElementById('btn-entrar');
  const inputNombre = document.getElementById('input-nombre');
  const errorLogin  = document.getElementById('error-login');

  btnEntrar.addEventListener('click', () => {
    const nombre = inputNombre.value.trim();

    if (!nombre) {
      errorLogin.classList.remove('oculto'); // muestra el mensaje de error
      return;
    }

    errorLogin.classList.add('oculto');

    // guardar el nombre en localStorage para recordarlo si recarga la página
    localStorage.setItem('usuario', nombre);

    document.getElementById('saludo').textContent = `Hola, ${nombre} 👋`;

    cargarTareas(); // carga las tareas antes de navegar
    irA('tareas');
  });
}

// ── TAREAS ────────────────────────────────────────────────────────────────────

// carga las tareas desde el servidor y las renderiza
export async function cargarTareas() {
  const lista = document.getElementById('lista-tareas');

  try {
    const tareas = await api.get('/tareas'); // GET http://localhost:3000/tareas
    renderizarTareas(tareas);
  } catch (err) {
    lista.innerHTML = '<li>⚠️ No se pudieron cargar las tareas.</li>';
  }
}

// genera el HTML de cada tarea y lo inyecta en la lista
function renderizarTareas(tareas) {
  const lista = document.getElementById('lista-tareas');

  if (tareas.length === 0) {
    lista.innerHTML = '<li>No hay tareas aún.</li>';
    return;
  }

  // data-id conecta cada botón con el ID de su tarea — sin variables globales
  lista.innerHTML = tareas.map(t => `
    <li>
      <span>${t.texto}</span>
      <button class="btn-borrar" data-id="${t.id}">✕</button>
    </li>
  `).join('');
}

export function initTareas() {
  const btnAgregar  = document.getElementById('btn-agregar');
  const inputTarea  = document.getElementById('input-tarea');
  const lista       = document.getElementById('lista-tareas');
  const btnSalir    = document.getElementById('btn-salir');

  // agregar tarea: POST al servidor y re-renderizar
  btnAgregar.addEventListener('click', async () => {
    const texto = inputTarea.value.trim();
    if (!texto) return;

    btnAgregar.disabled    = true;
    btnAgregar.textContent = 'Agregando...';

    try {
      const nueva = await api.post('/tareas', { texto, completada: false });
      inputTarea.value = '';
      cargarTareas(); // refresca la lista con el nuevo elemento
    } catch (err) {
      alert('No se pudo agregar la tarea.');
    } finally {
      btnAgregar.disabled    = false;
      btnAgregar.textContent = 'Agregar';
    }
  });

  // event delegation: un solo listener para todos los botones de borrar
  // sin esto, cada botón necesitaría su propio listener y se perderían al re-renderizar
  lista.addEventListener('click', async (e) => {
    if (!e.target.classList.contains('btn-borrar')) return;

    const id = Number(e.target.dataset.id); // lee el ID desde data-id del botón

    try {
      await api.del(`/tareas/${id}`); // DELETE http://localhost:3000/tareas/:id
      cargarTareas(); // refresca la lista
    } catch (err) {
      alert('No se pudo eliminar la tarea.');
    }
  });

  // cerrar sesión
  btnSalir.addEventListener('click', () => {
    localStorage.removeItem('usuario');
    lista.innerHTML = '';
    irA('login');
  });
}
```

---

## Paso 6 — `app.js`: el punto de entrada

`app.js` importa todo, inicializa los módulos en orden y decide la vista inicial.

```javascript
// js/app.js

import { irA }                          from './router.js';
import { initLogin, initTareas, cargarTareas } from './views.js';

function init() {
  // 1. registrar TODOS los listeners primero
  //    los botones deben tener sus eventos antes de que el usuario los vea
  initLogin();
  initTareas();

  // 2. restaurar sesión o ir al login
  const usuario = localStorage.getItem('usuario');

  if (usuario) {
    // hay sesión guardada: mostrar el saludo y cargar tareas
    document.getElementById('saludo').textContent = `Hola, ${usuario} 👋`;
    cargarTareas();
    irA('tareas');
  } else {
    irA('login');
  }
}

// arrancar la aplicación
init();
```

> **¿Por qué los listeners van antes de `irA()`?**
> Si se navega primero y los botones ya son visibles, pero las funciones
> `init` aún no corrieron, los clicks no harán nada. Los listeners
> siempre se registran antes de activar cualquier vista.

---

## Flujo completo

```
Navegador carga index.html
  └── app.js se ejecuta
        ├── initLogin()   → registra listener del botón Entrar
        ├── initTareas()  → registra listeners de Agregar, Borrar y Cerrar sesión
        └── revisa localStorage
              ├── hay usuario → saludo + cargarTareas() + irA('tareas')
              └── no hay usuario → irA('login')

Usuario escribe su nombre y hace click en "Entrar"
  └── listener de btn-entrar
        ├── nombre vacío → muestra error, para
        └── nombre válido
              ├── localStorage.setItem('usuario', nombre)
              ├── cargarTareas() → GET /tareas → renderizarTareas()
              └── irA('tareas')

Usuario agrega una tarea
  └── listener de btn-agregar
        ├── campo vacío → no hace nada
        └── texto válido
              ├── POST /tareas → servidor guarda en db.json
              └── cargarTareas() → re-renderiza la lista

Usuario borra una tarea
  └── listener delegado en la lista
        ├── lee data-id del botón
        ├── DELETE /tareas/:id → servidor elimina de db.json
        └── cargarTareas() → re-renderiza la lista

Usuario cierra sesión
  └── listener de btn-salir
        ├── localStorage.removeItem('usuario')
        ├── limpia la lista
        └── irA('login')
```

---

## Qué agregar para crecer el proyecto

| Necesidad | Cómo resolverlo |
|---|---|
| Más vistas | Agregar `<section>` en HTML + línea en `rutas` de `router.js` |
| Autenticación real | Validar usuario contra `GET /usuarios` en el servidor |
| Animación al cambiar de vista | Agregar clases `saliendo` en el router y escuchar `animationend` |
| Persistir sesión con datos del usuario | Guardar el objeto completo con `JSON.stringify` en localStorage |
| PUT para editar | Agregar `api.put()` en `api.js` y un modal de edición en `views.js` |
