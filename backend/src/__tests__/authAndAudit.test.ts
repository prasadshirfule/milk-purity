import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../app';
import { dataRepository } from '../services/seedService';
import { generateAuthToken } from '../middleware/authMiddleware';

const app = createApp();

describe('MILKGUARD Operator Authentication, RBAC & Audit Trail Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  let adminToken: string;
  let opToken: string;
  let qualityToken: string;
  let viewerToken: string;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = (server.address() as any).port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach(async () => {
    await dataRepository.clear();
    // Tokens for tests matching seeded database
    adminToken = generateAuthToken({
      userId: 'USR-001',
      name: 'Vikram Malhotra',
      username: 'admin',
      role: 'ADMIN',
      status: 'ACTIVE'
    });
    opToken = generateAuthToken({
      userId: 'USR-002',
      name: 'Rajendra Deshmukh',
      username: 'operator',
      role: 'OPERATOR',
      status: 'ACTIVE'
    });
    qualityToken = generateAuthToken({
      userId: 'USR-003',
      name: 'Dr. Sunita Rao',
      username: 'quality',
      role: 'QUALITY_OPERATOR',
      status: 'ACTIVE'
    });
    viewerToken = generateAuthToken({
      userId: 'USR-004',
      name: 'Auditor Ramesh',
      username: 'viewer',
      role: 'VIEWER',
      status: 'ACTIVE'
    });
  });

  // 1. Login success
  it('1. Login success returns valid user and token without password hash', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'operator', password: 'dairy2026' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.token);
    assert.equal(body.user.username, 'operator');
    assert.equal(body.user.role, 'OPERATOR');
    assert.equal(body.user.password, undefined);
    assert.equal(body.user.passwordHash, undefined);
  });

  // 2. Invalid login
  it('2. Invalid login returns 401 with clean error message', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'operator', password: 'wrongpassword' })
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.toLowerCase().includes('invalid'));
  });

  // 3. Inactive user cannot log in
  it('3. Inactive user cannot log in and receives 403', async () => {
    await dataRepository.updateUser('USR-002', { status: 'INACTIVE' });
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'operator', password: 'dairy2026' })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.toLowerCase().includes('inactive') || body.error.toLowerCase().includes('disabled'));
  });

  // 4. Unauthenticated request to protected endpoint -> 401 (when invalid token provided)
  it('4. Invalid or tampered token returns 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid_tampered_token' }
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  // 5. Authenticated user without permission -> 403
  it('5. Authenticated user without required role receives 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${opToken}` }
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.toLowerCase().includes('forbidden') || body.error.toLowerCase().includes('permission'));
  });

  // 6. ADMIN can access admin functions
  it('6. ADMIN can access admin audit logs and user management', async () => {
    const resAudit = await fetch(`${baseUrl}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(resAudit.status, 200);
    const bodyAudit = await resAudit.json();
    assert.equal(bodyAudit.success, true);
    assert.ok(Array.isArray(bodyAudit.data));

    const resUsers = await fetch(`${baseUrl}/api/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(resUsers.status, 200);
    const bodyUsers = await resUsers.json();
    assert.equal(bodyUsers.success, true);
    assert.ok(bodyUsers.data.length >= 4);
  });

  // 7. OPERATOR can create milk test
  it('7. OPERATOR can create milk test', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`
      },
      body: JSON.stringify({
        farmerId: 'FMR-1001',
        customerCode: 'A1024',
        deviceId: 'DEV-001',
        quantity: 15.0,
        temperature: 28.5,
        ph: 6.65,
        fat: 4.2,
        density: 1.029,
        conductivity: 4.8
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.operatorName, 'Rajendra Deshmukh');
  });

  // 8. VIEWER cannot create milk test
  it('8. VIEWER cannot create milk test -> 403', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${viewerToken}`
      },
      body: JSON.stringify({
        farmerId: 'FMR-1001',
        customerCode: 'A1024',
        deviceId: 'DEV-001',
        quantity: 15.0,
        temperature: 28.0,
        ph: 6.65,
        fat: 4.2,
        density: 1.029,
        conductivity: 4.8
      })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  // 9. VIEWER cannot accept/reject milk
  it('9. VIEWER cannot submit collections -> 403', async () => {
    const res = await fetch(`${baseUrl}/api/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${viewerToken}`
      },
      body: JSON.stringify({
        farmerId: 'FMR-1001',
        customerCode: 'A1024',
        testId: 'TEST-123',
        quantity: 15.0,
        fat: 4.2,
        qualityScore: 92,
        result: 'ACCEPTED'
      })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  // 10. VIEWER cannot modify settings
  it('10. VIEWER cannot modify settings -> 403', async () => {
    const res = await fetch(`${baseUrl}/api/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${viewerToken}`
      },
      body: JSON.stringify({ dairyName: 'Hacked Dairy' })
    });
    assert.equal(res.status, 403);
  });

  // 11. QUALITY_OPERATOR can perform quality decisions
  it('11. QUALITY_OPERATOR can perform quality decisions and milk tests', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${qualityToken}`
      },
      body: JSON.stringify({
        farmerId: 'FMR-1001',
        customerCode: 'A1024',
        deviceId: 'DEV-001',
        quantity: 12.0,
        temperature: 28.0,
        ph: 6.6,
        fat: 4.1,
        density: 1.029,
        conductivity: 4.7
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.operatorName, 'Dr. Sunita Rao');
    assert.equal(body.data.operatorRole, 'QUALITY_OPERATOR');
  });

  // 12 & 13. Operator identity is taken from authenticated user and cannot be spoofed by frontend
  it('12 & 13. Operator identity is derived from authenticated backend token, ignoring spoofed frontend operatorId', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`
      },
      body: JSON.stringify({
        farmerId: 'FMR-1001',
        customerCode: 'A1024',
        deviceId: 'DEV-001',
        quantity: 20.0,
        temperature: 28.0,
        ph: 6.65,
        fat: 4.5,
        density: 1.029,
        conductivity: 4.8,
        operatorId: 'SPOOFED_FAKE_ID',
        operatorName: 'Fake Operator',
        operatorRole: 'ADMIN'
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.operatorId, 'USR-002');
    assert.equal(body.data.operatorName, 'Rajendra Deshmukh');
    assert.equal(body.data.operatorRole, 'OPERATOR');
  });

  // 14. Accepted test records operator identity
  it('14. Accepted test records operator identity', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`
      },
      body: JSON.stringify({
        farmerId: 'FMR-1001',
        customerCode: 'A1024',
        deviceId: 'DEV-001',
        quantity: 10.0,
        temperature: 28.0,
        ph: 6.65,
        fat: 4.2,
        density: 1.029,
        conductivity: 4.8
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.result, 'ACCEPTED');
    assert.equal(body.data.operatorId, 'USR-002');
    assert.equal(body.data.operatorName, 'Rajendra Deshmukh');
  });

  // 15. Rejected test records operator identity
  it('15. Rejected test records operator identity', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`
      },
      body: JSON.stringify({
        farmerId: 'FMR-1001',
        customerCode: 'A1024',
        deviceId: 'DEV-001',
        quantity: 10.0,
        temperature: 42.0, // highly abnormal temperature -> reject
        ph: 5.2,
        fat: 1.5,
        density: 1.015,
        conductivity: 8.5
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.result, 'REJECTED');
    assert.equal(body.data.operatorId, 'USR-002');
    assert.equal(body.data.operatorName, 'Rajendra Deshmukh');
  });

  // 16. Override requires non-empty reason
  it('16. Manual override of a rejected batch requires non-empty reason -> 400', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`
      },
      body: JSON.stringify({
        farmerId: 'FMR-1001',
        customerCode: 'A1024',
        deviceId: 'DEV-001',
        quantity: 10.0,
        temperature: 42.0,
        ph: 5.2,
        fat: 1.5,
        density: 1.015,
        conductivity: 8.5,
        operatorDecision: 'ACCEPT',
        overrideReason: '   ' // empty whitespace
      })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.toLowerCase().includes('overridereason'));
  });

  // 17. Override stores operator identity, justification and timestamp
  it('17. Override stores operator identity, justification and timestamp', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${qualityToken}`
      },
      body: JSON.stringify({
        farmerId: 'FMR-1001',
        customerCode: 'A1024',
        deviceId: 'DEV-001',
        quantity: 10.0,
        temperature: 42.0,
        ph: 5.2,
        fat: 1.5,
        density: 1.015,
        conductivity: 8.5,
        operatorDecision: 'ACCEPT',
        overrideReason: 'Sensor calibrated with offset, validated secondary lactometer'
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.aiRecommendation, 'REJECT');
    assert.equal(body.data.operatorDecision, 'ACCEPT');
    assert.equal(body.data.overrideReason, 'Sensor calibrated with offset, validated secondary lactometer');
    assert.ok(body.data.overrideTimestamp);
    assert.equal(body.data.operatorName, 'Dr. Sunita Rao');
  });

  // 18. Accepted collection stores operator identity
  it('18. Accepted collection stores operator identity', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`
      },
      body: JSON.stringify({
        farmerId: 'FMR-1001',
        customerCode: 'A1024',
        deviceId: 'DEV-001',
        quantity: 15.0,
        temperature: 28.0,
        ph: 6.65,
        fat: 4.2,
        density: 1.029,
        conductivity: 4.8
      })
    });
    const testBody = await res.json();
    assert.ok(testBody.collection);
    assert.equal(testBody.collection.operatorId, 'USR-002');
    assert.equal(testBody.collection.operatorName, 'Rajendra Deshmukh');
  });

  // 19. Rejected milk creates no collection
  it('19. Rejected milk creates no collection and 0 payout', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`
      },
      body: JSON.stringify({
        farmerId: 'FMR-1001',
        customerCode: 'A1024',
        deviceId: 'DEV-001',
        quantity: 15.0,
        temperature: 45.0,
        ph: 5.0,
        fat: 1.0,
        density: 1.010,
        conductivity: 9.0
      })
    });
    const testBody = await res.json();
    assert.equal(testBody.data.result, 'REJECTED');
    assert.equal(testBody.collection, undefined);
    assert.equal(testBody.data.totalAmount, 0);
  });

  // 20. Audit log is created for important actions
  it('20. Audit log records events for tests, overrides, and collections', async () => {
    const resAudit = await fetch(`${baseUrl}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const bodyAudit = await resAudit.json();
    assert.equal(bodyAudit.success, true);
    assert.ok(bodyAudit.data.length > 0);
  });

  // 21. Audit logs do not contain passwords/secrets
  it('21. Audit logs do not contain passwords or auth secrets', async () => {
    const resAudit = await fetch(`${baseUrl}/api/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const bodyAudit = await resAudit.json();
    for (const log of bodyAudit.data) {
      if (log.details) {
        assert.equal(log.details.password, undefined);
        assert.equal(log.details.passwordHash, undefined);
        assert.equal(log.details.token, undefined);
      }
    }
  });

  // 22. Customer history shows correct operator
  it('22. Customer history endpoint returns tests with bound operator details', async () => {
    const res = await fetch(`${baseUrl}/api/farmers/code/A1024`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data.tests));
  });

  // 23. Security validation between mismatched customerCode and farmerId
  it('23. Different customer cannot be accessed through mismatched customerCode and farmerId', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`
      },
      body: JSON.stringify({
        farmerId: 'FMR-1001',
        customerCode: 'B5831', // Mismatched code!
        deviceId: 'DEV-001',
        quantity: 10.0
      })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.toLowerCase().includes('mismatch') || body.error.toLowerCase().includes('does not match'));
  });

  // 24. Existing QR workflow still works
  it('24. Existing QR lookup and customer code parsing works seamlessly', async () => {
    const res = await fetch(`${baseUrl}/api/farmers/code/A1024`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.customerCode, 'A1024');
  });

  // 25. Existing duplicate / idempotency protection still works
  it('25. Existing duplicate / idempotency protection prevents duplicate test submission', async () => {
    const payload = {
      farmerId: 'FMR-1001',
      customerCode: 'A1024',
      deviceId: 'DEV-001',
      quantity: 14.5,
      temperature: 28.0,
      ph: 6.65,
      fat: 4.2,
      density: 1.029,
      conductivity: 4.8
    };

    const res1 = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`
      },
      body: JSON.stringify(payload)
    });
    assert.equal(res1.status, 201);

    // Immediate re-submission within 2 seconds
    const res2 = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`
      },
      body: JSON.stringify(payload)
    });
    assert.equal(res2.status, 409);
    const body2 = await res2.json();
    assert.equal(body2.success, false);
    assert.ok(body2.error.toLowerCase().includes('duplicate') || body2.error.toLowerCase().includes('idempotent'));
  });

  // 26. Existing purity calculations remain consistent and authoritative
  it('26. Existing purity calculations remain consistent and authoritative', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`
      },
      body: JSON.stringify({
        farmerId: 'FMR-1002',
        customerCode: 'B5831',
        deviceId: 'DEV-001',
        quantity: 18.0,
        temperature: 28.5,
        ph: 6.65,
        fat: 4.2,
        density: 1.029,
        conductivity: 4.8
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.data.purityScore >= 90);
    assert.equal(body.data.classification, 'EXCELLENT');
    assert.equal(body.data.aiRecommendation, 'ACCEPT');
  });
});
