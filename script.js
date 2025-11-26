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
                <button class="settings-btn" onclick="openSettings()">
                    <i class="ph ph-gear"></i>
                </button>
                <div class="hero-emoji">🧊✨</div>
                <h1>FrigoLens</h1>
                <p>¡Hola FrigoLender! <br>Tu nevera tiene secretos. Deja que la IA te diga qué cocinar.</p>
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

// Settings Modal
const settingsModal = `
    <div id="settings-modal" class="modal-overlay">
        <div class="modal-content">
            <h2>Configuración</h2>
            <div class="input-group">
                <label>Gemini API Key (Opcional)</label>
                <input type="password" id="api-key-input" class="input-field" placeholder="Pega tu API Key aquí">
                <p style="font-size: 0.8rem; margin-top: 5px;">Si se deja vacío, se usará el modo Demo.</p>
            </div>
            <button class="btn btn-primary" onclick="saveSettings()">Guardar</button>
            <br><br>
            <button class="btn btn-glass" onclick="closeSettings()">Cerrar</button>
        </div>
    </div>
`;

// Router / Render
function render(viewName) {
    state.view = viewName;
    app.innerHTML = views[viewName]();

    // Inject modal if not present (it gets wiped on innerHTML overwrite, so re-append or keep outside app div)
    // Better approach: Keep modal outside #app in index.html, but for now I'll append it to body if it doesn't exist
    if (!document.getElementById('settings-modal')) {
        document.body.insertAdjacentHTML('beforeend', settingsModal);
    }

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
    alert('Configuración guardada');
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
            alert("Error con la API. Usando datos de demostración.");
            useMockData();
        }
    } else {
        // Simulate AI processing time
        setTimeout(() => {
            useMockData();
        }, 3000);
    }
}

function useMockData() {
    state.inventory = MOCK_INVENTORY;
    state.recipes = MOCK_RECIPES;
    render('results');
}

async function analyzeWithGemini(base64Image) {
    // Remove header from base64 string
    const base64Data = base64Image.split(',')[1];

    const prompt = `
    Analiza esta imagen de una nevera o comida. 
    1. Identifica los ingredientes visibles.
    2. Sugiere 3 recetas que se puedan hacer con ellos (una rápida, una elaborada, una saludable).
    
    Responde SOLO con un JSON válido con este formato:
    {
        "inventory": [{"name": "Nombre", "icon": "Emoji"}],
        "recipes": [{"title": "Título", "time": "Tiempo", "difficulty": "Dificultad", "icon": "Emoji", "desc": "Descripción breve"}]
    }
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
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
    // Clean markdown code blocks if present
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
