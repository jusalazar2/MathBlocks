// /server/games/matematicas.js
function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

module.exports = {
    generateProblem: function(game, operation) {
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
            // Traemos las tablas activas (o todas si no existen)
            const tables = game.tablesMultiplicacion || [1,2,3,4,5,6,7,8,9,10];
            // Elegimos UNA de las tablas activas al azar
            num1 = tables[getRandomInt(0, tables.length - 1)]; 
            // El multiplicador siempre es del 1 al 10
            num2 = getRandomInt(1, 10); 
            answer = num1 * num2;
        } else if (operation === 'division') {
            // Traemos las tablas activas
            const tables = game.tablesDivision || [1,2,3,4,5,6,7,8,9,10];
            // El divisor es una de las tablas activas
            num2 = tables[getRandomInt(0, tables.length - 1)]; 
            // El resultado será del 1 al 10
            answer = getRandomInt(1, 10); 
            // Armamos el número grande (Dividendo)
            num1 = num2 * answer; 
        }
        
        return { type: 'math', num1, num2, answer };
    },

    checkAnswer: function(userAnswer, correctAnswer) {
        return parseInt(userAnswer) === correctAnswer;
    }
};