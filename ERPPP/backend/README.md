# Backend — Spring Boot Architecture

## Tecnologías
- **Java 17+** con Spring Boot 3.x
- **Spring Data JPA** + Hibernate
- **MySQL / PostgreSQL** como base de datos
- **Spring Security** para autenticación JWT
- **Maven** como gestor de dependencias

## Estructura de Paquetes
```
com.mammatomato.erp/
├── config/              # Configuración Spring Security, CORS, etc.
├── controller/          # REST Controllers
│   ├── AuthController
│   ├── ProductoController
│   ├── PedidoController
│   ├── InventarioController
│   ├── EmpleadoController
│   ├── UsuarioController
│   ├── CategoriaController
│   ├── ProveedorController
│   ├── TurnoController
│   ├── CajaController
│   ├── DeliveryController
│   └── ReporteController
├── model/               # Entidades JPA
│   ├── Usuario
│   ├── Producto
│   ├── Categoria
│   ├── Pedido
│   ├── PedidoItem
│   ├── Inventario
│   ├── Movimiento
│   ├── Empleado
│   ├── Proveedor
│   ├── Turno
│   ├── Caja
│   └── Delivery
├── repository/          # JPA Repositories
├── service/             # Lógica de negocio
├── dto/                 # Data Transfer Objects
├── exception/           # Excepciones personalizadas
└── util/                # Utilidades
```

## Base de Datos (MySQL)
```sql
-- Esquema principal
CREATE DATABASE mamma_tomato_db;

-- Tablas principales (generadas por JPA/Hibernate)
-- usuarios, productos, categorias, pedidos, pedido_items,
-- inventario, movimientos, empleados, proveedores,
-- turnos, caja, delivery, reportes
```

## application.properties
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/mamma_tomato_db
spring.datasource.username=root
spring.datasource.password=
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
server.port=8080
```

## Frontend Integration
- Las páginas HTML actuales se mueven a `src/main/resources/static/`
- Los archivos JS hacen fetch() a `/api/*` en vez de IndexedDB
- Spring Boot sirve los archivos estáticos automáticamente

## Angular (Opcional)
Si se decide migrar el frontend a Angular:
```
frontend/
├── src/app/
│   ├── services/       # HttpClient services para cada API
│   ├── models/         # Interfaces TypeScript
│   ├── components/     # Componentes por módulo
│   ├── guards/         # Auth guards
│   └── interceptors/   # JWT interceptor
```
