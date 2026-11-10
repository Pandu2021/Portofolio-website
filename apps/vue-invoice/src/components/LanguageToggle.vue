<script setup lang="ts">
/**
 * @file LanguageToggle.vue
 * EN | ID switch: two buttons with `aria-pressed` (the language is a
 * preference, every page keeps its URL).
 */
import { LOCALES, useI18n } from '../i18n/useI18n';

const { locale, setLocale, t } = useI18n();
const NAMES = { en: 'English', id: 'Bahasa Indonesia' } as const;
</script>

<template>
  <div class="lang-switch" role="group" :aria-label="t.languageLabel">
    <button
      v-for="option in LOCALES"
      :key="option"
      type="button"
      class="lang-switch__button"
      :lang="option"
      :aria-pressed="option === locale"
      @click="setLocale(option)"
    >
      {{ option.toUpperCase() }}<span class="sr-only"> — {{ NAMES[option] }}</span>
    </button>
  </div>
</template>
