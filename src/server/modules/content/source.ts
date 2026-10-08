import type {
  CompanyProfile,
  Ecosystem,
  EventScope,
  Highlight,
  HighlightGroup,
  Location,
  Organization,
  OrganizationKind,
  Product,
  Recognition,
  Service,
  SiteEvent,
  Stat,
  StatGroup,
  TeamGroup,
  TeamMember,
  Announcement,
  GalleryPhoto,
  SiteSettings,
} from '@/types/content';

export interface EventQuery {
  scope?: EventScope;
  /** Only events that have not yet ended. */
  upcoming?: boolean;
  limit?: number;
}

/** Read-side contract every content backend implements. Published content only. */
export interface ContentSource {
  company(): Promise<CompanyProfile>;
  stats(group?: StatGroup): Promise<Stat[]>;
  recognitions(): Promise<Recognition[]>;
  services(): Promise<Service[]>;
  service(slug: string): Promise<Service | null>;
  products(): Promise<Product[]>;
  product(slug: string): Promise<Product | null>;
  team(group?: TeamGroup): Promise<TeamMember[]>;
  organizations(kind?: OrganizationKind): Promise<Organization[]>;
  locations(): Promise<Location[]>;
  highlights(group: HighlightGroup): Promise<Highlight[]>;
  ecosystem(): Promise<Ecosystem>;
  events(query?: EventQuery): Promise<SiteEvent[]>;
  announcements(): Promise<Announcement[]>;
  /** The community album, published photos in order. */
  gallery(): Promise<GalleryPhoto[]>;
  /** Overrides for editable text, links and image slots (defaults live in src/content/site-copy.ts). */
  settings(): Promise<SiteSettings>;
}
