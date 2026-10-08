import type { Metadata } from 'next';
import {
  AlbumProvider,
  ArchHero,
  BuiltStory,
  CampusExpansion,
  FormatTickets,
  Gallery,
  IdeaBacking,
  InkPillars,
  Leadership,
  NetworkFloat,
  PathwayRoute,
  StrikeContrast,
  TeamReel,
  type Chapter,
} from '@/experience/community/CommunityWorld';
import { Events } from '@/experience/kit/Events';
import { AuctionReel, type Clip } from '@/experience/sports/AuctionReel';
import { PageShell } from '@/experience/kit/PageShell';
import { WaysIn } from '@/experience/kit/WaysIn';
import { formatStat } from '@/lib/format';
import { pageMetadata } from '@/lib/seo';
import { siteCopy } from '@/server/modules/content/copy';
import { content, statsByKey } from '@/server/modules/content/service';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = (await siteCopy()).doc('community.seo');
  return pageMetadata({ title, description, path: '/community' });
}

/* Internal data keys stay `club` (team group, events scope, stats group) so existing records keep working. */

/**
 * GWD Community is warm and hand-made: the album flies past behind the page,
 * and the story is told in the community's own photos, from the first stage
 * at VJIT to the campuses it reaches now. Every word, list, link and photo
 * choice here is editable in the admin (src/content/copy/community.ts).
 */
/**
 * The order of the background flight through the album: every photo once,
 * the ones not shown elsewhere on the page first, and shots from the same
 * series (turf-shoot-*, signing-*, …) spread apart rather than side by side.
 */
function flightOrder<P extends { slug: string }>(album: P[], featured: Set<string>) {
  const spread = (list: P[]) => {
    const families = new Map<string, P[]>();
    for (const p of list) {
      const key = p.slug.split('-')[0] ?? p.slug;
      families.set(key, [...(families.get(key) ?? []), p]);
    }
    const queues = [...families.values()].sort((a, b) => b.length - a.length);
    const out: P[] = [];
    while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift()!);
    return out;
  };
  return [...spread(album.filter((p) => !featured.has(p.slug))), ...spread(album.filter((p) => featured.has(p.slug)))];
}

export default async function CommunityPage() {
  const [c, album, pillars, formats, events, communityStats, companyStats, government, ecosystem, people] = await Promise.all([
    siteCopy(),
    content.gallery(),
    content.highlights('club_pillar'),
    content.highlights('club_format'),
    content.events('club', true),
    statsByKey('club'),
    statsByKey('company'),
    content.organizations('government'),
    content.organizations('ecosystem'),
    content.team('club'),
  ]);
  const members = communityStats.club_members;
  const target = communityStats.club_college_target;
  const network = [...government, ...ecosystem].filter((o) => o.logoUrl);
  const join = { label: c.text('community.join.label'), href: c.text('community.join.url') };
  const films = c.doc('community.films');
  // Photos the page already shows up front; the background flight shows them last, once.
  const featured = new Set(
    [
      ...c.list('community.hero.arches').flatMap((a) => [a.a, a.b, a.c, a.d]),
      ...c.list('community.story').flatMap((s) => [s.main, s.side1, s.side2]),
      ...c.list('community.reel.photos').map((r) => r.photo),
    ].filter((x): x is string => Boolean(x)),
  );

  return (
    <PageShell world="community" tone="warm" payload={{ album: flightOrder(album, featured) }}>
      <AlbumProvider photos={album}>
        <ArchHero
          label={c.text('community.hero.label')}
          title={c.text('community.hero.title')}
          struck={c.text('community.hero.struck')}
          lead={c.text('community.hero.lead')}
          join={join}
          campus={{ label: c.text('community.hero.campusLabel'), href: c.text('community.hero.campusUrl') }}
          facts={[
            ...(members ? [{ value: formatStat(members), label: members.label }] : []),
            { value: 'VJIT', label: 'First chapter' },
            ...(target ? [{ value: formatStat(target), label: target.label }] : []),
          ]}
          arches={c.list('community.hero.arches').map((a) => [a.a, a.b, a.c, a.d].filter((x): x is string => Boolean(x)))}
        />

        <BuiltStory label={c.text('community.story.label')} title={c.text('community.story.title')} chapters={c.list<Chapter & Record<string, string>>('community.story')} />

        <InkPillars
          copy={{ label: c.text('community.benefits.label'), title: c.text('community.benefits.title'), lead: c.text('community.benefits.lead') }}
          note={{ big: c.text('community.benefits.big'), small: c.text('community.benefits.small') }}
          items={pillars.map((p) => ({ title: p.title, summary: p.summary, detail: p.detail, metric: p.metric }))}
        />

        <PathwayRoute
          copy={{ label: c.text('community.path.label'), title: c.text('community.path.title'), lead: c.text('community.path.lead') }}
          steps={c.list('community.path').map((s) => ({ tag: s.tag, title: s.title ?? '', body: s.body ?? '' }))}
          note={c.text('community.path.note')}
        />

        <IdeaBacking
          copy={{ label: c.text('community.ideas.label'), title: c.text('community.ideas.title'), lead: c.text('community.ideas.lead') }}
          steps={c.list('community.ideas').map((s) => ({ title: s.title ?? '', body: s.body ?? '' }))}
          note={c.text('community.ideas.note')}
        />

        <TeamReel
          label={c.text('community.reel.label')}
          title={c.text('community.reel.title')}
          photos={c.list('community.reel.photos').map((r) => ({ slug: r.photo ?? '', caption: r.caption }))}
          facts={[companyStats.core_team, companyStats.freelance_network]
            .filter((st) => st !== undefined)
            .map((st) => ({ value: formatStat(st), label: st.key === 'core_team' ? 'Team members' : 'Curated freelancers' }))}
        />

        <AuctionReel
          id="films-title"
          voice="warm"
          eyebrow={films.label}
          title={films.title}
          lead={films.lead}
          play={films.play}
          clips={films.clips.map((k) => ({ ...k, shape: k.shape === 'wide' ? 'wide' : 'tall' }) satisfies Clip)}
        />

        <CampusExpansion
          copy={{ label: c.text('community.campus.label'), title: c.text('community.campus.title'), lead: c.text('community.campus.lead') }}
          steps={c.list('community.campus').map((s) => ({ title: s.title ?? '', body: s.body ?? '' }))}
          target={target ? { value: formatStat(target), label: target.label } : null}
          longGame={c.text('community.campus.longGame')}
        />

        <StrikeContrast
          copy={{ label: c.text('community.contrast.label'), title: c.text('community.contrast.title') }}
          oldLabel={c.text('community.contrast.oldLabel')}
          oldLines={c.list('community.contrast.old').map((l) => l.text ?? '')}
          newLabel={c.text('community.contrast.newLabel')}
          newLines={c.list('community.contrast.new').map((l) => l.text ?? '')}
          note={c.text('community.contrast.note')}
        />

        <FormatTickets
          copy={{ label: c.text('community.formats.label'), title: c.text('community.formats.title'), lead: c.text('community.formats.lead') }}
          items={formats.map((f) => ({ title: f.title, summary: f.summary }))}
        />

        <Gallery label={c.text('community.gallery.label')} title={c.text('community.gallery.title')} />

        <WaysIn
          label={c.text('community.ways.label')}
          title={c.text('community.ways.title')}
          lead={c.text('community.ways.lead')}
          ways={[{ intent: 'member' }, { intent: 'invite' }, { intent: 'collaborate' }, { intent: 'campus' }]}
          sheet={false}
          seeThrough
        />

        {network.length > 0 && (
          <NetworkFloat copy={{ label: c.text('community.network.label'), title: c.text('community.network.title'), lead: c.text('community.network.lead') }} orgs={network} />
        )}

        <Events
          events={events}
          title={c.text('community.events.title')}
          lead={c.text('community.events.lead')}
          empty={{ title: c.text('community.events.emptyTitle'), body: c.text('community.events.emptyBody'), action: join }}
          seeThrough
        />

        <Leadership title={c.text('community.leaders.title')} people={people} />
      </AlbumProvider>
    </PageShell>
  );
}
