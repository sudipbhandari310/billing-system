import mongoose from 'mongoose';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test_secret_for_jest';
process.env.MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/billing_system_test';

const { default: app } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');

let adminToken;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteMany({});
  await User.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'AdminPass123',
    role: 'admin',
  });
  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email: 'admin@test.com',
    password: 'AdminPass123',
  });
  adminToken = loginRes.body.data.token;
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth API', () => {
  test('rejects missing fields on register', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('registers, logs in and fetches /me', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Staff',
        email: 'tester@example.com',
        password: 'TestPass123',
        role: 'staff',
      });
    expect(reg.status).toBe(201);
    expect(reg.body.data.token).toBeDefined();

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'tester@example.com',
      password: 'TestPass123',
    });
    expect(login.status).toBe(200);
    expect(login.body.data.token).toBeDefined();

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.data.token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('tester@example.com');
  });

  test('rejects /me without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});