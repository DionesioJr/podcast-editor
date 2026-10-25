export class CanceledError extends Error {
  constructor() {
    super('Execução cancelada');
    this.name = 'CanceledError';
  }
}
