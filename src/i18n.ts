// إعداد الترجمة: كل نص يراه العميل يأتي من src/locales/ar.json.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ar from './locales/ar.json';

i18n.use(initReactI18next).init({
  lng: 'ar',
  resources: { ar: { translation: ar } },
  interpolation: { escapeValue: false }, // React يحمي النصوص بنفسه
});

export default i18n;
