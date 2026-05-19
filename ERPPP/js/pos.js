let cart = [];
let posProductos = [];
let posCategorias = [];
let posAdicionales = [];
let savedOrders = JSON.parse(localStorage.getItem('mt_saved_orders') || '[]');
let pendingOrder = null;
let upsellItems = [];

async function renderPOS() {
  posCategorias = await dbGetAll('categorias');
  posProductos = await dbGetAll('productos');
  posAdicionales = await dbGetAll('adicionales');

  const catBtns = `<button class="cat-btn active" data-cat="all"><i class="fa-solid fa-border-all"></i> Todos</button>` +
    posCategorias.map(c => `<button class="cat-btn" data-cat="${c.nombre}"><i class="fa-solid ${c.icono}"></i> ${c.nombre}</button>`).join('');

  document.getElementById('moduleContent').innerHTML = `
    <div class="pos-layout fade-in">
      <aside class="pos-categories">
        <h4>Categorías</h4>
        <div id="posCatList">${catBtns}</div>
      </aside>
      <section class="pos-products">
        <div class="pos-search"><i class="fa-solid fa-magnifying-glass"></i><input type="text" id="posSearchInput" placeholder="Buscar producto..."></div>
        <div id="posProductGrid" class="product-grid"></div>
      </section>
      <aside class="pos-cart">
        <h4><i class="fa-solid fa-cart-shopping"></i> Pedido actual</h4>
        <div id="posCartItems" class="cart-items"></div>
        <div class="cart-footer" id="cartFooter">
          <div class="cart-total"><span>Total</span><strong id="posCartTotal">S/ 0.00</strong></div>
          <div class="cart-actions-row">
            <button class="btn btn-outline" id="btnGuardarPedido" disabled><i class="fa-solid fa-bookmark"></i> Guardar</button>
            <button class="btn btn-primary btn-lg" id="btnGenerarOrden" disabled><i class="fa-solid fa-receipt"></i> Generar Orden</button>
          </div>
        </div>
      </aside>
    </div>`;

  document.getElementById('moduleContent').insertAdjacentHTML('beforeend', tplPOSModals());
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
  document.getElementById('btnConfirmarCliente').addEventListener('click', handleConfirmarCliente);
  document.getElementById('cliMesa').addEventListener('input', e => {
    document.getElementById('cliMesaBadge').innerHTML = e.target.value === '0' ? '<span class="badge badge-info mt-4">Para Llevar</span>' : '';
  });
}

function renderPosProducts(cat, search = '') {
  let list = posProductos.filter(p => p.disponible);
  if (cat !== 'all') list = list.filter(p => p.categoria === cat);
  if (search) list = list.filter(p => p.nombre.toLowerCase().includes(search));
  const grid = document.getElementById('posProductGrid');
  grid.innerHTML = list.length
    ? list.map((p, i) => tplProductCard(p, i)).join('')
    : '<p class="empty-state">Sin productos disponibles</p>';
}

function quickAdd(id) {
  const prod = posProductos.find(p => p.id === id);
  if (!prod) return;
  const ex = cart.find(c => c.prodId === id && !c.notas && !c.quitados.length && !c.extras.length);
  if (ex) ex.cantidad++;
  else cart.push({ prodId: id, nombre: prod.nombre, precio: prod.precio, cantidad: 1, notas: '', quitados: [], extras: [] });
  renderPosCart();
}

function openPersonalizar(id) {
  const prod = posProductos.find(p => p.id === id);
  if (!prod) return;
  document.getElementById('mpNombre').textContent = prod.nombre + ' — S/ ' + prod.precio.toFixed(2);

  let html = '';
  if (prod.ingredientes?.length) {
    html += '<div class="mp-section"><h5>Ingredientes</h5><p class="text-muted">Desmarque lo que no desea</p>';
    prod.ingredientes.forEach(i => { html += `<label class="check-label"><input type="checkbox" checked value="${i}"> ${i}</label>`; });
    html += '</div>';
  }
  if (prod.extras?.length) {
    html += '<div class="mp-section"><h5>Extras</h5>';
    prod.extras.forEach(e => { html += `<label class="check-label"><input type="checkbox" data-extra='${JSON.stringify(e)}'> ${e.nombre} (+S/ ${e.precio.toFixed(2)})</label>`; });
    html += '</div>';
  }
  html += '<div class="mp-section"><h5>Notas</h5><textarea id="mpNotas" class="form-control" rows="2" placeholder="Instrucciones..."></textarea></div>';
  html += '<div class="mp-section"><h5>Cantidad</h5><div class="qty-control"><button class="btn btn-sm btn-outline" id="mpQtyM">-</button><input type="number" id="mpQty" value="1" min="1" class="form-control qty-input"><button class="btn btn-sm btn-outline" id="mpQtyP">+</button></div></div>';

  document.getElementById('mpBody').innerHTML = html;
  openModal('modalPersonalizar');

  document.getElementById('mpQtyM').onclick = () => { const i = document.getElementById('mpQty'); if (+i.value > 1) i.value = +i.value - 1; };
  document.getElementById('mpQtyP').onclick = () => { const i = document.getElementById('mpQty'); i.value = +i.value + 1; };
  document.getElementById('mpAgregar').onclick = () => {
    const quitados = [], extras = [];
    document.querySelectorAll('#mpBody input[type=checkbox]').forEach(cb => {
      if (!cb.dataset.extra && !cb.checked) quitados.push(cb.value);
      if (cb.dataset.extra && cb.checked) extras.push(JSON.parse(cb.dataset.extra));
    });
    const extraTotal = extras.reduce((s, e) => s + e.precio, 0);
    cart.push({ prodId: id, nombre: prod.nombre, precio: prod.precio + extraTotal, cantidad: +document.getElementById('mpQty').value || 1, notas: document.getElementById('mpNotas').value.trim(), quitados, extras });
    renderPosCart();
    closeModal('modalPersonalizar');
  };
}

function renderPosCart() {
  const c = document.getElementById('posCartItems');
  const btnOrden = document.getElementById('btnGenerarOrden');
  const btnGuardar = document.getElementById('btnGuardarPedido');
  if (!cart.length) {
    c.innerHTML = '<div class="empty-cart"><i class="fa-solid fa-cart-shopping"></i><p>Sin productos</p></div>';
    btnOrden.disabled = true;
    btnGuardar.disabled = true;
  } else {
    c.innerHTML = cart.map((item, i) => tplCartItem(item, i)).join('');
    btnOrden.disabled = false;
    btnGuardar.disabled = false;
  }
  document.getElementById('posCartTotal').textContent = `S/ ${cart.reduce((s, c) => s + c.precio * c.cantidad, 0).toFixed(2)}`;
}

function cartQty(i, d) { cart[i].cantidad += d; if (cart[i].cantidad < 1) cart.splice(i, 1); renderPosCart(); }
function cartRemove(i) { cart.splice(i, 1); renderPosCart(); }

function guardarPedidoEnEspera() {
  if (!cart.length) return;
  const session = getSession();
  savedOrders.push({
    id: Date.now(),
    fecha: new Date().toLocaleString('es-PE'),
    cajero: session.nombre,
    items: [...cart],
    total: cart.reduce((s, c) => s + c.precio * c.cantidad, 0)
  });
  localStorage.setItem('mt_saved_orders', JSON.stringify(savedOrders));
  cart = [];
  renderPosCart();
}

function openClienteModal() {
  const f = document.getElementById('formCliente');
  f.classList.remove('was-validated');
  ['cliNombre', 'cliMesa', 'cliTelefono'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('cliMesaBadge').innerHTML = '';
  document.querySelector('input[name=tipoPago][value=efectivo]').checked = true;
  const t = cart.reduce((s, c) => s + c.precio * c.cantidad, 0);
  document.getElementById('cliResumen').innerHTML = cart.map(c => `<div class="summary-line"><span>${c.cantidad}x ${c.nombre}</span><span>S/ ${(c.precio * c.cantidad).toFixed(2)}</span></div>`).join('');
  document.getElementById('cliTotal').textContent = `S/ ${t.toFixed(2)}`;
  openModal('modalCliente');
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
  closeModal('modalCliente');
  showUpsell();
}

function showUpsell() {
  document.getElementById('upsellGrid').innerHTML = posAdicionales.filter(a => a.disponible).map(a =>
    `<div class="upsell-card"><div class="upsell-name">${a.nombre}</div><div class="upsell-price">S/ ${a.precio.toFixed(2)}</div><button class="btn btn-sm btn-primary" onclick="addUpsell('${a.nombre}',${a.precio})"><i class="fa-solid fa-plus"></i></button></div>`
  ).join('');
  document.getElementById('upsellAdded').innerHTML = '';
  openModal('modalUpsell');
}

function addUpsell(n, p) {
  upsellItems.push({ nombre: n, precio: p, cantidad: 1 });
  document.getElementById('upsellAdded').innerHTML = '<h5 class="mt-8">Agregados:</h5>' +
    upsellItems.map(u => `<div class="summary-line"><span>${u.nombre}</span><span>S/ ${u.precio.toFixed(2)}</span></div>`).join('');
}

function skipUpsell() { upsellItems = []; closeModal('modalUpsell'); finalizarPedido(); }
function confirmUpsell() { closeModal('modalUpsell'); finalizarPedido(); }

async function finalizarPedido() {
  upsellItems.forEach(u => cart.push({ prodId: null, nombre: u.nombre, precio: u.precio, cantidad: u.cantidad, notas: '', quitados: [], extras: [] }));
  const total = cart.reduce((s, c) => s + c.precio * c.cantidad, 0);
  const session = getSession();

  /* SPRING BOOT: Reemplazar por POST /api/pedidos */
  const pedido = {
    fecha: new Date().toLocaleString('es-PE'),
    cliente: pendingOrder.nombre,
    mesa: pendingOrder.mesa,
    telefono: pendingOrder.telefono,
    cajero: session.nombre,
    estado: 'pendiente',
    items: cart.map(c => ({ nombre: c.nombre, precio: c.precio, cantidad: c.cantidad, notas: c.notas, quitados: c.quitados, extras: c.extras })),
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
  openModal('modalRecibo');
}

function renderGuardados() {
  savedOrders = JSON.parse(localStorage.getItem('mt_saved_orders') || '[]');
  const el = document.getElementById('moduleContent');
  if (!savedOrders.length) {
    el.innerHTML = '<div class="empty-state full"><i class="fa-solid fa-bookmark"></i><p>Sin pedidos guardados</p></div>';
    return;
  }
  el.innerHTML = `<div class="saved-grid fade-in">${savedOrders.map((o, i) => `
    <div class="card saved-card stagger" style="animation-delay:${i * 60}ms">
      <div class="card-header"><h4>Pedido #${i + 1}</h4><span class="badge badge-warn">En espera</span></div>
      <div class="saved-meta"><i class="fa-solid fa-clock"></i> ${o.fecha}</div>
      <div class="saved-meta"><i class="fa-solid fa-user"></i> ${o.cajero}</div>
      <ul class="saved-items">${o.items.map(it => `<li>${it.cantidad}x ${it.nombre}</li>`).join('')}</ul>
      <div class="saved-total"><span>Total:</span><strong>S/ ${o.total.toFixed(2)}</strong></div>
      <div class="saved-actions">
        <button class="btn btn-primary btn-block" onclick="recuperarPedido(${i})"><i class="fa-solid fa-rotate-left"></i> Recuperar</button>
        <button class="btn btn-danger btn-block" onclick="eliminarGuardado(${i})"><i class="fa-solid fa-trash"></i> Eliminar</button>
      </div>
    </div>`).join('')}</div>`;
}

function recuperarPedido(index) {
  const order = savedOrders[index];
  if (!order) return;
  cart = [...order.items];
  savedOrders.splice(index, 1);
  localStorage.setItem('mt_saved_orders', JSON.stringify(savedOrders));
  window.location.href = 'pos.html';
}

function eliminarGuardado(index) {
  savedOrders.splice(index, 1);
  localStorage.setItem('mt_saved_orders', JSON.stringify(savedOrders));
  renderGuardados();
}

function printReceipt() { window.print(); }
function closeReceipt() { closeModal('modalRecibo'); }
