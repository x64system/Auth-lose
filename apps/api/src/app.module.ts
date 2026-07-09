import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { ProductsModule } from "./modules/products/products.module";
import { LicensesModule } from "./modules/licenses/licenses.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [AuthModule, ProductsModule, LicensesModule, UsersModule]
})
export class AppModule {}
