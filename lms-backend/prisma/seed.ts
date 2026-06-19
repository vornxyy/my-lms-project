import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding sequence...');

  // 1. Clean out old data to avoid unique constraint violations on re-runs
  await prisma.testItem.deleteMany({});
  await prisma.analysisRequest.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create a Root System Admin User
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@lms.local',
      password: 'secure_hashed_password', // In production, hash this with bcrypt/argon2
      name: 'Alexander Wright',
      role: 'ADMIN',
    },
  });

  // 3. Create a Mock Patient
  const patient = await prisma.patient.create({
    data: {
      patientUuid: 'PT-99482',
      firstName: 'Eleanor',
      lastName: 'Vance',
      dob: new Date('1994-08-24'),
      gender: 'Female',
      phone: '+1-555-0199',
      email: 'eleanor.vance@example.com',
      nationalHealthId: 'NHI-8839-2026',
    },
  });

  // 4. Create an Urgent Analysis Request for the Patient
  const request = await prisma.analysisRequest.create({
    data: {
      patientId: patient.id,
      requestedBy: adminUser.name,
      priority: 'URGENT',
      currentStatus: 'IN_ANALYSIS',
    },
  });

  // 5. Attach Diagnostic Test Items to the Request
  await prisma.testItem.createMany({
    data: [
      {
        analysisRequestId: request.id,
        testName: 'Serum Glucose',
        department: 'Biochemistry',
        value: 142.5,
        unit: 'mg/dL',
        referenceRangeMin: 70.0,
        referenceRangeMax: 100.0,
        flag: 'HIGH',
        isCompleted: true,
      },
      {
        analysisRequestId: request.id,
        testName: 'Hemoglobin A1c',
        department: 'Hematology',
        value: 5.4,
        unit: '%',
        referenceRangeMin: 4.0,
        referenceRangeMax: 5.6,
        flag: 'NORMAL',
        isCompleted: true,
      },
    ],
  });

  console.log('✅ Database seeding complete! Generated core structural nodes.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed unexpectedly:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });