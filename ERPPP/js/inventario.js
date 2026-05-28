/* inventario.js — Control de stock */

// ── SERVICE ──
async function getInventarioData() {
  const inv = await dbGetAll('inventario');
  const mov = await dbGetAll('movimientos');
  return {
    inventario: inv, movimientos: mov,
    entradas: mov.filter(m => m.tipo === 'entrada').length,
    salidas: mov.filter(m => m.tipo === 'salida').length,
    criticos: inv.filter(i => i.stock <= i.stockMinimo).length
  };
}

async function registrarMovimiento(tipo, insumoNombre, cantidad, motivo) {
  const session = getSession();
  const invItems = await dbGetAll('inventario');
  const item = invItems.find(i => i.nombre === insumoNombre);
  const unidad = item ? item.unidad : '';

  await dbAdd('movimientos', {
    fecha: new Date().toISOString(), tipo, insumo: insumoNombre,
    cantidad: `${cantidad} ${unidad}`, usuario: session.username, motivo
  });

  if (item) {
    item.stock = tipo === 'entrada' ? item.stock + cantidad : Math.max(0, item.stock - cantidad);
    await dbPut('inventario', item);
  }
  return { insumoNombre, cantidad, unidad, tipo };
}

// ── VIEW (solo filas y options dinámicas) ──
function buildStockRow(i) {
  const bajo = i.stock <= i.stockMinimo;
  return `<tr><td>${i.codigo}</td><td>${i.nombre}</td><td>${i.stock}</td><td>${i.unidad}</td><td>${i.stockMinimo}</td><td>${tplBadge(bajo ? 'Bajo' : 'Normal', bajo ? 'text-bg-danger' : 'text-bg-success')}</td></tr>`;
}

function buildMovRow(m) {
  return `<tr><td>${formatDate(m.fecha)}</td><td>${tplBadge(capitalize(m.tipo), m.tipo === 'entrada' ? 'text-bg-success' : 'text-bg-danger')}</td><td>${m.insumo}</td><td>${m.cantidad}</td><td>${m.usuario}</td><td>${m.motivo}</td></tr>`;
}

function buildInsumoOption(i) {
  return `<option value="${i.nombre}">${i.nombre} (${i.stock} ${i.unidad})</option>`;
}

// ── CONTROLLER ──
async function renderInventario() {
  const data = await getInventarioData();
  const mc = document.getElementById('moduleContent');
  mc.innerHTML = '';
  mc.appendChild(document.getElementById('tplInventario').content.cloneNode(true));

  document.getElementById('invStats').innerHTML =
    tplStatCard('fa-arrow-down', 'success', 'Entradas', data.entradas, 0) +
    tplStatCard('fa-arrow-up', 'danger', 'Salidas', data.salidas, 80) +
    tplStatCard('fa-triangle-exclamation', 'warn', 'Críticos', data.criticos, 160);

  document.getElementById('movInsumo').innerHTML = data.inventario.map(buildInsumoOption).join('');
  document.getElementById('stockBody').innerHTML = data.inventario.map(buildStockRow).join('');
  document.getElementById('movBody').innerHTML = data.movimientos.slice().reverse().map(buildMovRow).join('');
  document.getElementById('formMov').addEventListener('submit', handleMovSubmit);
}

async function handleMovSubmit(e) {
  e.preventDefault();
  if (!validateForm('formMov', {
    movCantidad: [V.required('Ingrese la cantidad'), V.minValue(0.01, 'Debe ser mayor a 0')],
    movMotivo: [V.required('Ingrese el motivo'), V.minLength(3)]
  })) return;

  const result = await registrarMovimiento(
    document.getElementById('movTipo').value,
    document.getElementById('movInsumo').value,
    parseFloat(document.getElementById('movCantidad').value),
    document.getElementById('movMotivo').value.trim()
  );
  showToast(`Movimiento: ${result.tipo} de ${result.cantidad} ${result.unidad} de ${result.insumoNombre}`, 'success');
  renderInventario();
}
