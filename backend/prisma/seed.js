const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@poolleague.com';

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'League',
      lastName: 'Administrator',
      role: 'ADMIN',
      isActive: true
    }
  });

  console.log(`Admin user created: ${admin.email}`);

  // Create sample season
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 4);
  const playoffDate = new Date(endDate);
  playoffDate.setDate(playoffDate.getDate() + 7);

  const season = await prisma.season.upsert({
    where: { id: 'default-season' },
    update: {},
    create: {
      id: 'default-season',
      name: 'Fall 2024 Season',
      startDate,
      endDate,
      playoffDate,
      isActive: true
    }
  });

  console.log(`Season created: ${season.name}`);

  // Create sample venues
  const venues = [
    { name: "Sharky's Bar & Grill", address: '123 Main St', city: 'Kansas City' },
    { name: 'The Corner Pocket', address: '456 Oak Ave', city: 'Kansas City' },
    { name: 'Billiards Club KC', address: '789 Pool Lane', city: 'Kansas City' },
    { name: 'Eight Ball Lounge', address: '321 Cue Street', city: 'Kansas City' }
  ];

  for (const venueData of venues) {
    await prisma.venue.upsert({
      where: { id: venueData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') },
      update: {},
      create: {
        id: venueData.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        ...venueData
      }
    });
  }

  console.log('Venues created');

  // Create sample teams and players
  const teamNames = [
    'Rack Attack',
    'Cue Queens',
    'Breaking Bad Girls',
    'Pocket Rockets',
    'Chalk & Awe',
    'The Hustlers'
  ];

  const playerNames = [
    ['Sarah Mitchell', 'Jessica Chen', 'Amy Rodriguez', 'Dana Kim', 'Rachel Green'],
    ['Maria Santos', 'Linda Park', 'Nicole Brown', 'Emma Wilson', 'Olivia Davis'],
    ['Tanya Brooks', 'Sandra Lee', 'Patricia Martinez', 'Karen White', 'Nancy Taylor'],
    ['Keisha Williams', 'Jennifer Garcia', 'Michelle Robinson', 'Lisa Anderson', 'Ashley Thomas'],
    ['Stephanie Jackson', 'Christina Harris', 'Amanda Clark', 'Megan Lewis', 'Brittany Walker'],
    ['Rebecca Hall', 'Laura Young', 'Heather King', 'Kimberly Wright', 'Crystal Scott']
  ];

  for (let i = 0; i < teamNames.length; i++) {
    const teamId = teamNames[i].toLowerCase().replace(/[^a-z0-9]/g, '-');

    // Create players for this team
    const players = [];
    for (let j = 0; j < playerNames[i].length; j++) {
      const [firstName, lastName] = playerNames[i][j].split(' ');
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
      const playerPassword = await bcrypt.hash('Player123!', 12);

      const player = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          passwordHash: playerPassword,
          firstName,
          lastName,
          role: j === 0 ? 'CAPTAIN' : 'PLAYER',
          handicap: Math.floor(Math.random() * 4) + 3
        }
      });
      players.push(player);
    }

    // Create team
    const team = await prisma.team.upsert({
      where: { id: teamId },
      update: {},
      create: {
        id: teamId,
        name: teamNames[i],
        seasonId: season.id,
        captainId: players[0].id
      }
    });

    // Update players with team reference
    for (const player of players) {
      await prisma.user.update({
        where: { id: player.id },
        data: { teamId: team.id }
      });

      // Create player stats
      const wins = Math.floor(Math.random() * 15) + 5;
      const losses = Math.floor(Math.random() * 10) + 2;

      await prisma.playerStats.upsert({
        where: {
          playerId_seasonId: {
            playerId: player.id,
            seasonId: season.id
          }
        },
        update: {},
        create: {
          playerId: player.id,
          seasonId: season.id,
          wins,
          losses,
          runouts: Math.floor(Math.random() * 5)
        }
      });
    }

    // Create standing
    const wins = Math.floor(Math.random() * 10) + 2;
    const losses = Math.floor(Math.random() * 6) + 1;

    await prisma.standing.upsert({
      where: { teamId: team.id },
      update: {},
      create: {
        teamId: team.id,
        seasonId: season.id,
        wins,
        losses,
        rank: i + 1,
        streak: wins > losses ? `W${Math.floor(Math.random() * 3) + 1}` : `L${Math.floor(Math.random() * 2) + 1}`
      }
    });

    console.log(`Team created: ${teamNames[i]}`);
  }

  // Create sample announcements
  const announcements = [
    {
      title: '🏆 Playoffs Start Dec 15th!',
      content: 'Get ready for the playoffs! Top 4 teams will advance to the single-elimination bracket. The championship match will be held at Billiards Club KC on December 22nd.',
      isUrgent: true
    },
    {
      title: '📸 Photo Night This Thursday',
      content: 'Team photos will be taken at all venues this Thursday. Please wear your team shirts! Photographer will be at each location from 7:00 PM to 8:30 PM.',
      isUrgent: false
    },
    {
      title: '🎄 Holiday Party - Dec 20th',
      content: 'Join us for the annual holiday party at The Corner Pocket! RSVP by December 10th. Awards ceremony will be held during the party. Food and drinks provided.',
      isUrgent: false
    }
  ];

  for (const ann of announcements) {
    await prisma.announcement.create({
      data: {
        ...ann,
        creatorId: admin.id
      }
    });
  }

  console.log('Announcements created');

  // Create Google Drive config placeholder
  await prisma.googleDriveConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      isConfigured: false
    }
  });

  console.log('Database seeded successfully!');
  console.log('');
  console.log('=================================');
  console.log('Admin Login Credentials:');
  console.log(`Email: ${adminEmail}`);
  console.log(`Password: ${adminPassword}`);
  console.log('=================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
