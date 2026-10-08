/**
 * Domain types shared by the content API, the database mappers and the UI.
 * UI components depend on these shapes, never on database rows, so the
 * storage layer can change without touching presentation code.
 */

export type ProductStatus = 'live' | 'in_development' | 'in_design' | 'paused' | 'ideation';
export type OrganizationKind = 'client' | 'government' | 'ecosystem' | 'sports_partner' | 'sports_club';
export type TeamGroup = 'core' | 'club';
export type TeamTier = 'founder' | 'executive' | 'lead';
export type EventScope = 'company' | 'club' | 'sports';
export type HighlightGroup = 'operating_model' | 'club_pillar' | 'club_format' | 'sports_module' | 'sports_journey' | 'sports_moat';
export type ServiceGroup = 'engineering' | 'experience';
export type StatGroup = 'company' | 'sports' | 'club';
export type EcosystemKind = 'core' | 'venture' | 'community' | 'capability' | 'network';

export interface SocialLink {
  label: string;
  url: string;
}

export interface CompanyProfile {
  legalName: string;
  brandName: string;
  tagline: string;
  motto: string;
  /** ISO year-month the idea started, e.g. "2024-03". */
  foundedIdea: string;
  /** ISO date of incorporation. */
  incorporatedOn: string;
  cin: string;
  gstin: string;
  locality: string;
  city: string;
  region: string;
  country: string;
  email: string | null;
  phone: string | null;
  socials: SocialLink[];
}

export interface Stat {
  key: string;
  group: StatGroup;
  value: number;
  decimals: number;
  prefix: string;
  suffix: string;
  label: string;
  description: string | null;
}

export interface ServiceCapability {
  title: string;
  detail: string;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  /** Plain-language label for menus and lists ("AI & Automation"); falls back to `name`. */
  shortName: string;
  group: ServiceGroup;
  /** One-line scope, as written in the company deck. */
  summary: string;
  /** The promise to the client, in a sentence. */
  headline: string;
  description: string;
  capabilities: ServiceCapability[];
  deliverables: string[];
  /** Who typically hires this practice. */
  idealFor: string[];
  /** Keys into the technology registry (src/content/technologies.ts). */
  technologies: string[];
  /** Optional uploaded image; the built-in illustration is used otherwise. */
  imageUrl: string | null;
}

export interface ProductMetric {
  value: string;
  label: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  status: ProductStatus;
  isFlagship: boolean;
  /** Headline numbers, most important first. */
  metrics: ProductMetric[];
  /** What the product does, as named in the company material. */
  features: string[];
  accent: string;
  href: string | null;
}

export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  role: string;
  group: TeamGroup;
  tier: TeamTier;
  bio: string | null;
  photoUrl: string | null;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  kind: OrganizationKind;
  logoUrl: string | null;
  websiteUrl: string | null;
}

export interface Location {
  id: string;
  city: string;
  country: string;
  countryCode: string;
  timezone: string;
  isHq: boolean;
  latitude: number;
  longitude: number;
}

export interface Recognition {
  id: string;
  title: string;
  detail: string | null;
}

export interface Highlight {
  id: string;
  group: HighlightGroup;
  slug: string;
  title: string;
  summary: string;
  detail: string | null;
  metric: string | null;
}

export interface EcosystemEntity {
  id: string;
  slug: string;
  name: string;
  kind: EcosystemKind;
  summary: string;
  facts: string[];
  href: string | null;
}

export interface EcosystemLink {
  from: string;
  to: string;
}

export interface Ecosystem {
  entities: EcosystemEntity[];
  links: EcosystemLink[];
}

export interface SiteEvent {
  id: string;
  slug: string;
  title: string;
  summary: string;
  scope: EventScope;
  startsAt: string;
  endsAt: string | null;
  venue: string | null;
  registrationUrl: string | null;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  href: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

export type GalleryTag = 'team' | 'events' | 'workshops';

/** A photo in the community album. */
export interface GalleryPhoto {
  id: string;
  slug: string;
  url: string;
  /** A smaller copy for thumbnails and 3D textures (uploads have none; the full image is used). */
  smallUrl: string | null;
  width: number;
  height: number;
  tag: GalleryTag;
  alt: string;
}

/** Editable overrides for the site's text, links and image slots, keyed as in src/content/site-copy.ts. */
export type SiteSettings = Record<string, unknown>;
