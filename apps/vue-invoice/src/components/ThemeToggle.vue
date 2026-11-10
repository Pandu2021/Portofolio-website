<script setup lang="ts">
/**
 * @file ThemeToggle.vue
 * Cycles System → Light → Dark with the shared theme logic from
 * @portfolio/design-tokens (the same stored choice as the main portfolio).
 */
import { computed, onBeforeUnmount, ref } from 'vue';
import {
  getThemeSnapshot,
  nextTheme,
  setThemePreference,
  subscribeTheme,
  type ThemePreference,
} from '@portfolio/design-tokens';
import { useI18n } from '../i18n/useI18n';
import AppIcon, { type IconName } from './AppIcon.vue';

const { t } = useI18n();
const theme = ref<ThemePreference>(getThemeSnapshot());
const unsubscribe = subscribeTheme(() => {
  theme.value = getThemeSnapshot();
});
onBeforeUnmount(unsubscribe);

const ICON: Record<ThemePreference, IconName> = { light: 'sun', dark: 'moon', system: 'monitor' };
const label = computed(() => {
  const names = { light: t.value.themeLight, dark: t.value.themeDark, system: t.value.themeSystem };
  return `${t.value.themeToggle}: ${names[theme.value]}`;
});
</script>

<template>
  <button
    type="button"
    class="icon-button"
    :aria-label="label"
    :title="label"
    @click="setThemePreference(nextTheme(theme))"
  >
    <AppIcon :name="ICON[theme]" :size="20" />
  </button>
</template>
