const socket = io(); 

// --- ELEMENTOS DOM ---
const num1El = document.getElementById('num1');
const num2El = document.getElementById('num2');
const operatorEl = document.getElementById('operator');
const answerInput = document.getElementById('answer-input');
const verifyBtn = document.getElementById('verify-btn');
const feedbackMessage = document.getElementById('feedback-message');
const imgNum1 = document.getElementById('img-num1');
const imgNum2 = document.getElementById('img-num2');
const appWrapper = document.getElementById('app-wrapper');
const currentPlayerDisplay = document.getElementById('current-player');
const equalsBlock = document.getElementById('equals-block');
const resultBlock = document.getElementById('result-block');
const resultNumEl = document.getElementById('result-num');
const imgResult = document.getElementById('img-result');
const operationButtons = document.querySelectorAll('.op-btn');

// Modales y Controles
const welcomeModal = document.getElementById('welcome-modal');
const joinModal = document.getElementById('join-modal');
const setupModal = document.getElementById('setup-modal');
const statsModal = document.getElementById('stats-modal');

const joinCodeInput = document.getElementById('join-code-input');
const numPlayersInput = document.getElementById('num-players-input');
const namesContainer = document.getElementById('names-container');
const limitSumaInput = document.getElementById('limit-suma-input');
const limitRestaInput = document.getElementById('limit-resta-input');

const roomInfo = document.getElementById('room-info');
const displayRoomCode = document.getElementById('display-room-code');
const myNameSelect = document.getElementById('my-name-select');
const identityContainer = document.getElementById('identity-container');

let localPlayers = [];
let myIdentity = ""; 
let currentRoomCode = "";

// --- NAVEGACIÓN DE MENÚS INICIALES ---
document.getElementById('btn-show-create').addEventListener('click', () => {
    welcomeModal.classList.remove('active');
    setupModal.classList.add('active');
    generateNameInputs();
});

document.getElementById('btn-show-join').addEventListener('click', () => {
    welcomeModal.classList.remove('active');
    joinModal.classList.add('active');
});

document.getElementById('btn-back-from-setup').addEventListener('click', () => {
    setupModal.classList.remove('active'); welcomeModal.classList.add('active');
});
document.getElementById('btn-back-from-join').addEventListener('click', () => {
    joinModal.classList.remove('active'); welcomeModal.classList.add('active');
});

// --- LÓGICA DE UNIRSE Y CREAR ---
document.getElementById('btn-join-game').addEventListener('click', () => {
    const code = joinCodeInput.value.trim();
    if(code.length > 0) socket.emit('joinGame', code);
});

socket.on('errorMsg', (msg) => {
    alert(msg); // Si pone mal el código
});

function generateNameInputs() {
    namesContainer.innerHTML = '';
    const count = parseInt(numPlayersInput.value) || 1;
    for (let i = 0; i < count; i++) {
        namesContainer.innerHTML += `<input type="text" class="player-name-input" placeholder="Nombre Jugador ${i+1}" required style="width: 100%; padding: 8px; margin-bottom: 5px; border-radius: 5px; border: 1px solid #ccc;">`;
    }
}
numPlayersInput.addEventListener('change', generateNameInputs);

document.getElementById('btn-start-game').addEventListener('click', () => {
    const nameInputs = document.querySelectorAll('.player-name-input');
    const newPlayers = [];
    nameInputs.forEach(input => {
        const name = input.value.trim() || 'Jugador';
        newPlayers.push({ name: name, stats: { suma: {bien:0, mal:0}, resta: {bien:0, mal:0}, multiplicacion: {bien:0, mal:0}, division: {bien:0, mal:0} } });
    });
    
    socket.emit('createGame', { 
        players: newPlayers, 
        maxSuma: parseInt(limitSumaInput.value) || 10, 
        maxResta: parseInt(limitRestaInput.value) || 10 
    });
});

// --- ACTUALIZACIÓN VISUAL (JUEGO) ---
function updateUI(gameData) {
    localPlayers = gameData.players;
    
    num1El.textContent = gameData.currentProblem.num1;
    num2El.textContent = gameData.currentProblem.num2;
    imgNum1.src = `assets/numberblock_${gameData.currentProblem.num1}.png`;
    imgNum1.style.display = 'block'; imgNum1.onerror = () => imgNum1.style.display = 'none';
    imgNum2.src = `assets/numberblock_${gameData.currentProblem.num2}.png`;
    imgNum2.style.display = 'block'; imgNum2.onerror = () => imgNum2.style.display = 'none';

    const opSigns = { 'suma': '+', 'resta': '-', 'multiplicacion': 'x', 'division': '÷' };
    operatorEl.textContent = opSigns[gameData.currentOperation];
    operationButtons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-op') === gameData.currentOperation);
    });

    if (equalsBlock) equalsBlock.style.display = 'none';
    if (resultBlock) { resultBlock.style.display = 'none'; resultBlock.classList.remove('pop-in-animation'); }

    if (gameData.players.length > 0) {
        const playerInTurn = gameData.players[gameData.currentPlayerIndex].name;
        currentPlayerDisplay.textContent = `Turno de: ${playerInTurn}`;
        
        if (myIdentity === playerInTurn) {
            answerInput.disabled = false; verifyBtn.disabled = false;
            answerInput.placeholder = "¡Escribe tu respuesta!"; answerInput.focus();
        } else {
            answerInput.disabled = true; verifyBtn.disabled = true;
            answerInput.placeholder = `Esperando a ${playerInTurn}...`; answerInput.value = "";
        }
    }
}

// --- ESCUCHANDO AL SERVIDOR ---
socket.on('syncState', (data) => {
    // Escondemos todos los modales iniciales
    welcomeModal.classList.remove('active');
    setupModal.classList.remove('active');
    joinModal.classList.remove('active');
    
    // Mostramos el código de la sala
    currentRoomCode = data.roomCode;
    displayRoomCode.textContent = currentRoomCode;
    roomInfo.style.display = 'block';
    
    // Mostramos selector de identidad
    identityContainer.style.display = 'flex'; 
    
    // Llenar la lista desplegable con los nombres si está vacía
    if (myNameSelect.options.length <= 1) {
        data.gameData.players.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name; opt.textContent = p.name;
            myNameSelect.appendChild(opt);
        });
    }
    updateUI(data.gameData);
});

socket.on('newProblem', (gameData) => {
    answerInput.value = ''; feedbackMessage.textContent = "";
    updateUI(gameData);
});

socket.on('answerResult', (data) => {
    appWrapper.classList.remove('party-animation', 'shake-animation');
    void appWrapper.offsetWidth; 
    localPlayers = data.players; 

    if (data.isCorrect) {
        feedbackMessage.textContent = "¡Excelente! Respuesta correcta 🎉";
        feedbackMessage.className = "feedback success";
        appWrapper.classList.add('party-animation');
        
        resultNumEl.textContent = data.correctAnswer;
        imgResult.src = `assets/numberblock_${data.correctAnswer}.png`;
        imgResult.style.display = 'block'; imgResult.onerror = () => imgResult.style.display = 'none'; 
        equalsBlock.style.display = 'block'; resultBlock.style.display = 'block';
        resultBlock.classList.add('pop-in-animation');
        
        if (typeof confetti !== 'undefined') {
            confetti({ particleCount: 150, spread: 160, startVelocity: 30, gravity: 0.6, origin: { y: 0.5 }, colors: ['#3498DB', '#E74C3C', '#F1C40F', '#2ECC71', '#9B59B6'], ticks: 300, zIndex: 1000 });
        }
    } else {
        feedbackMessage.textContent = "¡Ups! Inténtalo de nuevo. 🤔";
        feedbackMessage.className = "feedback error";
        appWrapper.classList.add('shake-animation');
        if (!answerInput.disabled) { answerInput.value = ""; answerInput.focus(); }
    }
});

// --- INTERACCIÓN EN EL JUEGO ---
myNameSelect.addEventListener('change', (e) => {
    myIdentity = e.target.value;
    // Pedimos al servidor forzar una actualización para bloquear/desbloquear
    socket.emit('joinGame', currentRoomCode); 
});

operationButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        if (!answerInput.disabled) { socket.emit('changeOperation', btn.getAttribute('data-op')); } 
        else { alert("¡Solo el jugador de turno puede cambiar la operación!"); }
    });
});

function sendAnswer() {
    if (answerInput.disabled) return;
    const userAnswer = parseInt(answerInput.value);
    if (!isNaN(userAnswer)) socket.emit('checkAnswer', userAnswer);
}

verifyBtn.addEventListener('click', sendAnswer);
answerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendAnswer(); });

// Estadísticas
document.getElementById('btn-open-stats').addEventListener('click', () => {
    const container = document.getElementById('stats-container');
    container.innerHTML = '';
    localPlayers.forEach(p => {
        container.innerHTML += `
            <div class="player-stat-card">
                <h3>🧑‍🚀 ${p.name}</h3>
                <div class="stat-row">Sumas: <span class="bien">✔ ${p.stats.suma.bien}</span> | <span class="mal">✖ ${p.stats.suma.mal}</span></div>
                <div class="stat-row">Restas: <span class="bien">✔ ${p.stats.resta.bien}</span> | <span class="mal">✖ ${p.stats.resta.mal}</span></div>
            </div>`;
    });
    statsModal.classList.add('active');
});
document.getElementById('btn-close-stats').addEventListener('click', () => statsModal.classList.remove('active'));