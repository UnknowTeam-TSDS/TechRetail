const Plan = require('../models/Plan');
const storage = require('../storage/planesStorage');

const listarPlanes = (req, res) => {
  const planes = storage.leerPlanes();
  res.json({ ok: true, cantidad: planes.length, datos: planes });
};

const obtenerPlan = (req, res) => {
  const plan = storage.buscarPorId(req.params.id);
  if (!plan) return res.status(404).json({ ok: false, mensaje: `Plan con id ${req.params.id} no encontrado.` });
  res.json({ ok: true, datos: plan });
};

const crearPlan = (req, res) => {
  const nuevoPlan = new Plan(req.body);
  if (!nuevoPlan.esValido()) {
    return res.status(400).json({ ok: false, mensaje: 'Datos inválidos.' });
  }
  storage.agregar(nuevoPlan);
  res.redirect('/planes/vista');
};

const actualizarPlan = (req, res) => {
  if (!storage.buscarPorId(req.params.id)) {
    return res.status(404).json({ ok: false, mensaje: `Plan con id ${req.params.id} no encontrado.` });
  }
  storage.actualizar(req.params.id, req.body);
  res.json({ ok: true, mensaje: 'Plan actualizado.', datos: storage.buscarPorId(req.params.id) });
};

const eliminarPlan = (req, res) => {
  if (!storage.eliminar(req.params.id)) {
    return res.status(404).json({ ok: false, mensaje: `Plan ${req.params.id} no encontrado.` });
  }
  res.redirect('/planes/vista');
};

const vistaPlanes = (req, res) => {
  res.render('planes', { titulo: 'Catálogo de Planes', planes: storage.leerPlanes() });
};

module.exports = { listarPlanes, obtenerPlan, crearPlan, actualizarPlan, eliminarPlan, vistaPlanes };