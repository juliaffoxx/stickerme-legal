(function () {
  'use strict';
  const locales = ['en','ar','ca','zh-Hans','zh-Hant','hr','cs','da','nl','en-AU','en-CA','en-GB','fi','fr','fr-CA','de','el','he','hu','id','it','ja','ko','ms','nb','pl','pt-PT','pt-BR','ro','ru','sk','es','es-419','sv','th','tr','uk','vi','sl','ur'];
  const exact = new Map(locales.map(code => [code.toLowerCase(), code]));
  function exactLocale(value) {
    return typeof value === 'string' ? exact.get(value.toLowerCase()) : undefined;
  }
  function matchLanguage(value) {
    if (typeof value !== 'string') return undefined;
    const tag = value.replaceAll('_', '-').toLowerCase();
    if (exact.has(tag)) return exact.get(tag);
    if (tag.startsWith('zh-')) {
      const parts = tag.split('-');
      if (parts.includes('hant')) return 'zh-Hant';
      if (parts.includes('hans')) return 'zh-Hans';
      return parts.some(part => ['tw','hk','mo'].includes(part)) ? 'zh-Hant' : 'zh-Hans';
    }
    if (tag === 'zh') return 'zh-Hans';
    if (tag.startsWith('en-au') || tag.startsWith('en-nz')) return 'en-AU';
    if (tag.startsWith('en-ca')) return 'en-CA';
    if (tag.startsWith('en-gb') || tag.startsWith('en-ie')) return 'en-GB';
    if (tag.startsWith('en-')) return 'en';
    if (tag.startsWith('fr-ca')) return 'fr-CA';
    if (tag.startsWith('pt-br')) return 'pt-BR';
    if (tag === 'pt' || tag.startsWith('pt-')) return 'pt-PT';
    if (tag.startsWith('es-') && !tag.startsWith('es-es')) return 'es-419';
    if (tag === 'no' || tag.startsWith('no-') || tag.startsWith('nb-')) return 'nb';
    return exact.get(tag.split('-')[0]);
  }
  function chooseLanguage(explicit, saved, deviceLanguages) {
    const manual = exactLocale(explicit) || exactLocale(saved);
    if (manual) return manual;
    for (const language of deviceLanguages || []) {
      const matched = matchLanguage(language);
      if (matched) return matched;
    }
    return 'en';
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {locales,matchLanguage,chooseLanguage};
  if (typeof document === 'undefined') return;
  const page = document.documentElement;
  const params = new URLSearchParams(location.search);
  const explicit = exactLocale(params.get('lang'));
  let saved;
  try { saved = localStorage.getItem('stickerme.language'); } catch (_) {}
  const deviceLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  const desired = chooseLanguage(explicit, saved, deviceLanguages);
  if (explicit) { try { localStorage.setItem('stickerme.language', explicit); } catch (_) {} }
  if (desired !== page.dataset.locale) {
    const base = new URL(page.dataset.siteBase, location.href);
    const target = new URL(`${desired}/${page.dataset.page}`, base);
    if (explicit) target.searchParams.set('lang', explicit);
    location.replace(target.href);
    return;
  }
  function bindPicker() {
    for (const link of document.querySelectorAll('.language-picker a[data-language]')) {
      link.addEventListener('click', function () {
        try { localStorage.setItem('stickerme.language', link.dataset.language); } catch (_) {}
      });
    }
    // Keep an explicit manual choice across pages even in restricted webviews.
    if (explicit || exactLocale(saved)) {
      for (const link of document.querySelectorAll('a[href]')) {
        const target = new URL(link.href, location.href);
        if (target.origin === location.origin && target.pathname.startsWith(new URL(page.dataset.siteBase, location.href).pathname) && !link.dataset.language) {
          target.searchParams.set('lang', desired);
          link.href = target.href;
        }
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindPicker);
  else bindPicker();
})();
