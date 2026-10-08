import type { Organization, OrganizationKind } from '@/types/content';

type Seed = Omit<Organization, 'id' | 'websiteUrl' | 'logoUrl'> & { logo?: 'logo' | 'crest' | null };

const org = (kind: OrganizationKind, name: string, slug: string, logo: Seed['logo'] = 'logo'): Seed => ({ kind, name, slug, logo });

const seeds: Seed[] = [
  // Government & innovation
  org('government', 'TGIC', 'tgic'),
  org('government', 'T-Hub', 't-hub'),
  org('government', 'K-Tech Innovation Hub', 'k-tech-innovation-hub'),
  // Ecosystem & incubation
  org('ecosystem', 'VJIT', 'vjit'),
  org('ecosystem', 'Edventure Park', 'edventure-park'),
  org('ecosystem', 'Studlyf', 'studlyf'),
  org('ecosystem', 'TG10X', 'tg10x'),
  org('ecosystem', 'Bharat Startup', 'bharat-startup'),
  org('ecosystem', 'E-Cell', 'e-cell', null),
  // Clients & partners (direct clients and partners engaged through agencies)
  org('client', 'Accenture', 'accenture'),
  org('client', 'FedEx', 'fedex'),
  org('client', 'ADP', 'adp'),
  org('client', 'Adani Connex', 'adani-connex'),
  org('client', 'Al Ansari International', 'al-ansari-international'),
  org('client', 'Saudi Energy', 'saudi-energy'),
  org('client', 'Focus Softnet', 'focus-softnet'),
  org('client', 'Unifonic', 'unifonic'),
  org('client', 'Waabi', 'waabi'),
  org('client', 'AlayaCare', 'alayacare'),
  org('client', 'Synthesia', 'synthesia'),
  org('client', 'D&B Properties', 'd-and-b-properties'),
  org('client', 'Electra', 'electra'),
  org('client', 'Skello', 'skello'),
  org('client', 'BrioHR', 'briohr'),
  org('client', 'CIEL HR', 'ciel-hr'),
  org('client', 'Red String HR', 'red-string-hr'),
  org('client', 'Pearl Constructions', 'pearl-constructions'),
  org('client', 'Shopezy', 'shopezy'),
  org('client', 'Intex', 'intex'),
  org('client', 'MasterGrade', 'mastergrade'),
  org('client', 'Xentrox', 'xentrox'),
  org('client', 'Carrera Pictures', 'carrera-pictures'),
  org('client', 'Good Mind', 'good-mind'),
  // GWD Sports, organisations GWD is the IT and digital partner for
  org('sports_partner', 'Hyderabad Super League', 'hyderabad-super-league', 'crest'),
  org('sports_partner', 'Sreenidi Deccan FC', 'sreenidi-deccan-fc', 'crest'),
  org('sports_partner', 'Hyderabad Little Stars', 'hyderabad-little-stars', 'crest'),
  { kind: 'sports_partner', name: 'MasterGrade', slug: 'sports-mastergrade', logo: 'logo' },
  // Hyderabad Super League clubs running on the GWD Sports platform
  org('sports_club', 'Champions FC', 'champions-fc', 'crest'),
  org('sports_club', 'Deccan United FC', 'deccan-united-fc', 'crest'),
  org('sports_club', 'Gladiators FC', 'gladiators-fc', 'crest'),
  org('sports_club', 'Guardians FC', 'guardians-fc', 'crest'),
  org('sports_club', 'Hopeless FC', 'hopeless-fc', 'crest'),
  org('sports_club', 'IEA FC', 'iea-fc', 'crest'),
  org('sports_club', 'Knockout FC', 'knockout-fc', 'crest'),
  org('sports_club', 'Strangers Stars FC', 'strangers-stars-fc', 'crest'),
  org('sports_club', 'Trail Blazers FC', 'trail-blazers-fc', 'crest'),
  org('sports_club', 'Warriors FC', 'warriors-fc', 'crest'),
];

const logoPath = (s: Seed): string | null => {
  if (!s.logo) return null;
  const file = s.slug === 'sports-mastergrade' ? 'mastergrade' : s.slug;
  return s.logo === 'crest' ? `/media/crests/${file}.png` : `/media/logos/${file}.png`;
};

export const organizations: Omit<Organization, 'id'>[] = seeds.map((s) => ({
  slug: s.slug,
  name: s.name,
  kind: s.kind,
  logoUrl: logoPath(s),
  websiteUrl: null,
}));
