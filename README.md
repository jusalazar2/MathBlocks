# 🔢 MathBlocks & Flags - Interactive Learning Platform

[MathBlocks Preview](public/preview.png)

## 📖 Descripción del Proyecto
**MathBlocks** ha evolucionado a una plataforma educativa multijugador en tiempo real. Diseñada originalmente para enseñar operaciones matemáticas básicas con la estética de "Numberblocks", ahora incluye soporte para geografía mundial (Banderas) y una arquitectura Cliente-Servidor completa.

Este proyecto gamifica el aprendizaje mediante retroalimentación visual, físicas de celebración y un entorno de juego sincronizado entre múltiples dispositivos en red local (estilo Kahoot!).

## ✨ Características Principales
* **🎮 Multijugador en Tiempo Real (Salas):** * Creación de salas privadas con código PIN de 8 dígitos.
  * Soporte para múltiples dispositivos sincronizados simultáneamente vía WebSockets.
  * Sistema inteligente de salto de turnos (ignora temporalmente a los jugadores desconectados).
  * Prevención de *Ghost Rooms* (cierre automático de la sala si el Host se desconecta).
* **🧮 Motor Matemático Procedimental:** * Generación de Sumas, Restas, Multiplicaciones y Divisiones con límites configurables.
* **🌍 Modo Geografía (Banderas):**
  * Más de 100 banderas del mundo extraídas dinámicamente utilizando la API de FlagCDN.
  * Validador de texto inteligente (normaliza entradas ignorando mayúsculas, minúsculas y tildes).
* **🧠 Diseño Pedagógico:**
  * Botón "No lo sé 🤔" que revela la respuesta amigablemente sin penalizar las estadísticas del jugador, fomentando la memorización sin frustración.
  * Panel lateral en vivo con el estado de conexión de cada jugador y su turno.
  * Estadísticas detalladas por categoría para cada jugador (Matemáticas y Geografía).
* **🎉 Feedback Visual y Físicas:**
  * Renderizado dinámico de personajes (Numberblocks).
  * Animaciones *Pop-in* y físicas de simulación de explosión de confeti en pantalla completa para celebrar aciertos.

## 🛠️ Tecnologías Utilizadas
* **Backend:** Node.js, Express.
* **Realtime Engine:** Socket.io (Manejo de Eventos y Rooms).
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+).
* **Librerías Externas:** `canvas-confetti` (Físicas), `FlagCDN` (CDN de imágenes de banderas).

## 🚀 Instalación y Uso Local

Para correr este proyecto en tu red local y jugar con otros dispositivos:

1. Clona este repositorio:
   ```bash
   git clone https://github.com/jusalazar2/MathBlocks.git
   ```
2. Instala las dependencias del servidor:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre `http://localhost:3000` en el equipo Host para crear la sala.
5. Los demás jugadores deben ingresar la IP del Host en su navegador (ej. `http://192.168.1.15:3000`) y usar el PIN de la sala para unirse.

## 📁 Estructura del Proyecto
```text
/MathBlocks
├── server.js              # Servidor Node.js y lógica central de WebSockets
├── package.json           # Dependencias y scripts
├── public/                # Archivos estáticos del Frontend
│   ├── index.html         # Interfaz de usuario, modales y layout
│   ├── style.css          # Estilos y animaciones
│   ├── app.js             # Lógica del cliente y conexión Socket.io
│   └── assets/            # Imágenes locales (Numberblocks)
```

---
*Desarrollado por [Juan Salazar](https://github.com/jusalazar2) - ¡Haciendo que el aprendizaje sea divertido!*