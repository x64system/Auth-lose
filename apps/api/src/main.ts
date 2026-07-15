import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS so the site (login.html and admin.html on any dev port) can communicate with NestJS
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') || origin === process.env.APP_URL) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true
  });

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  const config = new DocumentBuilder()
    .setTitle("Inject Bypass API")
    .setDescription("NestJS API for licensing platform")
    .setVersion("1.0.0")
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);
  
  await app.listen(4000);
}

bootstrap();
