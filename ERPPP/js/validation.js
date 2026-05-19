/* Validaciones propias del sistema */

function validateForm(formId, rules) {
  const form = document.getElementById(formId);
  let valid = true;

  form.querySelectorAll('.custom-error').forEach(el => el.remove());
  form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

  Object.entries(rules).forEach(([fieldId, checks]) => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const value = field.value.trim();

    for (const check of checks) {
      if (!check.test(value, field)) {
        field.classList.add('is-invalid');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'custom-error';
        errorDiv.textContent = check.msg;
        field.parentElement.appendChild(errorDiv);
        valid = false;
        break;
      }
    }
  });

  return valid;
}

const V = {
  required: (msg = 'Campo requerido') => ({
    test: v => v.length > 0,
    msg
  }),
  minLength: (min, msg) => ({
    test: v => v.length >= min,
    msg: msg || `Mínimo ${min} caracteres`
  }),
  maxLength: (max, msg) => ({
    test: v => v.length <= max,
    msg: msg || `Máximo ${max} caracteres`
  }),
  exactLength: (len, msg) => ({
    test: v => v.length === len,
    msg: msg || `Debe tener exactamente ${len} caracteres`
  }),
  numeric: (msg = 'Solo números') => ({
    test: v => /^\d+$/.test(v),
    msg
  }),
  phone: (msg = 'Teléfono inválido (9 dígitos)') => ({
    test: v => /^9\d{8}$/.test(v),
    msg
  }),
  dni: (msg = 'DNI inválido (8 dígitos)') => ({
    test: v => /^\d{8}$/.test(v),
    msg
  }),
  minValue: (min, msg) => ({
    test: v => parseFloat(v) >= min,
    msg: msg || `Valor mínimo: ${min}`
  }),
  notEmpty: (msg = 'Seleccione una opción') => ({
    test: v => v !== '' && v !== null,
    msg
  }),
  alphaSpaces: (msg = 'Solo letras y espacios') => ({
    test: v => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(v),
    msg
  }),
  username: (msg = 'Solo letras minúsculas y números') => ({
    test: v => /^[a-z0-9]+$/.test(v),
    msg
  })
};
