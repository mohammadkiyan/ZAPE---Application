import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { fa } from './resources/fa';
import { en } from './resources/en';

export const NAMESPACES = ['common', 'onboarding', 'relationship', 'shell'] as const;

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof fa;
  }
}

export const i18n = createInstance();

void i18n.use(initReactI18next).init({
  lng: 'fa',
  fallbackLng: 'en',
  supportedLngs: ['fa', 'en'],
  ns: NAMESPACES,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  initAsync: false,
  resources: { fa, en },
});
