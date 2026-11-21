/**
 * EventLog: Panel de registro de eventos en tiempo real
 * Muestra historial detallado con marcas de tiempo y etiquetas cromáticas.
 */
export class EventLog {
  constructor(containerElement, { maxEntries = 120 } = {}) {
    this.container = containerElement;
    this.maxEntries = maxEntries;
    this.autoScroll = true;
    this.entries = [];
  }

  // Agrega una entrada al registro
  log(category, message, type = 'info') {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-ES', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });

    const entry = {
      id: Date.now() + Math.random(),
      time: timeStr,
      category, // 'IA', 'VOZ', 'LUCES', 'CASA', 'SISTEMA', 'ERROR'
      message,
      type // 'info', 'success', 'warning', 'danger'
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    this.renderEntry(entry);
  }

  renderEntry(entry) {
    if (!this.container) return;

    const row = document.createElement('div');
    row.className = `log-entry log-${entry.type}`;

    // Color y clase del badge de categoría
    const catClass = `cat-${entry.category.toLowerCase().replace(/[^a-z]/g, '')}`;

    row.innerHTML = `
      <span class="log-time">${entry.time}</span>
      <span class="log-badge ${catClass}">[${entry.category}]</span>
      <span class="log-message">${entry.message}</span>
    `;

    this.container.appendChild(row);

    // Limitar nodos en el DOM
    while (this.container.children.length > this.maxEntries) {
      this.container.removeChild(this.container.firstChild);
    }

    if (this.autoScroll) {
      this.container.scrollTop = this.container.scrollHeight;
    }
  }

  clear() {
    this.entries = [];
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.log('SISTEMA', 'Registro de eventos reiniciado.', 'info');
  }

  toggleAutoScroll() {
    this.autoScroll = !this.autoScroll;
    return this.autoScroll;
  }
}
