import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import { AppConfig } from "../AppConfig";
import _ from "lodash";

export const i18n = i18next;

export function initI18n(appConfig: AppConfig) {
    i18next
        .use(initReactI18next)
        .use(Backend) // Registering the back-end plugin to source translations from hosted files. Example: public/locales/{{lng}}/{{ns}}.json
        .use(LanguageDetector)
        .init({
            fallbackLng: appConfig?.i18n?.fallbackLanguage || "en",
            debug: appConfig?.isDebug === true,
            interpolation: {
                escapeValue: false, // not needed for react as it escapes by default
            },
            detection: {
                // https://github.com/i18next/i18next-browser-languageDetector#detector-options
            },
            parseMissingKeyHandler: (key, defaultValue) => {
                return `[! ${key} !]`;
            },
            backend: {
                loadPath: _.trimEnd(appConfig.appUrl, "/") + "/locales/{{lng}}/{{ns}}.json",
            },
        });

    if (appConfig?.i18n?.tagTranslations === true) {
        const innerT = i18next.t;
        i18next.t = (key) => {
            return `[# ${innerT(key)} #]`;
        };
    }
}
