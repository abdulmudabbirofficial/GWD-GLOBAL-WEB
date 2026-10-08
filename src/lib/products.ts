import type { ProductStatus } from '@/types/content';

export const STATUS_LABEL: Record<ProductStatus, string> = { live: 'Live', in_development: 'In development', in_design: 'In design', paused: 'Paused', ideation: 'Ideation' };
