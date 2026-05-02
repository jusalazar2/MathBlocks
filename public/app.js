const socket = io(); 

// Elementos DOM Básicos
const appWrapper = document.getElementById('app-wrapper');
const sidebar = document.getElementById('sidebar');
const gameControlsArea = document.getElementById('game-controls-area');
const playerListEl = document.getElementById('player-list');
const hostControls = document.getElementById('host-controls');
const identityDisplay = document.getElementById('identity-display');
const myNameText = document.getElementById('my-name-text');

// Modales GLOBALES
const welcomeModal = document.getElementById('welcome-modal');
const joinModal = document.getElementById('join-modal');
const setupModal = document.getElementById('setup-modal');
const identityModal = document.getElementById('identity-modal');
const statsModal = document.getElementById('stats-modal');

// Elementos Globales (HUD)
const answerInput = document.getElementById('answer-input');
const verifyBtn = document.getElementById('verify-btn');
const feedbackMessage = document.getElementById('feedback-message');
const currentPlayerDisplay = document.getElementById('current-player');
const idkBtn = document.getElementById('idk-btn');
const questionTitle = document.getElementById('question-title');

// Variables Locales
let myIdentity = null; 
let isHost = false;
let localPlayers = [];

// --- MEMORIA CACHÉ PARA LOS MÓDULOS ---
const gameCache = {}; 
let currentGameModuleObj = null; // Sabrá si usar 'MathGame' o 'FlagsGame'

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
        maxSuma: 20, 
        maxResta: 20
    });
});

document.getElementById('btn-join-game').addEventListener('click', () => {
    const code = document.getElementById('join-code-input').value.trim();
    if(code.length > 0) socket.emit('joinGame', code);
});

socket.on('errorMsg', (msg) => alert(msg));


// --- SELECCIÓN DE IDENTIDAD Y ESPECTADOR ---
socket.on('roomFound', (data) => {
    setupModal.classList.remove('active');
    joinModal.classList.remove('active');
    
    isHost = data.isHost; 
    document.getElementById('display-room-code').textContent = data.roomCode;
    
    // 🐛 BUGFIX: Guardamos los jugadores en la memoria local inmediatamente
    localPlayers = data.gameData.players;
    
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
                
                // Si es el Host quien elige jugador, le damos el botón naranja para salir
                const toggleBtn = document.getElementById('btn-toggle-player');
                if (isHost) {
                    toggleBtn.style.display = 'inline-block';
                    toggleBtn.textContent = '👀 Volver a mirar';
                    toggleBtn.style.background = '#F39C12'; // Naranja
                } else {
                    toggleBtn.style.display = 'none'; // Los jugadores normales no pueden salir a espectador
                }
                
                if(isHost) hostControls.style.display = 'block'; 
            };
        }
        container.appendChild(btn);
    });

    document.getElementById('btn-spectator').onclick = () => {
        myIdentity = 'Espectador';
        identityModal.classList.remove('active');
        
        sidebar.style.display = '';
        gameControlsArea.style.display = 'flex';
        identityDisplay.style.display = 'block';
        document.getElementById('btn-leave-room').style.display = 'inline-block';
        myNameText.textContent = 'Espectador 👀';
        
        // 🐛 BUGFIX: Dibuja el panel lateral y el juego aunque seamos solo espectadores
        updateGameUI(data.gameData);

        // Prepara el botón verde por si el Host quiere entrar al juego luego
        const toggleBtn = document.getElementById('btn-toggle-player');
        toggleBtn.style.display = 'inline-block';
        toggleBtn.textContent = '🎮 Unirme';
        toggleBtn.style.background = '#2ECC71'; // Verde

        if(isHost) hostControls.style.display = 'block'; 
    };
    
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


// --- 🚀 EL MOTOR MODULAR: FUNCIÓN PARA CARGAR HTML, JS Y CSS DINÁMICO ---
async function loadGameModule(operation) {
    let folder = 'matematicas';
    let jsFile = 'math.js';
    let moduleObjName = 'MathGame';
    
    if (operation === 'banderas') {
        folder = 'banderas';
        jsFile = 'flags.js';
        moduleObjName = 'FlagsGame';
    }

    const mountPoint = document.getElementById('game-mount-point');

    // 1. Si ya estamos en este juego, no hacemos nada
    if (mountPoint.getAttribute('data-current') === folder) return moduleObjName;

    // 2. Inyectar el HTML (desde caché o bajándolo)
    if (gameCache[folder]) {
        mountPoint.innerHTML = gameCache[folder];
    } else {
        try {
            const response = await fetch(`/games/${folder}/index.html`);
            const htmlText = await response.text();
            gameCache[folder] = htmlText;
            mountPoint.innerHTML = htmlText;
        } catch (error) { console.error("Error cargando HTML del juego:", error); }
    }
    mountPoint.setAttribute('data-current', folder);

    // 3. Inyectar el JS dinámicamente si no existe aún
    if (!document.getElementById(`script-${folder}`)) {
        const script = document.createElement('script');
        script.id = `script-${folder}`;
        script.src = `/games/${folder}/${jsFile}`;
        document.body.appendChild(script);
        
        // Esperamos a que el navegador termine de leer el archivo JS
        await new Promise(resolve => script.onload = resolve);
    }

    // 4. 🎨 INYECTAR EL CSS DINÁMICAMENTE SI NO EXISTE AÚN
    if (!document.getElementById(`css-${folder}`)) {
        const link = document.createElement('link');
        link.id = `css-${folder}`;
        link.rel = 'stylesheet';
        link.href = `/games/${folder}/style.css`;
        document.head.appendChild(link); // Esto lo pega "invisiblemente" en el código de la página
    }
    
    return moduleObjName;
}

// --- ACTUALIZACIÓN VISUAL DEL JUEGO (ORQUESTADOR) ---
async function updateGameUI(gameData) {
    localPlayers = gameData.players;
    renderSidebar(gameData);
    
    document.querySelectorAll('.op-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-op') === gameData.currentOperation);
    });

    // 🚀 ORQUESTACIÓN: Cargamos el juego y descubrimos cómo se llama su módulo JS
    currentGameModuleObj = await loadGameModule(gameData.currentOperation);

    // 1. HUD Global (Controlado por app.js)
    if (gameData.currentOperation === 'banderas') {
        questionTitle.textContent = "¿A qué país pertenece esta bandera?";
        answerInput.type = 'text';
    } else {
        questionTitle.textContent = "¿Cuál es el resultado?";
        answerInput.type = 'number';
    }

    // 2. DELEGACIÓN: Le decimos al archivo JS del mini-juego que pinte su "nivel"
    if (window[currentGameModuleObj] && window[currentGameModuleObj].update) {
        window[currentGameModuleObj].update(gameData);
    }

    // Lógica de Turnos (Global)
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

    // ⚙️ MOSTRAR CONFIGURACIÓN DINÁMICA SOLO AL HOST
    if (isHost) {
        document.querySelectorAll('.game-config').forEach(el => el.style.display = 'none');
        const activeConfig = document.getElementById(`config-${gameData.currentOperation}`);
        if (activeConfig) activeConfig.style.display = 'block';
        
        if (gameData.maxSuma) document.getElementById('host-limit-suma').value = gameData.maxSuma;
        if (gameData.maxResta) document.getElementById('host-limit-resta').value = gameData.maxResta;

        // Mantener la botonera sincronizada
        if (gameData.tablesMultiplicacion) {
            document.querySelectorAll('#btn-group-mult .table-btn').forEach(btn => {
                btn.classList.toggle('active', gameData.tablesMultiplicacion.includes(parseInt(btn.getAttribute('data-val'))));
            });
        }
        if (gameData.tablesDivision) {
            document.querySelectorAll('#btn-group-div .table-btn').forEach(btn => {
                btn.classList.toggle('active', gameData.tablesDivision.includes(parseInt(btn.getAttribute('data-val'))));
            });
        }
        if (gameData.continents) {
            document.querySelectorAll('#btn-group-banderas .continent-btn').forEach(btn => {
                btn.classList.toggle('active', gameData.continents.includes(btn.getAttribute('data-val')));
            });
        }
    }
}

// Eventos desde el Servidor
socket.on('syncState', async (data) => await updateGameUI(data.gameData));
socket.on('newProblem', async (gameData) => {
    answerInput.value = ''; feedbackMessage.textContent = "";
    await updateGameUI(gameData);
});

socket.on('answerResult', (data) => {
    appWrapper.classList.remove('party-animation', 'shake-animation');
    void appWrapper.offsetWidth; 

    if (data.isCorrect === true) {
        feedbackMessage.textContent = "¡Excelente! 🎉";
        feedbackMessage.className = "feedback success";
        feedbackMessage.style.color = ""; 
        appWrapper.classList.add('party-animation');
        
        // 🚀 DELEGACIÓN: El mini-juego decide cómo mostrar la respuesta exitosa
        if (window[currentGameModuleObj] && window[currentGameModuleObj].showResult) {
            window[currentGameModuleObj].showResult(data);
        }
        
        if (typeof confetti !== 'undefined') {
            confetti({ particleCount: 150, spread: 160, startVelocity: 30, gravity: 0.6, origin: { y: 0.5 }, colors: ['#3498DB', '#E74C3C', '#F1C40F', '#2ECC71', '#9B59B6'], zIndex: 1000 });
        }
        
    } else if (data.isCorrect === 'skipped') {
        feedbackMessage.textContent = `La respuesta es: ${data.correctAnswer} 👀`;
        feedbackMessage.className = "feedback";
        feedbackMessage.style.color = "#F39C12"; 
        
        // 🚀 DELEGACIÓN: El mini-juego muestra la respuesta al rendirse
        if (window[currentGameModuleObj] && window[currentGameModuleObj].showResult) {
            window[currentGameModuleObj].showResult(data);
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
        // 🛡️ BLOQUEO INMEDIATO
        answerInput.disabled = true; verifyBtn.disabled = true; idkBtn.disabled = true;
        socket.emit('idkAnswer');
    }
});

// Enviar respuesta validada
function sendAnswer() {
    if (answerInput.disabled) return;
    const userAnswer = answerInput.value.trim();
    
    if (userAnswer !== "") {
        // 🛡️ BLOQUEO INMEDIATO
        answerInput.disabled = true; verifyBtn.disabled = true; idkBtn.disabled = true;
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

// Botón de Estadísticas
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

// Scroll Horizontal para Menú
const slider = document.querySelector('.operation-buttons');
let isDown = false; let startX; let scrollLeft;

if (slider) {
    slider.addEventListener('mousedown', (e) => {
        isDown = true; slider.style.cursor = 'grabbing'; 
        startX = e.pageX - slider.offsetLeft; scrollLeft = slider.scrollLeft;
    });
    slider.addEventListener('mouseleave', () => { isDown = false; slider.style.cursor = 'default'; });
    slider.addEventListener('mouseup', () => { isDown = false; slider.style.cursor = 'default'; });
    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return; 
        e.preventDefault(); 
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; 
        slider.scrollLeft = scrollLeft - walk;
    });
}

// --- EVENTOS DE CONFIGURACIÓN DEL HOST ---
const btnUpdateSuma = document.getElementById('btn-update-suma');
if (btnUpdateSuma) {
    btnUpdateSuma.addEventListener('click', () => {
        const limit = parseInt(document.getElementById('host-limit-suma').value) || 20;
        socket.emit('updateConfig', { operation: 'suma', limit: limit });
    });
}

const btnUpdateResta = document.getElementById('btn-update-resta');
if (btnUpdateResta) {
    btnUpdateResta.addEventListener('click', () => {
        const limit = parseInt(document.getElementById('host-limit-resta').value) || 20;
        socket.emit('updateConfig', { operation: 'resta', limit: limit });
    });
}

// --- LÓGICA DEL PODIO Y FIN DE JUEGO ---

// 1. Botón del Host para terminar el juego manualmente
const btnEndGame = document.getElementById('btn-end-game');
if (btnEndGame) {
    btnEndGame.addEventListener('click', () => {
        if (confirm("¿Estás seguro de que quieres terminar el juego y ver a los ganadores?")) {
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

    const modalContent = document.querySelector('#podium-modal .modal-content');
    if(modalContent) {
        modalContent.style.maxWidth = '1000px'; 
        modalContent.style.width = '95%';
    }

    const categories = [
        { key: 'suma', label: 'SUMAS', icon: '➕', color: '#2980B9' },
        { key: 'resta', label: 'RESTAS', icon: '➖', color: '#8E44AD' },
        { key: 'multiplicacion', label: 'MULTIPLICACIÓN', icon: '✖️', color: '#2C3E50' },
        { key: 'division', label: 'DIVISIÓN', icon: '➗', color: '#16A085' },
        { key: 'banderas', label: 'BANDERAS', icon: '🌍', color: '#005C53' }
    ];

    let hayGanadores = false;

    const renderStep = (player, place, catKey) => {
        if (!player) return `<div style="flex: 1; min-width: 70px;"></div>`;
        const aciertos = player.stats[catKey].bien;
        let height, bgColor, badge;

        if (place === 1) {
            height = '80px'; bgColor = 'linear-gradient(to bottom, #F1C40F, #F39C12)'; badge = '👑';
        } else if (place === 2) {
            height = '55px'; bgColor = 'linear-gradient(to bottom, #E0E0E0, #BDC3C7)'; badge = '🥈';
        } else {
            height = '35px'; bgColor = 'linear-gradient(to bottom, #E67E22, #D35400)'; badge = '🥉';
        }

        return `
            <div style="flex: 1; min-width: 70px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end;">
                <div style="font-size: 13px; font-weight: bold; color: #2C3E50; margin-bottom: 2px; text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${badge} ${player.name}
                </div>
                <div style="font-size: 11px; color: #27AE60; font-weight: bold; margin-bottom: 5px;">${aciertos} pts</div>
                <img src="assets/numberblock_${place}.png" alt="NB ${place}" style="height: 45px; object-fit: contain; margin-bottom: -12px; z-index: 2; filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.4));">
                <div style="width: 100%; height: ${height}; background: ${bgColor}; border-radius: 5px 5px 0 0; display: flex; justify-content: center; box-shadow: inset 0 2px 5px rgba(255,255,255,0.5), 0 5px 10px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.1); border-bottom: none;">
                    <span style="font-size: 24px; font-weight: bold; color: rgba(255,255,255,0.8); margin-top: 5px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">${place}</span>
                </div>
            </div>
        `;
    };

    categories.forEach(cat => {
        let jugadoresValidos = players.filter(p => p.stats && p.stats[cat.key] && p.stats[cat.key].bien > 0);
        jugadoresValidos.sort((a, b) => b.stats[cat.key].bien - a.stats[cat.key].bien);

        if (jugadoresValidos.length > 0) {
            hayGanadores = true;
            const oro = jugadoresValidos[0];
            const plata = jugadoresValidos[1]; 
            const bronce = jugadoresValidos[2]; 

            podiumContainer.innerHTML += `
                <div style="background: linear-gradient(to bottom, #ffffff, #f4f6f7); border: 2px solid #e1e8ed; padding: 20px 10px 0 10px; border-radius: 20px; width: 280px; display: flex; flex-direction: column; align-items: center; box-shadow: 0 10px 20px rgba(0,0,0,0.08); overflow: hidden;">
                    <div style="font-size: 40px; margin-bottom: 5px; filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.2));">${cat.icon}</div>
                    <h3 style="color: ${cat.color}; font-size: 16px; margin: 0 0 20px 0; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; text-align: center;">${cat.label}</h3>
                    <div style="display: flex; width: 100%; align-items: flex-end; justify-content: center; gap: 5px; margin-top: auto;">
                        ${renderStep(plata, 2, cat.key)}
                        ${renderStep(oro, 1, cat.key)}
                        ${renderStep(bronce, 3, cat.key)}
                    </div>
                </div>
            `;
        }
    });

    if (!hayGanadores) {
        podiumContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: #95a5a6; font-size: 22px; font-weight: bold;">Nadie obtuvo aciertos esta vez.<br>¡Sigan practicando!</p>
            </div>
        `;
    }

    document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    document.getElementById('podium-modal').classList.add('active');

    if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 500, spread: 200, startVelocity: 60, gravity: 0.8, origin: { y: 0.4 }, zIndex: 99999, colors: ['#FFD700', '#C0C0C0', '#CD7F32', '#3498DB', '#E74C3C', '#2ECC71'] });
    }
});

// --- LÓGICA DE LOS BOTONES DE TABLAS ---
document.querySelectorAll('.table-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('active'); // Prende o apaga el botón
    });
});

const btnUpdateMult = document.getElementById('btn-update-mult');
if (btnUpdateMult) {
    btnUpdateMult.addEventListener('click', () => {
        // Obtenemos solo los números de los botones que están verdes
        const activeTables = Array.from(document.querySelectorAll('#btn-group-mult .table-btn.active')).map(b => parseInt(b.getAttribute('data-val')));
        if(activeTables.length === 0) return alert('¡Debes seleccionar al menos una tabla!');
        socket.emit('updateConfig', { operation: 'multiplicacion', tables: activeTables });
    });
}

const btnUpdateDiv = document.getElementById('btn-update-div');
if (btnUpdateDiv) {
    btnUpdateDiv.addEventListener('click', () => {
        const activeTables = Array.from(document.querySelectorAll('#btn-group-div .table-btn.active')).map(b => parseInt(b.getAttribute('data-val')));
        if(activeTables.length === 0) return alert('¡Debes seleccionar al menos una tabla!');
        socket.emit('updateConfig', { operation: 'division', tables: activeTables });
    });
}

// --- LÓGICA DE LOS BOTONES DE CONTINENTES (BANDERAS) ---
document.querySelectorAll('.continent-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle('active');
    });
});

const btnUpdateBanderas = document.getElementById('btn-update-banderas');
if (btnUpdateBanderas) {
    btnUpdateBanderas.addEventListener('click', () => {
        // Obtenemos el texto de data-val de los botones que están verdes
        const activeContinents = Array.from(document.querySelectorAll('#btn-group-banderas .continent-btn.active')).map(b => b.getAttribute('data-val'));
        if(activeContinents.length === 0) return alert('¡Debes seleccionar al menos un continente!');
        socket.emit('updateConfig', { operation: 'banderas', continents: activeContinents });
    });
}

// --- LÓGICA PARA ENTRAR Y SALIR DEL MODO ESPECTADOR (SOLO HOST) ---
const btnTogglePlayer = document.getElementById('btn-toggle-player');
if (btnTogglePlayer) {
    btnTogglePlayer.addEventListener('click', () => {
        
        if (myIdentity === 'Espectador') {
            // 1. Quiere unirse: Le mostramos las plazas disponibles
            const container = document.getElementById('available-players-container');
            container.innerHTML = '';
            
            localPlayers.forEach(p => {
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
                        myNameText.textContent = myIdentity;
                        
                        // Transformamos el botón a "Volver a mirar"
                        btnTogglePlayer.textContent = '👀 Volver a mirar';
                        btnTogglePlayer.style.background = '#F39C12'; // Naranja
                    };
                }
                container.appendChild(btn);
            });
            
            identityModal.classList.add('active');
            
        } else {
            // 2. Está jugando y quiere salirse (Volver a ser espectador)
            socket.emit('releaseIdentity'); // Le avisa al server que suelte al personaje
            myIdentity = 'Espectador';
            myNameText.textContent = 'Espectador 👀';
            
            // Transformamos el botón de vuelta a "Unirme"
            btnTogglePlayer.textContent = '🎮 Unirme';
            btnTogglePlayer.style.background = '#2ECC71'; // Verde
            
            // Le bloqueamos el teclado localmente por seguridad
            answerInput.disabled = true; 
            verifyBtn.disabled = true; 
            idkBtn.disabled = true;
            answerInput.placeholder = "Modo Espectador...";
        }
    });
}