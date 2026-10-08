import type { Metadata } from 'next';
import { Events } from '@/experience/kit/Events';
import { PageShell } from '@/experience/kit/PageShell';
import { WaysIn } from '@/experience/kit/WaysIn';
import { AuctionReel, type Clip } from '@/experience/sports/AuctionReel';
import { PassportChapter } from '@/experience/sports/PassportChapter';
import { SportsHero } from '@/experience/sports/SportsHero';
import { CrestMarquee, DeploymentReel, PartnerTable, PillarTabs, ProblemSlam, Scoreboard } from '@/experience/sports/SportsWorld';
import { pageMetadata } from '@/lib/seo';
import { siteCopy } from '@/server/modules/content/copy';
import { content } from '@/server/modules/content/service';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = (await siteCopy()).doc('sports.seo');
  return pageMetadata({ title, description, path: '/sports' });
}

/*
 * GWD Sports is played under floodlights: a live stadium runs behind the
 * whole page (the beams sweep and the crowd brightens as you scroll), and
 * the page speaks in the condensed, uppercase voice of a matchday. Every
 * word is editable in the admin (src/content/copy/sports.ts).
 */
export default async function SportsPage() {
  const [c, clubs, events] = await Promise.all([siteCopy(), content.organizations('sports_club'), content.events('sports', true)]);
  const problems = c.doc('sports.problems');
  const platform = c.doc('sports.platform');
  const passport = c.doc('sports.passport');
  const promise = c.doc('sports.promise');
  const deployments = c.doc('sports.deployments');
  const auction = c.doc('sports.auction');
  const crest = c.doc('sports.clubs');
  const partners = c.doc('sports.partners');
  const ways = c.doc('sports.ways');
  const ev = c.doc('sports.events');

  return (
    <PageShell world="sports" tone="dark">
      <SportsHero copy={c.doc('sports.hero')} />

      <ProblemSlam label={problems.label} title={problems.title} items={problems.items} />

      <PillarTabs label={platform.label} title={platform.title} pillars={platform.pillars} />

      <PassportChapter label={passport.label} title={passport.title} body={passport.body} note={passport.note} facts={passport.facts} editions={passport.editions} />

      <Scoreboard label={promise.label} title={promise.title} body={promise.body} facts={promise.facts} />

      <DeploymentReel label={deployments.label} title={deployments.title} hint={deployments.hint} items={deployments.items} />

      <AuctionReel
        eyebrow={auction.label}
        title={auction.title}
        lead={auction.lead}
        play={auction.play}
        clips={auction.clips.map((k) => ({ ...k, shape: k.shape === 'tall' ? 'tall' : 'wide' }) satisfies Clip)}
      />

      {clubs.length > 0 && <CrestMarquee label={crest.label} title={crest.title} lead={crest.lead} orgs={clubs} />}

      <Events
        events={events}
        title={ev.title}
        lead={ev.lead}
        empty={{ title: ev.emptyTitle, body: ev.emptyBody, action: ev.empty }}
        tone="dark"
        voice="stadium"
        seeThrough
      />

      <PartnerTable label={partners.label} title={partners.title} items={partners.items} />

      <WaysIn
        label={ways.label}
        title={ways.title}
        lead={ways.lead}
        ways={[{ intent: 'academy' }, { intent: 'league' }, { intent: 'demo' }]}
        tone="dark"
        sheet={false}
        seeThrough
      />
    </PageShell>
  );
}
