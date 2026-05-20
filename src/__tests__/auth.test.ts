import { signToken, verifyToken } from '@/lib/auth';

describe('signToken', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-for-jest-only';
  });

  it('returns a non-empty string', () => {
    const token = signToken({ userId: 1, username: 'remco', role: 'admin' });
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('contains three dot-separated parts (JWT format)', () => {
    const token = signToken({ userId: 1, username: 'remco', role: 'admin' });
    expect(token.split('.').length).toBe(3);
  });
});

describe('verifyToken', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-for-jest-only';
  });

  it('returns payload for a valid token', () => {
    const token = signToken({ userId: 42, username: 'alice', role: 'user' });
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(42);
    expect(payload?.username).toBe('alice');
    expect(payload?.role).toBe('user');
  });

  it('returns null for an invalid token', () => {
    const result = verifyToken('not.a.valid.token');
    expect(result).toBeNull();
  });

  it('returns null for a tampered token', () => {
    const token = signToken({ userId: 1, username: 'remco', role: 'admin' });
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(verifyToken(tampered)).toBeNull();
  });
});
