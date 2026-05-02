// /server/games/banderas.js

// ¡CORTA Y PEGA AQUÍ TU LISTA COMPLETA DE PAÍSES!
// Yo pondré unos pocos de ejemplo para no hacer este mensaje gigante, 
// pero tú reemplaza este arreglo por tu lista completa de más de 100 países.
// Base de datos Mundial Completa
const countries = [
    // --- AMÉRICA ---
    { name: "Antigua y Barbuda", code: "ag", continent: "El Caribe" }, { name: "Argentina", code: "ar", continent: "América del Sur" },
    { name: "Bahamas", code: "bs", continent: "El Caribe" }, { name: "Barbados", code: "bb", continent: "El Caribe" },
    { name: "Belice", code: "bz", continent: "América Central" }, { name: "Bolivia", code: "bo", continent: "América del Sur" },
    { name: "Brasil", code: "br", continent: "América del Sur" }, { name: "Canada", code: "ca", continent: "América del Norte" },
    { name: "Chile", code: "cl", continent: "América del Sur" }, { name: "Colombia", code: "co", continent: "América del Sur" },
    { name: "Costa Rica", code: "cr", continent: "América Central" }, { name: "Cuba", code: "cu", continent: "El Caribe" },
    { name: "Ecuador", code: "ec", continent: "América del Sur" }, { name: "El Salvador", code: "sv", continent: "América Central" },
    { name: "Estados Unidos", code: "us", continent: "América del Norte" }, { name: "Guatemala", code: "gt", continent: "América Central" },
    { name: "Guyana", code: "gy", continent: "América del Sur" }, { name: "Haiti", code: "ht", continent: "El Caribe" },
    { name: "Honduras", code: "hn", continent: "América Central" }, { name: "Jamaica", code: "jm", continent: "El Caribe" },
    { name: "Mexico", code: "mx", continent: "América del Norte" }, { name: "Nicaragua", code: "ni", continent: "América Central" },
    { name: "Panama", code: "pa", continent: "América Central" }, { name: "Paraguay", code: "py", continent: "América del Sur" },
    { name: "Peru", code: "pe", continent: "América del Sur" }, { name: "Puerto Rico", code: "pr", continent: "El Caribe" },
    { name: "Republica Dominicana", code: "do", continent: "El Caribe" }, { name: "Uruguay", code: "uy", continent: "América del Sur" },
    { name: "Venezuela", code: "ve", continent: "América del Sur" }, { name: "Surinam", code: "sr", continent: "América del Sur" },
    { name: "Dominica", code: "dm", continent: "El Caribe" }, { name: "Granada", code: "gd", continent: "El Caribe" },
    { name: "San Cristobal y Nieves", code: "kn", continent: "El Caribe" }, { name: "Santa Lucia", code: "lc", continent: "El Caribe" },
    { name: "San Vicente y las Granadinas", code: "vc", continent: "El Caribe" }, { name: "Trinidad y Tobago", code: "tt", continent: "El Caribe" },

    // --- EUROPA ---
    { name: "Albania", code: "al", continent: "Europa" }, { name: "Alemania", code: "de", continent: "Europa" },
    { name: "Andorra", code: "ad", continent: "Europa" }, { name: "Austria", code: "at", continent: "Europa" },
    { name: "Belgica", code: "be", continent: "Europa" }, { name: "Bielorrusia", code: "by", continent: "Europa" },
    { name: "Bosnia", code: "ba", continent: "Europa" }, { name: "Bulgaria", code: "bg", continent: "Europa" },
    { name: "Croacia", code: "hr", continent: "Europa" }, { name: "Dinamarca", code: "dk", continent: "Europa" },
    { name: "Eslovaquia", code: "sk", continent: "Europa" }, { name: "Eslovenia", code: "si", continent: "Europa" },
    { name: "España", code: "es", continent: "Europa" }, { name: "Estonia", code: "ee", continent: "Europa" },
    { name: "Finlandia", code: "fi", continent: "Europa" }, { name: "Francia", code: "fr", continent: "Europa" },
    { name: "Grecia", code: "gr", continent: "Europa" }, { name: "Países Bajos", code: "nl", continent: "Europa" },
    { name: "Hungria", code: "hu", continent: "Europa" }, { name: "Irlanda", code: "ie", continent: "Europa" },
    { name: "Islandia", code: "is", continent: "Europa" }, { name: "Italia", code: "it", continent: "Europa" },
    { name: "Letonia", code: "lv", continent: "Europa" }, { name: "Liechtenstein", code: "li", continent: "Europa" },
    { name: "Lituania", code: "lt", continent: "Europa" }, { name: "Luxemburgo", code: "lu", continent: "Europa" },
    { name: "Malta", code: "mt", continent: "Europa" }, { name: "Moldavia", code: "md", continent: "Europa" },
    { name: "Monaco", code: "mc", continent: "Europa" }, { name: "Montenegro", code: "me", continent: "Europa" },
    { name: "Noruega", code: "no", continent: "Europa" }, { name: "Polonia", code: "pl", continent: "Europa" },
    { name: "Portugal", code: "pt", continent: "Europa" }, { name: "Reino Unido", code: "gb", continent: "Europa" },
    { name: "Republica Checa", code: "cz", continent: "Europa" }, { name: "Rumania", code: "ro", continent: "Europa" },
    { name: "Rusia", code: "ru", continent: "Europa" }, { name: "San Marino", code: "sm", continent: "Europa" },
    { name: "Serbia", code: "rs", continent: "Europa" }, { name: "Suecia", code: "se", continent: "Europa" },
    { name: "Suiza", code: "ch", continent: "Europa" }, { name: "Ucrania", code: "ua", continent: "Europa" },
    { name: "Vaticano", code: "va", continent: "Europa" }, { name: "Macedonia del Norte", code: "mk", continent: "Europa" },
    { name: "Chipre", code: "cy", continent: "Europa" }, { name: "Turquía", code: "tr", continent: "Europa" },
    { name: "Georgia", code: "ge", continent: "Europa" }, { name: "Armenia", code: "am", continent: "Europa" },
    { name: "Azerbaiyán", code: "az", continent: "Europa" }, { name: "Kosovo", code: "xk", continent: "Europa" },

    // --- ASIA ---    
    { name: "Afganistan", code: "af", continent: "Asia" }, { name: "Arabia Saudita", code: "sa", continent: "Asia" },
    { name: "Catar", code: "qa", continent: "Asia" }, { name: "China", code: "cn", continent: "Asia" },
    { name: "Corea del Norte", code: "kp", continent: "Asia" }, { name: "Corea del Sur", code: "kr", continent: "Asia" },
    { name: "Emiratos Arabes", code: "ae", continent: "Asia" }, { name: "Filipinas", code: "ph", continent: "Asia" },
    { name: "India", code: "in", continent: "Asia" }, { name: "Indonesia", code: "id", continent: "Asia" },
    { name: "Irak", code: "iq", continent: "Asia" }, { name: "Iran", code: "ir", continent: "Asia" },
    { name: "Israel", code: "il", continent: "Asia" }, { name: "Japon", code: "jp", continent: "Asia" },
    { name: "Jordania", code: "jo", continent: "Asia" }, { name: "Libano", code: "lb", continent: "Asia" },
    { name: "Malasia", code: "my", continent: "Asia" }, { name: "Mongolia", code: "mn", continent: "Asia" },
    { name: "Nepal", code: "np", continent: "Asia" }, { name: "Pakistan", code: "pk", continent: "Asia" },
    { name: "Singapur", code: "sg", continent: "Asia" }, { name: "Siria", code: "sy", continent: "Asia" },
    { name: "Tailandia", code: "th", continent: "Asia" }, { name: "Taiwan", code: "tw", continent: "Asia" },
    { name: "Vietnam", code: "vn", continent: "Asia" }, { name: "Bahréin", code: "bh", continent: "Asia" },
    { name: "Bangladesh", code: "bd", continent: "Asia" }, { name: "Brunéi", code: "bn", continent: "Asia" },
    { name: "Bután", code: "bt", continent: "Asia" }, { name: "Camboya", code: "kh", continent: "Asia" },
    { name: "Kazajistán", code: "kz", continent: "Asia" }, { name: "Kirguistán", code: "kg", continent: "Asia" },
    { name: "Kuwait", code: "kw", continent: "Asia" }, { name: "Laos", code: "la", continent: "Asia" },
    { name: "Maldivas", code: "mv", continent: "Asia" }, { name: "Myanmar", code: "mm", continent: "Asia" },
    { name: "Omán", code: "om", continent: "Asia" }, { name: "Sri Lanka", code: "lk", continent: "Asia" },
    { name: "Tayikistán", code: "tj", continent: "Asia" }, { name: "Timor Oriental", code: "tl", continent: "Asia" },
    { name: "Turkmenistán", code: "tm", continent: "Asia" }, { name: "Uzbekistán", code: "uz", continent: "Asia" },
    { name: "Yemen", code: "ye", continent: "Asia" }, { name: "Palestina", code: "ps", continent: "Asia" },

    // --- ÁFRICA ---
    { name: "Angola", code: "ao", continent: "África" }, { name: "Argelia", code: "dz", continent: "África" },
    { name: "Camerun", code: "cm", continent: "África" }, { name: "Costa de Marfil", code: "ci", continent: "África" },
    { name: "Egipto", code: "eg", continent: "África" }, { name: "Etiopia", code: "et", continent: "África" },
    { name: "Ghana", code: "gh", continent: "África" }, { name: "Kenia", code: "ke", continent: "África" },
    { name: "Marruecos", code: "ma", continent: "África" }, { name: "Madagascar", code: "mg", continent: "África" },
    { name: "Nigeria", code: "ng", continent: "África" }, { name: "Senegal", code: "sn", continent: "África" },
    { name: "Sudafrica", code: "za", continent: "África" }, { name: "Tanzania", code: "tz", continent: "África" },
    { name: "Uganda", code: "ug", continent: "África" }, { name: "Zimbabwe", code: "zw", continent: "África" },
    { name: "Benín", code: "bj", continent: "África" }, { name: "Botsuana", code: "bw", continent: "África" },
    { name: "Burkina Faso", code: "bf", continent: "África" }, { name: "Burundi", code: "bi", continent: "África" },
    { name: "Cabo Verde", code: "cv", continent: "África" }, { name: "Chad", code: "td", continent: "África" },
    { name: "Comoras", code: "km", continent: "África" }, { name: "Congo", code: "cg", continent: "África" },
    { name: "República Democrática del Congo", code: "cd", continent: "África" }, { name: "Yibuti", code: "dj", continent: "África" },
    { name: "Guinea Ecuatorial", code: "gq", continent: "África" }, { name: "Eritrea", code: "er", continent: "África" },
    { name: "Eswatini", code: "sz", continent: "África" }, { name: "Gabón", code: "ga", continent: "África" },
    { name: "Gambia", code: "gm", continent: "África" }, { name: "Guinea", code: "gn", continent: "África" },
    { name: "Guinea-Bisáu", code: "gw", continent: "África" }, { name: "Lesoto", code: "ls", continent: "África" },
    { name: "Liberia", code: "lr", continent: "África" }, { name: "Libia", code: "ly", continent: "África" },
    { name: "Malaui", code: "mw", continent: "África" }, { name: "Malí", code: "ml", continent: "África" },
    { name: "Mauritania", code: "mr", continent: "África" }, { name: "Mauricio", code: "mu", continent: "África" },
    { name: "Mozambique", code: "mz", continent: "África" }, { name: "Namibia", code: "na", continent: "África" },
    { name: "Níger", code: "ne", continent: "África" }, { name: "Ruanda", code: "rw", continent: "África" },
    { name: "Santo Tomé y Príncipe", code: "st", continent: "África" }, { name: "Seychelles", code: "sc", continent: "África" },
    { name: "Sierra Leona", code: "sl", continent: "África" }, { name: "Somalia", code: "so", continent: "África" },
    { name: "Sudán", code: "sd", continent: "África" }, { name: "Sudán del Sur", code: "ss", continent: "África" },
    { name: "Togo", code: "tg", continent: "África" }, { name: "Túnez", code: "tn", continent: "África" },
    { name: "Zambia", code: "zm", continent: "África" }, { name: "República Centroafricana", code: "cf", continent: "África" },

    // --- OCEANÍA ---    
    { name: "Australia", code: "au", continent: "Oceanía" }, { name: "Fiyi", code: "fj", continent: "Oceanía" },
    { name: "Nueva Zelanda", code: "nz", continent: "Oceanía" }, { name: "Papua Nueva Guinea", code: "pg", continent: "Oceanía" },
    { name: "Samoa", code: "ws", continent: "Oceanía" }, { name: "Tonga", code: "to", continent: "Oceanía" },
    { name: "Kiribati", code: "ki", continent: "Oceanía" }, { name: "Islas Marshall", code: "mh", continent: "Oceanía" },
    { name: "Micronesia", code: "fm", continent: "Oceanía" }, { name: "Nauru", code: "nr", continent: "Oceanía" },
    { name: "Palaos", code: "pw", continent: "Oceanía" }, { name: "Islas Salomón", code: "sb", continent: "Oceanía" },
    { name: "Tuvalu", code: "tv", continent: "Oceanía" }, { name: "Vanuatu", code: "vu", continent: "Oceanía" }
];

function getRandomInt(min, max) { 
    return Math.floor(Math.random() * (max - min + 1)) + min; 
}

// Función inteligente para normalizar texto (quita tildes y mayúsculas)
function normalizeText(text) {
    if (typeof text !== 'string') return text;
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

module.exports = {
    // Genera un problema nuevo (sin repetir los últimos 15)
    generateProblem: function(game) {
        if (!game.recentFlags) { game.recentFlags = []; }
        
        const activeContinents = game.continents || ['América', 'Europa', 'Asia', 'África', 'Oceanía'];

        // 2. Filtro inteligente corregido
        let filteredCountries = countries.filter(c => {
            return activeContinents.some(cont => {
                // Si el Host eligió 'América', aceptamos también 'El Caribe'
                if (cont === 'América' && c.continent === 'El Caribe') {
                    return true;
                }
                // Para el resto, revisamos si la palabra coincide
                return c.continent.includes(cont);
            });
        });

        if (filteredCountries.length === 0) filteredCountries = countries;

        let availableCountries = filteredCountries.filter(c => !game.recentFlags.includes(c.code));

        if (availableCountries.length === 0) {
            game.recentFlags = [];
            availableCountries = filteredCountries;
        }

        const randomCountry = availableCountries[getRandomInt(0, availableCountries.length - 1)];
        game.recentFlags.push(randomCountry.code);

        if (game.recentFlags.length > 15) {
            game.recentFlags.shift(); 
        }

        return { 
            type: 'banderas',
            flagUrl: `https://flagcdn.com/w320/${randomCountry.code}.png`, 
            answer: randomCountry.name,
            continent: randomCountry.continent,
            code: randomCountry.code
        };
    },
    
    // Revisa si la respuesta es correcta ignorando mayúsculas y tildes
    checkAnswer: function(userAnswer, correctAnswer) {
        return normalizeText(userAnswer) === normalizeText(correctAnswer);
    }
};