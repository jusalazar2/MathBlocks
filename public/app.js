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
let worldMapInstance = null;
let localPlayers = [];

// --- LÓGICA DEL MENÚ MÓVIL ---
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-active');
    });
}

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
    window.location.reload(); 
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
    
    isHost = data.isHost; 
    document.getElementById('display-room-code').textContent = data.roomCode;
    
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
                
                sidebar.style.display = '';
                gameControlsArea.style.display = 'flex';
                identityDisplay.style.display = 'block';
                document.getElementById('btn-leave-room').style.display = 'inline-block';
                myNameText.textContent = myIdentity;
                
                if(isHost) hostControls.style.display = 'block'; 
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

document.getElementById('btn-add-player').addEventListener('click', () => {
    const input = document.getElementById('new-player-name');
    const name = input.value.trim();
    if(name) {
        socket.emit('addPlayer', name);
        input.value = '';
    }
});

// Función aislada para manejar el mapa (VERSIÓN ROBUSTA)
function updateMap(countryCode) {
    if (!countryCode) return;
    const codeUpper = countryCode.toUpperCase();
    
    // 1. Si ya existe un mapa viejo, lo destruimos sin piedad
    if (worldMapInstance) {
        try { worldMapInstance.destroy(); } catch(e) {}
        document.getElementById('world-map').innerHTML = ''; 
    }

    // 2. Le damos 50 milisegundos al navegador para que la caja sea visible
    setTimeout(() => {
        // 3. Creamos un mapa completamente nuevo
        worldMapInstance = new jsVectorMap({
            selector: '#world-map',
            map: 'world',
            zoomOnScroll: false, 
            zoomButtons: false,
            selectedRegions: [codeUpper], // <-- ¡La magia! Nace pintado desde el inicio
            regionStyle: {
                initial: { fill: '#bdc3c7', stroke: '#ffffff', strokeWidth: 0.5 }, 
                selected: { fill: '#2ECC71' } 
            }
        });

        // 4. Ejecutamos el zoom hacia el país correcto
        setTimeout(() => {
            worldMapInstance.setFocus({
                regions: [codeUpper],
                animate: true
            });
        }, 50); // Un micro-retraso para que la animación fluya suavemente

    }, 50);
}

// --- ACTUALIZACIÓN VISUAL DEL JUEGO ---
function updateGameUI(gameData) {
    localPlayers = gameData.players;
    renderSidebar(gameData);
    
    const flagContainer = document.getElementById('flag-container');
    const mathContainer = document.getElementById('math-container');

    document.querySelectorAll('.op-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-op') === gameData.currentOperation);
    });

    if (gameData.currentOperation === 'banderas') {
        
        if (mathContainer) mathContainer.style.display = 'none';
        if (flagContainer) flagContainer.style.display = 'block';
        
        document.getElementById('flag-image').src = gameData.currentProblem.flagUrl;
        document.getElementById('flag-continent').textContent = `🌍 ${gameData.currentProblem.continent || 'Planeta Tierra'}`;
        document.getElementById('correct-country-name').style.display = 'none';
        answerInput.type = 'text';

        // Llamamos a la función de mapa que creamos
        if(gameData.currentProblem.code) {
             updateMap(gameData.currentProblem.code);
        }

    } else {
        if (flagContainer) flagContainer.style.display = 'none';
        if (mathContainer) mathContainer.style.display = 'flex';

        document.getElementById('equals-block').style.display = 'none';
        document.getElementById('result-block').style.display = 'none';

        document.getElementById('num1').textContent = gameData.currentProblem.num1;
        document.getElementById('num2').textContent = gameData.currentProblem.num2;
        document.getElementById('img-num1').src = `assets/numberblock_${gameData.currentProblem.num1}.png`;
        document.getElementById('img-num1').style.display = 'block';
        document.getElementById('img-num2').src = `assets/numberblock_${gameData.currentProblem.num2}.png`;
        document.getElementById('img-num2').style.display = 'block';

        const opSigns = { 'suma': '+', 'resta': '-', 'multiplicacion': 'x', 'division': '÷' };
        document.getElementById('operator').textContent = opSigns[gameData.currentOperation];
        
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
        feedbackMessage.style.color = ""; 
        appWrapper.classList.add('party-animation');
        
        if (data.operation === 'banderas') {
            const countryNameEl = document.getElementById('correct-country-name');
            countryNameEl.textContent = data.correctAnswer;
            countryNameEl.style.display = 'block';
            countryNameEl.classList.add('pop-in-animation');
        } else {
            document.getElementById('result-num').textContent = data.correctAnswer;
            document.getElementById('img-result').src = `assets/numberblock_${data.correctAnswer}.png`;
            document.getElementById('img-result').style.display = 'block'; 
            document.getElementById('equals-block').style.display = 'flex'; 
            document.getElementById('result-block').style.display = 'flex';
        }
        
        if (typeof confetti !== 'undefined') {
            confetti({ particleCount: 150, spread: 160, startVelocity: 30, gravity: 0.6, origin: { y: 0.5 }, colors: ['#3498DB', '#E74C3C', '#F1C40F', '#2ECC71', '#9B59B6'], zIndex: 1000 });
        }
        
    } else if (data.isCorrect === 'skipped') {
        feedbackMessage.textContent = `La respuesta es: ${data.correctAnswer} 👀`;
        feedbackMessage.className = "feedback";
        feedbackMessage.style.color = "#F39C12"; 
        
        if (data.operation === 'banderas') {
            const countryNameEl = document.getElementById('correct-country-name');
            countryNameEl.textContent = data.correctAnswer;
            countryNameEl.style.display = 'block';
            countryNameEl.classList.add('pop-in-animation');
        } else {
            document.getElementById('result-num').textContent = data.correctAnswer;
            document.getElementById('img-result').src = `assets/numberblock_${data.correctAnswer}.png`;
            document.getElementById('img-result').style.display = 'block'; 
            document.getElementById('equals-block').style.display = 'flex'; 
            document.getElementById('result-block').style.display = 'flex';
            document.getElementById('result-block').classList.add('pop-in-animation');
        }

    } else {
        feedbackMessage.textContent = "¡Ups! Inténtalo de nuevo. 🤔";
        feedbackMessage.className = "feedback error";
        feedbackMessage.style.color = ""; 
        appWrapper.classList.add('shake-animation');
        
        // 🔓 MAGIA: Volvemos a desbloquear los botones para que lo intente de nuevo
        answerInput.disabled = false; 
        verifyBtn.disabled = false; 
        idkBtn.disabled = false;
        
        answerInput.value = ""; 
        answerInput.focus(); 
    }
});

// Enviar que no se sabe la respuesta
idkBtn.addEventListener('click', () => {
    if (!idkBtn.disabled) {
        // 🛡️ BLOQUEO INMEDIATO: Evitamos que el jugador haga doble clic por accidente
        answerInput.disabled = true;
        verifyBtn.disabled = true;
        idkBtn.disabled = true;
        
        socket.emit('idkAnswer');
    }
});

// Enviar respuesta validada
function sendAnswer() {
    if (answerInput.disabled) return;
    const userAnswer = answerInput.value.trim();
    
    if (userAnswer !== "") {
        // 🛡️ BLOQUEO INMEDIATO: Evitamos el doble "Enter" o doble clic
        answerInput.disabled = true;
        verifyBtn.disabled = true;
        idkBtn.disabled = true;
        
        socket.emit('checkAnswer', userAnswer);
    }
}

document.querySelectorAll('.op-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!answerInput.disabled) socket.emit('changeOperation', btn.getAttribute('data-op')); 
        else alert("¡Solo el jugador de turno puede cambiar la operación!");
    });
});

verifyBtn.addEventListener('click', sendAnswer);
answerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendAnswer(); });

document.getElementById('btn-open-stats').addEventListener('click', () => {
    const container = document.getElementById('stats-container');
    container.innerHTML = '';
    
    localPlayers.forEach(p => {
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

const slider = document.querySelector('.operation-buttons');
let isDown = false;
let startX;
let scrollLeft;

if (slider) {
    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.style.cursor = 'grabbing'; 
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.style.cursor = 'default';
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.style.cursor = 'default';
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return; 
        e.preventDefault(); 
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; 
        slider.scrollLeft = scrollLeft - walk;
    });
}

// --- LÓGICA DEL PODIO Y FIN DE JUEGO ---

// 1. Botón del Host para terminar el juego manualmente
const btnEndGame = document.getElementById('btn-end-game');
if (btnEndGame) {
    btnEndGame.addEventListener('click', () => {
        if (confirm("¿Estás seguro de que quieres terminar el juego y ver a los ganadores?")) {
            // ¡NUEVO!: Le enviamos al servidor el PIN exacto de la sala
            const currentRoomCode = document.getElementById('display-room-code').textContent;
            socket.emit('endGame', currentRoomCode); 
        }
    });
}

// 2. Escuchar cuando el servidor dice que el juego terminó y armar el Super Podio
socket.on('gameEnded', (data) => {
    const players = data.players;
    const podiumContainer = document.getElementById('podium-container');
    podiumContainer.innerHTML = '';

    // Ampliamos un poco el modal temporalmente para que quepan varias tarjetas de podio lado a lado
    const modalContent = document.querySelector('#podium-modal .modal-content');
    if(modalContent) {
        modalContent.style.maxWidth = '1000px'; 
        modalContent.style.width = '95%';
    }

    // Las categorías a evaluar
    const categories = [
        { key: 'suma', label: 'SUMAS', icon: '➕', color: '#2980B9' },
        { key: 'resta', label: 'RESTAS', icon: '➖', color: '#8E44AD' },
        { key: 'multiplicacion', label: 'MULTIPLICACIÓN', icon: '✖️', color: '#2C3E50' },
        { key: 'division', label: 'DIVISIÓN', icon: '➗', color: '#16A085' },
        { key: 'banderas', label: 'BANDERAS', icon: '🌍', color: '#005C53' }
    ];

    let hayGanadores = false;

    // --- FUNCIÓN MÁGICA PARA DIBUJAR UN ESCALÓN DEL PODIO ---
    const renderStep = (player, place, catKey) => {
        // Si nadie ocupó este puesto (ej: solo jugaron 2 personas), dejamos el espacio en blanco
        if (!player) return `<div style="flex: 1; min-width: 70px;"></div>`;

        const aciertos = player.stats[catKey].bien;
        let height, bgColor, badge;

        // Estilos dependiendo si es 1ro, 2do o 3er lugar
        if (place === 1) {
            height = '80px'; 
            bgColor = 'linear-gradient(to bottom, #F1C40F, #F39C12)'; // Oro
            badge = '👑';
        } else if (place === 2) {
            height = '55px'; 
            bgColor = 'linear-gradient(to bottom, #E0E0E0, #BDC3C7)'; // Plata
            badge = '🥈';
        } else {
            height = '35px'; 
            bgColor = 'linear-gradient(to bottom, #E67E22, #D35400)'; // Bronce
            badge = '🥉';
        }

        return `
            <div style="flex: 1; min-width: 70px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
                
                <!-- Nombre y Puntaje -->
                <div style="font-size: 13px; font-weight: bold; color: #2C3E50; margin-bottom: 2px; text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${badge} ${player.name}
                </div>
                <div style="font-size: 11px; color: #27AE60; font-weight: bold; margin-bottom: 5px;">
                    ${aciertos} pts
                </div>

                <!-- Imagen del Numberblock (1, 2 o 3) -->
                <img src="assets/numberblock_${place}.png" alt="NB ${place}" style="height: 45px; object-fit: contain; margin-bottom: -12px; z-index: 2; filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.4));">
                
                <!-- Cajón del Podio -->
                <div style="width: 100%; height: ${height}; background: ${bgColor}; border-radius: 5px 5px 0 0; display: flex; justify-content: center; box-shadow: inset 0 2px 5px rgba(255,255,255,0.5), 0 5px 10px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.1); border-bottom: none;">
                    <span style="font-size: 24px; font-weight: bold; color: rgba(255,255,255,0.8); margin-top: 5px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">${place}</span>
                </div>
            </div>
        `;
    };

    categories.forEach(cat => {
        // 1. Filtrar jugadores que tengan MÁS de 0 puntos en esta categoría
        let jugadoresValidos = players.filter(p => p.stats && p.stats[cat.key] && p.stats[cat.key].bien > 0);
        
        // 2. Ordenarlos de mayor a menor puntaje
        jugadoresValidos.sort((a, b) => b.stats[cat.key].bien - a.stats[cat.key].bien);

        // 3. Si hay al menos un jugador con puntos, dibujamos la tarjeta de esta categoría
        if (jugadoresValidos.length > 0) {
            hayGanadores = true;

            // Extraemos a los 3 mejores (si no hay suficientes, quedarán como 'undefined')
            const oro = jugadoresValidos[0];
            const plata = jugadoresValidos[1]; 
            const bronce = jugadoresValidos[2]; 

            // Inyectamos la tarjeta completa en el HTML
            podiumContainer.innerHTML += `
                <div style="background: linear-gradient(to bottom, #ffffff, #f4f6f7); border: 2px solid #e1e8ed; padding: 20px 10px 0 10px; border-radius: 20px; width: 280px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 10px 20px rgba(0,0,0,0.08); overflow: hidden;">
                    
                    <div style="font-size: 40px; margin-bottom: 5px; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.2));">${cat.icon}</div>
                    <h3 style="color: ${cat.color}; font-size: 16px; margin: 0 0 20px 0; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; text-align: center;">${cat.label}</h3>
                    
                    <!-- Contenedor Flex para los 3 lugares (Orden: 2, 1, 3) -->
                    <div style="display: flex; width: 100%; align-items: flex-end; justify-content: center; gap: 5px; margin-top: auto;">
                        ${renderStep(plata, 2, cat.key)}
                        ${renderStep(oro, 1, cat.key)}
                        ${renderStep(bronce, 3, cat.key)}
                    </div>
                </div>
            `;
        }
    });

    // Por si acaso nadie contestó nada bien en toda la partida
    if (!hayGanadores) {
        podiumContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: #95a5a6; font-size: 22px; font-weight: bold;">Nadie obtuvo aciertos esta vez.<br>¡Sigan practicando!</p>
            </div>
        `;
    }

    // Ocultar cualquier modal que esté abierto y mostrar el podio
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.getElementById('podium-modal').classList.add('active');

    // ¡Tirar confeti gigante!
    if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 500, spread: 200, startVelocity: 60, gravity: 0.8, origin: { y: 0.4 }, zIndex: 99999, colors: ['#FFD700', '#C0C0C0', '#CD7F32', '#3498DB', '#E74C3C', '#2ECC71'] });
    }
});