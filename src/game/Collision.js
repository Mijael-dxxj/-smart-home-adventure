/**
 * Collision: Sistema de detección y resolución de colisiones con deslizamiento
 * Soporta colisión círculo-rectángulo (AABB) con cálculo de tangente para permitir
 * deslizamiento suave a lo largo de paredes y muebles sin bloqueos en esquinas.
 */
export class CollisionSystem {
  constructor() {
    this.obstacles = [];
  }

  // Agrega un obstáculo (pared, mueble, límite)
  addObstacle(obstacle) {
    this.obstacles.push(obstacle);
  }

  // Limpia todos los obstáculos
  clear() {
    this.obstacles = [];
  }

  // Comprueba si un círculo colisiona con un rectángulo AABB
  static circleIntersectsBox(cx, cy, radius, box) {
    const closestX = Math.max(box.x, Math.min(cx, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(cy, box.y + box.height));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return (dx * dx + dy * dy) < (radius * radius);
  }

  // Comprueba si un círculo en (cx, cy) colisiona con algún obstáculo
  checkCollision(cx, cy, radius) {
    for (const box of this.obstacles) {
      if (CollisionSystem.circleIntersectsBox(cx, cy, radius, box)) {
        return box;
      }
    }
    return null;
  }

  /**
   * Resuelve el movimiento separando los ejes X e Y con cálculo de tangente.
   * Permite que el personaje resbale suavemente a lo largo de cualquier superficie.
   */
  resolveMovement(currentX, currentY, vx, vy, radius) {
    let nextX = currentX;
    let nextY = currentY;
    let collidedX = false;
    let collidedY = false;

    // 1. Movimiento en el eje X
    if (vx !== 0) {
      const targetX = currentX + vx;
      let blockedX = false;
      let adjustedX = targetX;

      for (const box of this.obstacles) {
        // Encontrar punto más cercano en el rectángulo a la posición deseada
        const qx = Math.max(box.x, Math.min(targetX, box.x + box.width));
        const qy = Math.max(box.y, Math.min(currentY, box.y + box.height));
        const dx = targetX - qx;
        const dy = currentY - qy;

        if (dx * dx + dy * dy < radius * radius) {
          blockedX = true;
          if (vx > 0) {
            // Moviéndose a la derecha, limitar al borde izquierdo del obstáculo
            adjustedX = Math.min(adjustedX, box.x - radius);
          } else {
            // Moviéndose a la izquierda, limitar al borde derecho del obstáculo
            adjustedX = Math.max(adjustedX, box.x + box.width + radius);
          }
        }
      }

      if (blockedX) {
        collidedX = true;
        // Solo aplicar si la posición ajustada aleja al personaje del obstáculo
        nextX = (Math.abs(adjustedX - currentX) > 0.05) ? adjustedX : currentX;
      } else {
        nextX = targetX;
      }
    }

    // 2. Movimiento en el eje Y
    if (vy !== 0) {
      const targetY = currentY + vy;
      let blockedY = false;
      let adjustedY = targetY;

      for (const box of this.obstacles) {
        const qx = Math.max(box.x, Math.min(nextX, box.x + box.width));
        const qy = Math.max(box.y, Math.min(targetY, box.y + box.height));
        const dx = nextX - qx;
        const dy = targetY - qy;

        if (dx * dx + dy * dy < radius * radius) {
          blockedY = true;
          if (vy > 0) {
            // Moviéndose hacia abajo, limitar al borde superior del obstáculo
            adjustedY = Math.min(adjustedY, box.y - radius);
          } else {
            // Moviéndose hacia arriba, limitar al borde inferior del obstáculo
            adjustedY = Math.max(adjustedY, box.y + box.height + radius);
          }
        }
      }

      if (blockedY) {
        collidedY = true;
        nextY = (Math.abs(adjustedY - currentY) > 0.05) ? adjustedY : currentY;
      } else {
        nextY = targetY;
      }
    }

    return {
      x: nextX,
      y: nextY,
      collidedX,
      collidedY
    };
  }

  // Dibuja los hitboxes de colisión (opcional para depuración)
  renderDebug(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 60, 60, 0.7)';
    ctx.lineWidth = 1.5;
    for (const box of this.obstacles) {
      ctx.strokeRect(box.x, box.y, box.width, box.height);
    }
    ctx.restore();
  }
}
