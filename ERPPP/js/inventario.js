/* inventario.js — Control de stock y movimientos */

async function renderInventario() {
  const inv = await dbGetAll('inventario');
  const mov = await dbGetAll('movimientos');
  const entradas = mov.filter(m => m.tipo === 'entrada').length;
  const salidas = mov.filter(m => m.tipo === 'salida').length;
  const criticos = inv.filter(i => i.stock <= i.stockMinimo).length;

  const stockRows = inv.map(i =>
    `<tr><td>${i.codigo}</td><td>${i.nombre}</td><td>${i.stock}</td><td>${i.unidad}</td><td>${i.stockMinimo}</td><td>${tplBadge(i.stock<=i.stockMinimo?'Bajo':'Normal', i.stock<=i.stockMinimo?'text-bg-danger':'text-bg-success')}</td></tr>`
  ).join('');

  const movRows = mov.slice().reverse().map(m =>
    `<tr><td>${formatDate(m.fecha)}</td><td>${tplBadge(capitalize(m.tipo), m.tipo==='entrada'?'text-bg-success':'text-bg-danger')}</td><td>${m.insumo}</td><td>${m.cantidad}</td><td>${m.usuario}</td><td>${m.motivo}</td></tr>`
  ).join('');

  const insumoOpts = inv.map(i => `<option value="${i.nombre}">${i.nombre} (${i.stock} ${i.unidad})</option>`).join('');

  document.getElementById('moduleContent').innerHTML = `
    <div class="row g-3 mb-3">
      ${tplStatCard('fa-arrow-down','success','Entradas',entradas,0)}
      ${tplStatCard('fa-arrow-up','danger','Salidas',salidas,80)}
      ${tplStatCard('fa-triangle-exclamation','warn','Críticos',criticos,160)}
    </div>
    <div class="row g-3 mb-3">
      <div class="col-lg-5">
        <div class="card">
          <div class="card-header"><h6 class="mb-0">Registrar movimiento</h6></div>
          <div class="card-body">
            <form id="formMov" novalidate>
              <div class="mb-3">
                <label class="form-label">Tipo</label>
                <select id="movTipo" class="form-select">
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Insumo</label>
                <select id="movInsumo" class="form-select">${insumoOpts}</select>
              </div>
              <div class="mb-3">
                <label class="form-label">Cantidad</label>
                <input type="number" step="0.01" min="0.01" id="movCantidad" class="form-control" placeholder="Ej: 5">
                <div class="invalid-feedback">Ingrese la cantidad</div>
              </div>
              <div class="mb-3">
                <label class="form-label">Motivo</label>
                <input type="text" id="movMotivo" class="form-control" placeholder="Compra, producción, merma...">
                <div class="invalid-feedback">Ingrese el motivo</div>
              </div>
              <button type="submit" class="btn btn-brand w-100"><i class="fa-solid fa-plus"></i> Registrar</button>
            </form>
          </div>
        </div>
      </div>
      <div class="col-lg-7">
        <div class="card">
          <div class="card-header"><h6 class="mb-0">Stock actual</h6></div>
          <div class="card-body p-0">${tplTable(['Código','Insumo','Stock','Unidad','Mínimo','Estado'], stockRows)}</div>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h6 class="mb-0">Historial de movimientos</h6></div>
      <div class="card-body p-0">${tplTable(['Fecha','Tipo','Insumo','Cantidad','Usuario','Motivo'], movRows)}</div>
    </div>`;

  document.getElementById('formMov').addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateForm('formMov', {
      movCantidad: [V.required('Ingrese la cantidad'), V.minValue(0.01, 'Debe ser mayor a 0')],
      movMotivo: [V.required('Ingrese el motivo'), V.minLength(3)]
    })) return;

    const tipo = document.getElementById('movTipo').value;
    const insumoNombre = document.getElementById('movInsumo').value;
    const cantidad = parseFloat(document.getElementById('movCantidad').value);
    const session = getSession();

    // Buscar unidad del insumo
    const invItems = await dbGetAll('inventario');
    const item = invItems.find(i => i.nombre === insumoNombre);
    const unidad = item ? item.unidad : '';

    await dbAdd('movimientos', {
      fecha: new Date().toISOString(),
      tipo,
      insumo: insumoNombre,
      cantidad: `${cantidad} ${unidad}`,
      usuario: session.username,
      motivo: document.getElementById('movMotivo').value.trim()
    });

    // Fix Bug #6: actualizar stock del insumo
    if (item) {
      item.stock = tipo === 'entrada'
        ? item.stock + cantidad
        : Math.max(0, item.stock - cantidad);
      await dbPut('inventario', item);
    }

    showToast(`Movimiento registrado: ${tipo} de ${cantidad} ${unidad} de ${insumoNombre}`, 'success');
    renderInventario();
  });
}
