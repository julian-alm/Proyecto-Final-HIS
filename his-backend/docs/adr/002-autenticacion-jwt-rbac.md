# ADR-002: Autenticación Stateless con JWT y Control de Acceso Basado en Roles (RBAC)

* **Estado:** Aceptado
* **Fecha:** 10-10-2026

## Contexto y Problema
El sistema HIS requiere un manejo estricto de roles (Administrador, Médico, Enfermero, Recepcionista, Paciente) para proteger el acceso a historias clínicas y operaciones sensibles. Necesitamos un mecanismo de autenticación que sea seguro, rápido y que no acople nuestra lógica de dominio a frameworks pesados de seguridad.

## Decisión
1. **Autenticación Stateless (JWT):** Implementar tokens JWT (`@nestjs/jwt`) firmados criptográficamente. Al no guardar sesiones en base de datos, el servidor no necesita hacer consultas de lectura por cada petición HTTP, reduciendo la latencia a cero.
2. **RBAC Nativo (Guards):** En lugar de frameworks externos como Passport.js (aplicando el principio KISS), creamos un `RolesGuard` nativo de NestJS. Este guard intercepta las peticiones, valida la firma del token y comprueba si el rol del usuario coincide con los decoradores `@Roles()` definidos en los controladores.

## Trade-offs (Compromisos Asumidos)
* **Ganancia:** Rendimiento extremo (cero consultas a BD para validar sesión) y código muy limpio, focalizado exclusivamente en la infraestructura web sin tocar el dominio.
* **Costo asumido:** Al ser stateless, la invalidación inmediata de un token (por ejemplo, si un médico es despedido) requiere estrategias adicionales (como tiempos de expiración cortos de 8hs) ya que el token vive en el cliente.