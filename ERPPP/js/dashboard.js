/* dashboard.js */

// ── SERVICE ──
async function getDashboardData() {
  const pedidos = await dbGetAll('pedidos');
  const inventario = await dbGetAll('inventario');

  const ventasHoy = pedidos.filter(p => isToday(p.fecha))
    .reduce((s, p) => s + (p.estado !== 'anulado' ? p.total : 0), 0);
  const pendientes = pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'preparando').length;
  const bajoStock = inventario.filter(i => i.stock <= i.stockMinimo).length;

  const conteo = {};
  pedidos.forEach(p => {
    if (p.estado === 'anulado') return;
    p.items.forEach(it => { conteo[it.nombre] = (conteo[it.nombre] || 0) + it.cantidad; });
  });
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];

  return {
    ventasHoy, pendientes, bajoStock,
    topProducto: top ? top[0] : '—',
    pedidosRecientes: pedidos.slice(-5).reverse(),
    inventario
  };
}

// ── VIEW (solo filas dinámicas) ──
function buildDashPedidoRow(p) {
  return `<tr><td>PED-${String(p.id).padStart(3, '0')}</td><td>${formatDate(p.fecha)}</td><td>${p.cliente}</td><td>S/ ${p.total.toFixed(2)}</td><td>${tplBadge(capitalize(p.estado), statusColor(p.estado))}</td></tr>`;
}

function buildDashInvRow(i) {
  const bajo = i.stock <= i.stockMinimo;
  return `<tr><td>${i.nombre}</td><td>${i.stock} ${i.unidad}</td><td>${i.stockMinimo} ${i.unidad}</td><td>${tplBadge(bajo ? 'Bajo' : 'Normal', bajo ? 'text-bg-danger' : 'text-bg-success')}</td></tr>`;
}

// ── CONTROLLER ──
async function renderDashboard() {
  const data = await getDashboardData();
  const mc = document.getElementById('moduleContent');
  mc.innerHTML = '';
  mc.appendChild(document.getElementById('tplDashboard').content.cloneNode(true));

  document.getElementById('dashStats').innerHTML =
    tplStatCard('fa-coins', '', 'Ventas del día', 'S/ ' + data.ventasHoy.toFixed(2), 0) +
    tplStatCard('fa-clock', 'warn', 'Pedidos pendientes', data.pendientes, 80) +
    tplStatCard('fa-trophy', 'success', 'Producto top', data.topProducto, 160) +
    tplStatCard('fa-triangle-exclamation', 'danger', 'Insumos bajo stock', data.bajoStock, 240);

  document.getElementById('dashPedidosBody').innerHTML = data.pedidosRecientes.map(buildDashPedidoRow).join('');
  document.getElementById('dashInvBody').innerHTML = data.inventario.map(buildDashInvRow).join('');
}
