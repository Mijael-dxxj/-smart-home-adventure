import { AudioProcessor } from './AudioProcessor.js';
import { YamnetModel } from './YamnetModel.js';

/**
 * AudioClassifier: Orquestador de clasificación de sonidos con YAMNet en tiempo real
 * Analiza fragmentos continuos de audio, clasifica categorías y detecta aplausos con umbral ajustable.
 */
export class AudioClassifier {
  constructor({
    threshold = 0.80, // 80% por defecto
    onClapDetected = null,
    onSoundClassified = null,
    onStatusChange = null,
    onError = null
  } = {}) {
    this.threshold = threshold;
    this.onClapDetected = onClapDetected;
    this.onSoundClassified = onSoundClassified;
    this.onStatusChange = onStatusChange;
    this.onError = onError;

    this.audioProcessor = new AudioProcessor({ targetSampleRate: 16000, bufferSize: 16000 });
    this.yamnetModel = new YamnetModel();

    this.isActive = false;
    this.isProcessing = false;
    this.intervalId = null;

    // Intervalo de seguridad entre aplausos consecutivos para evitar rebotes de un mismo aplauso (ms)
    this.lastClapTimestamp = 0;
    this.clapCooldownMs = 320;
  }

  // Establece el umbral de confianza (0.50 a 0.95)
  setThreshold(val) {
    this.threshold = Math.max(0.50, Math.min(0.95, val));
  }

  // Inicia la clasificación inteligente
  async start() {
    if (this.isActive) return;

    try {
      if (this.onStatusChange) {
        this.onStatusChange('loading', 'Iniciando micrófono y modelo de IA...');
      }

      // 1. Iniciar procesador de audio (solicita permiso de micrófono)
      await this.audioProcessor.start();

      // 2. Cargar modelo YAMNet si aún no está cargado
      if (!this.yamnetModel.isLoaded) {
        await this.yamnetModel.load((msg) => {
          if (this.onStatusChange) this.onStatusChange('loading', msg);
        });
      }

      this.isActive = true;
      if (this.onStatusChange) {
        this.onStatusChange('active', 'Clasificación de audio en vivo activa');
      }

      // 3. Iniciar bucle periódico de inferencia cada 200 ms
      this.intervalId = setInterval(() => {
        this.runInferenceStep();
      }, 200);
    } catch (err) {
      this.isActive = false;
      this.stop();
      if (this.onError) {
        this.onError(`Error al activar IA de sonido: ${err.message}`);
      }
      if (this.onStatusChange) {
        this.onStatusChange('error', 'Error en micrófono o modelo');
      }
    }
  }

  // Paso de inferencia
  async runInferenceStep() {
    if (!this.isActive || this.isProcessing) return;

    const rms = this.audioProcessor.getRMS();
    const peak = this.audioProcessor.getPeak();

    // Si el nivel acústico es extremadamente bajo (silencio total en la habitación)
    if (rms < 0.003 && peak < 0.015) {
      if (this.onSoundClassified) {
        this.onSoundClassified({
          category: 'Ruido ambiental / Silencio',
          topPrediction: { name: 'Silencio ambiental', percentage: '99.0', score: 0.99 },
          topPredictions: [
            { name: 'Silencio ambiental', percentage: '99.0', score: 0.99 }
          ],
          confidence: 0.99,
          isClap: false,
          rms
        });
      }
      return;
    }

    this.isProcessing = true;
    try {
      const audioBuffer = this.audioProcessor.getAudioBuffer();
      const result = await this.yamnetModel.predict(audioBuffer);

      // Categorizar el sonido identificado
      let category = 'Otros sonidos';
      const topName = result.bestPrediction.name.toLowerCase();

      const isClapCategory = (
        topName.includes('clap') ||
        topName.includes('applause') ||
        topName.includes('hand') ||
        topName.includes('slap') ||
        topName.includes('snap') ||
        result.clapConfidence >= this.threshold
      );

      const isSpeechSound = (
        topName.includes('speech') ||
        topName.includes('conversation') ||
        topName.includes('child') ||
        topName.includes('monologue') ||
        topName.includes('shout') ||
        result.speechScore > 0.35
      );

      const isMusicSound = (
        topName.includes('music') ||
        topName.includes('singing') ||
        topName.includes('instrument') ||
        result.musicScore > 0.35
      );

      if (isClapCategory && !isSpeechSound && !isMusicSound) {
        category = 'Aplausos (Clapping)';
      } else if (isSpeechSound) {
        category = 'Voz humana (Speech)';
      } else if (isMusicSound) {
        category = 'Música (Music)';
      } else {
        category = result.bestPrediction.name;
      }

      const now = performance.now();
      // Condición de aplauso: confianza calibrada >= umbral y no es habla ni música
      const detectedClap = (
        result.clapConfidence >= this.threshold &&
        !isSpeechSound &&
        !isMusicSound
      );

      if (detectedClap) {
        if (now - this.lastClapTimestamp > this.clapCooldownMs) {
          this.lastClapTimestamp = now;
          if (this.onClapDetected) {
            this.onClapDetected({
              confidence: result.clapConfidence,
              percentage: (result.clapConfidence * 100).toFixed(1),
              timestamp: now,
              bestPrediction: result.bestPrediction
            });
          }
        }
      }

      if (this.onSoundClassified) {
        this.onSoundClassified({
          category,
          topPrediction: result.bestPrediction,
          topPredictions: result.topPredictions,
          confidence: detectedClap ? result.clapConfidence : result.bestPrediction.score,
          clapScore: result.clapConfidence,
          isClap: detectedClap,
          rms
        });
      }
    } catch (err) {
      console.warn('Error en ciclo de inferencia YAMNet:', err);
    } finally {
      this.isProcessing = false;
    }
  }

  // Detiene la clasificación
  stop() {
    this.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.audioProcessor.stop();
    if (this.onStatusChange) {
      this.onStatusChange('stopped', 'Clasificación de audio detenida');
    }
  }

  toggle() {
    if (this.isActive) {
      this.stop();
    } else {
      this.start();
    }
    return this.isActive;
  }
}
