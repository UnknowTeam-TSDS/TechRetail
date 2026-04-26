/*
 Clase Usuario - Modelo de datos para clientes/tiendas registradas
 TechRetail Solutions S.R.L.
 */

const PLANES_VALIDOS = ['Starter', 'Growth', 'Pro'];
const usuarios = require('../storage/usuariosStorage');

class Usuario {
  constructor({ id = null, nombre, email, plan = 'Starter', empresa = '' }) {
    // Genera un ID autoincremental basado en el máximo ID existente en el JSON
    this.id = id ?? (() => {
      const l = usuarios.leerUsuarios();
      return l.length === 0 ? 1 : Math.max(...l.map(u => u.id)) + 1;
    })();
    this.nombre = nombre;
    this.email = email;
    this.plan = plan;       // Plan contratado: Starter, Growth o Pro
    this.empresa = empresa;
    this.activo = true;     // Todo usuario nuevo se crea como activo por defecto
    this.fechaRegistro = new Date().toISOString();
  }

  // Valida que el usuario tenga los datos mínimos requeridos
  esValido() {
    return (
      this.nombre &&
      this.email &&
      this.email.includes('@') &&      // Verifica formato básico de email
      PLANES_VALIDOS.includes(this.plan)
    );
  }

  // Retorna el precio mensual según el plan contratado
  getPrecioMensual() {
    const precios = {
      Starter: 12000,
      Growth: 28000,
      Pro: 55000,
    };
    return precios[this.plan] ?? 0;
  }

  // Retorna representación resumida del usuario
  resumen() {
    return `[${this.id}] ${this.nombre} (${this.empresa}) - Plan: ${this.plan}`;
  }
}

module.exports = Usuario;
