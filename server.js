const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const mathGame = require('./server/games/matematicas');
const flagsGame = require('./server/games/banderas');
const mapamundiGame = require('./server/games/mapamundi'); 
const piramideGame = require('./server/games/piramide');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));
const games = {};

function generateRoomCode() { return Math.random().toString(36).substring(2, 10).toUpperCase(); }

function advanceTurn(roomCode) {
    const game = games[roomCode];
    if (!game || game.players.length === 0) return;
    
    if (game.currentOperation === 'piramide' && game.pyramidState) {
        const currentPlayerName = game.players[game.currentPlayerIndex].name;
        if (game.pyramidState.players[currentPlayerName] && game.pyramidState.players[currentPlayerName].missedTurns > 0) {
            game.pyramidState.players[currentPlayerName].missedTurns--;
            game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        }
    }

    let attempts = 0;
    do {
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        attempts++;
    } while (!game.players[game.currentPlayerIndex].connected && attempts < game.players.length);
}

function ensureActiveTurn(roomCode) {
    const game = games[roomCode];
    if (!game || game.players.length === 0) return;
    
    if (!game.players[game.currentPlayerIndex].connected) {
        let found = false;
        for (let i = 0; i < game.players.length; i++) {
            if (game.players[i].connected) {
                game.currentPlayerIndex = i;
                found = true;
                break;
            }
        }
    }
}

function updateProblem(roomCode, operation) {
    const game = games[roomCode];
    if (!game) return;
    
    game.currentOperation = operation;

    if (operation === 'piramide') {
        ensureActiveTurn(roomCode);
        game.currentProblem = piramideGame.generateProblem(game); 
    } else if (operation === 'banderas') {
        game.currentProblem = flagsGame.generateProblem(game);
    } else if (operation === 'mapamundi') {
        game.currentProblem = mapamundiGame.generateProblem(game); 
    } else {
        game.currentProblem = mathGame.generateProblem(game, operation);
    }
}

io.on('connection', (socket) => {
    socket.on('createGame', (data) => {
        const roomCode = generateRoomCode();
        games[roomCode] = {
            hostSocketId: socket.id,
            players: data.players.map(p => ({ 
                name: p.name, connected: false, socketId: null,
                stats: { suma: {bien:0, mal:0}, resta: {bien:0, mal:0}, multiplicacion: {bien:0, mal:0}, division: {bien:0, mal:0}, banderas: {bien:0, mal:0}, piramide: {bien:0, mal:0} }
            })),
            maxSuma: data.maxSuma, maxResta: data.maxResta,
            tablesMultiplicacion: [1,2,3,4,5,6,7,8,9,10], tablesDivision: [1,2,3,4,5,6,7,8,9,10],       
            continents: ['América', 'Europa', 'Asia', 'África', 'Oceanía'], 
            mapMode: 'mapa', mapLang: 'es-ES', 
            currentPlayerIndex: 0, currentOperation: 'suma', currentProblem: {}, pyramidState: null
        };
        socket.join(roomCode); socket.roomId = roomCode;
        updateProblem(roomCode, 'suma');
        socket.emit('roomFound', { roomCode, gameData: games[roomCode], isHost: true });
    });

    socket.on('joinGame', (roomCode) => {
        roomCode = roomCode.toUpperCase();
        if (games[roomCode]) {
            socket.join(roomCode); socket.roomId = roomCode;
            socket.emit('roomFound', { roomCode, gameData: games[roomCode], isHost: false });
        } else { 
            socket.emit('errorMsg', 'Código no encontrado.'); 
        }
    });

    socket.on('claimIdentity', (playerName) => {
        const roomCode = socket.roomId;
        const game = games[roomCode];
        if (game) {
            const player = game.players.find(p => p.name === playerName);
            if (player && !player.connected) {
                player.connected = true; player.socketId = socket.id;
                
                const activePlayers = game.players.filter(p => p.connected);
                if (activePlayers.length === 1) {
                    game.currentPlayerIndex = game.players.indexOf(player);
                    if (game.currentOperation === 'piramide') {
                        updateProblem(roomCode, 'piramide');
                    }
                }
                io.to(roomCode).emit('syncState', { roomCode, gameData: game });
            }
        }
    });

    socket.on('addPlayer', (newPlayerName) => {
        const roomCode = socket.roomId;
        const game = games[roomCode];
        if (game && game.hostSocketId === socket.id) {
            game.players.push({
                name: newPlayerName, connected: false, socketId: null,
                stats: { suma: {bien:0, mal:0}, resta: {bien:0, mal:0}, multiplicacion: {bien:0, mal:0}, division: {bien:0, mal:0}, banderas: {bien:0, mal:0}, piramide: {bien:0, mal:0} }
            });
            if (game.currentOperation === 'piramide') {
                updateProblem(roomCode, 'piramide');
            }
            io.to(roomCode).emit('syncState', { roomCode, gameData: game });
        }
    });

    socket.on('changeOperation', (operation) => {
        const roomCode = socket.roomId;
        if (roomCode && games[roomCode]) {
            if (!games[roomCode].players[games[roomCode].currentPlayerIndex].connected) {
                advanceTurn(roomCode);
            }
            updateProblem(roomCode, operation); 
            io.to(roomCode).emit('newProblem', games[roomCode]);
        }
    });

    socket.on('checkAnswer', (userAnswer) => {
        const roomCode = socket.roomId;
        if (!roomCode || !games[roomCode]) return;
        const game = games[roomCode];
        const playerInTurnName = game.players[game.currentPlayerIndex].name;
        let isCorrect = false;

        if (game.currentOperation === 'banderas') {
            isCorrect = flagsGame.checkAnswer(userAnswer, game.currentProblem.answer);
        } else if (game.currentOperation === 'piramide') { 
            isCorrect = piramideGame.checkAnswer(userAnswer, game.currentProblem.answer, game, playerInTurnName);
            
            // 🌟 NUEVO: Manejo del Game Over de la Pirámide
            if (typeof isCorrect === 'string' && isCorrect.startsWith('GAME_OVER_')) {
                const winnerName = isCorrect.split('_')[2];
                
                // Preparar las estadísticas para que el podio funcione
                // El ganador tendrá los puntos máximos (o 0 puntaje restante), los demás se ordenan por su score actual
                game.players.forEach(p => {
                    const pState = game.pyramidState.players[p.name];
                    // Para que el podio los ordene correctamente (el que tiene más puntos en 'bien' gana),
                    // Invertimos el puntaje: si le quedan 0 puntos, tiene 100 "bien". 
                    // Si le quedan 40 puntos, tiene 100 - 40 = 60 "bien".
                    let scoreInverted = 100 - (pState ? pState.score : 100); 
                    if (p.name === winnerName) scoreInverted = 1000; // Garantizar que el ganador sea el primero
                    
                    p.stats.piramide = { bien: scoreInverted, mal: 0 }; 
                });

                io.to(roomCode).emit('gameEnded', { players: game.players });
                delete games[roomCode];
                return;
            }

            if (isCorrect === 'ROLL') {
                io.to(roomCode).emit('newProblem', game);
                return; 
            }
        } else {
            isCorrect = mathGame.checkAnswer(userAnswer, game.currentProblem.answer);
        }
        
        if (isCorrect && game.players.length > 0) {
            if (game.currentOperation !== 'mapamundi' && game.currentOperation !== 'piramide') {
                game.players[game.currentPlayerIndex].stats[game.currentOperation].bien++;
            }
            io.to(roomCode).emit('answerResult', { isCorrect: true, correctAnswer: game.currentProblem.answer, operation: game.currentOperation, players: game.players });
            
            setTimeout(() => {
                if(games[roomCode]) { 
                    advanceTurn(roomCode);
                    updateProblem(roomCode, game.currentOperation);
                    io.to(roomCode).emit('newProblem', game);
                }
            }, 1500);

        } else if (!isCorrect && game.players.length > 0) {
            if (game.currentOperation !== 'mapamundi' && game.currentOperation !== 'piramide') {
                game.players[game.currentPlayerIndex].stats[game.currentOperation].mal++;
            }
            io.to(roomCode).emit('answerResult', { isCorrect: false, players: game.players });
        }
    });

    socket.on('idkAnswer', () => {
        const roomCode = socket.roomId;
        if (!roomCode || !games[roomCode]) return;
        const game = games[roomCode];
        io.to(roomCode).emit('answerResult', { isCorrect: 'skipped', correctAnswer: game.currentProblem.answer, operation: game.currentOperation, players: game.players });
        setTimeout(() => {
            if(games[roomCode]) { 
                advanceTurn(roomCode); updateProblem(roomCode, game.currentOperation); io.to(roomCode).emit('newProblem', game);
            }
        }, 1500); 
    });

    socket.on('endGame', (roomCode) => {
        const game = games[roomCode];
        if (game && game.hostSocketId === socket.id) {
            io.to(roomCode).emit('gameEnded', { players: game.players });
            delete games[roomCode]; 
        }
    });

    socket.on('disconnect', () => {
        for (const roomCode in games) {
            const game = games[roomCode];
            if (game.hostSocketId === socket.id) {
                io.to(roomCode).emit('gameEnded', { players: game.players }); 
                delete games[roomCode]; 
                break; 
            }
            const player = game.players.find(p => p.socketId === socket.id);
            if (player) {
                player.connected = false; player.socketId = null;
                if (game.players[game.currentPlayerIndex] === player) {
                    advanceTurn(roomCode); updateProblem(roomCode, game.currentOperation); io.to(roomCode).emit('newProblem', game);
                }
                io.to(roomCode).emit('syncState', { roomCode, gameData: game });
            }
        }
    });

    socket.on('updateConfig', (data) => {
        const roomCode = socket.roomId;
        if (roomCode && games[roomCode] && games[roomCode].hostSocketId === socket.id) {
            const game = games[roomCode];
            if (data.operation === 'suma') game.maxSuma = data.limit;
            if (data.operation === 'resta') game.maxResta = data.limit;                
            if (data.operation === 'multiplicacion') game.tablesMultiplicacion = data.tables;
            if (data.operation === 'division') game.tablesDivision = data.tables;          
            if (data.operation === 'banderas') game.continents = data.continents; 
            if (data.operation === 'mapamundi') { game.mapMode = data.mapMode; game.mapLang = data.mapLang; }
            if (game.currentOperation === data.operation) {
                updateProblem(roomCode, game.currentOperation);
                io.to(roomCode).emit('newProblem', game);
            } else {
                io.to(roomCode).emit('syncState', { roomCode, gameData: game });
            }
        }
    });

    socket.on('releaseIdentity', () => {
        const roomCode = socket.roomId;
        const game = games[roomCode];
        if (game) {
            const player = game.players.find(p => p.socketId === socket.id);
            if (player) {
                player.connected = false; player.socketId = null;
                if (game.players[game.currentPlayerIndex] === player) {
                    advanceTurn(roomCode); updateProblem(roomCode, game.currentOperation); io.to(roomCode).emit('newProblem', game);
                } else {
                    io.to(roomCode).emit('syncState', { roomCode, gameData: game });
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log(`🚀 Servidor corriendo en el puerto ${PORT}`); });