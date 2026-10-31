import { getErrorMessage } from './index';
import erros from './errors.json';

const MENSAGENS_DA_SECAO_9: Record<string, string> = {
  INVALID_FILE_FORMAT:
    'Não conseguimos abrir esse arquivo. Envie um vídeo em MP4, MOV, MKV, WEBM ou AVI.',
  FILE_TOO_LARGE: 'Esse vídeo tem X GB. O limite é 2 GB.',
  VIDEO_TOO_LARGE: 'Esse vídeo tem X GB. O limite é 2 GB.',
  VIDEO_TOO_LONG: 'Esse vídeo tem 2 h 35 min. O limite é 2 horas.',
  VIDEO_WITHOUT_AUDIO:
    'Esse vídeo não tem som. As ferramentas deste editor precisam de áudio.',
  NO_AUDIO:
    'Esse vídeo não tem som. As ferramentas deste editor precisam de áudio.',
  CORRUPTED_FILE: 'Esse arquivo parece estar danificado e não pôde ser lido.',
  UPLOAD_CONNECTION_LOST:
    'A conexão caiu. Estamos tentando continuar de onde parou…',
  NO_SPEECH_DETECTED:
    'Não encontramos fala neste vídeo. Legendas, cortes de pausa e IA ficam indisponíveis.',
  LOW_QUALITY_TRANSCRIPTION:
    'A transcrição pode ter muitos erros. O vídeo está em português? O áudio está claro?',
  TRANSCRIPTION_FAILED: 'Não conseguimos transcrever o áudio agora.',
  AI_UNAVAILABLE:
    'A IA está indisponível no momento. O restante do editor continua funcionando.',
  AI_ANALYSIS_LIMIT_EXCEEDED: 'Você usou as 5 análises da IA deste projeto.',
  AI_OUT_OF_SCOPE:
    'Isso não é possível aqui. A IA deste editor só sugere cortes.',
  INVALID_TARGET_DURATION: 'Escolha uma duração entre X min e Y min.',
  VIDEO_TOO_SHORT: 'Seu vídeo ficou curto demais. Restaure alguns trechos.',
  NO_FORMAT_SELECTED: 'Escolha pelo menos um formato: horizontal ou vertical.',
  EXPORT_LIMIT_EXCEEDED:
    'Você atingiu o limite de exportações deste projeto.',
  EXPORT_FAILED:
    'Algo deu errado ao gerar seu vídeo. Suas edições estão salvas.',
  NO_DISK_SPACE:
    'Estamos com muita demanda agora. Tente de novo em alguns minutos.',
  PROJECT_EXPIRED:
    'Este projeto expirou e foi apagado para proteger sua privacidade.',
};

const CODES_INTERNOS = ['SERVER_ERROR', 'NETWORK_ERROR', 'TIMEOUT'] as const;

describe('Cobertura da seção 9 do PROJETO.md (PDE-9)', () => {
  it.each(Object.entries(MENSAGENS_DA_SECAO_9))(
    'traduz %s com o texto da seção 9',
    (code, expectedMessage) => {
      expect(getErrorMessage(code)).toBe(expectedMessage);
    },
  );

  it.each([...Object.keys(MENSAGENS_DA_SECAO_9), ...CODES_INTERNOS])(
    'não deixa %s cair na mensagem genérica',
    (code) => {
      expect(getErrorMessage(code)).not.toBe('Erro desconhecido.');
    },
  );

  it('guarda texto não vazio para cada entrada do arquivo', () => {
    for (const [code, message] of Object.entries(erros)) {
      expect({ code, tipo: typeof message }).toEqual({
        code,
        tipo: 'string',
      });
      expect({ code, vazio: (message as string).trim() === '' }).toEqual({
        code,
        vazio: false,
      });
    }
  });
});
