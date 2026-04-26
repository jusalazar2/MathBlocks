// --- ELEMENTOS DEL DOM ---
const num1El = document.getElementById('num1');
const num2El = document.getElementById('num2');
const operatorEl = document.getElementById('operator');
const operationButtons = document.querySelectorAll('.op-btn');
const answerInput = document.getElementById('answer-input');
const verifyBtn = document.getElementById('verify-btn');
const feedbackMessage = document.getElementById('feedback-message');
const imgNum1 = document.getElementById('img-num1');
const imgNum2 = document.getElementById('img-num2');
const appWrapper = document.getElementById('app-wrapper');
const currentPlayerDisplay = document.getElementById('current-player');

// Elementos de Modales
const setupModal = document.getElementById('setup-modal');
const statsModal = document.getElementById('stats-modal');
const numPlayersInput = document.getElementById('num-players-input');
const namesContainer = document.getElementById('names-container');
const btnStartGame = document.getElementById('btn-start-game');
const limitSumaInput = document.getElementById('limit-suma-input');
const limitRestaInput = document.getElementById('limit-resta-input');

const equalsBlock = document.getElementById('equals-block');
const resultBlock = document.getElementById('result-block');
const resultNumEl = document.getElementById('result-num');
const imgResult = document.getElementById('img-result');

// --- ESTADO DEL JUEGO ---
let currentOperation = 'suma';
let currentNum1 = 0; let currentNum2 = 0; let correctAnswer = 0;
let maxSuma = 10; let maxResta = 10;

// Variables de Jugadores
let players = []; 
let currentPlayerIndex = 0;

// --- MULTIJUGADOR Y PERSISTENCIA (JSON) ---
function loadData() {
    const savedData = localStorage.getItem('mathblocks_data');
    if (savedData) {
        players = JSON.parse(savedData);
        setupModal.classList.remove('active'); // Si ya hay datos, saltamos el setup
        updatePlayerDisplay();
        generateProblem();
    } else {
        generateNameInputs(); // Mostrar campos para nombres
    }
}

function saveData() {
    localStorage.setItem('mathblocks_data', JSON.stringify(players));
}

// Generar cajitas para los nombres según la cantidad de jugadores
function generateNameInputs() {
    namesContainer.innerHTML = '';
    const count = parseInt(numPlayersInput.value) || 1;
    for (let i = 0; i < count; i++) {
        namesContainer.innerHTML += `
            <input type="text" class="player-name-input" placeholder="Nombre Jugador ${i+1}" required>
        `;
    }
}
numPlayersInput.addEventListener('change', generateNameInputs);

// Iniciar el juego desde el Setup
btnStartGame.addEventListener('click', () => {
    const nameInputs = document.querySelectorAll('.player-name-input');
    players = [];
    nameInputs.forEach(input => {
        const name = input.value.trim() || 'Jugador';
        // Estructura JSON para cada jugador
        players.push({
            name: name,
            stats: {
                suma: { bien: 0, mal: 0 },
                resta: { bien: 0, mal: 0 },
                multiplicacion: { bien: 0, mal: 0 },
                division: { bien: 0, mal: 0 }
            }
        });
    });
    
    maxSuma = parseInt(limitSumaInput.value) || 10;
    maxResta = parseInt(limitRestaInput.value) || 10;
    currentPlayerIndex = 0;
    
    saveData();
    setupModal.classList.remove('active');
    updatePlayerDisplay();
    generateProblem();
});

function updatePlayerDisplay() {
    if (players.length > 0) {
        currentPlayerDisplay.textContent = `Turno de: ${players[currentPlayerIndex].name}`;
    }
}

function nextTurn() {
    if (players.length > 1) {
        currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
        updatePlayerDisplay();
    }
}

// --- LÓGICA MATEMÁTICA ---
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateProblem() {

      // Ocultar el resultado y el signo igual del problema anterior
    if (equalsBlock && resultBlock) {
        equalsBlock.style.display = 'none';
        resultBlock.style.display = 'none';
        resultBlock.classList.remove('pop-in-animation');
    }

    if (currentOperation === 'suma') {
        operatorEl.textContent = '+';
        correctAnswer = getRandomInt(0, maxSuma); 
        currentNum1 = getRandomInt(0, correctAnswer);
        currentNum2 = correctAnswer - currentNum1;
    } else if (currentOperation === 'resta') {
        operatorEl.textContent = '-';
        currentNum1 = getRandomInt(0, maxResta);
        currentNum2 = getRandomInt(0, currentNum1); 
        correctAnswer = currentNum1 - currentNum2;
    } else if (currentOperation === 'multiplicacion') {
        operatorEl.textContent = 'x';
        currentNum1 = getRandomInt(1, 10); currentNum2 = getRandomInt(1, 10);
        correctAnswer = currentNum1 * currentNum2;
    } else if (currentOperation === 'division') {
        operatorEl.textContent = '÷';
        currentNum2 = getRandomInt(1, 10); correctAnswer = getRandomInt(1, 10); 
        currentNum1 = currentNum2 * correctAnswer; 
    }

    num1El.textContent = currentNum1;
    num2El.textContent = currentNum2;
    
    imgNum1.src = `assets/numberblock_${currentNum1}.png`;
    imgNum1.style.display = 'block';
    imgNum1.onerror = () => imgNum1.style.display = 'none';

    imgNum2.src = `assets/numberblock_${currentNum2}.png`;
    imgNum2.style.display = 'block';
    imgNum2.onerror = () => imgNum2.style.display = 'none';
    
    answerInput.value = '';
    console.log(`Respuesta correcta: ${correctAnswer}`);
}

// --- VALIDACIÓN Y ANIMACIONES ---
function checkAnswer() {
    const userAnswer = parseInt(answerInput.value);
    if (isNaN(userAnswer)) return;

    appWrapper.classList.remove('party-animation', 'shake-animation');
    void appWrapper.offsetWidth; 

    // Referencia al jugador actual
    const currentPlayer = players[currentPlayerIndex];

    if (userAnswer === correctAnswer) {
        feedbackMessage.textContent = "¡Excelente! Respuesta correcta 🎉";
        feedbackMessage.className = "feedback success";
        appWrapper.classList.add('party-animation');
        
        // --- MOSTRAR EL RESULTADO GIGANTE (FASE 4) ---
        resultNumEl.textContent = correctAnswer;
        imgResult.src = `assets/numberblock_${correctAnswer}.png`;
        imgResult.style.display = 'block';
        imgResult.onerror = () => imgResult.style.display = 'none'; 
        equalsBlock.style.display = 'block';
        resultBlock.style.display = 'block';
        resultBlock.classList.add('pop-in-animation');
        // ---------------------------------------------

        // --- NUEVA EXPLOSIÓN DE CONFETI REAL ---
        // Usamos la librería externa que conectamos en el HTML
        confetti({
            particleCount: 150,     // Cantidad de papelitos
            spread: 160,            // Ángulo de la explosión (casi toda la pantalla)
            startVelocity: 30,      // Velocidad inicial suave para que no salgan tan disparados
            gravity: 0.6,           // Gravedad baja para que caigan flotando lentamente
            origin: { y: 0.5 },     // Origen: exactamente en el centro de la pantalla
            colors: ['#3498DB', '#E74C3C', '#F1C40F', '#2ECC71', '#9B59B6'], // Colores alegres estilo Numberblocks
            ticks: 300,             // Duran bastante tiempo en pantalla antes de desaparecer
            zIndex: 1000            // Para asegurarnos de que el confeti salga por encima de todo
        });
        // ---------------------------------------
        
        // Darle un pequeño retraso a cada emoji para un efecto de 'explosión' sutil
        const emojis = document.querySelectorAll('.celebration-emoji');
        emojis.forEach((e, index) => {
            setTimeout(() => {
                e.classList.add('run-pop-in');
            }, index * 20); // Retraso progresivo (20ms)
        });
        // -------------------------------------------------------

        // Sumar al historial (Bien)
        if (currentPlayer) currentPlayer.stats[currentOperation].bien++;
        saveData();

        // Tiempo de espera de 2.5 segundos (2500ms) para que disfruten la fiesta
        setTimeout(() => {
            nextTurn(); 
            generateProblem();
            feedbackMessage.textContent = ""; 
            answerInput.focus(); 
        }, 3500); 

    } else {
        feedbackMessage.textContent = "¡Ups! Inténtalo de nuevo. 🤔";
        feedbackMessage.className = "feedback error";
        appWrapper.classList.add('shake-animation');
        
        // Sumar al historial (Mal)
        currentPlayer.stats[currentOperation].mal++;
        saveData();

        answerInput.value = ""; 
        answerInput.focus();
    }
}

// --- EVENTOS Y ESTADÍSTICAS ---
// Lógica para que los botones de operación funcionen y "alumbren"
operationButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // 1. Le quitamos la clase 'active' a todos los botones
        operationButtons.forEach(b => b.classList.remove('active'));
        
        // 2. Se la ponemos solo al botón que el niño acaba de presionar
        btn.classList.add('active');
        
        // 3. Leemos qué operación es (suma, resta, etc.)
        currentOperation = btn.getAttribute('data-op');
        
        // 4. Generamos un nuevo problema inmediatamente
        generateProblem();
    });
});


verifyBtn.addEventListener('click', checkAnswer);
answerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkAnswer(); });

// Botón para ver estadísticas
document.getElementById('btn-open-stats').addEventListener('click', () => {
    const container = document.getElementById('stats-container');
    container.innerHTML = '';
    
    players.forEach(p => {
        container.innerHTML += `
            <div class="player-stat-card">
                <h3>🧑‍🚀 ${p.name}</h3>
                <div class="stat-row">Sumas: <span class="bien">✔ ${p.stats.suma.bien}</span> | <span class="mal">✖ ${p.stats.suma.mal}</span></div>
                <div class="stat-row">Restas: <span class="bien">✔ ${p.stats.resta.bien}</span> | <span class="mal">✖ ${p.stats.resta.mal}</span></div>
                <div class="stat-row">Multiplicación: <span class="bien">✔ ${p.stats.multiplicacion.bien}</span> | <span class="mal">✖ ${p.stats.multiplicacion.mal}</span></div>
                <div class="stat-row">División: <span class="bien">✔ ${p.stats.division.bien}</span> | <span class="mal">✖ ${p.stats.division.mal}</span></div>
            </div>
        `;
    });
    statsModal.classList.add('active');
});

document.getElementById('btn-close-stats').addEventListener('click', () => statsModal.classList.remove('active'));

// Botón para reiniciar todo (Borra el JSON del LocalStorage)
document.getElementById('btn-reset-data').addEventListener('click', () => {
    if(confirm('¿Estás seguro de que quieres borrar el historial de todos los jugadores?')) {
        localStorage.removeItem('mathblocks_data');
        statsModal.classList.remove('active');
        setupModal.classList.add('active'); // Volver a pedir nombres
        generateNameInputs();
    }
});

// Arrancar la app (Verificar si hay datos guardados)
window.onload = loadData;