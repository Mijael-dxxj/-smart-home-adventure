/**
 * Dashboard: Gestión del panel de control lateral, telemetría y visualizaciones en vivo
 */
export class Dashboard {
  constructor({ audioProcessor }) {
    this.audioProcessor = audioProcessor;

    // Elementos DOM de IA
    this.elAIStatus = document.getElementById('status-ai');
    this.elBtnAI = document.getElementById('btn-toggle-ai');
    this.elSoundClass = document.getElementById('val-sound-class');
    this.elConfidenceVal = document.getElementById('val-sound-confidence');
    this.elConfidenceBar = document.getElementById('bar-sound-confidence');
    this.elTopClasses = document.getElementById('list-top-classes');

    // Elementos DOM de Micrófono & VU Meter
    this.elMicStatus = document.getElementById('status-mic');
    this.elVUMeter = document.getElementById('bar-vu-level');
    this.canvasVisualizer = document.getElementById('canvas-audio-visualizer');
    this.visCtx = this.canvasVisualizer ? this.canvasVisualizer.getContext('2d') : null;

    // Elementos DOM de Aplausos
    this.elClap1 = document.getElementById('indicator-clap-1');
    this.elClap2 = document.getElementById('indicator-clap-2');
    this.elClapWindowBar = document.getElementById('bar-clap-window');

    // Elementos DOM de Voz
    this.elVoiceStatus = document.getElementById('status-voice');
    this.elBtnVoice = document.getElementById('btn-toggle-voice');
    this.elLastVoiceCommand = document.getElementById('val-last-voice-command');

    // Elementos DOM de Habitación & Domótica
    this.elCurrentRoom = document.getElementById('val-current-room');
    this.elCurrentRoomLight = document.getElementById('val-current-room-light');
    this.roomChips = {};
    ['sala', 'comedor', 'cocina', 'dormitorio', 'bano', 'estudio'].forEach((id) => {
      this.roomChips[id] = {
        badge: document.getElementById(`badge-room-${id}`),
        btn: document.getElementById(`btn-room-${id}`)
      };
    });

    // Iniciar loop del osciloscopio
    this.startVisualizerLoop();
  }

  // Actualiza el estado de la IA
  setAIStatus(status, text) {
    if (!this.elAIStatus) return;
    this.elAIStatus.className = `status-pill status-${status}`;
    this.elAIStatus.textContent = text || status.toUpperCase();

    if (this.elBtnAI) {
      if (status === 'active') {
        this.elBtnAI.textContent = 'Detener Clasificador IA';
        this.elBtnAI.classList.add('btn-active-glow');
        if (this.elMicStatus) {
          this.elMicStatus.className = 'status-pill status-active';
          this.elMicStatus.textContent = 'MIC ACTIVO';
        }
      } else {
        this.elBtnAI.textContent = 'Activar Clasificador IA';
        this.elBtnAI.classList.remove('btn-active-glow');
        if (this.elMicStatus) {
          this.elMicStatus.className = 'status-pill status-idle';
          this.elMicStatus.textContent = 'MIC INACTIVO';
        }
      }
    }
  }

  // Actualiza los datos del sonido clasificado
  updateSoundData({ category, topPrediction, topPredictions, confidence, isClap, rms }) {
    if (this.elSoundClass) {
      this.elSoundClass.textContent = topPrediction.name;
      if (isClap) {
        this.elSoundClass.classList.add('text-highlight-clap');
      } else {
        this.elSoundClass.classList.remove('text-highlight-clap');
      }
    }

    const pct = (confidence * 100).toFixed(1);
    if (this.elConfidenceVal) {
      this.elConfidenceVal.textContent = `${pct}%`;
    }
    if (this.elConfidenceBar) {
      this.elConfidenceBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
      if (isClap) {
        this.elConfidenceBar.style.backgroundColor = '#10b981'; // Verde aplauso
      } else {
        this.elConfidenceBar.style.backgroundColor = '#38bdf8'; // Azul normal
      }
    }

    // VU Meter (Nivel de volumen)
    if (this.elVUMeter) {
      const vuPct = Math.min(100, Math.round(rms * 450));
      this.elVUMeter.style.width = `${vuPct}%`;
    }

    // Lista de las 3 mejores predicciones
    if (this.elTopClasses && topPredictions) {
      this.elTopClasses.innerHTML = topPredictions.slice(0, 3).map((p) => `
        <div class="top-class-row">
          <span class="top-class-name">${p.name}</span>
          <span class="top-class-score">${p.percentage}%</span>
        </div>
      `).join('');
    }
  }

  // Actualiza el estado visual de aplausos
  updateClapState(count, progress = 0) {
    if (this.elClap1) {
      if (count >= 1) {
        this.elClap1.classList.add('clap-active');
      } else {
        this.elClap1.classList.remove('clap-active');
      }
    }

    if (this.elClap2) {
      if (count >= 2) {
        this.elClap2.classList.add('clap-active');
      } else {
        this.elClap2.classList.remove('clap-active');
      }
    }

    if (this.elClapWindowBar) {
      this.elClapWindowBar.style.width = `${progress}%`;
    }
  }

  // Inicia la animación de cuenta regresiva de la ventana del primer aplauso
  animateClapWindow(durationMs = 700) {
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const remaining = Math.max(0, 1 - (elapsed / durationMs));
      this.updateClapState(1, remaining * 100);
      if (remaining > 0 && this.elClap1 && this.elClap1.classList.contains('clap-active')) {
        requestAnimationFrame(tick);
      } else {
        this.updateClapState(0, 0);
      }
    };
    requestAnimationFrame(tick);
  }

  // Actualiza el estado de reconocimiento de voz
  setVoiceStatus(status, text) {
    if (!this.elVoiceStatus) return;
    this.elVoiceStatus.className = `status-pill status-${status}`;
    this.elVoiceStatus.textContent = text || status.toUpperCase();

    if (this.elBtnVoice) {
      if (status === 'listening') {
        this.elBtnVoice.textContent = 'Detener Voz';
        this.elBtnVoice.classList.add('btn-active-glow');
      } else {
        this.elBtnVoice.textContent = 'Activar Voz';
        this.elBtnVoice.classList.remove('btn-active-glow');
      }
    }
  }

  // Actualiza el último comando de voz reconocido
  setLastVoiceCommand(command) {
    if (this.elLastVoiceCommand) {
      this.elLastVoiceCommand.textContent = command;
      this.elLastVoiceCommand.classList.add('command-flash');
      setTimeout(() => {
        this.elLastVoiceCommand.classList.remove('command-flash');
      }, 600);
    }
  }

  // Actualiza la habitación actual y su iluminación
  setCurrentRoom(room) {
    if (!room) {
      if (this.elCurrentRoom) this.elCurrentRoom.textContent = 'Pasillo central';
      if (this.elCurrentRoomLight) {
        this.elCurrentRoomLight.textContent = '-';
        this.elCurrentRoomLight.className = 'room-light-pill';
      }
      return;
    }

    if (this.elCurrentRoom) {
      this.elCurrentRoom.textContent = room.name;
    }

    if (this.elCurrentRoomLight) {
      this.elCurrentRoomLight.textContent = room.lightOn ? 'ILUMINADA (ON)' : 'APAGADA (OFF)';
      this.elCurrentRoomLight.className = room.lightOn
        ? 'room-light-pill light-on'
        : 'room-light-pill light-off';
    }
  }

  // Actualiza los estados de las 6 habitaciones en la lista del panel
  updateRoomsLights(roomsMap) {
    for (const [id, room] of roomsMap.entries()) {
      const chip = this.roomChips[id];
      if (chip && chip.badge) {
        chip.badge.textContent = room.lightOn ? 'ON' : 'OFF';
        chip.badge.className = room.lightOn ? 'chip-badge badge-on' : 'chip-badge badge-off';
      }
    }
  }

  // Bucle de renderizado del osciloscopio en el canvas inferior
  startVisualizerLoop() {
    if (!this.canvasVisualizer || !this.visCtx) return;

    const render = () => {
      const width = this.canvasVisualizer.width;
      const height = this.canvasVisualizer.height;
      const ctx = this.visCtx;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(0, 0, width, height);

      const waveData = this.audioProcessor ? this.audioProcessor.getWaveformData() : null;

      if (waveData && waveData.length > 0) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();

        const sliceWidth = width / waveData.length;
        let x = 0;

        for (let i = 0; i < waveData.length; i++) {
          const v = waveData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
      } else {
        // Línea base estática
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }
}
