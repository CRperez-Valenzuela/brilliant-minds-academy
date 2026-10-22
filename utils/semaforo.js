'use strict';

/** Semáforo no bloqueante: limita las cargas pesadas simultáneas (memoria de buffers + transacciones abiertas). */
class Semaforo {
  constructor(max) {
    this.max = max;
    this.enUso = 0;
  }

  /** Devuelve una función `liberar` idempotente o null si no hay cupo. */
  intentar() {
    if (this.enUso >= this.max) return null;
    this.enUso += 1;
    let liberado = false;
    return () => {
      if (liberado) return;
      liberado = true;
      this.enUso -= 1;
    };
  }
}

module.exports = { Semaforo };
