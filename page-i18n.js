(function () {
    const translations = window.pageTranslations || {};
    const defaultLang = translations.en ? 'en' : Object.keys(translations)[0];
    let currentLang = localStorage.getItem('language') || defaultLang;
    let analyticsPromise = null;

    const langCodes = {
        en: 'EN',
        hi: 'HI',
        vi: 'VI',
        id: 'ID'
    };

    function hasTranslation(lang, key) {
        return Boolean(translations[lang] && Object.prototype.hasOwnProperty.call(translations[lang], key));
    }

    function t(key, fallback = '') {
        if (hasTranslation(currentLang, key)) {
            return translations[currentLang][key];
        }

        if (hasTranslation(defaultLang, key)) {
            return translations[defaultLang][key];
        }

        return fallback || key;
    }

    function ensureAnalytics() {
        if (window.Tik1sAnalytics) {
            return Promise.resolve(window.Tik1sAnalytics);
        }

        if (analyticsPromise) {
            return analyticsPromise;
        }

        analyticsPromise = new Promise((resolve) => {
            const existingScript = document.querySelector('script[data-analytics-loader="true"]');
            if (existingScript) {
                existingScript.addEventListener('load', () => resolve(window.Tik1sAnalytics || null), { once: true });
                existingScript.addEventListener('error', () => resolve(null), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = '/analytics.js';
            script.async = true;
            script.dataset.analyticsLoader = 'true';
            script.onload = () => resolve(window.Tik1sAnalytics || null);
            script.onerror = () => resolve(null);
            document.head.appendChild(script);
        });

        return analyticsPromise;
    }

    function track(eventName, params = {}) {
        return ensureAnalytics().then((analytics) => {
            if (!analytics || typeof analytics.track !== 'function') {
                return false;
            }

            return analytics.track(eventName, params);
        });
    }

    function updateMetaTag(selector, value) {
        const meta = document.querySelector(selector);
        if (meta) {
            meta.setAttribute('content', value);
        }
    }

    function applyContentTranslations() {
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            element.textContent = t(key, element.textContent);
        });

        document.querySelectorAll('[data-i18n-html]').forEach((element) => {
            const key = element.getAttribute('data-i18n-html');
            element.innerHTML = t(key, element.innerHTML);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = t(key, element.placeholder || '');
        });

        document.querySelectorAll('[data-i18n-title]').forEach((element) => {
            const key = element.getAttribute('data-i18n-title');
            element.setAttribute('title', t(key, element.getAttribute('title') || ''));
        });

        document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
            const key = element.getAttribute('data-i18n-alt');
            element.setAttribute('alt', t(key, element.getAttribute('alt') || ''));
        });

        document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
            const key = element.getAttribute('data-i18n-aria-label');
            element.setAttribute('aria-label', t(key, element.getAttribute('aria-label') || ''));
        });
    }

    function applyMetaTranslations() {
        const pageTitle = t('pageTitle', document.title);
        const pageDescription = t('pageDescription', '');

        document.title = pageTitle;
        document.documentElement.lang = currentLang;

        if (pageDescription) {
            updateMetaTag('meta[name="description"]', pageDescription);
            updateMetaTag('meta[property="og:description"]', pageDescription);
            updateMetaTag('meta[property="twitter:description"]', pageDescription);
        }

        if (pageTitle) {
            updateMetaTag('meta[name="title"]', pageTitle);
            updateMetaTag('meta[property="og:title"]', pageTitle);
            updateMetaTag('meta[property="twitter:title"]', pageTitle);
        }
    }

    function applyLangButton() {
        const currentLangEl = document.getElementById('currentLang');
        if (currentLangEl) {
            currentLangEl.textContent = langCodes[currentLang] || currentLang.toUpperCase();
        }
    }

    function applyTranslations() {
        applyContentTranslations();
        applyMetaTranslations();
        applyLangButton();

        if (typeof window.afterPageLanguageChange === 'function') {
            window.afterPageLanguageChange(currentLang, t);
        }
    }

    function setLanguage(lang) {
        if (!translations[lang]) {
            return;
        }

        currentLang = lang;
        localStorage.setItem('language', lang);
        applyTranslations();
        track('language_change', {
            site_language: lang,
            page_path: window.location.pathname,
        });
    }

    function initLangSwitcher() {
        const switcher = document.querySelector('.lang-switcher');
        const button = document.getElementById('langBtn');
        const options = document.querySelectorAll('.lang-option');

        if (!switcher || !button) {
            return;
        }

        button.addEventListener('click', (event) => {
            event.stopPropagation();
            switcher.classList.toggle('active');
        });

        document.addEventListener('click', (event) => {
            if (!switcher.contains(event.target)) {
                switcher.classList.remove('active');
            }
        });

        options.forEach((option) => {
            option.addEventListener('click', () => {
                setLanguage(option.getAttribute('data-lang'));
                switcher.classList.remove('active');
            });
        });
    }

    window.pageI18n = {
        t,
        setLanguage,
        applyTranslations,
        ensureAnalytics,
        track,
        getCurrentLang: () => currentLang
    };

    function init() {
        if (!translations[currentLang]) {
            currentLang = defaultLang;
        }

        ensureAnalytics();
        initLangSwitcher();
        applyTranslations();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
