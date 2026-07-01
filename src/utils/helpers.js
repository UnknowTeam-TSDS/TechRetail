// Helpers compartidos por los controllers para evitar duplicación.

// Emite un evento de Socket.io si hay instancia disponible.
// El optional chaining evita que rompa en tests donde no existe req.app.
const emitirSocket = (req, evento, datos) => {
  const io = req.app?.get?.('io');
  if (io) io.emit(evento, datos);
};

// Deja un mensaje flash de un solo uso que la próxima vista muestra como banner (patrón PRG).
const flash = (req, tipo, mensaje) => {
  if (req.session) req.session.flash = { tipo, mensaje };
};

// Renderiza la página de error con estilo en vez de devolver JSON crudo (rutas web).
const render404 = (res, mensaje = 'No encontramos lo que buscás.') =>
  res.status(404).render('error', {
    codigo: 404,
    titulo: 'No encontrado',
    mensaje,
    volverHref: '/',
    volverTexto: 'Ir al inicio',
  });

module.exports = { emitirSocket, flash, render404 };
