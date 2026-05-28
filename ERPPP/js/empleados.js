/* empleados.js — CRUD empleados y usuarios */

let empTab = 'empleados';
let editingEmpId = null;  // Fix Bug #2: edición no destructiva
let editingUsrId = null;

async function renderEmpleados() {
  const empleados = await dbGetAll('empleados');
  const usuarios = await dbGetAll('usuarios');

  document.getElementById('moduleContent').innerHTML = `
    <ul class="nav nav-pills mb-3">
      <li class="nav-item">
        <button class="nav-link ${empTab==='empleados'?'active bg-brand-light text-brand-dark':''}" onclick="switchEmpTab('empleados')"><i class="fa-solid fa-users me-1"></i>Empleados</button>
      </li>
      <li class="nav-item">
        <button class="nav-link ${empTab==='usuarios'?'active bg-brand-light text-brand-dark':''}" onclick="switchEmpTab('usuarios')"><i class="fa-solid fa-user-shield me-1"></i>Usuarios</button>
      </li>
    </ul>
    <div id="empContent"></div>`;

  if (empTab === 'empleados') renderEmpleadosTab(empleados);
  else renderUsuariosTab(usuarios, empleados);
}

function renderEmpleadosTab(empleados) {
  const rows = empleados.map(e =>
    `<tr><td>${e.nombre} ${e.apellido}</td><td>${e.dni}</td><td>${e.telefono}</td><td>${e.cargo}</td><td>${tplBadge(capitalize(e.estado), e.estado==='activo'?'text-bg-success':'text-bg-secondary')}</td><td>
      <div class="d-flex gap-1">
        <button class="btn btn-sm btn-outline-secondary" onclick="editarEmpleado(${e.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarEmpleado(${e.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
    </td></tr>`
  ).join('');

  document.getElementById('empContent').innerHTML = `
    <div class="row g-3">
      <div class="col-lg-5">
        <div class="card">
          <div class="card-header"><h6 class="mb-0" id="empFormTitle">Registrar empleado</h6></div>
          <div class="card-body">
            <form id="formEmp" novalidate>
              <div class="row g-2">
                <div class="col-6 mb-2">
                  <label class="form-label">Nombre</label>
                  <input type="text" id="empNombre" class="form-control">
                  <div class="invalid-feedback">Requerido</div>
                </div>
                <div class="col-6 mb-2">
                  <label class="form-label">Apellido</label>
                  <input type="text" id="empApellido" class="form-control">
                  <div class="invalid-feedback">Requerido</div>
                </div>
              </div>
              <div class="row g-2">
                <div class="col-6 mb-2">
                  <label class="form-label">DNI</label>
                  <input type="text" id="empDni" class="form-control" maxlength="8">
                  <div class="invalid-feedback">DNI inválido</div>
                </div>
                <div class="col-6 mb-2">
                  <label class="form-label">Teléfono</label>
                  <input type="tel" id="empTel" class="form-control">
                  <div class="invalid-feedback">Teléfono inválido</div>
                </div>
              </div>
              <div class="row g-2">
                <div class="col-6 mb-2">
                  <label class="form-label">Cargo</label>
                  <select id="empCargo" class="form-select">
                    <option value="">Seleccionar</option>
                    <option>Administrador</option><option>Cajero</option><option>Cocina</option><option>Repartidor</option>
                  </select>
                  <div class="invalid-feedback">Requerido</div>
                </div>
                <div class="col-6 mb-2">
                  <label class="form-label">Estado</label>
                  <select id="empEstado" class="form-select">
                    <option value="activo">Activo</option><option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-brand flex-grow-1" id="empSubmitBtn"><i class="fa-solid fa-plus"></i> Guardar</button>
                <button type="button" class="btn btn-outline-secondary d-none" id="empCancelBtn" onclick="cancelEditEmp()">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="col-lg-7">
        <div class="card">
          <div class="card-header"><h6 class="mb-0">Empleados registrados</h6></div>
          <div class="card-body p-0">${tplTable(['Nombre','DNI','Teléfono','Cargo','Estado','Acciones'], rows)}</div>
        </div>
      </div>
    </div>`;

  document.getElementById('formEmp').addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateForm('formEmp', {
      empNombre: [V.required(), V.minLength(2), V.alphaSpaces()],
      empApellido: [V.required(), V.minLength(2), V.alphaSpaces()],
      empDni: [V.required(), V.dni()],
      empTel: [V.required(), V.phone()],
      empCargo: [V.notEmpty('Seleccione un cargo')]
    })) return;

    const data = {
      nombre: document.getElementById('empNombre').value.trim(),
      apellido: document.getElementById('empApellido').value.trim(),
      dni: document.getElementById('empDni').value.trim(),
      telefono: document.getElementById('empTel').value.trim(),
      cargo: document.getElementById('empCargo').value,
      estado: document.getElementById('empEstado').value
    };

    // Fix Bug #2: usar dbPut si estamos editando
    if (editingEmpId) {
      data.id = editingEmpId;
      await dbPut('empleados', data);
      showToast('Empleado actualizado', 'success');
      editingEmpId = null;
    } else {
      await dbAdd('empleados', data);
      showToast('Empleado registrado', 'success');
    }
    renderEmpleados();
  });
}

function renderUsuariosTab(usuarios, empleados) {
  const rows = usuarios.map(u =>
    `<tr><td>${u.username}</td><td>${u.codigo||'—'}</td><td>${capitalize(u.rol)}</td><td>${u.nombre}</td><td>${tplBadge(capitalize(u.estado), u.estado==='activo'?'text-bg-success':'text-bg-secondary')}</td><td>
      <div class="d-flex gap-1">
        <button class="btn btn-sm btn-outline-secondary" onclick="editarUsuario(${u.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminarUsuario(${u.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
    </td></tr>`
  ).join('');

  const empOpts = empleados.map(e => `<option value="${e.nombre} ${e.apellido}">${e.nombre} ${e.apellido}</option>`).join('');

  document.getElementById('empContent').innerHTML = `
    <div class="row g-3">
      <div class="col-lg-5">
        <div class="card">
          <div class="card-header"><h6 class="mb-0" id="usrFormTitle">Registrar usuario</h6></div>
          <div class="card-body">
            <form id="formUsr" novalidate>
              <div class="mb-2">
                <label class="form-label">Username</label>
                <input type="text" id="usrUsername" class="form-control">
                <div class="invalid-feedback">Requerido</div>
              </div>
              <div class="mb-2">
                <label class="form-label">Contraseña</label>
                <input type="password" id="usrPassword" class="form-control">
                <div class="invalid-feedback">Requerido</div>
              </div>
              <div class="mb-2">
                <label class="form-label">Código</label>
                <input type="text" id="usrCodigo" class="form-control" placeholder="Ej: CAJ-002">
                <div class="invalid-feedback">Requerido</div>
              </div>
              <div class="mb-2">
                <label class="form-label">Rol</label>
                <select id="usrRol" class="form-select">
                  <option value="">Seleccionar</option>
                  <option value="admin">Administrador</option><option value="cajero">Cajero</option><option value="cocina">Cocina</option>
                </select>
                <div class="invalid-feedback">Requerido</div>
              </div>
              <div class="mb-2">
                <label class="form-label">Empleado asociado</label>
                <select id="usrEmpleado" class="form-select"><option value="">Ninguno</option>${empOpts}</select>
              </div>
              <div class="mb-3">
                <label class="form-label">Estado</label>
                <select id="usrEstado" class="form-select"><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select>
              </div>
              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-brand flex-grow-1" id="usrSubmitBtn"><i class="fa-solid fa-plus"></i> Guardar</button>
                <button type="button" class="btn btn-outline-secondary d-none" id="usrCancelBtn" onclick="cancelEditUsr()">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div class="col-lg-7">
        <div class="card">
          <div class="card-header"><h6 class="mb-0">Usuarios del sistema</h6></div>
          <div class="card-body p-0">${tplTable(['Usuario','Código','Rol','Nombre','Estado','Acciones'], rows)}</div>
        </div>
      </div>
    </div>`;

  document.getElementById('formUsr').addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateForm('formUsr', {
      usrUsername: [V.required(), V.minLength(3), V.username()],
      usrPassword: [V.required(), V.minLength(4, 'Mínimo 4 caracteres')],
      usrCodigo: [V.required(), V.minLength(3)],
      usrRol: [V.notEmpty('Seleccione un rol')]
    })) return;

    const data = {
      username: document.getElementById('usrUsername').value.trim(),
      password: document.getElementById('usrPassword').value,
      codigo: document.getElementById('usrCodigo').value.trim(),
      rol: document.getElementById('usrRol').value,
      nombre: document.getElementById('usrEmpleado').value || document.getElementById('usrUsername').value.trim(),
      estado: document.getElementById('usrEstado').value
    };

    if (editingUsrId) {
      data.id = editingUsrId;
      await dbPut('usuarios', data);
      showToast('Usuario actualizado', 'success');
      editingUsrId = null;
    } else {
      await dbAdd('usuarios', data);
      showToast('Usuario registrado', 'success');
    }
    renderEmpleados();
  });
}

function switchEmpTab(tab) { empTab = tab; editingEmpId = null; editingUsrId = null; renderEmpleados(); }

async function eliminarEmpleado(id) {
  if (!confirm('¿Eliminar este empleado?')) return;
  await dbDelete('empleados', id);
  showToast('Empleado eliminado', 'danger');
  renderEmpleados();
}

async function eliminarUsuario(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  await dbDelete('usuarios', id);
  showToast('Usuario eliminado', 'danger');
  renderEmpleados();
}

// Fix Bug #2: edición segura — NO borra el registro
async function editarEmpleado(id) {
  const e = await dbGet('empleados', id);
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
  const u = await dbGet('usuarios', id);
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
