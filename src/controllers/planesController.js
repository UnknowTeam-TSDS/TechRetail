/*
 Controlador de Planes
 TechRetail Solutions S.R.L.
 */

const Plan = require('../models/Plan');
const storage = require('../storage/planesStorage');

// GET /api/planes — Lista todos los planes
const listarPlanes = (req, res) => {
  const planes = storage.leerPlanes();
  res.json({ ok: true, cantidad: planes.length, datos: planes });
};

// GET /api/planes/:id — Obtiene un plan por ID (ruta dinámica)
const obtenerPlan = (req, res) => {
  const plan = storage.buscarPorId(req.params.id);
  if (!plan) return res.status(404).json({ ok: false, mensaje: `Plan con id ${req.params.id} no encontrado.` });
  res.json({ ok: true, datos: plan });
};

// POST /api/planes — Crea un nuevo plan
const crearPlan = (req, res) => {
  const nuevoPlan = new Plan(req.body);
  if (!nuevoPlan.esValido()) {
    return res.status(400).json({ ok: false, mensaje: 'Datos inválidos. Se requiere: nombre, precio > 0 y tipo.' });
  }
  storage.agregar(nuevoPlan);
  res.status(201).json({ ok: true, mensaje: 'Plan creado.', datos: nuevoPlan });
};

// PUT /api/planes/:id — Actualiza un plan existente
const actualizarPlan = (req, res) => {
  if (!storage.buscarPorId(req.params.id)) {
    return res.status(404).json({ ok: false, mensaje: `Plan con id ${req.params.id} no encontrado.` });
  }
  storage.actualizar(req.params.id, req.body);
  res.json({ ok: true, mensaje: 'Plan actualizado.', datos: storage.buscarPorId(req.params.id) });
};

// DELETE /api/planes/:id — Elimina un plan
const eliminarPlan = (req, res) => {
  if (!storage.eliminar(req.params.id)) {
    return res.status(404).json({ ok: false, mensaje: `Plan ${req.params.id} no encontrado.` });
  }
  res.json({ ok: true, mensaje: `Plan ${req.params.id} eliminado.` });
};

// GET /planes/vista — Renderiza la vista Pug con el listado de planes
const vistaPlanes = (req, res) => {
  res.render('planes', { titulo: 'Catálogo de Planes', planes: storage.leerPlanes() });
};

// POST /planes/form — Crea un plan desde el formulario HTML y redirige a la vista
// Se usa el patrón PRG (Post/Redirect/Get) para evitar reenvíos duplicados al recargar
const crearPlanForm = (req, res) => {
  const nuevoPlan = new Plan(req.body);
  if (nuevoPlan.esValido()) storage.agregar(nuevoPlan);
  res.redirect('/planes/vista');
};

module.exports = { listarPlanes, obtenerPlan, crearPlan, crearPlanForm, actualizarPlan, eliminarPlan, vistaPlanes };
