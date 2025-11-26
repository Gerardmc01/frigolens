# FridgeMagic AI 🧊✨

Una aplicación web espectacular que usa IA para escanear tu nevera y sugerirte recetas.

## 🚀 Cómo desplegar en GitHub y Render

### 1. Subir a GitHub
Ya he inicializado el repositorio localmente. Solo necesitas conectarlo a tu GitHub:

1. Crea un **nuevo repositorio** en GitHub (vacío).
2. Ejecuta estos comandos en tu terminal (sustituye `TU_USUARIO` y `TU_REPO`):

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

### 2. Desplegar en Render
1. Ve a [dashboard.render.com](https://dashboard.render.com).
2. Haz clic en **New +** y selecciona **Static Site**.
3. Conecta tu cuenta de GitHub y selecciona el repositorio que acabas de crear.
4. Configuración:
   - **Build Command**: (Déjalo vacío)
   - **Publish Directory**: `./` (o `.` )
5. Haz clic en **Create Static Site**.

¡Y listo! Tu web estará online en unos segundos con una URL segura (https://...).

## ✨ Características
- **Interfaz Moderna**: Diseño "Glassmorphism" con animaciones fluidas.
- **Escáner de Nevera**: Usa la cámara del móvil para capturar ingredientes.
- **IA Chef (Simulado)**: Identifica ingredientes y sugiere recetas (actualmente en modo Demo).
- **Mobile First**: Diseñado para sentirse como una app nativa en tu móvil.

## 🛠️ Tecnologías
- HTML5, CSS3 (Variables, Flexbox, Grid, Animations)
- Vanilla JavaScript (ES Modules)
- Phosphor Icons (Iconos vectoriales ligeros)
