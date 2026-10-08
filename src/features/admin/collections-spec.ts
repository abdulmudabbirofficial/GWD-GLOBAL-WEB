/**
 * How each content collection is edited in the admin: its fields, in order,
 * with the input each needs. The API validates every save against the same
 * collection's schema (src/server/modules/admin/collections.ts).
 */
export type FieldKind = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'url' | 'image' | 'color' | 'datetime' | 'strings' | 'pairs';

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  help?: string;
  options?: readonly { value: string; label: string }[];
  /** An empty value is saved as null (optional fields). */
  nullable?: boolean;
  /** For pairs: the two keys of each item. */
  pair?: readonly [{ key: string; label: string }, { key: string; label: string }];
  required?: boolean;
}

export interface CollectionSpec {
  key: string;
  label: string;
  /** Singular, for buttons ("Add a product"). */
  one: string;
  help: string;
  title: (row: Record<string, unknown>) => string;
  subtitle?: (row: Record<string, unknown>) => string;
  fields: readonly FieldSpec[];
  /** Whether rows carry isPublished / sortOrder. */
  editorial?: boolean;
}

const opts = (...pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));
const slug: FieldSpec = { key: 'slug', label: 'Web address name', kind: 'text', required: true, help: 'Lowercase words joined by hyphens, e.g. "mobile-apps". Used in links; change with care.' };
const order: FieldSpec = { key: 'sortOrder', label: 'Order', kind: 'number', help: 'Lower numbers come first.' };
const published: FieldSpec = { key: 'isPublished', label: 'Published', kind: 'boolean', help: 'Unpublished items stay hidden on the site.' };
const str = (v: unknown) => (typeof v === 'string' ? v : '');

export const COLLECTIONS: readonly CollectionSpec[] = [
  {
    key: 'services',
    label: 'Services',
    one: 'service',
    help: 'The fifteen services: their pages, the services ring on Home and the Services gallery.',
    title: (r) => str(r.name),
    subtitle: (r) => str(r.summary),
    editorial: true,
    fields: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      { key: 'shortName', label: 'Short name', kind: 'text', help: 'Used where space is tight (the ring, the menu).' },
      slug,
      { key: 'group', label: 'Group', kind: 'select', options: opts(['engineering', 'Engineering & Platforms'], ['experience', 'Experience, Growth & Advisory']) },
      { key: 'summary', label: 'One-line summary', kind: 'textarea', required: true },
      { key: 'headline', label: 'Headline', kind: 'textarea' },
      { key: 'description', label: 'The promise (long description)', kind: 'textarea', required: true },
      { key: 'capabilities', label: 'What we do', kind: 'pairs', pair: [{ key: 'title', label: 'Capability' }, { key: 'detail', label: 'Detail' }] },
      { key: 'deliverables', label: 'What you get', kind: 'strings' },
      { key: 'idealFor', label: 'Who it suits', kind: 'strings' },
      { key: 'technologies', label: 'Tools (technology keys)', kind: 'strings', help: 'Lowercase keys such as react, nextjs, aws.' },
      order,
      published,
    ],
  },
  {
    key: 'products',
    label: 'Products',
    one: 'product',
    help: 'GWD’s own products, shown in the Products hall and on Home.',
    title: (r) => str(r.name),
    subtitle: (r) => str(r.tagline),
    editorial: true,
    fields: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      slug,
      { key: 'category', label: 'Category', kind: 'text', required: true },
      { key: 'tagline', label: 'Tagline', kind: 'text', required: true },
      { key: 'description', label: 'Description', kind: 'textarea', required: true },
      {
        key: 'status',
        label: 'Status',
        kind: 'select',
        options: opts(['live', 'Live'], ['in_development', 'In development'], ['in_design', 'In design'], ['ideation', 'Ideation'], ['paused', 'Paused']),
      },
      { key: 'isFlagship', label: 'Flagship product', kind: 'boolean' },
      { key: 'features', label: 'Features', kind: 'strings' },
      { key: 'metrics', label: 'Numbers', kind: 'pairs', pair: [{ key: 'value', label: 'Value' }, { key: 'label', label: 'Label' }] },
      { key: 'accent', label: 'Accent colour', kind: 'color' },
      { key: 'href', label: 'Product link', kind: 'url', nullable: true, help: 'Its own page or site. Leave empty if it has none yet.' },
      order,
      published,
    ],
  },
  {
    key: 'team',
    label: 'Team',
    one: 'person',
    help: 'Founders and founding members (About), and the community’s leaders (Community).',
    title: (r) => str(r.name),
    subtitle: (r) => `${str(r.role)} · ${r.group === 'club' ? 'Community' : 'GWD Global'}`,
    editorial: true,
    fields: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      slug,
      { key: 'role', label: 'Role', kind: 'text', required: true },
      { key: 'group', label: 'Where they appear', kind: 'select', options: opts(['core', 'GWD Global (About)'], ['club', 'GWD Community']) },
      {
        key: 'tier',
        label: 'Level',
        kind: 'select',
        options: opts(['founder', 'Founder (large card)'], ['executive', 'Featured founding member (portrait card)'], ['lead', 'Member (list)']),
      },
      { key: 'photoUrl', label: 'Photo', kind: 'image', nullable: true },
      { key: 'bio', label: 'Bio', kind: 'textarea', nullable: true },
      order,
      published,
    ],
  },
  {
    key: 'events',
    label: 'Events',
    one: 'event',
    help: 'Events on Community and Sports. Paste a registration link (a Google Form or any https:// link) and the Register button uses it.',
    title: (r) => str(r.title),
    subtitle: (r) => (typeof r.startsAt === 'string' ? new Date(r.startsAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : ''),
    fields: [
      { key: 'title', label: 'Title', kind: 'text', required: true },
      slug,
      { key: 'summary', label: 'Summary', kind: 'textarea', required: true },
      { key: 'scope', label: 'Page', kind: 'select', options: opts(['club', 'GWD Community'], ['sports', 'GWD Sports'], ['company', 'GWD Global']) },
      { key: 'startsAt', label: 'Starts', kind: 'datetime', required: true },
      { key: 'endsAt', label: 'Ends', kind: 'datetime', nullable: true },
      { key: 'venue', label: 'Venue', kind: 'text', nullable: true },
      { key: 'registrationUrl', label: 'Registration link', kind: 'url', nullable: true, help: 'e.g. https://forms.gle/… or ?register=member for the built-in form.' },
      published,
    ],
  },
  {
    key: 'gallery',
    label: 'Album',
    one: 'photo',
    help: 'The community album. Photos chosen by name on Community and Home come from here.',
    title: (r) => str(r.alt) || str(r.slug),
    subtitle: (r) => `${str(r.slug)} · ${str(r.tag)}`,
    editorial: true,
    fields: [
      { key: 'url', label: 'Photo', kind: 'image', required: true },
      slug,
      { key: 'alt', label: 'Description (for screen readers and captions)', kind: 'textarea', required: true },
      { key: 'tag', label: 'Album filter', kind: 'select', options: opts(['events', 'Events'], ['workshops', 'Workshops'], ['team', 'Team']) },
      order,
      published,
    ],
  },
  {
    key: 'organizations',
    label: 'Organisations',
    one: 'organisation',
    help: 'Client logos, government and ecosystem partners, and sports clubs.',
    title: (r) => str(r.name),
    subtitle: (r) => str(r.kind).replace('_', ' '),
    editorial: true,
    fields: [
      { key: 'name', label: 'Name', kind: 'text', required: true },
      slug,
      {
        key: 'kind',
        label: 'Type',
        kind: 'select',
        options: opts(['client', 'Client (Home wall)'], ['government', 'Government'], ['ecosystem', 'Ecosystem'], ['sports_partner', 'Sports partner'], ['sports_club', 'Sports club (crests)']),
      },
      { key: 'logoUrl', label: 'Logo', kind: 'image', nullable: true },
      { key: 'websiteUrl', label: 'Website', kind: 'url', nullable: true },
      order,
      published,
    ],
  },
  {
    key: 'stats',
    label: 'Numbers',
    one: 'number',
    help: 'Counts shown across the site (team, freelancers, projects, community members). Pages pick them by key.',
    title: (r) => `${str(r.prefix)}${String(r.value ?? '')}${str(r.suffix)} · ${str(r.label)}`,
    subtitle: (r) => `${str(r.key)} · ${str(r.group)}`,
    editorial: true,
    fields: [
      { key: 'label', label: 'Label', kind: 'text', required: true },
      { key: 'key', label: 'Key', kind: 'text', required: true, help: 'Lowercase with underscores, e.g. club_members. Pages look numbers up by this.' },
      { key: 'group', label: 'Group', kind: 'select', options: opts(['company', 'GWD Global'], ['club', 'GWD Community'], ['sports', 'GWD Sports']) },
      { key: 'value', label: 'Value', kind: 'number', required: true },
      { key: 'decimals', label: 'Decimals', kind: 'number' },
      { key: 'prefix', label: 'Before the number', kind: 'text' },
      { key: 'suffix', label: 'After the number', kind: 'text', help: 'e.g. +' },
      { key: 'description', label: 'Description', kind: 'text', nullable: true },
      order,
      published,
    ],
  },
  {
    key: 'highlights',
    label: 'Highlights',
    one: 'highlight',
    help: 'Short cards: community benefits and formats, sports modules and more.',
    title: (r) => str(r.title),
    subtitle: (r) => str(r.group).replace(/_/g, ' '),
    editorial: true,
    fields: [
      { key: 'title', label: 'Title', kind: 'text', required: true },
      slug,
      {
        key: 'group',
        label: 'Where it appears',
        kind: 'select',
        options: opts(
          ['club_pillar', 'Community: what every member gets'],
          ['club_format', 'Community: formats'],
          ['operating_model', 'Home: operating model'],
          ['sports_module', 'Sports: modules'],
          ['sports_journey', 'Sports: journey'],
          ['sports_moat', 'Sports: moat'],
        ),
      },
      { key: 'summary', label: 'Summary', kind: 'textarea', required: true },
      { key: 'detail', label: 'Detail', kind: 'textarea', nullable: true },
      { key: 'metric', label: 'Badge', kind: 'text', nullable: true, help: 'A short word or number shown on the card, e.g. Free.' },
      order,
      published,
    ],
  },
  {
    key: 'locations',
    label: 'Locations',
    one: 'location',
    help: 'Where GWD works: the globe on Home and the countries on About.',
    title: (r) => `${str(r.city)}, ${str(r.country)}`,
    subtitle: (r) => (r.isHq ? 'Headquarters' : str(r.timezone)),
    editorial: true,
    fields: [
      { key: 'city', label: 'City', kind: 'text', required: true },
      { key: 'country', label: 'Country', kind: 'text', required: true },
      { key: 'countryCode', label: 'Country code', kind: 'text', required: true, help: 'Two capital letters, e.g. IN.' },
      { key: 'timezone', label: 'Time zone', kind: 'text', required: true, help: 'e.g. Asia/Kolkata.' },
      { key: 'isHq', label: 'Headquarters', kind: 'boolean' },
      { key: 'latitude', label: 'Latitude', kind: 'number', required: true },
      { key: 'longitude', label: 'Longitude', kind: 'number', required: true },
      order,
      published,
    ],
  },
  {
    key: 'recognitions',
    label: 'Recognitions',
    one: 'recognition',
    help: 'Awards and recognitions (About).',
    title: (r) => str(r.title),
    subtitle: (r) => str(r.detail),
    editorial: true,
    fields: [{ key: 'title', label: 'Title', kind: 'text', required: true }, { key: 'detail', label: 'Detail', kind: 'text', nullable: true }, order, published],
  },
  {
    key: 'announcements',
    label: 'Announcements',
    one: 'announcement',
    help: 'Short notices with an optional link and a display window.',
    title: (r) => str(r.title),
    subtitle: (r) => str(r.body),
    fields: [
      { key: 'title', label: 'Title', kind: 'text', required: true },
      { key: 'body', label: 'Text', kind: 'textarea', required: true },
      { key: 'href', label: 'Link', kind: 'url', nullable: true },
      { key: 'startsAt', label: 'Show from', kind: 'datetime', nullable: true },
      { key: 'endsAt', label: 'Show until', kind: 'datetime', nullable: true },
      published,
    ],
  },
];
