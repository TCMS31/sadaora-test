import { hashPassword } from '../src/lib/passwords';
import { DataStore } from '../src/repositories/types';

export interface SeedMember {
  email: string;
  name: string;
  headline: string;
  bio: string;
  interests: string[];
}

export const DEMO_PASSWORD = 'sadaora-demo-2025';

/** The account the demo/README instructions tell you to sign in as. */
export const DEMO_ACCOUNT: SeedMember = {
  email: 'demo@sadaora.test',
  name: 'Jordan Reyes',
  headline: 'Product engineer, ex-fintech',
  bio: 'I build internal tools that other engineers actually want to use. Currently interested in developer platforms and the unglamorous parts of reliability.',
  interests: ['developer tools', 'observability', 'typescript', 'climbing'],
};

export const DEMO_MEMBERS: SeedMember[] = [
  {
    email: 'amara@sadaora.test',
    name: 'Amara Okonkwo',
    headline: 'Staff data engineer at a logistics marketplace',
    bio: 'Ten years of moving large, messy datasets between systems that were never designed to talk to each other. I care about schema contracts and about pipelines you can debug at 3am.',
    interests: ['data engineering', 'postgres', 'dbt', 'long-distance running'],
  },
  {
    email: 'theo@sadaora.test',
    name: 'Theo Lindqvist',
    headline: 'Design engineer — design systems and accessibility',
    bio: 'I sit between design and front-end and try to make that seam invisible. Most of my work is component APIs, token pipelines and making keyboard navigation a first-class concern rather than an audit item.',
    interests: ['design systems', 'accessibility', 'css', 'typography'],
  },
  {
    email: 'priya@sadaora.test',
    name: 'Priya Raghunathan',
    headline: 'Backend lead, payments infrastructure',
    bio: 'Idempotency keys, reconciliation jobs and ledger design. I have strong opinions about retries and I will happily explain all of them over coffee.',
    interests: ['distributed systems', 'payments', 'go', 'chess'],
  },
  {
    email: 'marcus@sadaora.test',
    name: 'Marcus Bell',
    headline: 'SRE — platform reliability',
    bio: 'I spend my time on the boring things that keep services up: capacity planning, sensible alerting and postmortems people actually read. Previously ran on-call for a fleet of about 400 services.',
    interests: ['kubernetes', 'observability', 'incident response', 'woodworking'],
  },
  {
    email: 'sofia@sadaora.test',
    name: 'Sofia Marchetti',
    headline: 'Mobile engineer, React Native and Swift',
    bio: 'Shipping consumer apps to a few million users taught me that performance work is mostly measurement. I am happiest profiling a janky list until it is not janky any more.',
    interests: ['react native', 'swift', 'performance', 'film photography'],
  },
  {
    email: 'kenji@sadaora.test',
    name: 'Kenji Watanabe',
    headline: 'ML engineer working on ranking',
    bio: 'Feature stores, offline/online parity and the unglamorous evaluation work that decides whether a model is actually better. Sceptical of benchmarks that nobody can reproduce.',
    interests: ['machine learning', 'ranking', 'python', 'bouldering'],
  },
  {
    email: 'nadia@sadaora.test',
    name: 'Nadia Haddad',
    headline: 'Security engineer, application security',
    bio: 'Threat modelling, dependency hygiene and teaching teams to find their own bugs. I would rather delete an attack surface than monitor it.',
    interests: ['appsec', 'threat modelling', 'rust', 'cryptic crosswords'],
  },
  {
    email: 'liam@sadaora.test',
    name: 'Liam Ferreira',
    headline: 'Founding engineer at a climate-tech startup',
    bio: 'Currently building measurement tooling for grid-scale batteries. Comfortable being the only person who understands a subsystem, uncomfortable leaving it that way.',
    interests: ['climate tech', 'embedded', 'timeseries', 'cycling'],
  },
  {
    email: 'grace@sadaora.test',
    name: 'Grace Adeyemi',
    headline: 'Engineering manager, developer experience',
    bio: 'I look after the tools and the people who maintain them. Build times, flaky tests and onboarding friction are all the same problem wearing different hats.',
    interests: ['developer experience', 'ci/cd', 'coaching', 'jazz piano'],
  },
];

/**
 * Populates a `DataStore` with realistic demo content. Works against any
 * driver, so the same function can seed the in-memory demo server or a real
 * PostgreSQL database.
 */
export async function seedDemoData(store: DataStore): Promise<void> {
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const created: { userId: string; profileId: string }[] = [];

  for (const member of [...DEMO_MEMBERS].reverse()) {
    // eslint-disable-next-line no-await-in-loop
    const user = await store.users.create({ email: member.email, passwordHash });
    // eslint-disable-next-line no-await-in-loop
    const profile = await store.profiles.upsertForUser(user.id, {
      name: member.name,
      headline: member.headline,
      bio: member.bio,
      interests: member.interests,
    });
    created.push({ userId: user.id, profileId: profile.id });
  }

  const demoUser = await store.users.create({ email: DEMO_ACCOUNT.email, passwordHash });
  await store.profiles.upsertForUser(demoUser.id, {
    name: DEMO_ACCOUNT.name,
    headline: DEMO_ACCOUNT.headline,
    bio: DEMO_ACCOUNT.bio,
    interests: DEMO_ACCOUNT.interests,
  });

  // A deterministic but uneven spread of likes, so the feed shows a range of
  // counts rather than a suspiciously uniform one.
  const likeSpread = [8, 6, 5, 3, 3, 2, 2, 1, 0];
  const memberIds = created.map((entry) => entry.userId);

  for (let index = 0; index < created.length; index += 1) {
    const { profileId, userId: ownerId } = created[index];
    const likers = memberIds.filter((id) => id !== ownerId).slice(0, likeSpread[index] ?? 0);
    for (const likerId of likers) {
      // eslint-disable-next-line no-await-in-loop
      await store.likes.add(profileId, likerId);
    }
  }

  // The signed-in demo user has liked two profiles, so both the liked and the
  // unliked state are visible on first load rather than only after a click.
  await store.likes.add(created[1].profileId, demoUser.id);
  await store.likes.add(created[4].profileId, demoUser.id);
}
