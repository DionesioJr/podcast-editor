import { getErrorActions } from './error-actions';
import { getErrorMessage } from './index';
import erros from './errors.json';

interface AcaoEsperada {
  type: string;
  label: string;
}

const ACOES_DA_SECAO_9: Record<string, AcaoEsperada[]> = {
  INVALID_FILE_FORMAT: [
    { type: 'choose_file', label: 'Escolher outro arquivo' },
  ],
  FILE_TOO_LARGE: [{ type: 'choose_file', label: 'Escolher outro arquivo' }],
  VIDEO_TOO_LARGE: [{ type: 'choose_file', label: 'Escolher outro arquivo' }],
  VIDEO_TOO_LONG: [{ type: 'choose_file', label: 'Escolher outro arquivo' }],
  VIDEO_WITHOUT_AUDIO: [
    { type: 'choose_file', label: 'Escolher outro arquivo' },
  ],
  NO_AUDIO: [{ type: 'choose_file', label: 'Escolher outro arquivo' }],
  CORRUPTED_FILE: [{ type: 'choose_file', label: 'Escolher outro arquivo' }],
  UPLOAD_CONNECTION_LOST: [
    { type: 'wait', label: 'Aguardar' },
    { type: 'retry', label: 'Tentar novamente' },
  ],
  NO_SPEECH_DETECTED: [
    { type: 'continue', label: 'Continuar com volume e formato' },
  ],
  LOW_QUALITY_TRANSCRIPTION: [
    { type: 'continue', label: 'Continuar mesmo assim' },
    { type: 'discard', label: 'Descartar' },
  ],
  TRANSCRIPTION_FAILED: [{ type: 'retry', label: 'Tentar novamente' }],
  AI_UNAVAILABLE: [
    { type: 'retry_later', label: 'Tentar novamente mais tarde' },
  ],
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
  PROJECT_EXPIRED: [
    { type: 'new_project', label: 'Começar novo projeto' },
  ],
};

describe('Ações da seção 9 do PROJETO.md (PDE-101)', () => {
  it.each(Object.entries(ACOES_DA_SECAO_9))(
    'oferece exatamente as ações da tabela para %s',
    (code, acoesEsperadas) => {
      expect(getErrorActions(code)).toEqual(acoesEsperadas);
    },
  );

  it.each(Object.entries(ACOES_DA_SECAO_9))(
    'mantém um tipo de ação não vazio em %s',
    (code) => {
      for (const acao of getErrorActions(code)) {
        expect(acao.type.trim()).not.toBe('');
        expect(acao.label.trim()).not.toBe('');
      }
    },
  );

  it('oferece as duas ações quando a tabela pede Aguardar e Tentar novamente', () => {
    const acoes = getErrorActions('UPLOAD_CONNECTION_LOST');

    expect(acoes).toHaveLength(2);
    expect(acoes.map((acao) => acao.type)).toEqual(['wait', 'retry']);
  });

  it('oferece as duas ações quando a tabela pede Continuar e Descartar', () => {
    const acoes = getErrorActions('LOW_QUALITY_TRANSCRIPTION');

    expect(acoes).toHaveLength(2);
    expect(acoes.map((acao) => acao.type)).toEqual(['continue', 'discard']);
  });
});

describe('Mensagem para cada code da seção 9 (PDE-101)', () => {
  it.each(Object.keys(ACOES_DA_SECAO_9))(
    '%s tem mensagem própria, diferente do fallback genérico',
    (code) => {
      const mensagem = getErrorMessage(code);

      expect(typeof mensagem).toBe('string');
      expect(mensagem.trim()).not.toBe('');
      expect(mensagem).not.toBe('Erro desconhecido.');
    },
  );
});

describe('Cobertura de ações para todos os codes do errors.json (PDE-101)', () => {
  it.each(Object.keys(erros))(
    '%s tem ao menos uma ação oferecida',
    (code) => {
      expect(getErrorActions(code).length).toBeGreaterThan(0);
    },
  );
});

describe('Caminho infeliz das ações de erro (PDE-101)', () => {
  it('devolve lista vazia para um code desconhecido', () => {
    expect(getErrorActions('CODIGO_QUE_NAO_EXISTE')).toEqual([]);
  });

  it('devolve lista vazia para um code vazio', () => {
    expect(getErrorActions('')).toEqual([]);
  });

  it.each(['toString', 'constructor', 'hasOwnProperty', '__proto__'])(
    'não devolve chave herdada do Object.prototype para o code %s',
    (code) => {
      expect(getErrorActions(code)).toEqual([]);
    },
  );

  it.each(['toString', 'constructor', 'valueOf', '__proto__'])(
    'traduz o code herdado %s como desconhecido em vez de devolver função ou objeto',
    (code) => {
      expect(typeof getErrorMessage(code)).toBe('string');
      expect(getErrorMessage(code)).toBe('Erro desconhecido.');
    },
  );
});
