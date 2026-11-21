/**
 * Room: Representa una habitación individual de la vivienda inteligente
 * Controla sus dimensiones, mobiliario, estilo visual e iluminación.
 */
export class Room {
  constructor({ id, name, x, y, width, height, theme, furniture = [] }) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.theme = theme; // { floorType, floorColor, floorLineColor, lightColor }
    this.furniture = furniture;
    this.lightOn = true; // Por defecto encendida
    this.lightIntensity = 1.0; // Para transiciones suaves si se desea
  }

  // Verifica si un punto (x, y) está dentro de los límites de la habitación
  contains(px, py) {
    return px >= this.x && px <= this.x + this.width &&
           py >= this.y && py <= this.y + this.height;
  }

  // Enciende o apaga la luz
  setLight(on) {
    this.lightOn = on;
  }

  // Obtiene los obstáculos de colisión del mobiliario de esta habitación
  getObstacles() {
    return this.furniture
      .filter(item => item.collidable !== false)
      .map(item => ({
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        type: 'furniture',
        label: `${this.name} - ${item.name}`
      }));
  }

  // Dibuja el suelo y texturas de la habitación
  renderFloor(ctx) {
    ctx.save();
    ctx.fillStyle = this.theme.floorColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Patrón decorativo según tipo de suelo
    if (this.theme.floorType === 'wood') {
      // Tablas de madera
      ctx.strokeStyle = this.theme.floorLineColor || 'rgba(0, 0, 0, 0.06)';
      ctx.lineWidth = 1;
      const plankHeight = 24;
      for (let y = this.y; y < this.y + this.height; y += plankHeight) {
        ctx.beginPath();
        ctx.moveTo(this.x, y);
        ctx.lineTo(this.x + this.width, y);
        ctx.stroke();

        // Juntas verticales escalonadas
        const offset = ((y - this.y) / plankHeight) % 2 === 0 ? 0 : 40;
        for (let x = this.x + offset; x < this.x + this.width; x += 80) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, Math.min(y + plankHeight, this.y + this.height));
          ctx.stroke();
        }
      }
    } else if (this.theme.floorType === 'tiles') {
      // Baldosas / Cerámica cuadrada
      ctx.strokeStyle = this.theme.floorLineColor || 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;
      const tileSize = 32;
      for (let x = this.x; x < this.x + this.width; x += tileSize) {
        ctx.beginPath();
        ctx.moveTo(x, this.y);
        ctx.lineTo(x, this.y + this.height);
        ctx.stroke();
      }
      for (let y = this.y; y < this.y + this.height; y += tileSize) {
        ctx.beginPath();
        ctx.moveTo(this.x, y);
        ctx.lineTo(this.x + this.width, y);
        ctx.stroke();
      }
    } else if (this.theme.floorType === 'carpet') {
      // Alfombra con trama sutil
      ctx.fillStyle = this.theme.floorLineColor || 'rgba(255, 255, 255, 0.04)';
      const step = 8;
      for (let x = this.x; x < this.x + this.width; x += step * 2) {
        for (let y = this.y; y < this.y + this.height; y += step * 2) {
          ctx.fillRect(x, y, step, step);
        }
      }
    }

    // Borde interior sutil
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);

    // Etiqueta del nombre de la habitación
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(this.name.toUpperCase(), this.x + 12, this.y + 10);

    ctx.restore();
  }

  // Dibuja el mobiliario de la habitación
  renderFurniture(ctx) {
    for (const item of this.furniture) {
      this.drawFurnitureItem(ctx, item);
    }
  }

  // Dibuja un mueble específico con sombreado y detalles top-down
  drawFurnitureItem(ctx, item) {
    ctx.save();
    const { x, y, width, height, type, name } = item;

    // Sombra proyectada del mueble
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.roundRect(x + 4, y + 4, width, height, 4);
    ctx.fill();

    switch (type) {
      case 'sofa':
        // Sofá principal
        ctx.fillStyle = '#3a506b';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 8);
        ctx.fill();
        // Respaldo
        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.roundRect(x, y, width, 14, [8, 8, 0, 0]);
        ctx.fill();
        // Cojines de asiento
        ctx.fillStyle = '#4b6584';
        const cushionWidth = (width - 16) / 2;
        ctx.beginPath();
        ctx.roundRect(x + 6, y + 18, cushionWidth, height - 24, 4);
        ctx.roundRect(x + 10 + cushionWidth, y + 18, cushionWidth, height - 24, 4);
        ctx.fill();
        // Almohadones decorativos
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 20, 16, 12, 3);
        ctx.roundRect(x + width - 24, y + 20, 16, 12, 3);
        ctx.fill();
        break;

      case 'coffee-table':
        // Mesa de centro
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 6);
        ctx.fill();
        // Vidrio o superficie pulida
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 4, width - 8, height - 8, 4);
        ctx.fill();
        // Revista / Taza
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'tv-unit':
        // Mueble de TV
        ctx.fillStyle = '#2d3436';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 4);
        ctx.fill();
        // Pantalla de TV plana
        ctx.fillStyle = '#0984e3';
        ctx.fillRect(x + 4, y + 2, width - 8, 4);
        break;

      case 'dining-table':
        // Mesa de comedor de madera noble
        ctx.fillStyle = '#8d6e63';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 8);
        ctx.fill();
        // Centro de mesa / Frutero
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(x + 10, y + 10, width - 20, height - 20);
        ctx.fillStyle = '#27ae60';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, 7, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'chair':
        // Silla vista desde arriba
        ctx.fillStyle = '#a1887f';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 4);
        ctx.fill();
        ctx.fillStyle = '#5d4037';
        // Respaldo de silla
        if (item.orientation === 'top') {
          ctx.fillRect(x, y, width, 4);
        } else if (item.orientation === 'bottom') {
          ctx.fillRect(x, y + height - 4, width, 4);
        } else if (item.orientation === 'left') {
          ctx.fillRect(x, y, 4, height);
        } else {
          ctx.fillRect(x + width - 4, y, 4, height);
        }
        break;

      case 'fridge':
        // Refrigeradora doble puerta inox
        ctx.fillStyle = '#b0bec5';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 5);
        ctx.fill();
        // Separador y manijas
        ctx.strokeStyle = '#546e7a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + height * 0.45);
        ctx.lineTo(x + width, y + height * 0.45);
        ctx.stroke();
        ctx.fillStyle = '#37474f';
        ctx.fillRect(x + width - 6, y + 8, 3, 14);
        ctx.fillRect(x + width - 6, y + height * 0.45 + 8, 3, 18);
        break;

      case 'stove':
        // Cocina y quemadores
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 4);
        ctx.fill();
        // 4 Quemadores de gas
        ctx.fillStyle = '#212121';
        const qw = width / 2;
        const qh = height / 2;
        [
          [x + qw * 0.5, y + qh * 0.5],
          [x + qw * 1.5, y + qh * 0.5],
          [x + qw * 0.5, y + qh * 1.5],
          [x + qw * 1.5, y + qh * 1.5]
        ].forEach(([qx, qy]) => {
          ctx.beginPath();
          ctx.arc(qx, qy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#e67e22';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
        break;

      case 'sink':
        // Lavadero / Mesada de cocina
        ctx.fillStyle = '#90a4ae';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 4);
        ctx.fill();
        // Poza de agua
        ctx.fillStyle = '#607d8b';
        ctx.beginPath();
        ctx.roundRect(x + 6, y + 6, width - 12, height - 12, 4);
        ctx.fill();
        // Grifo monomando
        ctx.fillStyle = '#cfd8dc';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + 10, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + width / 2 - 1, y + 10, 2, 8);
        break;

      case 'bed':
        // Cama de dos plazas
        ctx.fillStyle = '#5c6bc0';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 8);
        ctx.fill();
        // Cabecero
        ctx.fillStyle = '#3949ab';
        ctx.fillRect(x, y, width, 10);
        // Almohadas
        ctx.fillStyle = '#ffffff';
        const pw = (width - 16) / 2;
        ctx.beginPath();
        ctx.roundRect(x + 6, y + 14, pw, 18, 4);
        ctx.roundRect(x + 10 + pw, y + 14, pw, 18, 4);
        ctx.fill();
        // Edredón doblado
        ctx.fillStyle = '#7986cb';
        ctx.beginPath();
        ctx.roundRect(x + 4, y + 40, width - 8, height - 44, 4);
        ctx.fill();
        break;

      case 'wardrobe':
        // Armario / Clóset
        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 4);
        ctx.fill();
        // Puertas
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + width / 2, y);
        ctx.lineTo(x + width / 2, y + height);
        ctx.stroke();
        // Tiradores
        ctx.fillStyle = '#d7ccc8';
        ctx.fillRect(x + width / 2 - 4, y + height / 2 - 4, 2, 8);
        ctx.fillRect(x + width / 2 + 2, y + height / 2 - 4, 2, 8);
        break;

      case 'shower':
        // Ducha con mampara de cristal
        ctx.fillStyle = '#e0f2fe';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 6);
        ctx.fill();
        // Mampara de cristal (borde azul traslúcido)
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
        // Desagüe en esquina
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(x + width - 12, y + 12, 4, 0, Math.PI * 2);
        ctx.fill();
        // Rociador de ducha
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(x + 12, y + height / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'toilet':
        // Inodoro moderno
        ctx.fillStyle = '#f8fafc';
        // Tanque posterior
        ctx.fillRect(x, y, width, 14);
        // Taza ovalada
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + 24, width / 2 - 2, (height - 14) / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Botón de descarga
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + 7, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'bathroom-sink':
        // Lavamanos de baño con mueble
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 4);
        ctx.fill();
        // Bacha blanca
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x + width / 2, y + height / 2, width / 2 - 4, height / 2 - 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Grifo
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'desk':
        // Escritorio de trabajo
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 4);
        ctx.fill();
        // Monitor curvo moderno
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(x + 12, y + 4, width - 24, 6, 2);
        ctx.fill();
        // Luz azul de pantalla
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(x + 14, y + 6, width - 28, 2);
        // Teclado
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + width / 2 - 16, y + 16, 32, 10);
        // Ratón
        ctx.fillRect(x + width / 2 + 22, y + 18, 6, 8);
        break;

      case 'office-chair':
        // Silla ergonómica de oficina
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2);
        ctx.fill();
        // Respaldo
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 2 - 3, Math.PI * 0.2, Math.PI * 0.8, false);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#38bdf8';
        ctx.stroke();
        break;

      case 'bookshelf':
        // Estantería con libros coloridos
        ctx.fillStyle = '#5c4033';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 3);
        ctx.fill();
        // Libros en vertical
        const bookColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        const bookWidth = 5;
        let bx = x + 4;
        let colorIdx = 0;
        while (bx < x + width - 6) {
          ctx.fillStyle = bookColors[colorIdx % bookColors.length];
          ctx.fillRect(bx, y + 3, bookWidth, height - 6);
          bx += bookWidth + 2;
          colorIdx++;
        }
        break;

      case 'plant':
        // Planta decorativa de maceta
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        // Hojas verdes
        ctx.fillStyle = '#2e7d32';
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5;
          const leafX = x + width / 2 + Math.cos(angle) * 7;
          const leafY = y + height / 2 + Math.sin(angle) * 7;
          ctx.beginPath();
          ctx.arc(leafX, leafY, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'rug':
        // Alfombra decorativa
        ctx.fillStyle = item.color || '#2c3e50';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 10);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, width - 8, height - 8);
        break;

      default:
        // Mueble genérico
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 4);
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  // Dibuja la iluminación de la habitación (Luz encendida o oscuridad)
  renderLighting(ctx) {
    ctx.save();
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const radius = Math.max(this.width, this.height) * 0.75;

    if (this.lightOn) {
      // Habitación iluminada: resplandor cálido desde el centro
      const lightGrad = ctx.createRadialGradient(
        centerX, centerY, 10,
        centerX, centerY, radius
      );
      lightGrad.addColorStop(0, 'rgba(255, 248, 220, 0.18)');
      lightGrad.addColorStop(0.5, 'rgba(255, 235, 170, 0.08)');
      lightGrad.addColorStop(1, 'rgba(255, 220, 130, 0.0)');

      ctx.fillStyle = lightGrad;
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Lámpara de techo o aplique central brillante
      ctx.fillStyle = '#fff9c4';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Aura de la bombilla
      ctx.fillStyle = 'rgba(255, 245, 157, 0.45)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Habitación apagada: oscuridad azulada profunda
      ctx.fillStyle = 'rgba(8, 12, 24, 0.78)';
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Icono sutil de bombilla apagada en el centro
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
