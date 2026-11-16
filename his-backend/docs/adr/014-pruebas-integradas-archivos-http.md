# ADR 014: Pruebas de Integración con Archivos `.http` (REST Client)

## Contexto
Para poder armar los componentes en Vue, necesitábamos saber exactamente qué datos pedían y qué JSON devolvían los endpoints del backend. Usar programas como Postman era un problema porque nos costaba pasarnos las colecciones actualizadas entre los miembros del grupo.

## Decisión
Usamos la extensión *REST Client* del Visual Studio Code. Creamos archivos de texto con extensión `.http` (como `iam-billing.http` o `nursing-ehr.http`) directamente adentro de la carpeta del proyecto. Ahí dejamos guardadas las peticiones `GET` y `POST` con datos de prueba (DNI, tokens).

## Consecuencias
* **Positivas:** Las pruebas del backend viajan por Git junto con el código. Cualquiera del grupo se baja la rama, abre el archivo, aprieta "Send Request" y ve al instante cómo funciona el endpoint sin salir del editor de código.
* **Negativas:** No tenemos una interfaz gráfica para armar las peticiones, hay que escribir los *headers* y el cuerpo del JSON a mano.