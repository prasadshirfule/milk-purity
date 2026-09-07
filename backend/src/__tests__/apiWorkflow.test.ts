import test, { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../app';
import { dataRepository } from '../services/seedService';
import http from 'node:http';

const app = createApp();

describe('End-to-End API Workflow & Data Consistency', () => {
  let server: http.Server;
  let baseUrl: string;
  let testFarmerId: string;

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
    const createdFarmer = await dataRepository.addFarmer({
      farmerId: 'FMR-TEST-001',
      name: 'Integration Test Farmer',
      mobile: '+91 99999 00000',
      village: 'Test Village',
      animalType: 'COW',
      status: 'ACTIVE',
      totalMilkSupplied: 0,
      totalCollections: 0,
      averageQualityScore: 0
    });
    testFarmerId = createdFarmer.farmerId;
  });

  it('Test 1 — Accepted: should create test, collection, update farmer totals once, and not create critical alert', async () => {
    const initialFarmer = await dataRepository.getFarmerById(testFarmerId);
    assert.strictEqual(initialFarmer?.totalMilkSupplied, 0);
    assert.strictEqual(initialFarmer?.totalCollections, 0);

    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmerId: testFarmerId,
        deviceId: 'ESP32-MILK-001',
        quantity: 30.0,
        temperature: 24.0,
        ph: 6.65,
        fat: 4.5,
        density: 1.029,
        conductivity: 5.0,
        milkLevel: 30.0,
        operatorDecision: 'ACCEPT'
      })
    });

    const body: any = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.result, 'ACCEPTED');
    assert.ok(body.data.ratePerLiter > 0);
    assert.ok(body.data.totalAmount > 0);
    assert.strictEqual(body.data.totalAmount, Number((30.0 * body.data.ratePerLiter).toFixed(2)));

    // Verify Collection was created with matching fields
    assert.ok(body.collection);
    assert.strictEqual(body.collection.testId, body.data.testId);
    assert.strictEqual(body.collection.farmerId, testFarmerId);
    assert.strictEqual(body.collection.quantity, 30.0);
    assert.strictEqual(body.collection.rate, body.data.ratePerLiter);
    assert.strictEqual(body.collection.totalAmount, body.data.totalAmount);
    assert.strictEqual(body.collection.result, 'ACCEPTED');

    // Verify Farmer totals incremented exactly once
    const updatedFarmer = await dataRepository.getFarmerById(testFarmerId);
    assert.strictEqual(updatedFarmer?.totalMilkSupplied, 30.0);
    assert.strictEqual(updatedFarmer?.totalCollections, 1);
    assert.strictEqual(updatedFarmer?.averageQualityScore, body.data.qualityScore);

    // Verify collection appears in GET /api/collections
    const collectionsRes = await fetch(`${baseUrl}/api/collections?farmerId=${testFarmerId}`);
    const collectionsBody: any = await collectionsRes.json();
    assert.strictEqual(collectionsRes.status, 200);
    assert.strictEqual(collectionsBody.count, 1);
    assert.strictEqual(collectionsBody.data[0].testId, body.data.testId);
  });

  it('Test 2 — Warning: should create test, collection, update farmer totals, and create warning alert', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmerId: testFarmerId,
        deviceId: 'ESP32-MILK-001',
        quantity: 25.0,
        temperature: 24.0,
        ph: 6.4, // low pH (penalty 15)
        fat: 3.5,
        density: 1.028,
        conductivity: 6.5, // conductivity > 6.0 (penalty 12) -> Score 73 -> WARNING
        milkLevel: 25.0,
        operatorDecision: 'ACCEPT'
      })
    });

    const body: any = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.result, 'WARNING');
    assert.ok(body.collection);

    const updatedFarmer = await dataRepository.getFarmerById(testFarmerId);
    assert.strictEqual(updatedFarmer?.totalMilkSupplied, 25.0);
    assert.strictEqual(updatedFarmer?.totalCollections, 1);

    // Verify warning alert was generated
    const alertsRes = await fetch(`${baseUrl}/api/alerts`);
    const alertsBody: any = await alertsRes.json();
    const createdAlert = alertsBody.data.find((a: any) => a.testId === body.data.testId);
    assert.ok(createdAlert, 'Alert should be created for warning test');
    assert.strictEqual(createdAlert.severity, 'WARNING');
    assert.strictEqual(createdAlert.farmerId, testFarmerId);
  });

  it('Test 3 — Rejected: should set rate=0, create NO collection, leave farmer totals unchanged, and create critical alert', async () => {
    const initialFarmer = await dataRepository.getFarmerById(testFarmerId);
    const prevSupplied = initialFarmer?.totalMilkSupplied || 0;
    const prevCollections = initialFarmer?.totalCollections || 0;

    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmerId: testFarmerId,
        deviceId: 'ESP32-MILK-001',
        quantity: 40.0,
        temperature: 24.0,
        ph: 5.2, // Severely abnormal pH -> REJECT
        fat: 1.2,
        density: 1.015,
        conductivity: 8.5,
        milkLevel: 40.0,
        operatorDecision: 'REJECT'
      })
    });

    const body: any = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.result, 'REJECTED');
    assert.strictEqual(body.data.ratePerLiter, 0);
    assert.strictEqual(body.data.totalAmount, 0);
    assert.strictEqual(body.collection, undefined);

    // Verify farmer totals did NOT increase
    const updatedFarmer = await dataRepository.getFarmerById(testFarmerId);
    assert.strictEqual(updatedFarmer?.totalMilkSupplied, prevSupplied);
    assert.strictEqual(updatedFarmer?.totalCollections, prevCollections);

    // Verify critical alert was generated
    const alertsRes = await fetch(`${baseUrl}/api/alerts`);
    const alertsBody: any = await alertsRes.json();
    const createdAlert = alertsBody.data.find((a: any) => a.testId === body.data.testId);
    assert.ok(createdAlert, 'Critical alert should be created for rejected test');
    assert.strictEqual(createdAlert.severity, 'CRITICAL');
    assert.ok(createdAlert.message.includes('Secondary laboratory verification advised'));
  });

  it('Test 4 — Rejected + operator ACCEPT without reason: should fail validation with 400 and create no records', async () => {
    const testsBefore = (await dataRepository.getTests()).length;
    const collectionsBefore = (await dataRepository.getCollections()).length;

    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmerId: testFarmerId,
        deviceId: 'ESP32-MILK-001',
        quantity: 35.0,
        temperature: 24.0,
        ph: 5.0, // Extreme pH (penalty 35)
        fat: 1.2,
        density: 1.015, // Critical density (penalty 40) -> Score 25 -> REJECTED
        conductivity: 8.5,
        milkLevel: 35.0,
        operatorDecision: 'ACCEPT' // Attempting to accept without overrideReason
      })
    });

    const body: any = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('overrideReason'));

    const testsAfter = (await dataRepository.getTests()).length;
    const collectionsAfter = (await dataRepository.getCollections()).length;
    assert.strictEqual(testsAfter, testsBefore, 'No test record should be created');
    assert.strictEqual(collectionsAfter, collectionsBefore, 'No collection record should be created');
  });

  it('Test 5 — Rejected + operator ACCEPT with valid reason: should accept under override and create collection', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmerId: testFarmerId,
        deviceId: 'ESP32-MILK-001',
        quantity: 35.0,
        temperature: 24.0,
        ph: 5.0, // Extreme pH (penalty 35)
        fat: 4.2,
        density: 1.015, // Critical density (penalty 40) -> Score 25 -> REJECTED
        conductivity: 5.0,
        milkLevel: 35.0,
        operatorDecision: 'ACCEPT',
        overrideReason: 'Supervisory lab verification completed on benchtop analyzer.'
      })
    });

    const body: any = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.result, 'ACCEPTED');
    assert.strictEqual(body.data.overrideReason, 'Supervisory lab verification completed on benchtop analyzer.');
    assert.ok(body.collection, 'Collection should be created for manual override accept');
    assert.ok(body.data.totalAmount > 0);

    const updatedFarmer = await dataRepository.getFarmerById(testFarmerId);
    assert.strictEqual(updatedFarmer?.totalMilkSupplied, 35.0);
    assert.strictEqual(updatedFarmer?.totalCollections, 1);
  });

  it('Test 6 — Invalid operatorDecision: should reject with 400 and create no partial state', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmerId: testFarmerId,
        deviceId: 'ESP32-MILK-001',
        quantity: 20.0,
        temperature: 24.0,
        ph: 6.65,
        fat: 4.5,
        density: 1.029,
        conductivity: 5.0,
        milkLevel: 20.0,
        operatorDecision: 'MAYBE' // Invalid decision
      })
    });

    const body: any = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('operatorDecision'));
  });

  it('Test 7 — Negative milkLevel: should reject with 400 and create no partial state', async () => {
    const res = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmerId: testFarmerId,
        deviceId: 'ESP32-MILK-001',
        quantity: 20.0,
        temperature: 24.0,
        ph: 6.65,
        fat: 4.5,
        density: 1.029,
        conductivity: 5.0,
        milkLevel: -5.0, // Negative level
        operatorDecision: 'ACCEPT'
      })
    });

    const body: any = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.success, false);
    assert.ok(body.error.includes('milkLevel'));
  });

  it('Test 8 — Persistence and Dashboard Readback consistency', async () => {
    // Record an accepted test for our farmer
    const testRes = await fetch(`${baseUrl}/api/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmerId: testFarmerId,
        deviceId: 'ESP32-MILK-001',
        quantity: 50.0,
        temperature: 24.0,
        ph: 6.65,
        fat: 4.5,
        density: 1.029,
        conductivity: 5.0,
        milkLevel: 50.0,
        operatorDecision: 'ACCEPT'
      })
    });
    const testBody: any = await testRes.json();
    assert.strictEqual(testRes.status, 201);
    const createdTestId = testBody.data.testId;

    // Verify GET /api/tests returns the test
    const allTestsRes = await fetch(`${baseUrl}/api/tests?farmerId=${testFarmerId}`);
    const allTestsBody: any = await allTestsRes.json();
    assert.strictEqual(allTestsRes.status, 200);
    const foundTest = allTestsBody.data.find((t: any) => t.testId === createdTestId);
    assert.ok(foundTest);
    assert.strictEqual(foundTest.quantity, 50.0);

    // Verify GET /api/dashboard/summary reflects real metrics
    const summaryRes = await fetch(`${baseUrl}/api/dashboard/summary`);
    const summaryBody: any = await summaryRes.json();
    assert.strictEqual(summaryRes.status, 200);
    assert.strictEqual(summaryBody.success, true);
    assert.ok(typeof summaryBody.data.todayCollectionLiters === 'number');
    assert.ok(summaryBody.data.totalTestsToday > 0);
    assert.ok(summaryBody.data.acceptedCount > 0);
    assert.ok(typeof summaryBody.data.collectionGrowthPercent === 'number');
    assert.ok(summaryBody.data.activeFarmers > 0);

    // Verify Alert status update persists
    const alertsRes = await fetch(`${baseUrl}/api/alerts`);
    const alertsBody: any = await alertsRes.json();
    if (alertsBody.data.length > 0) {
      const alertToUpdate = alertsBody.data[0];
      const updateRes = await fetch(`${baseUrl}/api/alerts/${alertToUpdate.alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED' })
      });
      const updateBody: any = await updateRes.json();
      assert.strictEqual(updateRes.status, 200);
      assert.strictEqual(updateBody.data.status, 'RESOLVED');

      const verifyRes = await fetch(`${baseUrl}/api/alerts`);
      const verifyBody: any = await verifyRes.json();
      const updatedAlert = verifyBody.data.find((a: any) => a.alertId === alertToUpdate.alertId);
      assert.strictEqual(updatedAlert?.status, 'RESOLVED');
    }
  });
});
