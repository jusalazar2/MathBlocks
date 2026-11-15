window.PiramideGame = {
    isRolling: false,
    modes: {
        NORMAL: 'NORMAL', REWARD_OFF_OWN: 'REWARD_OFF_OWN', REWARD_OFF_OPP: 'REWARD_OFF_OPP',
        PUNISH_ON_OWN: 'PUNISH_ON_OWN', RULE_1_ADD: 'RULE_1_ADD', RULE_6_ROLL: 'RULE_6_ROLL',
        RULE_6_SUBTRACT: 'RULE_6_SUBTRACT', RULE_6_ADD: 'RULE_6_ADD'
    },

    update: function(gameData) {
        if (!gameData.currentProblem || !gameData.currentProblem.pyramidState) return;
        
        const state = gameData.currentProblem.pyramidState;
        
        // 1. IDENTIDAD
        let myActualIdentity = window.myIdentity;
        if (!myActualIdentity) {
            const nameEl = document.getElementById('my-name-text');
            if (nameEl) myActualIdentity = nameEl.textContent.trim();
        }

        const currentPlayerName = gameData.players[gameData.currentPlayerIndex].name;
        const isMyTurn = (currentPlayerName === myActualIdentity);
        
        // 2. MODALES DEL SISTEMA
        const sysModal = document.getElementById('sys-modal');
        if (state.modalMsg && isMyTurn && !PiramideGame.isRolling) {
            if (!sysModal) this.createSystemModal();
            document.getElementById('sys-modal-title').textContent = state.modalMsg.title;
            document.getElementById('sys-modal-text').textContent = state.modalMsg.text;
            document.getElementById('sys-modal').style.display = 'flex';
        } else if (sysModal) {
            sysModal.style.display = 'none';
        }

        // 3. HUB CENTRAL
        document.getElementById('hub-turn-display').textContent = state.turnCounter;
        const diceIcon = document.getElementById('hub-dice-icon');
        const diceValue = document.getElementById('hub-dice-value');
        const rollBtn = document.getElementById('btn-react-roll');
        
        let skipTurnBtn = document.getElementById('btn-skip-turn');
        if (!skipTurnBtn) {
            skipTurnBtn = document.createElement('button');
            skipTurnBtn.id = 'btn-skip-turn';
            skipTurnBtn.className = 'skip-turn-btn';
            skipTurnBtn.innerHTML = 'Pasar Turno ➔';
            document.querySelector('.center-hub').appendChild(skipTurnBtn);
        }

        // Dibujar dado final
        if (state.diceValue > 0 && !PiramideGame.isRolling) {
            diceIcon.style.display = 'none';
            diceValue.style.display = 'flex';
            diceValue.textContent = state.diceValue;
            diceValue.className = `hub-dice-box val-${state.diceValue}`;
        } else if (state.diceValue === 0) {
            diceIcon.style.display = 'block';
            diceValue.style.display = 'none';
        }

        const newRollBtn = rollBtn.cloneNode(true);
        rollBtn.parentNode.replaceChild(newRollBtn, rollBtn);
        const gameStatusMsg = document.getElementById('game-status-msg');

        if (isMyTurn) {
            if (state.mode === this.modes.NORMAL) {
                if (state.diceValue > 0) {
                    newRollBtn.disabled = true;
                    newRollBtn.textContent = 'Lanzado';
                    newRollBtn.className = 'hub-btn lanzado';
                    
                    let hasMatchingCircles = state.players[currentPlayerName]?.circles.some(c => c.active && c.val === state.diceValue);
                    gameStatusMsg.textContent = hasMatchingCircles ? `Sacaste un ${state.diceValue}. Haz clic en uno de tus círculos activos.` : `Sacaste un ${state.diceValue}, pero no tienes ese número. Debes pasar turno.`;
                    
                    skipTurnBtn.style.display = 'block';
                    skipTurnBtn.textContent = 'Pasar Turno ➔';
                    skipTurnBtn.onclick = (e) => {
                        e.preventDefault();
                        if (!hasMatchingCircles || confirm("¿Estás seguro de que quieres pasar el turno?")) {
                            this.sendAction("SKIP");
                        }
                    };
                } else {
                    newRollBtn.disabled = false;
                    newRollBtn.textContent = '🎲 Lanzar Dado';
                    newRollBtn.className = 'hub-btn';
                    gameStatusMsg.textContent = `Tira el dado para comenzar tu turno.`;
                    skipTurnBtn.style.display = 'none';
                    
                    newRollBtn.onclick = (e) => {
                        e.preventDefault(); e.stopPropagation();
                        if (PiramideGame.isRolling) return;
                        newRollBtn.disabled = true;
                        
                        this.rollDiceAnimation(diceIcon, diceValue, () => {
                            this.sendAction("ROLL");
                        });
                    };
                }
            } else if (state.mode === this.modes.RULE_6_ROLL) {
                newRollBtn.disabled = false;
                newRollBtn.textContent = '🔄 Tirar Regla 6';
                newRollBtn.className = 'hub-btn';
                newRollBtn.style.backgroundColor = '#eab308'; 
                gameStatusMsg.textContent = `Regla del 6: Lanza el dado de nuevo desde el Centro.`;
                skipTurnBtn.style.display = 'none';
                
                newRollBtn.onclick = (e) => {
                    e.preventDefault();
                    if (PiramideGame.isRolling) return;
                    newRollBtn.disabled = true;
                    this.rollDiceAnimation(diceIcon, diceValue, () => {
                        this.sendAction("ROLL_6");
                    });
                };
            } else {
                newRollBtn.disabled = true;
                newRollBtn.textContent = 'Acción...';
                newRollBtn.className = 'hub-btn lanzado';
                skipTurnBtn.style.display = 'block';
                skipTurnBtn.textContent = 'Me Rindo (-1 Turno)';
                skipTurnBtn.onclick = (e) => {
                    e.preventDefault();
                    if(confirm("Si te rindes ahora perderás tu próximo turno. ¿Aceptar?")) {
                        this.sendAction("SKIP"); 
                    }
                };

                if (state.mode === this.modes.REWARD_OFF_OWN) gameStatusMsg.textContent = '🎁 Premio: Haz clic en CUALQUIER círculo TUYO encendido para apagarlo.';
                else if (state.mode === this.modes.REWARD_OFF_OPP) gameStatusMsg.textContent = '🎁 Premio: Haz clic en un círculo de un RIVAL para apagarlo.';
                else if (state.mode === this.modes.PUNISH_ON_OWN) gameStatusMsg.textContent = '💀 Castigo: Haz clic en un círculo TUYO apagado para encenderlo con valor 6.';
                else if (state.mode === this.modes.RULE_1_ADD) {
                    const nextP = gameData.players[(gameData.currentPlayerIndex + 1) % gameData.players.length].name;
                    gameStatusMsg.textContent = `Regla del 1: Súmale +1 a un círculo de ${nextP} (debe ser menor a 6).`;
                }
                else if (state.mode === this.modes.RULE_6_SUBTRACT) gameStatusMsg.textContent = `Regla 6 (>3): Réstale -1 a un círculo activo de cada jugador.`;
                else if (state.mode === this.modes.RULE_6_ADD) gameStatusMsg.textContent = `Regla 6 (<4): Suma +1. Te falta: ${state.interactionData.ownLeft} tuyos, ${state.interactionData.oppLeft} rival.`;
            }
        } else {
            newRollBtn.textContent = 'Esperando...';
            newRollBtn.disabled = true;
            newRollBtn.className = 'hub-btn lanzado';
            skipTurnBtn.style.display = 'none';
            document.getElementById('game-status-msg').textContent = `Es el turno de ${currentPlayerName}...`;
        }

        // 4. HEADER BOTONES
        const btnRules = document.getElementById('btn-show-rules');
        if (btnRules) btnRules.onclick = () => document.getElementById('rules-modal').style.display = 'flex';
        const btnCloseRules = document.getElementById('btn-close-rules');
        if (btnCloseRules) btnCloseRules.onclick = () => document.getElementById('rules-modal').style.display = 'none';
        const btnSurrender = document.getElementById('btn-surrender');
        if (btnSurrender) btnSurrender.onclick = () => { if(confirm("¿Rendirse y saltar turno?")) document.getElementById('idk-btn')?.click(); };
        const btnRestart = document.getElementById('btn-restart');
        if (btnRestart) btnRestart.onclick = () => { if(confirm("¿Salir del juego?")) window.location.reload(); };

        // 5. DIBUJAR JUGADORES
        const layer = document.getElementById('react-players-layer');
        layer.innerHTML = ''; 
        
        const players = gameData.players;
        const numPlayers = players.length;
        
        // 🌟 DYNAMIC RADIUS AND SCALE FIX FOR HIGH PLAYER COUNTS
        let radius = 280; 
        let scale = 1;
        if (numPlayers === 3) { radius = 300; scale = 0.9; }
        else if (numPlayers === 4) { radius = 340; scale = 0.8; }
        else if (numPlayers === 5) { radius = 380; scale = 0.7; }
        else if (numPlayers >= 6) { radius = 450; scale = 0.55; } // Push them way out, shrink them down
        
        layer.style.transform = `scale(${scale})`;
        
        players.forEach((playerObj, index) => {
            const playerName = playerObj.name;
            const pState = state.players[playerName];
            if (!pState) return;
            const isThisPlayerTurn = (playerName === currentPlayerName);

            const section = document.createElement('div');
            section.className = 'player-section';
            
            let angle = (360 / numPlayers) * index;
            if (numPlayers === 2) angle = index === 0 ? 0 : 180; 
            const radian = (angle * Math.PI) / 180;
            const x = Math.sin(radian) * radius;
            const y = -Math.cos(radian) * radius;
            
            section.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${angle}deg)`;

            const dashWrapper = document.createElement('div');
            dashWrapper.className = 'player-dashboard-wrapper';
            const dash = document.createElement('div');
            dash.className = `player-dashboard ${isThisPlayerTurn ? 'is-turn' : ''}`;
            dash.innerHTML = `
                <div class="pd-name">${playerName} ${!playerObj.connected ? '(Off)' : ''}</div>
                <div class="pd-stats">
                    Pts: <span class="white">${pState.score}</span> | P. Turnos: <span class="red">${pState.missedTurns}</span>
                </div>
            `;
            dashWrapper.appendChild(dash);
            section.appendChild(dashWrapper);

            const pyrWrapper = document.createElement('div');
            pyrWrapper.className = 'pyramid-wrapper';
            
            const PYRAMID_ROWS = [5, 4, 3, 2, 1]; 
            let circleIndex = 0;
            
            for (let rowCount of PYRAMID_ROWS) {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'pyramid-row';
                
                for (let i = 0; i < rowCount; i++) {
                    const circleData = pState.circles[circleIndex];
                    if (!circleData) break;

                    const circle = document.createElement('button');
                    circle.className = `pyramid-circle`;
                    circle.disabled = true; 
                    
                    if (!circleData.active) {
                        circle.classList.add('turned-off');
                    } else {
                        circle.textContent = circleData.val;
                        circle.classList.add(`val-${circleData.val}`);
                    }

                    let highlight = false;
                    if (isMyTurn && !PiramideGame.isRolling) {
                        const isCircleMine = (playerName === myActualIdentity);
                        
                        if (state.mode === PiramideGame.modes.NORMAL && state.diceValue > 0) {
                            if (isCircleMine && circleData.active && circleData.val === state.diceValue) highlight = true;
                        } else if (state.mode === PiramideGame.modes.REWARD_OFF_OWN) {
                            if (isCircleMine && circleData.active) highlight = true;
                        } else if (state.mode === PiramideGame.modes.REWARD_OFF_OPP) {
                            if (!isCircleMine && circleData.active) highlight = true;
                        } else if (state.mode === PiramideGame.modes.PUNISH_ON_OWN) {
                            if (isCircleMine && !circleData.active) highlight = true;
                        } else if (state.mode === PiramideGame.modes.RULE_1_ADD) {
                            const nextPName = gameData.players[(gameData.currentPlayerIndex + 1) % gameData.players.length].name;
                            if (playerName === nextPName && circleData.active && circleData.val < 6) highlight = true;
                        } else if (state.mode === PiramideGame.modes.RULE_6_SUBTRACT) {
                            if (state.interactionData.remaining?.includes(playerName) && circleData.active) highlight = true;
                        } else if (state.mode === PiramideGame.modes.RULE_6_ADD) {
                            if (circleData.active && circleData.val < 6) {
                                if (isCircleMine && state.interactionData.ownLeft > 0) highlight = true;
                                if (!isCircleMine && state.interactionData.oppLeft > 0) highlight = true;
                            }
                        }
                    }

                    if (highlight) {
                        circle.classList.add('highlight');
                        circle.disabled = false; 
                        circle.onclick = (e) => {
                            e.preventDefault(); e.stopPropagation();
                            PiramideGame.sendAction(`CIRCLE_${playerName}_${circleData.id}`);
                        };
                    }

                    rowDiv.appendChild(circle);
                    circleIndex++;
                }
                pyrWrapper.appendChild(rowDiv);
            }
            section.appendChild(pyrWrapper);
            layer.appendChild(section);
        });
    },

    sendAction: function(actionString) {
        const ansInput = document.getElementById('answer-input');
        const verBtn = document.getElementById('verify-btn');
        if (ansInput && verBtn) {
            ansInput.type = 'text';
            ansInput.disabled = false;
            verBtn.disabled = false;
            ansInput.value = actionString;
            verBtn.click();
        }
    },

    createSystemModal: function() {
        const modalHtml = `
            <div id="sys-modal" class="modal" style="display: none; position: absolute; z-index: 2000; align-items: center; justify-content: center;">
                <div class="modal-content" style="background: #0f172a; border: 1px solid #334155; color: white; padding: 30px; text-align: center; max-width: 400px; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
                    <h3 id="sys-modal-title" style="color: #a855f7; font-size: 24px; margin-bottom: 15px;"></h3>
                    <p id="sys-modal-text" style="color: #cbd5e1; font-size: 16px; margin-bottom: 25px;"></p>
                    <button onclick="PiramideGame.sendAction('CLEAR_MODAL')" style="background: #9333ea; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; width: 100%;">Continuar</button>
                </div>
            </div>
        `;
        document.getElementById('react-pyramid-container').insertAdjacentHTML('beforeend', modalHtml);
    },

    rollDiceAnimation: function(diceIcon, diceValueBox, callback) {
        PiramideGame.isRolling = true; 
        diceIcon.style.display = 'none';
        diceValueBox.style.display = 'flex';
        
        let rolls = 0;
        const interval = setInterval(() => {
            const randomVal = Math.floor(Math.random() * 6) + 1;
            diceValueBox.textContent = randomVal;
            diceValueBox.className = `hub-dice-box val-${randomVal} rolling`;
            
            rolls++;
            if (rolls >= 15) {
                clearInterval(interval);
                diceValueBox.classList.remove('rolling');
                PiramideGame.isRolling = false;
                callback(); 
            }
        }, 50);
    },

    showResult: function(data) { }
};