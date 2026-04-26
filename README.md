# MathBlocks
🔢 MathBlocks - Interactive Math Learning Tool
(Nota: Reemplaza este enlace con una captura de pantalla real de tu juego)

📖 Descripción del Proyecto
MathBlocks es una aplicación web interactiva y gamificada diseñada para enseñar operaciones matemáticas básicas (suma, resta, multiplicación y división) a niños. Inspirada en la estética visual de "Numberblocks", la herramienta transforma la práctica matemática en una experiencia atractiva mediante retroalimentación visual inmediata, animaciones fluidas y un sistema de físicas de celebración.

Este proyecto nace de la iniciativa de crear herramientas educativas a la medida (diseñado originalmente con mucho cariño para potenciar el aprendizaje de Juan Daniel), fusionando la lógica de programación con interfaces de usuario altamente didácticas.

✨ Características Principales
Motor Matemático Dinámico: Generación procedimental de problemas matemáticos basada en parámetros configurables.

Sumas: Limitadas a un valor máximo personalizable.

Restas: Garantiza resultados no negativos, con un número inicial máximo configurable.

Multiplicación y División: Enfocadas en las tablas del 1 al 10, garantizando divisiones exactas.

Sistema Multijugador Local: Permite configurar hasta 5 jugadores, gestionando una rotación de turnos automática.

Persistencia de Datos: Utiliza LocalStorage para guardar el perfil de cada jugador y un historial detallado de aciertos y errores por operación.

Feedback Visual y Físicas:

Renderizado dinámico de imágenes (assets) que corresponden al número exacto en pantalla.

Animación de Shake (temblor) para respuestas incorrectas.

Animación Pop-in con revelación del signo igual (=) y el resultado al acertar.

Simulación de físicas de explosión de confeti en pantalla completa usando la librería canvas-confetti.

UI/UX Moderna: Diseño sin bordes tipo neón, tarjetas interactivas, ventanas modales de configuración y un diseño responsivo que evita distracciones.

🛠️ Tecnologías Utilizadas
HTML5: Estructura semántica y contenedores modales.

CSS3: Flexbox, transiciones suaves, animaciones @keyframes, y efectos avanzados de text-shadow para estilo neón/Glow.

Vanilla JavaScript (ES6+): Manipulación del DOM, manejo de eventos, estado de la aplicación y lógica matemática condicional.

Canvas Confetti (canvas-confetti): Librería de terceros implementada vía CDN para la simulación de físicas y partículas.

🚀 Instalación y Uso Local
Para correr este proyecto en tu entorno local:

Clona este repositorio:

Bash
git clone https://github.com/tu-usuario/mathblocks.git
Abre la carpeta del proyecto en tu editor de código (ej. Visual Studio Code).

Imágenes de Personajes: Asegúrate de crear una carpeta llamada assets/ en la raíz del proyecto. Dentro, coloca las imágenes de los personajes nombradas estrictamente como numberblock_0.png, numberblock_1.png, etc.

Utiliza la extensión Live Server en VS Code para lanzar el archivo index.html en tu navegador local (usualmente en el puerto 5500).

📁 Estructura del Proyecto
Plaintext
/mathblocks
├── index.html        # Estructura principal y modales
├── style.css         # Estilos UI, animaciones y efectos visuales
├── app.js            # Motor matemático, gestión de estado y DOM
└── /assets           # Directorio para las imágenes generadas de los Numberblocks
🗺️ Roadmap (Próximos Pasos)
[ ] Multijugador Remoto: Integración con Firebase (Realtime Database) y WebSockets para permitir que varios dispositivos se conecten a la misma sala y los jugadores respondan desde sus propias pantallas (Estilo Kahoot).

[ ] Niveles de Dificultad: Implementación automática de niveles que aumenten los límites matemáticos según la racha de aciertos del jugador.