import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import bcrypt from 'bcryptjs';

describe('Auth Flow & Security Tests (Supertest API)', () => {
  const signupUser = {
    name: 'Test Signup User',
    email: `test_signup_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  const loginUser = {
    name: 'Test Login User',
    email: `test_login_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  let accessToken = '';
  let refreshTokenCookie = '';

  beforeAll(async () => {
    await User.deleteMany({ email: { $regex: /^test_/ } });
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /^test_/ } });
  });

  describe('1. Unauthenticated Signal Protection', () => {
    it('rejects unauthenticated requests to /api/market/:symbol/signal with 401', async () => {
      const res = await request(app).get('/api/market/RELIANCE.NS/signal');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects requests to protected /api/profile without token', async () => {
      const res = await request(app).get('/api/profile');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Signup Flow', () => {
    it('enforces minimum 8-character password in signup schema', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        name: 'Short Password',
        email: 'shortpass@example.com',
        password: 'short',
      });
      expect(res.status).toBe(400);
    });

    it('successfully registers a new user, hashes password with bcrypt cost 12, sets httpOnly cookie and returns access token', async () => {
      const res = await request(app).post('/api/auth/signup').send(signupUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toHaveProperty('email', signupUser.email.toLowerCase());

      accessToken = res.body.accessToken;

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refCookie).toBeDefined();
      expect(refCookie).toContain('HttpOnly');
      expect(refCookie).toMatch(/Path=(\/|\/api\/auth)/);

      refreshTokenCookie = refCookie.split(';')[0];

      const dbUser = await User.findOne({ email: signupUser.email.toLowerCase() });
      expect(dbUser).toBeDefined();
      expect(dbUser.passwordHash).not.toBe(signupUser.password);
      expect(dbUser.passwordHash.startsWith('$2a$12$') || dbUser.passwordHash.startsWith('$2b$12$')).toBe(true);
      expect(dbUser.sessions).toHaveLength(1);
    });
  });

  describe('3. Login Flow', () => {
    beforeAll(async () => {
      const passwordHash = bcrypt.hashSync(loginUser.password, 12);
      await User.create({
        name: loginUser.name,
        email: loginUser.email,
        passwordHash,
        onboardingDone: false,
      });
    });

    it('rejects invalid password with 401', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: loginUser.email,
        password: 'WrongPassword!',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('logs in successfully with valid credentials and sets session', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: loginUser.email,
        password: loginUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');

      accessToken = res.body.accessToken;

      const cookies = res.headers['set-cookie'];
      const refCookie = cookies.find((c) => c.startsWith('refreshToken='));
      refreshTokenCookie = refCookie.split(';')[0];
    });
  });

  describe('4. Token Rotation and Reuse Detection', () => {
    it('rotates refresh token on /api/auth/refresh and tolerates reuse within 15s grace window', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [refreshTokenCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('accessToken');

      const newCookies = res.headers['set-cookie'];
      const newRefCookie = newCookies.find((c) => c.startsWith('refreshToken='));
      expect(newRefCookie).toBeDefined();

      const oldRefreshTokenCookie = refreshTokenCookie;
      refreshTokenCookie = newRefCookie.split(';')[0];
      accessToken = res.body.accessToken;

      const graceRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [oldRefreshTokenCookie]);

      expect(graceRes.status).toBe(200);
      expect(graceRes.body.success).toBe(true);

      await User.updateOne(
        { email: loginUser.email.toLowerCase() },
        { $set: { 'sessions.$[].rotatedAt': new Date(Date.now() - 30 * 1000) } }
      );

      const reuseRes = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [oldRefreshTokenCookie]);

      expect(reuseRes.status).toBe(401);

      const dbUser = await User.findOne({ email: loginUser.email.toLowerCase() });
      expect(dbUser.sessions).toHaveLength(0);
    });
  });

  describe('5. Authenticated Signal Access', () => {
    it('allows access to protected routes with valid Bearer token', async () => {
      const loginRes = await request(app).post('/api/auth/login').send({
        email: loginUser.email,
        password: loginUser.password,
      });
      const validToken = loginRes.body.accessToken;

      const profileRes = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${validToken}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.success).toBe(true);
    });
  });
});
