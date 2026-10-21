import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../src/app.module';

describe('NursingCareController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/nursing-care/vital-signs (POST) -> Debe fallar (401) si no hay Token JWT', () => {
    return request(app.getHttpServer())
      .post('/nursing-care/vital-signs')
      .send({
        patientId: '12345',
        temperature: 36.5,
        bloodPressure: '120/80',
        heartRate: 75
      })
      .expect(401); 
  });

  it('/nursing-care/vital-signs/:patientId (GET) -> Debe pedir autenticación', () => {
    return request(app.getHttpServer())
      .get('/nursing-care/vital-signs/12345')
      .expect(401);
  });
});