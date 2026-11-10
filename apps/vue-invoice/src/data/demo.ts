/**
 * @file demo.ts
 * Sample invoices shown on first visit (and after "Reset demo data").
 * ALL data is fictional: no real customers, companies or payment providers.
 */
import { DEFAULT_PRICING, type Invoice } from '../lib/invoice';

/** Fresh copies of the demo invoices (callers may mutate them). */
export function demoInvoices(): Invoice[] {
  return [
    {
      id: 'demo-1',
      number: 'INV-2026-0001',
      customer: 'Contoh Retail Co. (fictional)',
      issueDate: '2026-10-01',
      dueDate: '2026-10-15',
      status: 'paid',
      lines: [
        {
          id: 'demo-1-a',
          description: 'Online store maintenance (monthly)',
          quantity: 1,
          unitPrice: 2_500_000_00,
          discountBp: 0,
        },
        {
          id: 'demo-1-b',
          description: 'Product photo editing',
          quantity: 40,
          unitPrice: 15_000_00,
          discountBp: 1_000,
        },
      ],
      discount: { type: 'percent', value: 0 },
      pricing: { ...DEFAULT_PRICING },
      notes: 'Thank you for your business.',
    },
    {
      id: 'demo-2',
      number: 'INV-2026-0002',
      customer: 'Demo Catering Studio (fictional)',
      issueDate: '2026-10-20',
      dueDate: '2026-11-03',
      status: 'sent',
      lines: [
        {
          id: 'demo-2-a',
          description: 'Lunch box (demo menu)',
          quantity: 120,
          unitPrice: 35_000_00,
          discountBp: 0,
        },
        {
          id: 'demo-2-b',
          description: 'Delivery within the city',
          quantity: 3,
          unitPrice: 50_000_00,
          discountBp: 0,
        },
      ],
      discount: { type: 'amount', value: 200_000_00 },
      pricing: { taxRateBp: 1_100, serviceFeeBp: 500, taxMode: 'exclusive', roundingStep: 100 },
      notes: '',
    },
    {
      id: 'demo-3',
      number: 'INV-2026-0003',
      customer: 'Sample Design Lab (fictional)',
      issueDate: '2026-11-05',
      dueDate: '2026-11-19',
      status: 'draft',
      lines: [
        {
          id: 'demo-3-a',
          description: 'Landing page design',
          quantity: 1,
          unitPrice: 7_750_000_00,
          discountBp: 0,
        },
      ],
      discount: { type: 'percent', value: 500 },
      pricing: { taxRateBp: 1_100, serviceFeeBp: 0, taxMode: 'inclusive', roundingStep: 1 },
      notes: 'Prices include tax.',
    },
  ];
}
