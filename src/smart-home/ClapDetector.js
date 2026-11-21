/**
 * ClapDetector: Gestor temporal de detección de 1 y 2 aplausos consecutivos
 * - 1 aplauso: espera ventana de 700 ms -> si no hay otro, enciende la luz.
 * - 2 aplausos: detecta segundo aplauso antes de 700 ms -> cancela el 1er aplauso y apaga la luz.
 */
export class ClapDetector {
  constructor({
    windowMs = 700,
    onFirstClap = null,
    onOneClapConfirmed = null,
    onTwoClapsConfirmed = null,
    onReset = null
  } = {}) {
    this.windowMs = windowMs;
    this.onFirstClap = onFirstClap;
    this.onOneClapConfirmed = onOneClapConfirmed;
    this.onTwoClapsConfirmed = onTwoClapsConfirmed;
    this.onReset = onReset;

    this.clapCount = 0;
    this.timerId = null;
    this.isCoolingDown = false;
  }

  // Procesa un evento de aplauso entrante desde AudioClassifier
  registerClap(clapEvent = {}) {
    if (this.isCoolingDown) return;

    if (this.clapCount === 0) {
      // 1er Aplauso detectado
      this.clapCount = 1;
      if (this.onFirstClap) {
        this.onFirstClap({ ...clapEvent, windowMs: this.windowMs });
      }

      // Iniciar ventana temporal de espera
      this.timerId = setTimeout(() => {
        // Se cumplió el tiempo sin un segundo aplauso -> Confirmar UN APLAUSO
        const count = this.clapCount;
        this.reset();
        if (count === 1 && this.onOneClapConfirmed) {
          this.onOneClapConfirmed(clapEvent);
        }
      }, this.windowMs);
    } else if (this.clapCount === 1) {
      // 2do Aplauso detectado dentro de la ventana de tiempo
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }

      this.clapCount = 2;
      if (this.onTwoClapsConfirmed) {
        this.onTwoClapsConfirmed(clapEvent);
      }

      // Enfriamiento breve para evitar falsos positivos inmediatos
      this.isCoolingDown = true;
      setTimeout(() => {
        this.reset();
        this.isCoolingDown = false;
      }, 400);
    }
  }

  // Reinicia el estado del detector
  reset() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.clapCount = 0;
    if (this.onReset) {
      this.onReset();
    }
  }

  // Métodos para pruebas manuales desde la interfaz
  simulateOneClap() {
    this.registerClap({
      confidence: 0.95,
      percentage: '95.0',
      timestamp: performance.now(),
      simulated: true
    });
  }

  simulateTwoClaps() {
    this.registerClap({
      confidence: 0.95,
      percentage: '95.0',
      timestamp: performance.now(),
      simulated: true
    });
    setTimeout(() => {
      this.registerClap({
        confidence: 0.95,
        percentage: '95.0',
        timestamp: performance.now(),
        simulated: true
      });
    }, 250);
  }
}
