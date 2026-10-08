import { doc, seo } from './define';
import type { CopyField } from './types';

const P = 'community' as const;
const PHOTO = (key: string, label: string) => ({ key, label, type: 'photo' as const });

/**
 * GWD Community page copy. Benefits, growth path, idea backing and campus
 * expansion are from the club's general-meeting deck; the story chapters are
 * drafted from the owner's brief and the album.
 */
export const communityCopy = {
  'community.seo': seo(
    P,
    'GWD Community',
    'GWD Community gives students real experience in technology and startups, for students, by students: free workshops and training on real projects, internships, industry visits, events across Hyderabad’s colleges and backing for startup ideas.',
  ),
  'community.hero.label': { page: P, section: 'Hero', label: 'Eyebrow', type: 'text', value: 'GWD Community' },
  'community.hero.title': { page: P, section: 'Hero', label: 'Headline (before the struck words)', type: 'text', value: 'We didn’t create another' },
  'community.hero.struck': { page: P, section: 'Hero', label: 'Struck-through words', type: 'text', value: 'college club' },
  'community.hero.lead': {
    page: P,
    section: 'Hero',
    label: 'Lead',
    type: 'textarea',
    value: 'Real experience in technology and startups, for students, by students. It started at VJIT; today it runs events across Hyderabad’s colleges.',
  },
  'community.join.label': { page: P, section: 'Hero', label: 'Join button label', type: 'text', value: 'Join the community' },
  'community.join.url': {
    page: P,
    section: 'Hero',
    label: 'Join / registration link',
    type: 'url',
    value: '?register=member',
    help: 'Leave as ?register=member for the built-in form, or paste a registration link (e.g. a Google Form, https://…).',
  },
  'community.hero.campusLabel': { page: P, section: 'Hero', label: 'Second button label', type: 'text', value: 'Bring it to your campus' },
  'community.hero.campusUrl': { page: P, section: 'Hero', label: 'Second button link', type: 'url', value: '?register=campus' },
  'community.hero.arches': {
    page: P,
    section: 'Hero',
    label: 'Arch windows (each cycles through its photos)',
    type: 'list',
    item: [PHOTO('a', 'Photo 1'), PHOTO('b', 'Photo 2'), PHOTO('c', 'Photo 3'), PHOTO('d', 'Photo 4')],
    value: [
      { a: 'community-hall', b: 'club-launch-vjit', c: 'award-group', d: 'welcome-stage' },
      { a: 'team-auditorium-above', b: 'team-auditorium', c: 'courtyard', d: 'gwd-shirts' },
      { a: 'founder-mudabbir', b: 'workshop-lab', c: 'team-steps', d: 'rooftop-trio' },
    ],
  },

  'community.story.label': { page: P, section: 'Story', label: 'Eyebrow', type: 'text', value: 'How we built it' },
  'community.story.title': { page: P, section: 'Story', label: 'Headline', type: 'text', value: 'A community is built one room at a time.' },
  'community.story': {
    page: P,
    section: 'Story',
    label: 'Chapters',
    type: 'list',
    item: [
      { key: 'head', label: 'Heading', type: 'text' },
      { key: 'body', label: 'Text', type: 'textarea' },
      PHOTO('main', 'Main photo'),
      PHOTO('side1', 'Small photo 1'),
      PHOTO('side2', 'Small photo 2'),
    ],
    value: [
      {
        head: 'It started on one stage.',
        body: 'GWD Community began as GWD Club at VJIT: one launch, one stage, and a room of students who wanted real experience in technology and startups, not another certificate. For students, by students.',
        main: 'club-launch-vjit',
        side1: 'stage-vjit',
        side2: 'welcome-stage',
      },
      {
        head: 'Workshops, free for every member.',
        body: 'Hands-on technology workshops in the campus labs, run for members at no cost, led from the front by people who do the work for a living.',
        main: 'workshop-lab',
        side1: 'lab-session',
        side2: 'speaker-lab',
      },
      {
        head: 'Led by the people who built GWD.',
        body: 'The founders teach in the room themselves. Mohammed Abdul Mudabbir, who founded the community, and co-founder Mohd Abdul Rahman Pasha take sessions from the front, the way GWD itself was built: by doing the work.',
        main: 'founder-mudabbir',
        side1: 'founder-rahman',
        side2: 'mudabbir-session',
      },
      {
        head: 'Real projects, then real internships.',
        body: 'Members train on live projects GWD Global Private Limited delivers for clients, free. Internships follow through GWD’s channels, and with GWD itself for members who show genuine interest and talent.',
        main: 'lab-work',
        side1: 'planning',
        side2: 'lectern',
      },
      {
        head: 'Ideas get backed, not just applauded.',
        body: 'Any member or lead with a startup idea gets it refined, mentored by the founders who took GWD from a student idea to a registered company, connected to the network and, if it proves itself, backed.',
        main: 'bizhack-stage',
        side1: 'bizhack-cheque',
        side2: 'award-group',
      },
      {
        head: 'Exposure you won’t get in a classroom.',
        body: 'Industry visits inside companies to see how real work gets done, and startup events, incubators and expos where the industry meets. Every visit is something new, for members and leads alike.',
        main: 'industry-booth',
        side1: 'tech-campus',
        side2: 'summit-interview',
      },
      {
        head: 'Now, campus by campus.',
        body: 'It started at VJIT. Now the club organises events at other Hyderabad colleges, so members get exposure on new campuses and build a network there.',
        main: 'outdoor-stall',
        side1: 'tech-stall',
        side2: 'exhibition-faculty',
      },
      {
        head: 'Today: 50+ active members at VJIT alone.',
        body: 'More on other campuses, and the community grows every week: a team that turns up for each other on campus and off it.',
        main: 'team-auditorium-above',
        side1: 'gwd-shirts',
        side2: 'team-turf',
      },
    ],
  },

  'community.reel.label': { page: P, section: 'Team reel', label: 'Eyebrow', type: 'text', value: 'The team' },
  'community.reel.title': { page: P, section: 'Team reel', label: 'Headline', type: 'text', value: 'Fifty-plus people. One team.' },
  'community.reel.photos': {
    page: P,
    section: 'Team reel',
    label: 'Photos (in order), each with its caption',
    type: 'list',
    item: [PHOTO('photo', 'Photo'), { key: 'caption', label: 'Caption (who is in it)', type: 'text' }],
    value: [
      { photo: 'team-auditorium-above', caption: 'The GWD team with the club director' },
      { photo: 'team-auditorium', caption: 'GWD marketing team' },
      { photo: 'courtyard', caption: 'GWD event management team' },
      { photo: 'team-stairwell', caption: 'GWD technical team' },
      { photo: 'team-steps', caption: 'GWD public relations (PR) team' },
      { photo: 'team-red-wall', caption: 'GWD creative team' },
      { photo: 'rooftop-trio', caption: 'The founder and co-founders of GWD Community' },
      { photo: 'team-stairs', caption: 'The club director with the creative team' },
      { photo: 'team-portico', caption: 'The community director with all the community leads' },
      { photo: 'rooftop-duo', caption: 'The visionary leaders behind the GWD Community' },
    ],
  },
  'community.films': doc(
    P,
    'Reels',
    'The reels',
    {
      label: 'On camera',
      title: 'The community, in motion.',
      lead: 'The community leads on the road, and a recent GWD session at VJIT. Press play for sound.',
      play: 'Play with sound',
      clips: [
        {
          key: 'leads',
          src: '/media/community/reel-leads.360e19a0.mp4',
          poster: '/media/community/reel-leads.99492baa.jpg',
          title: 'Get work done, on the road',
          note: 'The community leads on the road, thumbs up for getting work done.',
          shape: 'tall',
        },
        {
          key: 'event',
          src: '/media/community/reel-event.937f0610.mp4',
          poster: '/media/community/reel-event.11b1d012.jpg',
          title: 'A recent GWD session',
          note: 'With the CSE (AI & ML) department and the ACM Student Chapter at VJIT.',
          shape: 'tall',
        },
      ],
    },
    'Each film: a video file (/media/…), a poster image, its title and a line under it. Shape is tall or wide.',
  ),

  'community.benefits.label': { page: P, section: 'What members get', label: 'Eyebrow', type: 'text', value: 'What you get' },
  'community.benefits.title': { page: P, section: 'What members get', label: 'Headline', type: 'text', value: 'What every member gets.' },
  'community.benefits.lead': { page: P, section: 'What members get', label: 'Lead', type: 'textarea', value: 'The advantage of a club backed by a real company.' },
  'community.benefits.big': { page: P, section: 'What members get', label: 'Big outlined word', type: 'text', value: 'Free' },
  'community.benefits.small': { page: P, section: 'What members get', label: 'Line under it', type: 'text', value: 'training and workshops, for every member' },

  'community.contrast.label': { page: P, section: 'The difference', label: 'Eyebrow', type: 'text', value: 'The difference' },
  'community.contrast.title': { page: P, section: 'The difference', label: 'Headline', type: 'text', value: 'Runs like a company, because it is one.' },
  'community.contrast.oldLabel': { page: P, section: 'The difference', label: 'Left column title', type: 'text', value: 'A traditional college club' },
  'community.contrast.old': {
    page: P,
    section: 'The difference',
    label: 'Left column (struck out)',
    type: 'list',
    item: [{ key: 'text', label: 'Line', type: 'text' }],
    value: ['Organises events', 'Runs workshops', 'Issues certificates', 'Built for the résumé line', 'Ends when you graduate'].map((text) => ({ text })),
  },
  'community.contrast.newLabel': { page: P, section: 'The difference', label: 'Right column title', type: 'text', value: 'GWD Community' },
  'community.contrast.new': {
    page: P,
    section: 'The difference',
    label: 'Right column',
    type: 'list',
    item: [{ key: 'text', label: 'Line', type: 'text' }],
    value: ['Trains members on real client projects', 'Operates as structured departments', 'Free workshops and industry visits', 'Year-round, across campuses', 'Backs members’ startup ideas'].map((text) => ({ text })),
  },
  'community.contrast.note': {
    page: P,
    section: 'The difference',
    label: 'Closing line',
    type: 'textarea',
    value: 'For students, by students. Training and workshops are free; what members bring is the willingness to show up and do the work.',
  },

  'community.formats.label': { page: P, section: 'Formats', label: 'Eyebrow', type: 'text', value: 'Formats' },
  'community.formats.title': { page: P, section: 'Formats', label: 'Headline', type: 'text', value: 'Three formats. Zero theory.' },
  'community.formats.lead': {
    page: P,
    section: 'Formats',
    label: 'Lead',
    type: 'textarea',
    value: 'Every event has to produce something real: a skill, a connection, an opportunity, or a signed client.',
  },

  'community.path.label': { page: P, section: 'Growth path', label: 'Eyebrow', type: 'text', value: 'Growth path' },
  'community.path.title': { page: P, section: 'Growth path', label: 'Headline', type: 'text', value: 'Your growth path in the club.' },
  'community.path.lead': {
    page: P,
    section: 'Growth path',
    label: 'Lead',
    type: 'textarea',
    value: 'From your first workshop to a real internship. Workshops and project training are free for every member; internships open up as you show interest and talent.',
  },
  'community.path': {
    page: P,
    section: 'Growth path',
    label: 'Steps',
    type: 'list',
    item: [
      { key: 'tag', label: 'Tag', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'body', label: 'Text', type: 'textarea' },
    ],
    value: [
      { tag: 'Step 1, free', title: 'Workshops', body: 'Hands-on sessions across different technologies, run for members.' },
      { tag: 'Step 2, free', title: 'Real projects', body: 'Training on live projects GWD Global Private Limited delivers for clients.' },
      { tag: 'Step 3', title: 'Internships', body: 'Placements through GWD’s channels and partner network.' },
      { tag: 'Step 4', title: 'Intern at GWD', body: 'An internship with GWD itself, for members with genuine interest and real talent.' },
    ],
  },
  'community.path.note': {
    page: P,
    section: 'Growth path',
    label: 'Closing line',
    type: 'text',
    value: 'Show up, do the work, and the path opens up. Your lead will tell you where to start.',
  },

  'community.ideas.label': { page: P, section: 'Startup ideas', label: 'Eyebrow', type: 'text', value: 'Startup ideas' },
  'community.ideas.title': { page: P, section: 'Startup ideas', label: 'Headline', type: 'text', value: 'Got a startup idea? We’ll back it.' },
  'community.ideas.lead': {
    page: P,
    section: 'Startup ideas',
    label: 'Lead',
    type: 'textarea',
    value: 'Any member or lead with an idea gets the support GWD’s founders wished they’d had when GWD was just a student idea in 2024.',
  },
  'community.ideas': {
    page: P,
    section: 'Startup ideas',
    label: 'Steps',
    type: 'list',
    item: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'body', label: 'Text', type: 'textarea' },
    ],
    value: [
      { title: 'Refine', body: 'We pressure-test the idea with you and sharpen it into something buildable.' },
      { title: 'Mentor', body: 'The founders who took GWD from a student idea to a registered company guide you through it.' },
      { title: 'Network', body: 'Introductions across GWD’s 650+ network, clients in 10 countries, and ecosystem partners.' },
      { title: 'Invest', body: 'For ideas that prove themselves, GWD can come in as an investor.' },
    ],
  },
  'community.ideas.note': { page: P, section: 'Startup ideas', label: 'Closing line', type: 'text', value: 'Talk to your department lead. No idea is too early.' },

  'community.campus.label': { page: P, section: 'Across Hyderabad', label: 'Eyebrow', type: 'text', value: 'Across Hyderabad' },
  'community.campus.title': { page: P, section: 'Across Hyderabad', label: 'Headline', type: 'text', value: 'Not just a campus club. A community across Hyderabad.' },
  'community.campus.lead': {
    page: P,
    section: 'Across Hyderabad',
    label: 'Lead',
    type: 'textarea',
    value: 'Events at multiple colleges, so members get exposure on new campuses and build a network there.',
  },
  'community.campus': {
    page: P,
    section: 'Across Hyderabad',
    label: 'Steps',
    type: 'list',
    item: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'body', label: 'Text', type: 'textarea' },
    ],
    value: [
      { title: 'Partner with a college club', body: 'We start with collaborations, not takeovers.' },
      { title: 'Co-host events on their campus', body: 'They see how GWD Club runs, first-hand.' },
      { title: 'Launch a GWD Club chapter', body: 'Same departments, same standards, one connected network.' },
    ],
  },
  'community.campus.longGame': { page: P, section: 'Across Hyderabad', label: 'The long game', type: 'text', value: 'India’s largest student-led ecosystem' },

  'community.gallery.label': { page: P, section: 'Album', label: 'Eyebrow', type: 'text', value: 'The album' },
  'community.gallery.title': { page: P, section: 'Album', label: 'Headline', type: 'text', value: 'The community, as it happened.' },

  'community.ways.label': { page: P, section: 'Ways in', label: 'Eyebrow', type: 'text', value: 'Ways in' },
  'community.ways.title': { page: P, section: 'Ways in', label: 'Headline', type: 'text', value: 'Students, clubs, colleges. Everyone has a way in.' },
  'community.ways.lead': {
    page: P,
    section: 'Ways in',
    label: 'Lead',
    type: 'textarea',
    value: 'Join as a member, bring GWD to your event, run one with us, or start a chapter on your campus. The community team replies to every request.',
  },

  'community.network.label': { page: P, section: 'Network', label: 'Eyebrow', type: 'text', value: 'Network' },
  'community.network.title': { page: P, section: 'Network', label: 'Headline', type: 'text', value: 'Industry, within reach.' },
  'community.network.lead': {
    page: P,
    section: 'Network',
    label: 'Lead',
    type: 'textarea',
    value: 'The community sits inside GWD’s network of government innovation bodies, incubators and startup ecosystems.',
  },

  'community.events.title': { page: P, section: 'Events', label: 'Headline', type: 'text', value: 'Community, one event at a time.' },
  'community.events.lead': {
    page: P,
    section: 'Events',
    label: 'Lead',
    type: 'textarea',
    value: 'Upcoming events from the community’s event team. Each one has its own registration link.',
  },
  'community.events.emptyTitle': { page: P, section: 'Events', label: 'When nothing is scheduled: title', type: 'text', value: 'The next event is being planned.' },
  'community.events.emptyBody': {
    page: P,
    section: 'Events',
    label: 'When nothing is scheduled: text',
    type: 'textarea',
    value: 'New events are announced here first. Join the community and you will hear about them before anyone else.',
  },

  'community.leaders.title': { page: P, section: 'Who runs it', label: 'Title', type: 'text', value: 'Who runs it' },
} satisfies Record<string, CopyField>;
