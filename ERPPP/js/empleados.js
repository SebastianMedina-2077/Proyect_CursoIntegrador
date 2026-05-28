/* empleados.js — CRUD empleados y usuarios */

// ── STATE ──
let empTab = 'empleados';
let editingEmpId = null;
let editingUsrId = null;

// ── SERVICE ──
async function getEmpleadosData() {
  return { empleados: await dbGetAll('empleados'), usuarios: await dbGetAll('usuarios') };
}

async function saveEmpleado(data) {
  if (editingEmpId) { data.id = editingEmpId; await dbPut('empleados', data); editingEmpId = null; return 'updated'; }
  await dbAdd('empleados', data); return 'created';
}

async function deleteEmpleado(id) { await dbDelete('empleados', id); }
async function getEmpleadoById(id) { return dbGet('empleados', id); }

async function saveUsuario(data) {
  if (editingUsrId) { data.id = editingUsrId; await dbPut('usuarios', data); editingUsrId = null; return 'updated'; }
  await dbAdd('usuarios', data); return 'created';
}

async function deleteUsuarioById(id) { await dbDelete('usuarios', id); }
async function getUsuarioById(id) { return dbGet('usuarios', id); }

// ── VIEW (solo filas dinámicas) ──
function buildEmpleadoRow(e) {
  return `<tr>
    <td>${e.nombre} ${e.apellido}</td><td>${e.dni}</td><td>${e.telefono}</td><td>${e.cargo}</td>
    <td>${tplBadge(capitalize(e.estado), e.estado === 'activo' ? 'text-bg-success' : 'text-bg-secondary')}</td>
    <td><div class="d-flex gap-1">
      <button class="btn btn-sm btn-outline-secondary" onclick="editarEmpleado(${e.id})"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-sm btn-outline-danger" onclick="eliminarEmpleado(${e.id})"><i class="fa-solid fa-trash"></i></button>
    </div></td>
  </tr>`;
}

function buildUsuarioRow(u) {
  return `<tr>
    <td>${u.username}</td><td>${u.codigo || '—'}</td><td>${capitalize(u.rol)}</td><td>${u.nombre}</td>
    <td>${tplBadge(capitalize(u.estado), u.estado === 'activo' ? 'text-bg-success' : 'text-bg-secondary')}</td>
    <td><div class="d-flex gap-1">
      <button class="btn btn-sm btn-outline-secondary" onclick="editarUsuario(${u.id})"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario(${u.id})"><i class="fa-solid fa-trash"></i></button>
    </div></td>
  </tr>`;
}

function buildEmpOption(e) {
  return `<option value="${e.nombre} ${e.apellido}">${e.nombre} ${e.apellido}</option>`;
}

// ── CONTROLLER ──
async function renderEmpleados() {
  const { empleados, usuarios } = await getEmpleadosData();
  const mc = document.getElementById('moduleContent');
  mc.innerHTML = '';
  mc.appendChild(document.getElementById('tplEmpTabs').content.cloneNode(true));

  // Tabs activa
  const activeTab = empTab === 'empleados' ? 'tabEmpleados' : 'tabUsuarios';
  document.getElementById(activeTab).classList.add('active', 'bg-brand-light', 'text-brand-dark');
  document.getElementById('tabEmpleados').addEventListener('click', () => switchEmpTab('empleados'));
  document.getElementById('tabUsuarios').addEventListener('click', () => switchEmpTab('usuarios'));

  if (empTab === 'empleados') renderEmpleadosTab(empleados);
  else renderUsuariosTab(usuarios, empleados);
}

function renderEmpleadosTab(empleados) {
  const container = document.getElementById('empContent');
  container.innerHTML = '';
  container.appendChild(document.getElementById('tplEmpForm').content.cloneNode(true));
  document.getElementById('empTableBody').innerHTML = empleados.map(buildEmpleadoRow).join('');
  document.getElementById('formEmp').addEventListener('submit', handleEmpSubmit);
  document.getElementById('empCancelBtn').addEventListener('click', cancelEditEmp);
}

function renderUsuariosTab(usuarios, empleados) {
  const container = document.getElementById('empContent');
  container.innerHTML = '';
  container.appendChild(document.getElementById('tplUsrForm').content.cloneNode(true));

  // Opciones dinámicas del select empleado
  const sel = document.getElementById('usrEmpleado');
  empleados.forEach(e => sel.insertAdjacentHTML('beforeend', buildEmpOption(e)));

  document.getElementById('usrTableBody').innerHTML = usuarios.map(buildUsuarioRow).join('');
  document.getElementById('formUsr').addEventListener('submit', handleUsrSubmit);
  document.getElementById('usrCancelBtn').addEventListener('click', cancelEditUsr);
}

// ── HANDLERS ──
async function handleEmpSubmit(e) {
  e.preventDefault();
  if (!validateForm('formEmp', {
    empNombre: [V.required(), V.minLength(2), V.alphaSpaces()],
    empApellido: [V.required(), V.minLength(2), V.alphaSpaces()],
    empDni: [V.required(), V.dni()],
    empTel: [V.required(), V.phone()],
    empCargo: [V.notEmpty('Seleccione un cargo')]
  })) return;

  const result = await saveEmpleado({
    nombre: document.getElementById('empNombre').value.trim(),
    apellido: document.getElementById('empApellido').value.trim(),
    dni: document.getElementById('empDni').value.trim(),
    telefono: document.getElementById('empTel').value.trim(),
    cargo: document.getElementById('empCargo').value,
    estado: document.getElementById('empEstado').value
  });
  showToast(result === 'updated' ? 'Empleado actualizado' : 'Empleado registrado', 'success');
  renderEmpleados();
}

async function handleUsrSubmit(e) {
  e.preventDefault();
  if (!validateForm('formUsr', {
    usrUsername: [V.required(), V.minLength(3), V.username()],
    usrPassword: [V.required(), V.minLength(4)],
    usrCodigo: [V.required(), V.minLength(3)],
    usrRol: [V.notEmpty('Seleccione un rol')]
  })) return;

  const result = await saveUsuario({
    username: document.getElementById('usrUsername').value.trim(),
    password: document.getElementById('usrPassword').value,
    codigo: document.getElementById('usrCodigo').value.trim(),
    rol: document.getElementById('usrRol').value,
    nombre: document.getElementById('usrEmpleado').value || document.getElementById('usrUsername').value.trim(),
    estado: document.getElementById('usrEstado').value
  });
  showToast(result === 'updated' ? 'Usuario actualizado' : 'Usuario registrado', 'success');
  renderEmpleados();
}

function switchEmpTab(tab) { empTab = tab; editingEmpId = null; editingUsrId = null; renderEmpleados(); }

async function eliminarEmpleado(id) {
  if (!confirm('¿Eliminar este empleado?')) return;
  await deleteEmpleado(id);
  showToast('Empleado eliminado', 'danger');
  renderEmpleados();
}

async function eliminarUsuario(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  await deleteUsuarioById(id);
  showToast('Usuario eliminado', 'danger');
  renderEmpleados();
}

async function editarEmpleado(id) {
  const e = await getEmpleadoById(id);
  if (!e) return;
  editingEmpId = id;
  document.getElementById('empNombre').value = e.nombre;
  document.getElementById('empApellido').value = e.apellido;
  document.getElementById('empDni').value = e.dni;
  document.getElementById('empTel').value = e.telefono;
  document.getElementById('empCargo').value = e.cargo;
  document.getElementById('empEstado').value = e.estado;
  document.getElementById('empFormTitle').textContent = 'Editar empleado';
  document.getElementById('empSubmitBtn').innerHTML = '<i class="fa-solid fa-save"></i> Actualizar';
  document.getElementById('empCancelBtn').classList.remove('d-none');
}

async function editarUsuario(id) {
  const u = await getUsuarioById(id);
  if (!u) return;
  editingUsrId = id;
  document.getElementById('usrUsername').value = u.username;
  document.getElementById('usrPassword').value = u.password;
  document.getElementById('usrCodigo').value = u.codigo || '';
  document.getElementById('usrRol').value = u.rol;
  document.getElementById('usrEstado').value = u.estado;
  document.getElementById('usrFormTitle').textContent = 'Editar usuario';
  document.getElementById('usrSubmitBtn').innerHTML = '<i class="fa-solid fa-save"></i> Actualizar';
  document.getElementById('usrCancelBtn').classList.remove('d-none');
}

function cancelEditEmp() { editingEmpId = null; renderEmpleados(); }
function cancelEditUsr() { editingUsrId = null; renderEmpleados(); }
