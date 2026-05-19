async function renderPedidos() {
  const pedidos = await dbGetAll('pedidos');
  document.getElementById('moduleContent').innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>Gestión de Pedidos</h3>
        <div class="filter-bar">
          <input type="date" id="pedFecha" class="form-control">
          <select id="pedEstado" class="form-control">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="preparando">Preparando</option>
            <option value="entregado">Entregado</option>
            <option value="anulado">Anulado</option>
          </select>
          <button class="btn btn-primary" onclick="filtrarPedidos()"><i class="fa-solid fa-filter"></i> Filtrar</button>
        </div>
      </div>
      ${tplTable(['ID', 'Fecha', 'Cliente', 'Mesa', 'Cajero', 'Pago', 'Total', 'Estado', 'Acciones'], renderPedidosRows(pedidos), 'pedidosBody')}
    </div>`;
}

function renderPedidosRows(pedidos) {
  return pedidos.slice().reverse().map(p => {
    let acciones = `<button class="btn btn-sm btn-outline" onclick="verPedido(${p.id})" title="Ver detalle"><i class="fa-solid fa-eye"></i></button>`;
    if (p.estado === 'pendiente') acciones += `<button class="btn btn-sm btn-primary" onclick="cambiarEstado(${p.id},'preparando')" title="Preparar"><i class="fa-solid fa-fire"></i></button>`;
    if (p.estado === 'preparando') acciones += `<button class="btn btn-sm btn-success" onclick="cambiarEstado(${p.id},'entregado')" title="Entregar"><i class="fa-solid fa-check"></i></button>`;
    if (p.estado !== 'anulado' && p.estado !== 'entregado') acciones += `<button class="btn btn-sm btn-danger" onclick="cambiarEstado(${p.id},'anulado')" title="Anular"><i class="fa-solid fa-ban"></i></button>`;

    return `<tr>
      <td>PED-${String(p.id).padStart(3, '0')}</td><td>${p.fecha}</td><td>${p.cliente}</td>
      <td>${p.mesa === 0 ? 'Llevar' : 'Mesa ' + p.mesa}</td><td>${p.cajero}</td><td>${capitalize(p.tipoPago)}</td>
      <td>S/ ${p.total.toFixed(2)}</td><td>${tplBadge(capitalize(p.estado), statusColor(p.estado))}</td>
      <td><div class="action-btns">${acciones}</div></td>
    </tr>`;
  }).join('');
}

async function filtrarPedidos() {
  let pedidos = await dbGetAll('pedidos');
  const fecha = document.getElementById('pedFecha').value;
  const estado = document.getElementById('pedEstado').value;
  if (fecha) pedidos = pedidos.filter(p => p.fecha.includes(fecha.split('-').reverse().join('/')));
  if (estado) pedidos = pedidos.filter(p => p.estado === estado);
  document.getElementById('pedidosBody').innerHTML = renderPedidosRows(pedidos);
}

async function verPedido(id) {
  const p = await dbGet('pedidos', id);
  if (!p) return;
  const items = p.items.map(it =>
    `<tr><td>${it.cantidad}</td><td>${it.nombre}${it.quitados?.length ? '<br><small>Sin: ' + it.quitados.join(', ') + '</small>' : ''}${it.extras?.length ? '<br><small>+' + it.extras.map(e => e.nombre).join(', ') + '</small>' : ''}${it.notas ? '<br><small>' + it.notas + '</small>' : ''}</td><td>S/ ${(it.precio * it.cantidad).toFixed(2)}</td></tr>`
  ).join('');

  const html = `<div class="modal-overlay active" id="modalDetallePedido"><div class="modal-box modal-md">
    <div class="modal-header"><h4>PED-${String(p.id).padStart(3, '0')}</h4><button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fa-solid fa-xmark"></i></button></div>
    <div class="modal-body">
      <div class="detail-grid">
        <div><strong>Cliente:</strong> ${p.cliente}</div><div><strong>Mesa:</strong> ${p.mesa === 0 ? 'Para Llevar' : p.mesa}</div>
        <div><strong>Cajero:</strong> ${p.cajero}</div><div><strong>Pago:</strong> ${capitalize(p.tipoPago)}</div>
        <div><strong>Fecha:</strong> ${p.fecha}</div><div><strong>Estado:</strong> ${tplBadge(capitalize(p.estado), statusColor(p.estado))}</div>
      </div>
      <div class="table-wrap mt-16"><table><thead><tr><th>Cant</th><th>Producto</th><th>Subtotal</th></tr></thead><tbody>${items}</tbody></table></div>
      <div class="detail-total"><span>TOTAL</span><strong>S/ ${p.total.toFixed(2)}</strong></div>
    </div>
    <div class="modal-footer"><button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cerrar</button></div>
  </div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

/* SPRING BOOT: Reemplazar por PUT /api/pedidos/{id}/estado */
async function cambiarEstado(id, estado) {
  const p = await dbGet('pedidos', id);
  if (!p) return;
  p.estado = estado;
  await dbPut('pedidos', p);
  renderPedidos();
}

async function renderCocina() {
  const pedidos = await dbGetAll('pedidos');
  const activos = pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'preparando');

  document.getElementById('moduleContent').innerHTML = `
    <div class="kitchen-board">
      ${activos.length ? activos.map(p => `
        <div class="kitchen-ticket ${p.estado}">
          <div class="card-header">
            <h4>PED-${String(p.id).padStart(3, '0')}</h4>
            ${tplBadge(capitalize(p.estado), statusColor(p.estado))}
          </div>
          <div class="ticket-meta"><i class="fa-solid fa-clock"></i> ${p.fecha}</div>
          <div class="ticket-meta">${p.mesa === 0 ? '<i class="fa-solid fa-bag-shopping"></i> Para Llevar' : '<i class="fa-solid fa-chair"></i> Mesa ' + p.mesa}</div>
          <ul class="ticket-items">${p.items.map(it => `<li>${it.cantidad}x ${it.nombre}${it.quitados?.length ? ' <small>(sin ' + it.quitados.join(', ') + ')</small>' : ''}${it.notas ? ' <small>- ' + it.notas + '</small>' : ''}</li>`).join('')}</ul>
          <div class="ticket-actions">
            ${p.estado === 'pendiente' ? `<button class="btn btn-primary btn-block" onclick="cambiarEstadoCocina(${p.id},'preparando')"><i class="fa-solid fa-fire"></i> Preparando</button>` : ''}
            ${p.estado === 'preparando' ? `<button class="btn btn-success btn-block" onclick="cambiarEstadoCocina(${p.id},'entregado')"><i class="fa-solid fa-check"></i> Listo</button>` : ''}
          </div>
        </div>`).join('') : '<div class="empty-state full"><i class="fa-solid fa-circle-check"></i><p>Sin pedidos activos</p></div>'}
    </div>`;
}

async function cambiarEstadoCocina(id, estado) {
  const p = await dbGet('pedidos', id);
  p.estado = estado;
  await dbPut('pedidos', p);
  renderCocina();
}
