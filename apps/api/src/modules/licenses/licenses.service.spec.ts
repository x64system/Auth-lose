import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { LicensesService } from "./licenses.service";
import { PrismaService } from "../../prisma/prisma.service";
import { DiscordWebhookService } from "../shared/discord-webhook.service";

const prismaMock = {
  license: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};

// Webhook silencioso nos testes
const webhookMock = { send: jest.fn().mockResolvedValue(undefined) };

describe("LicensesService", () => {
  let service: LicensesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicensesService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: DiscordWebhookService, useValue: webhookMock }
      ]
    }).compile();

    service = module.get<LicensesService>(LicensesService);
    jest.clearAllMocks();
  });

  // ─── findAll ────────────────────────────────────────────────────────────
  describe("findAll", () => {
    it("deve retornar todas as licenças com relações incluídas", async () => {
      const mock = [{ id: "l1", code: "IB-AAAA-BBBB-CCCC" }];
      prismaMock.license.findMany.mockResolvedValue(mock);

      const result = await service.findAll();
      expect(prismaMock.license.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ include: { product: true, user: true } })
      );
      expect(result).toEqual(mock);
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────
  describe("findOne", () => {
    it("deve retornar a licença quando existe", async () => {
      const mock = { id: "l1", code: "IB-AAAA-BBBB-CCCC" };
      prismaMock.license.findUnique.mockResolvedValue(mock);
      expect(await service.findOne("l1")).toEqual(mock);
    });

    it("deve lançar NotFoundException quando licença não existe", async () => {
      prismaMock.license.findUnique.mockResolvedValue(null);
      await expect(service.findOne("nope")).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────
  describe("create", () => {
    it("deve criar licença com código IB-XXXX-XXXX-XXXX e enviar webhook", async () => {
      const dto = { productId: "prod1", type: "30d" };
      const created = {
        id: "l1",
        code: "IB-TEST-TEST-TEST",
        type: "30d",
        product: { name: "Produto" },
        user: null,
        expiresAt: new Date()
      };
      prismaMock.license.create.mockResolvedValue(created);

      const result = await service.create(dto as any);

      // Código deve ter formato IB-XXXX-XXXX-XXXX
      expect(prismaMock.license.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            code: expect.stringMatching(/^IB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/),
            type: "30d",
            productId: "prod1",
            status: "ACTIVE"
          })
        })
      );
      expect(webhookMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ event: "LICENSE_CREATED" })
      );
      expect(result).toEqual(created);
    });

    it("deve gerar expiresAt null para tipo 'lifetime'", async () => {
      const dto = { productId: "prod1", type: "lifetime" };
      prismaMock.license.create.mockResolvedValue({ code: "IB-X-X-X", product: {}, user: null, expiresAt: null });

      await service.create(dto as any);

      expect(prismaMock.license.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ expiresAt: null })
        })
      );
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────
  describe("update", () => {
    it("deve revogar licença e enviar webhook LICENSE_REVOKED", async () => {
      const existing = { id: "l1", code: "IB-X", status: "ACTIVE", product: { name: "P" }, user: null, expiresAt: null };
      prismaMock.license.findUnique.mockResolvedValue(existing);
      prismaMock.license.update.mockResolvedValue({ ...existing, status: "REVOKED" });

      await service.update("l1", { status: "REVOKED" as any });

      expect(webhookMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ event: "LICENSE_REVOKED" })
      );
    });

    it("deve renovar licença e enviar webhook LICENSE_RENEWED", async () => {
      const newExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
      const existing = { id: "l1", code: "IB-X", status: "ACTIVE", product: { name: "P" }, user: null, expiresAt: new Date("2020-01-01") };
      prismaMock.license.findUnique.mockResolvedValue(existing);
      prismaMock.license.update.mockResolvedValue({ ...existing, expiresAt: new Date(newExpiry) });

      await service.update("l1", { expiresAt: newExpiry } as any);

      expect(webhookMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ event: "LICENSE_RENEWED" })
      );
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────
  describe("remove", () => {
    it("deve deletar e notificar revogação via webhook", async () => {
      const existing = { id: "l1", code: "IB-X", product: { name: "P" }, user: null };
      prismaMock.license.findUnique.mockResolvedValue(existing);
      prismaMock.license.delete.mockResolvedValue(existing);

      await service.remove("l1");

      expect(prismaMock.license.delete).toHaveBeenCalledWith({ where: { id: "l1" } });
      expect(webhookMock.send).toHaveBeenCalledWith(
        expect.objectContaining({ event: "LICENSE_REVOKED" })
      );
    });
  });
});
