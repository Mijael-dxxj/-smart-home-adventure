import { CollisionSystem } from './Collision.js';
import { House } from './House.js';
import { Player } from './Player.js';

/**
 * GameEngine: Bucle principal del videojuego web en Canvas
 * Sincroniza entradas, actualización de estados, colisiones y renderizado.
 */
export class GameEngine {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');

    // Dimensiones fijas de diseño (960 x 640)
    this.width = 960;
    this.height = 640;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Subsistemas
    this.collisionSystem = new CollisionSystem();
    this.house = new House(this.collisionSystem);

    // Posición inicial en zona abierta y libre de obstáculos en la Sala (240, 470)
    this.player = new Player({
      x: 240,
      y: 470,
      radius: 13,
      speed: 3.2,
      collisionSystem: this.collisionSystem
    });

    // Control de teclas
    this.keys = {};
    this.isRunning = false;
    this.animationId = null;

    // Callbacks de eventos
    this.onRoomChange = null;
    this.currentRoom = this.house.getRoomAt(this.player.x, this.player.y);

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      // Evitar scroll de la ventana con las flechas
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      this.keys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Limpiar teclas al perder foco
    window.addEventListener('blur', () => {
      this.keys = {};
    });
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.checkCurrentRoom();
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  // Mueve al personaje físicamente mediante comando de voz una distancia fija de 80px
  movePlayerVoice(direction) {
    this.player.moveVoiceCommand(direction, 80);
  }

  // Reposiciona al jugador en el punto de inicio (Sala - 240, 470)
  resetPlayer() {
    this.player.setPosition(240, 470);
    this.checkCurrentRoom();
  }

  // Comprueba si el jugador cambió de habitación
  checkCurrentRoom() {
    const room = this.house.getRoomAt(this.player.x, this.player.y);
    if (room && room !== this.currentRoom) {
      const prev = this.currentRoom;
      this.currentRoom = room;
      if (this.onRoomChange) {
        this.onRoomChange(room, prev);
      }
    }
  }

  // Bucle de actualización y dibujo
  loop = () => {
    if (!this.isRunning) return;

    // 1. Actualización de física y jugador (modifica coordenadas x, y reales)
    this.player.update(this.keys);
    this.checkCurrentRoom();

    // 2. Limpieza de pantalla
    this.ctx.fillStyle = '#090d16'; // Fondo exterior oscuro
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 3. Renderizado de la vivienda y mobiliario
    this.house.render(this.ctx);

    // 4. Renderizado del personaje en sus coordenadas x, y actualizadas
    this.player.render(this.ctx);

    this.animationId = requestAnimationFrame(this.loop);
  };
}
