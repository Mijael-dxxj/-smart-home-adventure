/**
 * AudioProcessor: Captura y preprocesamiento de audio en tiempo real
 * - Solicita permisos de micrófono con gestión de ganancia adecuada
 * - Mantiene un buffer deslizante a 16000 Hz (requisito de YAMNet)
 * - Proporciona datos de osciloscopio, RMS y detección de picos transitorios
 */
export class AudioProcessor {
  constructor({ targetSampleRate = 16000, bufferSize = 16000 }) {
    this.targetSampleRate = targetSampleRate;
    this.bufferSize = bufferSize; // 1 segundo a 16kHz

    this.audioContext = null;
    this.mediaStream = null;
    this.sourceNode = null;
    this.analyser = null;
    this.processorNode = null;

    // Buffer deslizante para YAMNet
    this.slidingBuffer = new Float32Array(this.bufferSize);
    this.writeIndex = 0;
    this.totalSamplesCollected = 0;

    // Datos para visualización en tiempo real
    this.timeData = new Uint8Array(256);
    this.isRecording = false;
  }

  // Inicializa el micrófono y el grafo Web Audio
  async start() {
    if (this.isRecording) return true;

    try {
      // Solicitar micrófono con configuración óptima para captura dinámica
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: true
          }
        });
      } catch (err) {
        // Fallback a audio estándar
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      // Intentar abrir a 16000 Hz o fallback al sampleRate nativo
      try {
        this.audioContext = new AudioCtx({ sampleRate: this.targetSampleRate });
      } catch (e) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Analizador para visualización (VU meter / osciloscopio)
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.2;
      this.sourceNode.connect(this.analyser);

      // Nodo de procesamiento de muestras (ScriptProcessorNode)
      const chunkSize = 2048;
      this.processorNode = this.audioContext.createScriptProcessor(chunkSize, 1, 1);

      const actualSampleRate = this.audioContext.sampleRate;
      const resampleRatio = actualSampleRate / this.targetSampleRate;

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);

        if (Math.abs(actualSampleRate - this.targetSampleRate) < 50) {
          for (let i = 0; i < inputData.length; i++) {
            this.pushSample(inputData[i]);
          }
        } else {
          // Remuestreo con interpolación lineal a 16kHz
          const outputLength = Math.floor(inputData.length / resampleRatio);
          for (let i = 0; i < outputLength; i++) {
            const srcIdx = i * resampleRatio;
            const idxFloor = Math.floor(srcIdx);
            const frac = srcIdx - idxFloor;
            const s0 = inputData[idxFloor] || 0;
            const s1 = inputData[idxFloor + 1] || s0;
            const interpolated = s0 + frac * (s1 - s0);
            this.pushSample(interpolated);
          }
        }
      };

      this.sourceNode.connect(this.processorNode);
      // Ganancia silenciosa para mantener activo el nodo sin emitir audio a los altavoces
      const muteGain = this.audioContext.createGain();
      muteGain.gain.value = 0;
      this.processorNode.connect(muteGain);
      muteGain.connect(this.audioContext.destination);

      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('Error al iniciar AudioProcessor:', err);
      this.stop();
      throw err;
    }
  }

  // Agrega una muestra al buffer circular
  pushSample(sample) {
    this.slidingBuffer[this.writeIndex] = sample;
    this.writeIndex = (this.writeIndex + 1) % this.bufferSize;
    this.totalSamplesCollected++;
  }

  // Obtiene el buffer ordenado temporalmente (de la muestra más antigua a la más reciente)
  getAudioBuffer() {
    const result = new Float32Array(this.bufferSize);
    const start = this.writeIndex;
    const len1 = this.bufferSize - start;

    result.set(this.slidingBuffer.subarray(start), 0);
    result.set(this.slidingBuffer.subarray(0, start), len1);

    return result;
  }

  // Obtiene el nivel de volumen RMS actual (0.0 a 1.0)
  getRMS() {
    if (!this.analyser) return 0;
    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  // Obtiene el pico máximo de amplitud en el buffer
  getPeak() {
    let maxV = 0;
    for (let i = 0; i < this.slidingBuffer.length; i++) {
      const abs = Math.abs(this.slidingBuffer[i]);
      if (abs > maxV) maxV = abs;
    }
    return maxV;
  }

  // Obtiene datos de onda para el osciloscopio
  getWaveformData() {
    if (!this.analyser) return null;
    this.analyser.getByteTimeDomainData(this.timeData);
    return this.timeData;
  }

  // Detiene la captura y libera el micrófono
  stop() {
    this.isRecording = false;

    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }

    this.slidingBuffer.fill(0);
    this.writeIndex = 0;
    this.totalSamplesCollected = 0;
  }
}
