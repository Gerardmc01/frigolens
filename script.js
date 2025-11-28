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
        category: 'Desayuno',
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
        category: 'Almuerzo',
        desc: 'Jugoso pollo asado con base de tomates.',
        steps: [
            'Precalienta el horno a 180°C',
            'Corta los tomates en rodajas y colócalos en una bandeja',
            'Sazona el pollo con sal, pimienta y hierbas',
            'Coloca el pollo sobre los tomates',
            'Hornea durante 40-45 minutos hasta dorar'
        ],
        ingredients: ['Pollo', 'Tomates', 'Hierbas']
    },
    {
        id: '3',
        title: 'Ensalada César',
        time: '15 min',
        difficulty: 'Fácil',
        icon: '🥗',
        calories: '320 kcal',
        category: 'Cena',
        desc: 'Clásica ensalada con pollo y picatostes.',
        steps: [
            'Lava la lechuga y córtala',
            'Añade el pollo a la plancha cortado en tiras',
            'Agrega los picatostes y queso parmesano',
            'Aliña con salsa César al gusto'
        ],
        ingredients: ['Lechuga', 'Pollo', 'Pan', 'Queso']
    },
    {
        id: '4',
        title: 'Yogur con Frutas',
        time: '5 min',
        difficulty: 'Fácil',
        icon: '🥣',
        calories: '180 kcal',
        category: 'Snack',
        desc: 'Un snack saludable y refrescante.',
        steps: [
            'Vierte el yogur en un bol',
            'Añade frutas cortadas (fresas, plátano)',
            'Espolvorea granola o nueces por encima'
        ],
        ingredients: ['Yogur', 'Fruta', 'Granola']
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
                <div class="welcome-content">
                    <img src="logo.png" alt="FrigoLens Logo" style="height: 80px; width: auto; margin: 0 auto 24px; display: block; filter: brightness(0) invert(1);">
                    <div class="brand-tag">✨ Powered by AI</div>
                    <h1 class="welcome-title">Escanea.<br>Cocina.<br>Disfruta.</h1>
                    <p class="welcome-text">Apunta tu cámara a la nevera y descubre qué puedes cocinar en segundos.</p>
                    <button class="btn-primary" onclick="checkLoginAndScan()">
                        <i class="ph-fill ph-scan"></i> Empezar Ahora
                    </button>
                    <a href="#" onclick="render('login')" class="guest-link">Ya tengo cuenta</a>
                </div>
            </div>
        </div>
    `,

    login: () => `
        <div class="container">
            <div class="welcome-view">
                <div style="text-align: center; margin-bottom: 48px; width: 100%;">
                    <img src="logo.png" alt="Logo" style="width: 80px; height: auto; margin-bottom: 24px; animation: float 6s infinite; filter: brightness(0) invert(1);">
                    <h1 class="welcome-title" style="font-size: 2.5rem;">Bienvenido</h1>
                    <p class="welcome-text" style="margin-bottom: 0;">Tu cocina inteligente te espera.</p>
                </div>

                <div class="login-options" style="width: 100%; max-width: 320px; margin: 0 auto;">
                    <button class="btn-social" onclick="loginWithGoogle()" style="margin-bottom: 16px; justify-content: center; font-weight: 700; padding: 18px; border-radius: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                        <i class="ph-fill ph-google-logo" style="font-size: 1.4rem; color: #DB4437;"></i> Continuar con Google
                    </button>
                    
                    <div style="display: flex; align-items: center; gap: 16px; margin: 24px 0; color: rgba(255,255,255,0.6);">
                        <div style="height: 1px; background: rgba(255,255,255,0.3); flex: 1;"></div>
                        <span style="font-size: 0.9rem;">o</span>
                        <div style="height: 1px; background: rgba(255,255,255,0.3); flex: 1;"></div>
                    </div>

                    <button onclick="skipLogin()" style="width: 100%; padding: 16px; background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.3); color: white; border-radius: 20px; font-weight: 600; cursor: pointer; transition: all 0.2s; backdrop-filter: blur(5px);">
                        Entrar como Invitado
                    </button>
                </div>
            </div>
        </div>
    `,

    home: () => {
        const tip = getRandomTip();
        return `
        <div class="container">
            <!-- Mobile Header (Always Visible) -->
            <header class="home-header animate-fade-in">
                <div class="user-row">
                    <div class="user-info" onclick="showProfile()">
                        <div class="avatar">${state.user?.photo ? `<img src="${state.user.photo}" style="width:100%; height:100%; border-radius:50%;">` : '👩‍🍳'}</div>
                        <div class="greeting">
                            <p>${getGreeting()},</p>
                            <h1>${state.user ? state.user.name.split(' ')[0] : 'FrigoLender'}</h1>
                        </div>
                    </div>
                </div>
                
                <div class="search-bar">
                    <i class="ph ph-magnifying-glass" style="font-size: 1.2rem;"></i>
                    <input type="text" id="search-input" placeholder="Buscar recetas..." onkeyup="filterRecipes()" style="border: none; outline: none; width: 100%; font-size: 1rem; color: var(--text-main); background: transparent; font-family: var(--font-main);">
                </div>
            </header>

            <div class="categories-section animate-fade-in delay-1">
                <div class="categories-scroll" id="category-scroll">
                    <div class="category-pill active" onclick="selectCategory(this, 'all')">Todo</div>
                    <div class="category-pill" onclick="selectCategory(this, 'Desayuno')">Desayuno</div>
                    <div class="category-pill" onclick="selectCategory(this, 'Almuerzo')">Almuerzo</div>
                    <div class="category-pill" onclick="selectCategory(this, 'Cena')">Cena</div>
                    <div class="category-pill" onclick="selectCategory(this, 'Snack')">Snack</div>
                </div>
            </div>

            <div style="padding: 0 24px 32px;" class="animate-fade-in delay-2">
                <div class="tip-card">
                    <div style="font-size: 2.5rem;">${tip.icon}</div>
                    <div>
                        <h3 style="font-size: 0.9rem; margin-bottom: 6px; color: var(--primary); text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">Tip del Día</h3>
                        <p style="font-size: 0.95rem; line-height: 1.5; color: var(--text-main); font-weight: 500;">${tip.text}</p>
                    </div>
                </div>
            </div>

            <div class="popular-section animate-fade-in delay-3">
                <div class="section-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-right: 24px;">
                    <span style="font-size: 1.3rem; font-weight: 800;">Recetas Populares</span>
                    <button onclick="surpriseMe()" style="background: var(--primary-light); color: var(--primary); border: none; padding: 8px 16px; border-radius: 100px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: transform 0.2s;">
                        🎲 Sorpréndeme
                    </button>
                </div>
                <div class="horizontal-scroll" id="recipes-container">
                    ${[...MOCK_RECIPES, ...state.recipes].map(recipe => `
                        <div class="recipe-card-lg" data-title="${recipe.title.toLowerCase()}" data-category="${recipe.category || 'all'}" onclick="viewRecipe('${recipe.id}')">
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
        `;
    },

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
                    <div class="responsive-grid">
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
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                    <h1 style="font-size: 1.8rem; margin: 0;">Mi Perfil</h1>
                    <button onclick="render('settings')" style="background: white; border: none; width: 40px; height: 40px; border-radius: 50%; box-shadow: var(--shadow-sm); color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center;">
                        <i class="ph-fill ph-gear" style="font-size: 1.2rem;"></i>
                    </button>
                </div>
                
                ${state.user ? `
                    <div style="text-align: center; margin-bottom: 32px;">
                        <div class="avatar" style="width: 100px; height: 100px; margin: 0 auto 16px; font-size: 2.5rem; box-shadow: var(--shadow-float);">
                            ${state.user.photo ? `<img src="${state.user.photo}" style="width:100%; height:100%; border-radius:50%; object-fit: cover;">` : '👤'}
                        </div>
                        <h2 style="font-size: 1.5rem; margin-bottom: 4px; font-weight: 800;">${state.user.name}</h2>
                        <p style="color: var(--text-muted); font-size: 0.95rem;">${state.user.email}</p>
                    </div>

                    <div style="display: grid; gap: 16px; margin-bottom: 32px;">
                        <button onclick="render('preferences')" style="width: 100%; padding: 20px; background: white; border: none; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; box-shadow: var(--shadow-card);">
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <div style="width: 40px; height: 40px; background: #FFF2E5; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary); font-size: 1.2rem;">
                                    <i class="ph-fill ph-fork-knife"></i>
                                </div>
                                <div style="text-align: left;">
                                    <span style="display: block; font-weight: 700; color: var(--text-main);">Preferencias Alimentarias</span>
                                    <span style="font-size: 0.85rem; color: var(--text-muted);">Vegetariano, Alergias...</span>
                                </div>
                            </div>
                            <i class="ph ph-caret-right" style="color: var(--text-muted);"></i>
                        </button>

                        <button onclick="render('history')" style="width: 100%; padding: 20px; background: white; border: none; border-radius: 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; box-shadow: var(--shadow-card);">
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <div style="width: 40px; height: 40px; background: #E5F6FF; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #0099FF; font-size: 1.2rem;">
                                    <i class="ph-fill ph-clock-counter-clockwise"></i>
                                </div>
                                <div style="text-align: left;">
                                    <span style="display: block; font-weight: 700; color: var(--text-main);">Historial</span>
                                    <span style="font-size: 0.85rem; color: var(--text-muted);">Recetas anteriores</span>
                                </div>
                            </div>
                            <i class="ph ph-caret-right" style="color: var(--text-muted);"></i>
                        </button>
                    </div>

                    <button onclick="confirmLogout()" style="width: 100%; padding: 16px; background: #FFF5F5; border: none; color: #FF4B4B; border-radius: 100px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s;">
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

    settings: () => `
        <div class="container">
            <div style="padding: 24px;">
                <button onclick="render('profile')" style="border:none; background:none; font-size: 1.5rem; margin-bottom: 16px;">
                    <i class="ph ph-arrow-left"></i>
                </button>
                <h1 style="font-size: 1.8rem; margin-bottom: 24px;">Ajustes</h1>

                <div style="background: white; border-radius: 24px; box-shadow: var(--shadow-card); overflow: hidden;">
                    <div style="padding: 20px; border-bottom: 1px solid #F3F4F6; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 32px; height: 32px; background: #FFF2E5; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
                                <i class="ph-fill ph-bell"></i>
                            </div>
                            <span style="font-weight: 600;">Notificaciones</span>
                        </div>
                        <div style="width: 50px; height: 30px; background: #34C759; border-radius: 100px; position: relative; cursor: pointer;">
                            <div style="width: 26px; height: 26px; background: white; border-radius: 50%; position: absolute; top: 2px; right: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                        </div>
                    </div>
                    
                    <div style="padding: 20px; border-bottom: 1px solid #F3F4F6; display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 32px; height: 32px; background: #F3F4F6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-main);">
                                <i class="ph-fill ph-moon"></i>
                            </div>
                            <span style="font-weight: 600;">Tema Oscuro</span>
                        </div>
                        <div style="width: 50px; height: 30px; background: #E5E7EB; border-radius: 100px; position: relative; cursor: pointer;">
                            <div style="width: 26px; height: 26px; background: white; border-radius: 50%; position: absolute; top: 2px; left: 2px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                        </div>
                    </div>

                    <div style="padding: 20px; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 32px; height: 32px; background: #E5F6FF; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #0099FF;">
                                <i class="ph-fill ph-question"></i>
                            </div>
                            <span style="font-weight: 600;">Ayuda y Soporte</span>
                        </div>
                        <i class="ph ph-caret-right" style="color: var(--text-muted);"></i>
                    </div>
                </div>
                
                <div style="margin-top: 32px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
                    FrigoLens v2.0.0<br>Made with 🧡
                </div>
            </div>
        </div>
    `,

    preferences: () => `
        <div class="container">
            <div style="padding: 24px;">
                <button onclick="render('profile')" style="border:none; background:none; font-size: 1.5rem; margin-bottom: 16px;">
                    <i class="ph ph-arrow-left"></i>
                </button>
                <h1 style="font-size: 1.8rem; margin-bottom: 24px;">Preferencias</h1>
                
                <div style="display: grid; gap: 16px;">
                    ${Object.keys(state.preferences).map(key => `
                        <div onclick="togglePreference('${key}')" style="background: white; padding: 20px; border-radius: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: var(--shadow-sm); cursor: pointer;">
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <div style="font-size: 1.5rem;">
                                    ${key === 'vegetarian' ? '🥬' : key === 'vegan' ? '🌱' : key === 'glutenFree' ? '🌾' : '🥛'}
                                </div>
                                <span style="font-weight: 600; text-transform: capitalize;">
                                    ${key === 'vegetarian' ? 'Vegetariano' : key === 'vegan' ? 'Vegano' : key === 'glutenFree' ? 'Sin Gluten' : 'Sin Lácteos'}
                                </span>
                            </div>
                            <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${state.preferences[key] ? 'var(--primary)' : '#E5E7EB'}; background: ${state.preferences[key] ? 'var(--primary)' : 'transparent'}; display: flex; align-items: center; justify-content: center;">
                                ${state.preferences[key] ? '<i class="ph-bold ph-check" style="color: white; font-size: 0.8rem;"></i>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `,

    history: () => `
        <div class="container">
            <div style="padding: 24px;">
                <button onclick="render('profile')" style="border:none; background:none; font-size: 1.5rem; margin-bottom: 16px;">
                    <i class="ph ph-arrow-left"></i>
                </button>
                <h1 style="font-size: 1.8rem; margin-bottom: 24px;">Historial</h1>
                
                ${(!state.history || state.history.length === 0) ? `
                    <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                        <i class="ph ph-clock" style="font-size: 4rem; margin-bottom: 16px; display: block;"></i>
                        <p>Aún no has cocinado nada.<br>¡Escanea tu nevera para empezar!</p>
                    </div>
                ` : `
                    <div style="display: grid; gap: 16px;">
                        ${state.history.map(item => `
                            <div style="background: white; padding: 16px; border-radius: 20px; box-shadow: var(--shadow-sm);">
                                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">
                                    ${new Date(item.date).toLocaleDateString()}
                                </div>
                                <div style="font-weight: 600; margin-bottom: 8px;">
                                    Ingredientes: ${item.ingredients.join(', ')}
                                </div>
                                <div style="display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px;">
                                    ${item.recipes.map(r => `
                                        <div onclick="viewRecipe('${r.id}')" style="background: #F9FAFB; padding: 8px 12px; border-radius: 12px; font-size: 0.85rem; white-space: nowrap; cursor: pointer;">
                                            ${r.icon} ${r.title}
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
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
                        <i class="ph ph-share-network"></i> Compartir Receta
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
            <div style="padding: 24px 24px 100px;">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px;">
                    <button onclick="startCamera()" style="border:none; background: #F3F4F6; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                        <i class="ph ph-arrow-left"></i>
                    </button>
                    <h1 style="font-size: 1.5rem; margin: 0;">Confirmar Ingredientes</h1>
                </div>

                <!-- Photo Preview -->
                <div style="margin-bottom: 24px; border-radius: 20px; overflow: hidden; height: 120px; position: relative;">
                    <img src="${state.capturedImage}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;">
                    <div style="position: absolute; bottom: 0; left: 0; width: 100%; padding: 10px; background: linear-gradient(to top, rgba(0,0,0,0.7), transparent); color: white; font-size: 0.8rem; font-weight: 600;">
                        📸 Tu nevera
                    </div>
                </div>
                
                <!-- Ingredients Grid -->
                <h3 style="margin-bottom: 12px; font-size: 1rem;">He encontrado esto:</h3>
                <div class="selection-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 12px; margin-bottom: 32px;">
                    ${state.inventory.map(item => `
                        <div class="ingredient-card ${state.selectedIngredients.has(item.name) ? 'selected' : ''}" 
                             onclick="toggleIngredient('${item.name}')"
                             style="background: ${state.selectedIngredients.has(item.name) ? 'var(--primary-light)' : 'white'}; border: 2px solid ${state.selectedIngredients.has(item.name) ? 'var(--primary)' : '#F3F4F6'}; padding: 12px; border-radius: 16px; text-align: center; cursor: pointer; transition: all 0.2s;">
                            <div style="font-size: 2rem; margin-bottom: 4px;">${item.icon}</div>
                            <span style="font-weight: 600; font-size: 0.85rem; color: var(--text-main);">${item.name}</span>
                        </div>
                    `).join('')}
                    <div onclick="addManualIngredient()" style="border: 2px dashed #E5E7EB; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 16px; color: var(--text-muted); cursor: pointer; min-height: 100px;">
                        <i class="ph ph-plus" style="font-size: 1.5rem; margin-bottom: 4px;"></i>
                        <span style="font-size: 0.8rem;">Añadir</span>
                    </div>
                </div>

                <!-- Cooking Options -->
                <h3 style="margin-bottom: 12px; font-size: 1rem;">¿Cómo quieres cocinar hoy?</h3>
                <div style="background: white; padding: 20px; border-radius: 20px; box-shadow: var(--shadow-sm); margin-bottom: 24px;">
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px;">TIEMPO</label>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="setOption('time', 'fast')" class="opt-btn ${state.options.time === 'fast' ? 'active' : ''}" style="flex: 1; padding: 10px; border-radius: 12px; border: 1px solid #E5E7EB; background: white; font-size: 0.9rem;">⚡ Rápido</button>
                            <button onclick="setOption('time', 'slow')" class="opt-btn ${state.options.time === 'slow' ? 'active' : ''}" style="flex: 1; padding: 10px; border-radius: 12px; border: 1px solid #E5E7EB; background: white; font-size: 0.9rem;">🕰️ Elaborado</button>
                        </div>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px;">ESTILO</label>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="setOption('style', 'light')" class="opt-btn ${state.options.style === 'light' ? 'active' : ''}" style="flex: 1; padding: 10px; border-radius: 12px; border: 1px solid #E5E7EB; background: white; font-size: 0.9rem;">🥗 Ligero</button>
                            <button onclick="setOption('style', 'heavy')" class="opt-btn ${state.options.style === 'heavy' ? 'active' : ''}" style="flex: 1; padding: 10px; border-radius: 12px; border: 1px solid #E5E7EB; background: white; font-size: 0.9rem;">🥘 Contundente</button>
                        </div>
                    </div>
                </div>

                <!-- Floating Action Button -->
                <div style="position: fixed; bottom: 24px; left: 0; width: 100%; padding: 0 24px; z-index: 100;">
                    <button class="btn-primary" onclick="generateRecipes()" style="box-shadow: 0 10px 30px rgba(255, 107, 0, 0.4); display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <i class="ph-fill ph-magic-wand"></i> Crear Recetas
                    </button>
                </div>
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
                
                <div class="responsive-grid">
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

// Cooking Tips
// Cooking Tips - Spicy & Fun Edition 🌶️
const COOKING_TIPS = [
    { icon: '🥑', text: 'Si tu aguacate está duro como una piedra, envuélvelo en papel con un plátano. ¡Madurará más rápido que tus decisiones un viernes noche!' },
    { icon: '🔥', text: '¿La comida te quedó sosa? Un chorrito de limón o vinagre arregla casi cualquier desastre. ¡Es el maquillaje de la cocina!' },
    { icon: '🍝', text: 'Guarda un poco del agua de cocer la pasta. Es oro líquido para que tu salsa se pegue mejor que tu ex.' },
    { icon: '🧅', text: '¿Lloras con la cebolla? Métela 10 min al congelador antes de cortar. ¡Deja el drama para las telenovelas!' },
    { icon: '🧂', text: 'Si te pasaste de sal, tira una patata pelada a la olla. Chupará la sal como si no hubiera un mañana.' },
    { icon: '🥩', text: 'Deja reposar la carne antes de cortarla. Si la cortas caliente, se desangra y se seca. ¡Paciencia, chef!' },
    { icon: '🍷', text: 'Cocina con vino que te beberías. Si no te gusta en la copa, no te gustará en el plato. ¡Salud!' }
];

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 20) return 'Buenas tardes';
    return 'Buenas noches';
};

const getRandomTip = () => {
    const dayIndex = new Date().getDate() % COOKING_TIPS.length;
    return COOKING_TIPS[dayIndex];
};

// Logic
function render(viewName, param) {
    state.view = viewName;
    app.innerHTML = views[viewName](param);

    if (viewName === 'camera') {
        initCamera();
    }
    window.scrollTo(0, 0);
}

window.surpriseMe = () => {
    const allRecipes = [...MOCK_RECIPES, ...state.recipes];
    const randomRecipe = allRecipes[Math.floor(Math.random() * allRecipes.length)];
    viewRecipe(randomRecipe.id);
};

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

// Search and Filter Functions
state.activeCategory = 'all';

window.selectCategory = (element, category) => {
    // Update active class
    document.querySelectorAll('.category-pill').forEach(el => el.classList.remove('active'));
    element.classList.add('active');

    // Update state and filter
    state.activeCategory = category;
    filterRecipes();
};

window.filterRecipes = () => {
    const input = document.getElementById('search-input');
    if (!input) return;

    const query = input.value.toLowerCase();
    const category = state.activeCategory;

    const cards = document.querySelectorAll('.recipe-card-lg');

    cards.forEach(card => {
        const title = card.getAttribute('data-title');
        const cardCategory = card.getAttribute('data-category');

        const matchesSearch = title.includes(query);
        const matchesCategory = category === 'all' || cardCategory === category;

        if (matchesSearch && matchesCategory) {
            card.style.display = 'block';
            // Add a subtle animation when appearing
            card.style.animation = 'fadeIn 0.3s ease forwards';
        } else {
            card.style.display = 'none';
        }
    });
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
    if (!video) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            },
            audio: false
        });
        video.srcObject = stream;
        // Explicitly play to ensure it starts on mobile
        await video.play();
    } catch (err) {
        console.error("Camera error", err);
        alert("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
        goHome();
    }
}

window.capturePhoto = () => {
    const video = document.getElementById('camera-feed');
    const canvas = document.getElementById('camera-canvas');

    if (!video || !video.srcObject) return;

    // Set canvas dimensions to match video stream
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop stream to save battery and freeze frame effect
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());

    state.capturedImage = canvas.toDataURL('image/jpeg', 0.8);

    // Visual feedback
    video.style.opacity = '0.5';

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

// --- Logic & Actions ---

window.addManualIngredient = () => {
    const name = prompt("¿Qué ingrediente quieres añadir?");
    if (name && name.trim()) {
        const cleanName = name.trim();
        // Add to inventory with a generic icon if not present
        if (!state.inventory.find(i => i.name.toLowerCase() === cleanName.toLowerCase())) {
            state.inventory.push({ name: cleanName, icon: '🥘' });
        }
        state.selectedIngredients.add(cleanName);
        render('selection');
    }
};

window.setOption = (type, value) => {
    if (!state.options) state.options = { time: 'fast', style: 'light' };
    state.options[type] = value;
    render('selection'); // Re-render to update active buttons
};

async function identifyIngredients() {
    render('loading', 'Analizando tu nevera...');

    // Initialize options
    if (!state.options) state.options = { time: 'fast', style: 'light' };

    if (!state.apiKey) {
        // Demo mode fallback (keep this for users without key, but make it clear)
        setTimeout(() => {
            alert("Modo Demo: Usando ingredientes de prueba. Configura tu API Key en Ajustes para usar la IA real.");
            state.inventory = [
                { name: 'Huevos', icon: '🥚' },
                { name: 'Leche', icon: '🥛' },
                { name: 'Tomates', icon: '🍅' }
            ];
            state.selectedIngredients = new Set(state.inventory.map(i => i.name));
            render('selection');
        }, 1000);
        return;
    }

    try {
        const base64Data = state.capturedImage.split(',')[1];
        const prompt = `
        ACTÚA COMO UN CHEF EXPERTO. Identifica los ingredientes en esta imagen.
        Si la imagen es negra, borrosa o no hay comida, responde con una lista VACÍA []. NO INVENTES.
        Responde ESTRICTAMENTE con este JSON:
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

        state.inventory = Array.isArray(result) ? result : [];

        if (state.inventory.length === 0) {
            alert("No he podido detectar comida clara. 🧐\n¡Añade los ingredientes manualmente!");
        }

        state.selectedIngredients = new Set(state.inventory.map(i => i.name));
        render('selection');
    } catch (error) {
        console.error(error);
        alert("Error al analizar la imagen. Inténtalo de nuevo o añade manual.");
        state.inventory = [];
        state.selectedIngredients = new Set();
        render('selection');
    }
}

async function generateRecipes() {
    if (state.selectedIngredients.size === 0) {
        alert("¡Tu cesta está vacía! Añade al menos un ingrediente.");
        return;
    }

    render('loading', 'El Chef está creando tus recetas... 👨‍🍳');

    try {
        const ingredientsList = Array.from(state.selectedIngredients).join(', ');

        const timePrompt = state.options.time === 'fast' ? 'RÁPIDAS (menos de 20 min)' : 'ELABORADAS (cocción lenta, gourmet)';
        const stylePrompt = state.options.style === 'light' ? 'LIGERAS y saludables' : 'CONTUNDENTES y ricas';

        // Load preferences
        const prefsText = Object.entries(state.preferences)
            .filter(([k, v]) => v)
            .map(([k]) => k === 'vegetarian' ? 'vegetariana' : k === 'vegan' ? 'vegana' : k === 'glutenFree' ? 'sin gluten' : 'sin lácteos')
            .join(', ');

        const prompt = `
        Crea 5 recetas detalladas y deliciosas.
        Estilo: ${timePrompt} y ${stylePrompt}.
        Ingredientes disponibles: ${ingredientsList}.
        ${prefsText ? `RESTRICCIONES OBLIGATORIAS: ${prefsText}.` : ''}
        
        Responde SOLO con un JSON:
        [{
            "id": "unique_id",
            "title": "Nombre Atractivo",
            "time": "XX min",
            "difficulty": "Fácil/Medio/Difícil",
            "icon": "Emoji representativo",
            "calories": "XXX kcal",
            "desc": "Descripción apetitosa de 2 frases.",
            "steps": ["Paso 1 detallado", "Paso 2 detallado", ...],
            "ingredients": ["Cantidad + Ingrediente 1", "Cantidad + Ingrediente 2", ...]
        }]
        `;

        if (!state.apiKey) {
            // Mock fallback
            setTimeout(() => {
                state.recipes = MOCK_RECIPES;
                render('results');
            }, 1500);
            return;
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${state.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const result = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

        state.recipes = result;
        await saveToHistory({ ingredients: Array.from(state.selectedIngredients), recipes: result });
        render('results');

    } catch (error) {
        console.error(error);
        alert("Hubo un problema creando las recetas. Inténtalo de nuevo.");
        render('selection');
    }
}

window.saveToHistory = async (data) => {
    const historyItem = {
        id: Date.now(),
        date: new Date().toISOString(),
        ingredients: data.ingredients,
        recipes: data.recipes
    };

    state.history.unshift(historyItem);
    // Keep only last 20 items
    if (state.history.length > 20) state.history.pop();

    localStorage.setItem('cooking_history', JSON.stringify(state.history));
};

window.shareRecipe = async (recipeId) => {
    const recipe = [...MOCK_RECIPES, ...state.recipes].find(r => r.id === recipeId);
    if (!recipe) return;

    const text = `¡Mira esta receta de ${recipe.title} que encontré en FrigoLens! 🍳\n\n${recipe.desc}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: recipe.title,
                text: text,
                url: window.location.href
            });
        } catch (err) {
            console.log('Error sharing:', err);
        }
    } else {
        // Fallback
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    }
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Load API Key
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) state.apiKey = savedKey;

    // Load History
    const savedHistory = localStorage.getItem('cooking_history');
    if (savedHistory) {
        try {
            state.history = JSON.parse(savedHistory);
        } catch (e) {
            state.history = [];
        }
    }

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
                } else {
                    render('welcome');
                }
            });
        } else {
            render('welcome');
        }
    }
});
