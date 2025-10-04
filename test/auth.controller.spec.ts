import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { SqliteTestingModule } from "./utils/db";
import { UsersModule } from "../src/users/users.module";
import { AuthModule } from "../src/auth/auth.module";
import { JwtService } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { Server } from "http";

const JWT_SECRET = "test-secret";

describe("AuthController (integration)", () => {
  let app: INestApplication;
  let jwtService: JwtService;
  const originalEnv = { ...process.env };

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        SqliteTestingModule(),
        UsersModule,
        AuthModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("v1");
    await app.init();

    jwtService = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    process.env = { ...originalEnv };
  });

  it("issues anonymous tokens bound to user ids", async () => {
    const server = app.getHttpServer() as Server;
    const response = await request(server)
      .post("/v1/auth/anonymous")
      .send({ locale: "en-US" });

    expect(response.status).toBe(201);
    const { token, userId } = response.body as {
      token: string;
      userId: string;
    };
    expect(typeof token).toBe("string");
    expect(typeof userId).toBe("string");

    const payload = await jwtService.verifyAsync(token);
    expect(payload.sub).toBe(userId);
    expect(payload.locale).toBe("en-US");
  });
});
