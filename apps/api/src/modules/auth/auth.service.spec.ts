import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { ConflictException, UnauthorizedException, ForbiddenException } from "@nestjs/common";

describe("AuthService", () => {
  let service: AuthService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    log: { create: jest.fn() },
    session: { create: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn() },
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue("token"), verifyAsync: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("register should throw ConflictException on duplicate email", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "1" });
    await expect(
      service.register({ name: "a", email: "a@b.com", password: "password123" })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("register should create user when email is free", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: "new", email: "a@b.com", name: "a", role: "USER", createdAt: new Date() });
    prisma.log.create.mockResolvedValue({});
    const res = await service.register({ name: "a", email: "a@b.com", password: "password123" });
    expect(res.email).toBe("a@b.com");
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it("login should throw UnauthorizedException when user missing", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login({ email: "x@y.com", password: "password123" })).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it("login should throw ForbiddenException when banned", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "1", email: "x@y.com", passwordHash: "h", isBanned: true });
    await expect(service.login({ email: "x@y.com", password: "password123" })).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it("refresh should throw UnauthorizedException for unknown user", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.refresh("unknown")).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("logout should delete sessions", async () => {
    prisma.session.deleteMany.mockResolvedValue({ count: 1 });
    prisma.log.create.mockResolvedValue({});
    await service.logout("u1");
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });
});