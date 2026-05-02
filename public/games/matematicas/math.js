// /public/games/matematicas/math.js

window.MathGame = {
    // 1. Función para pintar el problema cuando llega del servidor
    update: function(gameData) {
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
    },

    // 2. Función para mostrar la respuesta correcta al final
    showResult: function(data) {
        document.getElementById('result-num').textContent = data.correctAnswer;
        document.getElementById('img-result').src = `assets/numberblock_${data.correctAnswer}.png`;
        document.getElementById('img-result').style.display = 'block'; 
        document.getElementById('equals-block').style.display = 'flex'; 
        document.getElementById('result-block').style.display = 'flex';
        
        if (data.isCorrect === 'skipped') {
            document.getElementById('result-block').classList.add('pop-in-animation');
        }
    }
};