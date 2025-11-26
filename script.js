// State Management
const state = {
    view: 'welcome',
    inventory: [],
    selectedIngredients: new Set(),
    recipes: [],
    favorites: [],
    history: [],
    preferences: {
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        dairyFree: false
    },
    capturedImage: null,
    apiKey: localStorage.getItem('gemini_api_key') || '',
    user: null,
    currentRecipe: null
};

// Mock Data
const MOCK_RECIPES = [
    {
        id: '1',
        title: 'Tortilla Francesa Deluxe',
        time: '10 min',
        difficulty: 'Fácil',
        icon: '🍳',
        calories: '250 kcal',
        desc: 'Rápida, nutritiva y deliciosa.',
        steps: [
            'Bate 3 huevos en un bol con sal y pimienta',
            'Calienta una sartén con aceite a fuego medio',
            'Vierte los huevos y cocina 2-3 minutos',
            'Dobla por la mitad y sirve caliente'
        ],
        ingredients: ['Huevos', 'Sal', 'Aceite']
    },
    {
        id: '2',
        title: 'Pollo al Horno con Tomate',
        time: '45 min',
        difficulty: 'Medio',
        icon: '🥘',
        calories: '450 kcal',
        desc: 'Jugoso pollo asado con base de tomates.',
        steps: [
            'Precalienta el horno a 180°C',
            'Corta los tomates en rodajas y colócalos en una bandeja',
            'Sazona el pollo con sal, pimienta y hierbas',
            'Coloca el pollo sobre los tomates',
            'Hornea durante 40-45 minutos hasta dorar'
        ],
        ingredients: ['Pollo', 'Tomates', 'Hierbas']
    }
];

// DOM Elements
const app = document.getElementById('app');

// Firebase Functions (with localStorage fallback)
async function saveFavorite(recipe) {
    if (!state.user) return;

    // Use localStorage for now
    const favKey = `favorites_${state.user.email}`;
    const favorites = JSON.parse(localStorage.getItem(favKey) || '[]');
    if (!favorites.some(f => f.id === recipe.id)) {
        favorites.push(recipe);
        localStorage.setItem(favKey, JSON.stringify(favorites));
    }
    await loadFavorites();
}

async function removeFavorite(recipeId) {
    if (!state.user) return;

    const favKey = `favorites_${state.user.email}`;
    const favorites = JSON.parse(localStorage.getItem(favKey) || '[]');
    const filtered = favorites.filter(f => f.id !== recipeId);
    localStorage.setItem(favKey, JSON.stringify(filtered));
    await loadFavorites();
}

async function loadFavorites() {
    if (!state.user) {
        state.favorites = [];
        return;
    }

    const favKey = `favorites_${state.user.email}`;
    state.favorites = JSON.parse(localStorage.getItem(favKey) || '[]');
}

async function saveToHistory(scan) {
    if (!state.user) return;

    const histKey = `history_${state.user.email}`;
    const history = JSON.parse(localStorage.getItem(histKey) || '[]');
    history.unshift({
        ...scan,
        createdAt: new Date().toISOString()
    });
    // Keep only last 20 scans
    if (history.length > 20) history.pop();
    localStorage.setItem(histKey, JSON.stringify(history));
}

// Components
const BottomNav = (activeTab) => `
    <nav class="bottom-nav">
        <button class="nav-item ${activeTab === 'home' ? 'active' : ''}" onclick="goHome()">
            <i class="ph-fill ph-house"></i>
        </button>
        <button class="nav-item ${activeTab === 'favorites' ? 'active' : ''}" onclick="showFavorites()">
            <i class="ph${activeTab === 'favorites' ? '-fill' : ''} ph-heart"></i>
        </button>
        <div class="scan-fab" onclick="startCamera()">
            <i class="ph-fill ph-scan"></i>
        </div>
        <button class="nav-item ${activeTab === 'history' ? 'active' : ''}" onclick="showHistory()">
            <i class="ph ph-clock-counter-clockwise"></i>
        </button>
        <button class="nav-item ${activeTab === 'profile' ? 'active' : ''}" onclick="showProfile()">
            <i class="ph${activeTab === 'profile' ? '-fill' : ''} ph-user"></i>
        </button>
    </nav>
`;

// Views
const views = {
    welcome: () => `
        <div class="container">
            <div class="welcome-view">
                <div class="welcome-image-container">
                    <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000&auto=format&fit=crop" class="welcome-img" alt="Food">
                </div>
                <div class="welcome-content">
                    <div class="brand-tag">✨ Powered by AI</div>
                    <h1 class="welcome-title">Escanea.<br>Cocina.<br>Disfruta.</h1>
                    <p class="welcome-text">Apunta tu cámara a la nevera y descubre qué puedes cocinar en segundos.</p>
                    <button class="btn-primary" onclick="checkLoginAndScan()">
                        <i class="ph-fill ph-scan"></i> Empezar Ahora
                    </button>
                </div>
            </div>
        </div>
    `,

    login: () => `
        <div class="container">
            <div class="welcome-view" style="justify-content: center; padding: 32px;">
                <div style="text-align: center; margin-bottom: 40px;">
                    <h1 class="welcome-title">Bienvenido</h1>
                    <p class="welcome-text">Inicia sesión para guardar tus recetas favoritas.</p>
                </div>

                <div class="login-options">
                    <button class="btn-social btn-google" onclick="loginWithGoogle()">
                        <i class="ph-fill ph-google-logo"></i> Continuar con Google
                    </button>
                </div>

                <p style="text-align: center; margin-top: 32px; color: var(--text-muted); font-size: 0.9rem;">
                    ¿Solo quieres probar? <a href="#" onclick="skipLogin()" style="color: var(--primary); font-weight: 600; text-decoration: none;">Continuar sin cuenta</a>
                </p>
            </div>
        </div>
    `,

    home: () => `
        <div class="container">
            <header class="home-header">
                <div class="user-row">
                    <div class="user-info">
                        <div class="avatar">${state.user?.photo ? `<img src="${state.user.photo}" style="width:100%; height:100%; border-radius:50%;">` : '👩‍🍳'}</div>
                        <div class="greeting">
                            <p>Buenas tardes,</p>
                            <h1>${state.user ? state.user.name.split(' ')[0] : 'FrigoLender'}</h1>
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
                        <div class="recipe-card-lg" onclick="viewRecipe('${recipe.id}')">
                            <div class="recipe-img-lg">
                                ${recipe.icon}
                                <button class="fav-btn" onclick="event.stopPropagation(); toggleFavorite('${recipe.id}')">
                                    <i class="ph${state.favorites.some(f => f.id === recipe.id) ? '-fill' : ''} ph-heart"></i>
                                </button>
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

            ${BottomNav('home')}
        </div>
    `,

    favorites: () => `
        <div class="container">
            <div style="padding: 24px;">
                <h1 style="font-size: 1.8rem; margin-bottom: 24px;">Mis Favoritos</h1>
                
                ${state.favorites.length === 0 ? `
                    <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                        <i class="ph ph-heart" style="font-size: 4rem; margin-bottom: 16px; display: block;"></i>
                        <p>Aún no tienes favoritos.<br>¡Empieza a guardar recetas que te gusten!</p>
                    </div>
                ` : `
                    <div style="display: grid; gap: 20px;">
                        ${state.favorites.map(recipe => `
                            <div class="recipe-card-lg" onclick="viewRecipe('${recipe.id}')">
                                <div class="recipe-img-lg" style="height: 160px;">
                                    ${recipe.icon}
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
                `}
            </div>
            ${BottomNav('favorites')}
        </div>
    `,

    profile: () => `
        <div class="container">
            <div style="padding: 24px;">
                <h1 style="font-size: 1.8rem; margin-bottom: 32px;">Mi Perfil</h1>
                
                ${state.user ? `
                    <div style="text-align: center; margin-bottom: 32px;">
                        <div class="avatar" style="width: 80px; height: 80px; margin: 0 auto 16px; font-size: 2rem;">
                            ${state.user.photo ? `<img src="${state.user.photo}" style="width:100%; height:100%; border-radius:50%; object-fit: cover;">` : '👤'}
                        </div>
                        <h2 style="font-size: 1.3rem; margin-bottom: 4px;">${state.user.name}</h2>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">${state.user.email}</p>
                    </div>

                    <div style="background: white; border-radius: 20px; padding: 20px; margin-bottom: 20px; box-shadow: var(--shadow-card);">
                        <button onclick="openSettings()" style="width: 100%; padding: 16px; background: var(--bg-input); border: none; border-radius: 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <i class="ph ph-gear" style="font-size: 1.5rem;"></i>
                                <span style="font-weight: 600;">Configuración</span>
                            </div>
                            <i class="ph ph-caret-right"></i>
                        </button>
                    </div>

                    <button onclick="confirmLogout()" style="width: 100%; padding: 16px; background: white; border: 1px solid #FF4B4B; color: #FF4B4B; border-radius: 100px; font-weight: 600; cursor: pointer; box-shadow: var(--shadow-card);">
                        <i class="ph ph-sign-out"></i> Cerrar Sesión
                    </button>
                ` : `
                    <div style="text-align: center; padding: 40px 20px;">
                        <i class="ph ph-user-circle" style="font-size: 4rem; color: var(--text-muted); display: block; margin-bottom: 16px;"></i>
                        <p style="color: var(--text-muted); margin-bottom: 24px;">Inicia sesión para guardar tus recetas favoritas</p>
                        <button class="btn-primary" onclick="render('login')">Iniciar Sesión</button>
                    </div>
                `}
            </div>
            ${BottomNav('profile')}
        </div>
    `,

    recipeDetail: () => {
        const recipe = state.currentRecipe;
        if (!recipe) return views.home();

        return `
            <div class="container">
                <div style="padding: 24px;">
                    <button onclick="goHome()" style="border:none; background:none; font-size: 1.5rem; margin-bottom: 16px;">
                        <i class="ph ph-arrow-left"></i>
                    </button>
                    
                    <div class="recipe-img-lg" style="height: 250px; margin-bottom: 24px;">
                        ${recipe.icon}
                    </div>
                    
                    <h1 style="font-size: 2rem; margin-bottom: 16px;">${recipe.title}</h1>
                    
                    <div class="recipe-meta" style="margin-bottom: 24px;">
                        <div class="meta-item"><i class="ph-fill ph-clock"></i> ${recipe.time}</div>
                        <div class="meta-item">|</div>
                        <div class="meta-item"><i class="ph-fill ph-fire"></i> ${recipe.difficulty}</div>
                        <div class="meta-item">|</div>
                        <div class="meta-item">${recipe.calories}</div>
                    </div>
                    
                    <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 32px;">${recipe.desc}</p>
                    
                    <h3 style="margin-bottom: 16px;">Ingredientes</h3>
                    <ul style="margin-bottom: 32px; padding-left: 20px;">
                        ${recipe.ingredients.map(ing => `<li style="margin-bottom: 8px;">${ing}</li>`).join('')}
                    </ul>
                    
                    <h3 style="margin-bottom: 16px;">Pasos</h3>
                    <ol style="margin-bottom: 32px; padding-left: 20px;">
                        ${recipe.steps.map(step => `<li style="margin-bottom: 12px; line-height: 1.5;">${step}</li>`).join('')}
                    </ol>
                    
                    <button class="btn-primary" onclick="shareRecipe('${recipe.id}')">
                        <i class="ph ph-share-network"></i> Compartir por WhatsApp
                    </button>
                    
                    <div style="height: 100px;"></div>
                </div>
            </div>
        `;
    },

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
                
                <div style="margin: 20px 0; padding: 16px; background: var(--primary-light); border-radius: 16px;">
                    <p style="font-size: 0.9rem; color: var(--text-main); margin-bottom: 12px;"><strong>Preferencias:</strong></p>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        ${Object.entries(state.preferences).map(([key, value]) => `
                            <button onclick="togglePreference('${key}')" style="padding: 6px 12px; border-radius: 100px; border: 1px solid var(--primary); background: ${value ? 'var(--primary)' : 'white'}; color: ${value ? 'white' : 'var(--primary)'}; font-size: 0.85rem; cursor: pointer;">
                                ${key === 'vegetarian' ? '🥬 Vegetariano' : key === 'vegan' ? '🌱 Vegano' : key === 'glutenFree' ? '🌾 Sin Gluten' : '🥛 Sin Lácteos'}
                            </button>
                        `).join('')}
                    </div>
                </div>
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
                        <div class="recipe-card-lg" style="box-shadow: 0 4px 20px rgba(0,0,0,0.08);" onclick="viewRecipe('${recipe.id}')">
                            <div class="recipe-img-lg" style="height: 200px;">
                                ${recipe.icon}
                                <button class="fav-btn" onclick="event.stopPropagation(); toggleFavorite('${recipe.id}')">
                                    <i class="ph${state.favorites.some(f => f.id === recipe.id) ? '-fill' : ''} ph-heart"></i>
                                </button>
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
                            <button class="btn-primary" style="padding: 12px; font-size: 0.9rem;" onclick="event.stopPropagation(); viewRecipe('${recipe.id}')">Ver Receta Completa</button>
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
            
            ${state.user ? `
                <div style="text-align: center; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border-light);">
                    <div class="avatar" style="width: 60px; height: 60px; margin: 0 auto 12px;">
                        ${state.user.photo ? `<img src="${state.user.photo}" style="width:100%; height:100%; border-radius:50%;">` : '👤'}
                    </div>
                    <p style="font-weight: 600;">${state.user.name}</p>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">${state.user.email}</p>
                    <button onclick="logout()" style="margin-top: 12px; padding: 8px 16px; background: none; border: 1px solid var(--primary); color: var(--primary); border-radius: 100px; cursor: pointer;">
                        Cerrar Sesión
                    </button>
                </div>
            ` : ''}
            
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

window.loginWithGoogle = async () => {
    try {
        const googleProvider = new window.GoogleAuthProvider();
        const result = await window.signInWithPopup(window.firebaseAuth, googleProvider);
        const user = result.user;

        state.user = {
            name: user.displayName || 'FrigoLender',
            email: user.email,
            photo: user.photoURL
        };

        localStorage.setItem('user', JSON.stringify(state.user));
        await loadFavorites();
        goHome();
    } catch (error) {
        console.error("Error en login:", error);
        if (error.code === 'auth/popup-closed-by-user') {
            // User closed popup, no need to show error
            return;
        }
        alert("Error al iniciar sesión con Google. Inténtalo de nuevo.");
    }
};

window.skipLogin = () => {
    // Allow user to continue without login
    state.user = null;
    goHome();
};

window.confirmLogout = () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        logout();
    }
};

window.logout = async () => {
    try {
        if (window.firebaseAuth.currentUser) {
            await window.signOut(window.firebaseAuth);
        }
        localStorage.removeItem('user');
        state.user = null;
        state.favorites = [];
        render('welcome');
    } catch (error) {
        console.error("Error en logout:", error);
        alert("Error al cerrar sesión");
    }
};

window.saveApiKey = () => {
    const input = document.getElementById('api-key-input-profile');
    if (input) {
        state.apiKey = input.value.trim();
        localStorage.setItem('gemini_api_key', state.apiKey);
        alert("¡API Key guardada!");
    }
};

window.checkLoginAndScan = () => {
    if (state.user) {
        startCamera();
    } else {
        render('login');
    }
};

window.goHome = () => render('home');
window.startCamera = () => render('camera');
window.showFavorites = () => render('favorites');
window.showHistory = () => alert('Historial próximamente');
window.showProfile = () => render('profile');

window.viewRecipe = (recipeId) => {
    const recipe = [...MOCK_RECIPES, ...state.recipes].find(r => r.id === recipeId);
    if (recipe) {
        state.currentRecipe = recipe;
        render('recipeDetail');
    }
};

window.toggleFavorite = async (recipeId) => {
    const recipe = [...MOCK_RECIPES, ...state.recipes].find(r => r.id === recipeId);
    if (!recipe) return;

    const isFav = state.favorites.some(f => f.id === recipeId);
    if (isFav) {
        await removeFavorite(recipeId);
    } else {
        await saveFavorite(recipe);
    }
    render(state.view); // Re-render current view
};

window.shareRecipe = (recipeId) => {
    const recipe = state.currentRecipe;
    if (!recipe) return;

    const text = `🍳 *${recipe.title}*\n\n${recipe.desc}\n\n⏱️ ${recipe.time} | 🔥 ${recipe.difficulty}\n\nDescubre más recetas en FrigoLens!`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
};

window.togglePreference = (key) => {
    state.preferences[key] = !state.preferences[key];
    render('selection');
};

window.openSettings = () => {
    if (!document.getElementById('settings-modal')) {
        document.body.insertAdjacentHTML('beforeend', settingsModal);
    }
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
            state.recipes = MOCK_RECIPES.map(r => ({ ...r, id: Date.now() + Math.random() }));
            render('results');
        }, 1500);
        return;
    }

    try {
        const ingredientsList = Array.from(state.selectedIngredients).join(', ');
        const prefsText = Object.entries(state.preferences)
            .filter(([k, v]) => v)
            .map(([k]) => k === 'vegetarian' ? 'vegetariana' : k === 'vegan' ? 'vegana' : k === 'glutenFree' ? 'sin gluten' : 'sin lácteos')
            .join(', ');

        const prompt = `
        Crea 3 recetas detalladas usando PRINCIPALMENTE estos ingredientes: ${ingredientsList}.
        ${prefsText ? `Las recetas deben ser: ${prefsText}.` : ''}
        Incluye pasos detallados.
        Responde SOLO con un JSON:
        [{
            "id": "unique_id",
            "title": "Nombre",
            "time": "XX min",
            "difficulty": "Fácil/Medio",
            "icon": "Emoji",
            "calories": "XXX kcal",
            "desc": "Descripción breve",
            "steps": ["Paso 1", "Paso 2", ...],
            "ingredients": ["Ingrediente 1", "Ingrediente 2", ...]
        }]
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

        // Save to history
        await saveToHistory({
            ingredients: Array.from(state.selectedIngredients),
            recipes: result
        });

        render('results');
    } catch (error) {
        console.error(error);
        alert("Error generando recetas.");
        render('selection');
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        state.user = JSON.parse(savedUser);
        loadFavorites();
        render('home');
    } else {
        if (window.onAuthStateChanged && window.firebaseAuth) {
            window.onAuthStateChanged(window.firebaseAuth, (user) => {
                if (user) {
                    state.user = {
                        name: user.displayName || 'FrigoLender',
                        email: user.email,
                        photo: user.photoURL
                    };
                    localStorage.setItem('user', JSON.stringify(state.user));
                    loadFavorites();
                    if (state.view === 'welcome' || state.view === 'login') {
                        render('home');
                    }
                }
            });
        }
        render('welcome');
    }
});
