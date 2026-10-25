import errors from './errors.json';

export const i18n = {
  errors,
};

export function getErrorMessage(code: string): string {
  return (
    (i18n.errors as Record<string, string>)[code] || 'Erro desconhecido.'
  );
}
