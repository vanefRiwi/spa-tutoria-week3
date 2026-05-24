// =============================================
//  views.js — Renderizado de vistas
// =============================================

import { api } from './api.js';
import { navigateTo } from './router.js';

// ── Estado local ──────────────────────────────────────────────────────────────
let allCoders    = []; // copia local de todos los coders cargados desde la API
let activeFilter = 'all'; // filtro activo: 'all' | 'active' | 'inactive'
let listenerAttached = false; // bandera para registrar el listener de cards solo una vez

// ── HOME ──────────────────────────────────────────────────────────────────────

/**
 * handleCardClick — manejador central de clicks en las cards.
 * Usa event delegation: un solo listener en el contenedor captura
 * clicks de todos los botones Edit y Delete, sin importar cuántos haya.
 *
 * @param {Event} e - evento de click
 */
function handleCardClick(e) { 
  const id = e.target.dataset.id; // lee el ID del coder desde el atributo data-id
  if (!id) return; // click en zona sin data-id (ej. el fondo de la card)
  if (e.target.classList.contains('btn-edit'))   openEditModal(Number(id));
  if (e.target.classList.contains('btn-delete')) confirmDelete(Number(id));
}

/**
 * attachCardListener — registra handleCardClick en el contenedor UNA SOLA VEZ.
 * La bandera listenerAttached evita duplicar el listener si loadHome() se llama
 * varias veces (ej. al volver al home después de editar).
 *
 * @param {HTMLElement} container - elemento donde viven las cards
 */
function attachCardListener(container) {
  if (listenerAttached) return;  // ya registrado, no duplicar
  container.addEventListener('click', handleCardClick);
  listenerAttached = true;
}

// Muestra un mensaje de error en el contenedor cuando la API falla.
/**
 * showLoadError — muestra un mensaje de error en el contenedor
 * cuando la llamada a la API falla.
 *
 * @param {HTMLElement} container - contenedor de las cards
 */
function showLoadError(container) {
  if (container) {
    container.innerHTML = '<p class="empty-msg">⚠️ Could not load coders. Is the server running?</p>';
  }
}

// Carga los coders desde la API y los renderiza.
/**
 * loadHome — carga los coders desde la API y los renderiza.
 * Es el punto de entrada de la vista home.
 * Cada paso (listener, fetch, render) está delegado a su función.
 */
export async function loadHome() {
  const container = document.getElementById('coders-list');
  attachCardListener(container);  // registra el listener solo si aún no existe

  try {
    allCoders = await api.get('/coders'); // fetch GET /coders
    applyFilterAndRender();  // renderiza con el filtro activo
  } catch (err) {
    console.error('Error cargando coders:', err);
    showLoadError(container);
  }
}
// ── FILTRO ────────────────────────────────────────────────────────────────────
/**
 * applyFilterAndRender — filtra allCoders según activeFilter y llama a renderCoders.
 * Centraliza toda la lógica de filtrado en un solo lugar.
 */
function applyFilterAndRender() {
  let filtered;
  if (activeFilter === 'active') {
    filtered = allCoders.filter(c => c.active === true); // solo coders activos
  } else if (activeFilter === 'inactive') {
    filtered = allCoders.filter(c => c.active === false); // solo inactivos
  } else {
    filtered = allCoders; // sin filtro: todos
  }
  renderCoders(filtered);
  updateFilterButtons(); // refleja el filtro activo en los botones
}

/**
 * updateFilterButtons — marca con 'filter-active' el botón del filtro actual
 * y quita esa clase de los demás.
 */

function updateFilterButtons() {
  ['all', 'active', 'inactive'].forEach(f => {
    const btn = document.getElementById(`filter-${f}`);
    if (!btn) return;
    // toggle: agrega la clase si f === activeFilter, la quita si no
    btn.classList.toggle('filter-active', activeFilter === f);
  });
}

// ── RENDER ────────────────────────────────────────────────────────────────────

/**
 * renderCoders — genera el HTML de las cards y lo inyecta en el contenedor.
 * No registra listeners: eso lo maneja el listener delegado en loadHome().
 *
 * @param {Array} coders - lista de coders ya filtrada a mostrar
 */
function renderCoders(coders) {
  const container = document.getElementById('coders-list');
  if (!container) return;

  // Lista vacía: mostrar mensaje en lugar de un contenedor vacío
  if (coders.length === 0) {
    container.innerHTML = '<p class="empty-msg">No coders found.</p>';
    return;
  }

  // Solo genera el HTML. El listener de clicks vive en loadHome().
  // --i es una CSS custom property usada para animar las cards en cascada
  container.innerHTML = coders
    .map((coder, index) => `
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
    `)
    .join('');
}

// ── MODAL: CIERRE CENTRALIZADO ────────────────────────────────────────────────
 
/**
 * closeAllModals — oculta ambos modales y el overlay en un solo punto.
 */
function closeAllModals() {
  document.getElementById('modal-edit').classList.add('hidden');
  document.getElementById('modal-confirm').classList.add('hidden');
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ── CREAR CODER ───────────────────────────────────────────────────────────────
/**
 * initCreateForm — registra el listener del botón "Create Coder".
 * Lee el formulario, valida, llama a la API y actualiza la lista local.
 */
export function initCreateForm() {
  const btn = document.getElementById('btn-create-coder');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const name     = document.getElementById('new-name').value.trim();
    const language = document.getElementById('new-language').value.trim();
    const active   = document.getElementById('new-active').checked;  // boolean

    const errorEl = document.getElementById('create-error');
    errorEl.classList.add('hidden'); // limpia error anterior

    // Validación básica: ambos campos de texto son requeridos
    if (!name || !language) {
      errorEl.textContent = '⚠️ Name and language are required.';
      errorEl.classList.remove('hidden');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Creating...';

    try {
      const newCoder = await api.post('/coders', { name, language, active });  // POST a la API
      allCoders.push(newCoder); // agrega el nuevo coder al array local
      applyFilterAndRender(); // re-renderiza con el filtro actual

      // Limpiar formulario tras éxito
      document.getElementById('new-name').value     = '';
      document.getElementById('new-language').value = '';
      document.getElementById('new-active').checked = false;

      showToast('✅ Coder created!');
    } catch (err) {
      errorEl.textContent = '🔴 Could not create coder.';
      errorEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Coder';
    }
  });
}

// ── EDITAR CODER ──────────────────────────────────────────────────────────────
/**
 * openEditModal — rellena el formulario del modal con los datos del coder
 * y lo hace visible.
 *
 * @param {number} id - ID del coder a editar
 */

function openEditModal(id) {
  const coder = allCoders.find(c => c.id === id); // busca en el array local el coder con ese ID
  if (!coder) return;
   // Prellenar campos del formulario
  document.getElementById('edit-id').value       = coder.id;
  document.getElementById('edit-name').value     = coder.name;
  document.getElementById('edit-language').value = coder.language;
  document.getElementById('edit-active').checked = coder.active;
  document.getElementById('edit-error').classList.add('hidden'); // limpia error anterior
 
  // Mostrar modal y overlay
  document.getElementById('modal-edit').classList.remove('hidden');
  document.getElementById('modal-overlay').classList.remove('hidden');
}

// Lee los valores actuales del formulario de edición.
/**
 * getEditFormValues — lee y normaliza los valores actuales del formulario de edición.
 * @returns {{ id: number, name: string, language: string, active: boolean }}
 */
function getEditFormValues() {
  return {
    id:       Number(document.getElementById('edit-id').value),  // convierte string → number
    name:     document.getElementById('edit-name').value.trim(),
    language: document.getElementById('edit-language').value.trim(),
    active:   document.getElementById('edit-active').checked,
  };
}


/**
 * validateEditInputs — comprueba que nombre y lenguaje no estén vacíos.
 * @returns {string|null} mensaje de error, o null si todo está bien
 */
function validateEditInputs(name, language) {
  if (!name || !language) return '⚠️ Name and language are required.';
  return null;
}

// Actualiza el coder en el array local tras una edición exitosa.
/**
 * updateCoderInList — reemplaza el coder editado en el array local
 * para que la vista refleje los cambios sin hacer un nuevo GET.
 *
 * @param {object} updated - coder actualizado devuelto por la API
 */
function updateCoderInList(updated) {
  const index = allCoders.findIndex(c => c.id === updated.id);
  if (index !== -1) allCoders[index] = updated;
}

// Llama a la API, actualiza la lista local y cierra el modal.
/**
 * saveCoderEdit — orquesta el flujo completo de guardado:
 *   1. Lee el formulario
 *   2. Valida los campos
 *   3. Llama a la API con PUT
 *   4. Actualiza el array local y re-renderiza
 *   5. Cierra el modal
 *
 * @param {HTMLButtonElement} btnSave - botón de guardado (para deshabilitar durante la llamada)
 */
async function saveCoderEdit(btnSave) {
  const { id, name, language, active } = getEditFormValues();
  const errorEl = document.getElementById('edit-error');
  errorEl.classList.add('hidden');

  const validationError = validateEditInputs(name, language);
  if (validationError) {
    errorEl.textContent = validationError;
    errorEl.classList.remove('hidden');
    return; // no llama a la API si hay error de validación
  }

  btnSave.disabled = true;
  btnSave.textContent = 'Saving...';

  try {
    const updated = await api.put(`/coders/${id}`, { id, name, language, active }); // PUT completo
    updateCoderInList(updated); // sincroniza el array local con la respuesta del servidor
    applyFilterAndRender();
    closeAllModals();
    showToast('✅ Coder updated!');
  } catch {
    errorEl.textContent = '🔴 Could not update coder.';
    errorEl.classList.remove('hidden');
  } finally {
    btnSave.disabled = false;
    btnSave.textContent = 'Save Changes';
  }
}


/**
 * initEditModal — registra los listeners del modal de edición:
 * - botón cerrar (×)
 * - click en el overlay para cerrar
 * - botón guardar cambios
 */
export function initEditModal() {
  document.getElementById('btn-close-modal')?.addEventListener('click', (e) => {
    e.stopPropagation();// evita que el click suba al overlay y dispare otro cierre
    closeAllModals();
  });

    // Cerrar al hacer click fuera del modal (en el overlay)
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeAllModals();// solo si el click es en el overlay, no en el modal
  });

  const btnSave = document.getElementById('btn-save-edit');
  if (!btnSave) return;

  btnSave.addEventListener('click', (e) => {
    e.stopPropagation();// evita propagación al overlay
    saveCoderEdit(btnSave);
  });
}


// ── ELIMINAR CODER ────────────────────────────────────────────────────────────

/**
 * confirmDelete — abre el modal de confirmación con el nombre del coder
 * y guarda su ID en data-id del botón de confirmar.
 *
 * @param {number} id - ID del coder a eliminar
 */
function confirmDelete(id) {
  const coder = allCoders.find(c => c.id === id);
  if (!coder) return;
  // Mensaje personalizado para que el usuario sepa exactamente qué va a borrar
  document.getElementById('confirm-msg').textContent =
    `Are you sure you want to delete "${coder.name}"?`;
  document.getElementById('modal-confirm').classList.remove('hidden');
  document.getElementById('modal-overlay').classList.remove('hidden');
  // Guarda el ID en el botón para recuperarlo en el handler de confirmación
  document.getElementById('btn-confirm-delete').dataset.id = id;
}
/**
 * initDeleteModal — registra los listeners del modal de confirmación:
 * - botón cancelar (cierra el modal)
 * - botón confirmar (llama a DELETE en la API)
 */
export function initDeleteModal() {
  // Cancelar: cierra todo. stopPropagation evita que el click
  // suba al overlay y dispare closeAllModals dos veces.
  document.getElementById('btn-cancel-delete')?.addEventListener('click', (e) => {
    e.stopPropagation(); // evita que suba al overlay y dispare closeAllModals dos veces
    closeAllModals();
  });

  const btnConfirm = document.getElementById('btn-confirm-delete');
  if (!btnConfirm) return;

  btnConfirm.addEventListener('click', async (e) => {
    
    e.stopPropagation(); // Sin esto, el click sube al overlay y cierra el modal
    // antes de que el DELETE a la API termine.
    const id = Number(e.target.dataset.id); // recupera el ID guardado en confirmDelete

    btnConfirm.disabled = true;
    btnConfirm.textContent = 'Deleting...';

    try {
      await api.del(`/coders/${id}`); // DELETE al servidor
      allCoders = allCoders.filter(c => c.id !== id); // elimina del array local
      applyFilterAndRender();
      closeAllModals();
      showToast('🗑️ Coder deleted.');
    } catch (err) {
      console.error('Error eliminando coder:', err);
      closeAllModals();
      showToast('🔴 Could not delete coder.');
    } finally {
      btnConfirm.disabled = false;
      btnConfirm.textContent = 'Delete';
    }
  });
}

// ── FILTROS ───────────────────────────────────────────────────────────────────
/**
 * initFilters — registra el listener de cada botón de filtro.
 * Al hacer click, actualiza activeFilter y re-renderiza.
 */
export function initFilters() {
  ['all', 'active', 'inactive'].forEach(f => {
    document.getElementById(`filter-${f}`)?.addEventListener('click', () => {
      activeFilter = f; // cambia el filtro activo
      applyFilterAndRender();  // re-renderiza con el nuevo filtro
    });
  });
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
/**
 * showToast — muestra una notificación temporal en pantalla.
 * La animación CSS 'toast-show' la hace aparecer y desaparecer.
 * Se oculta automáticamente después de 2.5 segundos.
 *
 * @param {string} message - texto a mostrar en el toast
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('toast-show'); // dispara la animación de entrada en CSS
  setTimeout(() => {
    toast.classList.remove('toast-show');
    toast.classList.add('hidden');  // oculta tras 2.5 s
  }, 2500);
}

// ── CONTACT ───────────────────────────────────────────────────────────────────
/**
 * initContact — registra los listeners de navegación y del formulario de contacto.
 */
export function initContact() {
  document.getElementById('btn-contact')?.addEventListener('click', () => navigateTo('contact'));
  document.getElementById('btn-back-home')?.addEventListener('click', () => navigateTo('home'));
  document.getElementById('btn-send')?.addEventListener('click', handleContactSubmit);
}
/**
 * handleContactSubmit — valida y "envía" el formulario de contacto.
 * En esta versión no hace fetch real: solo valida y muestra mensaje de éxito.
 */
function handleContactSubmit() {
  const name    = document.getElementById('contact-name').value.trim();
  const email   = document.getElementById('contact-email').value.trim();
  const message = document.getElementById('contact-message').value.trim();

  const errorEl   = document.getElementById('contact-error');
  const successEl = document.getElementById('contact-success');
  
  // Limpiar mensajes anteriores antes de re-validar
  errorEl.classList.add('hidden');
  successEl.classList.add('hidden');

  // Todos los campos son requeridos
  if (!name || !email || !message) {
    errorEl.textContent = '⚠️ All fields are required.';
    errorEl.classList.remove('hidden');
    return;
  }

  // Validación mínima: solo verifica que el email contenga '@'
  if (!email.includes('@')) {
    errorEl.textContent = '⚠️ Enter a valid email address.';
    errorEl.classList.remove('hidden');
    return;
  }

  // Éxito: mostrar confirmación y limpiar formulario
  successEl.textContent = '✅ Message sent successfully!';
  successEl.classList.remove('hidden');

  document.getElementById('contact-name').value    = '';
  document.getElementById('contact-email').value   = '';
  document.getElementById('contact-message').value = '';
}