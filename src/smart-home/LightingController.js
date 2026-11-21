/**
 * LightingController: Controlador inteligente de iluminación por habitación
 * Gestiona los estados de luces, sonidos asociados y eventos de notificación.
 */
export class LightingController {
  constructor({ house, soundEffects, onLightChange = null }) {
    this.house = house;
    this.soundEffects = soundEffects;
    this.onLightChange = onLightChange;
  }

  // Enciende la luz de una habitación específica
  turnOn(roomId, source = 'aplauso') {
    const room = this.house.getRoom(roomId);
    if (!room) return false;

    const changed = !room.lightOn;
    room.setLight(true);

    if (this.soundEffects) {
      this.soundEffects.playLightOn();
    }

    if (this.onLightChange) {
      this.onLightChange({
        roomId,
        roomName: room.name,
        state: true,
        source,
        changed
      });
    }

    return true;
  }

  // Apaga la luz de una habitación específica
  turnOff(roomId, source = 'aplausos') {
    const room = this.house.getRoom(roomId);
    if (!room) return false;

    const changed = room.lightOn;
    room.setLight(false);

    if (this.soundEffects) {
      this.soundEffects.playLightOff();
    }

    if (this.onLightChange) {
      this.onLightChange({
        roomId,
        roomName: room.name,
        state: false,
        source,
        changed
      });
    }

    return true;
  }

  // Alterna el estado de la luz
  toggle(roomId, source = 'manual') {
    const room = this.house.getRoom(roomId);
    if (!room) return null;

    if (room.lightOn) {
      this.turnOff(roomId, source);
      return false;
    } else {
      this.turnOn(roomId, source);
      return true;
    }
  }

  // Obtiene el estado de todas las habitaciones
  getStates() {
    const states = {};
    for (const room of this.house.getAllRooms()) {
      states[room.id] = {
        name: room.name,
        lightOn: room.lightOn
      };
    }
    return states;
  }

  // Enciende todas las luces
  turnAllOn() {
    for (const room of this.house.getAllRooms()) {
      room.setLight(true);
    }
    if (this.soundEffects) this.soundEffects.playLightOn();
  }

  // Apaga todas las luces
  turnAllOff() {
    for (const room of this.house.getAllRooms()) {
      room.setLight(false);
    }
    if (this.soundEffects) this.soundEffects.playLightOff();
  }
}
