const obtenerEstadoSuscripcion = (usuario, ahora = new Date()) => {
  const trialHasta = usuario?.trialHasta ? new Date(usuario.trialHasta) : null;
  const cuentaActiva = !usuario?.estado || usuario.estado === 'activo';
  const enTrial = !!(trialHasta && trialHasta > ahora);
  const trialVencido = !!(trialHasta && trialHasta <= ahora);
  const planPago = !!(cuentaActiva && usuario?.planId && !trialHasta);

  return {
    enTrial,
    trialVencido,
    planPago,
    suscripcionActiva: cuentaActiva && (planPago || enTrial),
  };
};

module.exports = { obtenerEstadoSuscripcion };