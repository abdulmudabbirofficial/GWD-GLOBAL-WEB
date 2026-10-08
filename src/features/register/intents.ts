/**
 * Every way someone can register with GWD, with the short form each one
 * needs. Shared by the drawer form (client) and the enquiries API (server),
 * so both validate the same fields.
 *
 * Name and email are always asked and are not listed here. Option lists are
 * form choices, not company facts.
 */

export type EnquiryTopic = 'project' | 'partnership' | 'club' | 'sports' | 'careers' | 'other';
export type FieldType = 'text' | 'email' | 'tel' | 'url' | 'number' | 'date' | 'select' | 'textarea';

export interface IntentField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: readonly string[];
  /** Example value, shown as the placeholder. */
  hint?: string;
  autoComplete?: string;
  /** Sits beside the next half-width field on wider screens. */
  half?: boolean;
  /** Also stored as the enquiry's organisation. */
  organisation?: boolean;
}

export interface Intent {
  key: string;
  topic: EnquiryTopic;
  /** Button label: a verb and an object. */
  cta: string;
  title: string;
  /** What happens, in one or two sentences. */
  summary: string;
  /** Who this is for. */
  audience: string;
  fields: IntentField[];
  /** The free-text box at the end of the form. */
  message: { label: string; required: boolean; hint?: string };
  success: string;
}

const phone: IntentField = { name: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', half: true, hint: '+91 98xxxxxxxx' };
const PRACTICE_PLACEHOLDER = '__practices__';

export const INTENTS = [
  /* ── Products & Services ── */
  {
    key: 'project',
    topic: 'project',
    cta: 'Send a brief',
    title: 'Brief a new build',
    summary:
      'Something new to build: a product, platform, app, site or system. Tell us the problem and we reply with a plan, a timeline and an honest view of what it takes.',
    audience: 'Founders, companies and teams with something to build',
    fields: [
      { ...phone },
      { name: 'company', label: 'Company', type: 'text', autoComplete: 'organization', half: true, organisation: true },
      { name: 'practice', label: 'Closest service', type: 'select', options: [PRACTICE_PLACEHOLDER] },
      {
        name: 'budget',
        label: 'Budget range',
        type: 'select',
        half: true,
        options: ['Under ₹5 lakh', '₹5-15 lakh', '₹15-50 lakh', 'Above ₹50 lakh', 'Not sure yet'],
      },
      {
        name: 'timeline',
        label: 'When do you need it',
        type: 'select',
        half: true,
        options: ['As soon as possible', 'In 1-3 months', 'In 3-6 months', 'Just exploring'],
      },
    ],
    message: { label: 'What needs to get done?', required: true, hint: 'The problem, who it is for, and anything already built…' },
    success: 'The right lead at GWD will read your brief and reply with questions or a plan.',
  },
  {
    key: 'service',
    topic: 'project',
    cta: 'Request a service',
    title: 'Request a service',
    summary: 'Ongoing help from one service: support and maintenance, a specific deliverable, an audit or advice. Pick the service and tell us what you need.',
    audience: 'Teams that need a specific capability, now or on an ongoing basis',
    fields: [
      { ...phone },
      { name: 'company', label: 'Company', type: 'text', autoComplete: 'organization', half: true, organisation: true },
      { name: 'practice', label: 'Service', type: 'select', required: true, options: [PRACTICE_PLACEHOLDER] },
      {
        name: 'kind',
        label: 'What kind of help',
        type: 'select',
        required: true,
        options: ['Ongoing support and maintenance', 'A specific deliverable', 'An audit or review', 'Advice and consulting', 'Not sure yet'],
      },
    ],
    message: { label: 'What do you need?', required: true, hint: 'What exists today and what should change…' },
    success: 'We will match your request to the right service lead and reply shortly.',
  },
  {
    key: 'freelancer',
    topic: 'careers',
    cta: 'Join as a freelancer',
    title: 'Join the freelance network',
    summary: 'Work on real client projects alongside GWD’s team. Every freelancer in the network is selected through an interview, so tell us what you do best and show us something you have made.',
    audience: 'Developers, designers, marketers and creators, students included',
    fields: [
      { ...phone },
      { name: 'city', label: 'City', type: 'text', autoComplete: 'address-level2', half: true },
      { name: 'skill', label: 'Main skill', type: 'select', required: true, options: [PRACTICE_PLACEHOLDER, 'Something else'] },
      {
        name: 'experience',
        label: 'Experience',
        type: 'select',
        required: true,
        half: true,
        options: ['Student', 'Under 2 years', '2-5 years', 'More than 5 years'],
      },
      { name: 'portfolio', label: 'Portfolio or profile link', type: 'url', half: true, hint: 'https://…' },
    ],
    message: { label: 'Anything else we should know?', required: false, hint: 'Projects you are proud of, availability…' },
    success: 'Thanks for applying. We review every application and will be in touch when there is a fit.',
  },

  /* ── GWD Community ── */
  {
    key: 'member',
    topic: 'club',
    cta: 'Join as a member',
    title: 'Join GWD Community',
    summary: 'Become a member: join a team, work on live briefs and get a direct line into industry, while you are still studying.',
    audience: 'Students at any college',
    fields: [
      { ...phone },
      { name: 'college', label: 'College', type: 'text', required: true, half: true, organisation: true },
      { name: 'year', label: 'Year', type: 'select', required: true, half: true, options: ['1st year', '2nd year', '3rd year', '4th year', 'Graduated'] },
      { name: 'branch', label: 'Branch or department', type: 'text', half: true },
      {
        name: 'interest',
        label: 'Team you want to join',
        type: 'select',
        required: true,
        options: ['Technical', 'Marketing', 'Event management', 'Public relations', 'Creative', 'Cinematography', 'Not sure yet'],
      },
    ],
    message: { label: 'Why do you want to join?', required: false },
    success: 'Welcome aboard. The community team will reach out with next steps.',
  },
  {
    key: 'invite',
    topic: 'club',
    cta: 'Invite GWD to your event',
    title: 'Invite GWD to your event',
    summary: 'Bring GWD to your college fest, conference or club event as a guest: a talk, a workshop, a panel or a judging slot.',
    audience: 'Colleges, departments and student clubs',
    fields: [
      { ...phone },
      { name: 'organisation', label: 'College or club', type: 'text', required: true, half: true, organisation: true },
      { name: 'event', label: 'Event name', type: 'text', required: true, half: true },
      { name: 'date', label: 'Event date', type: 'date', half: true },
      { name: 'audience', label: 'Expected audience', type: 'number', half: true, hint: '250' },
      {
        name: 'role',
        label: 'What would you like from GWD',
        type: 'select',
        required: true,
        options: ['A talk or keynote', 'A workshop', 'A panel', 'Judging', 'Guest of honour', 'Something else'],
      },
    ],
    message: { label: 'Tell us about the event', required: false },
    success: 'We have your invitation. Someone from GWD will reply to plan it with you.',
  },
  {
    key: 'collaborate',
    topic: 'club',
    cta: 'Collaborate on an event',
    title: 'Collaborate with GWD',
    summary: 'Run an event together with GWD Community: a hackathon, a workshop series, a networking night. Bring the idea and your club.',
    audience: 'Student clubs and societies at other colleges',
    fields: [
      { ...phone },
      { name: 'club', label: 'Club', type: 'text', required: true, half: true, organisation: true },
      { name: 'college', label: 'College', type: 'text', required: true, half: true },
      { name: 'date', label: 'Proposed date', type: 'date', half: true },
    ],
    message: { label: 'Your event idea', required: true, hint: 'What you want to run and who it is for…' },
    success: 'Thanks for reaching out. We will get back to you to shape the event together.',
  },
  {
    key: 'campus',
    topic: 'partnership',
    cta: 'Partner as a college',
    title: 'Bring GWD Community to your campus',
    summary:
      'Partner with GWD as an institution: start a chapter of the community on your campus and give students real projects, mentorship and industry connect.',
    audience: 'Colleges, principals, deans and faculty',
    fields: [
      { ...phone },
      { name: 'college', label: 'College', type: 'text', required: true, half: true, organisation: true },
      { name: 'designation', label: 'Your role', type: 'text', required: true, half: true, hint: 'Dean, faculty coordinator…' },
      { name: 'city', label: 'City', type: 'text', half: true },
    ],
    message: { label: 'What would you like to set up?', required: false },
    success: 'Thank you. We will be in touch to talk about a chapter at your campus.',
  },

  /* ── GWD Sports ── */
  {
    key: 'academy',
    topic: 'sports',
    cta: 'Host your academy',
    title: 'Host your academy on GWD Sports',
    summary: 'Run registration, attendance, fees and parent updates on GWD Sports, and get listed where parents search for academies.',
    audience: 'Academy owners and head coaches',
    fields: [
      { ...phone, required: true },
      { name: 'academy', label: 'Academy', type: 'text', required: true, half: true, organisation: true },
      { name: 'city', label: 'City', type: 'text', required: true, half: true },
      { name: 'sport', label: 'Sport', type: 'text', required: true, half: true, hint: 'Football' },
      { name: 'students', label: 'Students enrolled', type: 'select', half: true, options: ['Under 50', '50-150', '150-500', 'More than 500'] },
    ],
    message: { label: 'How do you run things today?', required: false, hint: 'Registers, WhatsApp groups, spreadsheets…' },
    success: 'Thanks. The GWD Sports team will call you to set your academy up.',
  },
  {
    key: 'demo',
    topic: 'sports',
    cta: 'Request a demo',
    title: 'Request a GWD Sports demo',
    summary: 'See the platform working with your own setup: academy operations, the student passport and live competition.',
    audience: 'Academies, clubs, leagues, schools and parents',
    fields: [
      { ...phone, required: true },
      { name: 'organisation', label: 'Organisation', type: 'text', half: true, organisation: true },
      {
        name: 'role',
        label: 'You are',
        type: 'select',
        required: true,
        half: true,
        options: ['Academy owner', 'Coach', 'League or tournament organiser', 'School', 'Parent', 'Something else'],
      },
      { name: 'when', label: 'Best time for a call', type: 'text', half: true, hint: 'Weekday evenings' },
    ],
    message: { label: 'Anything you want to see?', required: false },
    success: 'We will set up a demo and send you a time.',
  },
  {
    key: 'league',
    topic: 'sports',
    cta: 'Run a league or tournament',
    title: 'Run your league or tournament on GWD Sports',
    summary: 'Registration, fixtures, live standings and player passports for your competition, on the same system that runs the Hyderabad Super League.',
    audience: 'League and tournament organisers',
    fields: [
      { ...phone, required: true },
      { name: 'organisation', label: 'Organisation', type: 'text', required: true, half: true, organisation: true },
      { name: 'competition', label: 'Competition name', type: 'text', required: true, half: true },
      { name: 'teams', label: 'Number of teams', type: 'number', half: true, hint: '16' },
      { name: 'start', label: 'Start date', type: 'date', half: true },
    ],
    message: { label: 'Tell us about the competition', required: false },
    success: 'Thanks. The GWD Sports team will reply to plan your competition.',
  },
] as const satisfies readonly Intent[];

export type IntentKey = (typeof INTENTS)[number]['key'];
export const INTENT_KEYS = INTENTS.map((i) => i.key) as [IntentKey, ...IntentKey[]];
export const intentByKey = (key: string | null | undefined): Intent | undefined => INTENTS.find((i) => i.key === key);

/** Practice selects are filled with the live list of practices at render time. */
export const PRACTICE_OPTIONS = PRACTICE_PLACEHOLDER;

/** The query parameter that opens the registration drawer on any page. */
export const REGISTER_PARAM = 'register';
export const registerHref = (key: IntentKey, extra?: Record<string, string>) => `?${new URLSearchParams({ [REGISTER_PARAM]: key, ...extra }).toString()}`;

/** Which page each registration belongs to. The contact directory and the admin inbox group by these. */
export const INTENT_GROUPS = [
  { key: 'products', label: 'Services', href: '/services', intents: ['project', 'service', 'freelancer'] },
  { key: 'community', label: 'GWD Community', href: '/community', intents: ['member', 'invite', 'collaborate', 'campus'] },
  { key: 'sports', label: 'GWD Sports', href: '/sports', intents: ['academy', 'demo', 'league'] },
] as const satisfies readonly { key: string; label: string; href: string; intents: readonly IntentKey[] }[];
export type IntentGroupKey = (typeof INTENT_GROUPS)[number]['key'];

const summaryLines = (intent: Intent, details: Record<string, string> | null | undefined) =>
  intent.fields
    .filter((f) => details?.[f.name])
    .map((f) => `${f.label}: ${details?.[f.name]}`)
    .join('\n');

/**
 * The stored message for a registration: the form's title, its answers, then
 * the visitor's own words, so the record reads well without any tooling.
 */
export const composeMessage = (intent: Intent, details: Record<string, string> | null | undefined, text: string) =>
  [intent.title, summaryLines(intent, details), text].filter(Boolean).join('\n\n');

/** The visitor's own words, recovered from a message built by composeMessage. */
export function freeText(intent: Intent, details: Record<string, string> | null | undefined, message: string) {
  const prefix = composeMessage(intent, details, '');
  return message.startsWith(prefix) ? message.slice(prefix.length).trim() : message;
}
