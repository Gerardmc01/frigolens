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

// --- Chef Personas ---
const CHEFS = [
    {
        id: 'pantry',
        name: 'PantryChef',
        role: 'Gestor de Despensa',
        desc: 'Organiza tu cocina y sugiere recetas con lo que tienes.',
        icon: 'ph-basket',
        color: '#FF9800',
        systemPrompt: "Eres PantryChef. Tu objetivo es ayudar al usuario a usar los ingredientes que tiene en casa para evitar desperdicios. Sugiere recetas creativas basadas en listas de ingredientes. Sé práctico y directo."
    },
    {
        id: 'master',
        name: 'MasterChef',
        role: 'Chef Ejecutivo',
        desc: 'Técnicas avanzadas y platos gourmet.',
        icon: 'ph-chef-hat',
        color: '#F44336',
        systemPrompt: "Eres MasterChef. Eres un experto culinario con estrellas Michelin. Enseña técnicas, explica el 'por qué' de la cocina y sugiere platos elevados pero realizables. Tu tono es apasionado y profesional."
    },
    {
        id: 'macro',
        name: 'MacroChef',
        role: 'Nutricionista IA',
        desc: 'Analiza fotos de comida y cuenta calorías.',
        icon: 'ph-heart-beat',
        color: '#4CAF50',
        systemPrompt: "Eres MacroChef. Tu especialidad es la nutrición. Cuando el usuario te envíe una foto de comida o describa un plato, estima las calorías, proteínas, carbohidratos y grasas. Sé preciso y ofrece consejos saludables. Si te envían una foto, analiza los ingredientes visibles y estima las porciones."
    },
    {
        id: 'plan',
        name: 'MealPlanChef',
        role: 'Planificador Semanal',
        desc: 'Crea menús completos para toda la semana.',
        icon: 'ph-calendar-plus',
        color: '#2196F3',
        systemPrompt: "Eres MealPlanChef. Creas planes de comida semanales equilibrados y listas de la compra. Pregunta por preferencias dietéticas si no las sabes. Organiza la respuesta por días (Lunes a Domingo)."
    },
    {
        id: 'mixology',
        name: 'MixologyMaestro',
        role: 'Bartender Experto',
        desc: 'Cócteles y bebidas para cualquier ocasión.',
        icon: 'ph-martini',
        color: '#9C27B0',
        systemPrompt: "Eres MixologyMaestro. Un experto en cócteles y bebidas. Sugiere maridajes, recetas de cócteles clásicos y modernos, y bebidas sin alcohol. Tu estilo es sofisticado."
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
            <img src="logo.png" class="welcome-logo" alt="FrigoLens Logo">
            <h1 class="welcome-title">Conoce a<br>FrigoLens 👋</h1>
            <p class="welcome-text">
                Cocina lo que sea. Registra todo.<br>
                Logra cualquier objetivo.<br><br>
                Tu asistente de cocina integral impulsado por IA.
            </p>
            <button class="btn-white" onclick="render('home')">Empezar Ahora</button>
            <p style="margin-top: 20px; font-size: 0.9rem; opacity: 0.8;">¿Ya tienes cuenta? <b onclick="render('home')">Iniciar Sesión</b></p>
        </div>
    `;
}

function renderHome() {
    return `
        <div class="container">
            <div class="header">
                <div>
                    <h1 style="color: var(--primary);">Hola, Chef! 👨‍🍳</h1>
                    <p style="color: var(--text-muted);">¿Qué cocinamos hoy?</p>
                </div>
                <div style="width: 40px; height: 40px; background: #eee; border-radius: 50%; overflow: hidden;">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" style="width: 100%; height: 100%;">
                </div>
            </div>

            <h2 class="mb-4" style="font-size: 1.2rem;">Tus Chefs IA</h2>
            <div class="feature-grid">
                ${CHEFS.slice(0, 4).map(chef => `
                    <div class="feature-card" onclick="startChat('${chef.id}')">
                        <div class="feature-icon" style="color: ${chef.color}; background: ${chef.color}20;">
                            <i class="ph-fill ${chef.icon}"></i>
                        </div>
                        <span class="feature-title">${chef.name}</span>
                        <span class="feature-desc">${chef.role}</span>
                    </div>
                `).join('')}
            </div>

            <div style="background: var(--primary); color: white; padding: 24px; border-radius: 24px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;" onclick="startChat('plan')">
                <div>
                    <h3 style="font-size: 1.2rem; margin-bottom: 4px;">Plan Semanal</h3>
                    <p style="font-size: 0.9rem; opacity: 0.9;">Organiza tus comidas</p>
                </div>
                <i class="ph-fill ph-arrow-right" style="font-size: 1.5rem;"></i>
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
