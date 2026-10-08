/**
 * How an engagement runs. Drafted copy (not from the GWD deck); flagged in the
 * README for the owner's sign-off.
 */
export const PROCESS = [
  { title: 'Brief', body: 'Tell us the problem, the deadline and the budget range. One conversation, one point of contact from then on.' },
  { title: 'Scope', body: 'You get a written plan: what ships first, which services it needs, the timeline and the cost.' },
  { title: 'Build', body: 'A cross-service team delivers in short, visible cycles. You review working software, not status reports.' },
  { title: 'Launch', body: 'Release, handover, documentation and training, signed off against the agreed scope.' },
  { title: 'Run', body: 'Keep us on for support, monitoring and improvements, or take it in-house. Nothing falls between vendors.' },
] as const;
