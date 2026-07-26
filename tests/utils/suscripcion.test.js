const { obtenerEstadoSuscripcion } = require('../../src/utils/suscripcion');

describe('Estado de suscripción', () => {
  test('considera activo un plan pagado sin trial', () => {
    expect(obtenerEstadoSuscripcion({ planId: 'plan-id', trialHasta: null })).toEqual({
      enTrial: false,
      trialVencido: false,
      planPago: true,
      suscripcionActiva: true,
    });
  });

  test('considera activa una prueba vigente, pero no como plan pago', () => {
    const ahora = new Date('2026-07-01T00:00:00Z');
    const estado = obtenerEstadoSuscripcion(
      { planId: 'plan-id', trialHasta: new Date('2026-07-10T00:00:00Z') },
      ahora
    );

    expect(estado.enTrial).toBe(true);
    expect(estado.planPago).toBe(false);
    expect(estado.suscripcionActiva).toBe(true);
  });

  test('una cuenta suspendida no mantiene activa la suscripción', () => {
    const estado = obtenerEstadoSuscripcion({
      estado: 'suspendido', planId: 'plan-id', trialHasta: null,
    });

    expect(estado.planPago).toBe(false);
    expect(estado.suscripcionActiva).toBe(false);
  });

  test('una prueba vencida no mantiene activa la suscripción', () => {
    const ahora = new Date('2026-07-20T00:00:00Z');
    const estado = obtenerEstadoSuscripcion(
      { planId: 'plan-id', trialHasta: new Date('2026-07-10T00:00:00Z') },
      ahora
    );

    expect(estado.trialVencido).toBe(true);
    expect(estado.planPago).toBe(false);
    expect(estado.suscripcionActiva).toBe(false);
  });
});