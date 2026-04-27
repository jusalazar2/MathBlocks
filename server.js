const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const games = {};

// NUEVO: Base de datos Mundial (Más de 100 países)
const countries = [
    // --- AMÉRICA ---
    { name: "Antigua y Barbuda", code: "ag" }, { name: "Argentina", code: "ar" },
    { name: "Bahamas", code: "bs" }, { name: "Barbados", code: "bb" },
    { name: "Belice", code: "bz" }, { name: "Bolivia", code: "bo" },
    { name: "Brasil", code: "br" }, { name: "Canada", code: "ca" },
    { name: "Chile", code: "cl" }, { name: "Colombia", code: "co" },
    { name: "Costa Rica", code: "cr" }, { name: "Cuba", code: "cu" },
    { name: "Ecuador", code: "ec" }, { name: "El Salvador", code: "sv" },
    { name: "Estados Unidos", code: "us" }, { name: "Guatemala", code: "gt" },
    { name: "Guyana", code: "gy" }, { name: "Haiti", code: "ht" },
    { name: "Honduras", code: "hn" }, { name: "Jamaica", code: "jm" },
    { name: "Mexico", code: "mx" }, { name: "Nicaragua", code: "ni" },
    { name: "Panama", code: "pa" }, { name: "Paraguay", code: "py" },
    { name: "Peru", code: "pe" }, { name: "Puerto Rico", code: "pr" },
    { name: "Republica Dominicana", code: "do" }, { name: "Uruguay", code: "uy" },
    { name: "Venezuela", code: "ve" },

    // --- EUROPA ---
    { name: "Albania", code: "al" }, { name: "Alemania", code: "de" },
    { name: "Andorra", code: "ad" }, { name: "Austria", code: "at" },
    { name: "Belgica", code: "be" }, { name: "Bielorrusia", code: "by" },
    { name: "Bosnia", code: "ba" }, { name: "Bulgaria", code: "bg" },
    { name: "Croacia", code: "hr" }, { name: "Dinamarca", code: "dk" },
    { name: "Eslovaquia", code: "sk" }, { name: "Eslovenia", code: "si" },
    { name: "España", code: "es" }, { name: "Estonia", code: "ee" },
    { name: "Finlandia", code: "fi" }, { name: "Francia", code: "fr" },
    { name: "Grecia", code: "gr" }, { name: "Holanda", code: "nl" },
    { name: "Hungria", code: "hu" }, { name: "Irlanda", code: "ie" },
    { name: "Islandia", code: "is" }, { name: "Italia", code: "it" },
    { name: "Letonia", code: "lv" }, { name: "Liechtenstein", code: "li" },
    { name: "Lituania", code: "lt" }, { name: "Luxemburgo", code: "lu" },
    { name: "Malta", code: "mt" }, { name: "Moldavia", code: "md" },
    { name: "Monaco", code: "mc" }, { name: "Montenegro", code: "me" },
    { name: "Noruega", code: "no" }, { name: "Polonia", code: "pl" },
    { name: "Portugal", code: "pt" }, { name: "Reino Unido", code: "gb" },
    { name: "Republica Checa", code: "cz" }, { name: "Rumania", code: "ro" },
    { name: "Rusia", code: "ru" }, { name: "San Marino", code: "sm" },
    { name: "Serbia", code: "rs" }, { name: "Suecia", code: "se" },
    { name: "Suiza", code: "ch" }, { name: "Ucrania", code: "ua" },
    { name: "Vaticano", code: "va" },

    // --- ASIA ---
    { name: "Afganistan", code: "af" }, { name: "Arabia Saudita", code: "sa" },
    { name: "Armenia", code: "am" }, { name: "Catar", code: "qa" },
    { name: "China", code: "cn" }, { name: "Corea del Norte", code: "kp" },
    { name: "Corea del Sur", code: "kr" }, { name: "Emiratos Arabes", code: "ae" },
    { name: "Filipinas", code: "ph" }, { name: "India", code: "in" },
    { name: "Indonesia", code: "id" }, { name: "Irak", code: "iq" },
    { name: "Iran", code: "ir" }, { name: "Israel", code: "il" },
    { name: "Japon", code: "jp" }, { name: "Jordania", code: "jo" },
    { name: "Libano", code: "lb" }, { name: "Malasia", code: "my" },
    { name: "Mongolia", code: "mn" }, { name: "Nepal", code: "np" },
    { name: "Pakistan", code: "pk" }, { name: "Singapur", code: "sg" },
    { name: "Siria", code: "sy" }, { name: "Tailandia", code: "th" },
    { name: "Taiwan", code: "tw" }, { name: "Turquia", code: "tr" },
    { name: "Vietnam", code: "vn" },

    // --- ÁFRICA ---
    { name: "Angola", code: "ao" }, { name: "Argelia", code: "dz" },
    { name: "Camerun", code: "cm" }, { name: "Costa de Marfil", code: "ci" },
    { name: "Egipto", code: "eg" }, { name: "Etiopia", code: "et" },
    { name: "Ghana", code: "gh" }, { name: "Kenia", code: "ke" },
    { name: "Marruecos", code: "ma" }, { name: "Madagascar", code: "mg" },
    { name: "Nigeria", code: "ng" }, { name: "Senegal", code: "sn" },
    { name: "Sudafrica", code: "za" }, { name: "Tanzania", code: "tz" },
    { name: "Uganda", code: "ug" }, { name: "Zimbabwe", code: "zw" },

    // --- OCEANÍA ---
    { name: "Australia", code: "au" }, { name: "Fiyi", code: "fj" },
    { name: "Nueva Zelanda", code: "nz" }, { name: "Papua Nueva Guinea", code: "pg" },
    { name: "Samoa", code: "ws" }, { name: "Tonga", code: "to" }
];



function generateRoomCode() { return Math.random().toString(36).substring(2, 10).toUpperCase(); }
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Función inteligente para normalizar texto (quita tildes y mayúsculas)
function normalizeText(text) {
    if (typeof text !== 'string') return text;
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function generateProblem(roomCode, operation) {
    const game = games[roomCode];
    if (!game) return;

    game.currentOperation = operation;

    if (operation === 'banderas') {
        // Lógica de Banderas
        const randomCountry = countries[getRandomInt(0, countries.length - 1)];
        game.currentProblem = { 
            type: 'banderas',
            flagUrl: `https://flagcdn.com/w320/${randomCountry.code}.png`, 
            answer: randomCountry.name 
        };
    } else {
        // Lógica Matemática
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
        game.currentProblem = { type: 'math', num1, num2, answer };
    }
    return game;
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

io.on('connection', (socket) => {
    // LOG: Alguien abre la página
    console.log(`🟢 Nuevo dispositivo conectado: ${socket.id}`);

    socket.on('createGame', (data) => {
        const roomCode = generateRoomCode();
        games[roomCode] = {
            hostSocketId: socket.id,
            players: data.players.map(p => ({ 
                name: p.name, connected: false, socketId: null,
                stats: { suma: {bien:0, mal:0}, resta: {bien:0, mal:0}, multiplicacion: {bien:0, mal:0}, division: {bien:0, mal:0}, banderas: {bien:0, mal:0} }
            })),
            maxSuma: data.maxSuma, maxResta: data.maxResta,
            currentPlayerIndex: 0, currentOperation: 'suma', currentProblem: {}
        };
        socket.join(roomCode); socket.roomId = roomCode;
        generateProblem(roomCode, 'suma');
        
        // LOG: Se crea una sala
        console.log(`🏠 SALA CREADA: [${roomCode}] - Host: ${socket.id}`);
        
        socket.emit('roomFound', { roomCode, gameData: games[roomCode], isHost: true });
    });

    socket.on('joinGame', (roomCode) => {
        roomCode = roomCode.toUpperCase();
        if (games[roomCode]) {
            socket.join(roomCode); socket.roomId = roomCode;
            // LOG: Alguien encuentra una sala
            console.log(`🚪 INGRESO: Dispositivo ${socket.id} entró a la sala [${roomCode}]`);
            socket.emit('roomFound', { roomCode, gameData: games[roomCode], isHost: false });
        } else { 
            // LOG: Alguien pone mal el código
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
                // LOG: Alguien escoge su nombre
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
            // LOG: El host agrega a alguien
            console.log(`➕ NUEVO JUGADOR: El host agregó a '${newPlayerName}' a la sala [${roomCode}]`);
            io.to(roomCode).emit('syncState', { roomCode, gameData: game });
        }
    });

    socket.on('changeOperation', (operation) => {
        const roomCode = socket.roomId;
        if (roomCode && games[roomCode]) {
            // LOG: Cambian de matemática a banderas, etc.
            console.log(`🔄 CAMBIO: Sala [${roomCode}] cambió a modo '${operation}'`);
            generateProblem(roomCode, operation);
            io.to(roomCode).emit('newProblem', games[roomCode]);
        }
    });

    socket.on('checkAnswer', (userAnswer) => {
        const roomCode = socket.roomId;
        if (!roomCode || !games[roomCode]) return;

        const game = games[roomCode];
        let isCorrect = false;

        if (game.currentOperation === 'banderas') {
            isCorrect = (normalizeText(userAnswer) === normalizeText(game.currentProblem.answer));
        } else {
            isCorrect = (parseInt(userAnswer) === game.currentProblem.answer);
        }
        
        // LOG: Registro de quién responde y si acertó
        const playerInTurn = game.players[game.currentPlayerIndex].name;
        console.log(`📝 RESPUESTA: '${playerInTurn}' en sala [${roomCode}] respondió '${userAnswer}'. ¿Correcto?: ${isCorrect}`);
        
        if (isCorrect && game.players.length > 0) {
            game.players[game.currentPlayerIndex].stats[game.currentOperation].bien++;
            io.to(roomCode).emit('answerResult', { isCorrect: true, correctAnswer: game.currentProblem.answer, operation: game.currentOperation, players: game.players });
            
            setTimeout(() => {
                if(games[roomCode]) { 
                    advanceTurn(roomCode);
                    generateProblem(roomCode, game.currentOperation);
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
        // LOG: Registro de cuando se rinden
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
                generateProblem(roomCode, game.currentOperation);
                io.to(roomCode).emit('newProblem', game);
            }
        }, 3000); 
    });

    socket.on('disconnect', () => {
        const roomCode = socket.roomId;
        const game = games[roomCode];
        
        // LOG: Desconexión general
        console.log(`🔴 Dispositivo desconectado: ${socket.id}`);
        
        if (game) {
            // NUEVO: ¿El que se desconectó fue el creador de la sala (Host)?
            if (game.hostSocketId === socket.id) {
                console.log(`💥 EL HOST SE DESCONECTÓ: Destruyendo la sala [${roomCode}] y expulsando a todos.`);
                
                // Avisamos a todos los celulares/tablets en esa sala
                io.to(roomCode).emit('roomClosed', 'El creador de la sala se ha desconectado. La partida ha terminado.');
                
                // Borramos la sala de la memoria del servidor para evitar "Salas Zombies"
                delete games[roomCode];
                return; // Terminamos la ejecución aquí
            }

            // Si NO era el host, seguimos con la lógica normal:
            const player = game.players.find(p => p.socketId === socket.id);
            if (player) {
                player.connected = false; player.socketId = null;
                console.log(`   └─ Jugador caído: '${player.name}' se desconectó de la sala [${roomCode}]`);
                
                // Si era su turno, lo saltamos
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