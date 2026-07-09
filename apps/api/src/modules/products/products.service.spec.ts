import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { PrismaService } from "../../prisma/prisma.service";

/** Mock completo do PrismaService — sem conexão de banco necessária */
const prismaMock = {
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  }
};

describe("ProductsService", () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaMock }
      ]
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    jest.clearAllMocks();
  });

  // ─── findAll ────────────────────────────────────────────────────────────
  describe("findAll", () => {
    it("deve retornar uma lista de produtos ordenados por createdAt desc", async () => {
      const mockProducts = [
        { id: "1", name: "Produto A", createdAt: new Date() },
        { id: "2", name: "Produto B", createdAt: new Date() }
      ];
      prismaMock.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.findAll();

      expect(prismaMock.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: "desc" } })
      );
      expect(result).toEqual(mockProducts);
    });
  });

  // ─── findOne ────────────────────────────────────────────────────────────
  describe("findOne", () => {
    it("deve retornar o produto quando ele existe", async () => {
      const mock = { id: "abc", name: "Produto X" };
      prismaMock.product.findUnique.mockResolvedValue(mock);

      const result = await service.findOne("abc");
      expect(result).toEqual(mock);
    });

    it("deve lançar NotFoundException quando o produto não existe", async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne("inexistente")).rejects.toThrow(NotFoundException);
    });
  });

  // ─── create ─────────────────────────────────────────────────────────────
  describe("create", () => {
    it("deve criar e retornar o produto", async () => {
      const dto = {
        name: "Novo",
        description: "Desc",
        version: "1.0.0",
        category: "Software",
        status: "active"
      };
      const created = { id: "new-id", ...dto };
      prismaMock.product.create.mockResolvedValue(created);

      const result = await service.create(dto as any);
      expect(prismaMock.product.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(created);
    });
  });

  // ─── update ─────────────────────────────────────────────────────────────
  describe("update", () => {
    it("deve actualizar o produto quando ele existe", async () => {
      const existing = { id: "abc", name: "Antigo" };
      const updated = { id: "abc", name: "Novo" };
      prismaMock.product.findUnique.mockResolvedValue(existing);
      prismaMock.product.update.mockResolvedValue(updated);

      const result = await service.update("abc", { name: "Novo" } as any);
      expect(result).toEqual(updated);
    });

    it("deve lançar NotFoundException se o produto não existir", async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(service.update("x", {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  // ─── remove ─────────────────────────────────────────────────────────────
  describe("remove", () => {
    it("deve deletar o produto quando existe", async () => {
      const existing = { id: "abc", name: "P" };
      prismaMock.product.findUnique.mockResolvedValue(existing);
      prismaMock.product.delete.mockResolvedValue(existing);

      const result = await service.remove("abc");
      expect(prismaMock.product.delete).toHaveBeenCalledWith({ where: { id: "abc" } });
      expect(result).toEqual(existing);
    });

    it("deve lançar NotFoundException se produto não existir", async () => {
      prismaMock.product.findUnique.mockResolvedValue(null);

      await expect(service.remove("none")).rejects.toThrow(NotFoundException);
    });
  });
});
