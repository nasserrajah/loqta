import type { Express } from 'express';
import request from 'supertest';

export interface TestUser {
  email: string;
  password: string;
  fullName: string;
}

let userSequence = 0;

export function uniqueUser(overrides: Partial<TestUser> = {}): TestUser {
  userSequence += 1;
  return {
    email: `user${userSequence}@example.test`,
    password: 'Password123!',
    fullName: `Test User ${userSequence}`,
    ...overrides,
  };
}

export async function registerUser(app: Express, overrides: Partial<TestUser> = {}) {
  const user = uniqueUser(overrides);
  const agent = request.agent(app);
  const response = await agent.post('/api/v1/auth/register').send(user);
  return { user, agent, response };
}

export async function loginUser(app: Express, user: TestUser) {
  const agent = request.agent(app);
  const response = await agent.post('/api/v1/auth/login').send({
    email: user.email,
    password: user.password,
  });
  return { agent, response };
}
