import type http from 'node:http';
import * as jose from 'jose';
import { Role } from '@ecco/platform-libs';

export type AuthContext = {
  roles: Role[];
  email?: string;
  sub?: string;
};

export async function verifyBearer(token: string): Promise<AuthContext> {
  const issuer = process.env.API_JWT_ISSUER || process.env.IDP_ISSUER || '';
  const audience = process.env.API_JWT_AUDIENCE || process.env.IDP_AUDIENCE || '';
  if (!issuer || !audience) throw new Error('jwt_config_missing');
  const jwks = jose.createRemoteJWKSet(new URL(`${issuer.replace(/\/$/, '')}/.well-known/jwks.json`));
  const { payload } = await jose.jwtVerify(token, jwks, { issuer, audience });
  const rolesClaim = (payload as any).roles || (payload as any)['x-roles'] || (payload as any).role;
  const roles: Role[] = Array.isArray(rolesClaim)
    ? rolesClaim
    : typeof rolesClaim === 'string'
    ? rolesClaim.split(',').map((s) => s.trim())
    : [];
  return {
    roles: roles.filter(Boolean) as Role[],
    email: (payload as any).email,
    sub: (payload as any).sub,
  };
}

export async function authFromRequest(req: http.IncomingMessage): Promise<AuthContext> {
  const demo = String(process.env.DEMO_AUTH || '1') === '1';
  const authz = req.headers['authorization'] as string | undefined;
  if (authz && authz.startsWith('Bearer ')) {
    try {
      return await verifyBearer(authz.slice('Bearer '.length));
    } catch (err) {
      if (!demo) throw err;
    }
  }
  // Demo fallback via x-roles header
  const hdr = (req.headers['x-roles'] as string | undefined) || '';
  const roles = hdr.split(',').map((s) => s.trim()).filter(Boolean) as Role[];
  return { roles: roles.length ? roles : (demo ? (['Admin'] as Role[]) : []) };
}

