import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { requireRole, validateCsrf } from "@/lib/security/guards";

// Seleção segura do utilizador associado a uma encomenda — nunca devolver
// passwordHash / twoFactorSecret (mesmo padrão de `licenses/route.ts`).
const safeUserSelect = { id: true, name: true, email: true, role: true } as const;

const allowedStatus = ["pending", "paid", "cancelled", "refunded"];

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("MODERATOR");
  if (auth.response) return auth.response;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const body = await req.json().catch(() => null);
  if (!body?.status || !allowedStatus.includes(body.status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const existing = await db.order.findUnique({ where: { id: params.id }, include: { payments: true } });
  if (!existing) return NextResponse.json({ error: "Encomenda não encontrada" }, { status: 404 });

  // BUG FIX #15: Validar que total é um número válido e positivo
  const total = typeof existing.total === 'number' ? existing.total : parseFloat(String(existing.total));
  if (isNaN(total) || total < 0 || !isFinite(total)) {
    return NextResponse.json({ error: "Total da encomenda inválido" }, { status: 400 });
  }

  await db.order.update({
    where: { id: params.id },
    data: { status: body.status }
  });

  // "paid" sem nenhum Payment "completed" ainda associado → cria um
  // pagamento manual, para manter a receita em /api/stats consistente.
  if (body.status === "paid") {
    const hasCompletedPayment = existing.payments.some((p) => p.status === "completed");
    if (!hasCompletedPayment) {
      await db.payment.create({
        data: {
          orderId: existing.id,
          gateway: "Manual",
          amount: total, // Usar total validado
          currency: "USD",
          status: "completed"
        }
      });
    }
  } else if (body.status === "refunded") {
    // Atualiza o pagamento existente (de preferência o que estava
    // "completed") em vez de criar um novo registo de pagamento.
    const paymentToRefund = existing.payments.find((p) => p.status === "completed") ?? existing.payments[0];
    if (paymentToRefund) {
      await db.payment.update({ where: { id: paymentToRefund.id }, data: { status: "refunded" } });
    }
  }

  await db.log.create({
    data: { action: "ORDER_UPDATE", message: `Encomenda ${existing.id} atualizada para ${body.status}`, userId: auth.session.sub }
  });

  const order = await db.order.findUnique({
    where: { id: params.id },
    include: {
      product: true,
      user: { select: safeUserSelect },
      payments: { orderBy: { createdAt: "desc" } }
    }
  });

  return NextResponse.json(order);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireRole("ADMIN");
  if (auth.response) return auth.response;
  const csrfError = validateCsrf(req);
  if (csrfError) return csrfError;

  const order = await db.order.delete({ where: { id: params.id } });

  await db.log.create({
    data: { action: "ORDER_DELETE", message: `Encomenda ${order.id} eliminada`, userId: auth.session.sub }
  });

  return NextResponse.json({ ok: true });
}
