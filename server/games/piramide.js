function getRandomInt(min, max) { 
    return Math.floor(Math.random() * (max - min + 1)) + min; 
}

function generatePlayerCircles() {
    const circles = [];
    const TOTAL_CIRCLES = 15; 
    for (let i = 0; i < TOTAL_CIRCLES; i++) {
        circles.push({ id: i, val: getRandomInt(1, 6), active: true });
    }
    return circles;
}

const MODES = {
    NORMAL: 'NORMAL',
    REWARD_OFF_OWN: 'REWARD_OFF_OWN',
    REWARD_OFF_OPP: 'REWARD_OFF_OPP',
    PUNISH_ON_OWN: 'PUNISH_ON_OWN',
    RULE_1_ADD: 'RULE_1_ADD',
    RULE_6_ROLL: 'RULE_6_ROLL',
    RULE_6_SUBTRACT: 'RULE_6_SUBTRACT',
    RULE_6_ADD: 'RULE_6_ADD'
};

function triggerRewardPunishment(game) {
    const r = Math.random();
    if (r < 0.25) {
        game.pyramidState.mode = MODES.REWARD_OFF_OWN;
        game.pyramidState.modalMsg = { title: '🎁 Premio', text: 'Apaga otro círculo tuyo.' };
    } else if (r < 0.5) {
        game.pyramidState.mode = MODES.REWARD_OFF_OPP;
        game.pyramidState.modalMsg = { title: '🎁 Premio', text: 'Apaga un círculo de un compañero.' };
    } else if (r < 0.75) {
        game.pyramidState.mode = MODES.PUNISH_ON_OWN;
        game.pyramidState.modalMsg = { title: '💀 Castigo', text: 'Enciende un círculo apagado con valor 6.' };
    } else {
        const currentPlayerName = game.players[game.currentPlayerIndex].name;
        const pState = game.pyramidState.players[currentPlayerName];
        
        let hasTwos = false;
        pState.circles.forEach(c => {
            if (c.active && c.val === 2) {
                c.val = 3;
                hasTwos = true;
            }
        });
        
        if (hasTwos) {
            game.pyramidState.modalMsg = { title: '💀 Castigo', text: 'Suma +1 a todos tus números 2 activos.' };
        } else {
            game.pyramidState.modalMsg = { title: '💀 Castigo', text: 'Debías sumar +1 a tus números 2, pero no tienes ninguno activo. ¡Te salvaste!' };
        }
        return true; 
    }
    return false; 
}

function triggerAll6sPenalty(game, playerName, reason) {
    game.pyramidState.players[playerName].missedTurns++;
    game.pyramidState.modalMsg = { title: '¡Límite Alcanzado (6)!', text: `No pudiste sumar puntos porque llegaron a su límite. ${reason} ¡Pierdes tu próximo turno!` };
}

// 🌟 NUEVO: Función para comprobar si alguien ganó
function checkForWinner(game) {
    const playersNames = Object.keys(game.pyramidState.players);
    for (let name of playersNames) {
        const pState = game.pyramidState.players[name];
        // Comprobar si no hay círculos activos
        const hasActive = pState.circles.some(c => c.active);
        if (!hasActive) {
            return name; // Este jugador ganó
        }
    }
    return null;
}

module.exports = {
    generateProblem: function(game) {
        if (!game.pyramidState) {
            game.pyramidState = { 
                turnCounter: 1, 
                diceValue: 0, 
                players: {},
                mode: MODES.NORMAL,
                interactionData: {},
                modalMsg: null
            }; 
        } else {
            if (game.pyramidState.diceValue !== 0) {
                game.pyramidState.turnCounter++;
            }
            game.pyramidState.mode = MODES.NORMAL;
            game.pyramidState.interactionData = {};
            game.pyramidState.modalMsg = null;
        }
        
        game.players.forEach(p => {
            if (!game.pyramidState.players[p.name]) {
                game.pyramidState.players[p.name] = {
                    missedTurns: 0, score: 0, circles: generatePlayerCircles()
                };
            }
        });

        Object.keys(game.pyramidState.players).forEach(playerName => {
            const pState = game.pyramidState.players[playerName];
            pState.score = pState.circles.filter(c => c.active).reduce((sum, c) => sum + c.val, 0);
        });

        game.pyramidState.diceValue = 0; 

        return { type: 'piramide', pyramidState: game.pyramidState, answer: "VALID" };
    },

    checkAnswer: function(userAnswer, correctAnswer, game, playerName) {
        const state = game.pyramidState;
        const pState = state.players[playerName];
        state.modalMsg = null; 

        if (userAnswer === "ROLL") {
            state.diceValue = getRandomInt(1, 6);
            return 'ROLL'; 
        }
        if (userAnswer === "SKIP") return true; 
        if (userAnswer === "CLEAR_MODAL") return 'ROLL';

        if (state.mode === MODES.RULE_6_ROLL && userAnswer === "ROLL_6") {
             const finalVal = getRandomInt(1, 6);
             state.diceValue = finalVal;
             
             if (finalVal > 3) {
                 state.mode = MODES.RULE_6_SUBTRACT;
                 state.interactionData = { remaining: game.players.map(p => p.name) };
                 state.modalMsg = { title: 'Resultado > 3', text: `Sacaste un ${finalVal}. Réstale -1 a un círculo de TODOS los jugadores.` };
             } else {
                 const canAddOwn = pState.circles.some(c => c.active && c.val < 6);
                 const canAddOpp = game.players.some(p => p.name !== playerName && state.players[p.name].circles.some(c => c.active && c.val < 6));
                 
                 if (!canAddOwn || !canAddOpp) {
                     triggerAll6sPenalty(game, playerName, "Falta de círculos menores a 6.");
                     return true; 
                 } else {
                     state.mode = MODES.RULE_6_ADD;
                     state.interactionData = { ownLeft: 2, oppLeft: 1 };
                     state.modalMsg = { title: 'Resultado < 4', text: `Sacaste un ${finalVal}. Súmale +1 a DOS círculos tuyos y a UN círculo rival.` };
                 }
             }
             return 'ROLL';
        }

        // Variable para controlar si el turno debe terminar
        let shouldAdvanceTurn = false;
        let requiresUpdateOnly = false;

        if (userAnswer.startsWith("CIRCLE_")) {
            const parts = userAnswer.split("_");
            const targetPlayerName = parts[1];
            const circleId = parseInt(parts[2]);
            const targetPState = state.players[targetPlayerName];
            const circle = targetPState.circles[circleId];
            const isCurrentPlayer = (targetPlayerName === playerName);

            if (state.mode === MODES.NORMAL) {
                if (!isCurrentPlayer || !circle.active || circle.val !== state.diceValue) return false;
                circle.active = false; 
                
                if (circle.val === 1) {
                    const nextPlayerIdx = (game.currentPlayerIndex + 1) % game.players.length;
                    const nextPlayerName = game.players[nextPlayerIdx].name;
                    const nextPState = state.players[nextPlayerName];
                    const canAdd = nextPState.circles.some(c => c.active && c.val < 6);
                    
                    if (!canAdd) {
                        triggerAll6sPenalty(game, playerName, "El siguiente jugador ya tiene todos en 6.");
                        shouldAdvanceTurn = true; 
                    } else {
                        state.mode = MODES.RULE_1_ADD;
                        state.modalMsg = { title: 'Regla del 1', text: `Súmale +1 a un círculo (menor a 6) de ${nextPlayerName}.` };
                        requiresUpdateOnly = true;
                    }
                } else if (circle.val === 6) {
                    state.mode = MODES.RULE_6_ROLL;
                    state.modalMsg = { title: 'Regla del 6', text: '¡Tira el dado de nuevo para determinar tu destino!' };
                    requiresUpdateOnly = true;
                } else {
                    const shouldEndTurn = triggerRewardPunishment(game);
                    if (shouldEndTurn) {
                        shouldAdvanceTurn = true;
                    } else {
                        requiresUpdateOnly = true;
                    }
                }
            }
            else if (state.mode === MODES.RULE_1_ADD) {
                const nextPlayerName = game.players[(game.currentPlayerIndex + 1) % game.players.length].name;
                if (targetPlayerName !== nextPlayerName || !circle.active || circle.val >= 6) return false;
                circle.val++;
                shouldAdvanceTurn = true; 
            }
            else if (state.mode === MODES.REWARD_OFF_OWN) {
                if (!isCurrentPlayer || !circle.active) return false;
                circle.active = false;
                shouldAdvanceTurn = true; 
            }
            else if (state.mode === MODES.REWARD_OFF_OPP) {
                if (isCurrentPlayer || !circle.active) return false;
                circle.active = false;
                shouldAdvanceTurn = true; 
            }
            else if (state.mode === MODES.PUNISH_ON_OWN) {
                if (!isCurrentPlayer || circle.active) return false;
                circle.active = true;
                circle.val = 6;
                shouldAdvanceTurn = true; 
            }
            else if (state.mode === MODES.RULE_6_SUBTRACT) {
                if (!state.interactionData.remaining.includes(targetPlayerName) || !circle.active) return false;
                circle.val--;
                if (circle.val < 1) { circle.active = false; circle.val = 1; } 

                state.interactionData.remaining = state.interactionData.remaining.filter(name => name !== targetPlayerName);
                if (state.interactionData.remaining.length === 0) {
                    shouldAdvanceTurn = true;
                } else {
                    requiresUpdateOnly = true;
                }
            }
            else if (state.mode === MODES.RULE_6_ADD) {
                if (!circle.active || circle.val >= 6) return false; 
                
                if (isCurrentPlayer && state.interactionData.ownLeft > 0) {
                    circle.val++;
                    state.interactionData.ownLeft--;
                } else if (!isCurrentPlayer && state.interactionData.oppLeft > 0) {
                    circle.val++;
                    state.interactionData.oppLeft--;
                } else {
                    return false; 
                }

                if (state.interactionData.ownLeft === 0 && state.interactionData.oppLeft === 0) {
                    shouldAdvanceTurn = true;
                } else {
                    requiresUpdateOnly = true;
                }
            }
        }

        // 🌟 ACTUALIZAR PUNTAJES ANTES DE COMPROBAR GANADOR
        Object.keys(game.pyramidState.players).forEach(name => {
            const tempState = game.pyramidState.players[name];
            tempState.score = tempState.circles.filter(c => c.active).reduce((sum, c) => sum + c.val, 0);
        });

        // 🌟 COMPROBAR SI ALGUIEN GANÓ
        const winner = checkForWinner(game);
        if (winner) {
            // Si hay un ganador, devolvemos un código especial que server.js interceptará
            return `GAME_OVER_${winner}`;
        }

        if (shouldAdvanceTurn) return true;
        if (requiresUpdateOnly) return 'ROLL';
        
        return false;
    }
};