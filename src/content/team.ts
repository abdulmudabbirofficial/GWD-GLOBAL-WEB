import type { TeamMember } from '@/types/content';

type Seed = Omit<TeamMember, 'id' | 'bio' | 'photoUrl'> & { bio?: string; photoUrl?: string };

const MUDABBIR = '/media/team/mohammed-abdul-mudabbir.c1ac4eb1.webp';
const RAHMAN = '/media/team/mohd-abdul-rahman-pasha.763d78d0.webp';
const MOIN = '/media/team/mohammed-moin.6bad234c.webp';

/**
 * GWD Global core team: the two co-founders (their lanes, as written in the
 * GWD Global deck, "10 The Founding Team") and the founding members, listed
 * by name only at the owner's request.
 */
const core: Seed[] = [
  {
    slug: 'mohd-abdul-rahman-pasha',
    name: 'Mohd Abdul Rahman Pasha',
    role: 'Co-Founder & Chief Executive Officer',
    group: 'core',
    tier: 'founder',
    bio: 'Leadership · Strategy · Sales · Business Development · Marketing · Development · Cloud · HR · Operations',
    photoUrl: RAHMAN,
  },
  {
    slug: 'mohammed-abdul-mudabbir',
    name: 'Mohammed Abdul Mudabbir',
    role: 'Co-Founder · Chief Operating Officer & Chief Marketing Officer',
    group: 'core',
    tier: 'founder',
    bio: 'Leadership · Team Management · Marketing & Sales · Finance · Projections · Strategy · Events · Business Development · Operations',
    photoUrl: MUDABBIR,
  },
  { slug: 'mohammed-moin', name: 'Mohammed Moin', role: 'Founding Member', group: 'core', tier: 'executive', photoUrl: MOIN },
  { slug: 'ashish-goutham', name: 'Ashish Goutham', role: 'Founding Member', group: 'core', tier: 'lead' },
  { slug: 'afnan-munwar', name: 'Afnan Munwar', role: 'Founding Member', group: 'core', tier: 'lead' },
  { slug: 'oliver-joshua', name: 'Oliver Joshua', role: 'Founding Member', group: 'core', tier: 'lead' },
  { slug: 'akhil', name: 'Akhil', role: 'Founding Member', group: 'core', tier: 'lead' },
  { slug: 'deekshit', name: 'Deekshit', role: 'Founding Member', group: 'core', tier: 'lead' },
  { slug: 'aldrin-paul', name: 'Aldrin Paul', role: 'Founding Member', group: 'core', tier: 'lead' },
];

/** GWD Community (began as GWD Club at VJIT): its founder and directors, then the student leads. */
const club: Seed[] = [
  { slug: 'club-abdul-mudabbir', name: 'Mohammed Abdul Mudabbir', role: 'Community Founder & Director', group: 'club', tier: 'founder', photoUrl: MUDABBIR },
  { slug: 'club-rahman-pasha', name: 'Mohd Abdul Rahman Pasha', role: 'Co-Founder & Director', group: 'club', tier: 'founder', photoUrl: RAHMAN },
  { slug: 'club-moin', name: 'Mohammed Moin', role: 'Co-Founder & Director', group: 'club', tier: 'founder', photoUrl: MOIN },
  { slug: 'club-aldrin-paul', name: 'Aldrin Paul', role: 'President', group: 'club', tier: 'executive' },
  { slug: 'club-mohd-ismail', name: 'Mohd Ismail', role: 'Vice President', group: 'club', tier: 'executive' },
  { slug: 'club-shravya', name: 'Shravya', role: 'General Secretary', group: 'club', tier: 'executive' },
  { slug: 'club-anvita-reddy', name: 'Anvita Reddy', role: 'Marketing Lead', group: 'club', tier: 'lead' },
  { slug: 'club-deekshit-katikaneni', name: 'Deekshit Katikaneni', role: 'Technical Lead', group: 'club', tier: 'lead' },
  { slug: 'club-bhavya-koduri', name: 'Bhavya Koduri', role: 'Event Management Lead', group: 'club', tier: 'lead' },
  { slug: 'club-tuba-azeem', name: 'Tuba Azeem', role: 'Public Relation Lead', group: 'club', tier: 'lead' },
  { slug: 'club-nishta-gaur', name: 'Nishta Gaur', role: 'Creative Lead', group: 'club', tier: 'lead' },
  { slug: 'club-burhan-uddin', name: 'Burhan Uddin', role: 'Cinematographer', group: 'club', tier: 'lead' },
];

export const team: Omit<TeamMember, 'id'>[] = [...core, ...club].map((m) => ({ ...m, bio: m.bio ?? null, photoUrl: m.photoUrl ?? null }));
