# Refactorización ERP Mamma Tomato — Bootstrap + Bug Fixes + Separación de Código

## Descripción

Refactorización completa del frontend del ERP: integrar **Bootstrap 5.3.8**, corregir los 11 bugs detectados, separar responsabilidades (HTML=estructura, CSS=estilos custom, JS=lógica pura), y simplificar el CSS eliminando todo lo que Bootstrap ya provee.

---

## Propuestos Cambios

### Fase 1 — Bootstrap y Estructura Base

#### [MODIFY] Todas las páginas HTML (`index.html` + 7 páginas en `pages/`)
- Agregar CDN de **Bootstrap 5.3.8** (CSS + JS Bundle)
- Mantener Font Awesome e Inter font
- Los modals, formularios, badges, botones, cards, tablas → clases Bootstrap
- Los HTML de las páginas internas tendrán **los modals y estructura directamente en el HTML** (no generados por JS)

#### [MODIFY] [main.css](file:///d:/descargas/universidad/Proy_SisERP/Proyect_CursoIntegrador/ERPPP/css/main.css)
- **Eliminar** ~80% del CSS (Bootstrap cubre: botones, cards, badges, tablas, modals, formularios, grids, tipografía)
- **Conservar**: 
  - Variables CSS de marca (`--brand`, `--brand-dark`, etc.)
  - Sidebar y status bar (Bootstrap no tiene sidebar built-in)
  - Animaciones (`fadeIn`, `slideIn`, `staggerIn`)
  - Estilos de POS específicos (product-grid, cart)
- El archivo pasa de ~960 líneas a ~200-250

#### [DELETE] [login.css](file:///d:/descargas/universidad/Proy_SisERP/Proyect_CursoIntegrador/ERPPP/css/login.css)
- Los estilos del login se integran en `main.css` (son solo ~50 líneas, mayormente reemplazables por Bootstrap)

#### [MODIFY] [pos.css](file:///d:/descargas/universidad/Proy_SisERP/Proyect_CursoIntegrador/ERPPP/css/pos.css)
- Simplificar usando clases Bootstrap para cards, botones, grids
- Conservar layout POS de 3 columnas y responsividad específica
- Reducir de ~360 líneas a ~120

#### [MODIFY] [receipt.css](file:///d:/descargas/universidad/Proy_SisERP/Proyect_CursoIntegrador/ERPPP/css/receipt.css)
- Se conserva casi igual (muy específico del recibo, Bootstrap no aporta aquí)

#### [MODIFY] [cocina.css](file:///d:/descargas/universidad/Proy_SisERP/Proyect_CursoIntegrador/ERPPP/css/cocina.css)
- Simplificar usando Bootstrap cards
- Conservar el borde izquierdo de color por estado

---

### Fase 2 — Separación JS (Lógica pura, sin HTML)

#### [MODIFY] [templates.js](file:///d:/descargas/universidad/Proy_SisERP/Proyect_CursoIntegrador/ERPPP/js/templates.js)
- `tplLayout()` → el layout (sidebar, topbar, footer) se moverá parcialmente al HTML de cada página, templates.js solo generará las partes dinámicas (nav items, contenido del sidebar según rol)
- `tplModal()` → **eliminar**, los modals estarán en el HTML con markup Bootstrap
- `tplPOSModals()` → **eliminar**, mover al HTML de `pos.html`
- Conservar: `tplStatCard()`, `tplProductCard()`, `tplCartItem()`, `tplReceipt()` (necesitan generación dinámica)
- Actualizar clases a Bootstrap (`badge`, `btn`, `table`, etc.)

#### [MODIFY] [validation.js](file:///d:/descargas/universidad/Proy_SisERP/Proyect_CursoIntegrador/ERPPP/js/validation.js)
- Migrar a validación Bootstrap (clases `is-invalid`, `invalid-feedback`, `was-validated`)
- Mantener las reglas `V.*` pero integrarlas con el sistema de Bootstrap
- La función `validateForm()` usará `form.classList.add('was-validated')` de Bootstrap

#### [MODIFY] [app.js](file:///d:/descargas/universidad/Proy_SisERP/Proyect_CursoIntegrador/ERPPP/js/app.js)
- `buildLayout()` → simplificado, solo inyecta nav items dinámicos y vincula eventos
- `requireAuth()` → **agregar verificación de rol** (Fix Bug #3)
- Mantener: `handleLogout()`, `toggleSidebar()`, `statusColor()`, `capitalize()`

#### [MODIFY] [dashboard.js](file:///d:/descargas/universidad/Proy_SisERP/Proyect_CursoIntegrador/ERPPP/js/dashboard.js)
- Fix Bug #4 (filtro fecha) → usar ISO date strings para comparación
- Usar clases Bootstrap para tablas y badges

#### [MODIFY] [pos.js](file:///d:/descargas/universidad/Proy_SisERP/Proyect_CursoIntegrador/ERPPP/js/pos.js)
- Modals con API Bootstrap (`new bootstrap.Modal()`)
- Fix Bug #7 → Preguntar antes de sobrescribir carrito + persistir en sessionStorage
- Fix Bug #10 → Toast de Bootstrap al guardar pedido

#### [MODIFY] [pedidos.js](file:///d:/descargas/universidad/Proy_SisERP/Proyect_CursoIntegrador/ERPPP/js/pedidos.js)
- Fix Bug #5 (filtro fecha)
- Fix Bug #8 (null check en `cambiarEstadoCocina`)
- Modals con Bootstrap

#### [MODIFY] [empleados.js](file:///d:/descargas/universidad/Proy_SisERP/Proyect_CursoIntegrador/ERPPP/js/empleados.js)
- Fix Bug #2 → Edición con `dbPut()` en vez de delete+add. Usar un campo oculto `editingId`

#### [MODIFY] [inventario.js](file:///d:/descargas/universidad/Proy_SisERP/Proyect_CursoIntegrador/ERPPP/js/inventario.js)
- Fix Bug #6 → Al registrar movimiento, actualizar `stock` en la tabla inventario

---

### Fase 3 — Bug Fixes

| # | Bug | Solución |
|---|-----|----------|
| 1 | Contraseñas en texto plano | Agregar comentario + estructura para hash futuro. No cambiar ahora (IndexedDB) |
| 2 | Edición destructiva empleados/usuarios | Usar `dbPut()` con ID existente en vez de delete+add |
| 3 | Sin control de rol en páginas | `requireAuth(allowedRoles)` verifica el rol contra la página |
| 4 | Filtro ventas del día roto | Guardar fechas en ISO (`new Date().toISOString()`) y comparar con `startsWith(today)` |
| 5 | Filtro pedidos por fecha roto | Mismo fix que #4 |
| 6 | Movimientos no actualizan stock | Parsear cantidad y sumar/restar del inventario correspondiente |
| 7 | `recuperarPedido()` pierde carrito | Confirmar si hay items, guardar cart en `sessionStorage` para persistir entre recargas |
| 8 | `cambiarEstadoCocina` sin null check | Agregar `if (!p) return` |
| 9 | Login no usa validation.js | Integrar con el sistema unificado |
| 10 | Sin feedback al guardar pedido | Toast de Bootstrap |
| 11 | Sin CRUD de productos | Queda como nota para futuro (no incluido en esta iteración) |

> [!IMPORTANT]
> **Bug #4 y #5 (fechas)**: Al cambiar el formato de fecha a ISO, los **pedidos seed existentes** en `db.js` dejarán de coincidir con el filtro si un usuario ya tiene datos en IndexedDB. Esto solo afecta a datos de desarrollo, no producción. ¿Está bien?

---

## Open Questions

> [!IMPORTANT]
> **¿Quieres que el login también use Bootstrap?** El login actual tiene un card centrado con gradient. Puedo replicarlo con Bootstrap + CSS mínimo. Confirmo que sí.

> [!IMPORTANT]
> **¿Conservo el status bar inferior** (barra oscura con "Cajero: X | Sistema en línea")? Es un componente custom que no tiene equivalente en Bootstrap, pero ocupa ~40 líneas de CSS.

> [!IMPORTANT]
> **Bootstrap Icons vs Font Awesome**: ¿Quieres seguir con Font Awesome o migrar a Bootstrap Icons? Recomiendo mantener Font Awesome ya que están bien integrados y Bootstrap Icons tendría un look diferente.

---

## Estructura Final Estimada

```
ERPPP/
├── index.html              ← Login con Bootstrap
├── assets/logo.png
├── css/
│   ├── main.css            ← ~200 líneas (brand, sidebar, animaciones, POS)
│   ├── pos.css             ← ~120 líneas (layout POS específico)
│   ├── receipt.css          ← ~100 líneas (recibo, se mantiene)
│   └── cocina.css          ← ~30 líneas (solo ticket border)
├── js/
│   ├── db.js               ← Capa datos (fechas ISO, preparado para fetch)
│   ├── app.js              ← Shell, auth con roles, sidebar
│   ├── templates.js        ← Solo HTML dinámico (stat cards, product cards, cart items, recibo)
│   ├── validation.js       ← Reglas V.* + integración Bootstrap validation
│   ├── dashboard.js        ← Lógica dashboard
│   ├── pos.js              ← Lógica POS (modals Bootstrap)
│   ├── pedidos.js          ← Lógica pedidos + cocina
│   ├── inventario.js       ← Lógica inventario (actualiza stock)
│   └── empleados.js        ← Lógica empleados (edición segura)
└── pages/
    ├── dashboard.html       ← Layout + contenedores Bootstrap
    ├── pos.html             ← Layout + modals Bootstrap en HTML
    ├── pedidos.html
    ├── inventario.html
    ├── empleados.html
    ├── cocina.html
    └── guardados.html
```

---

## Verification Plan

### Manual Verification
1. **Login**: Probar con las 3 credenciales (admin, cajero, cocina)
2. **Control de roles**: Verificar que un cajero NO puede acceder a dashboard.html
3. **POS**: Agregar productos, personalizar, completar orden, verificar recibo
4. **Edición empleados**: Editar un empleado y verificar que NO se borra al abrir el form
5. **Inventario**: Registrar movimiento y verificar que el stock se actualiza
6. **Dashboard**: Verificar que las ventas del día se calculan correctamente
7. **Responsividad**: Probar en mobile que el sidebar y modals funcionen bien
