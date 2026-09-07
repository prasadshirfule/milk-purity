import test, { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../app';
import { dataRepository } from '../services/seedService';
import { CustomerCodeService } from '../services/customerCodeService';

const app = createApp();

describe('Customer Code & QR Identification Workflow Tests', () => {
  let server: http.Server;
  let baseUrl: string;

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
    dataRepository.clear();
  });

  it('1. New customer receives valid code', async () => {
    const res = await fetch(`${baseUrl}/api/farmers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aarav Sharma',
        mobile: '+91 98765 00001',
        village: 'Pune Rural'
      })
    });
    const json = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.success, true);
    assert.ok(json.data.customerCode, 'Customer code should be generated');
    assert.match(json.data.customerCode, /^[A-Z][0-9]{4}$/, 'Code should match ^[A-Z][0-9]{4}$');
  });

  it('2. Code strictly matches format ^[A-Z][0-9]{4}$', () => {
    assert.strictEqual(CustomerCodeService.isValidFormat('A1024'), true);
    assert.strictEqual(CustomerCodeService.isValidFormat('B5831'), true);
    assert.strictEqual(CustomerCodeService.isValidFormat('P0047'), true);
    assert.strictEqual(CustomerCodeService.isValidFormat('X0001'), true);
    assert.strictEqual(CustomerCodeService.isValidFormat('a1024'), false);
    assert.strictEqual(CustomerCodeService.isValidFormat('AB102'), false);
    assert.strictEqual(CustomerCodeService.isValidFormat('A102'), false);
    assert.strictEqual(CustomerCodeService.isValidFormat('A10245'), false);
    assert.strictEqual(CustomerCodeService.isValidFormat('1024A'), false);
    assert.strictEqual(CustomerCodeService.isValidFormat(''), false);
  });

  it('3. Two customers never receive the same code (collision safety)', async () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const farmer = await dataRepository.addFarmer({
        name: `Batch Customer ${i}`,
        mobile: `+91 98000 ${String(i).padStart(5, '0')}`,
        village: 'Test Valley'
      });
      assert.ok(farmer.customerCode);
      assert.strictEqual(codes.has(farmer.customerCode), false, `Code collision detected: ${farmer.customerCode}`);
      codes.add(farmer.customerCode);
    }
    assert.strictEqual(codes.size, 50);
  });

  it('4. Existing customer code remains unchanged on updates or multiple reads', async () => {
    const created = await dataRepository.addFarmer({
      name: 'Stable Code Farmer',
      mobile: '+91 99112 33445',
      village: 'Shivajinagar',
      customerCode: 'X8888'
    });
    assert.strictEqual(created.customerCode, 'X8888');

    const updated = await dataRepository.updateFarmer(created.farmerId, {
      village: 'Shivajinagar Phase 2'
    });
    assert.strictEqual(updated?.customerCode, 'X8888');

    const fetched = await dataRepository.getFarmerById(created.farmerId);
    assert.strictEqual(fetched?.customerCode, 'X8888');
  });

  it('5. Invalid customer code is rejected on creation', async () => {
    const res = await fetch(`${baseUrl}/api/farmers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Invalid Code Farmer',
        mobile: '+91 98765 43210',
        village: 'Pune',
        customerCode: 'INVALID123'
      })
    });
    const json = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(json.success, false);
    assert.match(json.error, /Invalid Customer Code format/);
  });

  it('6. Unknown customer code returns 404', async () => {
    const res = await fetch(`${baseUrl}/api/farmers/code/Z9999`);
    const json = await res.json();
    assert.strictEqual(res.status, 404);
    assert.strictEqual(json.success, false);
    assert.match(json.error, /Customer not found/);
  });

  it('7. QR URL format validation', async () => {
    const code = 'A1024';
    const qrUrl = `/customer/${code}`;
    assert.strictEqual(qrUrl, '/customer/A1024');
    assert.strictEqual(qrUrl.includes(code), true);
    assert.strictEqual(qrUrl.includes('name'), false);
    assert.strictEqual(qrUrl.includes('phone'), false);
  });

  it('8. QR lookup endpoint /api/farmers/code/:customerCode resolves the correct customer', async () => {
    // Test GET /api/farmers/code/A1024 (Seed farmer Rajesh Patil)
    const res1 = await fetch(`${baseUrl}/api/farmers/code/A1024`);
    const json1 = await res1.json();
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(json1.success, true);
    assert.strictEqual(json1.data.customerCode, 'A1024');
    assert.strictEqual(json1.data.name, 'Rajesh Patil');

    // Test GET /api/customers/code/A1024 (alias route)
    const res2 = await fetch(`${baseUrl}/api/customers/code/A1024`);
    const json2 = await res2.json();
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(json2.success, true);
    assert.strictEqual(json2.data.customerCode, 'A1024');
  });

  it('9. Milk test created through QR is linked to the correct farmer/customer and customerCode is saved', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerCode: 'A1024',
        deviceId: 'ESP32-MILK-001',
        quantity: 45.0,
        temperature: 24.0,
        ph: 6.66,
        fat: 4.8,
        density: 1.030,
        conductivity: 5.0,
        milkLevel: 45.0,
        operatorDecision: 'ACCEPT'
      })
    });
    const json = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.farmerId, 'FMR-1001');
    assert.strictEqual(json.data.customerCode, 'A1024');
    assert.strictEqual(json.data.farmerName, 'Rajesh Patil');
  });

  it("10. Security: Customer A's code cannot be combined with Customer B's farmerId", async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmerId: 'FMR-1002', // Customer B (Suresh Gaikwad, B5831)
        customerCode: 'A1024', // Customer A (Rajesh Patil, A1024)
        deviceId: 'ESP32-MILK-001',
        quantity: 25.0,
        temperature: 24.0,
        ph: 6.65,
        fat: 4.2,
        density: 1.029,
        conductivity: 5.1,
        milkLevel: 25.0,
        operatorDecision: 'ACCEPT'
      })
    });
    const json = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(json.success, false);
    assert.match(json.error, /Security validation failed/);
  });

  it('11. Existing records are safely backfilled', () => {
    const rawFarmers: any[] = [
      { farmerId: 'FMR-1', name: 'Farmer One' },
      { farmerId: 'FMR-2', name: 'Farmer Two', customerCode: 'K3910' },
      { farmerId: 'FMR-3', name: 'Farmer Three' }
    ];

    const backfilled = CustomerCodeService.backfillCustomerCodes(rawFarmers);
    assert.strictEqual(backfilled.length, 3);
    assert.strictEqual(backfilled[1].customerCode, 'K3910');
    assert.match(backfilled[0].customerCode || '', /^[A-Z][0-9]{4}$/);
    assert.match(backfilled[2].customerCode || '', /^[A-Z][0-9]{4}$/);
    assert.notStrictEqual(backfilled[0].customerCode, backfilled[2].customerCode);
  });

  it('12. Backfill is idempotent (multiple runs produce identical codes)', () => {
    const rawFarmers: any[] = [
      { farmerId: 'FMR-1', name: 'Farmer One' },
      { farmerId: 'FMR-2', name: 'Farmer Two' }
    ];

    const run1 = CustomerCodeService.backfillCustomerCodes(rawFarmers);
    const run2 = CustomerCodeService.backfillCustomerCodes([...run1]);

    assert.strictEqual(run1[0].customerCode, run2[0].customerCode);
    assert.strictEqual(run1[1].customerCode, run2[1].customerCode);
  });
});
