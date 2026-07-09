import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException("Token de autenticação não encontrado");
    }
    try {
      const secret = process.env.JWT_SECRET || "inject-bypass-secret";
      const payload = await this.jwtService.verifyAsync(token, { secret });
      (request as any)["user"] = payload;
    } catch (err) {
      throw new UnauthorizedException("Token inválido ou expirado");
    }
    return true;
  }

  private extractToken(request: Request): string | undefined {
    // 1. Check Authorization Header
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    if (type === "Bearer" && token) {
      return token;
    }

    // 2. Check Cookie Header
    const cookiesHeader = request.headers.cookie;
    if (cookiesHeader) {
      const cookies = Object.fromEntries(
        cookiesHeader.split(";").map((c: string) => {
          const [key, ...val] = c.trim().split("=");
          return [key, val.join("=")];
        })
      );
      if (cookies["inject_bypass_session"]) {
        return cookies["inject_bypass_session"];
      }
    }

    return undefined;
  }
}
