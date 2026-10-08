import { z } from 'zod';
import { INTENT_KEYS, PRACTICE_OPTIONS, intentByKey } from '@/features/register/intents';

export const ENQUIRY_TOPICS = ['project', 'partnership', 'club', 'sports', 'careers', 'other'] as const;
export const ENQUIRY_STATUSES = ['new', 'in_progress', 'closed', 'spam'] as const;

const clean = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    // Strip control characters; they have no place in a contact form.
    .transform((v) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ''));

const FORMAT: Record<string, RegExp> = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/\S+$/i,
  number: /^\d{1,7}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  tel: /^[+\d][\d\s()-]{5,24}$/,
};

/** Shared by the API and the client form, so validation messages match. */
export const enquiryInputSchema = z
  .object({
    name: clean(120).pipe(z.string().min(2, 'Please tell us your name.')),
    email: z
      .email('Please enter a valid email address.')
      .max(254)
      .transform((v) => v.toLowerCase()),
    company: clean(160)
      .optional()
      .transform((v) => v || undefined),
    topic: z.enum(ENQUIRY_TOPICS, { message: 'Choose what this is about.' }),
    message: clean(5000).optional().default(''),
    /** A registration from one of the site's "ways in" (see features/register/intents). */
    intent: z.enum(INTENT_KEYS).optional(),
    /** That registration's answers, keyed by field name. */
    details: z.record(z.string().max(40), clean(1000)).optional(),
    sourcePath: z
      .string()
      .max(200)
      .regex(/^\/[\w\-/#]*$/)
      .optional(),
    /** Honeypot, real people never see or fill this field. */
    website: z.string().max(200).optional(),
    /** Milliseconds the form was open before submit (bot heuristic). */
    elapsedMs: z.number().int().nonnegative().max(86_400_000).optional(),
  })
  .superRefine((input, ctx) => {
    const intent = intentByKey(input.intent);
    const messageRequired = intent ? intent.message.required : true;
    if (messageRequired && input.message.length < 10) {
      ctx.addIssue({ code: 'custom', path: ['message'], message: 'A little more detail helps (at least 10 characters).' });
    }
    if (!intent) return;

    const details = input.details ?? {};
    const known = new Set(intent.fields.map((f) => f.name));
    for (const key of Object.keys(details)) {
      if (!known.has(key)) ctx.addIssue({ code: 'custom', path: ['details', key], message: 'Unknown field.' });
    }
    for (const field of intent.fields) {
      const value = details[field.name] ?? '';
      if (!value) {
        if (field.required)
          ctx.addIssue({ code: 'custom', path: ['details', field.name], message: field.type === 'select' ? 'Please choose one.' : 'Please fill this in.' });
        continue;
      }
      const format = FORMAT[field.type];
      if (format && !format.test(value)) {
        ctx.addIssue({ code: 'custom', path: ['details', field.name], message: `Please check the ${field.label.toLowerCase()}.` });
      }
      const options = field.options?.filter((o) => o !== PRACTICE_OPTIONS);
      const freeOptions = field.options?.includes(PRACTICE_OPTIONS);
      if (options?.length && !freeOptions && !options.includes(value)) {
        ctx.addIssue({ code: 'custom', path: ['details', field.name], message: 'Please choose one of the options.' });
      }
    }
  });

export type EnquiryInput = z.infer<typeof enquiryInputSchema>;

export const enquiryListQuerySchema = z.object({
  status: z.enum(ENQUIRY_STATUSES).optional(),
  /** A page's registrations (see INTENT_GROUPS), or `general` for the plain contact form. */
  group: z.enum(['products', 'community', 'sports', 'general']).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const enquiryUpdateSchema = z.object({ status: z.enum(ENQUIRY_STATUSES) });
