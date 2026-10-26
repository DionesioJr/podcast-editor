export interface ExecOptions {
  timeoutMs?: number;
  shouldCancel?: () => boolean;
  checkCancelIntervalMs?: number;
  durationMs?: number;
}
