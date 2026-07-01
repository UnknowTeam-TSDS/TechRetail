const Usuario = require('../../usuarios/models/Usuario');
const pedidosStorage = require('../../Pedidos/storage/pedidosStorage');

// GET /finanzas — reporte de conciliación (RF-03). Solo lectura, solo admin.
// Cruza los ingresos recurrentes (planes + add-ons) con las ventas simuladas
// registradas en los pedidos. Todo en pesos argentinos.
const vistaFinanzas = async (req, res) => {
  try {
    const ahora = new Date();
    const [clientes, resumenPedidos] = await Promise.all([
      Usuario.find({ rol: 'cliente' }), // planId y addons se populan por hook del modelo
      pedidosStorage.resumenPorEstado(),
    ]);

    // Ingresos recurrentes: solo clientes con plan pago (excluye trials).
    let mrr = 0;
    let ingresosAddons = 0;
    const ingresosPorPlan = {};

    clientes.forEach((u) => {
      const enTrial = u.trialHasta && u.trialHasta > ahora;
      if (u.planId && !enTrial) {
        const precio = u.planId.precio || 0;
        mrr += precio;
        const nombre = u.planId.nombre || 'Sin nombre';
        ingresosPorPlan[nombre] = (ingresosPorPlan[nombre] || 0) + precio;
      }
      // Los add-ons contratados suman su precio (los gratuitos suman 0).
      (u.addons || []).forEach((addon) => { ingresosAddons += addon.precio || 0; });
    });

    // Pedidos agrupados por estado (cantidad y monto).
    const estadosPedidos = {
      pendiente: { cantidad: 0, total: 0 },
      confirmado: { cantidad: 0, total: 0 },
      cancelado: { cantidad: 0, total: 0 },
    };
    resumenPedidos.forEach((r) => {
      if (estadosPedidos[r._id]) estadosPedidos[r._id] = { cantidad: r.cantidad, total: r.total };
    });

    res.render('finanzas', {
      titulo: 'Finanzas',
      mrr,
      ingresosAddons,
      ingresoMensualTotal: mrr + ingresosAddons,
      ingresosPorPlan,
      estadosPedidos,
      ventasConfirmadas: estadosPedidos.confirmado.total,
    });
  } catch (error) {
    console.error('Error cargando finanzas:', error.message);
    res.redirect('/');
  }
};

module.exports = { vistaFinanzas };
