import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

export const i18n = createInstance();

void i18n.use(initReactI18next).init({
  lng: 'fa',
  fallbackLng: 'en',
  supportedLngs: ['fa', 'en'],
  interpolation: { escapeValue: false },
  initAsync: false,
  resources: {
    fa: {
      translation: {
        ready: 'زیرساخت اپلیکیشن آماده است',
        readyDetail:
          'ساخت نسخهٔ توسعه برای iOS و Android آماده است. ویژگی‌های محصول در مرحلهٔ بعد اضافه می‌شوند.',
        foundation: 'پایهٔ توسعه',
        authPlaceholder: 'مسیرهای احراز هویت در مرحلهٔ بعد تعریف می‌شوند.',
        appPlaceholder: 'صفحه‌های محصول در مرحلهٔ بعد تعریف می‌شوند.',
      },
    },
    en: {
      translation: {
        ready: 'App foundation is ready',
        readyDetail:
          'Development builds for iOS and Android are ready. Product features come next.',
        foundation: 'Development foundation',
        authPlaceholder: 'Authentication routes will be defined next.',
        appPlaceholder: 'Product screens will be defined next.',
      },
    },
  },
});
