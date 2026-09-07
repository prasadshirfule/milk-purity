import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../app';
import { dataRepository } from '../services/seedService';

const app = createApp();

describe('Customer History, Ledger, Duplicate Protection & Data Consistency Suite', () => {
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
    await dataRepository.clear();
  });

  // 1. Valid customer dashboard lookup
  it('1. Valid customer lookup by customerCode returns correct customer profile', async () => {
    const res = await fetch(`${baseUrl}/api/farmers/code/A1024`);
    assert.equal(res.status, 200);
    const body = await res.json();

    assert.equal(body.success, true);
    assert.equal(body.data.customerCode, 'A1024');
    assert.equal(body.data.farmerId, 'FMR-1001');
    assert.equal(body.data.name, 'Rajesh Patil');
    assert.ok(Array.isArray(body.data.tests));
  });

  // 2. Invalid customer code -> 404
  it('2. Invalid or unknown customer code returns 404 or 400', async () => {
    const res404 = await fetch(`${baseUrl}/api/farmers/code/Z9999`);
    assert.equal(res404.status, 404);
    const body404 = await res404.json();
    assert.equal(body404.success, false);

    const res400 = await fetch(`${baseUrl}/api/farmers/code/invalid-code`);
    assert.equal(res400.status, 400);
    const body400 = await res400.json();
    assert.equal(body400.success, false);
  });

  // 3. Customer code belongs to correct farmerId
  it('3. Customer code strictly links to the correct farmerId', async () => {
    const resA = await (await fetch(`${baseUrl}/api/farmers/code/A1024`)).json();
    const resB = await (await fetch(`${baseUrl}/api/farmers/code/B5831`)).json();
    const resP = await (await fetch(`${baseUrl}/api/farmers/code/P0047`)).json();

    assert.equal(resA.data.farmerId, 'FMR-1001');
    assert.equal(resB.data.farmerId, 'FMR-1002');
    assert.equal(resP.data.farmerId, 'FMR-1003');
  });

  // 4. Accepted milk test creates exactly one collection
  it('4. Accepted milk test creates exactly one collection record', async () => {
    const initialColsRes = await (await fetch(`${baseUrl}/api/collections?customerCode=A1024`)).json();
    const initialCount = initialColsRes.count;

    const testRes = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerCode: 'A1024',
        farmerId: 'FMR-1001',
        deviceId: 'ESP32-MILK-001',
        quantity: 25.0,
        temperature: 24.0,
        ph: 6.65,
        fat: 4.8,
        density: 1.030,
        conductivity: 4.8,
        milkLevel: 25.0,
        operatorDecision: 'ACCEPT'
      })
    });

    assert.equal(testRes.status, 201);
    const body = await testRes.json();
    assert.equal(body.success, true);
    assert.equal(body.data.result, 'ACCEPTED');
    assert.ok(body.collection);
    assert.equal(body.collection.customerCode, 'A1024');

    const updatedColsRes = await (await fetch(`${baseUrl}/api/collections?customerCode=A1024`)).json();
    assert.equal(updatedColsRes.count, initialCount + 1);
  });

  // 5. Collection stores the same customerCode, farmerId, testId, quantity, totalAmount
  it('5. Collection record stores identical customerCode, farmerId, testId, quantity, and totalAmount as test', async () => {
    const testRes = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerCode: 'B5831',
        farmerId: 'FMR-1002',
        deviceId: 'ESP32-MILK-001',
        quantity: 30.0,
        temperature: 23.5,
        ph: 6.68,
        fat: 4.5,
        density: 1.029,
        conductivity: 4.6,
        milkLevel: 30.0,
        operatorDecision: 'ACCEPT'
      })
    });

    assert.equal(testRes.status, 201);
    const body = await testRes.json();
    const testData = body.data;
    const colData = body.collection;

    assert.ok(colData);
    assert.equal(colData.customerCode, testData.customerCode);
    assert.equal(colData.farmerId, testData.farmerId);
    assert.equal(colData.testId, testData.testId);
    assert.equal(colData.quantity, testData.quantity);
    assert.equal(colData.totalAmount, testData.totalAmount);
    assert.equal(colData.rate, testData.ratePerLiter);
  });

  // 6, 7, 8. Rejected milk test creates NO collection, rate=0, totalAmount=0
  it('6, 7, 8. Rejected milk test creates NO collection, sets rate=0 and totalAmount=0', async () => {
    const initialColsRes = await (await fetch(`${baseUrl}/api/collections?customerCode=P0047`)).json();
    const initialCount = initialColsRes.count;

    const testRes = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerCode: 'P0047',
        farmerId: 'FMR-1003',
        deviceId: 'ESP32-MILK-001',
        quantity: 20.0,
        temperature: 38.0,
        ph: 5.8,
        fat: 2.1,
        density: 1.018,
        conductivity: 9.5,
        milkLevel: 20.0,
        operatorDecision: 'REJECT'
      })
    });

    assert.equal(testRes.status, 201);
    const body = await testRes.json();
    assert.equal(body.data.result, 'REJECTED');
    assert.equal(body.data.ratePerLiter, 0);
    assert.equal(body.data.totalAmount, 0);
    assert.equal(body.collection, undefined);

    const afterColsRes = await (await fetch(`${baseUrl}/api/collections?customerCode=P0047`)).json();
    assert.equal(afterColsRes.count, initialCount);
  });

  // 9. Zero quantity rejected
  it('9. Zero milk quantity is rejected with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerCode: 'A1024',
        farmerId: 'FMR-1001',
        deviceId: 'ESP32-MILK-001',
        quantity: 0,
        temperature: 24.0,
        ph: 6.6,
        fat: 4.5,
        density: 1.029,
        conductivity: 4.7,
        milkLevel: 0
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  // 10. Negative quantity rejected
  it('10. Negative milk quantity is rejected with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerCode: 'A1024',
        farmerId: 'FMR-1001',
        deviceId: 'ESP32-MILK-001',
        quantity: -15.5,
        temperature: 24.0,
        ph: 6.6,
        fat: 4.5,
        density: 1.029,
        conductivity: 4.7,
        milkLevel: 0
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  // 11. Mismatched customerCode/farmerId rejected
  it('11. Mismatched customerCode and farmerId is rejected with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerCode: 'A1024', // Belongs to FMR-1001
        farmerId: 'FMR-1002',     // Mismatched!
        deviceId: 'ESP32-MILK-001',
        quantity: 20.0,
        temperature: 24.0,
        ph: 6.65,
        fat: 4.5,
        density: 1.029,
        conductivity: 4.7,
        milkLevel: 20.0
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /Security validation failed/);
  });

  // 12. Override without reason rejected
  it('12. Operator override without reason is rejected with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerCode: 'A1024',
        farmerId: 'FMR-1001',
        deviceId: 'ESP32-MILK-001',
        quantity: 25.0,
        temperature: 36.0,
        ph: 5.9,
        fat: 2.0,
        density: 1.018,
        conductivity: 8.5,
        milkLevel: 25.0,
        operatorDecision: 'ACCEPT', // Attempting override without justification
        overrideReason: ''
      })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.match(body.error, /Manual override requires a non-empty overrideReason/);
  });

  // 13. Override with reason accepted
  it('13. Operator override with valid justification creates collection with override audit', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerCode: 'A1024',
        farmerId: 'FMR-1001',
        deviceId: 'ESP32-MILK-001',
        quantity: 25.0,
        temperature: 36.0,
        ph: 5.9,
        fat: 3.5,
        density: 1.020,
        conductivity: 8.5,
        milkLevel: 25.0,
        operatorDecision: 'ACCEPT',
        overrideReason: 'Dock supervisor re-tested sample manually with lactometer'
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.result, 'ACCEPTED');
    assert.equal(body.data.overrideReason, 'Dock supervisor re-tested sample manually with lactometer');
    assert.ok(body.collection);
  });

  // 14. Customer collection query returns only that customer's collections
  it('14. Customer collection query returns only that customer collections', async () => {
    const res = await fetch(`${baseUrl}/api/collections?customerCode=A1024`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    for (const c of body.data) {
      assert.equal(c.customerCode, 'A1024');
    }
  });

  // 15. Customer test history returns only that customer's tests
  it('15. Customer test history returns only that customer tests', async () => {
    const res = await fetch(`${baseUrl}/api/tests?customerCode=B5831`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    for (const t of body.data) {
      assert.equal(t.customerCode, 'B5831');
    }
  });

  // 16. Duplicate submission does not create duplicate collection (Idempotency)
  it('16. Duplicate test submission with identical testId returns existing collection without creating duplicates', async () => {
    const uniqueTestId = `TEST-IDEMPOTENCY-${Date.now()}`;

    const firstRes = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: uniqueTestId,
        customerCode: 'A1024',
        farmerId: 'FMR-1001',
        deviceId: 'ESP32-MILK-001',
        quantity: 20.0,
        temperature: 24.0,
        ph: 6.65,
        fat: 4.6,
        density: 1.030,
        conductivity: 4.8,
        milkLevel: 20.0,
        operatorDecision: 'ACCEPT'
      })
    });

    assert.equal(firstRes.status, 201);
    const firstBody = await firstRes.json();
    const firstColId = firstBody.collection.collectionId;

    // Second call with same testId (e.g. double click or retry)
    const secondRes = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: uniqueTestId,
        customerCode: 'A1024',
        farmerId: 'FMR-1001',
        deviceId: 'ESP32-MILK-001',
        quantity: 20.0,
        temperature: 24.0,
        ph: 6.65,
        fat: 4.6,
        density: 1.030,
        conductivity: 4.8,
        milkLevel: 20.0,
        operatorDecision: 'ACCEPT'
      })
    });

    assert.equal(secondRes.status, 200);
    const secondBody = await secondRes.json();
    assert.equal(secondBody.duplicateProtected, true);
    assert.equal(secondBody.collection.collectionId, firstColId);

    // Verify exactly one collection exists for this testId
    const colsBody = await (await fetch(`${baseUrl}/api/collections?search=${uniqueTestId}`)).json();
    assert.equal(colsBody.data.length, 1);
  });

  // 17. Dashboard totals match backend records
  it('17. Dashboard totals strictly match backend accepted collections and exclude rejected liters', async () => {
    const summaryRes = await (await fetch(`${baseUrl}/api/dashboard/summary`)).json();
    assert.equal(summaryRes.success, true);

    const tests = (await (await fetch(`${baseUrl}/api/tests`)).json()).data;
    const todayStr = new Date().toDateString();
    const todayAcceptedVolume = tests
      .filter((t: any) => new Date(t.timestamp).toDateString() === todayStr && t.result !== 'REJECTED')
      .reduce((sum: number, t: any) => sum + t.quantity, 0);

    assert.equal(summaryRes.data.todayCollectionLiters, Number(todayAcceptedVolume.toFixed(1)));
  });

  // 18. Ledger closing balance is calculated correctly
  it('18. Customer ledger closing balance matches sum of accepted collection totalAmount', async () => {
    const colsRes = await (await fetch(`${baseUrl}/api/collections?customerCode=A1024`)).json();
    const expectedClosingBalance = colsRes.data.reduce((sum: number, c: any) => sum + c.totalAmount, 0);

    const calculatedSummary = colsRes.summary.totalAmount;
    assert.equal(calculatedSummary, Number(expectedClosingBalance.toFixed(2)));
  });

  // 19. Old records without purityScore do not receive fabricated values
  it('19. Historical records without purityScore are preserved without synthetic scores', async () => {
    await dataRepository.addTest({
      testId: 'TEST-LEGACY-001',
      farmerId: 'FMR-1001',
      customerCode: 'A1024',
      farmerName: 'Rajesh Patil',
      deviceId: 'ESP32-MILK-001',
      quantity: 15.0,
      timestamp: new Date('2025-01-01'),
      temperature: 24.0,
      ph: 6.6,
      fat: 4.2,
      density: 1.028,
      conductivity: 4.5,
      milkLevel: 15.0,
      qualityScore: 90,
      classification: 'GOOD',
      warnings: [],
      purityScore: undefined as any,
      result: 'ACCEPTED',
      ratePerLiter: 42.0,
      totalAmount: 630.0
    });

    const retrieved = await dataRepository.getTestById('TEST-LEGACY-001');
    assert.ok(retrieved);
    assert.equal(retrieved.purityScore, undefined);
  });

  // 20. QR -> customer -> test -> collection identity remains consistent
  it('20. Complete QR -> customer -> test -> collection transaction maintains consistent identity', async () => {
    // A. QR Lookup
    const qrLookup = await (await fetch(`${baseUrl}/api/farmers/code/A1024`)).json();
    const resolvedFarmer = qrLookup.data;
    assert.equal(resolvedFarmer.customerCode, 'A1024');
    assert.equal(resolvedFarmer.farmerId, 'FMR-1001');

    // B. Create Test
    const testRes = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerCode: resolvedFarmer.customerCode,
        farmerId: resolvedFarmer.farmerId,
        farmerName: resolvedFarmer.name,
        deviceId: 'ESP32-MILK-001',
        quantity: 28.5,
        temperature: 24.2,
        ph: 6.66,
        fat: 4.7,
        density: 1.030,
        conductivity: 4.8,
        milkLevel: 28.5,
        operatorDecision: 'ACCEPT'
      })
    });

    assert.equal(testRes.status, 201);
    const body = await testRes.json();
    const createdTest = body.data;
    const createdCol = body.collection;

    // C. Verify all entities share identical keys
    assert.equal(createdTest.customerCode, resolvedFarmer.customerCode);
    assert.equal(createdTest.farmerId, resolvedFarmer.farmerId);
    assert.equal(createdCol.customerCode, resolvedFarmer.customerCode);
    assert.equal(createdCol.farmerId, resolvedFarmer.farmerId);
    assert.equal(createdCol.testId, createdTest.testId);
    assert.equal(createdCol.quantity, 28.5);
  });
});
