# 🚀 Guía de Instalación y Ejecución (MathBlocks)

Esta guía te ayudará a configurar el entorno necesario para ejecutar **MathBlocks** en tu propia computadora y permitir que otros dispositivos en tu red local (celulares, tablets) se conecten a tus partidas.

## 📦 1. Programas Necesarios (Prerrequisitos)
Antes de empezar, necesitas tener instalados los siguientes programas en tu computadora:

1. **Node.js (LTS):** Es el motor que hace funcionar nuestro servidor.
   * Descárgalo gratis desde: [nodejs.org](https://nodejs.org/)
   * Instálalo dejando todas las opciones por defecto (siguiente, siguiente...).
2. **Editor de Código:** Recomendamos encarecidamente [Visual Studio Code](https://code.visualstudio.com/).
3. **Git (Opcional pero recomendado):** Para clonar el repositorio fácilmente.

## 🛠️ 2. Preparar el Proyecto
1. Descarga los archivos del proyecto o clona el repositorio usando Git:
   ```bash
   git clone https://github.com/jusalazar2/MathBlocks.git
   ```
2. Abre la carpeta del proyecto (`MathBlocks`) en Visual Studio Code.
3. **Importante:** Asegúrate de tener las imágenes de los personajes en la ruta correcta. Debes tener una carpeta llamada `public/assets/` y dentro imágenes nombradas como `numberblock_0.png`, `numberblock_1.png`, etc.

## 📚 3. Instalar las Librerías
El proyecto utiliza librerías externas (dependencias) para manejar el servidor y la comunicación en tiempo real.

1. En Visual Studio Code, abre la terminal integrada (Menú superior: `Terminal` > `Nuevo terminal`).
2. Ejecuta el siguiente comando para instalar automáticamente todo lo necesario (Express y Socket.io):
   ```bash
   npm install
   ```
   *(Esto leerá el archivo `package.json` y creará la carpeta `node_modules` con todas las librerías).*

## ▶️ 4. Ejecutar el Servidor
Una vez instaladas las dependencias, es hora de encender el "árbitro central".

1. En la misma terminal, ejecuta este comando:
   ```bash
   npm run dev
   ```
   *(Nota: Utilizamos `nodemon` para que el servidor se mantenga activo y se reinicie solo si hacemos cambios en el código).*
2. Si todo sale bien, verás un mensaje en la consola que dice: 
   `🚀 Servidor central corriendo en http://localhost:3000`

## 📱 5. ¿Cómo conectarse a jugar?

**Para el creador de la sala (Computadora Principal):**
* Abre tu navegador web y ve a la dirección: `http://localhost:3000`
* Selecciona "Crear Nuevo Juego", configura los jugadores y comparte el **PIN de 8 dígitos**.

**Para los jugadores invitados (Celulares o Tablets):**
* Asegúrate de que el celular esté conectado a la **misma red Wi-Fi** que la computadora principal.
* En la computadora principal, abre la consola del sistema (cmd en Windows) y escribe `ipconfig` para averiguar tu **Dirección IPv4** (ejemplo: `192.168.1.15`).
* En el celular, abre el navegador (Chrome/Safari) y escribe esa IP seguida del puerto 3000:
  `http://192.168.1.15:3000`
* Selecciona "Unirse a un Juego" e ingresa el PIN proporcionado por el creador.

---
### 🛑 Solución de problemas comunes
* **Error de puerto en uso:** Si al correr `npm run dev` te dice que el puerto 3000 ya está en uso, asegúrate de no tener otro servidor corriendo o cambia el número del puerto al final del archivo `server.js`.
* **Los celulares no cargan la página:** Es posible que el Firewall de Windows esté bloqueando la conexión de Node.js. Ve a "Firewall y protección de red" > "Permitir a una aplicación a través del firewall" y asegúrate de que Node.js tenga permisos en redes Privadas.