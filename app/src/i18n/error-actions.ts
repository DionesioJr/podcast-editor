export type ErrorActionType =
  | 'choose_file'
  | 'wait'
  | 'retry'
  | 'continue'
  | 'discard'
  | 'retry_later'
  | 'continue_manually'
  | 'rewrite'
  | 'adjust'
  | 'go_to_review'
  | 'select_format'
  | 'download'
  | 'new_project';

export interface ErrorAction {
  type: ErrorActionType;
  label: string;
}

export const ERROR_ACTIONS: Record<string, ErrorAction[]> = {
  INVALID_FILE_FORMAT: [{ type: 'choose_file', label: 'Escolher outro arquivo' }],
  FILE_TOO_LARGE: [{ type: 'choose_file', label: 'Escolher outro arquivo' }],
  VIDEO_TOO_LARGE: [{ type: 'choose_file', label: 'Escolher outro arquivo' }],
  VIDEO_TOO_LONG: [{ type: 'choose_file', label: 'Escolher outro arquivo' }],
  VIDEO_WITHOUT_AUDIO: [{ type: 'choose_file', label: 'Escolher outro arquivo' }],
  NO_AUDIO: [{ type: 'choose_file', label: 'Escolher outro arquivo' }],
  CORRUPTED_FILE: [{ type: 'choose_file', label: 'Escolher outro arquivo' }],
  UPLOAD_CONNECTION_LOST: [
    { type: 'wait', label: 'Aguardar' },
    { type: 'retry', label: 'Tentar novamente' },
  ],
  NO_SPEECH_DETECTED: [{ type: 'continue', label: 'Continuar com volume e formato' }],
  LOW_QUALITY_TRANSCRIPTION: [
    { type: 'continue', label: 'Continuar mesmo assim' },
    { type: 'discard', label: 'Descartar' },
  ],
  TRANSCRIPTION_FAILED: [{ type: 'retry', label: 'Tentar novamente' }],
  AI_UNAVAILABLE: [{ type: 'retry_later', label: 'Tentar novamente mais tarde' }],
  AI_ANALYSIS_LIMIT_EXCEEDED: [
    { type: 'continue_manually', label: 'Continuar editando manualmente' },
  ],
  AI_OUT_OF_SCOPE: [{ type: 'rewrite', label: 'Reescrever a instrução' }],
  INVALID_TARGET_DURATION: [{ type: 'adjust', label: 'Ajustar valor' }],
  VIDEO_TOO_SHORT: [{ type: 'go_to_review', label: 'Voltar à revisão' }],
  NO_FORMAT_SELECTED: [{ type: 'select_format', label: 'Marcar formato' }],
  EXPORT_LIMIT_EXCEEDED: [
    { type: 'download', label: 'Baixar os arquivos já exportados' },
  ],
  EXPORT_FAILED: [{ type: 'retry', label: 'Tentar novamente' }],
  NO_DISK_SPACE: [{ type: 'retry_later', label: 'Tentar mais tarde' }],
  PROJECT_EXPIRED: [{ type: 'new_project', label: 'Começar novo projeto' }],
  UPLOAD_FAILED: [{ type: 'retry', label: 'Tentar novamente' }],
  PROJECT_NOT_FOUND: [{ type: 'new_project', label: 'Começar novo projeto' }],
  INVALID_TOKEN: [{ type: 'new_project', label: 'Começar novo projeto' }],
  VALIDATION_ERROR: [{ type: 'retry', label: 'Tentar novamente' }],
  UNAUTHORIZED: [{ type: 'new_project', label: 'Começar novo projeto' }],
  FORBIDDEN: [{ type: 'retry', label: 'Tentar novamente' }],
  NOT_FOUND: [{ type: 'new_project', label: 'Começar novo projeto' }],
  CONFLICT: [{ type: 'retry', label: 'Tentar novamente' }],
  RATE_LIMIT_EXCEEDED: [{ type: 'retry', label: 'Tentar novamente' }],
  INTERNAL_ERROR: [{ type: 'retry', label: 'Tentar novamente' }],
  SERVER_ERROR: [{ type: 'retry', label: 'Tentar novamente' }],
  NETWORK_ERROR: [{ type: 'retry', label: 'Tentar novamente' }],
  TIMEOUT: [{ type: 'retry', label: 'Tentar novamente' }],
};

export function getErrorActions(code: string): ErrorAction[] {
  return ERROR_ACTIONS[code] ?? [];
}
