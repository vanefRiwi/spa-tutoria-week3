# Coders SPA

Single Page Application para gestionar un equipo de coders. Construida con HTML, CSS y JavaScript vanilla. Usa JSON Server como backend.

---

## Cómo funciona la app — explicación paso a paso

### 1. Arranque: `app.js`

Cuando el navegador carga `index.html`, el único script que se ejecuta es `app.js`.
Su función `init()` hace tres cosas en orden:

```javascript
function init() {
  initModules();    // 1. registra todos los listeners (clicks, formularios, modales)
  initToggleForm(); // 2. conecta el botón que muestra/oculta el formulario de creación
  restoreSession(); // 3. decide si ir al login o al home según localStorage
}

init();
```

> **¿Por qué ese orden?**  
> Los listeners deben existir *antes* de que la navegación active una vista.
> Si `restoreSession()` fuera primero y navegara al home, los botones ya estarían
> visibles pero sin listeners — los clicks no harían nada.

---

### 2. Sesión: `restoreSession()` en `app.js`

Al arrancar, la app busca una sesión guardada en `localStorage`:

```javascript
function restoreSession() {
  const savedUser = localStorage.getItem('user'); // null si no existe

  if (!savedUser) {
    navigateTo('login'); // sin sesión → pantalla de login
    return;
  }

  const user = JSON.parse(savedUser);           // deserializa el objeto
  navWelcome.textContent = `Welcome, ${user.name}`; // muestra nombre en el nav
  navigateTo('home');
  loadHome(); // carga los coders de inmediato
}
```

---

### 3. Navegación: `router.js`

Hay un solo archivo HTML (`index.html`) con tres `<section>` apiladas.
El router muestra una y oculta las otras cambiando clases CSS:

```javascript
const routes = {
  login:   'view-login',   // cada nombre de ruta apunta
  home:    'view-home',    // al ID del <section>
  contact: 'view-contact'  // correspondiente en el HTML
};

export function navigateTo(routeName) {
  // Si hay una vista activa, primero hace fade-out con CSS
  if (current && current.id !== targetId) {
    current.classList.add('leaving');
    // { once: true } evita acumular listeners en cada navegación
    current.addEventListener('animationend', showTarget, { once: true });
  } else {
    showTarget(); // sin animación de salida
  }
}
```

> **Truco del reflow:**  
> `void target.offsetWidth` fuerza al navegador a recalcular el layout
> antes de agregar la clase `active`. Sin esto, si la misma vista se
> mostrara dos veces seguidas, la animación CSS no reiniciaría.

---

### 4. Login: `auth.js`

El flujo de login está dividido en funciones pequeñas para que cada una
tenga una sola responsabilidad:

```javascript
// Paso 1 — validar que los campos no estén vacíos (sin tocar la API)
function validateLoginInputs(username, password) {
  if (!username || !password) return '⚠️ Please fill in all fields.';
  return null; // null = sin errores
}

// Paso 2 — buscar el usuario y comparar la contraseña localmente
function validateCredentials(users, username, password) {
  const found = users.find(u => u.username === username);
  if (!found)                      return { error: '❌ Username not found.' };
  if (found.password !== password) return { error: '❌ Incorrect password.' };
  return { user: found };
}

// Paso 3 — guardar sesión y navegar
function startSession(user) {
  localStorage.setItem('user', JSON.stringify(user)); // persiste entre recargas
  navigateTo('home');
  loadHome();
}
```

> **¿Por qué se validan las credenciales en el frontend?**  
> JSON Server no tiene autenticación real. La app obtiene *todos* los usuarios
> con `GET /users` y compara localmente. En producción esto sería un
> `POST /login` al backend.

---

### 5. Comunicación con el servidor: `api.js`

Toda llamada HTTP pasa por el objeto `api`. El resto de la app nunca
usa axios directamente, lo que facilita cambiar la librería en el futuro:

```javascript
const http = axios.create({
  baseURL: 'http://localhost:3000' // URL base del JSON Server
});

export const api = {
  get:  async (param)       => (await http.get(param)).data,
  post: async (param, data) => (await http.post(param, data)).data,
  put:  async (param, data) => (await http.put(param, data)).data,
  del:  async (param)       => (await http.delete(param)).data ?? {},
  //                                                            ↑
  //                   ?? {} cubre el caso en que el servidor responda
  //                   con body vacío (204 No Content) — evita undefined
};
```

---

### 6. Renderizado dinámico: `views.js`

#### 6a. Event delegation en las cards

En lugar de poner un listener en cada botón Edit/Delete (que se
re-crearían en cada render), se usa un solo listener en el contenedor:

```javascript
// Se registra UNA SOLA VEZ gracias a la bandera listenerAttached
function attachCardListener(container) {
  if (listenerAttached) return;
  container.addEventListener('click', handleCardClick);
  listenerAttached = true;
}

// El handler detecta en qué botón se hizo click por su clase
function handleCardClick(e) {
  const id = e.target.dataset.id;        // lee el ID del atributo data-id
  if (!id) return;
  if (e.target.classList.contains('btn-edit'))   openEditModal(Number(id));
  if (e.target.classList.contains('btn-delete')) confirmDelete(Number(id));
}
```

#### 6b. Estado local de los coders

Para evitar un `GET /coders` en cada operación, la app mantiene una
copia local del array y la sincroniza tras cada cambio:

```javascript
let allCoders = []; // copia local — se actualiza con POST, PUT y DELETE

// Crear → agrega al array local sin re-fetch
allCoders.push(newCoder);

// Editar → reemplaza el elemento en su posición
const index = allCoders.findIndex(c => c.id === updated.id);
if (index !== -1) allCoders[index] = updated;

// Eliminar → filtra el elemento fuera del array
allCoders = allCoders.filter(c => c.id !== id);
```

#### 6c. Cierre centralizado de modales

Un único punto cierra ambos modales para evitar que el overlay
cierre el modal equivocado:

```javascript
function closeAllModals() {
  document.getElementById('modal-edit').classList.add('hidden');
  document.getElementById('modal-confirm').classList.add('hidden');
  document.getElementById('modal-overlay').classList.add('hidden');
}
```

> **¿Por qué `e.stopPropagation()` en los botones de los modales?**  
> Sin él, el click en "Save" o "Delete" se propagaría hasta el overlay,
> que también tiene un listener de cierre — cerraría el modal *antes*
> de que la llamada a la API terminara.

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

## Cómo correr el proyecto

```bash
npm start
```

Luego abrir el navegador en:

```
http://localhost:3000
```

### ⚠️ Importante

**No abras el proyecto con Live Server** (`localhost:5500`).  
Live Server recarga la página automáticamente cuando `db.json` cambia.  
Como cada operación CRUD modifica `db.json`, eso provoca que la sesión se pierda y la app te mande al login después de cada acción.

Siempre usá `http://localhost:3000`.

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
├── nodemon.json     ← Configuración para ignorar db.json en desarrollo
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