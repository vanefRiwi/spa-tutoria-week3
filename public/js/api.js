
// =============================================
//  api.js — Capa de comunicación con el servidor
//  Usa axios (cargado como script global en index.html).
//  El resto de la app nunca usa axios directamente.
// =============================================

// axios está disponible como variable global porque index.html
// lo carga con <script src="/node_modules/axios/dist/axios.min.js">
// antes de este módulo — no necesita import.

/**
 * Instancia de axios con la URL base del servidor JSON.
 * Todos los métodos del api object usan esta instancia
 * para no repetir la URL en cada llamada.
 */
const http = axios.create({
  baseURL: 'http://localhost:3000' // servidor JSON Server local
});

export const api = {

   /**
   * GET — obtiene datos de un endpoint.
   * @param {string} param - ruta del recurso, ej. '/users'
   * @returns {Promise<any>} datos del servidor (ya parseados por axios)
   */
  get: async (param) => {
    try {
      const response = await http.get(param);
      return response.data; // axios parsea el JSON automáticamente
    } catch (error) {
      console.error('Error en GET:', error.message);
      throw error; // re-lanza para que el llamador lo maneje

    }
  },

  // POST: crear un recurso nuevo
  // axios serializa el body a JSON y agrega Content-Type solo
    /**
   * @param {string} param - ruta del recurso, ej. '/coders'
   * @param {object} data  - objeto a enviar en el body
   * @returns {Promise<any>} recurso creado devuelto por el servidor
   */
  post: async (param, data) => {
    try {
      const response = await http.post(param, data);
      return response.data;
    } catch (error) {
      console.error('Error en POST:', error.message);
      throw error;
    }
  },

  // PUT: reemplazar un recurso completo
   /**
   * @param {string} param - ruta con ID, ej. '/coders/3'
   * @param {object} data  - objeto completo con todos los campos
   * @returns {Promise<any>} recurso actualizado
   */
  put: async (param, data) => {
    try {
      const response = await http.put(param, data);
       // axios serializa el body a JSON y agrega Content-Type automáticamente
      return response.data;
    } catch (error) {
      console.error('Error en PUT:', error.message);
      throw error;
    }
  },

  // DELETE: eliminar un recurso
   /**
   * @param {string} param - ruta con ID, ej. '/coders/3'
   * @returns {Promise<object>} objeto vacío si el servidor no devuelve body
   */
  // axios lanza error automáticamente en respuestas 4xx/5xx
  del: async (param) => {
    try {
      const response = await http.delete(param);
      return response.data ?? {};     // ?? {} evita retornar undefined cuando el servidor responde sin body
    } catch (error) {
      // axios lanza error automáticamente en respuestas 4xx/5xx
      console.error('Error en DELETE:', error.message);
      throw error;
    }
  }
};
