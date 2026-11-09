/**
 * @file pricing-validators.ts
 * Custom validators for the pricing form (pure functions, unit-tested).
 */
import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Value must be a whole number (empty values are left to `required`). */
export const integerValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value: unknown = control.value;
  if (value === null || value === '' || value === undefined) return null;
  return Number.isInteger(value) ? null : { integer: true };
};

/** Value may have at most `digits` decimals. */
export function maxDecimalsValidator(digits: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;
    if (typeof value !== 'number') return null;
    const factor = 10 ** digits;
    return Math.abs(Math.round(value * factor) - value * factor) < 1e-9 ? null : { decimals: true };
  };
}

/**
 * Group validator: the free-delivery threshold must be 0 (off) or higher than
 * the delivery fee — otherwise every order would be free anyway.
 */
export const freeDeliveryValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const fee: unknown = group.get('deliveryFee')?.value;
  const threshold: unknown = group.get('freeDeliveryFrom')?.value;
  if (typeof fee !== 'number' || typeof threshold !== 'number') return null;
  return threshold === 0 || threshold > fee ? null : { freeBelowFee: true };
};
