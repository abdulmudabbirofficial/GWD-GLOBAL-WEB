import type { ServiceGroup } from '@/types/content';

/** The deck's two practice groups; the intros paraphrase the deck. */
export const PRACTICE_GROUPS: Record<ServiceGroup, { title: string; intro: string }> = {
  engineering: { title: 'Engineering & Platforms', intro: 'The systems themselves, built to run under real load.' },
  experience: { title: 'Experience, Growth & Advisory', intro: 'Whether anyone uses it, finds it, trusts it, and whether it keeps running.' },
};

/** A practice's two-digit number, from its position in the ordered list ("01"). */
export const practiceNumber = (i: number) => String(i + 1).padStart(2, '0');
