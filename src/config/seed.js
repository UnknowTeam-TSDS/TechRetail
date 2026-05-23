/*
  Seed - Datos iniciales para MongoDB
  TechRetail Solutions S.R.L.
 */

const Plan = require('../modules/Planes/models/Plan');
const Usuario = require('../modules/usuarios/models/Usuario');

const seedPlanes = async () => {
  try {
    const planesExistentes = await Plan.countDocuments();
    
    if (planesExistentes > 0) {
      console.log('✓ Planes ya existen en la BD');
      return;
    }

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
        precio: 45000,
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

    await Plan.insertMany(planesDefault);
    console.log('✓ Planes por defecto creados correctamente');
  } catch (error) {
    console.error('✗ Error al crear planes por defecto:', error.message);
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

    console.log('✓ Admin por defecto creado (email: admin@techretail.com, contraseña: 123456)');
  } catch (error) {
    console.error('✗ Error al crear admin por defecto:', error.message);
  }
};

module.exports = { seedPlanes, seedAdmin };