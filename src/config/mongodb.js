/*
  Configuración de conexión a MongoDB
  TechRetail Solutions S.R.L.
 */

const mongoose = require('mongoose');
const { seedPlanes, seedAdmin } = require('./seed');

// URL de conexión
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/techretail';

// Conectar a MongoDB
const conectarMongoDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Conectado a MongoDB correctamente');
    
    // Ejecutar seeds
    await seedPlanes();
    await seedAdmin();
    
  } catch (error) {
    console.error('✗ Error al conectar a MongoDB:', error.message);
    throw error;
  }
};

module.exports = { conectarMongoDB, MONGO_URI };