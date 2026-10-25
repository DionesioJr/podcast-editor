export class ExecError extends Error {
  constructor(
    public readonly code: string,
    public readonly stderr: string,
    message?: string,
  ) {
    super(message || `Erro ao executar comando: ${stderr}`);
    this.name = 'ExecError';
  }
}
