import * as tf from '@tensorflow/tfjs';
import classesData from './yamnet_classes.json';

/**
 * YamnetModel: Envoltura de TensorFlow.js para el modelo YAMNet
 * Clasifica fragmentos de audio de 16 kHz en 521 clases de AudioSet.
 */
export class YamnetModel {
  constructor() {
    this.model = null;
    this.classes = classesData;
    this.isLoaded = false;
    this.isLoading = false;
  }

  // Carga el modelo YAMNet (intenta primero ruta local y luego TFHub)
  async load(onProgress) {
    if (this.isLoaded) return true;
    if (this.isLoading) return false;

    this.isLoading = true;
    try {
      if (onProgress) onProgress('Cargando modelo YAMNet...');

      // 1. Intentar cargar desde el servidor local (public/models/yamnet/model.json)
      try {
        console.log('Cargando YAMNet desde /models/yamnet/model.json...');
        this.model = await tf.loadGraphModel('/models/yamnet/model.json');
        console.log('Modelo YAMNet cargado localmente con éxito.');
      } catch (localErr) {
        console.warn('Carga local falló, recurriendo a TFHub:', localErr.message);
        // 2. Fallback a TFHub si la ruta local no está disponible
        this.model = await tf.loadGraphModel('https://tfhub.dev/google/tfjs-model/yamnet/tfjs/1', { fromTFHub: true });
        console.log('Modelo YAMNet cargado desde TFHub con éxito.');
      }

      // Calentamiento del modelo con un tensor de ceros
      if (onProgress) onProgress('Compilando tensores WebGL...');
      const dummyInput = tf.zeros([16000]);
      const dummyRes = this.model.predict(dummyInput);
      if (Array.isArray(dummyRes)) {
        dummyRes.forEach(t => t.dispose());
      } else if (dummyRes && dummyRes.dispose) {
        dummyRes.dispose();
      }
      dummyInput.dispose();

      this.isLoaded = true;
      this.isLoading = false;
      if (onProgress) onProgress('Modelo YAMNet listo y operativo.');
      return true;
    } catch (err) {
      this.isLoading = false;
      this.isLoaded = false;
      console.error('Error cargando YAMNet:', err);
      throw err;
    }
  }

  /**
   * Ejecuta la predicción sobre un buffer de audio de 16 kHz
   * @param {Float32Array} audioData - Buffer de 16000 muestras float32 normalizadas [-1.0, 1.0]
   * @returns {Object} Resultado con topClasses, clapScore, speechScore, musicScore, etc.
   */
  async predict(audioData) {
    if (!this.isLoaded || !this.model) {
      throw new Error('El modelo YAMNet no está cargado');
    }

    return tf.tidy(() => {
      // Normalizar audio si hay señal para maximizar la relación señal-ruido del transitorio
      let maxVal = 0;
      for (let i = 0; i < audioData.length; i++) {
        const abs = Math.abs(audioData[i]);
        if (abs > maxVal) maxVal = abs;
      }

      let processedAudio = audioData;
      if (maxVal > 0.02 && maxVal < 0.6) {
        const scale = 0.8 / maxVal;
        processedAudio = new Float32Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          processedAudio[i] = audioData[i] * scale;
        }
      }

      // Tensor 1D de 16000 muestras float32
      const waveform = tf.tensor1d(processedAudio, 'float32');
      const outputs = this.model.predict(waveform);

      // YAMNet entrega [scores (frames, 521), embeddings, log_mel_spectrogram]
      const scoresTensor = Array.isArray(outputs) ? outputs[0] : outputs;

      // Para capturar eventos percusivos breves, el valor máximo por frame detecta el impacto
      const maxScores = tf.max(scoresTensor, 0);
      const scoreValues = maxScores.dataSync();

      // Mapear con nombres de clases y ordenar por probabilidad
      const predictions = [];
      for (let i = 0; i < scoreValues.length; i++) {
        predictions.push({
          index: i,
          name: this.classes[i] ? this.classes[i].name : `Clase ${i}`,
          score: scoreValues[i],
          percentage: (scoreValues[i] * 100).toFixed(1)
        });
      }

      predictions.sort((a, b) => b.score - a.score);

      // Puntuaciones de clases relevantes
      const rawClapScore = Math.max(
        scoreValues[58] || 0, // Clapping
        scoreValues[62] || 0, // Applause
        (scoreValues[56] || 0) * 0.9, // Hands
        (scoreValues[461] || 0) * 0.85, // Slap, smack
        (scoreValues[57] || 0) * 0.85 // Finger snapping
      );

      // Clases de voz humana
      const speechScore = Math.max(
        scoreValues[0] || 0,  // Speech
        scoreValues[1] || 0,  // Child speech
        scoreValues[2] || 0,  // Conversation
        scoreValues[3] || 0,  // Narration
        scoreValues[6] || 0,  // Shout
        scoreValues[9] || 0   // Yell
      );

      // Clases de música
      const musicScore = Math.max(
        scoreValues[132] || 0, // Music
        scoreValues[133] || 0, // Musical instrument
        scoreValues[137] || 0
      );

      // Calibración de confianza para aplausos:
      // Si hay voz o música fuerte, anular la confianza de aplauso para evitar falsos positivos
      let clapConfidence = 0;
      if (speechScore < 0.35 && musicScore < 0.35) {
        // En AudioSet, una probabilidad de 0.25 a 0.40 para Clapping ya es el evento dominante absoluto
        clapConfidence = Math.min(0.99, (rawClapScore / 0.30) * 0.85);
      }

      return {
        topPredictions: predictions.slice(0, 5),
        bestPrediction: predictions[0],
        rawClapScore,
        clapConfidence,
        speechScore,
        musicScore,
        rawScores: scoreValues
      };
    });
  }
}
