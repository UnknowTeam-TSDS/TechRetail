jest.mock('../../src/modules/Planes/storage/planesStorage');

const storage = require('../../src/modules/Planes/storage/planesStorage');
const {
  listarPlanes,
  obtenerPlan,
  crearPlan,
  actualizarPlan,
  eliminarPlan,
  eliminarPlanForm,
  vistaPlanes,
} = require('../../src/modules/Planes/controllers/planesController');

describe('Planes Controller', () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {}, app: { get: jest.fn().mockReturnValue({ emit: jest.fn() }) } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      render: jest.fn(),
      redirect: jest.fn(),
    };
    jest.clearAllMocks();
    storage.estaEnUso = jest.fn().mockResolvedValue(false);
  });

  test('listarPlanes devuelve los planes en JSON', async () => {
    storage.leerPlanes = jest.fn().mockResolvedValue([{ nombre: 'Pro' }]);
    await listarPlanes(req, res);
    expect(res.json).toHaveBeenCalledWith([{ nombre: 'Pro' }]);
  });

  test('obtenerPlan responde 404 si no existe', async () => {
    req.params.id = 'plan-id';
    storage.buscarPorId = jest.fn().mockResolvedValue(null);
    await obtenerPlan(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('obtenerPlan devuelve el plan si existe', async () => {
    req.params.id = 'plan-id';
    storage.buscarPorId = jest.fn().mockResolvedValue({ nombre: 'Pro' });
    await obtenerPlan(req, res);
    expect(res.json).toHaveBeenCalledWith({ ok: true, datos: { nombre: 'Pro' } });
  });

  test('crearPlan crea y responde 201', async () => {
    req.body = { nombre: 'Nuevo Plan', precio: 1000, tipo: 'plan', descripcion: 'desc' };
    storage.agregar = jest.fn().mockResolvedValue({ nombre: 'Nuevo Plan', precio: 1000, tipo: 'plan' });
    await crearPlan(req, res);
    expect(storage.agregar).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('actualizarPlan responde 404 si no existe', async () => {
    req.params.id = 'plan-id';
    storage.buscarPorId = jest.fn().mockResolvedValue(null);
    await actualizarPlan(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('eliminarPlan responde 409 si está asignado a clientes', async () => {
    req.params.id = 'plan-id';
    storage.estaEnUso = jest.fn().mockResolvedValue(true);

    await eliminarPlan(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(storage.eliminar).not.toHaveBeenCalled();
  });
  test('eliminarPlan responde 404 si no existe', async () => {
    req.params.id = 'plan-id';
    storage.eliminar = jest.fn().mockResolvedValue(null);
    await eliminarPlan(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('eliminarPlan elimina y responde ok', async () => {
    req.params.id = 'plan-id';
    storage.eliminar = jest.fn().mockResolvedValue({ _id: 'plan-id' });
    await eliminarPlan(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  test('eliminarPlanForm conserva elementos asignados', async () => {
    req.params.id = 'plan-id';
    storage.estaEnUso = jest.fn().mockResolvedValue(true);

    await eliminarPlanForm(req, res);

    expect(storage.eliminar).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith('/planes/vista');
  });
  test('eliminarPlanForm elimina y vuelve al catálogo', async () => {
    req.params.id = 'plan-id';
    storage.eliminar = jest.fn().mockResolvedValue(true);

    await eliminarPlanForm(req, res);

    expect(storage.eliminar).toHaveBeenCalledWith('plan-id');
    expect(res.redirect).toHaveBeenCalledWith('/planes/vista');
  });

  test('vistaPlanes renderiza la vista con los planes', async () => {
    storage.leerPlanes = jest.fn().mockResolvedValue([{ nombre: 'Pro' }]);
    await vistaPlanes(req, res);
    expect(res.render).toHaveBeenCalledWith('planes', expect.objectContaining({ planes: [{ nombre: 'Pro' }] }));
  });
});
