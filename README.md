# Coders SPA

Single Page Application para gestionar coders. Construida con HTML, CSS y JavaScript vanilla. Usa JSON Server como backend.
- ver [Cómo hacer tu propia SPA](./tupropiaspa.md).
- ver  [Guía fetch vs axios](./fetchvsaxios.md).

---

## Requisitos

- Node.js instalado
- npm instalado

---

## Instalación

```bash
npm install
```

---
## Cómo funciona el servidor de este proyecto ?
 
JSON Server se puede usar de dos formas:
 
**Con rutas por defecto — CLI directa**  
JSON Server genera automáticamente `GET`, `POST`, `PUT` y `DELETE` para cada colección de `db.json`. Es suficiente para proyectos simples.
 
```json
// package.json
{
  "scripts": {
    "start": "json-server --watch db.json --port 3000"
  }
}
```
 
**Con rutas personalizadas — librería en `server.js`** ← el que usa este proyecto  
Se importa JSON Server como librería y se configuran rutas propias antes de que el router automático tome el control. Así se crean endpoints como `/coders/active`, `/coders/inactive` y `/health` que la CLI no puede generar.
 
```json
// package.json
{
  "scripts": {
    "start": "node server.js"
  }
}
```
`server.js` se ve así por dentro — las rutas personalizadas van antes de que el router automático tome el control:
 
```javascript
// server.js
import jsonServer from 'json-server';
 
const server = jsonServer.create();
const router = jsonServer.router('db.json');
server.use(jsonServer.bodyParser);
server.use(jsonServer.defaults());
 
// rutas propias — la CLI no puede crearlas
server.get('/coders/active',   (req, res) => { ... });
server.get('/coders/inactive', (req, res) => { ... });
server.get('/health',          (req, res) => { ... });
 
server.use(router); // a partir de aquí, json-server maneja GET /coders, POST /coders, etc.
server.listen(3000);
```

---

## Cómo correr el proyecto

```bash
npm start
```
Una vez ejecutado, el servidor imprime en consola los enlaces disponibles:
 
```
============================
Servidor corriendo en :3000
============================
URL principal: http://localhost:3000
Rutas disponibles:
GET  http://localhost:3000/users
GET  http://localhost:3000/coders
Rutas personalizadas:
GET  http://localhost:3000/coders/active
GET  http://localhost:3000/coders/inactive
GET  http://localhost:3000/health
```
 
Copiar y pegar URL principal `http://localhost:3000` en el navegador para abrir la app.
 
> **El servidor debe estar corriendo** para que la app funcione. Si se cierra
> la terminal o se detiene el proceso, la app perderá la conexión y no podrá
> cargar ni guardar datos.

> El servidor solo imprime las rutas GET en consola, pero `POST`, `PUT` y `DELETE`
> también están disponibles para `/users` y `/coders` — JSON Server las genera
> automáticamente para cada colección que exista en `db.json`.


### ⚠️ Importante
>  **No usar Live Server.** Cada vez que `db.json` cambia (con cada PUT, POST
> , DELETE), Live Server detecta el cambio y recarga la página, lo que
> interrumpe cualquier operación en curso.  
Siempre usar `http://localhost:3000`.



---

## Credenciales de prueba

| Usuario | Contraseña |
|---------|------------|
| admin   | 1234       |
| coder1  | abcd       |

---

## Estructura del proyecto

```
spa-tutoria/
├── db.json          ← Base de datos simulada (usuarios y coders)
├── package.json     ← Configuración del proyecto y dependencias
├── server.js        ← Backend: json-server con rutas personalizadas
└── public/
    ├── index.html   ← Único archivo HTML de la SPA
    ├── style.css    ← Todos los estilos
    └── js/
        ├── app.js       ← Punto de entrada
        ├── router.js    ← Navegación entre vistas
        ├── auth.js      ← Login y logout
        ├── api.js       ← Comunicación con el servidor
        └── views.js     ← Renderizado dinámico del DOM
```

---

## Endpoints disponibles

| Método | Ruta               | Descripción              |
|--------|--------------------|--------------------------|
| GET    | /users             | Lista de usuarios        |
| GET    | /coders            | Lista de coders          |
| GET    | /coders/active     | Solo coders activos      |
| GET    | /coders/inactive   | Solo coders inactivos    |
| POST   | /coders            | Crear coder              |
| PUT    | /coders/:id        | Editar coder             |
| DELETE | /coders/:id        | Eliminar coder           |
| GET    | /health            | Estado del servidor      |

---

## Cómo funciona la app — explicación paso a paso

### ¿Qué es una SPA?

Una **Single Page Application** es una aplicación web que vive en un único archivo HTML. En lugar de navegar a páginas distintas (cada una con su propia URL y recarga del navegador), la app muestra y oculta secciones del mismo documento según lo que el usuario necesite ver. Esto da la sensación de velocidad y fluidez de una app de escritorio.

En este proyecto, `index.html` contiene las tres "pantallas" al mismo tiempo —login, home y contacto — apiladas una sobre otra. Solo una está visible en cada momento. El código JavaScript es quien decide cuál.

---

### 1. El servidor: `server.js` + `db.json`

Todo parte del servidor. Antes de que el navegador muestre algo, `server.js` debe estar corriendo.

El servidor está construido sobre **JSON Server**, una librería que toma un archivo `.json` y lo convierte automáticamente en una API REST completa, sin necesidad de escribir lógica de backend. `db.json` contiene dos colecciones: `users` (para autenticación) y `coders` (los registros que la app gestiona).

JSON Server genera de forma automática los endpoints `GET`, `POST`, `PUT` y `DELETE` para cada colección. `server.js` lo extiende con rutas personalizadas que JSON Server no crearía por sí solo:

```javascript
// server.js

const server  = jsonServer.create();
const router  = jsonServer.router('db.json'); // conecta db.json como fuente de datos
const PORT    = 3000;

server.use(jsonServer.bodyParser); // permite leer el body en POST y PUT
server.use(middlewares);

// Ruta personalizada: filtra coders activos directamente desde la base de datos
server.get('/coders/active', (req, res) => {
  const db      = router.db;
  const activos = db.get('coders').filter({ active: true }).value();
  res.status(200).json(activos);
});

// Validación en el servidor: rechaza un POST si faltan campos obligatorios
server.post('/coders', (req, res, next) => {
  const { name, language } = req.body;
  if (!name || !language) {
    return res.status(400).json({ error: 'name y language son obligatorios' });
  }
  next(); // si está bien, pasa al router automático de JSON Server
});

// El router de JSON Server maneja el resto: GET /coders, PUT /coders/:id, DELETE /coders/:id, etc.
server.use(router);

server.listen(PORT, () => {
  console.log(`Servidor corriendo en :${PORT}`);
});
```

> **¿Por qué `nodemon.json` ignora `db.json`?**  
> Cada operación CRUD escribe en `db.json` para persistir los cambios.
> Sin esa configuración, nodemon detectaría ese cambio y reiniciaría el
> servidor en cada acción — cortando la conexión del cliente a mitad de operación.

---

### 2. La capa de comunicación: `api.js`

Una vez que el servidor está activo, el cliente necesita una forma de hablarle. Eso es `api.js`: un objeto que envuelve todas las llamadas HTTP con axios y expone cuatro métodos simples.

Ningún otro archivo usa axios directamente. Esto tiene una ventaja clara: si en el futuro se decide cambiar axios por `fetch` nativo u otra librería, solo hay que tocar este archivo.

```javascript
// api.js

const http = axios.create({
  baseURL: 'http://localhost:3000' // URL base del servidor — los demás módulos solo pasan la ruta relativa
});

export const api = {
  get: async (param) => {
    try {
      const response = await http.get(param);
      return response.data; // axios parsea el JSON automáticamente
    } catch (error) {
      console.error('Error en GET:', error.message);
      throw error; // re-lanza el error para que el módulo llamador decida cómo mostrarlo
    }
  },

  post: async (param, data) => {
    try {
      const response = await http.post(param, data);
      return response.data;
    } catch (error) {
      console.error('Error en POST:', error.message);
      throw error;
    }
  },

  del: async (param) => {
    try {
      const response = await http.delete(param);
      return response.data ?? {}; // ?? {} cubre el caso de HTTP 204 (sin body) — evita retornar undefined
    } catch (error) {
      console.error('Error en DELETE:', error.message);
      throw error;
    }
  }
};
```

`api.js` no conoce el DOM, no muestra mensajes de error al usuario ni toma decisiones de flujo. Solo habla con el servidor y devuelve los datos o lanza el error.

---

### 3. El punto de entrada: `app.js`

Cuando el navegador carga `index.html`, el único script que se ejecuta directamente es `app.js`. Su rol es orquestar: importa todos los módulos y los inicializa en el orden correcto.

```javascript
// app.js

function init() {
  initModules();    // 1. registra TODOS los listeners de la app de una sola vez
  initToggleForm(); // 2. conecta el botón que muestra/oculta el formulario de creación
  restoreSession(); // 3. decide si mostrar el login o ir directo al home
}

init();
```

El orden importa. `initModules()` registra los listeners **antes** de que `restoreSession()` active cualquier vista. Si fuera al revés, los botones estarían visibles en el DOM pero sin ningún evento asociado — los clicks no harían nada.

> **¿Qué es un listener?**  
> Un listener (o "event listener") es una función que queda registrada en un
> elemento del DOM a la espera de que ocurra un evento específico — un click,
> un cambio en un input, el fin de una animación, etc. Cuando el evento ocurre,
> el navegador ejecuta automáticamente esa función. En esta app todos los
> listeners se registran con `addEventListener`:
> ```javascript
> btnLogin.addEventListener('click', () => { /* se ejecuta al hacer click */ });
> ```
> Registrar un listener no lo ejecuta de inmediato. Solo lo deja "escuchando".
> Por eso es importante que existan antes de que el usuario vea los botones.

`initModules()` llama a las funciones de inicialización de cada módulo:

```javascript
// app.js

function initModules() {
  initLogin();       // listener del botón Log In
  initLogout();      // listener del botón Log Out
  initContact();     // listeners de navegación y formulario de contacto
  initCreateForm();  // listener del botón Create Coder
  initEditModal();   // listeners del modal de edición (cerrar, guardar)
  initDeleteModal(); // listeners del modal de confirmación (cancelar, confirmar)
  initFilters();     // listeners de los botones All / Active / Inactive
}
```

`restoreSession()` revisa `localStorage`. Si encuentra una sesión guardada, restaura el nombre del usuario en el nav, navega al home y carga los coders. Si no la encuentra, redirige al login:

```javascript
// app.js

function restoreSession() {
  const savedUser = localStorage.getItem('user'); // devuelve null si no existe

  if (!savedUser) {
    navigateTo('login'); // primera visita o sesión cerrada → login
    return;
  }

  const user       = JSON.parse(savedUser); // convierte el string guardado de vuelta a objeto
  const navWelcome = document.getElementById('nav-welcome');

  if (navWelcome) {
    navWelcome.textContent = `Welcome, ${user.name}`; // muestra el nombre en el nav
  }

  navigateTo('home');
  loadHome(); // carga los coders sin esperar una acción del usuario
}
```

> **¿Por qué `localStorage` y no `sessionStorage`?**  
> `sessionStorage` se borra al cerrar la pestaña. Con `localStorage`, la sesión
> persiste entre recargas y cierres del navegador, lo que evita tener que
> volver a iniciar sesión cada vez que se recarga la página en medio de una
> operación CRUD.

---

### 4. La navegación: `router.js`

Aquí es donde ocurre la magia de la SPA. `index.html` tiene tres `<section>` apiladas, una por vista:

```html
<!-- index.html -->
<section id="view-login"   class="view active"> ... </section>
<section id="view-home"    class="view hidden"> ... </section>
<section id="view-contact" class="view hidden"> ... </section>
```

El router no recarga la página: simplemente agrega y quita clases CSS para mostrar una sección y ocultar las demás.

```javascript
// router.js

// Mapa que relaciona cada nombre de ruta con el ID del <section> en el HTML.
// Agregar una vista nueva solo requiere añadir una línea aquí.
const routes = {
  login:   'view-login',
  home:    'view-home',
  contact: 'view-contact'
};

export function navigateTo(routeName) {
  const targetId = routes[routeName]; // resuelve el ID del <section> destino

  if (!targetId) {
    console.warn(`Router: la ruta "${routeName}" no existe.`);
    return;
  }

  const current = document.querySelector('.view.active'); // vista actualmente visible

  const showTarget = () => {
    // Ocultar todas las vistas
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active', 'leaving');
      view.classList.add('hidden');
    });
    // Mostrar solo la destino
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.remove('hidden');
      void target.offsetWidth; // reflow: reinicia la animación CSS desde cero
      target.classList.add('active'); // dispara la animación de entrada definida en CSS
    }
  };

  // Si hay una vista activa, hacer fade-out antes de mostrar la destino
  if (current && current.id !== targetId) {
    current.classList.add('leaving'); // dispara la animación de salida en CSS
    // { once: true } asegura que este listener se elimine solo después de dispararse,
    // evitando que se acumule un nuevo listener en cada llamada a navigateTo()
    current.addEventListener('animationend', showTarget, { once: true });
  } else {
    showTarget(); // sin animación de salida
  }
}
```

Las animaciones de entrada y salida están definidas enteramente en CSS. El router solo agrega o quita las clases `active`, `leaving` e `hidden`; el CSS se encarga del resto.


---

### 5. El login: `auth.js`

El flujo de autenticación está dividido en funciones pequeñas con responsabilidad única. Esto hace que cada paso sea fácil de leer y modificar de forma independiente.

```javascript
// auth.js

// Paso 1 — validación de campos vacíos, sin tocar la red
function validateLoginInputs(username, password) {
  if (!username || !password) return '⚠️ Please fill in all fields.';
  return null; // null indica que no hay errores
}

// Paso 2 — búsqueda del usuario y comparación de contraseña
// Se hace localmente sobre el array que devolvió GET /users
function validateCredentials(users, username, password) {
  const found = users.find(u => u.username === username); // busca por username exacto
  if (!found)                      return { error: '❌ Username not found.' };
  if (found.password !== password) return { error: '❌ Incorrect password.' };
  return { user: found }; // credenciales válidas
}

// Paso 3 — persistir la sesión y navegar al home
function startSession(user) {
  localStorage.setItem('user', JSON.stringify(user)); // guarda el objeto como string
  document.getElementById('nav-welcome').textContent = `Welcome, ${user.name}`;
  navigateTo('home');
  loadHome();
}
```

El botón Log In orquesta estos tres pasos en su listener:

```javascript
// auth.js

export function initLogin() {
  const btnLogin = document.getElementById('btn-login');
  if (!btnLogin) return;

  btnLogin.addEventListener('click', async () => {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    hideError('login-error'); // limpia errores anteriores antes de validar

    const inputError = validateLoginInputs(username, password);
    if (inputError) { showError('login-error', inputError); return; }

    btnLogin.disabled = true;
    btnLogin.textContent = 'Loading...';

    try {
      const users = await api.get('/users'); // obtiene todos los usuarios
      const { user, error } = validateCredentials(users, username, password);
      if (error) { showError('login-error', error); return; }
      startSession(user); // credenciales correctas: iniciar sesión
    } catch {
      // Error de red: JSON Server probablemente no está corriendo
      showError('login-error', '🔴 Could not connect to the server. Is JSON Server running?');
    } finally {
      btnLogin.disabled = false; // siempre restaurar el botón, haya éxito o error
      btnLogin.textContent = 'Log In';
    }
  });
}
```


---

### 6. El renderizado: `views.js`

`views.js` es el módulo más extenso. Se encarga de cargar los coders desde la API, renderizarlos como cards en el DOM, y gestionar todas las operaciones CRUD — creación, edición y eliminación — junto con sus modales y el formulario de contacto.

#### 6a. Estado local y sincronización con el servidor

Para evitar hacer un `GET /coders` después de cada operación, la app mantiene una copia local del array. Cada operación exitosa la actualiza directamente:

```javascript
// views.js

let allCoders    = [];    // espejo local de la colección coders en db.json
let activeFilter = 'all'; // filtro activo: 'all' | 'active' | 'inactive'

// Después de crear → el servidor devuelve el objeto nuevo con su ID asignado
const newCoder = await api.post('/coders', { name, language, active });
allCoders.push(newCoder);

// Después de editar → se reemplaza el elemento en su posición
const updated = await api.put(`/coders/${id}`, { id, name, language, active });
const index = allCoders.findIndex(c => c.id === updated.id);
if (index !== -1) allCoders[index] = updated;

// Después de eliminar → se filtra fuera del array
await api.del(`/coders/${id}`);
allCoders = allCoders.filter(c => c.id !== id);
```

Después de cada cambio se llama a `applyFilterAndRender()`, que aplica el filtro activo y regenera el HTML de las cards.

#### 6b. Event delegation en las cards

Cada vez que `renderCoders()` se ejecuta, destruye y recrea todo el HTML del contenedor `#coders-list`. Si cada botón Edit y Delete tuviera su propio listener, esos listeners se perderían en cada render. La solución es registrar **un solo listener en el contenedor padre**, que nunca se destruye:

```javascript
// views.js

// La bandera evita registrar el listener más de una vez,
// aunque loadHome() se llame varias veces (ej. al volver desde la vista de contacto)
function attachCardListener(container) {
  if (listenerAttached) return;
  container.addEventListener('click', handleCardClick);
  listenerAttached = true;
}

// Un solo handler detecta en cuál botón se hizo click leyendo su clase y el atributo data-id
function handleCardClick(e) {
  const id = e.target.dataset.id; // undefined si el click no fue en un botón
  if (!id) return;
  if (e.target.classList.contains('btn-edit'))   openEditModal(Number(id));
  if (e.target.classList.contains('btn-delete')) confirmDelete(Number(id));
}
```

El `data-id` en cada botón del HTML generado es lo que conecta el click con el coder correcto, sin necesidad de variables globales ni closures por tarjeta:

> **¿Qué es un closure?**  
> Un closure ocurre cuando una función "recuerda" las variables del entorno
> en el que fue creada, incluso después de que ese entorno ya no existe.
> El problema con el patrón alternativo — registrar un listener por cada botón
> dentro del `.map()` — es que cada función creada en ese loop capturaría el
> valor de `coder.id` de ese momento. Si los coders se re-renderizan, se crean
> nuevas funciones con nuevos closures, y los listeners anteriores quedan
> huérfanos en memoria apuntando a IDs que ya no corresponden al DOM actual.
> Usar `data-id` en el HTML y leerlo desde un único listener evita ese problema
> por completo: no hay closures por tarjeta, no hay listeners acumulados.

```javascript
// views.js — dentro de renderCoders()

container.innerHTML = coders.map((coder, index) => `
  <div class="coder-card" id="card-${coder.id}" style="--i:${index}">
    <p class="coder-name">${coder.name}</p>
    <span class="coder-lang">${coder.language}</span>
    <p class="coder-status ${coder.active ? 'status-active' : 'status-inactive'}">
      ${coder.active ? '● Active' : '○ Inactive'}
    </p>
    <div class="card-actions">
      <button type="button" class="btn-edit"   data-id="${coder.id}">Edit</button>
      <button type="button" class="btn-delete" data-id="${coder.id}">Delete</button>
    </div>
  </div>
`).join('');
```


#### 6c. Cierre centralizado de modales

> **¿Qué es un modal?**  
> Un modal es un elemento de interfaz que aparece flotando sobre el contenido
> principal, bloqueando la interacción con el resto de la página hasta que el
> usuario lo cierra o toma una decisión. Generalmente está acompañado de un
> **overlay**: una capa semitransparente que oscurece el fondo para enfocar
> la atención en el modal. En esta app los modales están definidos en `index.html`
> como `<div>` con clase `.modal`, posicionados con `position: fixed` en CSS,
> y se muestran u ocultan agregando o quitando la clase `hidden`.

La app tiene dos modales — edición y confirmación de borrado — que comparten el mismo overlay. Centralizar el cierre en una sola función evita que el overlay cierre el modal equivocado:

```javascript
// views.js

// Antes de esta solución, cada modal tenía su propia función de cierre.
// Si modal-confirm estaba abierto y el usuario hacía click en el overlay,
// se ejecutaba solo la lógica de modal-edit, que no sabía nada de modal-confirm.
function closeAllModals() {
  document.getElementById('modal-edit').classList.add('hidden');
  document.getElementById('modal-confirm').classList.add('hidden');
  document.getElementById('modal-overlay').classList.add('hidden');
}
```

Los botones de acción dentro de los modales (Save Changes, Delete) usan `e.stopPropagation()`:

```javascript
// views.js — dentro de initEditModal()

btnSave.addEventListener('click', (e) => {
  e.stopPropagation(); // sin esto, el click sube al overlay y cierra el modal
                       // antes de que la llamada a la API termine
  saveCoderEdit(btnSave);
});
```

> **¿Qué es `stopPropagation()`?**  
> Los eventos de click en JavaScript "burbujean" hacia arriba por el árbol del
> DOM. Si el botón "Save" está dentro del modal, y el modal está dentro del
> overlay, el click llegaría también al overlay — que tiene su propio listener
> de cierre. `stopPropagation()` detiene esa propagación para que el click
> no salga del botón.

---

## Flujo completo de la aplicación

Esta sección resume de forma lineal cómo se conectan todas las piezas desde que el usuario abre el navegador hasta que completa una operación CRUD.

---

### Arranque

```
Navegador carga index.html
  └── Ejecuta app.js
        ├── initModules()       → registra todos los listeners (botones, modales, filtros)
        ├── initToggleForm()    → conecta el botón "+ New Coder"
        └── restoreSession()
              ├── localStorage tiene sesión → navigateTo('home') + loadHome()
              └── localStorage vacío       → navigateTo('login')
```

---

### Login

```
Usuario escribe credenciales y hace click en "Log In"
  └── initLogin() detecta el click
        ├── validateLoginInputs()   → ¿campos vacíos? → muestra error y para
        └── api.get('/users')       → GET http://localhost:3000/users
              └── validateCredentials()
                    ├── usuario no existe   → muestra error y para
                    ├── contraseña incorrecta → muestra error y para
                    └── credenciales válidas → startSession(user)
                          ├── localStorage.setItem('user', ...)
                          ├── navigateTo('home')
                          └── loadHome()
```

---

### Carga del home

```
loadHome()
  └── api.get('/coders')   → GET http://localhost:3000/coders
        └── allCoders = [...]   (copia local del array)
              └── applyFilterAndRender()
                    ├── filtra según activeFilter ('all' | 'active' | 'inactive')
                    ├── renderCoders(filtered)   → genera HTML de las cards en el DOM
                    └── updateFilterButtons()    → marca el botón de filtro activo
```

---

### Crear un coder

```
Usuario llena el formulario y hace click en "Create Coder"
  └── initCreateForm() detecta el click
        ├── valida campos vacíos → error si faltan
        └── api.post('/coders', { name, language, active })
              └── POST http://localhost:3000/coders
                    └── servidor valida y guarda en db.json
                          └── responde con el objeto creado (incluye el ID asignado)
                                ├── allCoders.push(newCoder)
                                ├── applyFilterAndRender()   → re-renderiza las cards
                                ├── limpia el formulario
                                └── showToast('✅ Coder created!')
```

---

### Editar un coder

```
Usuario hace click en "Edit" de una card
  └── handleCardClick() detecta btn-edit + lee data-id
        └── openEditModal(id)
              ├── busca el coder en allCoders (sin fetch)
              ├── rellena el formulario del modal con sus datos
              └── muestra modal-edit + overlay

Usuario modifica los campos y hace click en "Save Changes"
  └── saveCoderEdit()
        ├── getEditFormValues()       → lee los valores del formulario
        ├── validateEditInputs()      → ¿campos vacíos? → error si faltan
        └── api.put('/coders/:id', { id, name, language, active })
              └── PUT http://localhost:3000/coders/:id
                    └── servidor actualiza db.json
                          └── responde con el objeto actualizado
                                ├── updateCoderInList(updated)   → reemplaza en allCoders
                                ├── applyFilterAndRender()
                                ├── closeAllModals()
                                └── showToast('✅ Coder updated!')
```

---

### Eliminar un coder

```
Usuario hace click en "Delete" de una card
  └── handleCardClick() detecta btn-delete + lee data-id
        └── confirmDelete(id)
              ├── muestra modal-confirm con el nombre del coder
              ├── guarda el id en data-id del botón confirmar
              └── muestra overlay

Usuario hace click en "Delete" dentro del modal
  └── initDeleteModal() detecta el click
        └── api.del('/coders/:id')
              └── DELETE http://localhost:3000/coders/:id
                    └── servidor elimina de db.json
                          ├── allCoders = allCoders.filter(c => c.id !== id)
                          ├── applyFilterAndRender()
                          ├── closeAllModals()
                          └── showToast('🗑️ Coder deleted.')
```

---
 
### Navegar a Contact
 
```
Usuario hace click en "Contact Us" (navbar del home)
  └── initContact() detecta el click
        └── navigateTo('contact')
              └── router hace fade-out del home y fade-in de view-contact
 
Usuario llena el formulario y hace click en "Send Message"
  └── handleContactSubmit()
        ├── valida campos vacíos        → error si alguno falta
        ├── email.includes('@')         → error si no contiene arroba
        └── validación exitosa
              ├── muestra mensaje de éxito
              └── limpia los tres campos del formulario
 
Usuario hace click en "← Back to Home"
  └── initContact() detecta el click
        └── navigateTo('home')
              └── router hace fade-out del contact y fade-in de view-home
                    (los coders ya están en allCoders — no hay nuevo fetch)
```
 
---

### Logout

```
Usuario hace click en "Logout"
  └── initLogout() detecta el click
        ├── localStorage.removeItem('user')   → elimina la sesión
        ├── limpia los campos del formulario de login
        └── navigateTo('login')
```
