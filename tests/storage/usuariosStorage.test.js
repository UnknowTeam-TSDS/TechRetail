jest.mock('../../src/modules/usuarios/models/Usuario');
jest.mock('../../src/modules/Tienda/models/Tienda');
jest.mock('../../src/modules/Productos/models/Producto');
jest.mock('../../src/modules/Pedidos/models/Pedido');

const Usuario = require('../../src/modules/usuarios/models/Usuario');
const Tienda = require('../../src/modules/Tienda/models/Tienda');
const Producto = require('../../src/modules/Productos/models/Producto');
const Pedido = require('../../src/modules/Pedidos/models/Pedido');
const storage = require('../../src/modules/usuarios/storage/usuariosStorage');

describe('Usuarios Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('eliminar', () => {
    test('elimina la tienda y productos asociados al usuario', async () => {
      Usuario.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: 'user-id' });
      Tienda.find = jest.fn().mockResolvedValue([{ _id: 'tienda-1' }, { _id: 'tienda-2' }]);
      Producto.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 3 });
      Pedido.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 4 });
      Tienda.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 2 });

      const resultado = await storage.eliminar('user-id');

      expect(resultado).toBe(true);
      expect(Usuario.findByIdAndDelete).toHaveBeenCalledWith('user-id');
      expect(Tienda.find).toHaveBeenCalledWith({ usuarioId: 'user-id' });
      expect(Producto.deleteMany).toHaveBeenCalledWith({
        tiendaId: { $in: ['tienda-1', 'tienda-2'] },
      });
      expect(Pedido.deleteMany).toHaveBeenCalledWith({
        tiendaId: { $in: ['tienda-1', 'tienda-2'] },
      });
      expect(Tienda.deleteMany).toHaveBeenCalledWith({
        _id: { $in: ['tienda-1', 'tienda-2'] },
      });
    });

    test('no intenta borrar tienda si el usuario no existe', async () => {
      Usuario.findByIdAndDelete = jest.fn().mockResolvedValue(null);

      const resultado = await storage.eliminar('user-id');

      expect(resultado).toBe(false);
      expect(Tienda.find).not.toHaveBeenCalled();
      expect(Producto.deleteMany).not.toHaveBeenCalled();
      expect(Pedido.deleteMany).not.toHaveBeenCalled();
      expect(Tienda.deleteMany).not.toHaveBeenCalled();
    });

    test('no intenta borrar productos si el usuario no tenia tienda', async () => {
      Usuario.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: 'user-id' });
      Tienda.find = jest.fn().mockResolvedValue([]);

      const resultado = await storage.eliminar('user-id');

      expect(resultado).toBe(true);
      expect(Producto.deleteMany).not.toHaveBeenCalled();
      expect(Pedido.deleteMany).not.toHaveBeenCalled();
      expect(Tienda.deleteMany).not.toHaveBeenCalled();
    });
  });
});
