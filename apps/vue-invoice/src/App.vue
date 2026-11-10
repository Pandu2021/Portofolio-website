<script setup lang="ts">
/**
 * @file App.vue
 * Page frame: skip link, demo notice, header (navigation, language, theme),
 * the routed page, footer and one polite live region.
 *
 * After every in-app navigation the page title is updated and focus moves to
 * the new page's <h1>, so screen-reader and keyboard users know the page changed.
 */
import { computed, nextTick, watch } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { announcement } from './a11y/announcer';
import AppIcon from './components/AppIcon.vue';
import LanguageToggle from './components/LanguageToggle.vue';
import ThemeToggle from './components/ThemeToggle.vue';
import { useI18n } from './i18n/useI18n';

const REPO_URL = 'https://github.com/Pandu2021/Portofolio-website/tree/main/apps/vue-invoice';

const { t, locale } = useI18n();
const route = useRoute();
// The portfolio lives one level up: /Portofolio-website/ (EN) or /Portofolio-website/id/.
const portfolioHref = computed(() => (locale.value === 'id' ? '../id/' : '../'));

watch(
  () => [route.meta.title, t.value] as const,
  ([key, messages]) => {
    const page = key ? messages.titles[key] : messages.titles.list;
    document.title = `${page} · ${messages.appName} — Vue | Pandu Wicaksono`;
  },
  { immediate: true },
);

let firstNavigation = true;
watch(
  () => route.fullPath,
  async () => {
    if (firstNavigation) {
      firstNavigation = false;
      return;
    }
    await nextTick();
    document.querySelector<HTMLElement>('main h1')?.focus();
  },
);

/** Hash routing: a plain #main link would be treated as a route, so move focus instead. */
function skipToMain(event: MouseEvent): void {
  event.preventDefault();
  document.getElementById('main')?.focus();
}
</script>

<template>
  <a href="#main" class="skip-link no-print" @click="skipToMain">{{ t.skipToContent }}</a>
  <p class="demo-banner no-print">{{ t.demoBanner }}</p>

  <header class="header no-print">
    <div class="container header__inner">
      <RouterLink to="/invoices" class="brand">
        <span class="brand__mark" aria-hidden="true">IV</span>
        {{ t.appName }}
      </RouterLink>

      <nav :aria-label="t.mainNav" class="header__nav">
        <RouterLink to="/invoices" class="nav-link" active-class="" exact-active-class="active">
          {{ t.navInvoices }}
        </RouterLink>
        <RouterLink to="/invoices/new" class="nav-link" active-class="" exact-active-class="active">
          <AppIcon name="plus" :size="16" />
          {{ t.navNew }}
        </RouterLink>
        <RouterLink to="/settings" class="nav-link" active-class="" exact-active-class="active">
          {{ t.navSettings }}
        </RouterLink>
      </nav>

      <div class="header__controls">
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </div>
  </header>

  <main id="main" tabindex="-1" class="container main">
    <!-- Keyed by path: /invoices/A → /invoices/B re-creates the editor with fresh form state. -->
    <RouterView :key="route.fullPath" />
  </main>

  <footer class="footer no-print">
    <div class="container footer__inner">
      <a :href="portfolioHref" class="link-strong">
        <AppIcon name="arrowLeft" :size="16" />
        {{ t.backToPortfolio }}
      </a>
      <p>{{ t.footerNote }}</p>
      <a :href="REPO_URL" target="_blank" rel="noopener noreferrer" class="link-muted">
        {{ t.sourceCode }}
        <AppIcon name="external" :size="14" />
        <span class="sr-only"> {{ t.opensInNewTab }}</span>
      </a>
    </div>
  </footer>

  <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</div>
</template>
