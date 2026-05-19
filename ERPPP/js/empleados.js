let empTab = 'empleados';

async function renderEmpleados() {
  const empleados = await dbGetAll('empleados');
  const usuarios = await dbGetAll('usuarios');

  document.getElementById('moduleContent').innerHTML = `
    <div class="tab-bar">
      <button class="tab-btn ${empTab === 'empleados' ? 'active' : ''}" onclick="switchEmpTab('empleados')"><i class="fa-solid fa-users"></i> Empleados</button>
      <button class="tab-btn ${empTab === 'usuarios' ? 'active' : ''}" onclick="switchEmpTab('usuarios')"><i class="fa-solid fa-user-shield"></i> Usuarios</button>
    </div>
    <div id="empContent"></div>`;

  if (empTab === 'empleados') renderEmpleadosTab(empleados);
  else renderUsuariosTab(usuarios, empleados);
}

function renderEmpleadosTab(empleados) {
  const empRows = empleados.map(e =>
    `<tr><td>${e.nombre} ${e.apellido}</td><td>${e.dni}</td><td>${e.telefono}</td><td>${e.cargo}</td><td>${tplBadge(capitalize(e.estado), e.estado === 'activo' ? 'badge-success' : 'badge-muted')}</td><td><div class="action-btns"><button class="btn btn-sm btn-outline" onclick="editarEmpleado(${e.id})"><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm btn-danger" onclick="eliminarEmpleado(${e.id})"><i class="fa-solid fa-trash"></i></button></div></td></tr>`
  ).join('');

  document.getElementById('empContent').innerHTML = `
    <div class="grid-2 mt-16">
      <div class="card">
        <div class="card-header"><h3>Registrar empleado</h3></div>
        <form id="formEmp" class="needs-validation" novalidate>
          <div class="form-row">
            <div class="form-group"><label>Nombre</label><input type="text" id="empNombre" class="form-control" required><div class="invalid-feedback">Requerido</div></div>
            <div class="form-group"><label>Apellido</label><input type="text" id="empApellido" class="form-control" required><div class="invalid-feedback">Requerido</div></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>DNI</label><input type="text" id="empDni" class="form-control" maxlength="8" required><div class="invalid-feedback">Requerido</div></div>
            <div class="form-group"><label>Teléfono</label><input type="tel" id="empTel" class="form-control" required><div class="invalid-feedback">Requerido</div></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Cargo</label>
              <select id="empCargo" class="form-control" required>
                <option value="">Seleccionar</option>
                <option>Administrador</option><option>Cajero</option><option>Cocina</option><option>Repartidor</option>
              </select><div class="invalid-feedback">Requerido</div>
            </div>
            <div class="form-group"><label>Estado</label>
              <select id="empEstado" class="form-control"><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-block"><i class="fa-solid fa-plus"></i> Guardar</button>
        </form>
      </div>
      <div class="card">
        <div class="card-header"><h3>Empleados registrados</h3></div>
        ${tplTable(['Nombre', 'DNI', 'Teléfono', 'Cargo', 'Estado', 'Acciones'], empRows)}
      </div>
    </div>`;

  /* SPRING BOOT: Reemplazar por POST /api/empleados */
  document.getElementById('formEmp').addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateForm('formEmp', {
      empNombre: [V.required(), V.minLength(2), V.alphaSpaces()],
      empApellido: [V.required(), V.minLength(2), V.alphaSpaces()],
      empDni: [V.required(), V.dni()],
      empTel: [V.required(), V.phone()],
      empCargo: [V.notEmpty('Seleccione un cargo')]
    })) return;
    await dbAdd('empleados', {
      nombre: document.getElementById('empNombre').value.trim(),
      apellido: document.getElementById('empApellido').value.trim(),
      dni: document.getElementById('empDni').value.trim(),
      telefono: document.getElementById('empTel').value.trim(),
      cargo: document.getElementById('empCargo').value,
      estado: document.getElementById('empEstado').value
    });
    renderEmpleados();
  });
}

function renderUsuariosTab(usuarios, empleados) {
  const usrRows = usuarios.map(u =>
    `<tr><td>${u.username}</td><td>${u.codigo || '—'}</td><td>${capitalize(u.rol)}</td><td>${u.nombre}</td><td>${tplBadge(capitalize(u.estado), u.estado === 'activo' ? 'badge-success' : 'badge-muted')}</td><td><div class="action-btns"><button class="btn btn-sm btn-outline" onclick="editarUsuario(${u.id})"><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm btn-danger" onclick="eliminarUsuario(${u.id})"><i class="fa-solid fa-trash"></i></button></div></td></tr>`
  ).join('');
  const empOptions = empleados.map(e => `<option value="${e.nombre} ${e.apellido}">${e.nombre} ${e.apellido}</option>`).join('');

  document.getElementById('empContent').innerHTML = `
    <div class="grid-2 mt-16">
      <div class="card">
        <div class="card-header"><h3>Registrar usuario</h3></div>
        <form id="formUsr" class="needs-validation" novalidate>
          <div class="form-group"><label>Username</label><input type="text" id="usrUsername" class="form-control" required><div class="invalid-feedback">Requerido</div></div>
          <div class="form-group"><label>Contraseña</label><input type="password" id="usrPassword" class="form-control" required><div class="invalid-feedback">Requerido</div></div>
          <div class="form-group"><label>Código</label><input type="text" id="usrCodigo" class="form-control" placeholder="Ej: CAJ-002" required><div class="invalid-feedback">Requerido</div></div>
          <div class="form-group"><label>Rol</label>
            <select id="usrRol" class="form-control" required><option value="">Seleccionar</option><option value="admin">Administrador</option><option value="cajero">Cajero</option><option value="cocina">Cocina</option></select><div class="invalid-feedback">Requerido</div>
          </div>
          <div class="form-group"><label>Empleado asociado</label>
            <select id="usrEmpleado" class="form-control"><option value="">Ninguno</option>${empOptions}</select>
          </div>
          <div class="form-group"><label>Estado</label><select id="usrEstado" class="form-control"><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></div>
          <button type="submit" class="btn btn-primary btn-block"><i class="fa-solid fa-plus"></i> Guardar</button>
        </form>
      </div>
      <div class="card">
        <div class="card-header"><h3>Usuarios del sistema</h3></div>
        ${tplTable(['Usuario', 'Código', 'Rol', 'Nombre', 'Estado', 'Acciones'], usrRows)}
      </div>
    </div>`;

  /* SPRING BOOT: Reemplazar por POST /api/usuarios */
  document.getElementById('formUsr').addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateForm('formUsr', {
      usrUsername: [V.required(), V.minLength(3), V.username()],
      usrPassword: [V.required(), V.minLength(4, 'Mínimo 4 caracteres')],
      usrCodigo: [V.required(), V.minLength(3)],
      usrRol: [V.notEmpty('Seleccione un rol')]
    })) return;
    await dbAdd('usuarios', {
      username: document.getElementById('usrUsername').value.trim(),
      password: document.getElementById('usrPassword').value,
      codigo: document.getElementById('usrCodigo').value.trim(),
      rol: document.getElementById('usrRol').value,
      nombre: document.getElementById('usrEmpleado').value || document.getElementById('usrUsername').value.trim(),
      estado: document.getElementById('usrEstado').value
    });
    renderEmpleados();
  });
}

function switchEmpTab(tab) { empTab = tab; renderEmpleados(); }

async function eliminarEmpleado(id) { await dbDelete('empleados', id); renderEmpleados(); }
async function eliminarUsuario(id) { await dbDelete('usuarios', id); renderEmpleados(); }

async function editarEmpleado(id) {
  const e = await dbGet('empleados', id);
  if (!e) return;
  document.getElementById('empNombre').value = e.nombre;
  document.getElementById('empApellido').value = e.apellido;
  document.getElementById('empDni').value = e.dni;
  document.getElementById('empTel').value = e.telefono;
  document.getElementById('empCargo').value = e.cargo;
  document.getElementById('empEstado').value = e.estado;
  await dbDelete('empleados', id);
}

async function editarUsuario(id) {
  const u = await dbGet('usuarios', id);
  if (!u) return;
  document.getElementById('usrUsername').value = u.username;
  document.getElementById('usrPassword').value = u.password;
  document.getElementById('usrCodigo').value = u.codigo || '';
  document.getElementById('usrRol').value = u.rol;
  document.getElementById('usrEstado').value = u.estado;
  await dbDelete('usuarios', id);
}
