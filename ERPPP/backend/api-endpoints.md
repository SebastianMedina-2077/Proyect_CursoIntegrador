# API REST Endpoints — Mamma Tomato ERP

Base URL: `http://localhost:8080/api`

## Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Login con username/password → JWT |
| POST | `/auth/logout` | Invalidar sesión |

## Productos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/productos` | Listar todos |
| GET | `/productos/{id}` | Obtener por ID |
| POST | `/productos` | Crear producto |
| PUT | `/productos/{id}` | Actualizar producto |
| DELETE | `/productos/{id}` | Eliminar producto |

## Categorías
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/categorias` | Listar todas |
| POST | `/categorias` | Crear categoría |

## Pedidos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/pedidos` | Listar todos |
| GET | `/pedidos/{id}` | Obtener por ID |
| GET | `/pedidos?estado={estado}` | Filtrar por estado |
| GET | `/pedidos?fecha={fecha}` | Filtrar por fecha |
| POST | `/pedidos` | Crear pedido |
| PUT | `/pedidos/{id}/estado` | Cambiar estado |

## Inventario
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/inventario` | Listar stock |
| PUT | `/inventario/{id}` | Actualizar stock |

## Movimientos
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/movimientos` | Historial |
| POST | `/movimientos` | Registrar entrada/salida |

## Empleados
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/empleados` | Listar todos |
| POST | `/empleados` | Crear empleado |
| PUT | `/empleados/{id}` | Actualizar |
| DELETE | `/empleados/{id}` | Eliminar |

## Usuarios
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/usuarios` | Listar todos |
| POST | `/usuarios` | Crear usuario |
| PUT | `/usuarios/{id}` | Actualizar |
| DELETE | `/usuarios/{id}` | Eliminar |

## Adicionales (Upsell)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/adicionales` | Listar disponibles |

## Proveedores (Pendiente)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/proveedores` | Listar proveedores |
| POST | `/proveedores` | Registrar proveedor |
| PUT | `/proveedores/{id}` | Actualizar |
| DELETE | `/proveedores/{id}` | Eliminar |

## Turnos (Pendiente)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/turnos` | Listar turnos |
| POST | `/turnos/abrir` | Abrir turno |
| PUT | `/turnos/{id}/cerrar` | Cerrar turno |

## Control de Caja (Pendiente)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/caja/apertura` | Apertura de caja |
| POST | `/caja/cierre` | Cierre de caja |
| GET | `/caja/actual` | Estado actual |

## Delivery (Pendiente)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/delivery` | Pedidos delivery activos |
| POST | `/delivery` | Crear delivery |
| PUT | `/delivery/{id}/estado` | Actualizar estado |

## Reportes (Pendiente)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/reportes/ventas?periodo={diario/semanal/mensual}` | Reporte de ventas |
| GET | `/reportes/productos-top` | Productos más vendidos |
| GET | `/reportes/inventario` | Reporte de inventario |
