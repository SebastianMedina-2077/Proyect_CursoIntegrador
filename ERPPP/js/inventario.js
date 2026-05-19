async function renderInventario() {
  const inv = await dbGetAll('inventario');
  const mov = await dbGetAll('movimientos');
  const entradas = mov.filter(m => m.tipo === 'entrada').length;
  const salidas = mov.filter(m => m.tipo === 'salida').length;
  const criticos = inv.filter(i => i.stock <= i.stockMinimo).length;

  const stockRows = inv.map(i =>
    `<tr><td>${i.codigo}</td><td>${i.nombre}</td><td>${i.stock}</td><td>${i.unidad}</td><td>${i.stockMinimo}</td><td>${tplBadge(i.stock <= i.stockMinimo ? 'Bajo' : 'Normal', i.stock <= i.stockMinimo ? 'badge-danger' : 'badge-success')}</td></tr>`
  ).join('');
  const movRows = mov.slice().reverse().map(m =>
    `<tr><td>${m.fecha}</td><td>${tplBadge(capitalize(m.tipo), m.tipo === 'entrada' ? 'badge-success' : 'badge-danger')}</td><td>${m.insumo}</td><td>${m.cantidad}</td><td>${m.usuario}</td><td>${m.motivo}</td></tr>`
  ).join('');
  const insumoOptions = inv.map(i => `<option>${i.nombre}</option>`).join('');

  document.getElementById('moduleContent').innerHTML = `
    <div class="stats-grid">
      ${tplStatCard('fa-arrow-down', 'success', 'Entradas', entradas, 0)}
      ${tplStatCard('fa-arrow-up', 'danger', 'Salidas', salidas, 80)}
      ${tplStatCard('fa-triangle-exclamation', 'warn', 'Críticos', criticos, 160)}
    </div>
    <div class="grid-2 mt-16">
      <div class="card">
        <div class="card-header"><h3>Registrar movimiento</h3></div>
        <form id="formMov" class="needs-validation" novalidate>
          <div class="form-group"><label>Tipo</label><select id="movTipo" class="form-control" required><option value="entrada">Entrada</option><option value="salida">Salida</option></select></div>
          <div class="form-group"><label>Insumo</label><select id="movInsumo" class="form-control" required>${insumoOptions}</select></div>
          <div class="form-group"><label>Cantidad</label><input type="text" id="movCantidad" class="form-control" placeholder="Ej: 5 kg" required><div class="invalid-feedback">Requerido</div></div>
          <div class="form-group"><label>Motivo</label><input type="text" id="movMotivo" class="form-control" placeholder="Compra, producción, merma..." required><div class="invalid-feedback">Requerido</div></div>
          <button type="submit" class="btn btn-primary btn-block"><i class="fa-solid fa-plus"></i> Registrar</button>
        </form>
      </div>
      <div class="card">
        <div class="card-header"><h3>Stock actual</h3></div>
        ${tplTable(['Código', 'Insumo', 'Stock', 'Unidad', 'Mínimo', 'Estado'], stockRows)}
      </div>
    </div>
    <div class="card mt-16">
      <div class="card-header"><h3>Historial de movimientos</h3></div>
      ${tplTable(['Fecha', 'Tipo', 'Insumo', 'Cantidad', 'Usuario', 'Motivo'], movRows)}
    </div>`;

  /* SPRING BOOT: Reemplazar por POST /api/movimientos */
  document.getElementById('formMov').addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateForm('formMov', {
      movCantidad: [V.required('Ingrese la cantidad')],
      movMotivo: [V.required('Ingrese el motivo'), V.minLength(3)]
    })) return;
    const session = getSession();
    await dbAdd('movimientos', {
      fecha: new Date().toLocaleString('es-PE'),
      tipo: document.getElementById('movTipo').value,
      insumo: document.getElementById('movInsumo').value,
      cantidad: document.getElementById('movCantidad').value,
      usuario: session.username,
      motivo: document.getElementById('movMotivo').value
    });
    renderInventario();
  });
}
