import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash("Admin@123456", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@injectbypass.io" },
    update: {},
    create: {
      name: "Administrator",
      email: "admin@injectbypass.io",
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
