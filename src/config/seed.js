/*
  Seed - Datos iniciales para MongoDB
  TechRetail Solutions S.R.L.
  
  Este archivo crea planes por defecto si la BD está vacía
 */

const Plan = require('../modules/Planes/models/Plan');

const seedPlanes = async () => {
  try {
    // Verificar si ya hay planes
    const planesExistentes = await Plan.countDocuments();
    
    if (planesExistentes > 0) {
      console.log('✓ Planes ya existen en la BD');
      return;
    }

    // Si no hay planes, crearlos
    const planesDefault = [
      {
        nombre: 'Starter',
        descripcion: 'Plan básico para empezar tu negocio digital',
        precio: 15000,
        tipo: 'plan',
        activo: true,
      },
      {
        nombre: 'Growth',
        descripcion: 'Plan para crecer y escalar tu negocio',
        precio: 40000,
        tipo: 'plan',
        activo: true,
      },
      {
        nombre: 'Pro',
        descripcion: 'Plan profesional con todas las features',
        precio: 80000,
        tipo: 'plan',
        activo: true,
      },
    ];

    // Guardar los planes
    await Plan.insertMany(planesDefault);
    console.log('✓ Planes por defecto creados correctamente');
  } catch (error) {
    console.error('✗ Error al crear planes por defecto:', error.message);
  }
};

module.exports = { seedPlanes };