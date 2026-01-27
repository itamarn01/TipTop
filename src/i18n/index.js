import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import en from './en.json';
import he from './he.json';
import { I18nManager } from 'react-native';

const i18n = new I18n({
    en,
    he
});

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Set the locale once at the beginning of your app.
const deviceLanguage = getLocales()[0].languageCode;
i18n.locale = deviceLanguage;

// If the device language is Hebrew, we might want to ensure RTL is set to true initially, 
// though we will manage this more explicitly in our Redux store and App.js
if (deviceLanguage === 'he' && !I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
}

export default i18n;
