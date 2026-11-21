# SMART HOME ADVENTURE 🏠🎮

**SMART HOME ADVENTURE** es una aplicación web interactiva que simula una vivienda inteligente con vista superior (Top-Down 2D), desarrollada con **HTML5 Canvas, TensorFlow.js (modelo real YAMNet), Web Speech API y Web Audio API**.

---

## 🌟 Características Principales

1. **Vivienda Inteligente Top-Down 2D (6 Habitaciones Completas):**
   - **Sala:** Sofá con cojines, mesa de centro con taza/vidrio, mueble de TV, planta y alfombra.
   - **Comedor:** Mesa de madera noble, 4 sillas orientadas, frutero central y alfombra.
   - **Cocina:** Refrigeradora de acero inoxidable de doble puerta, cocina de 4 quemadores a gas con horno y campana, lavaplatos con mesada y barra americana.
   - **Dormitorio:** Cama King size con cabecero, almohadas y edredón, armario de dos cuerpos, mesitas de noche y planta.
   - **Baño:** Ducha con mampara de cristal y desagüe, inodoro con tanque y pulsador, lavamanos con espejo y alfombrilla.
   - **Estudio:** Escritorio con monitor panorámico iluminado, teclado, ratón, silla ergonómica y librero con libros multicolores.
   - Pasillo central iluminado con LEDs y marcos de puertas transitables.

2. **Control Multimodal del Personaje:**
   - **Teclado:** Flechas (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`) y teclas `W`, `A`, `S`, `D`.
   - **Comandos de Voz:** `Web Speech API` en español ("Arriba", "Abajo", "Izquierda", "Derecha").
   - **D-Pad Virtual:** Para pantallas táctiles o accesibilidad con ratón.
   - **Animación y Luz Personal:** Avatar con orientación suave, balanceo de hombros al caminar y linterna/halo personal para explorar habitaciones oscuras.

3. **Sistema de Colisiones Avanzado (AABB + Circle Collision):**
   - Muros perimetrales e interiores impenetrables.
   - Mobiliario con hitboxes precisos.
   - Deslizamiento suave en paredes y muebles (resolución independiente de ejes X e Y para evitar atascos).
   - Detección automática y continua de la habitación actual del personaje.

4. **Inteligencia Artificial con YAMNet Real (TensorFlow.js):**
   - Carga el modelo YAMNet real preentrenado sobre el dataset de **AudioSet (521 clases)**.
   - Mapeo exacto de clases:
     - **Aplausos:** Clase 58 (`Clapping`), 62 (`Applause`), 56 (`Hands`).
     - **Voz humana:** Clase 0 (`Speech`), 1 (`Child speech`), 2 (`Conversation`), 3 (`Narration`), etc.
     - **Música:** Clase 132 (`Music`), 133 (`Musical instrument`), géneros.
     - **Ruido ambiental / Silencio.**
   - Preprocesamiento de audio en tiempo real a **16 kHz mono** con buffer deslizante de 1 segundo (16.000 muestras float32).
   - Control de umbral de confianza ajustable en tiempo real (50% a 95%, por defecto 80%).
   - Intervalo de seguridad (cooldown) para evitar disparos múltiples de un mismo aplauso.

5. **Control Domótico de Iluminación por Aplausos:**
   - **1 Aplauso:** Abre una ventana temporal de 700 ms. Si no se produce un segundo aplauso, **ENCIENDE** la luz de la habitación donde se encuentra el personaje.
   - **2 Aplausos Consecutivos:** Si se detecta un segundo aplauso dentro de los 700 ms, se cancela la acción del primer aplauso y se **APAGA** la luz de la habitación actual.
   - Iluminación independiente por cada una de las 6 habitaciones.
   - Representación visual inmediata en Canvas (resplandor cálido vs oscuridad ambiental azulada).

6. **Dashboard IoT y Telemetría en Tiempo Real:**
   - Osciloscopio de forma de onda (waveform) en vivo.
   - Medidor VU de nivel acústico del micrófono.
   - Desglose porcentual de confianza y Top 3 clases predichas por la IA.
   - Indicadores luminosos de aplausos y barra de cuenta regresiva de 700 ms.
   - Registro de eventos del sistema (Event Log) con marcas de tiempo y etiquetas de color.
   - Efectos sonoros sintetizados mediante Web Audio API (acordes de encendido, clicks de apagado, pings de aplausos y reconocimiento de voz).

---

## 🛠️ Estructura del Proyecto

```
smart-home-adventure/
│
├── public/
│   ├── assets/
│   └── models/
│       └── yamnet/                  # Archivos del modelo YAMNet local (model.json + shards binarios)
│
├── src/
│   ├── main.js                      # Punto de entrada y orquestador del sistema
│   ├── styles/
│   │   └── main.css                 # Estilos Glassmorphism IoT Dark Mode
│   │
│   ├── game/
│   │   ├── Collision.js             # Detección y resolución de colisiones con deslizamiento
│   │   ├── Room.js                  # Definición de habitación, mobiliario y render de iluminación
│   │   ├── House.js                 # Mapa de 6 habitaciones, muros y puertas
│   │   ├── Player.js                # Personaje, animación y linterna
│   │   └── GameEngine.js            # Bucle de animación Canvas 2D
│   │
│   ├── voice/
│   │   └── VoiceController.js       # Reconocimiento continuo con Web Speech API
│   │
│   ├── ai/
│   │   ├── AudioProcessor.js        # Captura de micrófono y remuestreo a 16 kHz
│   │   ├── YamnetModel.js           # Tensor operations con TensorFlow.js
│   │   ├── AudioClassifier.js       # Inferencia periódica y categorización AudioSet
│   │   └── yamnet_classes.json      # Catálogo de las 521 clases de AudioSet
│   │
│   ├── smart-home/
│   │   ├── LightingController.js    # Control domótico por habitación
│   │   └── ClapDetector.js          # Lógica temporal (1 aplauso / 2 aplausos en 700ms)
│   │
│   └── ui/
│       ├── Dashboard.js             # Panel de telemetría y osciloscopio
│       ├── EventLog.js              # Consola de registro en vivo
│       ├── Controls.js              # Enlace de botones y controles
│       └── SoundEffects.js          # Sintetizador de audio Web Audio
│
├── index.html                       # Interfaz visual de usuario
├── package.json                     # Dependencias y scripts
├── vite.config.js                   # Configuración del servidor Vite
└── README.md                        # Documentación técnica completa
```

---

## 🚀 Requisitos e Instalación

### Requisitos:
- **Node.js** v18 o superior (probado en v26).
- **pnpm** o **npm**.
- Navegador moderno con soporte para Canvas, Web Audio API y Web Speech API (Google Chrome, Microsoft Edge, Firefox, Brave).

### Instalación de dependencias:
```bash
# Navegar al directorio del proyecto
cd smart-home-adventure

# Instalar dependencias con pnpm
pnpm install

# O con npm:
# npm install
```

### Ejecutar el servidor de desarrollo:
```bash
pnpm run dev
# O con npm:
# npm run dev
```

Abra el navegador en la URL indicada (habitualmente `http://localhost:5173/`).

---

## 🧠 Explicación Técnica de Módulos Clave

### 1. ¿Cómo funciona YAMNet en la aplicación?
**YAMNet** es una red neuronal convolucional profunda basada en MobileNet que predice eventos de audio sobre 521 clases de AudioSet.
1. **Captura:** `AudioProcessor` solicita acceso al micrófono y mantiene un buffer circular a 16.000 Hz. Si la tarjeta de sonido funciona a 44.1 kHz o 48 kHz, un algoritmo de interpolación lineal remuestrea la señal exactamente a 16.000 Hz.
2. **Buffer Deslizante:** Se extrae una ventana de 1 segundo (16.000 muestras float32 normalizadas entre -1.0 y 1.0).
3. **Inferencia:** `YamnetModel` transforma el array en un tensor 1D (`tf.tensor1d(audioData, 'float32')`) y ejecuta `model.predict(waveform)`.
4. **Agregación de Cuadros:** YAMNet produce salidas con dimensión `[frames, 521]`. Para capturar picos de impacto percusivo (como un aplauso), calculamos el valor máximo a lo largo de los frames temporales (`tf.max(scores, 0)`).
5. **Mapeo:** La clase 58 (`Clapping`) y 62 (`Applause`) se comparan con el umbral configurado por el usuario (80% por defecto).
6. **Gestión de Memoria:** Todo el cálculo se envuelve en `tf.tidy()` para liberar inmediatamente tensores intermedios de WebGL y evitar fugas de memoria.

### 2. ¿Cómo funciona el Reconocimiento de Voz?
- Emplea `window.SpeechRecognition` (o `webkitSpeechRecognition`).
- Idioma configurado en español (`es-ES`).
- Escucha continua con reconexión automática en el evento `onend` para evitar que el navegador suspenda la escucha tras unos segundos de silencio.
- Las frases transcritas se normalizan eliminando tildes y caracteres especiales:
  - "arriba", "subir", "norte" -> Mueve al personaje hacia arriba.
  - "abajo", "bajar", "sur" -> Mueve al personaje hacia abajo.
  - "izquierda", "oeste" -> Mueve al personaje hacia la izquierda.
  - "derecha", "este" -> Mueve al personaje hacia la derecha.
- Al detectarse un comando válido, `Player.moveVoiceCommand(dir, 65)` aplica un desplazamiento suave asistido con resolución de colisiones.

### 3. ¿Cómo funciona el Sistema de Colisiones y Deslizamiento?
- Cada muro y mueble se modela como un rectángulo delimitador (Axis-Aligned Bounding Box, AABB).
- El personaje se modela como un círculo de radio `r = 13 px`.
- Al comprobar intersección:
  $$\text{closestX} = \max(\text{box.x}, \min(cx, \text{box.x} + \text{box.width}))$$
  $$\text{closestY} = \max(\text{box.y}, \min(cy, \text{box.y} + \text{box.height}))$$
  Si $(cx - \text{closestX})^2 + (cy - \text{closestY})^2 < r^2$, existe colisión.
- **Deslizamiento:** Al moverse con vector $(v_x, v_y)$, se evalúa primero el desplazamiento en $X$ y luego en $Y$. Si un eje colisiona pero el otro no, el personaje se desliza suavemente a lo largo de la superficie del obstáculo sin quedarse trabado en esquinas.

---

## 📋 Resultados de Pruebas Realizadas

| Caso de Prueba | Resultado | Observaciones |
|----------------|-----------|---------------|
| Inicio de la aplicación | ✅ Exitoso | Servidor Vite inicia sin advertencias, Canvas y UI cargan fluidamente a 60 FPS. |
| Renderizado de las 6 habitaciones | ✅ Exitoso | Sala, Comedor, Cocina, Dormitorio, Baño y Estudio dibujados con muebles y texturas específicas. |
| Muros y límites exteriores | ✅ Exitoso | Personaje no puede atravesar muros exteriores ni divisiones entre habitaciones. |
| Puertas y pasillo central | ✅ Exitoso | El personaje transita libremente entre todas las habitaciones por los vanos de las puertas. |
| Colisiones con muebles | ✅ Exitoso | Sofá, mesas, camas, cocina, refrigerador, inodoro y estante bloquean el paso con deslizamiento. |
| Controles de teclado | ✅ Exitoso | Flechas y WASD mueven al personaje con orientación suave y balanceo. |
| Comandos de voz | ✅ Exitoso | "Arriba", "Abajo", "Izquierda", "Derecha" desplazan al personaje y muestran feedback sonoro. |
| Clasificador YAMNet | ✅ Exitoso | Modelo real TensorFlow.js cargado localmente con fallback a TFHub; clasifica audio a 16 kHz. |
| Discriminación acústica | ✅ Exitoso | La voz hablada y el ruido ambiental no activan las luces; solo el aplauso supera el umbral del 80%. |
| 1 Aplauso -> Encender luz | ✅ Exitoso | Espera los 700 ms y enciende la luz de la habitación donde se encuentra el jugador. |
| 2 Aplausos -> Apagar luz | ✅ Exitoso | Segundo aplauso en <700 ms cancela el encendido y apaga la luz de la habitación actual. |
| Luces independientes | ✅ Exitoso | Cada habitación preserva su estado de iluminación (ON/OFF) independientemente de las demás. |
| Dashboard e historial en vivo | ✅ Exitoso | VU meter, osciloscopio, barra de confianza y log de eventos registran cada acción con timestamps. |
