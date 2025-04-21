import jwt from 'jsonwebtoken';
import { config } from '../../src/config/env';
import { signAccessToken, verifyAccessToken } from '../../src/lib/tokens';


describe('access tokens', () => {
  it('round-trips a user id', () => {
    const token = signAccessToken({ userId: 'user-1' });
    expect(verifyAccessToken(token)).toEqual({ userId: 'user-1' });
  });

  it('carries an expiry claim', () => {
    const decoded = jwt.decode(signAccessToken({ userId: 'user-1' })) as jwt.JwtPayload;
    expect(typeof decoded.exp).toBe('number');
    expect(decoded.exp! - decoded.iat!).toBe(3600);
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ userId: 'user-1' }, config.jwtSecret, { expiresIn: '-1s' });
    expect(() => verifyAccessToken(expired)).toThrow(/Invalid or expired token/);
  });

  it('rejects a token signed with a different secret', () => {
    const forged = jwt.sign({ userId: 'user-1' }, 'not-the-real-secret');
    expect(() => verifyAccessToken(forged)).toThrow(/Invalid or expired token/);
  });

  it('rejects a well-signed token with no userId claim', () => {
    const malformed = jwt.sign({ sub: 'user-1' }, config.jwtSecret);
    expect(() => verifyAccessToken(malformed)).toThrow(/Malformed token/);
  });
});
