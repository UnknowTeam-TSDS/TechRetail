/*
 Controlador de Planes - Con async/await y MongoDB
 TechRetail Solutions S.R.L.
 */

const Plan = require('../models/Plan');
const storage = require('../storage/planesStorage');

// GET /api/planes — Lista todos los planes
const listarPlanes = async (req, res) => {
  try {
    const planes = await storage.leerPlanes();
    res.json({ 
      ok: true, 
      cantidad: planes.length, 
      datos: planes 
    });
  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error al obtener planes',
      error: error.message 
    });
  }
};

// GET /api/planes/:id — Obtiene un plan por ID
const obtenerPlan = async (req, res) => {
  try {
    const plan = await storage.buscarPorId(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ 
        ok: false,
        mensaje: `Plan con id ${req.params.id} no encontrado.` 
      });
    }
    
    res.json({ ok: true, datos: plan });
  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error al obtener el plan',
      error: error.message 
    });
  }
};

// POST /api/planes — Crea un nuevo plan
const crearPlan = async (req, res) => {
  try {
    // Crear una instancia de Plan para validación
    const nuevoPlan = new Plan(req.body);
    
    // Guardar en la base de datos
    const planGuardado = await storage.agregar(req.body);
    
    res.status(201).json({ 
      ok: true, 
      mensaje: 'Plan creado correctamente.',
      datos: planGuardado 
    });
  } catch (error) {
    // Mongoose lanza errores de validación con .errors
    if (error.errors) {
      const mensajesError = Object.keys(error.errors)
        .map(campo => error.errors[campo].message)
        .join(', ');
      return res.status(400).json({ 
        ok: false, 
        mensaje: `Error de validación: ${mensajesError}` 
      });
    }
    
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error al crear el plan',
      error: error.message 
    });
  }
};

// PUT /api/planes/:id — Actualiza un plan existente
const actualizarPlan = async (req, res) => {
  try {
    // Verificar que el plan exista
    const planExistente = await storage.buscarPorId(req.params.id);
    
    if (!planExistente) {
      return res.status(404).json({ 
        ok: false, 
        mensaje: `Plan con id ${req.params.id} no encontrado.` 
      });
    }
    
    // Actualizar el plan
    const planActualizado = await storage.actualizar(req.params.id, req.body);
    
    res.json({ 
      ok: true, 
      mensaje: 'Plan actualizado correctamente.',
      datos: planActualizado 
    });
  } catch (error) {
    if (error.errors) {
      const mensajesError = Object.keys(error.errors)
        .map(campo => error.errors[campo].message)
        .join(', ');
      return res.status(400).json({ 
        ok: false, 
        mensaje: `Error de validación: ${mensajesError}` 
      });
    }
    
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error al actualizar el plan',
      error: error.message 
    });
  }
};

// DELETE /api/planes/:id — Elimina un plan
const eliminarPlan = async (req, res) => {
  try {
    const resultado = await storage.eliminar(req.params.id);
    
    if (!resultado) {
      return res.status(404).json({ 
        ok: false, 
        mensaje: `Plan ${req.params.id} no encontrado.` 
      });
    }
    
    res.json({ 
      ok: true, 
      mensaje: `Plan ${req.params.id} eliminado correctamente.` 
    });
  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      mensaje: 'Error al eliminar el plan',
      error: error.message 
    });
  }
};

// GET /planes/vista — Renderiza la vista Pug con el listado de planes
const vistaPlanes = async (req, res) => {
  try {
    const planes = await storage.leerPlanes();
    res.render('planes', { 
      titulo: 'Catálogo de Planes', 
      planes: planes 
    });
  } catch (error) {
    res.status(500).render('planes', {
      titulo: 'Catálogo de Planes',
      planes: [],
      error: 'Error al cargar los planes'
    });
  }
};

// POST /planes/form — Crea un plan desde el formulario HTML con PRG
const crearPlanForm = async (req, res) => {
  try {
    // Crear y validar el plan
    const nuevoPlan = new Plan(req.body);
    
    // Si es válido, guardarlo
    if (nuevoPlan.nombre && nuevoPlan.precio > 0 && nuevoPlan.tipo) {
      await storage.agregar(req.body);
    }
    
    // Redirigir a la vista (patrón PRG)
    res.redirect('/planes/vista');
  } catch (error) {
    // En caso de error, redirigir pero se podría mejorar con mensajes flash
    res.redirect('/planes/vista');
  }
};

module.exports = { 
  listarPlanes, 
  obtenerPlan, 
  crearPlan, 
  crearPlanForm, 
  actualizarPlan, 
  eliminarPlan, 
  vistaPlanes 
};