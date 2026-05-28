/* pos.js — Punto de Venta */

let cart = [];
let posProductos = [];
let posCategorias = [];
let posAdicionales = [];
let savedOrders = JSON.parse(localStorage.getItem('mt_saved_orders') || '[]');
let pendingOrder = null;
let upsellItems = [];

// Fix Bug #7: persistir carrito en sessionStorage
function saveCart() { sessionStorage.setItem('mt_cart', JSON.stringify(cart)); }
function loadCart() { const s = sessionStorage.getItem('mt_cart'); if (s) cart = JSON.parse(s); }

async function renderPOS() {
  loadCart();
  posCategorias = await dbGetAll('categorias');
  posProductos = await dbGetAll('productos');
  posAdicionales = await dbGetAll('adicionales');

  const catBtns = `<button class="cat-btn active" data-cat="all"><i class="fa-solid fa-border-all"></i> Todos</button>` +
    posCategorias.map(c => `<button class="cat-btn" data-cat="${c.nombre}"><i class="fa-solid ${c.icono}"></i> ${c.nombre}</button>`).join('');

  document.getElementById('moduleContent').innerHTML = `
    <div class="pos-layout fade-in">
      <aside class="pos-categories card p-3">
        <h6 class="text-uppercase text-muted small mb-2">Categorías</h6>
        <div id="posCatList">${catBtns}</div>
      </aside>
      <section class="card p-3">
        <div class="input-group mb-3">
          <span class="input-group-text"><i class="fa-solid fa-magnifying-glass"></i></span>
          <input type="text" id="posSearchInput" class="form-control" placeholder="Buscar producto...">
        </div>
        <div id="posProductGrid" class="product-grid"></div>
      </section>
      <aside class="pos-cart card p-3">
        <h6><i class="fa-solid fa-cart-shopping me-2"></i>Pedido actual</h6>
        <div id="posCartItems" class="cart-items"></div>
        <div class="border-top pt-3 mt-2">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="fw-semibold">Total</span>
            <strong class="fs-5 text-brand-dark" id="posCartTotal">S/ 0.00</strong>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary" id="btnGuardarPedido" disabled><i class="fa-solid fa-bookmark"></i> Guardar</button>
            <button class="btn btn-brand flex-grow-1" id="btnGenerarOrden" disabled><i class="fa-solid fa-receipt"></i> Generar Orden</button>
          </div>
        </div>
      </aside>
    </div>`;

  renderPosProducts('all');
  renderPosCart();
  bindPosEvents();
}

function bindPosEvents() {
  document.querySelectorAll('.cat-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderPosProducts(btn.dataset.cat);
  }));
  document.getElementById('posSearchInput').addEventListener('input', e => {
    const cat = document.querySelector('.cat-btn.active')?.dataset.cat || 'all';
    renderPosProducts(cat, e.target.value.toLowerCase());
  });
  document.getElementById('btnGenerarOrden').addEventListener('click', openClienteModal);
  document.getElementById('btnGuardarPedido').addEventListener('click', guardarPedidoEnEspera);

  // Modal cliente: confirmar
  document.getElementById('btnConfirmarCliente').addEventListener('click', handleConfirmarCliente);
  document.getElementById('cliMesa').addEventListener('input', e => {
    document.getElementById('cliMesaBadge').innerHTML = e.target.value === '0' ? '<span class="badge text-bg-info mt-1">Para Llevar</span>' : '';
  });
}

function renderPosProducts(cat, search = '') {
  let list = posProductos.filter(p => p.disponible);
  if (cat !== 'all') list = list.filter(p => p.categoria === cat);
  if (search) list = list.filter(p => p.nombre.toLowerCase().includes(search));
  const grid = document.getElementById('posProductGrid');
  grid.innerHTML = list.length
    ? list.map((p, i) => tplProductCard(p, i)).join('')
    : '<p class="text-center text-muted py-4">Sin productos disponibles</p>';
}

function quickAdd(id) {
  const prod = posProductos.find(p => p.id === id);
  if (!prod) return;
  const ex = cart.find(c => c.prodId === id && !c.notas && !c.quitados.length && !c.extras.length);
  if (ex) ex.cantidad++;
  else cart.push({ prodId:id, nombre:prod.nombre, precio:prod.precio, cantidad:1, notas:'', quitados:[], extras:[] });
  renderPosCart();
}

function openPersonalizar(id) {
  const prod = posProductos.find(p => p.id === id);
  if (!prod) return;
  document.getElementById('mpNombre').textContent = prod.nombre + ' — S/ ' + prod.precio.toFixed(2);

  let html = '';
  if (prod.ingredientes?.length) {
    html += '<h6 class="mb-2">Ingredientes <small class="text-muted fw-normal">Desmarque lo que no desea</small></h6>';
    prod.ingredientes.forEach(i => { html += `<div class="form-check"><input class="form-check-input" type="checkbox" checked value="${i}" id="ing_${i}"><label class="form-check-label" for="ing_${i}">${i}</label></div>`; });
    html += '<hr>';
  }
  if (prod.extras?.length) {
    html += '<h6 class="mb-2">Extras</h6>';
    prod.extras.forEach((e,idx) => { html += `<div class="form-check"><input class="form-check-input" type="checkbox" data-extra='${JSON.stringify(e)}' id="ext_${idx}"><label class="form-check-label" for="ext_${idx}">${e.nombre} (+S/ ${e.precio.toFixed(2)})</label></div>`; });
    html += '<hr>';
  }
  html += `<div class="mb-3"><label class="form-label">Notas</label><textarea id="mpNotas" class="form-control" rows="2" placeholder="Instrucciones..."></textarea></div>`;
  html += `<div class="d-flex align-items-center gap-2"><label class="form-label mb-0">Cantidad</label><div class="btn-group btn-group-sm"><button type="button" class="btn btn-outline-secondary" id="mpQtyM">-</button></div><input type="number" id="mpQty" value="1" min="1" class="form-control form-control-sm text-center" style="width:60px"><div class="btn-group btn-group-sm"><button type="button" class="btn btn-outline-secondary" id="mpQtyP">+</button></div></div>`;

  document.getElementById('mpBody').innerHTML = html;
  const modal = new bootstrap.Modal(document.getElementById('modalPersonalizar'));
  modal.show();

  document.getElementById('mpQtyM').onclick = () => { const i = document.getElementById('mpQty'); if (+i.value > 1) i.value = +i.value - 1; };
  document.getElementById('mpQtyP').onclick = () => { const i = document.getElementById('mpQty'); i.value = +i.value + 1; };
  document.getElementById('mpAgregar').onclick = () => {
    const quitados = [], extras = [];
    document.querySelectorAll('#mpBody input[type=checkbox]').forEach(cb => {
      if (!cb.dataset.extra && !cb.checked) quitados.push(cb.value);
      if (cb.dataset.extra && cb.checked) extras.push(JSON.parse(cb.dataset.extra));
    });
    const extraTotal = extras.reduce((s,e) => s + e.precio, 0);
    cart.push({ prodId:id, nombre:prod.nombre, precio:prod.precio+extraTotal, cantidad:+document.getElementById('mpQty').value||1, notas:document.getElementById('mpNotas').value.trim(), quitados, extras });
    renderPosCart();
    modal.hide();
  };
}

function renderPosCart() {
  const c = document.getElementById('posCartItems');
  const btnOrden = document.getElementById('btnGenerarOrden');
  const btnGuardar = document.getElementById('btnGuardarPedido');
  if (!cart.length) {
    c.innerHTML = '<div class="empty-cart"><i class="fa-solid fa-cart-shopping"></i><p class="small mt-2">Sin productos</p></div>';
    btnOrden.disabled = true;
    btnGuardar.disabled = true;
  } else {
    c.innerHTML = cart.map((item, i) => tplCartItem(item, i)).join('');
    btnOrden.disabled = false;
    btnGuardar.disabled = false;
  }
  document.getElementById('posCartTotal').textContent = `S/ ${cart.reduce((s,c) => s + c.precio*c.cantidad, 0).toFixed(2)}`;
  saveCart();
}

function cartQty(i, d) { cart[i].cantidad += d; if (cart[i].cantidad < 1) cart.splice(i,1); renderPosCart(); }
function cartRemove(i) { cart.splice(i,1); renderPosCart(); }

// Fix Bug #10: toast de confirmación
function guardarPedidoEnEspera() {
  if (!cart.length) return;
  const session = getSession();
  savedOrders.push({
    id: Date.now(),
    fecha: new Date().toISOString(),
    cajero: session.nombre,
    items: [...cart],
    total: cart.reduce((s,c) => s + c.precio*c.cantidad, 0)
  });
  localStorage.setItem('mt_saved_orders', JSON.stringify(savedOrders));
  cart = [];
  renderPosCart();
  showToast('Pedido guardado en espera', 'info');
}

function openClienteModal() {
  const form = document.getElementById('formCliente');
  form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  ['cliNombre','cliMesa','cliTelefono'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('cliMesaBadge').innerHTML = '';
  document.querySelector('input[name=tipoPago][value=efectivo]').checked = true;

  const t = cart.reduce((s,c) => s + c.precio*c.cantidad, 0);
  document.getElementById('cliResumen').innerHTML = cart.map(c => `<div class="d-flex justify-content-between small"><span>${c.cantidad}x ${c.nombre}</span><span>S/ ${(c.precio*c.cantidad).toFixed(2)}</span></div>`).join('');
  document.getElementById('cliTotal').textContent = `S/ ${t.toFixed(2)}`;
  new bootstrap.Modal(document.getElementById('modalCliente')).show();
}

function handleConfirmarCliente(e) {
  e.preventDefault();
  if (!validateForm('formCliente', {
    cliNombre: [V.required('Ingrese el nombre'), V.minLength(2), V.alphaSpaces()],
    cliMesa: [V.required('Ingrese número de mesa')]
  })) return;

  pendingOrder = {
    nombre: document.getElementById('cliNombre').value.trim(),
    mesa: +document.getElementById('cliMesa').value,
    telefono: document.getElementById('cliTelefono').value.trim(),
    tipoPago: document.querySelector('input[name=tipoPago]:checked').value
  };
  upsellItems = [];
  bootstrap.Modal.getInstance(document.getElementById('modalCliente')).hide();
  showUpsell();
}

function showUpsell() {
  document.getElementById('upsellGrid').innerHTML = posAdicionales.filter(a => a.disponible).map(a =>
    `<div class="card upsell-card p-2">
      <strong class="small">${a.nombre}</strong>
      <div class="text-brand fw-bold small mb-1">S/ ${a.precio.toFixed(2)}</div>
      <button class="btn btn-brand btn-sm" onclick="addUpsell('${a.nombre}',${a.precio})"><i class="fa-solid fa-plus"></i></button>
    </div>`
  ).join('');
  document.getElementById('upsellAdded').innerHTML = '';
  new bootstrap.Modal(document.getElementById('modalUpsell')).show();
}

function addUpsell(n, p) {
  upsellItems.push({ nombre:n, precio:p, cantidad:1 });
  document.getElementById('upsellAdded').innerHTML = '<h6 class="mt-2">Agregados:</h6>' +
    upsellItems.map(u => `<div class="d-flex justify-content-between small"><span>${u.nombre}</span><span>S/ ${u.precio.toFixed(2)}</span></div>`).join('');
}

function skipUpsell() {
  upsellItems = [];
  bootstrap.Modal.getInstance(document.getElementById('modalUpsell')).hide();
  finalizarPedido();
}
function confirmUpsell() {
  bootstrap.Modal.getInstance(document.getElementById('modalUpsell')).hide();
  finalizarPedido();
}

async function finalizarPedido() {
  upsellItems.forEach(u => cart.push({ prodId:null, nombre:u.nombre, precio:u.precio, cantidad:u.cantidad, notas:'', quitados:[], extras:[] }));
  const total = cart.reduce((s,c) => s + c.precio*c.cantidad, 0);
  const session = getSession();

  const pedido = {
    fecha: new Date().toISOString(),
    cliente: pendingOrder.nombre,
    mesa: pendingOrder.mesa,
    telefono: pendingOrder.telefono,
    cajero: session.nombre,
    estado: 'pendiente',
    items: cart.map(c => ({ nombre:c.nombre, precio:c.precio, cantidad:c.cantidad, notas:c.notas, quitados:c.quitados, extras:c.extras })),
    subtotal: total,
    total,
    tipoPago: pendingOrder.tipoPago,
    tipo: pendingOrder.mesa === 0 ? 'llevar' : 'mesa'
  };

  const id = await dbAdd('pedidos', pedido);
  pedido.id = id;
  showReceipt(pedido);
  cart = [];
  renderPosCart();
}

function showReceipt(p) {
  document.getElementById('reciboContent').innerHTML = tplReceipt(p);
  new bootstrap.Modal(document.getElementById('modalRecibo')).show();
}

// Pedidos guardados
function renderGuardados() {
  savedOrders = JSON.parse(localStorage.getItem('mt_saved_orders') || '[]');
  const el = document.getElementById('moduleContent');
  if (!savedOrders.length) {
    el.innerHTML = '<div class="text-center text-muted py-5"><i class="fa-solid fa-bookmark fs-1 opacity-25 d-block mb-2"></i><p>Sin pedidos guardados</p></div>';
    return;
  }
  el.innerHTML = `<div class="saved-grid fade-in">${savedOrders.map((o, i) => `
    <div class="card stagger" style="animation-delay:${i*60}ms">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h6 class="mb-0">Pedido #${i+1}</h6>
          <span class="badge text-bg-warning">En espera</span>
        </div>
        <small class="text-muted d-block"><i class="fa-solid fa-clock me-1"></i>${formatDate(o.fecha)}</small>
        <small class="text-muted d-block mb-2"><i class="fa-solid fa-user me-1"></i>${o.cajero}</small>
        <ul class="list-unstyled border-top border-bottom py-2 mb-2">
          ${o.items.map(it => `<li class="small">${it.cantidad}x ${it.nombre}</li>`).join('')}
        </ul>
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span>Total:</span><strong class="text-brand-dark fs-5">S/ ${o.total.toFixed(2)}</strong>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-brand flex-grow-1" onclick="recuperarPedido(${i})"><i class="fa-solid fa-rotate-left"></i> Recuperar</button>
          <button class="btn btn-outline-danger" onclick="eliminarGuardado(${i})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>`).join('')}</div>`;
}

// Fix Bug #7: confirmar antes de sobrescribir carrito
function recuperarPedido(index) {
  const order = savedOrders[index];
  if (!order) return;
  if (cart.length > 0 && !confirm('Ya tienes productos en el carrito. ¿Reemplazar?')) return;
  cart = [...order.items];
  saveCart();
  savedOrders.splice(index, 1);
  localStorage.setItem('mt_saved_orders', JSON.stringify(savedOrders));
  window.location.href = 'pos.html';
}

function eliminarGuardado(index) {
  if (!confirm('¿Eliminar pedido guardado?')) return;
  savedOrders.splice(index, 1);
  localStorage.setItem('mt_saved_orders', JSON.stringify(savedOrders));
  renderGuardados();
}

function printReceipt() { window.print(); }
function closeReceipt() { bootstrap.Modal.getInstance(document.getElementById('modalRecibo')).hide(); }
