const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// 🚀 IMPORTAMOS TUS NUEVOS MÓDULOS INTELIGENTES
const mathGame = require('./server/games/matematicas');
const flagsGame = require('./server/games/banderas');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const games = {};

function generateRoomCode() { 
    return Math.random().toString(36).substring(2, 10).toUpperCase(); 
}

function advanceTurn(roomCode) {
    const game = games[roomCode];
    if (!game) return;
    let attempts = 0;
    do {
        game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
        attempts++;
    } while (!game.players[game.currentPlayerIndex].connected && attempts < game.players.length);
}

// --- 🧠 FUNCIÓN ORQUESTADORA DE PROBLEMAS ---
// Decide a qué módulo pedirle la información
function updateProblem(roomCode, operation) {
    const game = games[roomCode];
    if (!game) return;
    
    game.currentOperation = operation;

    if (operation === 'banderas') {
        game.currentProblem = flagsGame.generateProblem(game);
    } else {
        game.currentProblem = mathGame.generateProblem(game, operation);
    }
}

// --- MANEJO DE CONEXIONES ---
io.on('connection', (socket) => {
    console.log(`🟢 Nuevo dispositivo conectado: ${socket.id}`);

    socket.on('createGame', (data) => {
        const roomCode = generateRoomCode();
        games[roomCode] = {
            hostSocketId: socket.id,
            players: data.players.map(p => ({ 
                name: p.name, connected: false, socketId: null,
                stats: { suma: {bien:0, mal:0}, resta: {bien:0, mal:0}, multiplicacion: {bien:0, mal:0}, division: {bien:0, mal:0}, banderas: {bien:0, mal:0} }
            })),
            maxSuma: data.maxSuma, 
            maxResta: data.maxResta,
            tablesMultiplicacion: [1,2,3,4,5,6,7,8,9,10], // NUEVO
            tablesDivision: [1,2,3,4,5,6,7,8,9,10],       // NUEVO
            continents: ['América', 'Europa', 'Asia', 'África', 'Oceanía'], // NUEVO
            currentPlayerIndex: 0, currentOperation: 'suma', currentProblem: {}
        };
        socket.join(roomCode); socket.roomId = roomCode;
        
        // DELEGAMOS LA CREACIÓN DEL PRIMER PROBLEMA
        updateProblem(roomCode, 'suma');
        
        console.log(`🏠 SALA CREADA: [${roomCode}] - Host: ${socket.id}`);
        socket.emit('roomFound', { roomCode, gameData: games[roomCode], isHost: true });
    });

    socket.on('joinGame', (roomCode) => {
        roomCode = roomCode.toUpperCase();
        if (games[roomCode]) {
            socket.join(roomCode); socket.roomId = roomCode;
            console.log(`🚪 INGRESO: Dispositivo ${socket.id} entró a la sala [${roomCode}]`);
            socket.emit('roomFound', { roomCode, gameData: games[roomCode], isHost: false });
        } else { 
            console.log(`⚠️ ERROR: Dispositivo ${socket.id} intentó entrar a sala inexistente [${roomCode}]`);
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
                console.log(`👤 IDENTIDAD: '${playerName}' está listo para jugar en la sala [${roomCode}]`);
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
                stats: { suma: {bien:0, mal:0}, resta: {bien:0, mal:0}, multiplicacion: {bien:0, mal:0}, division: {bien:0, mal:0}, banderas: {bien:0, mal:0} }
            });
            console.log(`➕ NUEVO JUGADOR: El host agregó a '${newPlayerName}' a la sala [${roomCode}]`);
            io.to(roomCode).emit('syncState', { roomCode, gameData: game });
        }
    });

    socket.on('changeOperation', (operation) => {
        const roomCode = socket.roomId;
        if (roomCode && games[roomCode]) {
            console.log(`🔄 CAMBIO: Sala [${roomCode}] cambió a modo '${operation}'`);
            
            updateProblem(roomCode, operation); 
            
            io.to(roomCode).emit('newProblem', games[roomCode]);
        }
    });

    socket.on('checkAnswer', (userAnswer) => {
        const roomCode = socket.roomId;
        if (!roomCode || !games[roomCode]) return;

        const game = games[roomCode];
        let isCorrect = false;

        // 🧠 DELEGAMOS LA VERIFICACIÓN AL MÓDULO CORRESPONDIENTE
        if (game.currentOperation === 'banderas') {
            isCorrect = flagsGame.checkAnswer(userAnswer, game.currentProblem.answer);
        } else {
            isCorrect = mathGame.checkAnswer(userAnswer, game.currentProblem.answer);
        }
        
        const playerInTurn = game.players[game.currentPlayerIndex].name;
        console.log(`📝 RESPUESTA: '${playerInTurn}' en sala [${roomCode}] respondió '${userAnswer}'. ¿Correcto?: ${isCorrect}`);
        
        if (isCorrect && game.players.length > 0) {
            game.players[game.currentPlayerIndex].stats[game.currentOperation].bien++;
            io.to(roomCode).emit('answerResult', { isCorrect: true, correctAnswer: game.currentProblem.answer, operation: game.currentOperation, players: game.players });
            
            setTimeout(() => {
                if(games[roomCode]) { 
                    advanceTurn(roomCode);
                    updateProblem(roomCode, game.currentOperation);
                    io.to(roomCode).emit('newProblem', game);
                }
            }, 2500);

        } else if (!isCorrect && game.players.length > 0) {
            game.players[game.currentPlayerIndex].stats[game.currentOperation].mal++;
            io.to(roomCode).emit('answerResult', { isCorrect: false, players: game.players });
        }
    });

    socket.on('idkAnswer', () => {
        const roomCode = socket.roomId;
        if (!roomCode || !games[roomCode]) return;

        const game = games[roomCode];
        const playerInTurn = game.players[game.currentPlayerIndex].name;
        console.log(`🤔 NO LO SÉ: '${playerInTurn}' se rindió en la sala [${roomCode}]`);

        io.to(roomCode).emit('answerResult', { 
            isCorrect: 'skipped', 
            correctAnswer: game.currentProblem.answer, 
            operation: game.currentOperation,
            players: game.players 
        });
        
        setTimeout(() => {
            if(games[roomCode]) { 
                advanceTurn(roomCode);
                updateProblem(roomCode, game.currentOperation);
                io.to(roomCode).emit('newProblem', game);
            }
        }, 3000); 
    });

    socket.on('endGame', (roomCode) => {
        const game = games[roomCode];
        if (game && game.hostSocketId === socket.id) {
            console.log(`🏁 FIN DEL JUEGO: El host terminó la partida en la sala [${roomCode}]`);
            io.to(roomCode).emit('gameEnded', { players: game.players });
            delete games[roomCode]; 
        }
    });

    socket.on('disconnect', () => {
        for (const roomCode in games) {
            const game = games[roomCode];
            
            if (game.hostSocketId === socket.id) {
                console.log(`💥 HOST DESCONECTADO: Mostrando podio y destruyendo sala [${roomCode}]`);
                io.to(roomCode).emit('gameEnded', { players: game.players }); 
                delete games[roomCode]; 
                break; 
            }

            const player = game.players.find(p => p.socketId === socket.id);
            if (player) {
                player.connected = false;
                player.socketId = null;
                console.log(` └─ Jugador caído: '${player.name}' se desconectó de la sala [${roomCode}]`);
                
                if (game.players[game.currentPlayerIndex] === player) {
                    advanceTurn(roomCode); 
                    updateProblem(roomCode, game.currentOperation); 
                    io.to(roomCode).emit('newProblem', game);
                }
                
                io.to(roomCode).emit('syncState', { roomCode, gameData: game });
            }
        }
    });

    socket.on('updateConfig', (data) => {
        const roomCode = socket.roomId;
        if (roomCode && games[roomCode]) {
            const game = games[roomCode];
            
            // Verificamos que sea el Host quien intenta cambiar las reglas
            if (game.hostSocketId === socket.id) {
                if (data.operation === 'suma') game.maxSuma = data.limit;
                if (data.operation === 'resta') game.maxResta = data.limit;                
                if (data.operation === 'multiplicacion') game.tablesMultiplicacion = data.tables;
                if (data.operation === 'division') game.tablesDivision = data.tables;          
                if (data.operation === 'banderas') game.continents = data.continents; 
                
                console.log(`⚙️ CONFIG: El host cambió el límite de '${data.operation}' a ${data.limit} en la sala [${roomCode}]`);
                
                // Si justo están jugando la operación que se modificó, 
                // generamos un problema nuevo inmediatamente para aplicar la dificultad
                if (game.currentOperation === data.operation) {
                    updateProblem(roomCode, game.currentOperation);
                    io.to(roomCode).emit('newProblem', game);
                } else {
                    io.to(roomCode).emit('syncState', { roomCode, gameData: game });
                }
            }
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => { 
    console.log(`🚀 Servidor orquestador corriendo en http://localhost:${PORT}`); 
});