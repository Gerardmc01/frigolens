// State Management
const state = {
    view: 'home', // home, camera, analysis, results
    inventory: [],
    recipes: [],
    capturedImage: null
};

// Mock Data
const MOCK_INVENTORY = [
    { name: 'Huevos', icon: '🥚' },
    { name: 'Leche', icon: '🥛' },
    { name: 'Tomates', icon: '🍅' },
    { name: 'Queso', icon: '🧀' },
    { name: 'Espinacas', icon: '🍃' },
    { name: 'Pollo', icon: '🍗' }
];

const MOCK_RECIPES = [
    {
        title: 'Tortilla Francesa Deluxe',
        time: '10 min',
        difficulty: 'Fácil',
        icon: '🍳',
        desc: 'Rápida, nutritiva y deliciosa con queso y espinacas.'
    },
    {
        title: 'Pollo al Horno con Tomate',
        time: '45 min',
        difficulty: 'Medio',
        icon: '🥘',
        desc: 'Jugoso pollo asado con una base de tomates frescos.'
    },
    {
        title: 'Batido Proteico',
        time: '5 min',
        difficulty: 'Muy Fácil',
        icon: '🥤',
        desc: 'Energía pura con leche y espinacas (¡no sabe mal!).'
    }
];

// DOM Elements
const app = document.getElementById('app');

// Views Templates
const views = {
    home: () => `
        <div class="view home-view fade-enter-active">
            <div class="hero-section">
                <div class="hero-emoji">🧊✨</div>
                <h1>FridgeMagic</h1>
                <p>Tu nevera tiene secretos. <br>Deja que la IA te diga qué cocinar.</p>
                <button class="btn btn-primary" onclick="startCamera()">
                    <i class="ph ph-camera"></i> Escanear Nevera
                </button>
                <br>
                <button class="btn btn-glass" onclick="uploadPhoto()">
                    <i class="ph ph-upload"></i> Subir Foto
                </button>
            </div>
            
            <div class="orb orb-1"></div>
            <div class="orb orb-2"></div>
        </div>
    `,
    camera: () => `
        <div class="view camera-view fade-enter-active">
            <h2>Escanea tu Nevera</h2>
            <div class="camera-container">
                <video id="camera-feed" autoplay playsinline></video>
                <canvas id="camera-canvas" style="display:none;"></canvas>
                <div class="scanning-line" style="display:none;" id="scan-line"></div>
            </div>
            <div class="camera-overlay">
                <button class="btn btn-glass" style="width:auto" onclick="goHome()">Cancelar</button>
                <button class="capture-btn" onclick="capturePhoto()"></button>
            </div>
        </div>
    `,
    analysis: () => `
        <div class="view analysis-view fade-enter-active">
            <div class="hero-section">
                <div class="hero-emoji">🧠</div>
                <h2>Analizando...</h2>
                <p>Identificando ingredientes y consultando al Chef IA...</p>
            </div>
        </div>
    `,
    results: () => `
        <div class="view results-view fade-enter-active">
            <h2>¡Mira lo que tienes!</h2>
            
            <div class="card">
                <h3>Ingredientes Detectados</h3>
                <div class="inventory-grid">
                    ${state.inventory.map(item => `
                        <div class="item-chip">
                            <span class="item-icon">${item.icon}</span>
                            <span class="item-name">${item.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <h2>Recetas Sugeridas</h2>
            <div class="recipes-list">
                ${state.recipes.map(recipe => `
                    <div class="recipe-card">
                        <div class="recipe-icon">${recipe.icon}</div>
                        <div class="recipe-info">
                            <h3>${recipe.title}</h3>
                            <p>${recipe.desc}</p>
                            <div class="recipe-tags">
                                <span>⏱️ ${recipe.time}</span>
                                <span>•</span>
                                <span>${recipe.difficulty}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <button class="btn btn-primary" onclick="goHome()">
                <i class="ph ph-arrow-counter-clockwise"></i> Escanear de nuevo
            </button>
        </div>
    `
};

// Router / Render
function render(viewName) {
    state.view = viewName;
    app.innerHTML = views[viewName]();
    
    // Post-render hooks
    if (viewName === 'camera') {
        initCamera();
    }
}

// Actions
window.goHome = () => render('home');

window.startCamera = () => {
    render('camera');
};

window.uploadPhoto = () => {
    // Simulate upload for now
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        if (e.target.files.length > 0) {
            startAnalysis();
        }
    };
    input.click();
};

async function initCamera() {
    const video = document.getElementById('camera-feed');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        video.srcObject = stream;
    } catch (err) {
        console.error("Camera error", err);
        alert("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
        goHome();
    }
}

window.capturePhoto = () => {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('camera-canvas');
    const scanLine = document.getElementById('scan-line');
    
    // Freeze frame effect
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    video.pause();
    scanLine.style.display = 'block';
    
    // Simulate processing delay
    setTimeout(() => {
        startAnalysis();
    }, 1500);
};

function startAnalysis() {
    render('analysis');
    
    // Simulate AI processing time
    setTimeout(() => {
        // Set mock results
        state.inventory = MOCK_INVENTORY;
        state.recipes = MOCK_RECIPES;
        render('results');
    }, 3000);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    render('home');
});
