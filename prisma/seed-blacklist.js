import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const blacklistedTopics = [
  {
    topic: 'suicide',
    description: 'Content related to self-harm or suicide methods'
  },
  {
    topic: 'illegal drugs',
    description: 'Information about illegal drug use, manufacturing, or distribution'
  },
  {
    topic: 'weapons manufacturing',
    description: 'Instructions for creating weapons or explosives'
  },
  {
    topic: 'child abuse',
    description: 'Any content related to harm against children'
  },
  {
    topic: 'financial fraud',
    description: 'Instructions for scams, fraud schemes, or money laundering'
  },
  {
    topic: 'hacking instructions',
    description: 'Guidance on unauthorized system access or cyberattacks'
  },
  {
    topic: 'hate speech',
    description: 'Discriminatory content targeting race, religion, gender, or orientation'
  },
  {
    topic: 'violence instructions',
    description: 'Detailed guidance on harming others physically'
  },
  {
    topic: 'identity theft',
    description: 'Methods for stealing personal information or identities'
  },
  {
    topic: 'illegal activities',
    description: 'General guidance on breaking laws or evading authorities'
  }
];

async function main() {
  console.log('Seeding blacklisted topics...');

  for (const topic of blacklistedTopics) {
    try {
      await prisma.blacklistedTopic.upsert({
        where: { topic: topic.topic },
        update: { description: topic.description },
        create: topic
      });
      console.log(`✓ Added: ${topic.topic}`);
    } catch (error) {
      console.log(`⚠ Skipped (already exists): ${topic.topic}`);
    }
  }

  console.log('\nDone! Blacklist seeded successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
