import { Room } from './Room.js';

/**
 * House: Gestiona la arquitectura completa de la vivienda inteligente
 * - 6 habitaciones con identidad y mobiliario propio
 * - Pasillos y puertas transitables
 * - Muros perimetrales e interiores con colisiones
 * - Control de iluminación independiente
 */
export class House {
  constructor(collisionSystem) {
    this.collisionSystem = collisionSystem;
    this.rooms = new Map();
    this.walls = [];
    this.doors = [];

    this.initRooms();
    this.initWallsAndDoors();
    this.buildCollisionObstacles();
  }

  initRooms() {
    // 1. DORMITORIO (Top-Left)
    const dormitorio = new Room({
      id: 'dormitorio',
      name: 'Dormitorio',
      x: 40,
      y: 40,
      width: 280,
      height: 260,
      theme: {
        floorType: 'carpet',
        floorColor: '#2d3748',
        floorLineColor: 'rgba(255, 255, 255, 0.05)',
        lightColor: '#fef08a'
      },
      furniture: [
        // Alfombra de dormitorio
        { type: 'rug', x: 80, y: 80, width: 140, height: 160, color: '#334155', collidable: false },
        // Cama de dos plazas
        { type: 'bed', name: 'Cama King', x: 90, y: 55, width: 120, height: 120, collidable: true },
        // Armario / Clóset
        { type: 'wardrobe', name: 'Armario', x: 235, y: 50, width: 75, height: 110, collidable: true },
        // Mesitas de noche
        { type: 'coffee-table', name: 'Mesa de noche izq', x: 55, y: 55, width: 26, height: 26, collidable: true },
        // Planta decorativa
        { type: 'plant', name: 'Planta de dormitorio', x: 55, y: 240, width: 22, height: 22, collidable: true }
      ]
    });

    // 2. BAÑO (Top-Center)
    const bano = new Room({
      id: 'bano',
      name: 'Baño',
      x: 340,
      y: 40,
      width: 260,
      height: 260,
      theme: {
        floorType: 'tiles',
        floorColor: '#0f766e',
        floorLineColor: 'rgba(255, 255, 255, 0.12)',
        lightColor: '#e0f2fe'
      },
      furniture: [
        // Ducha con mampara
        { type: 'shower', name: 'Ducha', x: 350, y: 50, width: 85, height: 85, collidable: true },
        // Inodoro
        { type: 'toilet', name: 'Inodoro', x: 460, y: 50, width: 34, height: 48, collidable: true },
        // Lavabo con mueble
        { type: 'bathroom-sink', name: 'Lavamanos', x: 520, y: 50, width: 68, height: 42, collidable: true },
        // Alfombrilla de baño
        { type: 'rug', x: 360, y: 150, width: 65, height: 35, color: '#14b8a6', collidable: false }
      ]
    });

    // 3. ESTUDIO (Top-Right)
    const estudio = new Room({
      id: 'estudio',
      name: 'Estudio',
      x: 620,
      y: 40,
      width: 300,
      height: 260,
      theme: {
        floorType: 'wood',
        floorColor: '#3b2f2f',
        floorLineColor: 'rgba(0, 0, 0, 0.15)',
        lightColor: '#fef3c7'
      },
      furniture: [
        // Escritorio de trabajo con monitor
        { type: 'desk', name: 'Escritorio', x: 710, y: 55, width: 120, height: 45, collidable: true },
        // Silla de oficina
        { type: 'office-chair', name: 'Silla ergonómica', x: 755, y: 110, width: 30, height: 30, collidable: true },
        // Estantería grande con libros
        { type: 'bookshelf', name: 'Librero', x: 630, y: 50, width: 60, height: 130, collidable: true },
        // Planta de oficina
        { type: 'plant', name: 'Planta estudio', x: 885, y: 55, width: 24, height: 24, collidable: true },
        // Alfombra bajo escritorio
        { type: 'rug', x: 690, y: 50, width: 160, height: 110, color: '#44403c', collidable: false }
      ]
    });

    // 4. SALA (Bottom-Left)
    const sala = new Room({
      id: 'sala',
      name: 'Sala',
      x: 40,
      y: 340,
      width: 280,
      height: 260,
      theme: {
        floorType: 'wood',
        floorColor: '#4a3b32',
        floorLineColor: 'rgba(0, 0, 0, 0.12)',
        lightColor: '#fef9c3'
      },
      furniture: [
        // Alfombra central
        { type: 'rug', x: 75, y: 395, width: 150, height: 130, color: '#1e293b', collidable: false },
        // Sofá elegante
        { type: 'sofa', name: 'Sofá', x: 80, y: 400, width: 140, height: 50, collidable: true },
        // Mesa de centro
        { type: 'coffee-table', name: 'Mesa de centro', x: 115, y: 465, width: 70, height: 35, collidable: true },
        // Mueble de TV
        { type: 'tv-unit', name: 'Mueble TV', x: 80, y: 565, width: 140, height: 25, collidable: true },
        // Planta de sala
        { type: 'plant', name: 'Planta de sala', x: 50, y: 350, width: 25, height: 25, collidable: true }
      ]
    });

    // 5. COMEDOR (Bottom-Center)
    const comedor = new Room({
      id: 'comedor',
      name: 'Comedor',
      x: 340,
      y: 340,
      width: 260,
      height: 260,
      theme: {
        floorType: 'wood',
        floorColor: '#543d2b',
        floorLineColor: 'rgba(0, 0, 0, 0.12)',
        lightColor: '#ffedd5'
      },
      furniture: [
        // Alfombra de comedor
        { type: 'rug', x: 380, y: 400, width: 180, height: 140, color: '#374151', collidable: false },
        // Mesa de comedor
        { type: 'dining-table', name: 'Mesa de comedor', x: 410, y: 430, width: 120, height: 75, collidable: true },
        // Sillas superiores
        { type: 'chair', name: 'Silla norte 1', x: 425, y: 405, width: 24, height: 20, orientation: 'bottom', collidable: true },
        { type: 'chair', name: 'Silla norte 2', x: 480, y: 405, width: 24, height: 20, orientation: 'bottom', collidable: true },
        // Sillas inferiores
        { type: 'chair', name: 'Silla sur 1', x: 425, y: 510, width: 24, height: 20, orientation: 'top', collidable: true },
        { type: 'chair', name: 'Silla sur 2', x: 480, y: 510, width: 24, height: 20, orientation: 'top', collidable: true }
      ]
    });

    // 6. COCINA (Bottom-Right)
    const cocina = new Room({
      id: 'cocina',
      name: 'Cocina',
      x: 620,
      y: 340,
      width: 300,
      height: 260,
      theme: {
        floorType: 'tiles',
        floorColor: '#334155',
        floorLineColor: 'rgba(255, 255, 255, 0.08)',
        lightColor: '#f1f5f9'
      },
      furniture: [
        // Refrigeradora doble puerta
        { type: 'fridge', name: 'Refrigeradora', x: 840, y: 350, width: 68, height: 60, collidable: true },
        // Cocina con quemadores y campana
        { type: 'stove', name: 'Cocina', x: 745, y: 350, width: 65, height: 50, collidable: true },
        // Lavaplatos y mesada
        { type: 'sink', name: 'Lavaplatos', x: 635, y: 350, width: 80, height: 50, collidable: true },
        // Barra o isla de cocina
        { type: 'coffee-table', name: 'Barra americana', x: 680, y: 460, width: 120, height: 40, collidable: true }
      ]
    });

    this.rooms.set('dormitorio', dormitorio);
    this.rooms.set('bano', bano);
    this.rooms.set('estudio', estudio);
    this.rooms.set('sala', sala);
    this.rooms.set('comedor', comedor);
    this.rooms.set('cocina', cocina);
  }

  initWallsAndDoors() {
    const W_THICK = 10; // Grosor de los muros

    // 1. Muros Perimetrales Exteriores
    // Muro Exterior Norte (y: 30 a 40)
    this.walls.push({ x: 30, y: 30, width: 900, height: W_THICK, label: 'Exterior Norte' });
    // Muro Exterior Sur (y: 600 a 610)
    this.walls.push({ x: 30, y: 600, width: 900, height: W_THICK, label: 'Exterior Sur' });
    // Muro Exterior Oeste (x: 30 a 40)
    this.walls.push({ x: 30, y: 30, width: W_THICK, height: 580, label: 'Exterior Oeste' });
    // Muro Exterior Este (x: 920 a 930)
    this.walls.push({ x: 920, y: 30, width: W_THICK, height: 580, label: 'Exterior Este' });

    // 2. Muros Interiores Verticales (Fila Superior: y: 40 a 300)
    // Entre Dormitorio y Baño (x: 320 a 330)
    this.walls.push({ x: 325, y: 40, width: W_THICK, height: 260, label: 'Pared Dormitorio-Baño' });
    // Entre Baño y Estudio (x: 605 a 615)
    this.walls.push({ x: 605, y: 40, width: W_THICK, height: 260, label: 'Pared Baño-Estudio' });

    // 3. Muro Horizontal Central con Puertas (y: 300 a 340)
    // El pasillo central corre de y=300 a y=340. Las habitaciones superiores e inferiores tienen puertas que dan al pasillo.
    // Muro divisorio horizontal superior (y: 300)
    // Dormitorio -> Pasillo (Puerta en x: 150 a 220)
    this.walls.push({ x: 40, y: 300, width: 110, height: W_THICK, label: 'Muro Dormitorio Sur 1' });
    this.doors.push({ x: 150, y: 300, width: 70, height: W_THICK, label: 'Puerta Dormitorio' });
    this.walls.push({ x: 220, y: 300, width: 115, height: W_THICK, label: 'Muro Dormitorio Sur 2' });

    // Baño -> Pasillo (Puerta en x: 435 a 495)
    this.walls.push({ x: 335, y: 300, width: 100, height: W_THICK, label: 'Muro Baño Sur 1' });
    this.doors.push({ x: 435, y: 300, width: 60, height: W_THICK, label: 'Puerta Baño' });
    this.walls.push({ x: 495, y: 300, width: 110, height: W_THICK, label: 'Muro Baño Sur 2' });

    // Estudio -> Pasillo (Puerta en x: 730 a 800)
    this.walls.push({ x: 605, y: 300, width: 125, height: W_THICK, label: 'Muro Estudio Sur 1' });
    this.doors.push({ x: 730, y: 300, width: 70, height: W_THICK, label: 'Puerta Estudio' });
    this.walls.push({ x: 800, y: 300, width: 120, height: W_THICK, label: 'Muro Estudio Sur 2' });

    // Muro divisorio horizontal inferior (y: 335)
    // Sala -> Pasillo (Puerta en x: 150 a 220)
    this.walls.push({ x: 40, y: 335, width: 110, height: W_THICK, label: 'Muro Sala Norte 1' });
    this.doors.push({ x: 150, y: 335, width: 70, height: W_THICK, label: 'Puerta Sala Norte' });
    this.walls.push({ x: 220, y: 335, width: 115, height: W_THICK, label: 'Muro Sala Norte 2' });

    // Comedor -> Pasillo (Puerta en x: 435 a 495)
    this.walls.push({ x: 335, y: 335, width: 100, height: W_THICK, label: 'Muro Comedor Norte 1' });
    this.doors.push({ x: 435, y: 335, width: 60, height: W_THICK, label: 'Puerta Comedor Norte' });
    this.walls.push({ x: 495, y: 335, width: 110, height: W_THICK, label: 'Muro Comedor Norte 2' });

    // Cocina -> Pasillo (Puerta en x: 730 a 800)
    this.walls.push({ x: 605, y: 335, width: 125, height: W_THICK, label: 'Muro Cocina Norte 1' });
    this.doors.push({ x: 730, y: 335, width: 70, height: W_THICK, label: 'Puerta Cocina Norte' });
    this.walls.push({ x: 800, y: 335, width: 120, height: W_THICK, label: 'Muro Cocina Norte 2' });

    // 4. Muros Interiores Verticales (Fila Inferior: y: 345 a 600)
    // Entre Sala y Comedor: con arco / paso libre amplio (y: 430 a 510)
    this.walls.push({ x: 325, y: 345, width: W_THICK, height: 85, label: 'Pared Sala-Comedor 1' });
    this.doors.push({ x: 325, y: 430, width: W_THICK, height: 80, label: 'Paso Sala-Comedor' });
    this.walls.push({ x: 325, y: 510, width: W_THICK, height: 90, label: 'Pared Sala-Comedor 2' });

    // Entre Comedor y Cocina: con arco / paso libre amplio (y: 430 a 510)
    this.walls.push({ x: 605, y: 345, width: W_THICK, height: 85, label: 'Pared Comedor-Cocina 1' });
    this.doors.push({ x: 605, y: 430, width: W_THICK, height: 80, label: 'Paso Comedor-Cocina' });
    this.walls.push({ x: 605, y: 510, width: W_THICK, height: 90, label: 'Pared Comedor-Cocina 2' });
  }

  buildCollisionObstacles() {
    this.collisionSystem.clear();

    // 1. Agregar todos los muros
    for (const wall of this.walls) {
      this.collisionSystem.addObstacle({
        x: wall.x,
        y: wall.y,
        width: wall.width,
        height: wall.height,
        type: 'wall',
        label: wall.label
      });
    }

    // 2. Agregar el mobiliario colisionable de cada habitación
    for (const room of this.rooms.values()) {
      const obstacles = room.getObstacles();
      for (const obs of obstacles) {
        this.collisionSystem.addObstacle(obs);
      }
    }
  }

  // Identifica en qué habitación se encuentra una posición (x, y)
  getRoomAt(x, y) {
    for (const room of this.rooms.values()) {
      if (room.contains(x, y)) {
        return room;
      }
    }
    return null; // En pasillo o transición de puerta
  }

  // Obtiene una habitación por su id
  getRoom(id) {
    return this.rooms.get(id);
  }

  // Obtiene un array con todas las habitaciones
  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  // Cambia el estado de luz de una habitación
  setRoomLight(id, on) {
    const room = this.rooms.get(id);
    if (room) {
      room.setLight(on);
      return true;
    }
    return false;
  }

  // Alterna el estado de luz de una habitación
  toggleRoomLight(id) {
    const room = this.rooms.get(id);
    if (room) {
      room.setLight(!room.lightOn);
      return room.lightOn;
    }
    return null;
  }

  // Dibuja el suelo del pasillo central
  renderHallway(ctx) {
    ctx.save();
    // Suelo de mármol/porcelanato del pasillo (y: 300 a 345, x: 40 a 920)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 305, 880, 35);

    // Trama del pasillo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 40; x < 920; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, 305);
      ctx.lineTo(x, 340);
      ctx.stroke();
    }

    // Luces empotradas LED en el pasillo
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let x = 100; x < 900; x += 120) {
      ctx.beginPath();
      ctx.arc(x, 322, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Dibuja los muros y marcos de puertas
  renderWallsAndDoors(ctx) {
    ctx.save();

    // Dibujar umbrales de puertas (acabado de madera o metal en el suelo)
    for (const door of this.doors) {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(door.x, door.y, door.width, door.height);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.strokeRect(door.x, door.y, door.width, door.height);
    }

    // Sombras proyectadas de los muros
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    for (const wall of this.walls) {
      ctx.fillRect(wall.x + 2, wall.y + 2, wall.width, wall.height);
    }

    // Muros principales
    for (const wall of this.walls) {
      ctx.fillStyle = '#0f172a'; // Muro oscuro moderno
      ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

      // Borde exterior o bisel del muro
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }

    ctx.restore();
  }

  // Renderizado completo de la vivienda
  render(ctx) {
    // 1. Suelos de habitaciones
    for (const room of this.rooms.values()) {
      room.renderFloor(ctx);
    }

    // 2. Pasillo central
    this.renderHallway(ctx);

    // 3. Mobiliario de cada habitación
    for (const room of this.rooms.values()) {
      room.renderFurniture(ctx);
    }

    // 4. Muros y accesos
    this.renderWallsAndDoors(ctx);

    // 5. Capa de iluminación por habitación
    for (const room of this.rooms.values()) {
      room.renderLighting(ctx);
    }
  }
}
