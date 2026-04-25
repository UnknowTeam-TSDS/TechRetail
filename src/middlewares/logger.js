/**
 * Middleware: Logger de peticiones HTTP
 * Registra en consola cada request con método, URL y timestamp
 * TechRetail Solutions S.R.L.
 */

const logger = (req, res, next) => {
  const ahora = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
  console.log(`[${ahora}] ${req.method} ${req.originalUrl}`);
  next(); // Pasa el control al siguiente middleware o ruta
};

module.exports = logger;
