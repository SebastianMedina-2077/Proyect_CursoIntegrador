async function renderDashboard() {
  const pedidos = await dbGetAll('pedidos');
  const inventario = await dbGetAll('inventario');

  const hoy = new Date().toLocaleDateString('es-PE');
  const ventasHoy = pedidos.filter(p => p.fecha.includes(hoy.split('/').reverse().join('/'))).reduce((s, p) => s + (p.estado !== 'anulado' ? p.total : 0), 0);
  const pendientes = pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'preparando').length;
  const bajoStock = inventario.filter(i => i.stock <= i.stockMinimo).length;

  const conteo = {};
  pedidos.forEach(p => { if (p.estado === 'anulado') return; p.items.forEach(it => { conteo[it.nombre] = (conteo[it.nombre] || 0) + it.cantidad; }); });
  const topProducto = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0];

  /* SPRING BOOT: Estos datos vendrán de GET /api/dashboard/resumen */
  const pedidosRecientes = pedidos.slice(-5).reverse();
  const pedidosRows = pedidosRecientes.map(p =>
    `<tr><td>PED-${String(p.id).padStart(3, '0')}</td><td>${p.fecha}</td><td>${p.cliente}</td><td>S/ ${p.total.toFixed(2)}</td><td>${tplBadge(capitalize(p.estado), statusColor(p.estado))}</td></tr>`
  ).join('');
  const invRows = inventario.map(i =>
    `<tr><td>${i.nombre}</td><td>${i.stock} ${i.unidad}</td><td>${i.stockMinimo} ${i.unidad}</td><td>${tplBadge(i.stock <= i.stockMinimo ? 'Bajo' : 'Normal', i.stock <= i.stockMinimo ? 'badge-danger' : 'badge-success')}</td></tr>`
  ).join('');

  document.getElementById('moduleContent').innerHTML = `
    <div class="stats-grid fade-in">
      ${tplStatCard('fa-coins', '', 'Ventas del día', `S/ ${ventasHoy.toFixed(2)}`, 0)}
      ${tplStatCard('fa-clock', 'warn', 'Pedidos pendientes', pendientes, 80)}
      ${tplStatCard('fa-trophy', 'success', 'Producto top', topProducto ? topProducto[0] : '—', 160)}
      ${tplStatCard('fa-triangle-exclamation', 'danger', 'Insumos bajo stock', bajoStock, 240)}
    </div>
    <div class="grid-2 mt-16 fade-in delay-1">
      <div class="card">
        <div class="card-header"><h3>Pedidos recientes</h3></div>
        ${tplTable(['ID', 'Fecha', 'Cliente', 'Total', 'Estado'], pedidosRows)}
      </div>
      <div class="card">
        <div class="card-header"><h3>Alertas de inventario</h3>${tplBadge('Revisar', 'badge-warn')}</div>
        ${tplTable(['Insumo', 'Stock', 'Mínimo', 'Estado'], invRows)}
      </div>
    </div>`;
}
