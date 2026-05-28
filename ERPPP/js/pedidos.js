/* pedidos.js — Gestión de pedidos + Panel cocina */

// ── SERVICE ──
async function getPedidosData(filtroFecha, filtroEstado) {
  let pedidos = await dbGetAll('pedidos');
  if (filtroFecha) pedidos = pedidos.filter(p => matchesDate(p.fecha, filtroFecha));
  if (filtroEstado) pedidos = pedidos.filter(p => p.estado === filtroEstado);
  return pedidos;
}

async function getPedidoById(id) {
  return dbGet('pedidos', id);
}

async function updateEstadoPedido(id, estado) {
  const p = await dbGet('pedidos', id);
  if (!p) return null;
  p.estado = estado;
  await dbPut('pedidos', p);
  return p;
}

async function getPedidosCocina() {
  const pedidos = await dbGetAll('pedidos');
  return pedidos.filter(p => p.estado === 'pendiente' || p.estado === 'preparando');
}

// ── VIEW (solo filas y tickets dinámicos) ──
function buildPedidoRow(p) {
  let acc = `<button class="btn btn-sm btn-outline-secondary" onclick="verPedido(${p.id})" title="Ver"><i class="fa-solid fa-eye"></i></button>`;
  if (p.estado === 'pendiente') acc += `<button class="btn btn-sm btn-brand" onclick="cambiarEstado(${p.id},'preparando')" title="Preparar"><i class="fa-solid fa-fire"></i></button>`;
  if (p.estado === 'preparando') acc += `<button class="btn btn-sm btn-success" onclick="cambiarEstado(${p.id},'entregado')" title="Entregar"><i class="fa-solid fa-check"></i></button>`;
  if (p.estado !== 'anulado' && p.estado !== 'entregado') acc += `<button class="btn btn-sm btn-outline-danger" onclick="cambiarEstado(${p.id},'anulado')" title="Anular"><i class="fa-solid fa-ban"></i></button>`;
  return `<tr>
    <td>PED-${String(p.id).padStart(3, '0')}</td><td>${formatDate(p.fecha)}</td><td>${p.cliente}</td>
    <td>${p.mesa === 0 ? 'Llevar' : 'Mesa ' + p.mesa}</td><td>${p.cajero}</td><td>${capitalize(p.tipoPago)}</td>
    <td>S/ ${p.total.toFixed(2)}</td><td>${tplBadge(capitalize(p.estado), statusColor(p.estado))}</td>
    <td><div class="d-flex gap-1">${acc}</div></td>
  </tr>`;
}

function buildPedidoDetailView(p) {
  const items = p.items.map(it =>
    `<tr><td>${it.cantidad}</td><td>${it.nombre}${it.quitados?.length ? '<br><small class="text-muted">Sin: ' + it.quitados.join(', ') + '</small>' : ''}${it.extras?.length ? '<br><small class="text-muted">+' + it.extras.map(e => e.nombre).join(', ') + '</small>' : ''}${it.notas ? '<br><small class="text-muted">' + it.notas + '</small>' : ''}</td><td>S/ ${(it.precio * it.cantidad).toFixed(2)}</td></tr>`
  ).join('');
  return `
    <div class="row g-2 mb-3 small">
      <div class="col-6"><strong>Cliente:</strong> ${p.cliente}</div>
      <div class="col-6"><strong>Mesa:</strong> ${p.mesa === 0 ? 'Para Llevar' : p.mesa}</div>
      <div class="col-6"><strong>Cajero:</strong> ${p.cajero}</div>
      <div class="col-6"><strong>Pago:</strong> ${capitalize(p.tipoPago)}</div>
      <div class="col-6"><strong>Fecha:</strong> ${formatDate(p.fecha)}</div>
      <div class="col-6"><strong>Estado:</strong> ${tplBadge(capitalize(p.estado), statusColor(p.estado))}</div>
    </div>
    <div class="table-responsive">
      <table class="table table-sm"><thead><tr><th>Cant</th><th>Producto</th><th>Subtotal</th></tr></thead><tbody>${items}</tbody></table>
    </div>
    <div class="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
      <strong>TOTAL</strong><strong class="fs-5 text-brand-dark">S/ ${p.total.toFixed(2)}</strong>
    </div>`;
}

function buildCocinaTicket(p) {
  return `
    <div class="card kitchen-ticket ${p.estado} stagger">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="mb-0">PED-${String(p.id).padStart(3, '0')}</h6>
          ${tplBadge(capitalize(p.estado), statusColor(p.estado))}
        </div>
        <small class="text-muted d-block"><i class="fa-solid fa-clock me-1"></i>${formatDate(p.fecha)}</small>
        <small class="text-muted d-block mb-2">${p.mesa === 0 ? '<i class="fa-solid fa-bag-shopping me-1"></i>Para Llevar' : '<i class="fa-solid fa-chair me-1"></i>Mesa ' + p.mesa}</small>
        <ul class="list-unstyled border-top border-bottom py-2 mb-2">
          ${p.items.map(it => `<li class="small py-1">${it.cantidad}x ${it.nombre}${it.quitados?.length ? ' <small class="text-muted">(sin ' + it.quitados.join(', ') + ')</small>' : ''}${it.notas ? ' <small class="text-muted">- ' + it.notas + '</small>' : ''}</li>`).join('')}
        </ul>
        ${p.estado === 'pendiente' ? `<button class="btn btn-brand w-100" onclick="cambiarEstadoCocina(${p.id},'preparando')"><i class="fa-solid fa-fire"></i> Preparando</button>` : ''}
        ${p.estado === 'preparando' ? `<button class="btn btn-success w-100" onclick="cambiarEstadoCocina(${p.id},'entregado')"><i class="fa-solid fa-check"></i> Listo</button>` : ''}
      </div>
    </div>`;
}

// ── CONTROLLER ──
async function renderPedidos() {
  const pedidos = await getPedidosData();
  const mc = document.getElementById('moduleContent');
  mc.innerHTML = '';
  mc.appendChild(document.getElementById('tplPedidos').content.cloneNode(true));
  document.getElementById('pedidosBody').innerHTML = pedidos.slice().reverse().map(buildPedidoRow).join('');
  document.getElementById('btnFiltrar').addEventListener('click', handleFiltrar);
}

async function handleFiltrar() {
  const fecha = document.getElementById('pedFecha').value;
  const estado = document.getElementById('pedEstado').value;
  const pedidos = await getPedidosData(fecha, estado);
  document.getElementById('pedidosBody').innerHTML = pedidos.slice().reverse().map(buildPedidoRow).join('');
}

async function verPedido(id) {
  const p = await getPedidoById(id);
  if (!p) return;
  document.getElementById('detallePedidoTitle').textContent = `PED-${String(p.id).padStart(3, '0')}`;
  document.getElementById('detallePedidoBody').innerHTML = buildPedidoDetailView(p);
  new bootstrap.Modal(document.getElementById('modalDetallePedido')).show();
}

async function cambiarEstado(id, estado) {
  await updateEstadoPedido(id, estado);
  renderPedidos();
}

async function renderCocina() {
  const activos = await getPedidosCocina();
  const mc = document.getElementById('moduleContent');
  mc.innerHTML = '';

  if (!activos.length) {
    mc.appendChild(document.getElementById('tplCocinaEmpty').content.cloneNode(true));
    return;
  }
  mc.appendChild(document.getElementById('tplCocina').content.cloneNode(true));
  document.getElementById('cocinaBoard').innerHTML = activos.map(buildCocinaTicket).join('');
}

async function cambiarEstadoCocina(id, estado) {
  await updateEstadoPedido(id, estado);
  renderCocina();
}
