/* validation.js — Bootstrap 5 form validation */

function validateForm(formId, rules) {
  const form = document.getElementById(formId);
  if (!form) return false;
  let valid = true;

  form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

  Object.entries(rules).forEach(([fieldId, checks]) => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    const value = field.value.trim();

    for (const check of checks) {
      if (!check.test(value, field)) {
        field.classList.add('is-invalid');
        const group = field.closest('.input-group, .mb-3, .mb-2, .col');
        const fb = group ? group.querySelector('.invalid-feedback') : field.parentElement.querySelector('.invalid-feedback');
        if (fb) { fb.textContent = check.msg; fb.style.display = 'block'; }
        valid = false;
        break;
      }
    }
  });
  return valid;
}

// Auto-limpiar error al escribir
document.addEventListener('input', e => {
  if (e.target.classList.contains('is-invalid')) {
    e.target.classList.remove('is-invalid');
    const group = e.target.closest('.input-group, .mb-3, .mb-2, .col');
    const fb = group ? group.querySelector('.invalid-feedback') : e.target.parentElement.querySelector('.invalid-feedback');
    if (fb) fb.style.display = '';
  }
});

// Reglas de validación
const V = {
  required:    (msg = 'Campo requerido') => ({ test: v => v.length > 0, msg }),
  minLength:   (min, msg) => ({ test: v => v.length >= min, msg: msg || `Mínimo ${min} caracteres` }),
  maxLength:   (max, msg) => ({ test: v => v.length <= max, msg: msg || `Máximo ${max} caracteres` }),
  numeric:     (msg = 'Solo números') => ({ test: v => /^\d+$/.test(v), msg }),
  phone:       (msg = 'Teléfono inválido (9 dígitos)') => ({ test: v => /^9\d{8}$/.test(v), msg }),
  dni:         (msg = 'DNI inválido (8 dígitos)') => ({ test: v => /^\d{8}$/.test(v), msg }),
  minValue:    (min, msg) => ({ test: v => parseFloat(v) >= min, msg: msg || `Valor mínimo: ${min}` }),
  notEmpty:    (msg = 'Seleccione una opción') => ({ test: v => v !== '' && v !== null, msg }),
  alphaSpaces: (msg = 'Solo letras y espacios') => ({ test: v => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(v), msg }),
  username:    (msg = 'Solo letras minúsculas y números') => ({ test: v => /^[a-z0-9]+$/.test(v), msg })
};
