const Plan = require('../../src/modules/Planes/models/Plan');

describe('Modelo Plan - validaciones de schema', () => {
  test('falla si falta el nombre', async () => {
    const plan = new Plan({ descripcion: 'Test', precio: 15000, tipo: 'plan' });
    await expect(plan.validate()).rejects.toThrow();
  });

  test('falla si el nombre tiene menos de 3 caracteres', async () => {
    const plan = new Plan({ nombre: 'AB', descripcion: 'Test', precio: 15000, tipo: 'plan' });
    await expect(plan.validate()).rejects.toThrow();
  });

  test('falla si falta la descripcion', async () => {
    const plan = new Plan({ nombre: 'Starter', precio: 15000, tipo: 'plan' });
    await expect(plan.validate()).rejects.toThrow();
  });

  test('falla si el precio es 0', async () => {
    const plan = new Plan({ nombre: 'Starter', descripcion: 'Plan basico', precio: 0, tipo: 'plan' });
    await expect(plan.validate()).rejects.toThrow();
  });

  test('falla si el precio es negativo', async () => {
    const plan = new Plan({ nombre: 'Starter', descripcion: 'Plan basico', precio: -500, tipo: 'plan' });
    await expect(plan.validate()).rejects.toThrow();
  });

  test('falla si el tipo no es "plan" ni "addon"', async () => {
    const plan = new Plan({ nombre: 'Starter', descripcion: 'Plan basico', precio: 15000, tipo: 'premium' });
    await expect(plan.validate()).rejects.toThrow();
  });

  test('es valido con tipo "plan" y datos correctos', async () => {
    const plan = new Plan({ nombre: 'Starter', descripcion: 'Plan basico de acceso', precio: 15000, tipo: 'plan' });
    await expect(plan.validate()).resolves.toBeUndefined();
  });

  test('acepta un add-on gratuito', async () => {
    const plan = new Plan({ nombre: 'Onboarding', descripcion: 'Asesoría inicial', precio: 0, tipo: 'addon' });
    await expect(plan.validate()).resolves.toBeUndefined();
  });

  test('es valido con tipo "addon"', async () => {
    const plan = new Plan({ nombre: 'Soporte 24/7', descripcion: 'Soporte tecnico prioritario', precio: 5000, tipo: 'addon' });
    await expect(plan.validate()).resolves.toBeUndefined();
  });
});
