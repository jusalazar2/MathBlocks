const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// OBJETO GLOBAL QUE GUARDA TODAS LAS PARTIDAS
// Formato: { 'A1B2C3D4': { players: [], maxSuma: 10, currentProblem: {}... } }
const games = {};

// Función para generar código de 8 dígitos/letras
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Genera un problema, pero ahora Específico para una Sala (roomCode)
function generateProblem(roomCode, operation) {
    const game = games[roomCode];
    if (!game) return;

    game.currentOperation = operation;
    let num1, num2, answer;

    if (operation === 'suma') {
        answer = getRandomInt(0, game.maxSuma); 
        num1 = getRandomInt(0, answer);
        num2 = answer - num1;
    } else if (operation === 'resta') {
        num1 = getRandomInt(0, game.maxResta);
        num2 = getRandomInt(0, num1); 
        answer = num1 - num2;
    } else if (operation === 'multiplicacion') {
        num1 = getRandomInt(1, 10); num2 = getRandomInt(1, 10);
        answer = num1 * num2;
    } else if (operation === 'division') {
        num2 = getRandomInt(1, 10); answer = getRandomInt(1, 10); 
        num1 = num2 * answer; 
    }

    game.currentProblem = { num1, num2, answer };
    return game;
}

// --- CONEXIONES SOCKET.IO ---
io.on('connection', (socket) => {
    console.log('🟢 Dispositivo conectado:', socket.id);

    // 1. CREAR UN NUEVO JUEGO
    socket.on('createGame', (data) => {
        const roomCode = generateRoomCode();
        
        // Creamos la "caja" de datos para esta nueva sala
        games[roomCode] = {
            players: data.players,
            maxSuma: data.maxSuma,
            maxResta: data.maxResta,
            currentPlayerIndex: 0,
            currentOperation: 'suma',
            currentProblem: { num1: 0, num2: 0, answer: 0 }
        };

        // Metemos a este jugador en la sala de Socket.io
        socket.join(roomCode);
        socket.roomId = roomCode; // Guardamos dónde está metido este dispositivo

        generateProblem(roomCode, 'suma');
        
        // Le avisamos a la sala que ya pueden jugar y les mandamos el código
        io.to(roomCode).emit('syncState', { roomCode, gameData: games[roomCode] });
    });

    // 2. UNIRSE A UN JUEGO EXISTENTE
    socket.on('joinGame', (roomCode) => {
        roomCode = roomCode.toUpperCase();
        if (games[roomCode]) {
            socket.join(roomCode);
            socket.roomId = roomCode;
            // Le mandamos los datos de cómo va el juego
            socket.emit('syncState', { roomCode, gameData: games[roomCode] });
        } else {
            socket.emit('errorMsg', 'Código no encontrado. Revisa e intenta de nuevo.');
        }
    });

    // 3. CAMBIAR OPERACIÓN
    socket.on('changeOperation', (operation) => {
        const roomCode = socket.roomId;
        if (roomCode && games[roomCode]) {
            generateProblem(roomCode, operation);
            io.to(roomCode).emit('newProblem', games[roomCode]);
        }
    });

    // 4. VERIFICAR RESPUESTA
    socket.on('checkAnswer', (userAnswer) => {
        const roomCode = socket.roomId;
        if (!roomCode || !games[roomCode]) return;

        const game = games[roomCode];
        const isCorrect = (userAnswer === game.currentProblem.answer);
        
        if (isCorrect && game.players.length > 0) {
            game.players[game.currentPlayerIndex].stats[game.currentOperation].bien++;
            
            // Avisar acierto a todos en la sala
            io.to(roomCode).emit('answerResult', { 
                isCorrect: true, 
                correctAnswer: game.currentProblem.answer, 
                players: game.players 
            });
            
            setTimeout(() => {
                if(games[roomCode]) { // Por si cerraron la sala en esos 2 seg
                    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
                    generateProblem(roomCode, game.currentOperation);
                    io.to(roomCode).emit('newProblem', game);
                }
            }, 2500);

        } else if (!isCorrect && game.players.length > 0) {
            game.players[game.currentPlayerIndex].stats[game.currentOperation].mal++;
            // Avisar error
            io.to(roomCode).emit('answerResult', { isCorrect: false, players: game.players });
        }
    });

    // Cuando se desconectan (podrías limpiar salas vacías aquí en el futuro)
    socket.on('disconnect', () => {
        console.log('🔴 Dispositivo desconectado:', socket.id);
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor central corriendo en http://localhost:${PORT}`);
});