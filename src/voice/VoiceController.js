/**
 * VoiceController: Gestión del reconocimiento de voz mediante Web Speech API
 * Interpreta instrucciones verbales ("Arriba", "Abajo", "Izquierda", "Derecha")
 * de manera continua e independiente del clasificador de sonidos.
 */
export class VoiceController {
  constructor({ onCommand, onStatusChange, onError }) {
    this.onCommand = onCommand;
    this.onStatusChange = onStatusChange;
    this.onError = onError;

    this.recognition = null;
    this.isListening = false;
    this.shouldRestart = false;
    this.lastCommand = '-';
    this.isSupported = false;

    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.isSupported = false;
      if (this.onStatusChange) {
        this.onStatusChange('unsupported', 'Web Speech API no está soportada en este navegador');
      }
      return;
    }

    this.isSupported = true;
    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'es-ES'; // Español
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onStatusChange) {
          this.onStatusChange('listening', 'Escuchando comandos de voz...');
        }
      };

      this.recognition.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        this.processTranscript(transcript);
      };

      this.recognition.onerror = (event) => {
        // En muchos navegadores 'no-speech' es común cuando hay silencio
        if (event.error === 'no-speech') {
          return;
        }
        console.warn('Error en SpeechRecognition:', event.error);
        if (event.error === 'not-allowed') {
          this.isListening = false;
          this.shouldRestart = false;
          if (this.onError) {
            this.onError('Permiso de micrófono para voz denegado');
          }
          if (this.onStatusChange) {
            this.onStatusChange('error', 'Permiso de micrófono denegado');
          }
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        // Si el usuario no ha solicitado detenerlo explícitamente, reiniciar la escucha
        if (this.shouldRestart) {
          try {
            this.recognition.start();
          } catch (e) {
            // Reintento diferido
            setTimeout(() => {
              if (this.shouldRestart) {
                try { this.recognition.start(); } catch (err) {}
              }
            }, 300);
          }
        } else {
          if (this.onStatusChange) {
            this.onStatusChange('stopped', 'Reconocimiento de voz detenido');
          }
        }
      };
    } catch (err) {
      console.error('Error inicializando SpeechRecognition:', err);
      this.isSupported = false;
      if (this.onError) {
        this.onError(`Error de inicialización: ${err.message}`);
      }
    }
  }

  // Interpreta la transcripción de voz buscando comandos de dirección
  processTranscript(text) {
    // Normalizar texto eliminando tildes
    const cleanText = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    let detectedDirection = null;

    if (cleanText.includes('arriba') || cleanText.includes('subir') || cleanText.includes('norte')) {
      detectedDirection = 'up';
      this.lastCommand = 'Arriba';
    } else if (cleanText.includes('abajo') || cleanText.includes('bajar') || cleanText.includes('sur')) {
      detectedDirection = 'down';
      this.lastCommand = 'Abajo';
    } else if (cleanText.includes('izquierda') || cleanText.includes('oeste')) {
      detectedDirection = 'left';
      this.lastCommand = 'Izquierda';
    } else if (cleanText.includes('derecha') || cleanText.includes('este')) {
      detectedDirection = 'right';
      this.lastCommand = 'Derecha';
    }

    if (detectedDirection && this.onCommand) {
      this.onCommand(detectedDirection, this.lastCommand, text);
    }
  }

  // Inicia la escucha
  start() {
    if (!this.isSupported || !this.recognition) {
      if (this.onError) {
        this.onError('El navegador no soporta Web Speech API');
      }
      return;
    }
    if (this.isListening) return;

    this.shouldRestart = true;
    try {
      this.recognition.start();
    } catch (e) {
      console.warn('SpeechRecognition ya iniciado o reintentando:', e);
    }
  }

  // Detiene la escucha
  stop() {
    this.shouldRestart = false;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
    if (this.onStatusChange) {
      this.onStatusChange('stopped', 'Reconocimiento de voz detenido');
    }
  }

  // Alterna entre activo e inactivo
  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
    return this.isListening;
  }
}
