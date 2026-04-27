const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const games = {};

function generateRoomCode() { return Math.random().toString(36).substring(2, 10).toUpperCase(); }
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateProblem(roomCode, operation) {
    const game = games[roomCode];
    if (!game) return;

    game.currentOperation = operation;
    let num1, num2, answer;

    if (operation === 'suma') {
        answer = getRandomInt(0, game.maxSuma); num1 = getRandomInt(0, answer); num2 = answer - num1;
    } else if (operation === 'resta') {
        num1 = getRandomInt(0, game.maxResta); num2 = getRandomInt(0, num1); answer = num1 - num2;
    } else if (operation === 'multiplicacion') {
        num1 = getRandomInt(1, 10); num2 = getRandomInt(1, 10); answer = num1 * num2;
    } else if (operation === 'division') {
        num2 = getRandomInt(1, 10); answer = getRandomInt(1, 10); num1 = num2 * answer; 
    }
    game.currentProblem = { num1, num2, answer };
    return game;
}

// Lógica inteligente para saltar turnos de jugadores desconectados
function advanceTurn(roomCode) {
    const game = games[roomCode];
    if (!game) return;
    
    let attempts = 0;
    // Gira el turno hasta encontrar a alguien 'connected', o da la vuelta completa si no hay nadie
    do {
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        attempts++;
    } while (!game.players[game.currentPlayerIndex].connected && attempts < game.players.length);
}

io.on('connection', (socket) => {
    
    // 1. CREAR JUEGO (Host)
    socket.on('createGame', (data) => {
        const roomCode = generateRoomCode();
        
        // Creamos la partida y le inyectamos la estructura de estadísticas a cada jugador
        games[roomCode] = {
            hostSocketId: socket.id,
            players: data.players.map(p => ({ 
                name: p.name, 
                connected: false, 
                socketId: null,
                // AQUÍ ESTÁ LA SOLUCIÓN: Agregamos las estadísticas iniciales en cero
                stats: { 
                    suma: {bien: 0, mal: 0}, 
                    resta: {bien: 0, mal: 0}, 
                    multiplicacion: {bien: 0, mal: 0}, 
                    division: {bien: 0, mal: 0} 
                }
            })),
            maxSuma: data.maxSuma, 
            maxResta: data.maxResta,
            currentPlayerIndex: 0, 
            currentOperation: 'suma', 
            currentProblem: {}
        };
        
        socket.join(roomCode);
        socket.roomId = roomCode;
        generateProblem(roomCode, 'suma');
        socket.emit('roomFound', { roomCode, gameData: games[roomCode], isHost: true });
    });

    // 2. UNIRSE (Buscar Sala)
    socket.on('joinGame', (roomCode) => {
        roomCode = roomCode.toUpperCase();
        if (games[roomCode]) {
            socket.join(roomCode);
            socket.roomId = roomCode;
            socket.emit('roomFound', { roomCode, gameData: games[roomCode], isHost: false });
        } else {
            socket.emit('errorMsg', 'Código no encontrado.');
        }
    });

    // 3. SELECCIONAR IDENTIDAD (Bloquea el jugador para que nadie más lo use)
    socket.on('claimIdentity', (playerName) => {
        const roomCode = socket.roomId;
        const game = games[roomCode];
        if (game) {
            const player = game.players.find(p => p.name === playerName);
            if (player && !player.connected) {
                player.connected = true;
                player.socketId = socket.id; // Vinculamos este celular con este jugador
                io.to(roomCode).emit('syncState', { roomCode, gameData: game });
            }
        }
    });

    // 4. EL HOST AGREGA UN JUGADOR NUEVO EN MEDIO DE LA PARTIDA
    socket.on('addPlayer', (newPlayerName) => {
        const roomCode = socket.roomId;
        const game = games[roomCode];
        if (game && game.hostSocketId === socket.id) {
            game.players.push({
                name: newPlayerName, connected: false, socketId: null,
                stats: { suma: {bien:0, mal:0}, resta: {bien:0, mal:0}, multiplicacion: {bien:0, mal:0}, division: {bien:0, mal:0} }
            });
            io.to(roomCode).emit('syncState', { roomCode, gameData: game });
        }
    });

    // 5. JUGABILIDAD
    socket.on('changeOperation', (operation) => {
        const roomCode = socket.roomId;
        if (roomCode && games[roomCode]) {
            generateProblem(roomCode, operation);
            io.to(roomCode).emit('newProblem', games[roomCode]);
        }
    });

    socket.on('checkAnswer', (userAnswer) => {
        const roomCode = socket.roomId;
        if (!roomCode || !games[roomCode]) return;

        const game = games[roomCode];
        const isCorrect = (userAnswer === game.currentProblem.answer);
        
        if (isCorrect && game.players.length > 0) {
            game.players[game.currentPlayerIndex].stats[game.currentOperation].bien++;
            io.to(roomCode).emit('answerResult', { isCorrect: true, correctAnswer: game.currentProblem.answer, players: game.players });
            
            setTimeout(() => {
                if(games[roomCode]) { 
                    advanceTurn(roomCode); // Salta a los desconectados
                    generateProblem(roomCode, game.currentOperation);
                    io.to(roomCode).emit('newProblem', game);
                }
            }, 2500);

        } else if (!isCorrect && game.players.length > 0) {
            game.players[game.currentPlayerIndex].stats[game.currentOperation].mal++;
            io.to(roomCode).emit('answerResult', { isCorrect: false, players: game.players });
        }
    });

    // 6. DESCONEXIÓN (Si se cierra la pestaña o se cae el internet)
    socket.on('disconnect', () => {
        const roomCode = socket.roomId;
        const game = games[roomCode];
        if (game) {
            // Buscamos quién se desconectó
            const player = game.players.find(p => p.socketId === socket.id);
            if (player) {
                player.connected = false;
                player.socketId = null;
                console.log(`🔴 ${player.name} se ha desconectado.`);
                
                // Si era su turno, lo saltamos automáticamente
                if (game.players[game.currentPlayerIndex] === player) {
                    advanceTurn(roomCode);
                    generateProblem(roomCode, game.currentOperation);
                    io.to(roomCode).emit('newProblem', game);
                }
                
                io.to(roomCode).emit('syncState', { roomCode, gameData: game });
            }
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => { console.log(`🚀 Servidor central corriendo en http://localhost:${PORT}`); });