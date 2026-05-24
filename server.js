// =============================================
//  CODERS SPA — server.js (Backend)
//  JSON Server con ES Modules
// =============================================

import jsonServer from 'json-server';


const server      = jsonServer.create();
const middlewares = jsonServer.defaults();
const router      = jsonServer.router('db.json');
const PORT        = 3000;

// Leer cuerpo de peticiones POST/PUT
server.use(jsonServer.bodyParser);
server.use(middlewares);

// Middleware de logs
server.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// ── Rutas personalizadas ──────────────────────────────────────────────────────

// Health check
server.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servidor SPA activo ✅' });
});

// Validar POST a /coders
server.post('/coders', (req, res, next) => {
  const { name, language } = req.body;
  if (!name || !language) {
    return res.status(400).json({ error: 'name y language son obligatorios' });
  }
  next();
});

// Solo coders activos
server.get('/coders/active', (req, res) => {
  const db      = router.db;
  const activos = db.get('coders').filter({ active: true }).value();
  res.status(200).json(activos);
});

// Solo coders inactivos
server.get('/coders/inactive', (req, res) => {
  const db        = router.db;
  const inactivos = db.get('coders').filter({ active: false }).value();
  res.status(200).json(inactivos);
});

// ── Rewriter y router automático ─────────────────────────────────────────────
server.use(jsonServer.rewriter({ '/api/*': '/$1' }));
server.use(router);


// ── Arrancar servidor ─────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('============================');
  console.log(`Servidor corriendo en :${PORT}`);
  console.log('============================');
  console.log(`GET  http://localhost:${PORT}/users`);
  console.log(`GET  http://localhost:${PORT}/coders`);
  console.log(`GET  http://localhost:${PORT}/coders/active`);
  console.log(`GET  http://localhost:${PORT}/coders/inactive`);
  console.log(`GET  http://localhost:${PORT}/health`);
});
