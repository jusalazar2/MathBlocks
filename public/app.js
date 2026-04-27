const socket = io(); 

// Elementos DOM Básicos
const appWrapper = document.getElementById('app-wrapper');
const sidebar = document.getElementById('sidebar');
const gameControlsArea = document.getElementById('game-controls-area');
const playerListEl = document.getElementById('player-list');
const hostControls = document.getElementById('host-controls');
const identityDisplay = document.getElementById('identity-display');
const myNameText = document.getElementById('my-name-text');

// Modales
const welcomeModal = document.getElementById('welcome-modal');
const joinModal = document.getElementById('join-modal');
const setupModal = document.getElementById('setup-modal');
const identityModal = document.getElementById('identity-modal');
const statsModal = document.getElementById('stats-modal');

// Elementos de Juego
const answerInput = document.getElementById('answer-input');
const verifyBtn = document.getElementById('verify-btn');
const feedbackMessage = document.getElementById('feedback-message');
const currentPlayerDisplay = document.getElementById('current-player');
const idkBtn = document.getElementById('idk-btn');

// Variables Locales
let myIdentity = null; 
let isHost = false;

// --- NAVEGACIÓN DE MENÚS ---
document.getElementById('btn-show-create').addEventListener('click', () => {
    welcomeModal.classList.remove('active'); setupModal.classList.add('active'); generateNameInputs();
});
document.getElementById('btn-show-join').addEventListener('click', () => {
    welcomeModal.classList.remove('active'); joinModal.classList.add('active');
});
document.getElementById('btn-back-from-setup').addEventListener('click', () => {
    setupModal.classList.remove('active'); welcomeModal.classList.add('active');
});
document.getElementById('btn-back-from-join').addEventListener('click', () => {
    joinModal.classList.remove('active'); welcomeModal.classList.add('active');
});
document.getElementById('btn-leave-room').addEventListener('click', () => {
    window.location.reload(); // Recargar la página es la forma más limpia de salir y desconectar el socket
});

// --- CREAR Y UNIRSE ---
function generateNameInputs() {
    const container = document.getElementById('names-container');
    container.innerHTML = '';
    const count = parseInt(document.getElementById('num-players-input').value) || 1;
    for (let i = 0; i < count; i++) {
        container.innerHTML += `<input type="text" class="player-name-input" placeholder="Nombre Jugador ${i+1}" required style="width: 100%; padding: 8px; margin-bottom: 5px; border-radius: 5px; border: 1px solid #ccc;">`;
    }
}
document.getElementById('num-players-input').addEventListener('change', generateNameInputs);

document.getElementById('btn-start-game').addEventListener('click', () => {
    const inputs = document.querySelectorAll('.player-name-input');
    const newPlayers = [];
    inputs.forEach(input => {
        const name = input.value.trim() || 'Jugador';
        newPlayers.push({ name: name });
    });
    socket.emit('createGame', { 
        players: newPlayers, 
        maxSuma: parseInt(document.getElementById('limit-suma-input').value) || 10, 
        maxResta: parseInt(document.getElementById('limit-resta-input').value) || 10 
    });
});

document.getElementById('btn-join-game').addEventListener('click', () => {
    const code = document.getElementById('join-code-input').value.trim();
    if(code.length > 0) socket.emit('joinGame', code);
});

socket.on('errorMsg', (msg) => alert(msg));

// --- SELECCIÓN DE IDENTIDAD ---
socket.on('roomFound', (data) => {
    setupModal.classList.remove('active');
    joinModal.classList.remove('active');
    
    isHost = data.isHost; // Si yo la creé, soy el host
    document.getElementById('display-room-code').textContent = data.roomCode;
    
    // Armar la lista de botones para elegir quién soy
    const container = document.getElementById('available-players-container');
    container.innerHTML = '';
    data.gameData.players.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'identity-btn';
        btn.textContent = p.name;
        
        if (p.connected) {
            btn.disabled = true;
            btn.textContent += ' (Ya en uso)';
        } else {
            btn.onclick = () => {
                myIdentity = p.name;
                socket.emit('claimIdentity', p.name);
                identityModal.classList.remove('active');
                
                // Mostrar la UI principal
                sidebar.style.display = 'flex';
                gameControlsArea.style.display = 'flex';
                identityDisplay.style.display = 'block';
                document.getElementById('btn-leave-room').style.display = 'inline-block';
                myNameText.textContent = myIdentity;
                
                if(isHost) hostControls.style.display = 'block'; // Mostrar controles de creador
            };
        }
        container.appendChild(btn);
    });
    
    identityModal.classList.add('active');
});

// --- RENDERIZAR PANEL LATERAL (SIDEBAR) ---
function renderSidebar(gameData) {
    playerListEl.innerHTML = '';
    gameData.players.forEach((p, index) => {
        const li = document.createElement('li');
        li.className = 'player-item';
        
        // Marcar si es su turno
        if (index === gameData.currentPlayerIndex) {
            li.classList.add('is-turn');
        }

        const statusClass = p.connected ? 'status-online' : 'status-offline';
        const statusText = p.connected ? '' : '<span style="font-size: 10px; color:#aaa;">(Desconectado)</span>';
        
        let turnIndicator = '';
        if (index === gameData.currentPlayerIndex) turnIndicator = ' 👉 Turno';
        
        li.innerHTML = `
            <div><span class="status-dot ${statusClass}"></span> <strong>${p.name}</strong> ${statusText}</div>
            <div style="font-size: 12px; color: #F1C40F; font-weight: bold;">${turnIndicator}</div>
        `;
        playerListEl.appendChild(li);
    });
}

// Agregar jugador a mitad de partida (Solo Host)
document.getElementById('btn-add-player').addEventListener('click', () => {
    const input = document.getElementById('new-player-name');
    const name = input.value.trim();
    if(name) {
        socket.emit('addPlayer', name);
        input.value = '';
    }
});

// --- ACTUALIZACIÓN VISUAL DEL JUEGO ---
function updateGameUI(gameData) {
    localPlayers = gameData.players;
    renderSidebar(gameData);
    
    // Capturamos los contenedores nuevos
    const flagContainer = document.getElementById('flag-container');
    const mathBox1 = document.getElementById('math-box-1');
    const mathBoxOp = document.getElementById('math-box-op');
    const mathBox2 = document.getElementById('math-box-2');

    // Iluminar el botón correcto
    document.querySelectorAll('.op-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-op') === gameData.currentOperation);
    });

    document.getElementById('equals-block').style.display = 'none';
    document.getElementById('result-block').style.display = 'none';

    // ¿Es Banderas o Matemáticas?
    if (gameData.currentOperation === 'banderas') {
        // Mostrar Bandera, Ocultar Matemáticas
        mathBox1.style.display = 'none';
        mathBoxOp.style.display = 'none';
        mathBox2.style.display = 'none';
        flagContainer.style.display = 'block';
        
        document.getElementById('flag-image').src = gameData.currentProblem.flagUrl;
        
        // El teclado en móviles ahora debe ser de texto (no numérico)
        answerInput.type = 'text';

    } else {
        // Mostrar Matemáticas, Ocultar Banderas
        flagContainer.style.display = 'none';
        mathBox1.style.display = 'block';
        mathBoxOp.style.display = 'block';
        mathBox2.style.display = 'block';

        document.getElementById('num1').textContent = gameData.currentProblem.num1;
        document.getElementById('num2').textContent = gameData.currentProblem.num2;
        document.getElementById('img-num1').src = `assets/numberblock_${gameData.currentProblem.num1}.png`;
        document.getElementById('img-num1').style.display = 'block';
        document.getElementById('img-num2').src = `assets/numberblock_${gameData.currentProblem.num2}.png`;
        document.getElementById('img-num2').style.display = 'block';

        const opSigns = { 'suma': '+', 'resta': '-', 'multiplicacion': 'x', 'division': '÷' };
        document.getElementById('operator').textContent = opSigns[gameData.currentOperation];
        
        // Volvemos al teclado numérico
        answerInput.type = 'number';
    }

    if (gameData.players.length > 0) {
        const playerInTurn = gameData.players[gameData.currentPlayerIndex];
        currentPlayerDisplay.textContent = playerInTurn ? `Turno de: ${playerInTurn.name}` : 'Esperando...';
        
        if (playerInTurn && myIdentity === playerInTurn.name) {
            answerInput.disabled = false; verifyBtn.disabled = false; idkBtn.disabled = false;
            answerInput.placeholder = "¡Tu turno!"; answerInput.focus();
        } else {
            answerInput.disabled = true; verifyBtn.disabled = true; idkBtn.disabled = true;
            answerInput.placeholder = playerInTurn ? `Esperando a ${playerInTurn.name}...` : '';
            answerInput.value = "";
        }
    }
}

// Eventos desde el Servidor
socket.on('syncState', (data) => updateGameUI(data.gameData));
socket.on('newProblem', (gameData) => {
    answerInput.value = ''; feedbackMessage.textContent = "";
    updateGameUI(gameData);
});

socket.on('answerResult', (data) => {
    appWrapper.classList.remove('party-animation', 'shake-animation');
    void appWrapper.offsetWidth; 

    if (data.isCorrect === true) {
        feedbackMessage.textContent = "¡Excelente! 🎉";
        feedbackMessage.className = "feedback success";
        feedbackMessage.style.color = ""; // Limpiar color manual
        appWrapper.classList.add('party-animation');
        
        document.getElementById('result-num').textContent = data.correctAnswer;
        if (data.operation === 'banderas') {
            document.getElementById('img-result').style.display = 'none';
        } else {
            document.getElementById('img-result').src = `assets/numberblock_${data.correctAnswer}.png`;
            document.getElementById('img-result').style.display = 'block'; 
        }

        document.getElementById('equals-block').style.display = 'block'; 
        document.getElementById('result-block').style.display = 'block';
        
        if (typeof confetti !== 'undefined') {
            confetti({ particleCount: 150, spread: 160, startVelocity: 30, gravity: 0.6, origin: { y: 0.5 }, colors: ['#3498DB', '#E74C3C', '#F1C40F', '#2ECC71', '#9B59B6'], zIndex: 1000 });
        }
        
    } else if (data.isCorrect === 'skipped') {
        // NUEVO: Lógica cuando se rinden
        feedbackMessage.textContent = `La respuesta es: ${data.correctAnswer} 👀`;
        feedbackMessage.className = "feedback";
        feedbackMessage.style.color = "#F39C12"; // Color naranja amigable
        
        document.getElementById('result-num').textContent = data.correctAnswer;
        if (data.operation === 'banderas') {
            document.getElementById('img-result').style.display = 'none';
        } else {
            document.getElementById('img-result').src = `assets/numberblock_${data.correctAnswer}.png`;
            document.getElementById('img-result').style.display = 'block'; 
        }

        document.getElementById('equals-block').style.display = 'block'; 
        document.getElementById('result-block').style.display = 'block';
        document.getElementById('result-block').classList.add('pop-in-animation');
        // No hay confeti ni temblor de pantalla

    } else {
        feedbackMessage.textContent = "¡Ups! Inténtalo de nuevo. 🤔";
        feedbackMessage.className = "feedback error";
        feedbackMessage.style.color = ""; // Limpiar color manual
        appWrapper.classList.add('shake-animation');
        if (!answerInput.disabled) { answerInput.value = ""; answerInput.focus(); }
    }
});

// NUEVO: Escuchar si el servidor cierra la sala (porque el Host se fue)
socket.on('roomClosed', (message) => {
    // Mostramos la alerta con el mensaje que mandó el servidor
    alert(message);
    // Recargamos la página para botarlos a la pantalla de inicio principal
    window.location.reload(); 
});


// NUEVO: Enviar que no se sabe la respuesta
idkBtn.addEventListener('click', () => {
    if (!idkBtn.disabled) socket.emit('idkAnswer');
});

// Modificada para permitir enviar texto
function sendAnswer() {
    if (answerInput.disabled) return;
    const userAnswer = answerInput.value.trim();
    // Validamos que al menos haya escrito algo
    if (userAnswer !== "") socket.emit('checkAnswer', userAnswer);
}
// --- INTERACCIÓN EN JUEGO ---
document.querySelectorAll('.op-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!answerInput.disabled) socket.emit('changeOperation', btn.getAttribute('data-op')); 
        else alert("¡Solo el jugador de turno puede cambiar la operación!");
    });
});


verifyBtn.addEventListener('click', sendAnswer);
answerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendAnswer(); });

// Botón de Estadísticas
document.getElementById('btn-open-stats').addEventListener('click', () => {
    const container = document.getElementById('stats-container');
    container.innerHTML = '';
    
    localPlayers.forEach(p => {
        // Validación por seguridad para evitar errores si el jugador recién entra
        if (!p.stats) return; 

        container.innerHTML += `
            <div class="player-stat-card" style="background: #f0f8ff; padding: 15px; margin-bottom: 15px; border-radius: 10px; text-align: left; border-left: 5px solid #2980B9;">
                <h3 style="color: #2980B9; margin-bottom: 10px; font-size: 18px;">🧑‍🚀 ${p.name}</h3>
                
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding: 5px 0;">
                    <span style="color: #333; font-weight: 500;">Sumas:</span> 
                    <span><span style="color: #2ECC71; font-weight: bold;">✔ ${p.stats.suma.bien}</span> <span style="color: #ccc;">|</span> <span style="color: #E74C3C; font-weight: bold;">✖ ${p.stats.suma.mal}</span></span>
                </div>
                
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding: 5px 0;">
                    <span style="color: #333; font-weight: 500;">Restas:</span> 
                    <span><span style="color: #2ECC71; font-weight: bold;">✔ ${p.stats.resta.bien}</span> <span style="color: #ccc;">|</span> <span style="color: #E74C3C; font-weight: bold;">✖ ${p.stats.resta.mal}</span></span>
                </div>
                
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding: 5px 0;">
                    <span style="color: #333; font-weight: 500;">Multiplicación:</span> 
                    <span><span style="color: #2ECC71; font-weight: bold;">✔ ${p.stats.multiplicacion.bien}</span> <span style="color: #ccc;">|</span> <span style="color: #E74C3C; font-weight: bold;">✖ ${p.stats.multiplicacion.mal}</span></span>
                </div>
                
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #ddd; padding: 5px 0;">
                    <span style="color: #333; font-weight: 500;">División:</span> 
                    <span><span style="color: #2ECC71; font-weight: bold;">✔ ${p.stats.division.bien}</span> <span style="color: #ccc;">|</span> <span style="color: #E74C3C; font-weight: bold;">✖ ${p.stats.division.mal}</span></span>
                </div>

                <div style="display: flex; justify-content: space-between; padding: 5px 0; background: rgba(41, 128, 185, 0.1); border-radius: 5px; margin-top: 5px;">
                    <span style="color: #333; font-weight: bold;">🌍 Banderas:</span> 
                    <span><span style="color: #2ECC71; font-weight: bold;">✔ ${p.stats.banderas?.bien || 0}</span> <span style="color: #ccc;">|</span> <span style="color: #E74C3C; font-weight: bold;">✖ ${p.stats.banderas?.mal || 0}</span></span>
                </div>
            </div>`;
    });
    
    statsModal.classList.add('active');
});

document.getElementById('btn-close-stats').addEventListener('click', () => { statsModal.classList.remove('active'); });