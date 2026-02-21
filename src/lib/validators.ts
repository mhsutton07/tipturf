import { z } from 'zod';
import type { Platform, TimeBucket } from '@/types';

// Reject notes that look like addresses or personal names
const ADDRESS_PATTERN =
  /\b\d+\s+\w+\s+(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|ln|lane|way|ct|court|pl|place)\b/i;
const NAME_PATTERN = /\b(mr|mrs|ms|miss|dr)\b\.?\s+[A-Z][a-z]+/;

const notesSchema = z
  .string()
  .max(140, 'Notes must be 140 characters or fewer')
  .optional()
  .refine(
    (val) => !val || !ADDRESS_PATTERN.test(val),
    'Notes may not contain street addresses'
  )
  .refine(
    (val) => !val || !NAME_PATTERN.test(val),
    'Notes may not contain personal names'
  );

export const TipLogInputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  timeBucket: z.enum([
    'early_morning',
    'morning',
    'lunch',
    'afternoon',
    'dinner',
    'evening',
    'late_night',
  ] as [TimeBucket, ...TimeBucket[]]),
  platform: z.enum([
    'uber_eats',
    'doordash',
    'instacart',
    'grubhub',
    'amazon_flex',
    'shipt',
    'other',
  ] as [Platform, ...Platform[]]),
  tipped: z.boolean(),
  tipAmount: z.number().min(0.01).max(99.99).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  notes: notesSchema,
});

export type TipLogInput = z.infer<typeof TipLogInputSchema>;
