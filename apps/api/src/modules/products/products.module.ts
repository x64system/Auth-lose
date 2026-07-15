import { Module } from "@nestjs/common";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService, JwtAuthGuard]
})
export class ProductsModule {}
