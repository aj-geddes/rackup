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
