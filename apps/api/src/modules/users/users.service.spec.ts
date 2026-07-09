import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { UsersService } from "./users.service";
import { PrismaService } from "../../prisma/prisma.service";

const prismaMock = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};

const selectedFields = {
  id: true, name: true, email: true, role: true,
  isBanned: true, createdAt: true, locale: true, theme: true
};

describe("UsersService", () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock }
      ]
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  // ─── findAll ────────────────────────────────────────────────────────────
  describe("findAll", () => {
    it("deve retornar lista de utilizadores com campos seleccionados", async () => {
      const mockUsers = [{ id: "1", name: "Admin", email: "a@b.com", role: "ADMIN", isBanned: false, createdAt: new Date() }];
      prismaMock.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ select: selectedFields })
      );
      expect(result).toEqual(mockUsers);
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────
  describe("findOne", () => {
    it("deve retornar o utilizador quando existe", async () => {
      const mock = { id: "u1", name: "João", email: "j@j.pt", role: "USER", isBanned: false };
      prismaMock.user.findUnique.mockResolvedValue(mock);

      expect(await service.findOne("u1")).toEqual(mock);
    });

    it("deve lançar NotFoundException quando utilizador não existe", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne("nope")).rejects.toThrow(NotFoundException);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────
  describe("update", () => {
    it("deve actualizar utilizador existente", async () => {
      const existing = { id: "u1", name: "Velho" };
      const updated = { id: "u1", name: "Novo" };
      prismaMock.user.findUnique.mockResolvedValue(existing);
      prismaMock.user.update.mockResolvedValue(updated);

      const result = await service.update("u1", { name: "Novo" } as any);
      expect(result).toEqual(updated);
    });

    it("deve banir utilizador ao definir isBanned: true", async () => {
      const existing = { id: "u2", isBanned: false };
      prismaMock.user.findUnique.mockResolvedValue(existing);
      prismaMock.user.update.mockResolvedValue({ ...existing, isBanned: true });

      const result = await service.update("u2", { isBanned: true } as any);
      expect(result.isBanned).toBe(true);
    });

    it("deve lançar NotFoundException para utilizador inexistente", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.update("x", {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────
  describe("remove", () => {
    it("deve deletar utilizador existente", async () => {
      const existing = { id: "u3", name: "Del", email: "d@d.com" };
      prismaMock.user.findUnique.mockResolvedValue(existing);
      prismaMock.user.delete.mockResolvedValue(existing);

      const result = await service.remove("u3");
      expect(result).toEqual(existing);
    });

    it("deve lançar NotFoundException para utilizador inexistente", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.remove("none")).rejects.toThrow(NotFoundException);
    });
  });
});
