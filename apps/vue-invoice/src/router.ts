/**
 * @file router.ts
 * Hash routes (#/invoices): GitHub Pages cannot rewrite deep links, and the
 * hash never reaches the server, so refreshing any page always works.
 * A factory, so tests can use an in-memory history.
 */
import { createRouter, createWebHashHistory, type RouterHistory } from 'vue-router';
import type { Messages } from './i18n/messages';
import InvoiceEditor from './views/InvoiceEditor.vue';
import InvoiceList from './views/InvoiceList.vue';
import InvoicePrint from './views/InvoicePrint.vue';
import NotFound from './views/NotFound.vue';
import SettingsView from './views/SettingsView.vue';

declare module 'vue-router' {
  interface RouteMeta {
    /** Key of the tab title in messages.titles. */
    title: keyof Messages['titles'];
  }
}

export function createAppRouter(history: RouterHistory = createWebHashHistory()) {
  return createRouter({
    history,
    routes: [
      { path: '/', redirect: '/invoices' },
      { path: '/invoices', name: 'list', component: InvoiceList, meta: { title: 'list' } },
      { path: '/invoices/new', name: 'new', component: InvoiceEditor, meta: { title: 'new' } },
      {
        path: '/invoices/:id',
        name: 'edit',
        component: InvoiceEditor,
        props: true,
        meta: { title: 'edit' },
      },
      {
        path: '/invoices/:id/print',
        name: 'print',
        component: InvoicePrint,
        props: true,
        meta: { title: 'print' },
      },
      { path: '/settings', name: 'settings', component: SettingsView, meta: { title: 'settings' } },
      {
        path: '/:pathMatch(.*)*',
        name: 'notFound',
        component: NotFound,
        meta: { title: 'notFound' },
      },
    ],
    scrollBehavior: () => ({ top: 0 }),
  });
}
