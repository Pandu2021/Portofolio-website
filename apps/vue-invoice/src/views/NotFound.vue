<script setup lang="ts">
/** @file NotFound.vue — unknown hash route. */
import { RouterLink } from 'vue-router';
import { useI18n } from '../i18n/useI18n';

const { t } = useI18n();
</script>

<template>
  <section class="card empty" aria-labelledby="not-found-title">
    <h1 id="not-found-title" tabindex="-1">{{ t.notFoundTitle }}</h1>
    <p>{{ t.notFoundText }}</p>
    <RouterLink to="/invoices" class="btn btn--primary">{{ t.goToInvoices }}</RouterLink>
  </section>
</template>
