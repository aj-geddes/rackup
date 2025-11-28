const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');

const prisma = new PrismaClient();

async function checkDatabaseConnection() {
  console.log('Checking database connection...');
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

async function checkTablesExist() {
  console.log('Checking if database tables exist...');
  try {
    // Try to query a core table - if it fails, tables don't exist
    await prisma.user.findFirst();
    console.log('Database tables exist');
    return true;
  } catch (error) {
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      console.log('Database tables do not exist');
      return false;
    }
    // Re-throw unexpected errors
    throw error;
  }
}

async function pushSchema() {
  console.log('Pushing database schema...');
  try {
    const schemaPath = path.join(__dirname, '../../prisma/schema.prisma');
    execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../..')
    });
    console.log('Database schema pushed successfully');
    return true;
  } catch (error) {
    console.error('Failed to push schema:', error.message);
    return false;
  }
}

async function checkNeedsSeed() {
  try {
    const userCount = await prisma.user.count();
    return userCount === 0;
  } catch {
    return true;
  }
}

async function runSeed() {
  console.log('Seeding database...');
  try {
    const seedPath = path.join(__dirname, '../../prisma/seed.js');
    execSync(`node "${seedPath}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../..'),
      env: { ...process.env }
    });
    console.log('Database seeded successfully');
    return true;
  } catch (error) {
    console.error('Failed to seed database:', error.message);
    return false;
  }
}

async function initializeDatabase() {
  console.log('=================================');
  console.log('Database Initialization Starting');
  console.log('=================================');

  // Step 1: Check connection
  const connected = await checkDatabaseConnection();
  if (!connected) {
    throw new Error('Cannot connect to database. Please check DATABASE_URL.');
  }

  // Step 2: Check if tables exist
  const tablesExist = await checkTablesExist();

  // Step 3: Push schema if tables don't exist
  if (!tablesExist) {
    console.log('First-time setup detected. Creating database schema...');
    const pushed = await pushSchema();
    if (!pushed) {
      throw new Error('Failed to create database schema.');
    }

    // Step 4: Seed the database for first-time setup
    console.log('Running initial database seed...');
    const seeded = await runSeed();
    if (!seeded) {
      console.warn('Warning: Database seeding failed, but schema was created.');
    }
  } else {
    // Check if database needs seeding (empty but tables exist)
    const needsSeed = await checkNeedsSeed();
    if (needsSeed) {
      console.log('Database is empty. Running seed...');
      await runSeed();
    }
  }

  console.log('=================================');
  console.log('Database Initialization Complete');
  console.log('=================================');

  return prisma;
}

module.exports = {
  initializeDatabase,
  checkDatabaseConnection,
  checkTablesExist,
  prisma
};
