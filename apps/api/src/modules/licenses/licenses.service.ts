import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { DiscordWebhookService } from "../shared/discord-webhook.service";
import { CreateLicenseDto } from "./dto/create-license.dto";
import { UpdateLicenseDto } from "./dto/update-license.dto";

@Injectable()
export class LicensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhook: DiscordWebhookService
  ) {}

  findAll() {
    return this.prisma.license.findMany({
      include: { product: true, user: true },
      orderBy: { createdAt: "desc" }
    });
  }

  async findOne(id: string) {
    const license = await this.prisma.license.findUnique({
      where: { id },
      include: { product: true, user: true }
    });
    if (!license) throw new NotFoundException("Chave de licença não encontrada");
    return license;
  }

  async create(dto: CreateLicenseDto) {
    const code = this.generateLicenseCode();
    const expiresAt = this.calculateExpiration(dto.type);

    const license = await this.prisma.license.create({
      data: {
        code,
        type: dto.type,
        productId: dto.productId,
        userId: dto.userId || null,
        device: dto.device || null,
        expiresAt,
        status: "ACTIVE"
      },
      include: { product: true, user: true }
    });

    // 🔔 Notificação Discord
    await this.webhook.send({
      event: "LICENSE_CREATED",
      details: {
        "Código": license.code,
        "Tipo": license.type,
        "Produto": license.product?.name ?? "—",
        "Expira em": license.expiresAt?.toLocaleDateString("pt-PT") ?? "Nunca (Lifetime)",
        "Utilizador": license.user?.email ?? "Sem utilizador"
      }
    });

    return license;
  }

  async update(id: string, dto: UpdateLicenseDto) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.license.update({
      where: { id },
      data: {
        status: dto.status,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        device: dto.device,
        userId: dto.userId
      },
      include: { product: true, user: true }
    });

    // Detecta se foi revogada ou renovada
    if (dto.status === "REVOKED" && existing.status !== "REVOKED") {
      await this.webhook.send({
        event: "LICENSE_REVOKED",
        details: {
          "Código": updated.code,
          "Produto": updated.product?.name ?? "—",
          "Utilizador": updated.user?.email ?? "—"
        }
      });
    } else if (dto.expiresAt && existing.expiresAt?.toISOString() !== dto.expiresAt) {
      await this.webhook.send({
        event: "LICENSE_RENEWED",
        details: {
          "Código": updated.code,
          "Nova expiração": new Date(dto.expiresAt).toLocaleDateString("pt-PT"),
          "Produto": updated.product?.name ?? "—"
        }
      });
    }

    return updated;
  }

  async remove(id: string) {
    const license = await this.findOne(id);
    const deleted = await this.prisma.license.delete({ where: { id } });

    await this.webhook.send({
      event: "LICENSE_REVOKED",
      details: {
        "Código": license.code,
        "Produto": license.product?.name ?? "—",
        "Ação": "Deletado permanentemente"
      }
    });

    return deleted;
  }

  private generateLicenseCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const segment = () =>
      Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `IB-${segment()}-${segment()}-${segment()}`;
  }

  private calculateExpiration(type: string): Date | null {
    const now = new Date();
    switch (type) {
      case "trial":   return new Date(now.getTime() + 1000 * 60 * 60 * 2);
      case "1d":      return new Date(now.setDate(now.getDate() + 1));
      case "7d":      return new Date(now.setDate(now.getDate() + 7));
      case "30d":     return new Date(now.setDate(now.getDate() + 30));
      case "90d":     return new Date(now.setDate(now.getDate() + 90));
      case "180d":    return new Date(now.setDate(now.getDate() + 180));
      case "365d":    return new Date(now.setDate(now.getDate() + 365));
      case "lifetime":
      default:        return null;
    }
  }
}
