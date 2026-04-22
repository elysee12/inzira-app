#!/bin/bash

echo "Setting up Imirire database..."

# Push the schema to the database
echo "Pushing Prisma schema..."
npx prisma db push --skip-generate

# Seed the database with initial data
echo "Seeding database..."
npx ts-node prisma/seed.ts

echo "Database setup complete!"
echo ""
echo "Test credentials:"
echo "Email: admin@imirire.rw"
echo "Password: Admin@123"
