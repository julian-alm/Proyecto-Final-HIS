import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
const request = require('supertest');
import { AppModule } from './../src/app.module';

describe('EhrController (e2e)', () => {
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

  it('/ehr/:patientId (POST) -> Debe fallar (401) si no hay Token JWT', () => {
    return request(app.getHttpServer())
      .post('/ehr/12345')
      .send()
      .expect(401); 
  });

  it('/ehr/:patientId/progress-notes (POST) -> Debe pedir autenticación', () => {
    return request(app.getHttpServer())
      .post('/ehr/12345/progress-notes')
      .send({
        note: 'Prueba de evolución médica sin token'
      })
      .expect(401);
  });
});