/**
 * @file useCartActions.ts
 * Cart actions that also tell screen-reader users what happened.
 */
import { useCallback, useMemo } from 'react';
import { useAnnounce } from '../a11y/Announcer';
import { useCart } from '../cart/CartContext';
import type { Product } from '../data/products';
import { useI18n } from '../i18n/I18nContext';

/** Add / change / remove products, each with a localized announcement. */
export function useCartActions() {
  const { dispatch } = useCart();
  const { t, locale } = useI18n();
  const announce = useAnnounce();

  const add = useCallback(
    (product: Product, quantity = 1) => {
      dispatch({ type: 'add', productId: product.id, quantity });
      announce(t.addedToCart(product.name[locale], quantity));
    },
    [dispatch, announce, t, locale],
  );

  const setQuantity = useCallback(
    (product: Product, quantity: number) => {
      dispatch({ type: 'setQuantity', productId: product.id, quantity });
      announce(
        quantity > 0
          ? t.quantityChanged(product.name[locale], quantity)
          : t.removed(product.name[locale]),
      );
    },
    [dispatch, announce, t, locale],
  );

  const remove = useCallback(
    (product: Product) => {
      dispatch({ type: 'remove', productId: product.id });
      announce(t.removed(product.name[locale]));
    },
    [dispatch, announce, t, locale],
  );

  return useMemo(() => ({ add, setQuantity, remove }), [add, setQuantity, remove]);
}
