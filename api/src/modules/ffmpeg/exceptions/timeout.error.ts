export class TimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`Timeout após ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}
