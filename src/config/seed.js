/*
  Seed - Datos iniciales para MongoDB
  TechRetail Solutions S.R.L.
 */

const Plan = require('../modules/Planes/models/Plan');
const Usuario = require('../modules/usuarios/models/Usuario');

const seedPlanes = async () => {
  try {
    const catalogoCanónico = [
      // Planes de suscripción (del relevamiento IS, sección 3.2)
      {
        nombre: 'Starter',
        descripcion: 'Plan inicial para emprendedores digitales. Incluye tienda online, catálogo de hasta 100 productos y soporte por chat.',
        precio: 12000,
        tipo: 'plan',
        activo: true,
      },
      {
        nombre: 'Growth',
        descripcion: 'Plan para PyMEs en crecimiento. Catálogo ilimitado, reportes de ventas, integración con métodos de pago y soporte prioritario.',
        precio: 32000,
        tipo: 'plan',
        activo: true,
      },
      {
        nombre: 'Pro',
        descripcion: 'Plan avanzado para negocios establecidos. Todas las funciones, multi-usuario, API de integración y soporte dedicado.',
        precio: 55000,
        tipo: 'plan',
        activo: true,
      },
      // Add-ons (módulos opcionales del relevamiento IS, sección 6.2)
      {
        nombre: 'Guía de Onboarding',
        descripcion: 'Sesión personalizada con un asesor de TechRetail para la puesta a punto inicial de tu tienda. Incluye configuración guiada, carga del catálogo y primera venta de prueba.',
        precio: 0,
        tipo: 'addon',
        activo: true,
      },
      {
        nombre: 'Conector ERP',
        descripcion: 'Sincronización automática y bidireccional del catálogo con Tango Gestión y Bejerman. Actualiza precios y stock en tiempo real.',
        precio: 8000,
        tipo: 'addon',
        activo: true,
      },
      {
        nombre: 'Facturación Electrónica ARCA',
        descripcion: 'Emisión automática de Facturas A, B y C con CAE mediante WSFEv1. Cumplimiento fiscal garantizado ante cada venta.',
        precio: 5000,
        tipo: 'addon',
        activo: true,
      },
    ];

    // Eliminar planes/add-ons que no están en el catálogo canónico
    const nombresCanónicos = catalogoCanónico.map(p => p.nombre);
    await Plan.deleteMany({ nombre: { $nin: nombresCanónicos } });

    // Upsert por nombre: actualiza si ya existe, crea si no existe
    for (const datos of catalogoCanónico) {
      await Plan.findOneAndUpdate(
        { nombre: datos.nombre },
        datos,
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }

    console.log(`✓ Catálogo de planes y add-ons sincronizado (${catalogoCanónico.length} items)`);
  } catch (error) {
    console.error('✗ Error al sincronizar planes:', error.message);
  }
};

// Crear admin por defecto
const seedAdmin = async () => {
  try {
    const adminExistente = await Usuario.findOne({ rol: 'admin' });
    
    if (adminExistente) {
      console.log('✓ Admin ya existe en la BD');
      return;
    }

    // Crear admin (la contraseña se hashea automáticamente en el middleware)
    await Usuario.create({
      nombre: 'Administrador',
      email: 'admin@techretail.com',
      telefono: '3413838854',
      contrasena: '123456', // Se hashea en el middleware pre save
      rol: 'admin',
      estado: 'activo',
    });

    console.log('✓ Admin por defecto creado');
  } catch (error) {
    console.error('✗ Error al crear admin por defecto:', error.message);
  }
};

module.exports = { seedPlanes, seedAdmin };