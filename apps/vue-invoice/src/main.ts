/**
 * @file main.ts
 * Browser entry point: shared design tokens, fonts and base styles, the app
 * stylesheet, then Pinia + the hash router.
 */
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import '@portfolio/design-tokens/tokens.css';
import '@portfolio/design-tokens/fonts.css';
import '@portfolio/design-tokens/base.css';
import './styles/app.css';
import App from './App.vue';
import { createAppRouter } from './router';

createApp(App).use(createPinia()).use(createAppRouter()).mount('#app');
