import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createTestContext, type TestContext } from '../helpers/test-app.js';
import { loginUser, registerUser, uniqueUser } from '../helpers/auth.js';

describe('authentication and sessions', () => {
  let context: TestContext;

  beforeAll(async () => {
    context = await createTestContext({ seed: true });
  });

  afterAll(async () => {
    await context.close();
  });

  it('registers a user, sets an HttpOnly session cookie, and returns the profile', async () => {
    const { user, agent, response } = await registerUser(context.app);

    expect(response.status).toBe(201);
    expect(response.body.data.user.email).toBe(user.email);
    expect(response.body.data.user.role).toBe('User');
    expect(response.body.data.user).not.toHaveProperty('passwordHash');

    const setCookie = response.headers['set-cookie'] as unknown as string[];
    expect(setCookie.some((cookie) => cookie.startsWith('loqta_session='))).toBe(true);
    expect(setCookie.some((cookie) => cookie.includes('HttpOnly'))).toBe(true);

    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(user.email);

    const usersMe = await agent.get('/api/v1/users/me');
    expect(usersMe.status).toBe(200);
    expect(usersMe.body.data.id).toBe(response.body.data.user.id);
  });

  it('rejects duplicate registration and invalid payloads', async () => {
    const { user } = await registerUser(context.app);

    const duplicate = await request(context.app)
      .post('/api/v1/auth/register')
      .send({ ...user, fullName: 'Another Name' });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('CONFLICT');

    const invalid = await request(context.app)
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short', fullName: 'A' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(invalid.body.error.details)).toBe(true);
  });

  it('logs in the seeded administrator and customer', async () => {
    const admin = await loginUser(context.app, {
      email: 'admin@loqta.dev',
      password: 'Admin123!',
      fullName: 'Admin',
    });
    expect(admin.response.status).toBe(200);
    expect(admin.response.body.data.user.role).toBe('Admin');

    const customer = await loginUser(context.app, {
      email: 'user@loqta.dev',
      password: 'User123!',
      fullName: 'Customer',
    });
    expect(customer.response.status).toBe(200);
    expect(customer.response.body.data.user.role).toBe('User');
  });

  it('uses a generic error for wrong credentials and rejects missing sessions', async () => {
    const user = uniqueUser();
    await registerUser(context.app, user);

    const wrongPassword = await request(context.app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'WrongPassword123!' });
    expect(wrongPassword.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe('Invalid email or password');

    const anonymous = await request(context.app).get('/api/v1/auth/me');
    expect(anonymous.status).toBe(401);
  });

  it('logs out and invalidates the cookie session', async () => {
    const { agent } = await registerUser(context.app);

    const logout = await agent.post('/api/v1/auth/logout');
    expect(logout.status).toBe(204);

    const me = await agent.get('/api/v1/auth/me');
    expect(me.status).toBe(401);
  });

  it('updates the profile and validates the payload', async () => {
    const { agent } = await registerUser(context.app);

    const update = await agent
      .patch('/api/v1/users/me')
      .send({ fullName: 'Updated Name', phone: '+1 (555) 010-2000' });
    expect(update.status).toBe(200);
    expect(update.body.data.fullName).toBe('Updated Name');
    expect(update.body.data.phone).toBe('+1 (555) 010-2000');

    const invalid = await agent.patch('/api/v1/users/me').send({ fullName: 'A' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('changes the password and revokes other sessions', async () => {
    const { user, agent } = await registerUser(context.app);
    const second = await loginUser(context.app, user);

    const change = await agent.put('/api/v1/users/me/password').send({
      currentPassword: user.password,
      newPassword: 'NewPassword123!',
    });
    expect(change.status).toBe(200);

    const otherSession = await second.agent.get('/api/v1/auth/me');
    expect(otherSession.status).toBe(401);

    const currentSession = await agent.get('/api/v1/auth/me');
    expect(currentSession.status).toBe(200);

    const oldLogin = await loginUser(context.app, user);
    expect(oldLogin.response.status).toBe(401);

    const newLogin = await loginUser(context.app, {
      ...user,
      password: 'NewPassword123!',
    });
    expect(newLogin.response.status).toBe(200);
  });

  it('supports password reset with a single-use token', async () => {
    const { user, agent } = await registerUser(context.app);

    const forgot = await request(context.app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: user.email });
    expect(forgot.status).toBe(202);
    const resetToken = forgot.body.data.resetToken as string;
    expect(typeof resetToken).toBe('string');

    const reset = await request(context.app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, newPassword: 'ResetPassword123!' });
    expect(reset.status).toBe(200);

    const sessionAfterReset = await agent.get('/api/v1/auth/me');
    expect(sessionAfterReset.status).toBe(401);

    const reused = await request(context.app)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetToken, newPassword: 'AnotherPassword123!' });
    expect(reused.status).toBe(400);

    const login = await loginUser(context.app, {
      ...user,
      password: 'ResetPassword123!',
    });
    expect(login.response.status).toBe(200);
  });

  it('allows only one concurrent reset with the same token', async () => {
    const { user } = await registerUser(context.app);

    const forgot = await request(context.app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: user.email });
    expect(forgot.status).toBe(202);
    const resetToken = forgot.body.data.resetToken as string;

    const attempts = await Promise.all([
      request(context.app)
        .post('/api/v1/auth/reset-password')
        .send({ token: resetToken, newPassword: 'ConcurrentReset123!' }),
      request(context.app)
        .post('/api/v1/auth/reset-password')
        .send({ token: resetToken, newPassword: 'ConcurrentReset456!' }),
    ]);

    expect(attempts.map((attempt) => attempt.status).sort()).toEqual([200, 400]);
    const login = await loginUser(context.app, {
      ...user,
      password: attempts[0].status === 200 ? 'ConcurrentReset123!' : 'ConcurrentReset456!',
    });
    expect(login.response.status).toBe(200);
  });

  it('lists sessions and revokes another session', async () => {
    const { user, agent } = await registerUser(context.app);
    const second = await loginUser(context.app, user);
    expect(second.response.status).toBe(200);

    const list = await agent.get('/api/v1/auth/sessions');
    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThanOrEqual(2);
    expect(list.body.data.filter((session: { current: boolean }) => session.current)).toHaveLength(
      1,
    );

    const other = list.body.data.find((session: { current: boolean }) => !session.current) as {
      id: string;
    };
    const revoke = await agent.delete(`/api/v1/auth/sessions/${other.id}`);
    expect(revoke.status).toBe(204);

    const revoked = await second.agent.get('/api/v1/auth/me');
    expect(revoked.status).toBe(401);
  });
});
