// State Management
const state = {
    view: 'home', // home, camera, analysis, results
    inventory: [],
    recipes: [],
    capturedImage: null,
    apiKey: localStorage.getItem('gemini_api_key') || ''
};

// Mock Data
const MOCK_INVENTORY = [
    { name: 'Huevos', icon: '🥚' },
    { name: 'Leche', icon: '🥛' },
    { name: 'Tomates', icon: '🍅' },
    { name: 'Queso', icon: '🧀' },
    { name: 'Espinacas', icon: '🍃' },
    { name: 'Pollo', icon: '🍗' },
    { name: 'Aguacate', icon: '🥑' },
    { name: 'Pan', icon: '🍞' }
];

const MOCK_RECIPES = [
    {
        title: 'Tortilla Francesa Deluxe',
        time: '10 min',
        difficulty: 'Fácil',
        icon: '🍳',
        desc: 'Una cena rápida y nutritiva. El secreto está en batir los huevos hasta que espumen y añadir el queso justo antes de cerrar.'
    },
    {
        title: 'Pollo al Horno con Tomate',
        time: '45 min',
        difficulty: 'Medio',
        icon: '🥘',
        desc: 'Jugoso pollo asado sobre una cama de tomates frescos y hierbas aromáticas. Perfecto para impresionar sin mucho esfuerzo.'
    },
    {
        title: 'Tostada de Aguacate y Huevo',
        time: '5 min',
        difficulty: 'Muy Fácil',
        icon: '🥑',
        desc: 'El desayuno de los campeones. Pan tostado crujiente, aguacate cremoso y un huevo poché o frito encima.'
    },
    {
        title: 'Ensalada Caprese',
        time: '5 min',
        difficulty: 'Fácil',
        icon: '🥗',
        desc: 'Fresca y ligera. Tomates maduros, mozzarella fresca (o queso suave) y un buen chorro de aceite de oliva.'
    }
];

// DOM Elements
const app = document.getElementById('app');

// Header Component
const Header = () => `
    <header class="app-header">
        <a href="#" onclick="goHome(); return false;" class="logo">
            <i class="ph-fill ph-snowflake" style="color: var(--primary);"></i>
            <span>FrigoLens</span>
        </a>
        <button class="btn-icon" onclick="openSettings()">
            <i class="ph ph-gear"></i>
        </button>
    </header>
`;

// Views Templates
const views = {
    home: () => `
        ${Header()}
        <div class="container">
            <div class="view home-view">
                <div class="home-grid">
                    <div class="hero-content">
                        <h1 class="hero-title">
                            Tu nevera tiene <br>
                            <span class="gradient-text">secretos deliciosos.</span>
                        </h1>
                        <p class="hero-subtitle">
                            FrigoLens usa Inteligencia Artificial avanzada para escanear tus ingredientes y crear recetas personalizadas al instante.
                        </p>
                        <div class="btn-group">
                            <button class="btn btn-primary" onclick="startCamera()">
                                <i class="ph ph-camera"></i> Escanear Ahora
                            </button>
                            <button class="btn btn-secondary" onclick="uploadPhoto()">
                                <i class="ph ph-upload"></i> Subir Foto
                            </button>
                        </div>
                    </div>
                    
                    <div class="hero-visual">
                        <div class="hero-card-stack">
                            <div class="glass-card" style="transform: rotate(-5deg); z-index: 1;">
                                <div style="font-size: 3rem; margin-bottom: 10px;">🥑</div>
                                <h3>Ingredientes</h3>
                                <p style="color: var(--text-muted)">Detecta +500 alimentos</p>
                            </div>
                            <div class="glass-card" style="transform: rotate(5deg) translate(20px, -20px); z-index: 2; background: rgba(30,30,40,0.8);">
                                <div style="font-size: 3rem; margin-bottom: 10px;">🍳</div>
                                <h3>Recetas</h3>
                                <p style="color: var(--text-muted)">Chef IA Personalizado</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    camera: () => `
        <div class="view camera-view" style="padding-top: 0;">
            <div class="camera-layout">
                <div class="camera-feed-container">
                    <video id="camera-feed" autoplay playsinline></video>
                    <canvas id="camera-canvas" style="display:none;"></canvas>
                    <div class="scanning-line" style="display:none;" id="scan-line"></div>
                    
                    <button class="btn-icon" style="position: absolute; top: 40px; right: 40px; z-index: 20;" onclick="goHome()">
                        <i class="ph ph-x"></i>
                    </button>
                </div>
                
                <div class="camera-controls">
                    <button class="btn-icon" onclick="uploadPhoto()">
                        <i class="ph ph-image"></i>
                    </button>
                    <button class="shutter-btn" onclick="capturePhoto()"></button>
                    <button class="btn-icon">
                        <i class="ph ph-lightning"></i>
                    </button>
                </div>
            </div>
        </div>
    `,
    analysis: () => `
        ${Header()}
        <div class="container">
            <div class="view analysis-view" style="justify-content: center; align-items: center; text-align: center;">
                <div style="font-size: 5rem; margin-bottom: 20px; animation: bounce 2s infinite;">🧠</div>
                <h2 style="font-size: 2rem; margin-bottom: 10px;">Analizando tu nevera...</h2>
                <p style="color: var(--text-muted);">Nuestro Chef IA está pensando en las mejores combinaciones.</p>
            </div>
        </div>
    `,
    results: () => `
        ${Header()}
        <div class="results-container">
            <div class="results-grid">
                <!-- Sidebar: Inventory -->
                <aside class="inventory-panel">
                    <div class="section-title">
                        <i class="ph ph-basket" style="color: var(--primary);"></i>
                        Tu Inventario
                    </div>
                    <div class="inventory-list">
                        ${state.inventory.map(item => `
                            <div class="ingredient-item">
                                <span class="ingredient-icon">${item.icon}</span>
                                <span class="ingredient-name">${item.name}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div style="margin-top: 30px;">
                        <button class="btn btn-secondary" style="width: 100%" onclick="goHome()">
                            <i class="ph ph-arrow-counter-clockwise"></i> Escanear de nuevo
                        </button>
                    </div>
                </aside>

                <!-- Main: Recipes -->
                <main>
                    <div class="section-title">
                        <i class="ph ph-chef-hat" style="color: var(--secondary);"></i>
                        Recetas Sugeridas
                    </div>
                    <div class="recipes-grid">
                        ${state.recipes.map(recipe => `
                            <div class="recipe-card">
                                <div class="recipe-image-placeholder">
                                    ${recipe.icon}
                                </div>
                                <div class="recipe-content">
                                    <h3 class="recipe-title">${recipe.title}</h3>
                                    <div class="recipe-meta">
                                        <div class="meta-item">
                                            <i class="ph ph-clock"></i> ${recipe.time}
                                        </div>
                                        <div class="meta-item">
                                            <i class="ph ph-fire"></i> ${recipe.difficulty}
                                        </div>
                                    </div>
                                    <p class="recipe-desc">${recipe.desc}</p>
                                    <button class="btn btn-primary" style="width: 100%; margin-top: auto;">
                                        Ver Receta Completa
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </main>
            </div>
        </div>
    `
};

// Settings Modal
const settingsModal = `
    <div id="settings-modal" class="modal-overlay">
        <div class="modal-content">
            <h2 style="margin-bottom: 20px;">Configuración</h2>
            <div class="input-group">
                <label style="color: var(--text-muted); display: block; margin-bottom: 10px;">Gemini API Key</label>
                <input type="password" id="api-key-input" class="input-field" placeholder="Pegar API Key aquí...">
                <p style="font-size: 0.8rem; margin-top: 10px; color: var(--text-muted);">
                    Necesaria para el análisis real. Consíguela en Google AI Studio.
                </p>
            </div>
            <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="closeSettings()">Cancelar</button>
                <button class="btn btn-primary" onclick="saveSettings()">Guardar Cambios</button>
            </div>
        </div>
    </div>
`;

// Router / Render
function render(viewName) {
    state.view = viewName;
    app.innerHTML = views[viewName]();

    // Inject modal if not present
    if (!document.getElementById('settings-modal')) {
        document.body.insertAdjacentHTML('beforeend', settingsModal);
    }

    // Post-render hooks
    if (viewName === 'camera') {
        initCamera();
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

// Actions
window.goHome = () => render('home');

window.startCamera = () => {
    render('camera');
};

window.openSettings = () => {
    const modal = document.getElementById('settings-modal');
    const input = document.getElementById('api-key-input');
    input.value = state.apiKey;
    modal.classList.add('open');
};

window.closeSettings = () => {
    document.getElementById('settings-modal').classList.remove('open');
};

window.saveSettings = () => {
    const input = document.getElementById('api-key-input');
    state.apiKey = input.value.trim();
    localStorage.setItem('gemini_api_key', state.apiKey);
    closeSettings();
    alert('Configuración guardada correctamente');
};

window.uploadPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                state.capturedImage = event.target.result; // Base64
                startAnalysis();
            };
            reader.readAsDataURL(file);
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

    if (!video.srcObject) return;

    // Freeze frame effect
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    state.capturedImage = canvas.toDataURL('image/jpeg');

    video.pause();
    scanLine.style.display = 'block';

    // Simulate processing delay
    setTimeout(() => {
        startAnalysis();
    }, 1500);
};

async function startAnalysis() {
    render('analysis');

    if (state.apiKey) {
        try {
            await analyzeWithGemini(state.capturedImage);
        } catch (error) {
            console.error("API Error", error);
            alert("Error con la API: " + error.message + ". Usando datos de demostración.");
            useMockData();
        }
    } else {
        // Simulate AI processing time
        setTimeout(() => {
            useMockData();
        }, 2500);
    }
}

function useMockData() {
    state.inventory = MOCK_INVENTORY;
    state.recipes = MOCK_RECIPES;
    render('results');
}

async function analyzeWithGemini(base64Image) {
    const base64Data = base64Image.split(',')[1];

    const prompt = `
    Actúa como un Chef experto y nutricionista. Analiza esta imagen de una nevera o ingredientes.
    1. Identifica TODOS los ingredientes visibles.
    2. Sugiere 4 recetas creativas y detalladas que se puedan hacer principalmente con ellos (puedes asumir básicos como sal, aceite, especias).
    
    Responde SOLO con un JSON válido con este formato exacto:
    {
        "inventory": [{"name": "Nombre", "icon": "Emoji"}],
        "recipes": [
            {
                "title": "Título atractivo", 
                "time": "XX min", 
                "difficulty": "Fácil/Medio/Difícil", 
                "icon": "Emoji representativo", 
                "desc": "Descripción apetitosa de 2-3 frases explicando el plato."
            }
        ]
    }
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    { inline_data: { mime_type: "image/jpeg", data: base64Data } }
                ]
            }]
        })
    });

    const data = await response.json();

    if (data.error) {
        throw new Error(data.error.message);
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonString);

    state.inventory = result.inventory;
    state.recipes = result.recipes;
    render('results');
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    render('home');
});
