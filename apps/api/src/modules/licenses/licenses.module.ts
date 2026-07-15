import { Module } from "@nestjs/common";
import { LicensesController } from "./licenses.controller";
import { LicensesService } from "./licenses.service";
import { PrismaService } from "../../prisma/prisma.service";
import { SharedModule } from "../shared/shared.module";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Module({
  imports: [SharedModule],
  controllers: [LicensesController],
  providers: [LicensesService, PrismaService, JwtAuthGuard]
})
export class LicensesModule {}
