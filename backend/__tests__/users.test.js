const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const app = require('../server');

describe('User Routes', () => {
  let token;
  let testUser;

  beforeEach(async () => {
    // Create a test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      accountType: 'individual',
      isVerified: true
    });

    // Generate JWT token
    token = jwt.sign(
      { id: testUser._id },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/users/me', () => {
    it('should get current user information', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('username', 'testuser');
      expect(res.body).toHaveProperty('email', 'test@example.com');
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/users/me');

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should update user information', async () => {
      const updateData = {
        username: 'updateduser',
        email: 'updated@example.com'
      };

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('username', 'updateduser');
      expect(res.body).toHaveProperty('email', 'updated@example.com');
    });

    it('should not allow duplicate username', async () => {
      // Create another user
      await User.create({
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123',
        accountType: 'individual'
      });

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'existinguser' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Username already taken');
    });
  });

  describe('GET /api/users/search', () => {
    it('should search users by criteria', async () => {
      // Create additional test users
      await User.create({
        username: 'searchuser1',
        email: 'search1@example.com',
        password: 'password123',
        accountType: 'individual'
      });

      await User.create({
        username: 'searchuser2',
        email: 'search2@example.com',
        password: 'password123',
        accountType: 'couple'
      });

      const res = await request(app)
        .get('/api/users/search?query=search&accountType=individual')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]).toHaveProperty('username', 'searchuser1');
    });
  });

  describe('DELETE /api/users/me', () => {
    it('should delete user account', async () => {
      const res = await request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'User account deleted successfully');

      // Verify user is deleted
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });
  });
}); 