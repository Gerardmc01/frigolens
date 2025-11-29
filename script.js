import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai";

// --- State Management ---
const state = {
    view: 'welcome',
    apiKey: localStorage.getItem('gemini_api_key') || '',
    activeChef: null,
    chatHistory: {}, // { chefId: [{role: 'user', text: ''}, ...] }
    mealPlan: JSON.parse(localStorage.getItem('mealPlan')) || {},
    user: JSON.parse(localStorage.getItem('user')) || { name: 'Guest' }
};

// --- Chef Personas (Spanish Rebrand) ---
const CHEFS = [
    {
        id: 'pantry',
        name: 'Chef de Despensa',
        role: 'Aprovechamiento',
        desc: 'Dime qué ingredientes tienes y te diré qué cocinar.',
        icon: 'ph-basket',
        color: '#FF9800',
        systemPrompt: "Eres el Chef de Despensa de ChefIA. Tu misión es evitar el desperdicio de alimentos. El usuario te dirá qué ingredientes tiene. Tú debes sugerir recetas deliciosas y factibles usando PRINCIPALMENTE esos ingredientes. Si faltan básicos (sal, aceite), asume que los tienen. Sé creativo pero realista."
    },
    {
        id: 'master',
        name: 'Chef Maestro',
        role: 'Alta Cocina',
        desc: 'Técnicas culinarias, trucos y recetas gourmet.',
        icon: 'ph-chef-hat',
        color: '#F44336',
        systemPrompt: "Eres el Chef Maestro de ChefIA. Un experto culinario de talla mundial. Tu objetivo es enseñar. No solo des recetas, explica el 'por qué' de las técnicas. Ayuda al usuario a mejorar sus habilidades, sugiere emplatados y trucos de profesional. Tu tono es inspirador y educativo."
    },
    {
        id: 'macro',
        name: 'NutriChef',
        role: 'Salud y Calorías',
        desc: 'Analizo tus platos y cuento las calorías por ti.',
        icon: 'ph-heart-beat',
        color: '#4CAF50',
        systemPrompt: "Eres NutriChef de ChefIA. Eres un nutricionista experto y amable. Cuando el usuario te describa una comida o envíe una foto, tu trabajo es estimar las calorías y macronutrientes (proteínas, carbos, grasas). Ofrece alternativas más saludables si es necesario. Si es una foto, analiza visualmente las porciones."
    },
    {
        id: 'plan',
        name: 'Planificador',
        role: 'Menú Semanal',
        desc: 'Organizo tus comidas de la semana y la lista de compra.',
        icon: 'ph-calendar-plus',
        color: '#2196F3',
        systemPrompt: "Eres el Planificador de ChefIA. Creas planes de alimentación semanales estructurados. Pregunta por objetivos (perder peso, ganar músculo, ahorro de tiempo) y preferencias. Genera una tabla clara de Lunes a Domingo y una lista de la compra consolidada al final."
    },
    {
        id: 'mixology',
        name: 'Coctelero',
        role: 'Bebidas y Mixología',
        desc: 'Cócteles, maridajes y bebidas para cada ocasión.',
        icon: 'ph-martini',
        color: '#9C27B0',
        systemPrompt: "Eres el Coctelero de ChefIA. Experto en mixología. Sugiere cócteles (con y sin alcohol), vinos para maridar con comidas, y cafés especiales. Tu estilo es elegante y sofisticado."
    }
];

// --- DOM Elements ---
const app = document.getElementById('app');
const bottomNav = document.getElementById('bottom-nav');

// --- Navigation & Rendering ---
function render(viewName, params = {}) {
    state.view = viewName;

    // Toggle Bottom Nav
    if (['welcome', 'login', 'camera'].includes(viewName)) {
        bottomNav.classList.add('hidden');
    } else {
        bottomNav.classList.remove('hidden');
        updateActiveNav(viewName);
    }

    // Render View
    let html = '';
    switch (viewName) {
        case 'welcome':
            html = renderWelcome();
            break;
        case 'home':
            html = renderHome();
            break;
        case 'chefs':
            html = renderChefsList();
            break;
        case 'chat':
            html = renderChat(params.chefId);
            break;
        case 'plan':
            html = renderMealPlan();
            break;
        case 'profile':
            html = renderProfile();
            break;
        default:
            html = renderHome();
    }

    app.innerHTML = html;

    // Post-render hooks
    if (viewName === 'chat') scrollToBottom();
}

function updateActiveNav(viewName) {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(viewName)) {
            btn.classList.add('active');
        }
    });
}

// --- View Templates ---

function renderWelcome() {
    return `
        <div class="welcome-view">
            <div style="background: white; padding: 20px; border-radius: 24px; margin-bottom: 30px; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
                <img src="logo.png" class="welcome-logo" alt="ChefIA Logo" style="width: 80px; height: auto; margin-bottom: 0;">
            </div>
            <h1 class="welcome-title">Conoce a ChefIA 👋</h1>
            <p class="welcome-text" style="font-size: 1.2rem; font-weight: 500;">
                Cocina Lo que sea.<br>
                Registra Todo.<br>
                Logra Cualquier Objetivo.
            </p>
            <p class="welcome-text" style="font-size: 0.95rem; opacity: 0.8; margin-top: -20px;">
                Tu asistente de cocina personal. Recetas, nutrición y planificación en un solo lugar.
            </p>
            <button class="btn-white" onclick="render('home')">Empezar Ahora</button>
            <p style="margin-top: 24px; font-size: 0.9rem; opacity: 0.8; cursor: pointer;" onclick="render('home')">Ya tengo cuenta</p>
        </div>
    `;
}

function renderHome() {
    return `
        <div class="container">
            <div class="header">
                <div>
                    <h1 style="color: var(--primary); margin-bottom: 4px;">ChefIA</h1>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">Tu cocina inteligente</p>
                </div>
                <div style="width: 40px; height: 40px; background: #FFF2E5; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary);">
                    <i class="ph-fill ph-user" style="font-size: 1.2rem;"></i>
                </div>
            </div>

            <div style="background: linear-gradient(135deg, #FF5722 0%, #FF8A65 100%); color: white; padding: 24px; border-radius: 24px; margin-bottom: 32px; box-shadow: 0 10px 20px rgba(255, 87, 34, 0.2);">
                <h2 style="font-size: 1.5rem; margin-bottom: 8px;">¿Qué quieres hacer hoy?</h2>
                <p style="opacity: 0.9; margin-bottom: 20px;">Selecciona un experto para empezar.</p>
                <button style="background: white; color: var(--primary); border: none; padding: 12px 24px; border-radius: 100px; font-weight: 700; font-size: 0.9rem; cursor: pointer;" onclick="startChat('pantry')">
                    Sugerir Receta Rápida
                </button>
            </div>

            <h3 class="mb-4" style="font-size: 1.1rem; font-weight: 700;">Tus Chefs Expertos</h3>
            <div class="feature-grid">
                ${CHEFS.slice(0, 4).map(chef => `
                    <div class="feature-card" onclick="startChat('${chef.id}')">
                        <div class="feature-icon" style="color: ${chef.color}; background: ${chef.color}15;">
                            <i class="ph-fill ${chef.icon}"></i>
                        </div>
                        <div class="feature-content">
                            <span class="feature-title">${chef.name}</span>
                            <span class="feature-desc">${chef.role}</span>
                        </div>
                        <i class="ph-caret-right" style="color: #ddd; margin-left: auto;"></i>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderChefsList() {
    return `
        <div class="container">
            <h1 class="mb-8">Elige tu Chef</h1>
            <div class="chef-list">
                ${CHEFS.map(chef => `
                    <div class="chef-card" onclick="startChat('${chef.id}')">
                        <div class="feature-icon" style="color: ${chef.color}; background: ${chef.color}20; width: 60px; height: 60px; font-size: 1.8rem;">
                            <i class="ph-fill ${chef.icon}"></i>
                        </div>
                        <div class="chef-info">
                            <h3>${chef.name}</h3>
                            <p>${chef.desc}</p>
                        </div>
                        <i class="ph-caret-right" style="color: var(--text-muted); margin-left: auto;"></i>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderChat(chefId) {
    const chef = CHEFS.find(c => c.id === chefId);
    state.activeChef = chef;

    // Initialize history if empty
    if (!state.chatHistory[chefId]) {
        state.chatHistory[chefId] = [{ role: 'ai', text: `¡Hola! Soy ${chef.name}. ${chef.desc} ¿En qué puedo ayudarte hoy?` }];
    }

    const messages = state.chatHistory[chefId].map(msg => `
        <div class="message ${msg.role}">
            ${msg.text}
            ${msg.image ? `<br><img src="${msg.image}" style="max-width: 100%; border-radius: 8px; margin-top: 8px;">` : ''}
        </div>
    `).join('');

    return `
        <div class="container" style="height: 100%; padding: 0;">
            <div style="padding: 16px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 12px; background: white;">
                <i class="ph-arrow-left" style="font-size: 1.5rem; cursor: pointer;" onclick="render('chefs')"></i>
                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${chef.color}20; color: ${chef.color}; display: flex; align-items: center; justify-content: center;">
                    <i class="ph-fill ${chef.icon}"></i>
                </div>
                <div>
                    <h3 style="font-size: 1rem;">${chef.name}</h3>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${chef.role}</span>
                </div>
            </div>

            <div class="chat-container">
                <div class="chat-messages" id="chat-messages">
                    ${messages}
                </div>
                <div class="chat-input-area">
                    <button class="btn-camera" onclick="openCamera()">
                        <i class="ph-camera"></i>
                    </button>
                    <input type="text" class="chat-input" id="chat-input" placeholder="Escribe algo..." onkeypress="handleEnter(event)">
                    <button class="btn-send" onclick="sendMessage()">
                        <i class="ph-paper-plane-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderMealPlan() {
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const today = new Date().getDay() - 1; // 0 is Monday in this array logic (approx)

    return `
        <div class="container">
            <h1 class="mb-4">Tu Plan</h1>
            <div class="calendar-strip">
                ${days.map((d, i) => `
                    <div class="day-card ${i === (today < 0 ? 6 : today) ? 'active' : ''}">
                        <span style="font-size: 0.8rem; opacity: 0.7;">${d}</span>
                        <span style="font-weight: 700; font-size: 1.2rem;">${10 + i}</span>
                    </div>
                `).join('')}
            </div>

            <div class="meal-slot">
                <h4>Desayuno</h4>
                <div class="meal-content">Tostadas con Aguacate y Huevo</div>
                <div style="font-size: 0.8rem; color: var(--primary); margin-top: 4px;">350 kcal</div>
            </div>
            <div class="meal-slot">
                <h4>Almuerzo</h4>
                <div class="meal-content">Pollo al Curry con Arroz Basmati</div>
                <div style="font-size: 0.8rem; color: var(--primary); margin-top: 4px;">650 kcal</div>
            </div>
            <div class="meal-slot">
                <h4>Cena</h4>
                <div class="meal-content">Ensalada de Quinoa y Verduras</div>
                <div style="font-size: 0.8rem; color: var(--primary); margin-top: 4px;">400 kcal</div>
            </div>
            
            <button class="btn-white" style="background: var(--primary); color: white; margin-top: 20px;" onclick="startChat('plan')">
                <i class="ph-magic-wand"></i> Generar Nuevo Plan con IA
            </button>
        </div>
    `;
}

function renderProfile() {
    return `
        <div class="container">
            <h1 class="mb-8">Perfil</h1>
            <div class="feature-card" style="flex-direction: row; margin-bottom: 16px;">
                <div style="width: 60px; height: 60px; background: #eee; border-radius: 50%; overflow: hidden;">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" style="width: 100%; height: 100%;">
                </div>
                <div style="text-align: left;">
                    <h3>Usuario Invitado</h3>
                    <p style="color: var(--text-muted);">Plan Gratuito</p>
                </div>
            </div>
            
            <div style="background: white; border-radius: 16px; padding: 0 16px;">
                <div style="padding: 16px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                    <span>Preferencias Dietéticas</span>
                    <i class="ph-caret-right"></i>
                </div>
                <div style="padding: 16px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                    <span>Objetivos de Salud</span>
                    <i class="ph-caret-right"></i>
                </div>
                <div style="padding: 16px 0; display: flex; justify-content: space-between; color: #F44336;">
                    <span>Cerrar Sesión</span>
                    <i class="ph-sign-out"></i>
                </div>
            </div>
        </div>
    `;
}

// --- Logic & Actions ---

window.render = render;
window.startChat = (chefId) => {
    render('chat', { chefId });
};

window.handleEnter = (e) => {
    if (e.key === 'Enter') sendMessage();
};

window.sendMessage = async () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    const chefId = state.activeChef.id;

    // Add User Message
    state.chatHistory[chefId].push({ role: 'user', text });
    input.value = '';
    render('chat', { chefId }); // Re-render to show message

    // AI Response
    const loadingId = Date.now();
    state.chatHistory[chefId].push({ role: 'ai', text: 'Thinking...', id: loadingId });
    render('chat', { chefId });

    try {
        const response = await callGemini(text, state.activeChef.systemPrompt);

        // Replace loading message
        const index = state.chatHistory[chefId].findIndex(m => m.id === loadingId);
        if (index !== -1) {
            state.chatHistory[chefId][index] = { role: 'ai', text: response };
        }
    } catch (error) {
        console.error(error);
        const index = state.chatHistory[chefId].findIndex(m => m.id === loadingId);
        if (index !== -1) {
            state.chatHistory[chefId][index] = { role: 'ai', text: 'Lo siento, tuve un problema al conectar con el chef. Inténtalo de nuevo.' };
        }
    }

    render('chat', { chefId });
};

function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) container.scrollTop = container.scrollHeight;
}

// --- Camera Logic ---
window.openCamera = () => {
    const html = `
        <div class="camera-overlay">
            <i class="ph-x close-camera" onclick="closeCamera()"></i>
            <video id="camera-feed" class="camera-feed" autoplay playsinline></video>
            <div class="camera-controls">
                <button class="shutter-btn" onclick="capturePhoto()">
                    <div class="shutter-inner"></div>
                </button>
            </div>
        </div>
    `;
    const div = document.createElement('div');
    div.id = 'camera-modal';
    div.innerHTML = html;
    document.body.appendChild(div);

    startCameraStream();
};

window.closeCamera = () => {
    const modal = document.getElementById('camera-modal');
    if (modal) modal.remove();
    if (window.currentStream) {
        window.currentStream.getTracks().forEach(track => track.stop());
    }
};

async function startCameraStream() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        const video = document.getElementById('camera-feed');
        video.srcObject = stream;
        window.currentStream = stream;
    } catch (err) {
        alert('No se pudo acceder a la cámara');
        closeCamera();
    }
}

window.capturePhoto = () => {
    const video = document.getElementById('camera-feed');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');

    closeCamera();

    // Send photo to chat
    const chefId = state.activeChef.id;
    state.chatHistory[chefId].push({ role: 'user', text: 'Analiza esta imagen', image: imageData });
    render('chat', { chefId });

    // Trigger AI analysis
    processImageWithAI(imageData);
};

async function processImageWithAI(base64Image) {
    const chefId = state.activeChef.id;
    const loadingId = Date.now();
    state.chatHistory[chefId].push({ role: 'ai', text: 'Analizando imagen...', id: loadingId });
    render('chat', { chefId });

    try {
        // Remove header from base64
        const imagePart = {
            inlineData: {
                data: base64Image.split(',')[1],
                mimeType: "image/jpeg"
            }
        };

        const genAI = new GoogleGenerativeAI(state.apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = state.activeChef.systemPrompt + " [IMAGEN ADJUNTA: Analiza esto detalladamente]";
        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response.text();

        const index = state.chatHistory[chefId].findIndex(m => m.id === loadingId);
        if (index !== -1) {
            state.chatHistory[chefId][index] = { role: 'ai', text: response };
        }
    } catch (error) {
        console.error(error);
        const index = state.chatHistory[chefId].findIndex(m => m.id === loadingId);
        if (index !== -1) {
            state.chatHistory[chefId][index] = { role: 'ai', text: 'Error al analizar la imagen.' };
        }
    }
    render('chat', { chefId });
}

// --- Gemini API Helper ---
async function callGemini(prompt, systemContext) {
    if (!state.apiKey) return "Error: No API Key configured.";

    const genAI = new GoogleGenerativeAI(state.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fullPrompt = `${systemContext}\n\nUsuario: ${prompt}`;
    const result = await model.generateContent(fullPrompt);
    return result.response.text();
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
    // Check if we have API key, if not, maybe prompt or use default (for demo purposes we assume it's there or user adds it)
    // For this specific user request, I'll assume the key is in localStorage from previous session
    render('welcome');
});
