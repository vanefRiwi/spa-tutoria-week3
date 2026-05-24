// =============================================
//  app.js — Punto de entrada de la SPA
//
//  Este archivo NO hace nada por sí solo.
//  Solo importa los módulos e inicializa la app.
//
//  Flujo de módulos:
//    app.js
//    ├── router.js   → navegación entre vistas
//    ├── auth.js     → login / logout
//    │   ├── api.js  → fetch GET /users
//    │   ├── router.js
//    │   └── views.js → loadHome()
//    └── views.js    → renderizado + contacto
//        ├── api.js  → fetch GET /coders
//        └── router.js
// =============================================

import { navigateTo } from './router.js';
import { initLogin, initLogout } from './auth.js';
import {
  initContact,
  initCreateForm,
  initEditModal,
  initDeleteModal,
  initFilters,
  loadHome
} from './views.js';

/**
 * Inicializa todos los módulos de la interfaz.
 * Se llama una sola vez al cargar la página.
 * initModules — registra todos los listeners de la app.
 */
function initModules() {
  initLogin();       // listener del botón Log In
  initLogout();      // listener del botón Log Out
  initContact();     // listeners de navegación y formulario de contacto
  initCreateForm();  // listener del botón Create Coder
  initEditModal();   // listeners del modal de edición (cerrar, guardar)
  initDeleteModal(); // listeners del modal de confirmación (cancelar, confirmar)
  initFilters();     // listeners de los botones All / Active / Inactive
}

/**
 * Configura el botón que muestra/oculta el formulario de creación.
 */
function initToggleForm() {
  const toggleFormBtn = document.getElementById('btn-toggle-form');
  const createForm    = document.getElementById('create-form');

  if (toggleFormBtn && createForm) {
    toggleFormBtn.addEventListener('click', () => {
      createForm.classList.toggle('hidden'); // alterna visibilidad con CSS
    });
  }
}

/**
 * Restaura la sesión guardada o redirige al login.
 * * restoreSession — comprueba si hay una sesión guardada en localStorage.
 * - Si existe: restaura el nombre en el nav y navega al home.
 * - Si no existe: redirige al login.

 */
function restoreSession() {
  const savedUser = localStorage.getItem('user'); 

  if (!savedUser) {
    navigateTo('login');  // sin sesión → ir al login
    return;
  }

  const user       = JSON.parse(savedUser);  // deserializa el objeto de usuario
  const navWelcome = document.getElementById('nav-welcome'); // muestra el nombre en el nav

  if (navWelcome) { 
    navWelcome.textContent = `Welcome, ${user.name}`;
  }

  navigateTo('home'); // sesión válida → ir directo al home
  loadHome();  // carga los coders sin esperar a una acción del usuario
}
/**
 * init — función principal que arranca la aplicación.
 * Orden: primero registra listeners, luego restaura la sesión.
 * Así todos los botones existen antes de que la navegación los active.
 */
function init() {
  initModules();
  initToggleForm();
  restoreSession();
}

// Arrancar aplicación
init();