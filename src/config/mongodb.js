/*
  Configuración de conexión a MongoDB
  TechRetail Solutions S.R.L.
 */

const mongoose = require('mongoose');
const { seedPlanes } = require('./seed');  // ← AGREGAR ESTA LÍNEA

// URL de conexión
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/techretail';

// Conectar a MongoDB
const conectarMongoDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Conectado a MongoDB correctamente');
    
    // Ejecutar seed de datos por defecto
    await seedPlanes();  // ← AGREGAR ESTA LÍNEA
    
  } catch (error) {
    console.error('✗ Error al conectar a MongoDB:', error.message);
    console.warn('⚠ Continuando sin base de datos...');
  }
};

module.exports = { conectarMongoDB, MONGO_URI };