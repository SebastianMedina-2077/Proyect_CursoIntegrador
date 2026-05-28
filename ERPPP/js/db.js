/*
  db.js — Capa de datos (IndexedDB)

  MIGRACIÓN A SPRING BOOT:
  Reemplazar el contenido de las funciones CRUD por fetch().
  La interfaz (dbGetAll, dbGet, dbAdd, dbPut, dbDelete) NO cambia,
  así ningún módulo necesita modificarse.

  Ejemplo:
    async function dbGetAll(store) {
      return fetch(`/api/${store}`, { headers: authHeaders() }).then(r => r.json());
    }
*/

const DB_NAME = 'MammaTomatoDB';
const DB_VERSION = 1;
let db = null;

const STORES = {
  usuarios:    { keyPath: 'id', autoIncrement: true },
  productos:   { keyPath: 'id', autoIncrement: true },
  categorias:  { keyPath: 'id', autoIncrement: true },
  pedidos:     { keyPath: 'id', autoIncrement: true },
  inventario:  { keyPath: 'id', autoIncrement: true },
  empleados:   { keyPath: 'id', autoIncrement: true },
  movimientos: { keyPath: 'id', autoIncrement: true },
  adicionales: { keyPath: 'id', autoIncrement: true },
};

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      Object.entries(STORES).forEach(([name, opts]) => {
        if (!d.objectStoreNames.contains(name)) d.createObjectStore(name, opts);
      });
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = e => reject(e.target.error);
  });
}

function tx(store, mode = 'readonly') {
  return db.transaction(store, mode).objectStore(store);
}

// CRUD — reemplazar por fetch('/api/...') en Spring Boot
function dbGetAll(store) {
  return new Promise((res, rej) => { const r = tx(store).getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
function dbGet(store, id) {
  return new Promise((res, rej) => { const r = tx(store).get(id); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
function dbAdd(store, data) {
  return new Promise((res, rej) => { const r = tx(store, 'readwrite').add(data); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
function dbPut(store, data) {
  return new Promise((res, rej) => { const r = tx(store, 'readwrite').put(data); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}
function dbDelete(store, id) {
  return new Promise((res, rej) => { const r = tx(store, 'readwrite').delete(id); r.onsuccess = () => res(); r.onerror = () => rej(r.error); });
}
function dbCount(store) {
  return new Promise((res, rej) => { const r = tx(store).count(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}

// Utilidades de fecha
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch { return dateStr; }
}

function isToday(dateStr) {
  if (!dateStr) return false;
  try {
    const d = new Date(dateStr), t = new Date();
    return !isNaN(d) && d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  } catch { return false; }
}

function matchesDate(dateStr, inputDate) {
  if (!dateStr || !inputDate) return false;
  try {
    const d = new Date(dateStr), [y, m, day] = inputDate.split('-').map(Number);
    return !isNaN(d) && d.getFullYear() === y && (d.getMonth()+1) === m && d.getDate() === day;
  } catch { return false; }
}

// Seed — mover a data.sql en Spring Boot. Contraseñas: usar BCrypt en producción.
async function seedDB() {
  if (await dbCount('usuarios') > 0) return;

  const categorias = [
    { nombre: 'Pizzas Grandes', icono: 'fa-pizza-slice' },
    { nombre: 'Pizzas Medianas', icono: 'fa-pizza-slice' },
    { nombre: 'Panizzas', icono: 'fa-bread-slice' },
    { nombre: 'Bebidas', icono: 'fa-glass-water' },
    { nombre: 'Complementos', icono: 'fa-utensils' }
  ];
  for (const c of categorias) await dbAdd('categorias', c);

  const productos = [
    { codigo:'PZG-001', nombre:'Diavola Pepperoni Grande', precio:49.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Pepperoni','Aceitunas'], extras:[{nombre:'Extra queso',precio:5},{nombre:'Extra pepperoni',precio:6}] },
    { codigo:'PZG-002', nombre:'Americana Di Roma Grande', precio:49.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Jamón americano','Tocino'], extras:[{nombre:'Extra queso',precio:5}] },
    { codigo:'PZG-003', nombre:'Americana Bondiola Grande', precio:52.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Bondiola','Cebolla caramelizada'], extras:[{nombre:'Extra queso',precio:5}] },
    { codigo:'PZG-004', nombre:'Americana Prosciutto Grande', precio:54.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Prosciutto','Rúcula'], extras:[{nombre:'Extra prosciutto',precio:7}] },
    { codigo:'PZG-005', nombre:'4 Stagioni Grande', precio:56.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Jamón','Champiñones','Alcachofas','Aceitunas'], extras:[{nombre:'Extra queso',precio:5}] },
    { codigo:'PZG-006', nombre:'Prosciutto Portobello Grande', precio:59.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Prosciutto','Portobello'], extras:[{nombre:'Extra portobello',precio:5}] },
    { codigo:'PZG-007', nombre:'Prosciutto & Carne Grande', precio:59.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Prosciutto','Carne'], extras:[{nombre:'Extra queso',precio:5}] },
    { codigo:'PZG-008', nombre:'Tutto Carnes Grande', precio:58.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Pepperoni','Jamón','Tocino','Carne'], extras:[{nombre:'Extra queso',precio:5}] },
    { codigo:'PZG-009', nombre:'Supremissima Grande', precio:54.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Pepperoni','Champiñones','Pimiento','Cebolla'], extras:[{nombre:'Extra queso',precio:5}] },
    { codigo:'PZG-010', nombre:'Hawaiiana Fiesta Grande', precio:52.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Jamón','Piña','Durazno'], extras:[{nombre:'Extra queso',precio:5}] },
    { codigo:'PZG-011', nombre:'Hawaiiana Crispy Grande', precio:56.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Pollo crispy','Piña','Tocino'], extras:[{nombre:'Extra queso',precio:5}] },
    { codigo:'PZG-012', nombre:'Miss Veggie Grande', precio:54.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Champiñones','Pimiento','Cebolla','Aceitunas','Tomate'], extras:[{nombre:'Extra queso',precio:5}] },
    { codigo:'PZG-013', nombre:'Caprichosa Grande', precio:58.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Jamón','Champiñones','Alcachofas','Aceitunas'], extras:[{nombre:'Extra queso',precio:5}] },
    { codigo:'PZG-014', nombre:'Carbonara Grande', precio:54.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Crema','Mozzarella','Tocino','Cebolla','Huevo'], extras:[{nombre:'Extra queso',precio:5}] },
    { codigo:'PZG-015', nombre:'Quattro Formaggi Grande', precio:54.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Mozzarella','Parmesano','Gorgonzola','Provolone'], extras:[{nombre:'Extra queso',precio:5}] },
    { codigo:'PZG-016', nombre:'Ahumado 3 Carnes Grande', precio:56.90, categoria:'Pizzas Grandes', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Carne ahumada','Tocino','Pepperoni'], extras:[{nombre:'Extra queso',precio:5}] },
    { codigo:'PZM-001', nombre:'Diavola Pepperoni Mediana', precio:32.90, categoria:'Pizzas Medianas', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Pepperoni','Aceitunas'], extras:[{nombre:'Extra queso',precio:4}] },
    { codigo:'PZM-002', nombre:'Americana Di Roma Mediana', precio:32.90, categoria:'Pizzas Medianas', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Jamón americano','Tocino'], extras:[{nombre:'Extra queso',precio:4}] },
    { codigo:'PZM-003', nombre:'4 Stagioni Mediana', precio:39.90, categoria:'Pizzas Medianas', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Jamón','Champiñones','Alcachofas','Aceitunas'], extras:[{nombre:'Extra queso',precio:4}] },
    { codigo:'PZM-004', nombre:'Prosciutto Portobello Mediana', precio:42.90, categoria:'Pizzas Medianas', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Prosciutto','Portobello'], extras:[{nombre:'Extra queso',precio:4}] },
    { codigo:'PZM-005', nombre:'Prosciutto & Carne Mediana', precio:42.90, categoria:'Pizzas Medianas', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Prosciutto','Carne'], extras:[{nombre:'Extra queso',precio:4}] },
    { codigo:'PZM-006', nombre:'Supremissima Mediana', precio:37.90, categoria:'Pizzas Medianas', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Pepperoni','Champiñones','Pimiento','Cebolla'], extras:[{nombre:'Extra queso',precio:4}] },
    { codigo:'PZM-007', nombre:'Hawaiiana Fiesta Mediana', precio:35.90, categoria:'Pizzas Medianas', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Jamón','Piña','Durazno'], extras:[{nombre:'Extra queso',precio:4}] },
    { codigo:'PZM-008', nombre:'Hawaiiana Crispy Mediana', precio:39.90, categoria:'Pizzas Medianas', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Pollo crispy','Piña','Tocino'], extras:[{nombre:'Extra queso',precio:4}] },
    { codigo:'PZM-009', nombre:'Miss Veggie Mediana', precio:37.90, categoria:'Pizzas Medianas', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Champiñones','Pimiento','Cebolla','Aceitunas'], extras:[{nombre:'Extra queso',precio:4}] },
    { codigo:'PZM-010', nombre:'Caprichosa Mediana', precio:41.90, categoria:'Pizzas Medianas', disponible:true, ingredientes:['Masa','Salsa de tomate','Mozzarella','Jamón','Champiñones','Alcachofas'], extras:[{nombre:'Extra queso',precio:4}] },
    { codigo:'PZM-011', nombre:'Carbonara Mediana', precio:37.90, categoria:'Pizzas Medianas', disponible:true, ingredientes:['Masa','Crema','Mozzarella','Tocino','Cebolla','Huevo'], extras:[{nombre:'Extra queso',precio:4}] },
    { codigo:'PZM-012', nombre:'Quattro Formaggi Mediana', precio:37.90, categoria:'Pizzas Medianas', disponible:true, ingredientes:['Masa','Mozzarella','Parmesano','Gorgonzola','Provolone'], extras:[{nombre:'Extra queso',precio:4}] },
    { codigo:'PAN-001', nombre:'Panizza Crispy Chicken', precio:18.90, categoria:'Panizzas', disponible:true, ingredientes:['Pan artesanal','Pollo crispy','Mozzarella','Lechuga','Salsa especial'], extras:[{nombre:'Extra queso',precio:3}] },
    { codigo:'PAN-002', nombre:'Panizza Hawaiana', precio:20.90, categoria:'Panizzas', disponible:true, ingredientes:['Pan artesanal','Jamón','Piña','Mozzarella','Salsa especial'], extras:[{nombre:'Extra queso',precio:3}] },
    { codigo:'PAN-003', nombre:'Panizza Bondiola Glaseada', precio:20.90, categoria:'Panizzas', disponible:true, ingredientes:['Pan artesanal','Bondiola glaseada','Mozzarella','Cebolla caramelizada'], extras:[{nombre:'Extra queso',precio:3}] },
    { codigo:'BEB-001', nombre:'Pepsi 355ml', precio:6.90, categoria:'Bebidas', disponible:true, ingredientes:[], extras:[] },
    { codigo:'BEB-002', nombre:'Pepsi 750ml', precio:9.90, categoria:'Bebidas', disponible:true, ingredientes:[], extras:[] },
    { codigo:'BEB-003', nombre:'Coca Cola 500ml', precio:7.90, categoria:'Bebidas', disponible:true, ingredientes:[], extras:[] },
    { codigo:'BEB-004', nombre:'Inca Kola 500ml', precio:7.90, categoria:'Bebidas', disponible:true, ingredientes:[], extras:[] },
    { codigo:'COM-001', nombre:'Fugazza Especial al Ajo', precio:14.90, categoria:'Complementos', disponible:true, ingredientes:['Pan','Ajo','Mozzarella','Aceite de oliva'], extras:[] },
    { codigo:'COM-002', nombre:'Fugazza Champiñones Especial', precio:14.90, categoria:'Complementos', disponible:true, ingredientes:['Pan','Champiñones','Mozzarella','Aceite de oliva'], extras:[] },
    { codigo:'COM-003', nombre:'Fugazza Cebolla Especial', precio:14.90, categoria:'Complementos', disponible:true, ingredientes:['Pan','Cebolla','Mozzarella','Aceite de oliva'], extras:[] },
    { codigo:'COM-004', nombre:'Fugazza Aceitunas Especial', precio:14.90, categoria:'Complementos', disponible:true, ingredientes:['Pan','Aceitunas','Mozzarella','Aceite de oliva'], extras:[] },
    { codigo:'COM-005', nombre:'Crema Alioli', precio:2.90, categoria:'Complementos', disponible:true, ingredientes:[], extras:[] },
    { codigo:'COM-006', nombre:'Crema Mediterránea', precio:2.90, categoria:'Complementos', disponible:true, ingredientes:[], extras:[] }
  ];
  for (const p of productos) await dbAdd('productos', p);

  const adicionales = [
    { nombre:'Pepsi 355ml', precio:6.90, categoria:'Bebidas', disponible:true },
    { nombre:'Coca Cola 500ml', precio:7.90, categoria:'Bebidas', disponible:true },
    { nombre:'Inca Kola 500ml', precio:7.90, categoria:'Bebidas', disponible:true },
    { nombre:'Fugazza Especial al Ajo', precio:14.90, categoria:'Complementos', disponible:true },
    { nombre:'Crema Alioli', precio:2.90, categoria:'Complementos', disponible:true },
    { nombre:'Crema Mediterránea', precio:2.90, categoria:'Complementos', disponible:true }
  ];
  for (const a of adicionales) await dbAdd('adicionales', a);

  // Contraseñas planas solo en dev — usar BCrypt en producción
  const usuarios = [
    { username:'admin', password:'admin123', rol:'admin', nombre:'Jean Marcos', codigo:'ADM-001', estado:'activo' },
    { username:'cajero', password:'cajero123', rol:'cajero', nombre:'Carlos Ruiz', codigo:'CAJ-001', estado:'activo' },
    { username:'cocina', password:'cocina123', rol:'cocina', nombre:'Ana Torres', codigo:'COC-001', estado:'activo' }
  ];
  for (const u of usuarios) await dbAdd('usuarios', u);

  const empleados = [
    { nombre:'Jean', apellido:'Marcos', dni:'70123456', telefono:'987654321', cargo:'Administrador', estado:'activo' },
    { nombre:'Carlos', apellido:'Ruiz', dni:'70234567', telefono:'912345678', cargo:'Cajero', estado:'activo' },
    { nombre:'Ana', apellido:'Torres', dni:'70345678', telefono:'999888777', cargo:'Cocina', estado:'activo' },
    { nombre:'Luis', apellido:'García', dni:'70456789', telefono:'955666777', cargo:'Repartidor', estado:'activo' }
  ];
  for (const e of empleados) await dbAdd('empleados', e);

  const inventario = [
    { codigo:'INS-001', nombre:'Queso mozzarella', stock:12.5, unidad:'kg', stockMinimo:5, precioRef:18.00 },
    { codigo:'INS-002', nombre:'Harina', stock:25, unidad:'kg', stockMinimo:10, precioRef:4.50 },
    { codigo:'INS-003', nombre:'Salsa de tomate', stock:8, unidad:'litros', stockMinimo:3, precioRef:7.00 },
    { codigo:'INS-004', nombre:'Pepperoni', stock:3, unidad:'kg', stockMinimo:2, precioRef:22.00 },
    { codigo:'INS-005', nombre:'Jamón', stock:4, unidad:'kg', stockMinimo:2, precioRef:16.00 },
    { codigo:'INS-006', nombre:'Aceite de oliva', stock:5, unidad:'litros', stockMinimo:2, precioRef:28.00 },
    { codigo:'INS-007', nombre:'Champiñones', stock:1.5, unidad:'kg', stockMinimo:2, precioRef:12.00 },
    { codigo:'INS-008', nombre:'Aceitunas', stock:2, unidad:'kg', stockMinimo:1, precioRef:14.00 }
  ];
  for (const i of inventario) await dbAdd('inventario', i);

  const now = new Date();
  const pedidos = [
    { fecha: new Date(now - 3600000).toISOString(), cliente:'Marco Silva', mesa:5, telefono:'987654321', cajero:'Carlos Ruiz', estado:'pendiente', items:[{nombre:'Diavola Pepperoni Grande',precio:49.90,cantidad:1,notas:'',quitados:[],extras:[]},{nombre:'Pepsi 750ml',precio:9.90,cantidad:1,notas:'',quitados:[],extras:[]}], subtotal:59.80, total:59.80, tipoPago:'efectivo', tipo:'mesa' },
    { fecha: new Date(now - 7200000).toISOString(), cliente:'Luis Pérez', mesa:0, telefono:'912345678', cajero:'Carlos Ruiz', estado:'entregado', items:[{nombre:'Hawaiiana Fiesta Grande',precio:52.90,cantidad:2,notas:'Sin aceitunas',quitados:['Aceitunas'],extras:[]}], subtotal:105.80, total:105.80, tipoPago:'yape', tipo:'llevar' },
    { fecha: new Date(now - 10800000).toISOString(), cliente:'Ana López', mesa:3, telefono:'999888777', cajero:'Carlos Ruiz', estado:'preparando', items:[{nombre:'Tutto Carnes Grande',precio:58.90,cantidad:1,notas:'',quitados:[],extras:[{nombre:'Extra queso',precio:5}]},{nombre:'Fugazza Especial al Ajo',precio:14.90,cantidad:1,notas:'',quitados:[],extras:[]}], subtotal:78.80, total:78.80, tipoPago:'tarjeta', tipo:'mesa' }
  ];
  for (const p of pedidos) await dbAdd('pedidos', p);

  const movimientos = [
    { fecha: new Date(now - 86400000).toISOString(), tipo:'entrada', insumo:'Queso mozzarella', cantidad:'10 kg', usuario:'admin', motivo:'Compra proveedor' },
    { fecha: new Date(now - 43200000).toISOString(), tipo:'salida', insumo:'Queso mozzarella', cantidad:'0.5 kg', usuario:'cocina', motivo:'Consumo producción' },
    { fecha: new Date(now - 36000000).toISOString(), tipo:'salida', insumo:'Salsa de tomate', cantidad:'0.25 litros', usuario:'cocina', motivo:'Consumo producción' }
  ];
  for (const m of movimientos) await dbAdd('movimientos', m);
}

async function initDB() { await openDB(); await seedDB(); }
