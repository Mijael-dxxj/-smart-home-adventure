/**
 * Player: Personaje interactivo controlable mediante teclado y comandos de voz
 * Dispone de física de movimiento real, rotación direccional, linterna personal y animación top-down.
 */
export class Player {
  constructor({ x = 240, y = 470, radius = 13, speed = 3.2, collisionSystem }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = speed;
    this.collisionSystem = collisionSystem;

    // Orientación visual (ángulo en radianes)
    this.angle = 0; // Mirando hacia la derecha inicialmente
    this.targetAngle = 0;

    // Estado de movimiento
    this.vx = 0;
    this.vy = 0;
    this.isMoving = false;
    this.walkCycle = 0; // Para animación de balanceo de hombros

    // Desplazamiento asistido por comandos de voz
    this.isVoiceMoving = false;
    this.voiceRemainingDistance = 0;
    this.voiceDirX = 0;
    this.voiceDirY = 0;
    this.voiceBlockedFrames = 0;

    // Habitación actual
    this.currentRoom = null;
  }

  /**
   * Comandos de voz: orienta al personaje y programa un desplazamiento físico real
   * en la dirección indicada por la distancia especificada (ej. 80 píxeles).
   */
  moveVoiceCommand(direction, distance = 80) {
    this.isVoiceMoving = true;
    this.voiceRemainingDistance = distance;
    this.voiceBlockedFrames = 0;

    switch (direction) {
      case 'up':
        this.voiceDirX = 0;
        this.voiceDirY = -1;
        this.targetAngle = -Math.PI / 2;
        this.angle = -Math.PI / 2;
        break;
      case 'down':
        this.voiceDirX = 0;
        this.voiceDirY = 1;
        this.targetAngle = Math.PI / 2;
        this.angle = Math.PI / 2;
        break;
      case 'left':
        this.voiceDirX = -1;
        this.voiceDirY = 0;
        this.targetAngle = Math.PI;
        this.angle = Math.PI;
        break;
      case 'right':
        this.voiceDirX = 1;
        this.voiceDirY = 0;
        this.targetAngle = 0;
        this.angle = 0;
        break;
    }
  }

  // Actualización por cuadro de animación
  update(keys) {
    let inputX = 0;
    let inputY = 0;

    // 1. Entrada de Teclado
    if (keys['ArrowUp'] || keys['KeyW']) inputY -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) inputY += 1;
    if (keys['ArrowLeft'] || keys['KeyA']) inputX -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) inputX += 1;

    // Si el usuario presiona teclas, cancela cualquier comando de voz activo
    if (inputX !== 0 || inputY !== 0) {
      this.isVoiceMoving = false;
      this.voiceRemainingDistance = 0;
    } else if (this.isVoiceMoving && this.voiceRemainingDistance > 0) {
      // 2. Si no hay teclado y hay comando de voz activo, alimentar vectores
      inputX = this.voiceDirX;
      inputY = this.voiceDirY;
    }

    // Normalizar vector de movimiento diagonal
    if (inputX !== 0 && inputY !== 0) {
      const invLen = 1 / Math.SQRT2;
      inputX *= invLen;
      inputY *= invLen;
    }

    this.vx = inputX * this.speed;
    this.vy = inputY * this.speed;
    this.isMoving = (this.vx !== 0 || this.vy !== 0);

    // Actualizar ángulo de orientación
    if (this.isMoving) {
      this.targetAngle = Math.atan2(this.vy, this.vx);
      this.walkCycle += 0.25;
    }

    // Rotación suave hacia el objetivo
    let diff = this.targetAngle - this.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    this.angle += diff * 0.25;

    // Guardar posición previa para medir el avance real
    const prevX = this.x;
    const prevY = this.y;

    // 3. Resolución de Colisiones con deslizamiento
    if (this.isMoving && this.collisionSystem) {
      const res = this.collisionSystem.resolveMovement(
        this.x,
        this.y,
        this.vx,
        this.vy,
        this.radius
      );
      this.x = res.x;
      this.y = res.y;

      const deltaX = this.x - prevX;
      const deltaY = this.y - prevY;
      const actualMoved = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Si el movimiento proviene de un comando de voz
      if (this.isVoiceMoving) {
        if (actualMoved > 0.05) {
          this.voiceRemainingDistance -= actualMoved;
          this.voiceBlockedFrames = 0;
        } else {
          // El personaje no pudo avanzar nada (bloqueado por obstáculo frontal)
          this.voiceBlockedFrames++;
          if (this.voiceBlockedFrames >= 2) {
            this.isVoiceMoving = false;
            this.voiceRemainingDistance = 0;
          }
        }

        if (this.voiceRemainingDistance <= 0) {
          this.isVoiceMoving = false;
          this.voiceRemainingDistance = 0;
        }
      }
    }
  }

  // Reposicionar al jugador
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.isVoiceMoving = false;
    this.voiceRemainingDistance = 0;
  }

  // Dibuja al personaje y su linterna en sus coordenadas reales
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. Halo de proximidad del personaje
    const haloGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 48);
    haloGrad.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
    haloGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.12)');
    haloGrad.addColorStop(1, 'rgba(56, 189, 248, 0.0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 2);
    ctx.fill();

    // 2. Cono frontal de linterna proyectada
    ctx.save();
    ctx.rotate(this.angle);
    const coneGrad = ctx.createRadialGradient(0, 0, 8, 45, 0, 85);
    coneGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    coneGrad.addColorStop(0.7, 'rgba(255, 245, 180, 0.12)');
    coneGrad.addColorStop(1, 'rgba(255, 245, 180, 0.0)');
    ctx.fillStyle = coneGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 85, -Math.PI / 4, Math.PI / 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Sombra del personaje
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 6, this.radius + 1, this.radius - 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Cuerpo y cabeza rotados con orientación
    ctx.rotate(this.angle);

    // Hombros / Torso con balanceo al caminar
    const bob = Math.sin(this.walkCycle) * 1.5;
    ctx.fillStyle = '#0284c7'; // Chaqueta azul tecnológica
    ctx.beginPath();
    ctx.ellipse(0, 0, this.radius + 2, this.radius - 2 + bob * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Manos / Mangas
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(this.radius - 1, -8 + bob, 4, 0, Math.PI * 2);
    ctx.arc(this.radius - 1, 8 - bob, 4, 0, Math.PI * 2);
    ctx.fill();

    // Cabeza
    ctx.fillStyle = '#fed7aa'; // Piel
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Cabello / Gorra estilizada
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-2, 0, 7.5, Math.PI * 0.4, Math.PI * 1.6);
    ctx.fill();

    // Visor o indicador frontal
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(5, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
