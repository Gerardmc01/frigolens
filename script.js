// State Management
const state = {
    view: 'home', // home, camera, results
    inventory: [],
    recipes: [],
    capturedImage: null,
    apiKey: localStorage.getItem('gemini_api_key') || ''
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
        title: 'Tostada de Aguacate',
        time: '5 min',
        difficulty: 'Fácil',
        icon: '🥑',
        calories: '320 kcal',
        desc: 'Desayuno energético y saludable.'
    },
    {
        title: 'Ensalada Caprese',
        time: '5 min',
        difficulty: 'Fácil',
        icon: '🥗',
        calories: '180 kcal',
        desc: 'Fresca, ligera y mediterránea.'
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

const Header = () => `
    <header class="app-header">
        <div class="user-profile">
            <div class="avatar">👤</div>
            <div class="greeting">
                <span>Hola, FrigoLender</span>
                <span>¿Qué cocinamos hoy?</span>
            </div>
        </div>
        <button class="btn-icon" onclick="openSettings()">
            <i class="ph ph-gear"></i>
        </button>
    </header>
`;

// Views
const views = {
    home: () => `
        <div class="container">
            ${Header()}
            
            <div class="hero-banner">
                <h1>Descubre recetas <br>con tu nevera</h1>
                <p>Usa la IA para crear platos increíbles con lo que ya tienes.</p>
                <button class="btn btn-white" style="background: white; color: var(--primary); width: auto; padding: 12px 24px;" onclick="startCamera()">
                    Escanear Ahora
                </button>
                <div class="hero-decoration">🥗</div>
            </div>

            <div class="section-header">
                <span class="section-title">Categorías</span>
                <a href="#" class="see-all">Ver todo</a>
            </div>
            
            <div class="categories-scroll">
                <div class="category-pill active">🔥 Popular</div>
                <div class="category-pill">🥗 Saludable</div>
                <div class="category-pill">⏱️ Rápido</div>
                <div class="category-pill">🍰 Postres</div>
            </div>

            <div class="section-header">
                <span class="section-title">Recetas Populares</span>
            </div>

            <div class="recipe-list">
                ${MOCK_RECIPES.map(recipe => `
                    <div class="recipe-card">
                        <div class="recipe-img-box">${recipe.icon}</div>
                        <div class="recipe-info">
                            <div class="recipe-title">${recipe.title}</div>
                            <div class="recipe-meta">
                                <span><i class="ph-fill ph-clock"></i> ${recipe.time}</span>
                                <span><i class="ph-fill ph-fire"></i> ${recipe.calories}</span>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">${recipe.desc}</div>
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
                    <i class="ph ph-arrow-left"></i>
                </button>
                <span style="color: white; font-weight: 600;">Escanear Comida</span>
                <button class="btn-icon" style="background: rgba(0,0,0,0.5); color: white; border: none;">
                    <i class="ph ph-lightning"></i>
                </button>
            </div>
            
            <div class="camera-feed-box">
                <video id="camera-feed" autoplay playsinline></video>
                <canvas id="camera-canvas" style="display:none;"></canvas>
                <div id="scan-overlay" class="scan-overlay" style="display:none;">
                    <div class="scan-line"></div>
                    <p style="margin-top: 20px;">Analizando ingredientes...</p>
                </div>
            </div>
            
            <div class="camera-actions">
                <button class="btn-icon" style="background: transparent; color: white; border: none;" onclick="uploadPhoto()">
                    <i class="ph ph-image" style="font-size: 1.5rem;"></i>
                </button>
                <button class="shutter-btn" onclick="capturePhoto()"></button>
                <div style="width: 44px;"></div> <!-- Spacer -->
            </div>
        </div>
    `,

    results: () => `
        <div class="container">
            <div class="app-header">
                <button class="btn-icon" onclick="goHome()">
                    <i class="ph ph-arrow-left"></i>
                </button>
                <span style="font-weight: 700; font-size: 1.1rem;">Resultados</span>
                <div style="width: 44px;"></div>
            </div>

            <div style="padding: 24px;">
                <h2 style="margin-bottom: 20px;">Ingredientes Detectados</h2>
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 30px;">
                    ${state.inventory.map(item => `
                        <div style="background: white; padding: 8px 16px; border-radius: 100px; border: 1px solid var(--border-light); display: flex; align-items: center; gap: 6px;">
                            <span>${item.icon}</span>
                            <span style="font-weight: 500;">${item.name}</span>
                        </div>
                    `).join('')}
                </div>

                <h2 style="margin-bottom: 20px;">Recetas Sugeridas</h2>
                <div class="recipe-list" style="padding: 0;">
                    ${state.recipes.map(recipe => `
                        <div class="recipe-card">
                            <div class="recipe-img-box">${recipe.icon}</div>
                            <div class="recipe-info">
                                <div class="recipe-title">${recipe.title}</div>
                                <div class="recipe-meta">
                                    <span><i class="ph-fill ph-clock"></i> ${recipe.time}</span>
                                    <span><i class="ph-fill ph-fire"></i> ${recipe.difficulty}</span>
                                </div>
                                <p style="font-size: 0.85rem; color: var(--text-secondary);">${recipe.desc}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <button class="btn btn-primary" style="margin-top: 20px;" onclick="startCamera()">
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
function render(viewName) {
    state.view = viewName;
    app.innerHTML = views[viewName]();

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
    const overlay = document.getElementById('scan-overlay');

    if (!video.srcObject) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    state.capturedImage = canvas.toDataURL('image/jpeg');
    video.pause();
    overlay.style.display = 'flex';

    setTimeout(() => startAnalysis(), 1500);
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
                render('camera'); // Show camera view briefly for consistency or go straight to analysis
                setTimeout(() => startAnalysis(), 500);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    input.click();
};

async function startAnalysis() {
    if (!state.apiKey) {
        setTimeout(() => {
            state.inventory = [
                { name: 'Huevos', icon: '🥚' },
                { name: 'Leche', icon: '🥛' },
                { name: 'Tomates', icon: '🍅' }
            ];
            state.recipes = MOCK_RECIPES;
            render('results');
        }, 2000);
        return;
    }

    try {
        const base64Data = state.capturedImage.split(',')[1];
        const prompt = `
        Analiza esta imagen de comida.
        Responde con JSON:
        {
            "inventory": [{"name": "Ingrediente", "icon": "Emoji"}],
            "recipes": [{"title": "Nombre", "time": "15 min", "difficulty": "Fácil", "icon": "Emoji", "desc": "Breve descripción"}]
        }
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

        state.inventory = result.inventory;
        state.recipes = result.recipes;
        render('results');
    } catch (error) {
        console.error(error);
        alert("Error en el análisis. Comprueba tu API Key.");
        goHome();
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    render('home');
});
