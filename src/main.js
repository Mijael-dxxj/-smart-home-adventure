import { GameEngine } from './game/GameEngine.js';
import { VoiceController } from './voice/VoiceController.js';
import { AudioClassifier } from './ai/AudioClassifier.js';
import { ClapDetector } from './smart-home/ClapDetector.js';
import { LightingController } from './smart-home/LightingController.js';
import { SoundEffects } from './ui/SoundEffects.js';
import { EventLog } from './ui/EventLog.js';
import { Dashboard } from './ui/Dashboard.js';
import { Controls } from './ui/Controls.js';

/**
 * Bootstrap Principal de SMART HOME ADVENTURE
 */
window.addEventListener('DOMContentLoaded', async () => {
  console.log('Iniciando Smart Home Adventure...');

  // 1. Inicializar Registro de Eventos (EventLog)
  const elLogContainer = document.getElementById('event-log-container');
  const eventLog = new EventLog(elLogContainer);
  eventLog.log('SISTEMA', 'Inicializando Smart Home Adventure v1.0.0...', 'info');

  // 2. Inicializar Efectos de Sonido
  const soundEffects = new SoundEffects();

  // 3. Inicializar Motor del Juego y Canvas
  const canvas = document.getElementById('game-canvas');
  const game = new GameEngine(canvas);
  game.start();
  eventLog.log('CASA', 'Vivienda renderizada: 6 habitaciones cargadas con mobiliario y colisiones.', 'success');

  // 4. Inicializar Controlador de Iluminación Domótica
  const lightingController = new LightingController({
    house: game.house,
    soundEffects,
    onLightChange: ({ roomId, roomName, state, source }) => {
      dashboard.updateRoomsLights(game.house.rooms);
      dashboard.setCurrentRoom(game.currentRoom);
      const actionText = state ? 'ENCENDIDA' : 'APAGADA';
      const type = state ? 'success' : 'warning';
      eventLog.log('LUCES', `Iluminación ${actionText} en ${roomName} (${source}).`, type);
    }
  });

  // 5. Inicializar Gestor de Detección Temporal de Aplausos (1 vs 2 aplausos)
  const clapDetector = new ClapDetector({
    windowMs: 700,
    onFirstClap: (e) => {
      dashboard.animateClapWindow(700);
      soundEffects.playClapDetected();
      eventLog.log('IA', `1er Aplauso detectado (${e.percentage}% de confianza). Esperando 2do aplauso (700ms)...`, 'info');
    },
    onOneClapConfirmed: (e) => {
      dashboard.updateClapState(0, 0);
      const room = game.currentRoom;
      if (room) {
        lightingController.turnOn(room.id, '1 aplauso');
      } else {
        eventLog.log('LUCES', '1 aplauso confirmado en pasillo. Desplácese a una habitación para encender la luz.', 'warning');
      }
    },
    onTwoClapsConfirmed: (e) => {
      dashboard.updateClapState(2, 0);
      soundEffects.playClapDetected();
      eventLog.log('IA', `2do Aplauso detectado dentro de la ventana de 700ms. Cancelando acción previa.`, 'info');
      const room = game.currentRoom;
      if (room) {
        lightingController.turnOff(room.id, '2 aplausos consecutivos');
      } else {
        eventLog.log('LUCES', '2 aplausos confirmados en pasillo. Desplácese a una habitación para apagar la luz.', 'warning');
      }
      setTimeout(() => dashboard.updateClapState(0, 0), 400);
    },
    onReset: () => {
      dashboard.updateClapState(0, 0);
    }
  });

  // 6. Inicializar Clasificador de Sonidos con YAMNet
  const audioClassifier = new AudioClassifier({
    threshold: 0.80, // 80% inicial según especificación
    onClapDetected: (clapData) => {
      clapDetector.registerClap(clapData);
    },
    onSoundClassified: (data) => {
      dashboard.updateSoundData(data);
    },
    onStatusChange: (status, message) => {
      dashboard.setAIStatus(status);
      eventLog.log('IA', message, status === 'active' ? 'success' : 'info');
    },
    onError: (errMsg) => {
      dashboard.setAIStatus('error');
      eventLog.log('ERROR', errMsg, 'danger');
    }
  });

  // 7. Inicializar Reconocimiento de Voz (Web Speech API)
  const voiceController = new VoiceController({
    onCommand: (direction, dirName, rawText) => {
      soundEffects.playVoiceAck();
      dashboard.setLastVoiceCommand(dirName);
      game.movePlayerVoice(direction);
      eventLog.log('VOZ', `Comando reconocido: "${dirName}" (Transcripción: "${rawText}").`, 'success');
    },
    onStatusChange: (status, message) => {
      dashboard.setVoiceStatus(status);
      eventLog.log('VOZ', message, status === 'listening' ? 'success' : 'info');
    },
    onError: (errMsg) => {
      dashboard.setVoiceStatus('error');
      eventLog.log('ERROR', errMsg, 'danger');
    }
  });

  // 8. Inicializar Dashboard
  const dashboard = new Dashboard({
    audioProcessor: audioClassifier.audioProcessor
  });

  // Sincronizar estado inicial de habitaciones
  dashboard.updateRoomsLights(game.house.rooms);
  dashboard.setCurrentRoom(game.currentRoom);

  // Escuchar cambios de habitación del personaje
  game.onRoomChange = (newRoom, prevRoom) => {
    dashboard.setCurrentRoom(newRoom);
    eventLog.log('JUGADOR', `Personaje ingresó a: ${newRoom.name}.`, 'info');
  };

  // 9. Inicializar Enlace de Controles de Usuario
  new Controls({
    // Toggle IA
    onToggleAI: async () => {
      soundEffects.init();
      audioClassifier.toggle();
    },

    // Toggle Voz
    onToggleVoice: () => {
      soundEffects.init();
      voiceController.toggle();
    },

    // Cambio de umbral de confianza
    onThresholdChange: (newThreshold) => {
      audioClassifier.setThreshold(newThreshold);
      eventLog.log('SISTEMA', `Umbral de confianza ajustado a ${(newThreshold * 100).toFixed(0)}%.`, 'info');
    },

    // Simular 1 Aplauso
    onSimulateOneClap: () => {
      soundEffects.init();
      clapDetector.simulateOneClap();
    },

    // Simular 2 Aplausos
    onSimulateTwoClaps: () => {
      soundEffects.init();
      clapDetector.simulateTwoClaps();
    },

    // Botones virtuales de dirección
    onDirectionClick: (dir) => {
      soundEffects.init();
      game.movePlayerVoice(dir);
      const names = { up: 'Arriba', down: 'Abajo', left: 'Izquierda', right: 'Derecha' };
      eventLog.log('JUGADOR', `Desplazamiento manual: ${names[dir]}.`, 'info');
    },

    // Reiniciar posición del jugador
    onResetPlayer: () => {
      game.resetPlayer();
      eventLog.log('JUGADOR', 'Personaje reposicionado en el centro de la Sala.', 'info');
    },

    // Alternar luz de habitación individualmente
    onRoomToggle: (roomId) => {
      soundEffects.init();
      lightingController.toggle(roomId, 'panel manual');
    },

    // Encender / Apagar todas las luces
    onAllLightsToggle: (state) => {
      soundEffects.init();
      if (state) {
        lightingController.turnAllOn();
        eventLog.log('LUCES', 'Todas las habitaciones han sido ILUMINADAS.', 'success');
      } else {
        lightingController.turnAllOff();
        eventLog.log('LUCES', 'Todas las habitaciones han sido APAGADAS.', 'warning');
      }
      dashboard.updateRoomsLights(game.house.rooms);
      dashboard.setCurrentRoom(game.currentRoom);
    },

    // Limpiar registro
    onClearLog: () => {
      eventLog.clear();
    }
  });

  // Habilitar contexto de audio en primer clic
  window.addEventListener('click', () => soundEffects.init(), { once: true });
  window.addEventListener('keydown', () => soundEffects.init(), { once: true });

  eventLog.log('SISTEMA', 'Sistema listo. Utilice flechas de teclado, active la voz o los aplausos con IA.', 'success');
});
