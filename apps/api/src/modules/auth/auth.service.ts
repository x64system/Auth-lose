import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    await this.prisma.log.create({
      data: { action: 'REGISTER', message: 'New user registration', userId: user.id },
    });

    return user;
  }

  async login(dto: LoginDto, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.isBanned) {
      throw new ForbiddenException('User banned');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.generateToken(user);
    await this.prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: ip,
      },
    });

    await this.prisma.log.create({
      data: { action: 'LOGIN', message: 'User login successful', userId: user.id },
    });

    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }

  async refresh(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, isBanned: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.isBanned) {
      throw new ForbiddenException('Account suspended');
    }

    const token = await this.generateToken(user);
    await this.prisma.session.updateMany({
      where: { userId, expiresAt: { gt: new Date() } },
      data: { token },
    });

    return { token, role: user.role };
  }

  async logout(userId: string) {
    await this.prisma.session.deleteMany({ where: { userId } });
    await this.prisma.log.create({
      data: { action: 'LOGOUT', message: 'User logout', userId },
    });
  }

  private async generateToken(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.signAsync(payload, { expiresIn: '7d' });
  }
}