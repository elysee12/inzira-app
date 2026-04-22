import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Admin User
  const adminEmail = 'admin@imirire.rw';
  const adminPhone = '0780000000';
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      phone: adminPhone,
      password: hashedPassword,
      name: 'Imirire Admin',
      role: Role.ADMIN,
    },
  });

  console.log(`Admin user created: ${admin.email}`);

  // 2. Create Age Categories (Matching frontend data)
  const ageCategories = [
    {
      id: '0-6',
      label: '0 - 6',
      sublabel: 'Amezi',
      color: '#1A8A3A',
      bgColor: '#E8F5EC',
      iconName: 'child',
      description: "Imirire y'umwana yo konka no gukurikirana imikurire y'umwana",
    },
    {
      id: '7-12',
      label: '7 - 12',
      sublabel: 'Amezi',
      color: '#2980B9',
      bgColor: '#EBF5FB',
      iconName: 'child',
      description: 'Guteranya amata yo konka n\'ibiryo bya mbere ku mwana',
    },
    {
      id: '13-24',
      label: '13 - 24',
      sublabel: 'Amezi',
      color: '#8E44AD',
      bgColor: '#F4ECF7',
      iconName: 'child',
      description: 'Imirire myiza yuzuye ku mwana uri gutera imbere',
    },
    {
      id: '25-59',
      label: '25 - 59',
      sublabel: 'Amezi',
      color: '#D35400',
      bgColor: '#FDEBD0',
      iconName: 'child',
      description: 'Imirire myiza ku mwana ukuze ku mwaka 2 kugeza 5',
    },
  ];

  for (const category of ageCategories) {
    await prisma.ageCategory.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }

  console.log('Age categories seeded successfully.');
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
