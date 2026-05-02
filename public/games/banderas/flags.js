// /public/games/banderas/flags.js

window.FlagsGame = {
    mapInstance: null,

    // 1. Función para pintar el problema
    update: function(gameData) {
        document.getElementById('flag-image').src = gameData.currentProblem.flagUrl;
        document.getElementById('flag-continent').textContent = `🌍 ${gameData.currentProblem.continent || 'Planeta Tierra'}`;
        document.getElementById('correct-country-name').style.display = 'none';

        if(gameData.currentProblem.code) {
             this.updateMap(gameData.currentProblem.code);
        }
    },

    // 1.5 Sub-función interna exclusiva de Banderas para animar el mapa
    updateMap: function(countryCode) {
        const codeUpper = countryCode.toUpperCase();
        
        if (this.mapInstance) {
            try { this.mapInstance.destroy(); } catch(e) {}
            const mapEl = document.getElementById('world-map');
            if(mapEl) mapEl.innerHTML = ''; 
        }

        setTimeout(() => {
            const mapContainer = document.getElementById('world-map');
            if(!mapContainer) return; 

            this.mapInstance = new jsVectorMap({
                selector: '#world-map',
                map: 'world',
                zoomOnScroll: false, 
                zoomButtons: false,
                selectedRegions: [codeUpper], 
                regionStyle: {
                    initial: { fill: '#bdc3c7', stroke: '#ffffff', strokeWidth: 0.5 }, 
                    selected: { fill: '#2ECC71' } 
                }
            });

            setTimeout(() => {
                this.mapInstance.setFocus({ regions: [codeUpper], animate: true });
            }, 50); 
        }, 50);
    },

    // 2. Función para revelar el nombre del país
    showResult: function(data) {
        const countryNameEl = document.getElementById('correct-country-name');
        countryNameEl.textContent = data.correctAnswer;
        countryNameEl.style.display = 'block';
        countryNameEl.classList.add('pop-in-animation');
    }
};