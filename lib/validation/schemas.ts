import { z } from 'zod';

// Shared validation schemas - add more as needed

export const slugSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only');

export const emailSchema = z.string().email();

export const ulidSchema = z.string().length(26);
