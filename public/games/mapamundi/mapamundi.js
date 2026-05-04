// /public/games/mapamundi/mapamundi.js

window.MapamundiGame = {
    mapInstance: null,

    // Agregamos el parámetro "langConfig" para saber en qué idioma hablar
    speakCountry: function(countryName, langConfig) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); 
            const utterance = new SpeechSynthesisUtterance(countryName);
            // Aplicamos el idioma que eligió el Host (es-ES o en-US)
            utterance.lang = langConfig || 'es-ES'; 
            utterance.rate = 1; 
            window.speechSynthesis.speak(utterance);
        }
    },

    update: function(gameData) {
        const board = document.getElementById('interactive-map-board');
        if (!board) return;
        
        // Extraemos las preferencias del Host (o valores por defecto)
        const mapMode = gameData.mapMode || 'mapa';
        const mapLang = gameData.mapLang || 'es-ES';

        // Limpiamos el tablero (destruyendo el mapa si existía)
        if (this.mapInstance) {
            try { this.mapInstance.destroy(); } catch(e){}
            this.mapInstance = null;
        }
        board.innerHTML = ''; 

        if(gameData.currentProblem && gameData.currentProblem.allFlags) {
            
            if (mapMode === 'tablon') {
                // 🗂️ MODO TABLÓN: Dibujamos los círculos flexibles
                board.className = 'tablon-board'; 
                
                gameData.currentProblem.allFlags.forEach(country => {
                    const flagEl = document.createElement('div');
                    flagEl.className = 'flag-circle';
                    flagEl.style.backgroundImage = `url('https://flagcdn.com/w320/${country.code.toLowerCase()}.png')`;
                    
                    const tooltip = document.createElement('div');
                    tooltip.className = 'flag-tooltip-tablon';
                    tooltip.textContent = country.name;
                    
                    flagEl.appendChild(tooltip);
                    
                    // Al tocar la bandera redonda, hablamos en el idioma seleccionado
                    flagEl.addEventListener('click', () => {
                        this.speakCountry(country.name, mapLang);
                    });

                    board.appendChild(flagEl);
                });

            } else {
                // 🗺️ MODO MAPA: Dibujamos el vector de jsVectorMap
                board.className = ''; 
                const markersData = gameData.currentProblem.allFlags
                    .filter(c => c.coords) 
                    .map(country => {
                        return {
                            name: country.name,
                            coords: country.coords,
                            style: { initial: { image: `https://flagcdn.com/w40/${country.code.toLowerCase()}.png` } }
                        };
                    });

                setTimeout(() => {
                    this.mapInstance = new jsVectorMap({
                        selector: '#interactive-map-board',
                        map: 'world',
                        zoomOnScroll: true, zoomButtons: true,
                        markers: markersData,
                        markerStyle: { initial: { image: true } },
                        tooltip: { textStyle: { fontFamily: 'Segoe UI', fontWeight: 'bold' } },
                        onMarkerClick: (event, index) => {
                            const clickedCountry = markersData[index].name;
                            // Hablamos en el idioma seleccionado
                            this.speakCountry(clickedCountry, mapLang);
                        }
                    });
                }, 100);
            }
        }
    },

    showResult: function(data) {}
};