// State Management
const state = {
    view: 'welcome', // welcome, login, home, camera, selection, results
    inventory: [],
    selectedIngredients: new Set(),
    recipes: [],
    capturedImage: null,
    apiKey: localStorage.getItem('gemini_api_key') || '',
    user: null // Will store user info
};

// Mock Data
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
    },
    {
        title: 'Ensalada César',
        time: '15 min',
        difficulty: 'Fácil',
        icon: '🥗',
        calories: '320 kcal',
        desc: 'Clásica ensalada con pollo y picatostes.'
    }
];

// DOM Elements
const app = document.getElementById('app');

// Components
const BottomNav = (activeTab) => `
    <nav class="bottom-nav">
        <button class="nav-item ${activeTab === 'home' ? 'active' : ''}" onclick="goHome()">
            <i class="ph-fill ph-house"></i>
        </button>
        <button class="nav-item">
            <i class="ph ph-magnifying-glass"></i>
        </button>
        <div class="scan-fab" onclick="startCamera()">
            <i class="ph-fill ph-scan"></i>
        </div>
        <button class="nav-item">
            <i class="ph ph-heart"></i>
        </button>
        <button class="nav-item" onclick="openSettings()">
            <i class="ph ph-user"></i>
        </button>
    </nav>
`;

// Views
const views = {
    welcome: () => `
        <div class="container">
            <div class="welcome-view">
                <div class="welcome-image-container">
                    <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop" class="welcome-img" alt="Food">
                </div>
                <div class="welcome-content">
                    <div class="brand-tag">FrigoLens</div>
                    <h1 class="welcome-title">Comida deliciosa<br>para tu familia</h1>
                    <p class="welcome-text">Descubre recetas increíbles con lo que ya tienes en tu nevera.</p>
                    <button class="btn-primary" onclick="render('login')">Empezar a Cocinar</button>
                </div>
            </div>
        </div>
    `,

    login: () => `
        <div class="container">
            <div class="welcome-view" style="justify-content: center; padding: 32px;">
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 class="welcome-title">Crear Cuenta</h1>
                    <p class="welcome-text">Guarda tus recetas y preferencias.</p>
                </div>

                <div class="login-options">
                    <button class="btn-social btn-apple" onclick="mockLogin('Apple')">
                        <i class="ph-fill ph-apple-logo"></i> Continuar con Apple
                    </button>
                    <button class="btn-social btn-google" onclick="mockLogin('Google')">
                        <i class="ph-fill ph-google-logo"></i> Continuar con Google
                    </button>
                    <button class="btn-social btn-email" onclick="goHome()">
                        <i class="ph-fill ph-envelope"></i> Continuar con Email
                    </button>
                </div>

                <p style="text-align: center; margin-top: 32px; color: var(--text-muted); font-size: 0.9rem;">
                    ¿Ya tienes cuenta? <a href="#" onclick="goHome()" style="color: var(--primary); font-weight: 600; text-decoration: none;">Iniciar Sesión</a>
                </p>
            </div>
        </div>
    `,

    home: () => `
        <div class="container">
            <header class="home-header">
                <div class="user-row">
                    <div class="user-info">
                        <div class="avatar">👩‍🍳</div>
                        <div class="greeting">
                            <p>Buenas tardes,</p>
                            <h1>${state.user ? state.user.name : 'FrigoLender'}</h1>
                        </div>
                    </div>
                    <button class="camera-btn-sm" style="background: white; color: black; box-shadow: var(--shadow-card);" onclick="openSettings()">
                        <i class="ph ph-gear"></i>
                    </button>
                </div>
                
                <div class="search-bar">
                    <i class="ph ph-magnifying-glass"></i>
                    <span>Buscar recetas...</span>
                </div>
            </header>

            <div class="categories-section">
                <div class="categories-scroll">
                    <div class="category-pill active">Desayuno</div>
                    <div class="category-pill">Almuerzo</div>
                    <div class="category-pill">Cena</div>
                    <div class="category-pill">Snack</div>
                </div>
            </div>

            <div class="popular-section">
                <div class="section-title">Recetas Populares</div>
                <div class="horizontal-scroll">
                    ${MOCK_RECIPES.map(recipe => `
                        <div class="recipe-card-lg">
                            <div class="recipe-img-lg">
                                ${recipe.icon}
                                <button class="fav-btn"><i class="ph-fill ph-heart"></i></button>
                            </div>
                            <div class="recipe-title-lg">${recipe.title}</div>
                            <div class="recipe-meta">
                                <div class="meta-item"><i class="ph-fill ph-clock"></i> ${recipe.time}</div>
                                <div class="meta-item">|</div>
                                <div class="meta-item"><i class="ph-fill ph-fire"></i> ${recipe.difficulty}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="popular-section">
                <div class="section-title">Recientes</div>
                <div style="padding-right: 24px;">
                    <div style="background: white; border-radius: 20px; padding: 16px; display: flex; gap: 16px; align-items: center; box-shadow: var(--shadow-card); border: 1px solid #F3F4F6;">
                        <div style="width: 60px; height: 60px; background: #FFF2E5; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 2rem;">🥑</div>
                        <div>
                            <div style="font-weight: 700; margin-bottom: 4px;">Tostada de Aguacate</div>
                            <div style="color: #858585; font-size: 0.9rem;">Hace 2 horas</div>
                        </div>
                    </div>
                </div>
            </div>

            ${BottomNav('home')}
        </div>
    `,

    camera: () => `
        <div class="camera-container">
            <div class="camera-top">
                <button class="camera-btn-sm" onclick="goHome()">
                    <i class="ph ph-x"></i>
                </button>
                <span style="color: white; font-weight: 600;">Escanear</span>
                <button class="camera-btn-sm">
                    <i class="ph ph-lightning"></i>
                </button>
            </div>
            
            <div class="camera-feed">
                <video id="camera-feed" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
                <canvas id="camera-canvas" style="display:none;"></canvas>
            </div>
            
            <div class="camera-bottom">
                <button class="camera-btn-sm" onclick="uploadPhoto()">
                    <i class="ph ph-image"></i>
                </button>
                <div class="shutter-ring" onclick="capturePhoto()">
                    <div class="shutter-inner"></div>
                </div>
                <div style="width: 40px;"></div>
            </div>
        </div>
    `,

    loading: (msg) => `
        <div class="container" style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; text-align: center; padding: 40px;">
            <div style="font-size: 4rem; margin-bottom: 20px; animation: bounce 1s infinite;">👨‍🍳</div>
            <h2 style="margin-bottom: 10px;">Un momento...</h2>
            <p style="color: var(--text-muted);">${msg}</p>
        </div>
    `,

    selection: () => `
        <div class="container">
            <div style="padding: 24px 24px 0;">
                <button onclick="goHome()" style="border:none; background:none; font-size: 1.5rem; margin-bottom: 16px;">
                    <i class="ph ph-arrow-left"></i>
                </button>
                <h1 style="font-size: 1.8rem; line-height: 1.2;">Selecciona tus<br>Ingredientes</h1>
            </div>

            <div class="selection-view">
                <div class="selection-grid">
                    ${state.inventory.map(item => `
                        <div class="ingredient-card ${state.selectedIngredients.has(item.name) ? 'selected' : ''}" 
                             onclick="toggleIngredient('${item.name}')">
                            <div class="ingredient-icon">${item.icon}</div>
                            <span style="font-weight: 600; font-size: 0.9rem;">${item.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="floating-btn-container">
                <button class="btn-primary" onclick="generateRecipes()">
                    Cocinar (${state.selectedIngredients.size})
                </button>
            </div>
        </div>
    `,

    results: () => `
        <div class="container">
            <div style="padding: 24px;">
                <button onclick="render('selection')" style="border:none; background:none; font-size: 1.5rem; margin-bottom: 16px;">
                    <i class="ph ph-arrow-left"></i>
                </button>
                <h1 style="font-size: 1.8rem; margin-bottom: 24px;">Recetas para ti</h1>
                
                <div style="display: grid; gap: 24px;">
                    ${state.recipes.map(recipe => `
                        <div class="recipe-card-lg" style="box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                            <div class="recipe-img-lg" style="height: 200px;">
                                ${recipe.icon}
                            </div>
                            <div class="recipe-title-lg" style="font-size: 1.3rem;">${recipe.title}</div>
                            <div class="recipe-meta" style="margin-bottom: 12px;">
                                <div class="meta-item"><i class="ph-fill ph-clock"></i> ${recipe.time}</div>
                                <div class="meta-item">|</div>
                                <div class="meta-item"><i class="ph-fill ph-fire"></i> ${recipe.difficulty}</div>
                            </div>
                            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 20px;">
                                ${recipe.desc}
                            </p>
                            <button class="btn-primary" style="padding: 12px; font-size: 0.9rem;">Ver Pasos</button>
                        </div>
                    `).join('')}
                </div>
                
                <div style="height: 100px;"></div>
            </div>
        </div>
    `
};

// Settings Modal
const settingsModal = `
    <div id="settings-modal" class="modal-overlay">
        <div class="modal-content">
            <h2 style="margin-bottom: 20px;">Configuración</h2>
            <label style="font-weight: 600; font-size: 0.9rem; color: var(--text-muted);">Gemini API Key</label>
            <input type="password" id="api-key-input" class="input-field" placeholder="Pega tu API Key aquí...">
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 8px; margin-bottom: 24px;">
                Necesaria para que la IA funcione.
            </p>
            <button class="btn-primary" onclick="saveSettings()">Guardar</button>
            <button style="width: 100%; padding: 16px; background: none; border: none; color: var(--text-muted); font-weight: 600; margin-top: 8px;" onclick="closeSettings()">Cancelar</button>
        </div>
    </div>
`;

// Logic
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

window.mockLogin = (provider) => {
    // Simulate login for demo purposes
    state.user = { name: 'Gerard', email: 'gerard@example.com' };
    goHome();
};

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
    render('selection');
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

async function identifyIngredients() {
    render('loading', 'Identificando ingredientes...');

    if (!state.apiKey) {
        setTimeout(() => {
            state.inventory = [
                { name: 'Huevos', icon: '🥚' },
                { name: 'Leche', icon: '🥛' },
                { name: 'Tomates', icon: '🍅' },
                { name: 'Queso', icon: '🧀' },
                { name: 'Pollo', icon: '🍗' }
            ];
            state.selectedIngredients = new Set(state.inventory.map(i => i.name));
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

async function generateRecipes() {
    if (state.selectedIngredients.size === 0) {
        alert("Selecciona al menos un ingrediente.");
        return;
    }

    render('loading', 'Creando recetas...');

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
    // Check if user is logged in (mock)
    // For now always show welcome screen
    render('welcome');
});
