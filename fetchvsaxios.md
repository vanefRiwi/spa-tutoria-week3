# Axios vs Fetch — Teoría

Esta guía explica qué es `fetch`, cómo se usa en su forma completa, qué es `axios`, en qué se diferencian, y cómo funciona `axios` en este proyecto junto con `async/await`.
- volver al readme principal [README.md](./README.md).
---

## ¿Qué es una petición HTTP?

Antes de comparar herramientas, conviene entender qué problema resuelven.

Cuando el navegador necesita datos del servidor — la lista de coders, por ejemplo — no puede leerlos directamente del archivo `db.json`. Tiene que pedírselos al servidor a través del protocolo **HTTP**. Esa "solicitud" que envía el navegador se llama **petición HTTP** o **request**.

El servidor recibe la petición, busca los datos y devuelve una **respuesta** (response) con el resultado. Todo esto ocurre de forma **asíncrona**: el navegador no se congela esperando — sigue funcionando y procesa la respuesta cuando llega.

Los cuatro tipos de petición más comunes son:

| Método | Para qué se usa |
|--------|-----------------|
| `GET` | Obtener datos del servidor |
| `POST` | Enviar datos nuevos al servidor |
| `PUT` | Reemplazar un dato existente |
| `DELETE` | Eliminar un dato |

---

## `fetch` — la herramienta nativa del navegador

`fetch` es una función que viene incorporada en todos los navegadores modernos. No hay que instalar nada. Permite hacer peticiones HTTP desde JavaScript y devuelve una **Promise** — es decir, una promesa de que en algún momento va a llegar una respuesta.

### Estructura completa de `fetch`

Esta es la anatomía de una llamada `fetch` con todos sus elementos:

```javascript
fetch(url, opciones)
  .then(response => { /* manejo de la respuesta HTTP */ })
  .then(data     => { /* uso de los datos ya convertidos */ })
  .catch(error   => { /* manejo de errores de red */ });
```

Desglosado:

```
fetch(url, opciones)
│       │       │
│       │       └── objeto opcional con método, headers, body, etc.
│       └────────── string con la URL del endpoint
└────────────────── función nativa del navegador
        │
        ▼
    devuelve una Promise<Response>
        │
        ▼
   .then(response => ...)   ← primer .then: recibe el objeto Response (headers, status, body crudo)
        │
        ▼
   response.json()          ← convierte el body de texto a objeto JavaScript (también es una Promise)
        │
        ▼
   .then(data => ...)        ← segundo .then: recibe los datos ya convertidos
        │
        ▼
   .catch(error => ...)      ← captura errores de RED (no de servidor)
```

### GET con `fetch` — obtener datos

```javascript
// GET: pedir la lista de coders al servidor
fetch('http://localhost:3000/coders')
  // primer .then: recibe la respuesta HTTP completa
  // response contiene: status (200, 404...), headers, y el body aún sin parsear
  .then(response => {
    // fetch NO lanza error si el servidor responde 404 o 500
    // hay que revisarlo manualmente con response.ok (true si status está entre 200-299)
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json(); // convierte el body (texto) a objeto JavaScript
                            // esto también es una Promise, por eso encadena otro .then
  })
  // segundo .then: recibe los datos ya convertidos a objeto/array JavaScript
  .then(data => {
    console.log(data); // [ { id: 1, name: 'Ada', language: 'Python', active: true }, ... ]
  })
  // catch: captura errores de RED (servidor caído, sin internet)
  // NO captura respuestas 4xx/5xx a menos que se haya lanzado el error manualmente arriba
  .catch(error => {
    console.error('Error de red:', error.message);
  });
```

### POST con `fetch` — enviar datos nuevos

```javascript
// POST: crear un coder nuevo
fetch('http://localhost:3000/coders', {
  method: 'POST',                              // indica que es una escritura, no una lectura

  headers: {
    'Content-Type': 'application/json'         // obligatorio: le dice al servidor
  },                                           // que el body viene en formato JSON

  body: JSON.stringify({                       // el body debe ser un STRING, no un objeto
    name: 'Ada Lovelace',                      // JSON.stringify() convierte el objeto a texto JSON
    language: 'Python',                        // ej: '{"name":"Ada","language":"Python","active":true}'
    active: true
  })
})
  .then(response => {
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json(); // el servidor devuelve el objeto creado con su ID asignado
  })
  .then(newCoder => {
    console.log('Coder creado:', newCoder); // { id: 5, name: 'Ada', language: 'Python', active: true }
  })
  .catch(error => {
    console.error('Error de red:', error.message);
  });
```
> **Nota:** los valores dentro de `JSON.stringify()` — `5`, `'Ada Lovelace'`,
> `'JavaScript'`, `false` — están escritos directamente solo para que el
> ejemplo sea concreto y fácil de leer. En el código real nunca se escriben
> así: vendrían de variables leídas del formulario, por ejemplo
> `{ id, name, language, active }` donde cada una es el valor que el usuario
> ingresó. Lo mismo aplica a los valores fijos de los ejemplos de GET, POST y DELETE.
>  Por ejemplo, en este
> proyecto `views.js` lee los valores del modal de edición antes de llamar
> a la API:
>
> ```javascript
> // primero se leen los valores del formulario
> const id       = Number(document.getElementById('edit-id').value);
> const name     = document.getElementById('edit-name').value.trim();
> const language = document.getElementById('edit-language').value.trim();
> const active   = document.getElementById('edit-active').checked;
>
> // luego esas variables se pasan al body — no valores fijos
> body: JSON.stringify({ id, name, language, active })
> // equivale a: JSON.stringify({ id: 3, name: 'Alan Turing', language: 'C', active: true })
> // pero con lo que el usuario haya escrito en el formulario
> ```
>
> Lo mismo aplica a los valores fijos de los ejemplos de GET, POST y DELETE:
> la URL `/coders/5` en un caso real sería `/coders/${id}` donde `id` viene
> del atributo `data-id` del botón que el usuario presionó.

### PUT con `fetch` — reemplazar un dato existente

```javascript
// PUT: editar el coder con id 5
fetch('http://localhost:3000/coders/5', {
  method: 'PUT',                               // reemplaza el objeto completo

  headers: {
    'Content-Type': 'application/json'         // también obligatorio en PUT
  },

  body: JSON.stringify({
    id: 5,                                     // PUT requiere incluir el id en el body
    name: 'Ada Lovelace',
    language: 'JavaScript',                    // campo modificado
    active: false                              // campo modificado
  })
})
  .then(response => {
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return response.json();
  })
  .then(updated => {
    console.log('Coder actualizado:', updated);
  })
  .catch(error => {
    console.error('Error de red:', error.message);
  });
```

### DELETE con `fetch` — eliminar un dato

```javascript
// DELETE: eliminar el coder con id 5
fetch('http://localhost:3000/coders/5', {
  method: 'DELETE'                             // no necesita headers ni body
})
  .then(response => {
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    // JSON Server responde con {} o sin body en un DELETE exitoso
    // response.json() fallaría si el body está vacío, por eso se verifica
    if (response.status === 200) {
      return response.json();
    }
    return {}; // body vacío → devolver objeto vacío para no romper el flujo
  })
  .then(result => {
    console.log('Coder eliminado');
  })
  .catch(error => {
    console.error('Error de red:', error.message);
  });
```

### Limitaciones de `fetch`

Al escribir los cuatro ejemplos anteriores se puede notar un patrón repetitivo que `fetch` obliga a hacer manualmente en cada llamada:

**1. Dos pasos para obtener los datos.**  
Siempre hay que esperar la respuesta primero y luego convertir el body con `.json()`. Son dos Promises encadenadas.

**2. No lanza error en respuestas 4xx o 5xx.**  
`fetch` solo rechaza la Promise si hay un error de red (servidor apagado, sin internet). Si el servidor responde `404 Not Found` o `500 Internal Server Error`, la Promise se resuelve normalmente y hay que revisar `response.ok` a mano en cada llamada.

**3. Hay que serializar el body manualmente en POST y PUT.**  
Siempre hay que escribir `JSON.stringify(data)` y declarar el header `Content-Type: application/json`.

**4. Hay que repetir la URL base en cada llamada.**  
No hay forma nativa de configurar `http://localhost:3000` una sola vez.

---

## `axios` — la librería que simplifica todo

`axios` es una librería externa que resuelve exactamente esas cuatro limitaciones de forma transparente. Se instala con npm para proyectos incializados con vite u otro bundler:

```bash
npm install axios
```

O se carga desde un CDN directamente en el HTML, como se hace en este proyecto:

```html
<!-- index.html — se carga antes que cualquier módulo JS -->
<script src="https://cdn.jsdelivr.net/npm/axios@1.7.2/dist/axios.min.js"></script>
```

Al cargarse desde el CDN, `axios` queda disponible como variable global en todos los scripts que se carguen después.

### Los mismos cuatro ejemplos con `axios`
 
En lugar de repetir `http://localhost:3000` en cada llamada, se configura
una sola vez con `axios.create()` y a partir de ahí solo se pasan rutas relativas.
Esa es una de las ventajas más prácticas de axios frente a `fetch`:
 
```javascript
// se configura la URL base UNA sola vez
const http = axios.create({ baseURL: 'http://localhost:3000' });
 
// GET — solo la ruta relativa, sin repetir la URL base
// axios parsea el JSON automáticamente: los datos llegan en response.data
const response = await http.get('/coders');
console.log(response.data); // [ { id: 1, name: 'Ada', ... }, ... ]
 
// POST — axios serializa el objeto a JSON y agrega Content-Type solo
// no hay JSON.stringify(), no hay headers manuales, no hay URL base repetida
const response = await http.post('/coders', {
  name: 'Ada Lovelace',
  language: 'Python',
  active: true
});
console.log(response.data); // { id: 5, name: 'Ada', ... }
 
// PUT — igual que POST, axios maneja la serialización
const response = await http.put('/coders/5', {
  id: 5,
  name: 'Ada Lovelace',
  language: 'JavaScript',
  active: false
});
console.log(response.data);
 
// DELETE — solo la ruta, sin body ni headers
const response = await http.delete('/coders/5');
console.log(response.data); // {} o el objeto eliminado
```
 
Con `fetch`, esa misma URL base (`http://localhost:3000`) habría que escribirla
en los cuatro bloques. Si el servidor cambia de puerto o dominio, con axios
se actualiza en un solo lugar; con `fetch` habría que buscarla en cada llamada.


### Tabla comparativa

| Comportamiento | `fetch` | `axios` |
|---|---|---|
| Parseo automático de JSON | ❌ Hay que llamar `.json()` | ✅ Disponible en `response.data` |
| Error en respuestas 4xx/5xx | ❌ Hay que revisar `response.ok` | ✅ Lanza error automáticamente |
| `Content-Type` en POST/PUT | ❌ Hay que declararlo manualmente | ✅ Lo agrega solo |
| Serialización del body | ❌ Hay que usar `JSON.stringify()` | ✅ Lo hace automáticamente |
| URL base reutilizable | ❌ Hay que repetirla en cada llamada | ✅ Se configura una vez con `axios.create()` |

---

## Cómo funciona `axios` en este proyecto

### `axios.create()` — una instancia con URL base

En lugar de escribir `http://localhost:3000` en cada llamada, `api.js` crea una instancia configurada con esa URL base. Todos los métodos de la instancia la usan automáticamente:

```javascript
// api.js

// axios.create() devuelve una nueva instancia de axios con configuración propia
const http = axios.create({
  baseURL: 'http://localhost:3000' // URL base: se suma a cada ruta relativa
});

// A partir de aquí, solo se pasan rutas relativas:
http.get('/coders')          // → GET  http://localhost:3000/coders
http.post('/coders', data)   // → POST http://localhost:3000/coders
http.put('/coders/5', data)  // → PUT  http://localhost:3000/coders/5
http.delete('/coders/5')     // → DELETE http://localhost:3000/coders/5
```

### El objeto `api` — una capa de abstracción

`api.js` exporta un objeto con cuatro métodos que envuelven cada llamada a `http` en un `try/catch`. El resto de la app importa `api` y nunca toca `axios` directamente:

Antes de ver el código, dos términos que aparecen en todos los métodos:
 
> **`param`** — es la ruta relativa del endpoint al que se quiere llegar.
> Por ejemplo `'/coders'`, `'/users'`, o `'/coders/3'`. Se llama `param`
> porque es el parámetro que recibe la función — quien la llama decide
> a qué ruta apunta. Junto con el `baseURL` de la instancia forma la URL completa:
> `http://localhost:3000` + `'/coders/3'` → `http://localhost:3000/coders/3`.
 
> **`data`** — es el objeto JavaScript con los datos a enviar al servidor
> en el body de un POST o PUT. Por ejemplo `{ name, language, active }`.
> axios lo serializa a JSON automáticamente, sin necesidad de `JSON.stringify()`.

```javascript
// api.js

export const api = {

  // GET: obtiene datos del servidor
  // response.data ya contiene el array u objeto parseado — no hay .json() necesario
  get: async (param) => {
    try {
      const response = await http.get(param);
      return response.data;
    } catch (error) {
      console.error('Error en GET:', error.message);
      throw error; // re-lanza: el módulo que llamó a api.get() decide qué mostrarle al usuario
    }
  },

  // POST: crea un recurso nuevo
  // axios serializa `data` a JSON y agrega Content-Type: application/json automáticamente
  post: async (param, data) => {
    try {
      const response = await http.post(param, data);
      return response.data; // el servidor devuelve el objeto creado con su ID asignado
    } catch (error) {
      console.error('Error en POST:', error.message);
      throw error;
    }
  },

  // PUT: reemplaza un recurso completo
  put: async (param, data) => {
    try {
      const response = await http.put(param, data);
      return response.data; // el servidor devuelve el objeto actualizado
    } catch (error) {
      console.error('Error en PUT:', error.message);
      throw error;
    }
  },

  // DELETE: elimina un recurso
  // ?? {} cubre el caso de HTTP 204 (sin body) — response.data sería undefined sin esto
  del: async (param) => {
    try {
      const response = await http.delete(param);
      return response.data ?? {};
    } catch (error) {
      console.error('Error en DELETE:', error.message);
      throw error;
    }
  }
};
```

### Cómo lo usan los demás módulos

`auth.js` y `views.js` importan `api` y llaman a sus métodos con `await`. En ningún momento usan axios directamente:

```javascript
// auth.js
import { api } from './api.js';

const users = await api.get('/users'); // GET http://localhost:3000/users
```

```javascript
// views.js
import { api } from './api.js';

const newCoder = await api.post('/coders', { name, language, active });
const updated  = await api.put(`/coders/${id}`, { id, name, language, active });
await api.del(`/coders/${id}`);
```

---

## ¿Qué son `async` y `await`?
 
`async` y `await` son palabras clave de JavaScript que permiten escribir código asíncrono de forma lineal — de arriba hacia abajo — sin anidar `.then()`.
 
### El problema que resuelven
 
Las peticiones HTTP tardan tiempo. JavaScript no puede pausar todo el programa esperando — eso congelaría el navegador. La solución original eran las Promises con `.then()`, que se vuelven difíciles de leer cuando hay varios pasos encadenados:
 
```javascript
// Con .then() encadenados — difícil de seguir
api.get('/users')
  .then(users => {
    const { user, error } = validateCredentials(users, username, password);
    if (error) throw new Error(error);
    return user;
  })
  .then(user => {
    startSession(user);
  })
  .catch(error => {
    showError('login-error', error.message);
  });
```
 
Con `async/await` el mismo flujo se lee de corrido:
 
```javascript
// Con async/await — lineal, claro, fácil de seguir
// async es obligatorio: sin él, el await de adentro daría SyntaxError
async function handleLogin() {
  try {
    const users           = await api.get('/users');
    const { user, error } = validateCredentials(users, username, password);
    if (error) { showError('login-error', error); return; }
    startSession(user);
  } catch (error) {
    showError('login-error', error.message);
  }
}
```
 
### Ejemplo teórico — la forma más simple
 
Antes de ver el ejemplo del proyecto, esta es la forma más básica de usar `async/await`, sin nada extra:
 
```javascript
// Una función normal NO puede usar await adentro
function obtenerDatos() {
  const datos = await fetch('https://api.ejemplo.com/datos'); // ❌ SyntaxError
}
 
// Con async, la función ya puede pausarse con await
async function obtenerDatos() {
  const respuesta = await fetch('https://api.ejemplo.com/datos');
  // await pausa aquí hasta que llegue la respuesta
  // la línea de abajo solo corre cuando respuesta ya existe
  const datos = await respuesta.json();
  console.log(datos);
}
 
// llamarla es igual que llamar cualquier función
obtenerDatos();
```
 
El flujo en palabras: cuando el motor de JavaScript llega a un `await`, pausa esa función, le devuelve el control al resto del programa, y vuelve a reanudarla cuando la Promise resuelve. La función no bloquea nada — simplemente espera en segundo plano.
 
---
 
### Estructura completa: `async`, `await`, `try/catch`, `finally`
 
El ejemplo usa `loadHome()`, la función que carga los coders al entrar al home.
Se eligió esta porque tiene todos los elementos a la vez: `async`, `await`, `try` y `catch`.
 
```javascript
//  ┌── async: marca la función como asíncrona.
//  │   Sin esta palabra, no se puede usar await adentro.
//  │   La función siempre devuelve una Promise, aunque no se note.
//  ▼
export async function loadHome() {
  const container = document.getElementById('coders-list');
  attachCardListener(container); // registra el listener de clicks (sincrónico, no necesita await)
 
  try {
    //          ┌── await: pausa SOLO esta función hasta que api.get() resuelva su Promise.
    //          │   El resto del navegador (otros eventos, animaciones) sigue funcionando.
    //          │   Sin await, allCoders quedaría como una Promise sin resolver — no un array.
    //          ▼
    allCoders = await api.get('/coders');
    //          └────── cuando el servidor responde, allCoders ya es el array de coders
 
    applyFilterAndRender(); // esta línea solo corre cuando allCoders ya tiene los datos
 
  } catch (err) {
    // si api.get() lanzó un error (servidor caído, red sin conexión, respuesta 4xx/5xx)
    // la ejecución salta aquí directamente — applyFilterAndRender() nunca corrió
    console.error('Error cargando coders:', err);
    showLoadError(container); // muestra el mensaje de error en el contenedor
  }
  // no hay finally aquí porque loadHome() no deshabilita ningún botón antes del await
}
```
 
Un ejemplo con `finally` — el botón "Create Coder" en `views.js`.
Se deshabilita antes de la llamada y `finally` garantiza que siempre se restaure:
 
```javascript
//                    ┌── async: necesario para usar await adentro
//                    ▼
btn.addEventListener('click', async () => {
  const name     = document.getElementById('new-name').value.trim();
  const language = document.getElementById('new-language').value.trim();
  const active   = document.getElementById('new-active').checked;
 
  if (!name || !language) {            // validación sincrónica — no necesita await
    errorEl.classList.remove('hidden');
    return;
  }
 
  btn.disabled    = true;              // deshabilitar el botón mientras se espera al servidor
  btn.textContent = 'Creating...';     // feedback visual
 
  try {
    //               ┌── await: espera que el servidor cree el coder y devuelva el objeto nuevo
    //               ▼
    const newCoder = await api.post('/coders', { name, language, active });
    //    └────────── newCoder ya es el objeto creado: { id: 6, name: '...', language: '...', active: true }
 
    allCoders.push(newCoder);          // agrega al array local sin un nuevo GET
    applyFilterAndRender();
    showToast('✅ Coder created!');
 
  } catch (err) {
    // api.post() lanzó error: el servidor no respondió o rechazó la petición
    errorEl.textContent = '🔴 Could not create coder.';
    errorEl.classList.remove('hidden');
 
  } finally {
    // corre SIEMPRE — haya éxito, error de red, o error de validación del servidor
    btn.disabled    = false;           // rehabilitar el botón
    btn.textContent = 'Create Coder';  // restaurar el texto original
  }
});
```
 
### `finally` en la práctica — el botón de login
 
Este es el patrón exacto que usa `auth.js` para el botón Log In:
 
```javascript
// auth.js — dentro del listener del botón Log In
 
btnLogin.disabled    = true;          // deshabilitar mientras se espera
btnLogin.textContent = 'Loading...';  // feedback visual al usuario
 
try {
  const users = await api.get('/users');
  const { user, error } = validateCredentials(users, username, password);
  if (error) { showError('login-error', error); return; }
  startSession(user);
} catch {
  showError('login-error', '🔴 Could not connect to the server. Is JSON Server running?');
} finally {
  btnLogin.disabled    = false;    // siempre se restaura el botón
  btnLogin.textContent = 'Log In'; // haya éxito, error de validación, o error de red
}
```
 
---
 
## Resumen visual del flujo completo
 
```
Usuario hace click en "Log In"
  │
  ▼
initLogin() — función async
  │
  ├── validateLoginInputs()   → ¿campos vacíos? → error y fin
  │
  ├── btnLogin.disabled = true
  │
  ├── await api.get('/users')
  │         │
  │         ▼
  │       http.get('/users')              ← instancia axios con baseURL
  │         │
  │         ▼
  │       GET http://localhost:3000/users ← petición HTTP al servidor
  │         │
  │         ▼
  │       servidor responde con array JSON
  │         │
  │         ▼
  │       axios parsea el JSON → response.data = [ {id:1, username:'admin'...}, ... ]
  │         │
  │         ▼
  │       api.get() retorna el array
  │         │
  ├── validateCredentials(users, username, password)
  │         │
  │         ├── usuario no existe    → showError() → fin
  │         ├── contraseña incorrecta → showError() → fin
  │         └── credenciales válidas  → { user: {...} }
  │
  ├── startSession(user)
  │         ├── localStorage.setItem('user', ...)
  │         ├── navigateTo('home')
  │         └── loadHome() → await api.get('/coders') → renderCoders()
  │
  └── finally: btnLogin.disabled = false
```
