import i18next from 'i18next';
import { getErrorMessage } from './index';
import erros from './errors.json';

describe('i18n (PDE-8)', () => {
  it('carrega apenas o idioma pt-BR nos recursos', () => {
    const idiomas = Object.keys(i18next.options.resources ?? {});

    expect(idiomas).toEqual(['pt-BR']);
  });

  it('define pt-BR como idioma atual e como fallback', () => {
    expect(i18next.options.lng).toBe('pt-BR');
    expect(i18next.options.fallbackLng).toEqual(expect.anything());
    expect(i18next.language || i18next.options.lng).toBe('pt-BR');
  });

  it('carrega todas as mensagens de erro do errors.json em pt-BR', () => {
    const mensagens = i18next.getResourceBundle('pt-BR', 'translation')?.errors;

    expect(mensagens).toEqual(erros);
  });

  it('getErrorMessage traduz um código conhecido para português', () => {
    expect(getErrorMessage('PROJECT_NOT_FOUND')).toBe('Projeto não encontrado.');
  });

  it('getErrorMessage cai na mensagem padrão para um código desconhecido', () => {
    expect(getErrorMessage('CODIGO_QUE_NAO_EXISTE')).toBe('Erro desconhecido.');
  });
});
