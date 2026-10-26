import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import errors from './errors.json';

const resources = {
  'pt-BR': {
    translation: {
      errors,
    },
  },
};

i18next.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources,
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: {
    escapeValue: false,
  },
  react: {
    transEmptyNodeValue: '',
  },
});

export function getErrorMessage(code: string): string {
  return (
    (resources['pt-BR'].translation.errors as Record<string, string>)[code] ||
    'Erro desconhecido.'
  );
}
