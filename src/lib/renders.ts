/**
 * Which diorama (scripts/blender, published to public/media/renders)
 * illustrates which service, product or step, with alt text describing what
 * each scene shows.
 */
export const SERVICE_RENDER: Record<string, { name: string; alt: string }> = {
  'digital-product-engineering': { name: 'svc-product', alt: 'A product studio mid-build: a team around a table of prototypes, a roadmap on the whiteboard and a 3D printer making a red part' },
  'enterprise-software-solutions': { name: 'svc-enterprise', alt: 'An office running one system: people at desks with dashboards, a company-wide ERP screen on the wall and a meeting in the corner' },
  'web-commerce-experiences': { name: 'svc-web', alt: 'A giant laptop showing an online shop, with shoppers carrying bags, parcels stacked and a delivery van leaving' },
  'mobile-experience-engineering': { name: 'svc-mobile', alt: 'Phones standing like towers showing app screens, with people using their phones around them' },
  'ai-intelligent-automation': { name: 'svc-ai', alt: 'An automated line: documents pass under an AI scanner, robot arms sort them into boxes, and an AI chip runs the workflow shown on the wall' },
  'cloud-infrastructure-devops': { name: 'svc-cloud', alt: 'A server room linked to a cloud above, with containers moving through build, test and deploy gates' },
  'cybersecurity-digital-resilience': { name: 'svc-cybersecurity', alt: 'A security operations room: analysts watching a live threat map while the servers sit under a red shield dome' },
  'data-engineering-analytics': { name: 'svc-data', alt: 'A bar chart growing out of the floor beside databases, with analysts reading dashboards' },
  'api-integration-digital-ecosystems': { name: 'svc-api', alt: 'A central API console connected by cables to a shop, an ERP, a chat app and a dashboard, with data packets travelling between them' },
  'product-strategy-experience-design': { name: 'svc-ux', alt: 'A design studio: a wall of sticky notes, a designer at two screens of interface layouts, and a user testing an app on the sofa' },
  'digital-growth-brand-experiences': { name: 'svc-branding', alt: 'A brand launch: a billboard, packaging on a display table, a camera on a tripod and a campaign on a phone' },
  'immersive-media-creative-production': { name: 'svc-motion', alt: 'A film set: a red sphere on a turntable in front of a backdrop, a camera on a dolly track, softbox lights and an editor at the timeline' },
  'gaming-interactive-technologies': { name: 'svc-games', alt: 'A game studio: two players testing a build on a big screen, an arcade cabinet and a developer at a desk' },
  'technology-consulting-digital-transformation': { name: 'svc-consulting', alt: 'A strategy room: a team around the boardroom table while a consultant presents a transformation roadmap' },
  'managed-technology-services': { name: 'svc-managed', alt: 'A support and monitoring desk: agents with headsets, a status wall and server racks behind' },
};

/** The five steps of how GWD works, in order (Brief, Scope, Build, Launch, Run). */
export const STEP_RENDER: { name: string; alt: string }[] = [
  { name: 'step-brief', alt: 'Someone at a laptop sending a brief, a red paper plane flying off' },
  { name: 'step-scope', alt: 'Two people planning over a roadmap laid out on a table' },
  { name: 'step-build', alt: 'A crane setting the last red module on a stack of blocks' },
  { name: 'step-launch', alt: 'A rocket lifting off its pad' },
  { name: 'step-run', alt: 'Servers running with a live pulse line, and an engineer watching the monitor' },
];

export const PRODUCT_RENDER: Record<string, { name: string; alt: string }> = {
  'gwd-sports': {
    name: 'prod-sports',
    alt: 'A model stadium on match night: a full crowd in two stands under floodlit roofs, players in red and white on the pitch, a GWD Sports scoreboard, and the app on a giant phone beside a gold player card',
  },
  nestbridge: {
    name: 'prod-nestbridge',
    alt: 'A model neighbourhood: a tower going up under a red crane, a block with a home for rent, a villa for sale, a technician at a villa with the NestBridge van, the local NestBridge office, and listings pinned above each home from the app',
  },
  torqio: {
    name: 'prod-torqio',
    alt: 'A model mobility hub: a Torqio showroom with cars and two-wheelers, a service bay with a car up on the lift, a spare-parts store stocked to the ceiling, a commercial truck on the lot, and the app pointing to the nearest mechanic and parts store',
  },
  dreamx: {
    name: 'prod-dreamx',
    alt: 'A model city street: clothing stores for men, women and kids, the DreamX hub with riders, a rider carrying an order along a glowing route to a home, all inside a 30-minute delivery ring',
  },
};
