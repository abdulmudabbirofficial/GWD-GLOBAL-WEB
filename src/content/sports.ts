/**
 * GWD Sports page copy, from the "GWD Sports: Product & Business Overview"
 * PDF supplied by GWD (public partner distribution). Prices, market sizing
 * and internal engineering metrics in that document are deliberately left
 * out (client-first rule); everything here is a fact stated in it.
 */

export const SPORTS = {
  title: 'The operating system for grassroots and youth sports.',
  lead: 'Academy operations, live tournaments and a Sports Passport that every athlete owns, on one platform. Live in Hyderabad today.',

  problems: [
    {
      title: 'The academy trap',
      body: 'Grassroots academies lose 20–30% of monthly fees to defaults. Coaches spend training hours chasing parents on WhatsApp, keeping paper attendance and reconciling cash by hand.',
    },
    {
      title: 'The tournament black hole',
      body: 'Leagues run as weekend events on spreadsheets. Age rules are bypassed with fake birth certificates, auction maths breaks mid-event, and every statistic vanishes at the final whistle.',
    },
    {
      title: 'The invisible athlete',
      body: 'A child can train for eight years across several academies and still have no portable record. Scouts and federations have nothing verified to go on.',
    },
  ],

  pillars: [
    {
      key: 'academy',
      name: 'Academy Operating System',
      line: 'The day-to-day of an academy, automated.',
      render: { name: 'sports-academy', alt: 'A training pitch with red cones and young players, a coach checking the session on a phone and a check-in stand by the touchline' },
      points: [
        { title: 'Roster hub', body: 'Bulk student import with automatic duplicate resolution.' },
        { title: 'Geofenced attendance', body: 'GPS and QR check-in tied to the live training session, with the coach keeping the final say.' },
        { title: 'Fee rails', body: 'Razorpay Route pays dues straight into the academy’s account, with gapless sequential receipts.' },
        { title: 'Parent updates', body: 'Attendance, fees and weekly digests on the official WhatsApp Cloud API, with quiet hours and a daily cap.' },
      ],
    },
    {
      key: 'tournament',
      name: 'Tournament Operating System',
      line: 'Broadcast-grade competition for grassroots leagues.',
      render: { name: 'sports-tournament', alt: 'A dark auction room: club tables raising red paddles, an auctioneer at a red lectern, live screens on the wall and a trophy in the corner' },
      points: [
        { title: 'Live auction room', body: 'A synchronised auction console with a solvency rule, so no team can spend its purse before its squad is full.' },
        { title: 'Touchline scoring', body: 'Two taps per event on a phone; tables are computed from the event log and cannot be hand-edited.' },
        { title: 'Fair play, automated', body: 'FIFA-style fair-play tie-breakers and card-accumulation suspensions across the fixture calendar.' },
        { title: 'Graphics and overlays', body: 'Instant match cards, leaderboards and live broadcast overlays for streams.' },
      ],
    },
    {
      key: 'passport',
      name: 'Universal Sports Passport',
      line: 'One record that belongs to the player, for life.',
      render: { name: 'prod-sports', alt: 'A floodlit model pitch with players in red, a phone running GWD Sports and a gold player passport card' },
      points: [
        { title: 'One identity', body: 'A GWD-XXXXXX ID owned by the player, not the academy.' },
        { title: 'Survives transfers', body: 'Matches, goals, cards and honours travel with the child across academies and leagues.' },
        { title: 'Child privacy by design', body: 'DPDP Act 2023 consent in two steps, and public pages that never show contact details or private notes.' },
        { title: 'Earned cards', body: 'Player cards in four earned editions: Bronze, Silver, Gold and Signature.' },
      ],
    },
  ],

  passport: {
    title: 'A career record that travels with the child.',
    body: 'Most sports software keeps a student’s history inside one academy; when the child leaves, it is gone. The GWD Sports Passport is the one record in the system that belongs to the athlete, so verified matches, minutes, goals and trophies follow them from academy to league to trials.',
    facts: [
      { value: 'GWD-XXXXXX', label: 'Player-owned ID' },
      { value: '4', label: 'Earned card editions' },
      { value: '40', label: 'Child-safe rating floor' },
      { value: '2-step', label: 'DPDP consent' },
    ],
    editions: ['Bronze', 'Silver', 'Gold', 'Signature'],
  },

  promise: {
    title: 'Academies pay nothing, and keep every rupee of their fees.',
    body: 'No setup fee and no monthly subscription. Coaching fees go straight to the academy’s bank account through automated payment rails; parents pay a small convenience fee at checkout, which covers payments, passport hosting, receipts and analytics.',
    facts: [
      { value: '₹0', label: 'Setup' },
      { value: '₹0', label: 'Monthly' },
      { value: '100%', label: 'Fees kept by the academy' },
    ],
  },

  deployments: [
    {
      name: 'HSL Youth Cup, Season 3',
      org: 'Hyderabad Super League',
      crest: '/media/crests/hyderabad-super-league.png',
      body: 'End-to-end digital partner for Hyderabad’s youth football tournament: a live auction room with purse enforcement, touchline scoring and fair-play standings.',
      facts: [
        { value: '10', label: 'Clubs' },
        { value: '146', label: 'Verified passports' },
        { value: '19', label: 'Fixtures' },
      ],
    },
    {
      name: 'Sreenidi Deccan Little Stars',
      org: 'Sreenidi Deccan FC',
      crest: '/media/crests/sreenidi-deccan-fc.png',
      body: 'Official IT and operating partner for the youth academy of Sreenidi Deccan FC, a feeder to the I-League club: batch scheduling, QR attendance, online fees and Sports Passports.',
      facts: [{ value: 'Academy OS', label: 'Full deployment' }],
    },
    {
      name: 'MasterGrade',
      org: 'Founding academy partner',
      crest: '/media/logos/mastergrade.png',
      body: 'The founding academy partner in Kukatpally, running attendance and a synchronised cash and online ledger for its youth athletes, and growing into the Hyderabad Youth League and Hyderabad Football League.',
      facts: [
        { value: '100+', label: 'Youth athletes' },
        { value: '15%+', label: 'Fee collection recovered' },
      ],
    },
  ],

  partners: [
    {
      who: 'Academies',
      what: 'The Academy Operating System, QR check-in, a branded academy page and fee rails.',
      terms: 'Free, and the academy keeps 100% of its coaching fees.',
    },
    {
      who: 'Tournament organisers',
      what: 'The Tournament Operating System: auction console, touchline scoring, graphics and broadcast overlays.',
      terms: 'An annual tournament licence with co-branding.',
    },
    {
      who: 'Schools and institutions',
      what: 'Sports discovery days, fitness benchmarking and NEP 2020 sports compliance reports.',
      terms: 'Funded by local brand sponsorships, not school budgets.',
    },
    {
      who: 'Brands and sponsors',
      what: 'Activation across verified youth athletes and their families.',
      terms: 'Category-exclusive sponsorship across leagues, tournaments and passport cards.',
    },
  ],
} as const;
