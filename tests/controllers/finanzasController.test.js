jest.mock('../../src/modules/usuarios/models/Usuario');
jest.mock('../../src/modules/Pedidos/storage/pedidosStorage');

const Usuario = require('../../src/modules/usuarios/models/Usuario');
const pedidosStorage = require('../../src/modules/Pedidos/storage/pedidosStorage');
const { vistaFinanzas } = require('../../src/modules/Finanzas/controllers/finanzasController');

describe('Finanzas Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = { render: jest.fn(), redirect: jest.fn() };
    jest.clearAllMocks();
  });

  test('calcula MRR, add-ons y ventas confirmadas (excluye trials)', async () => {
    const trialFuturo = new Date(Date.now() + 86400000);
    Usuario.find = jest.fn().mockResolvedValue([
      { planId: { nombre: 'Pro', precio: 55000 }, trialHasta: null, addons: [{ precio: 8000 }] },
      { planId: { nombre: 'Starter', precio: 12000 }, trialHasta: trialFuturo, addons: [] }, // en trial → no suma MRR
      { planId: null, trialHasta: null, addons: [] }, // sin plan → no suma
    ]);
    pedidosStorage.resumenPorEstado = jest.fn().mockResolvedValue([
      { _id: 'confirmado', cantidad: 2, total: 20000 },
      { _id: 'pendiente', cantidad: 1, total: 5000 },
    ]);

    await vistaFinanzas(req, res);

    expect(res.render).toHaveBeenCalledWith('finanzas', expect.objectContaining({
      mrr: 55000,
      ingresosAddons: 8000,
      ingresoMensualTotal: 63000,
      ventasConfirmadas: 20000,
    }));
  });

  test('redirige al panel si ocurre un error', async () => {
    Usuario.find = jest.fn().mockRejectedValue(new Error('DB error'));
    pedidosStorage.resumenPorEstado = jest.fn().mockResolvedValue([]);

    await vistaFinanzas(req, res);

    expect(res.redirect).toHaveBeenCalledWith('/');
  });
});
