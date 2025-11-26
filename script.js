// State Management
const state = {
    view: 'home', // home, camera, selection, results
    inventory: [],
    selectedIngredients: new Set(),
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
        calories: '250 kcal',
        desc: 'Rápida, nutritiva y deliciosa.'
    },
    {
        title: 'Pollo al Horno con Tomate',
        time: '45 min',
        difficulty: 'Medio',
        icon: '🥘',
        calories: '450 kcal',
        desc: 'Jugoso pollo asado con base de tomates.'
    }
];

// DOM Elements
const app = document.getElementById('app');

// Components
const BottomNav = (activeTab) => `
    <nav class="bottom-nav">
        <button class="nav-item ${activeTab === 'home' ? 'active' : ''}" onclick="goHome()">
            <i class="ph ph-house"></i>
            <span>Inicio</span>
        </button>
        <button class="nav-item">
            <i class="ph ph-heart"></i>
            <span>Favs</span>
        </button>
        <div class="nav-fab" onclick="startCamera()">
            <i class="ph ph-camera"></i>
        </div>
        <button class="nav-item">
            <i class="ph ph-article"></i>
            <span>Recetas</span>
        </button>
        <button class="nav-item" onclick="openSettings()">
            <i class="ph ph-user"></i>
            <span>Perfil</span>
        </button>
    </nav>
`;

const Header = (title = '') => `
    <header class="app-header">
        ${title ? `
            <button class="btn-icon" onclick="goHome()" style="border:none; background:transparent;">
                <i class="ph ph-arrow-left" style="font-size: 1.5rem;"></i>
            </button>
            <span style="font-weight: 700; font-size: 1.1rem;">${title}</span>
            <div style="width: 44px;"></div>
        ` : `
            <div class="user-profile">
                <div class="avatar">FL</div>
                <div class="greeting">
                    <span>Hola, FrigoLender</span>
                    <span>¿Qué cocinamos hoy?</span>
                </div>
            </div>
            <button class="btn-icon" onclick="openSettings()">
                <i class="ph ph-gear"></i>
            </button>
        `}
    </header>
`;

// Views
const views = {
    home: () => `
        <div class="container">
            ${Header()}
            
            <div class="hero-banner" onclick="startCamera()" style="cursor: pointer;">
                <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop" class="hero-bg" alt="Food">
                <div class="hero-overlay"></div>
                <div class="hero-content">
                    <span class="hero-tag">✨ Nueva Receta</span>
                    <h1 class="hero-title">Abre tu nevera,<br>descubre magia.</h1>
                    <p class="hero-desc">Escanea tus ingredientes y crea platos increíbles en segundos.</p>
                    <button class="btn btn-primary" style="width: auto; padding: 12px 24px;">
                        <i class="ph ph-camera"></i> Escanear Ahora
                    </button>
                </div>
            </div>

            <div class="section-header">
                <span class="section-title">Recetas Populares</span>
                <a href="#" style="color: var(--primary); text-decoration: none; font-weight: 600; font-size: 0.9rem;">Ver todo</a>
            </div>

            <div class="recipe-list">
                ${MOCK_RECIPES.map(recipe => `
                    <div class="recipe-card">
                        <div class="recipe-image">
                            ${recipe.icon}
                        </div>
                        <div class="recipe-content">
                            <div class="recipe-title">${recipe.title}</div>
                            <div class="recipe-meta">
                                <span><i class="ph-fill ph-clock"></i> ${recipe.time}</span>
                                <span><i class="ph-fill ph-fire"></i> ${recipe.calories}</span>
                                <span><i class="ph-fill ph-chart-bar"></i> ${recipe.difficulty}</span>
                            </div>
                            <button class="cook-btn">Cocinar Ahora</button>
                        </div>
                    </div>
                `).join('')}
            </div>

            ${BottomNav('home')}
        </div>
    `,

    camera: () => `
        <div class="camera-view">
            <div class="camera-header">
                <button class="btn-icon" style="background: rgba(0,0,0,0.5); color: white; border: none;" onclick="goHome()">
                    <i class="ph ph-x"></i>
                </button>
                <span style="color: white; font-weight: 600;">Escanear Comida</span>
                <button class="btn-icon" style="background: rgba(0,0,0,0.5); color: white; border: none;">
                    <i class="ph ph-lightning"></i>
                </button>
            </div>
            
            <div class="camera-feed-box">
                <video id="camera-feed" autoplay playsinline></video>
                <canvas id="camera-canvas" style="display:none;"></canvas>
            </div>
            
            <div class="camera-actions">
                <button class="btn-icon" style="background: transparent; color: white; border: none;" onclick="uploadPhoto()">
                    <i class="ph ph-image" style="font-size: 1.5rem;"></i>
                </button>
                <button class="shutter-btn" onclick="capturePhoto()"></button>
                <div style="width: 44px;"></div>
            </div>
        </div>
    `,

    loading: (msg) => `
        <div class="container" style="display: flex; flex-direction: column; justify-content: center;">
            <div class="loader-container">
                <div class="loader-emoji">🤔</div>
                <h2>Analizando...</h2>
                <p style="color: var(--text-secondary); margin-top: 10px;">${msg}</p>
            </div>
        </div>
    `,

    selection: () => `
        <div class="container">
            ${Header('Selecciona Ingredientes')}
            
            <div class="selection-header">
                <p style="color: var(--text-secondary);">Hemos encontrado estos ingredientes. Selecciona los que quieras usar.</p>
            </div>

            <div class="selection-grid">
                ${state.inventory.map((item, index) => `
                    <div class="ingredient-check-card ${state.selectedIngredients.has(item.name) ? 'selected' : ''}" 
                         onclick="toggleIngredient('${item.name}')">
                        <div class="check-circle"></div>
                        <span style="font-size: 2.5rem;">${item.icon}</span>
                        <span style="font-weight: 600; font-size: 0.9rem; text-align: center;">${item.name}</span>
                    </div>
                `).join('')}
            </div>

            <div class="floating-action-bar">
                <button class="btn btn-primary" onclick="generateRecipes()">
                    Crear Recetas (${state.selectedIngredients.size})
                </button>
            </div>
        </div>
    `,

    results: () => `
        <div class="container">
            ${Header('Recetas Sugeridas')}

            <div class="recipe-list" style="padding-top: 20px;">
                ${state.recipes.map(recipe => `
                    <div class="recipe-card">
                        <div class="recipe-image">
                            ${recipe.icon}
                        </div>
                        <div class="recipe-content">
                            <div class="recipe-title">${recipe.title}</div>
                            <div class="recipe-meta">
                                <span><i class="ph-fill ph-clock"></i> ${recipe.time}</span>
                                <span><i class="ph-fill ph-fire"></i> ${recipe.difficulty}</span>
                            </div>
                            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 16px;">${recipe.desc}</p>
                            <button class="cook-btn">Ver Receta</button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="padding: 24px;">
                <button class="btn btn-secondary" onclick="startCamera()">
                    Escanear otra vez
                </button>
            </div>
        </div>
    `
};

// Settings Modal
const settingsModal = `
    <div id="settings-modal" class="modal-overlay">
        <div class="modal-content">
            <h2 style="margin-bottom: 20px;">Configuración</h2>
            <label style="font-weight: 600; font-size: 0.9rem; color: var(--text-secondary);">Gemini API Key</label>
            <input type="password" id="api-key-input" class="input-field" placeholder="Pega tu API Key aquí...">
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px; margin-bottom: 24px;">
                Necesaria para que la IA funcione.
            </p>
            <button class="btn btn-primary" onclick="saveSettings()">Guardar</button>
            <button class="btn" style="margin-top: 10px; color: var(--text-secondary);" onclick="closeSettings()">Cancelar</button>
        </div>
    </div>
`;

// Core Functions
function render(viewName, param) {
    state.view = viewName;
    app.innerHTML = views[viewName](param);

    if (!document.getElementById('settings-modal')) {
        document.body.insertAdjacentHTML('beforeend', settingsModal);
    }

    if (viewName === 'camera') {
        initCamera();
    }
    window.scrollTo(0, 0);
}

window.goHome = () => render('home');
window.startCamera = () => render('camera');

window.openSettings = () => {
    const modal = document.getElementById('settings-modal');
    document.getElementById('api-key-input').value = state.apiKey;
    modal.classList.add('open');
};

window.closeSettings = () => {
    document.getElementById('settings-modal').classList.remove('open');
};

window.saveSettings = () => {
    state.apiKey = document.getElementById('api-key-input').value.trim();
    localStorage.setItem('gemini_api_key', state.apiKey);
    closeSettings();
    alert("¡Configuración guardada!");
};

window.toggleIngredient = (name) => {
    if (state.selectedIngredients.has(name)) {
        state.selectedIngredients.delete(name);
    } else {
        state.selectedIngredients.add(name);
    }
    render('selection'); // Re-render to update UI
};

// Camera & AI Logic
async function initCamera() {
    const video = document.getElementById('camera-feed');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        video.srcObject = stream;
    } catch (err) {
        console.error("Camera error", err);
        alert("No se pudo acceder a la cámara.");
        goHome();
    }
}

window.capturePhoto = () => {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('camera-canvas');

    if (!video.srcObject) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    state.capturedImage = canvas.toDataURL('image/jpeg');
    video.pause();

    identifyIngredients();
};

window.uploadPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        if (e.target.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                state.capturedImage = evt.target.result;
                identifyIngredients();
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    input.click();
};

// Step 1: Identify Ingredients
async function identifyIngredients() {
    render('loading', 'Identificando ingredientes...');

    if (!state.apiKey) {
        setTimeout(() => {
            state.inventory = MOCK_INVENTORY;
            state.selectedIngredients = new Set(MOCK_INVENTORY.map(i => i.name));
            render('selection');
        }, 1500);
        return;
    }

    try {
        const base64Data = state.capturedImage.split(',')[1];
        const prompt = `
        Identifica TODOS los ingredientes de comida en esta imagen.
        Responde SOLO con un JSON:
        [{"name": "Nombre", "icon": "Emoji"}]
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`, {
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
        const text = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

        state.inventory = Array.isArray(result) ? result : result.inventory || [];
        state.selectedIngredients = new Set(state.inventory.map(i => i.name));
        render('selection');
    } catch (error) {
        console.error(error);
        alert("Error identificando ingredientes.");
        goHome();
    }
}

// Step 2: Generate Recipes
async function generateRecipes() {
    if (state.selectedIngredients.size === 0) {
        alert("Selecciona al menos un ingrediente.");
        return;
    }

    render('loading', 'El Chef IA está creando recetas...');

    if (!state.apiKey) {
        setTimeout(() => {
            state.recipes = MOCK_RECIPES;
            render('results');
        }, 1500);
        return;
    }

    try {
        const ingredientsList = Array.from(state.selectedIngredients).join(', ');
        const prompt = `
        Crea 3 recetas detalladas usando PRINCIPALMENTE estos ingredientes: ${ingredientsList}.
        Puedes asumir ingredientes básicos de despensa (sal, aceite, etc).
        Responde SOLO con un JSON:
        [{"title": "Nombre", "time": "XX min", "difficulty": "Fácil/Medio", "icon": "Emoji", "desc": "Descripción breve"}]
        `;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

        state.recipes = result;
        render('results');
    } catch (error) {
        console.error(error);
        alert("Error generando recetas.");
        render('selection');
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    render('home');
});
