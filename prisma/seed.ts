import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  await prisma.license.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const adminPass = await argon2.hash("code", { type: argon2.argon2id });

  const admin = await prisma.user.create({
    data: {
      name: "Administrator",
      email: "lose",
      passwordHash: adminPass,
      role: "ADMIN",
      verifiedAt: new Date()
    }
  });

  const product = await prisma.product.create({
    data: {
      name: "Inject Core",
      description: "Core loader for secure software distribution",
      version: "1.0.0",
      category: "Loader",
      status: "active"
    }
  });

  await prisma.license.create({
    data: {
      code: "INJ-DEMO-TRIAL-KEY-0001",
      type: "trial",
      status: "ACTIVE",
      userId: admin.id,
      productId: product.id,
      activatedAt: new Date()
    }
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
