/*
  Política de contraseña segura (lado servidor).
  Devuelve un mensaje de error en español si la contraseña no cumple,
  o null si es válida. Espejo de la validación en public/js/password.js.
*/
const validarContrasenaSegura = (contrasena) => {
  if (!contrasena || contrasena.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }
  if (!/[a-z]/.test(contrasena)) {
    return 'La contraseña debe incluir al menos una letra minúscula.';
  }
  if (!/[A-Z]/.test(contrasena)) {
    return 'La contraseña debe incluir al menos una letra mayúscula.';
  }
  if (!/\d/.test(contrasena)) {
    return 'La contraseña debe incluir al menos un número.';
  }
  if (!/[^A-Za-z0-9]/.test(contrasena)) {
    return 'La contraseña debe incluir al menos un símbolo (por ejemplo: ! @ # $ %).';
  }
  return null;
};

module.exports = { validarContrasenaSegura };
