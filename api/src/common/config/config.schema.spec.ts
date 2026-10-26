import { validate } from './config.schema';

const variaveisObrigatorias = {
  DATABASE_URL: 'mysql://user:pass@localhost:3306/podcast',
  FILE_URL_SECRET: 'segredo-de-teste',
  OPENAI_API_KEY: 'sk-teste',
  OPENAI_TRANSCRIBE_MODEL: 'whisper-1',
  OPENAI_DIARIZE_MODEL: 'diarize-1',
  OPENAI_LLM_MODEL: 'gpt-4o-mini',
  MIN_FREE_DISK_GB: '5',
  EXPORT_CONCURRENCY: '2',
};

function envSemVariavel(chave: keyof typeof variaveisObrigatorias) {
  const copia: Record<string, unknown> = { ...variaveisObrigatorias };
  delete copia[chave];
  return copia;
}

describe('validate (variáveis de ambiente)', () => {
  it('não lança erro quando todas as variáveis obrigatórias estão presentes', () => {
    expect(() => validate({ ...variaveisObrigatorias })).not.toThrow();
  });

  it('aplica os valores padrão das variáveis opcionais quando ausentes', () => {
    const resultado = validate({ ...variaveisObrigatorias });

    expect(resultado.NODE_ENV).toBe('development');
    expect(resultado.PORT).toBe(3000);
    expect(resultado.THROTTLE_LIMIT).toBe(50);
    expect(resultado.THROTTLE_TTL).toBe(60000);
  });

  it('converte variáveis opcionais informadas como string para número', () => {
    const resultado = validate({
      ...variaveisObrigatorias,
      THROTTLE_LIMIT: '10',
      PORT: '4000',
    });

    expect(resultado.THROTTLE_LIMIT).toBe(10);
    expect(resultado.PORT).toBe(4000);
  });

  it('lança erro com mensagem em português quando falta uma variável obrigatória', () => {
    expect(() => validate(envSemVariavel('DATABASE_URL'))).toThrow(
      /Configuração inválida/,
    );
  });

  it('lança erro quando uma variável obrigatória está ausente', () => {
    expect(() => validate(envSemVariavel('FILE_URL_SECRET'))).toThrow(
      /Configuração inválida/,
    );
  });

  it('lança erro quando MIN_FREE_DISK_GB está ausente', () => {
    expect(() => validate(envSemVariavel('MIN_FREE_DISK_GB'))).toThrow();
  });

  it('lança erro quando todas as variáveis obrigatórias estão ausentes', () => {
    expect(() => validate({})).toThrow(/Configuração inválida/);
  });

  it('lança erro quando MIN_FREE_DISK_GB não é numérico', () => {
    expect(() =>
      validate({ ...variaveisObrigatorias, MIN_FREE_DISK_GB: 'não é número' }),
    ).toThrow();
  });

  it('lança erro quando EXPORT_CONCURRENCY não é numérico', () => {
    expect(() =>
      validate({ ...variaveisObrigatorias, EXPORT_CONCURRENCY: 'abc' }),
    ).toThrow();
  });

  it('lança erro quando NODE_ENV recebe um valor fora do enum permitido', () => {
    expect(() =>
      validate({ ...variaveisObrigatorias, NODE_ENV: 'ambiente-invalido' }),
    ).toThrow();
  });

  it('não expõe o nome de variáveis de ambiente específicas na mensagem de erro', () => {
    try {
      validate(envSemVariavel('DATABASE_URL'));
      fail('deveria ter lançado erro de configuração inválida');
    } catch (erro: any) {
      expect(erro.message).not.toContain('DATABASE_URL');
      expect(erro.message).not.toContain('FILE_URL_SECRET');
    }
  });

  it('aceita os três ambientes válidos definidos no enum', () => {
    expect(() =>
      validate({ ...variaveisObrigatorias, NODE_ENV: 'development' }),
    ).not.toThrow();
    expect(() =>
      validate({ ...variaveisObrigatorias, NODE_ENV: 'staging' }),
    ).not.toThrow();
    expect(() =>
      validate({ ...variaveisObrigatorias, NODE_ENV: 'production' }),
    ).not.toThrow();
  });
});
