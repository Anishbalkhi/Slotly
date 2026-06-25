const request = require('supertest');

// Mock environment variables before loading app
process.env.JWT_SECRET = 'test-secret-key-12345';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';
process.env.RESEND_API_KEY = 'test-key';

const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');

// Use in-memory MongoDB for tests or connect to a test database
const MONGO_TEST_URI = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/bookease_test';

beforeAll(async () => {
  try {
    await mongoose.connect(MONGO_TEST_URI);
  } catch (error) {
    console.log('Skipping DB-dependent tests: MongoDB not available');
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await User.deleteMany({});
    await mongoose.connection.close();
  }
});

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@bookease.com',
    password: 'password123',
    role: 'customer',
  };

  let authToken;

  describe('POST /api/auth/signup', () => {
    it('should create a new user and return JWT', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe(testUser.name);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.role).toBe('customer');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.passwordHash).toBeUndefined();

      authToken = res.body.data.token;
    });

    it('should reject duplicate email', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser)
        .expect(409);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('already registered');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'not-an-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'new@test.com', password: '123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject missing name', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'another@test.com', password: 'password123' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ ...testUser, email: 'role@test.com', role: 'admin' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.token).toBeDefined();
    });

    it('should reject wrong password', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent email', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/users/me', () => {
    it('should return user profile with valid token', async () => {
      if (mongoose.connection.readyState !== 1 || !authToken) return;

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalidtoken123')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/health', () => {
    it('should return health check', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('running');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });
});
