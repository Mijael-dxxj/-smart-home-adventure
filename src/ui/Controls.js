/**
 * Controls: Enlace de eventos de controles de usuario y botones de la interfaz
 */
export class Controls {
  constructor({
    onToggleAI,
    onToggleVoice,
    onThresholdChange,
    onSimulateOneClap,
    onSimulateTwoClaps,
    onDirectionClick,
    onResetPlayer,
    onRoomToggle,
    onAllLightsToggle,
    onClearLog
  }) {
    this.callbacks = {
      onToggleAI,
      onToggleVoice,
      onThresholdChange,
      onSimulateOneClap,
      onSimulateTwoClaps,
      onDirectionClick,
      onResetPlayer,
      onRoomToggle,
      onAllLightsToggle,
      onClearLog
    };

    this.bindDOM();
  }

  bindDOM() {
    // 1. Toggle Clasificador IA
    const btnToggleAI = document.getElementById('btn-toggle-ai');
    if (btnToggleAI) {
      btnToggleAI.addEventListener('click', () => {
        if (this.callbacks.onToggleAI) this.callbacks.onToggleAI();
      });
    }

    // 2. Toggle Reconocimiento de Voz
    const btnToggleVoice = document.getElementById('btn-toggle-voice');
    if (btnToggleVoice) {
      btnToggleVoice.addEventListener('click', () => {
        if (this.callbacks.onToggleVoice) this.callbacks.onToggleVoice();
      });
    }

    // 3. Slider de Umbral de Confianza
    const sliderThreshold = document.getElementById('slider-threshold');
    const labelThreshold = document.getElementById('val-threshold');
    if (sliderThreshold) {
      sliderThreshold.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (labelThreshold) labelThreshold.textContent = `${val}%`;
        if (this.callbacks.onThresholdChange) {
          this.callbacks.onThresholdChange(val / 100);
        }
      });
    }

    // 4. Botones de Simulación de Aplausos
    const btnSimOneClap = document.getElementById('btn-sim-1clap');
    if (btnSimOneClap) {
      btnSimOneClap.addEventListener('click', () => {
        if (this.callbacks.onSimulateOneClap) this.callbacks.onSimulateOneClap();
      });
    }

    const btnSimTwoClaps = document.getElementById('btn-sim-2claps');
    if (btnSimTwoClaps) {
      btnSimTwoClaps.addEventListener('click', () => {
        if (this.callbacks.onSimulateTwoClaps) this.callbacks.onSimulateTwoClaps();
      });
    }

    // 5. Botones de Dirección Virtuales
    document.querySelectorAll('[data-dir]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const dir = btn.getAttribute('data-dir');
        if (this.callbacks.onDirectionClick) {
          this.callbacks.onDirectionClick(dir);
        }
      });
    });

    // 6. Botón de Reiniciar Posición
    const btnReset = document.getElementById('btn-reset-player');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (this.callbacks.onResetPlayer) this.callbacks.onResetPlayer();
      });
    }

    // 7. Botones de Iluminación Directa de Habitaciones
    document.querySelectorAll('[data-room-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const roomId = btn.getAttribute('data-room-toggle');
        if (this.callbacks.onRoomToggle) {
          this.callbacks.onRoomToggle(roomId);
        }
      });
    });

    // 8. Botones Maestros de Luces
    const btnAllOn = document.getElementById('btn-all-lights-on');
    if (btnAllOn) {
      btnAllOn.addEventListener('click', () => {
        if (this.callbacks.onAllLightsToggle) this.callbacks.onAllLightsToggle(true);
      });
    }

    const btnAllOff = document.getElementById('btn-all-lights-off');
    if (btnAllOff) {
      btnAllOff.addEventListener('click', () => {
        if (this.callbacks.onAllLightsToggle) this.callbacks.onAllLightsToggle(false);
      });
    }

    // 9. Limpiar Registro
    const btnClearLog = document.getElementById('btn-clear-log');
    if (btnClearLog) {
      btnClearLog.addEventListener('click', () => {
        if (this.callbacks.onClearLog) this.callbacks.onClearLog();
      });
    }
  }
}
