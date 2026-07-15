import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.license.deleteMany();
  await prisma.product.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.user.deleteMany();

  const adminPass = await bcrypt.hash("Admin@123456", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Administrator",
      email: "admin@injectbypass.io",
      passwordHash: adminPass,
      role: "SUPER_ADMIN",
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

  const plan = await prisma.plan.create({
    data: {
      name: "Pro",
      price: 29.9,
      billingPeriod: "monthly"
    }
  });

  // Encomendas demo para o admin, ligadas ao produto "Inject Core", com
  // estados variados para a página de Orders & Payments não ficar vazia
  // numa demo fresca.
  const paidOrderOne = await prisma.order.create({
    data: {
      userId: admin.id,
      productId: product.id,
      total: 49.9,
      status: "paid"
    }
  });

  const paidOrderTwo = await prisma.order.create({
    data: {
      userId: admin.id,
      productId: product.id,
      total: 19.9,
      status: "paid"
    }
  });

  await prisma.order.create({
    data: {
      userId: admin.id,
      productId: product.id,
      total: 49.9,
      status: "pending"
    }
  });

  // As encomendas "paid" têm de ter um Payment "completed" correspondente
  // para que a receita somada em /api/stats fique consistente.
  await prisma.payment.create({
    data: {
      orderId: paidOrderOne.id,
      gateway: "Manual",
      amount: paidOrderOne.total,
      currency: "USD",
      status: "completed"
    }
  });

  await prisma.payment.create({
    data: {
      orderId: paidOrderTwo.id,
      gateway: "Manual",
      amount: paidOrderTwo.total,
      currency: "USD",
      status: "completed"
    }
  });

  // eslint-disable-next-line no-console
  console.log(`Seed concluído. Login demo: ${admin.email} / Admin@123456`);
  // eslint-disable-next-line no-console
  console.log(`Plano demo: ${plan.name} ($${plan.price}/${plan.billingPeriod}) · 3 encomendas demo criadas`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
