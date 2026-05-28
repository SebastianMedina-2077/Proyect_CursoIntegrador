/* pedidos.js — Gestión de pedidos + Panel cocina */

async function renderPedidos() {
  const pedidos = await dbGetAll('pedidos');
  document.getElementById('moduleContent').innerHTML = `
    <div class="card">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h6 class="mb-0">Gestión de Pedidos</h6>
        <div class="d-flex gap-2 flex-wrap">
          <input type="date" id="pedFecha" class="form-control form-control-sm" style="width:auto">
          <select id="pedEstado" class="form-select form-select-sm" style="width:auto">
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="preparando">Preparando</option>
            <option value="entregado">Entregado</option>
            <option value="anulado">Anulado</option>
          </select>
          <button class="btn btn-brand btn-sm" onclick="filtrarPedidos()"><i class="fa-solid fa-filter"></i> Filtrar</button>
        </div>
      </div>
      <div class="card-body p-0">
        ${tplTable(['ID','Fecha','Cliente','Mesa','Cajero','Pago','Total','Estado','Acciones'], renderPedidosRows(pedidos), 'pedidosBody')}
      </div>
    </div>`;
}

function renderPedidosRows(pedidos) {
  return pedidos.slice().reverse().map(p => {
    let acc = `<button class="btn btn-sm btn-outline-secondary" onclick="verPedido(${p.id})" title="Ver"><i class="fa-solid fa-eye"></i></button>`;
    if (p.estado === 'pendiente') acc += `<button class="btn btn-sm btn-brand" onclick="cambiarEstado(${p.id},'preparando')" title="Preparar"><i class="fa-solid fa-fire"></i></button>`;
    if (p.estado === 'preparando') acc += `<button class="btn btn-sm btn-success" onclick="cambiarEstado(${p.id},'entregado')" title="Entregar"><i class="fa-solid fa-check"></i></button>`;
    if (p.estado !== 'anulado' && p.estado !== 'entregado') acc += `<button class="btn btn-sm btn-outline-danger" onclick="cambiarEstado(${p.id},'anulado')" title="Anular"><i class="fa-solid fa-ban"></i></button>`;
    return `<tr>
      <td>PED-${String(p.id).padStart(3,'0')}</td><td>${formatDate(p.fecha)}</td><td>${p.cliente}</td>
      <td>${p.mesa===0?'Llevar':'Mesa '+p.mesa}</td><td>${p.cajero}</td><td>${capitalize(p.tipoPago)}</td>
      <td>S/ ${p.total.toFixed(2)}</td><td>${tplBadge(capitalize(p.estado),statusColor(p.estado))}</td>
      <td><div class="d-flex gap-1">${acc}</div></td>
    </tr>`;
  }).join('');
}

// Fix Bug #5: usar matchesDate() para filtro de fecha
async function filtrarPedidos() {
  let pedidos = await dbGetAll('pedidos');
  const fecha = document.getElementById('pedFecha').value;
  const estado = document.getElementById('pedEstado').value;
  if (fecha) pedidos = pedidos.filter(p => matchesDate(p.fecha, fecha));
  if (estado) pedidos = pedidos.filter(p => p.estado === estado);
  document.getElementById('pedidosBody').innerHTML = renderPedidosRows(pedidos);
}

// Detalle de pedido — modal Bootstrap
async function verPedido(id) {
  const p = await dbGet('pedidos', id);
  if (!p) return;
  const items = p.items.map(it =>
    `<tr><td>${it.cantidad}</td><td>${it.nombre}${it.quitados?.length?'<br><small class="text-muted">Sin: '+it.quitados.join(', ')+'</small>':''}${it.extras?.length?'<br><small class="text-muted">+'+it.extras.map(e=>e.nombre).join(', ')+'</small>':''}${it.notas?'<br><small class="text-muted">'+it.notas+'</small>':''}</td><td>S/ ${(it.precio*it.cantidad).toFixed(2)}</td></tr>`
  ).join('');

  document.getElementById('detallePedidoTitle').textContent = `PED-${String(p.id).padStart(3,'0')}`;
  document.getElementById('detallePedidoBody').innerHTML = `
    <div class="row g-2 mb-3 small">
      <div class="col-6"><strong>Cliente:</strong> ${p.cliente}</div>
      <div class="col-6"><strong>Mesa:</strong> ${p.mesa===0?'Para Llevar':p.mesa}</div>
      <div class="col-6"><strong>Cajero:</strong> ${p.cajero}</div>
      <div class="col-6"><strong>Pago:</strong> ${capitalize(p.tipoPago)}</div>
      <div class="col-6"><strong>Fecha:</strong> ${formatDate(p.fecha)}</div>
      <div class="col-6"><strong>Estado:</strong> ${tplBadge(capitalize(p.estado),statusColor(p.estado))}</div>
    </div>
    <div class="table-responsive">
      <table class="table table-sm"><thead><tr><th>Cant</th><th>Producto</th><th>Subtotal</th></tr></thead><tbody>${items}</tbody></table>
    </div>
    <div class="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
      <strong>TOTAL</strong><strong class="fs-5 text-brand-dark">S/ ${p.total.toFixed(2)}</strong>
    </div>`;
  new bootstrap.Modal(document.getElementById('modalDetallePedido')).show();
}

async function cambiarEstado(id, estado) {
  const p = await dbGet('pedidos', id);
  if (!p) return;
  p.estado = estado;
  await dbPut('pedidos', p);
  renderPedidos();
}

// Panel cocina
async function renderCocina() {
  const pedidos = await dbGetAll('pedidos');
  const activos = pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'preparando');

  document.getElementById('moduleContent').innerHTML = `
    <div class="kitchen-board">
      ${activos.length ? activos.map(p => `
        <div class="card kitchen-ticket ${p.estado} stagger">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">PED-${String(p.id).padStart(3,'0')}</h6>
              ${tplBadge(capitalize(p.estado), statusColor(p.estado))}
            </div>
            <small class="text-muted d-block"><i class="fa-solid fa-clock me-1"></i>${formatDate(p.fecha)}</small>
            <small class="text-muted d-block mb-2">${p.mesa===0?'<i class="fa-solid fa-bag-shopping me-1"></i>Para Llevar':'<i class="fa-solid fa-chair me-1"></i>Mesa '+p.mesa}</small>
            <ul class="list-unstyled border-top border-bottom py-2 mb-2">
              ${p.items.map(it => `<li class="small py-1">${it.cantidad}x ${it.nombre}${it.quitados?.length?' <small class="text-muted">(sin '+it.quitados.join(', ')+')</small>':''}${it.notas?' <small class="text-muted">- '+it.notas+'</small>':''}</li>`).join('')}
            </ul>
            ${p.estado==='pendiente'?`<button class="btn btn-brand w-100" onclick="cambiarEstadoCocina(${p.id},'preparando')"><i class="fa-solid fa-fire"></i> Preparando</button>`:''}
            ${p.estado==='preparando'?`<button class="btn btn-success w-100" onclick="cambiarEstadoCocina(${p.id},'entregado')"><i class="fa-solid fa-check"></i> Listo</button>`:''}
          </div>
        </div>`).join('') : '<div class="text-center text-muted py-5 w-100"><i class="fa-solid fa-circle-check fs-1 opacity-25 d-block mb-2"></i><p>Sin pedidos activos</p></div>'}
    </div>`;
}

// Fix Bug #8: null check
async function cambiarEstadoCocina(id, estado) {
  const p = await dbGet('pedidos', id);
  if (!p) return;
  p.estado = estado;
  await dbPut('pedidos', p);
  renderCocina();
}
