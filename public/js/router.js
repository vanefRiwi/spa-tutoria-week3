// =============================================
//  router.js — Sistema de navegación SPA
//  Controla qué vista es visible en cada momento.
//  Ningún otro archivo manipula clases de vistas.
// =============================================

// Mapa de rutas: nombre de ruta → ID del elemento en el HTML
/**
 * Mapa de rutas: nombre de ruta → ID del elemento en el HTML
 * con el ID del elemento <section> en el HTML.
 * Agregar una vista nueva solo requiere añadir una entrada aquí.
 */
const routes = {
  login:   'view-login',
  home:    'view-home',
  contact: 'view-contact'
};

// navigateTo: la única función que cambia de vista en toda la app
/**
 * navigateTo — única función que cambia de vista en toda la app.
 *
 * Si hay una vista activa, la anima con fade-out antes de mostrar
 * la destino. Si no hay vista activa, muestra la destino de inmediato.
 *
 * @param {string} routeName - clave del objeto routes ('login' | 'home' | 'contact')
 */
export function navigateTo(routeName) {
  const targetId = routes[routeName]; // resuelve el ID del elemento destino

 // Ruta desconocida: avisa en consola y sale sin romper la app
  if (!targetId) {
    console.warn(`Router: la ruta "${routeName}" no existe.`);
    return;
  }
 

  // Vista actualmente visible
  const current = document.querySelector('.view.active');
   /**
   * showTarget — oculta todas las vistas y muestra solo la destino.
   * Se llama directamente o como callback de 'animationend'.
   */
  const showTarget = () => {
    //Quitar clases active/leaving a todas las vistas y ocultarlas
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active', 'leaving');
      view.classList.add('hidden');
    });
    // Mostrar la vista destino con animación
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.remove('hidden');
      // Forzar reflow para que la animación arranque desde cero
      void target.offsetWidth;
      target.classList.add('active'); // dispara la animación de entrada definida en CSS
    }
  };

  // Si hay vista activa y es diferente a la destino → fade-out primero
  if (current && current.id !== targetId) {
    current.classList.add('leaving'); // dispara animación de salida en CSS
    current.addEventListener('animationend', showTarget, { once: true }); // { once: true } evita que el listener se acumule en llamadas repetidas
  } else {
    showTarget(); // no hay animación de salida, mostrar directamente
  }
}
