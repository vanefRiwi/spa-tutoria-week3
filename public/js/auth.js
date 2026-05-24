// =============================================
//  auth.js — Lógica de autenticación
//  Valida credenciales contra la API.
//  Guarda y elimina la sesión del usuario.
// =============================================

import { api } from './api.js';
import { navigateTo } from './router.js';
import { loadHome } from './views.js';

// ── Helpers de mensajes ──────────────────────────────────────────────────────
/**
 * Muestra un mensaje de error en el elemento indicado.
 * @param {string} elementId - ID del elemento donde mostrar el error
 * @param {string} message   - texto del mensaje
 */
function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden'); // hace visible el elemento
}
/**
 * Oculta y limpia el mensaje de error del elemento indicado.
 * @param {string} elementId - ID del elemento a limpiar
 */
function hideError(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

// ── Login ─────────────────────────────────────────────────────────────────────

// Valida los campos del formulario antes de llamar a la API.
/**
 * Valida que los campos del formulario no estén vacíos.
 * @returns {string|null} mensaje de error, o null si todo está bien
 */
function validateLoginInputs(username, password) {
  if (!username || !password) return '⚠️ Please fill in all fields.';
  return null; // sin errores
}

// Busca el usuario en la lista y valida la contraseña.
/**
 * Busca el usuario en la lista y comprueba su contraseña.
 * Separa la lógica de búsqueda de la de autenticación para
 * poder probar cada caso de forma independiente.
 *
 * @param {Array}  users    - lista de usuarios obtenida de la API
 * @param {string} username - nombre de usuario ingresado
 * @param {string} password - contraseña ingresada
 * @returns {{ user?: object, error?: string }}
 */
function validateCredentials(users, username, password) {
  const found = users.find(u => u.username === username);// busca por username exacto
  if (!found)                        return { error: '❌ Username not found.' };
  if (found.password !== password)   return { error: '❌ Incorrect password.' };
  return { user: found };// credenciales correctas
}

// Guarda la sesión y navega al home.
/**
 * Persiste la sesión en localStorage y navega al home.
 * @param {object} user - objeto de usuario devuelto por la API
 */
function startSession(user) {
  localStorage.setItem('user', JSON.stringify(user));// guarda sesión entre recargas
  document.getElementById('nav-welcome').textContent = `Welcome, ${user.name}`;
  navigateTo('home'); // carga los coders inmediatamente al entrar
  loadHome();
}

// Punto de entrada: registra el click y coordina el flujo.
 /**
 * initLogin — registra el listener del botón de login y coordina el flujo:
 *   1. Valida campos vacíos
 *   2. Consulta la lista de usuarios a la API
 *   3. Valida credenciales localmente
 *   4. Inicia sesión o muestra el error correspondiente
 * */
export function initLogin() {
  const btnLogin = document.getElementById('btn-login');
  if (!btnLogin) return; // sale si el botón no existe en el DOM actual

  btnLogin.addEventListener('click', async () => {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    hideError('login-error'); // limpia errores anteriores antes de validar

    const inputError = validateLoginInputs(username, password);
    if (inputError) { showError('login-error', inputError); return; }


    // Deshabilitar el botón mientras se espera la respuesta del servidor
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
      // Siempre restaurar el botón, haya éxito o error
      btnLogin.disabled = false;
      btnLogin.textContent = 'Log In';
    }
  });
}

// ── Logout ────────────────────────────────────────────────────────────────────
/**
 * initLogout — registra el listener del botón de logout.
 * Elimina la sesión, limpia el formulario y vuelve al login.
 */
export function initLogout() {
  const btnLogout = document.getElementById('btn-logout');
  if (!btnLogout) return;

  btnLogout.addEventListener('click', () => {
    
    localStorage.removeItem('user'); // ← elimina la sesión persistida
    document.getElementById('username').value = ''; // limpia campo usuario
    document.getElementById('password').value = ''; // limpia campo contraseña
    navigateTo('login'); // redirige a la vista de login
  });
}