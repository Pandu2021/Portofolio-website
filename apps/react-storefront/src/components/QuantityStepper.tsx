/**
 * @file QuantityStepper.tsx
 * − [ n ] + control with accessible labels and limits.
 */
import { MAX_QUANTITY } from '../lib/pricing';
import { useI18n } from '../i18n/I18nContext';
import { Icon } from './Icon';

interface QuantityStepperProps {
  /** Product name used in the button labels ("Increase quantity of Latte"). */
  name: string;
  value: number;
  onChange: (value: number) => void;
  /** Smallest allowed value (1 on product pages, 0 in the cart = remove). */
  min?: number;
}

/** Quantity control; the number is announced through the buttons' labels. */
export function QuantityStepper({ name, value, onChange, min = 1 }: QuantityStepperProps) {
  const { t } = useI18n();
  return (
    <div className="stepper" role="group" aria-label={`${t.quantity}: ${name}`}>
      <button
        type="button"
        className="stepper__button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={t.decrease(name)}
      >
        <Icon name="minus" size={16} />
      </button>
      <output className="stepper__value" aria-live="off">
        {value}
      </output>
      <button
        type="button"
        className="stepper__button"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_QUANTITY}
        aria-label={t.increase(name)}
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
