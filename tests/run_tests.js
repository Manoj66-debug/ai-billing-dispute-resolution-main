/**
 * Automated Integration Test Suite for AI Client Billing Dispute Resolution Script
 * Boots the server locally, runs end-to-end API tests, and prints a validation report.
 */

const { spawn } = require('child_process');
const path = require('path');

const BACKEND_DIR = path.join(__dirname, '../backend');
const TEST_PORT = 5000;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let serverProcess;

function startServer() {
  return new Promise((resolve, reject) => {
    console.log('Starting Express server for test execution...');
    serverProcess = spawn('node', ['server.js'], {
      cwd: BACKEND_DIR,
      env: { ...process.env, PORT: TEST_PORT }
    });

    serverProcess.stdout.on('data', (data) => {
      const text = data.toString();
      console.log(`[Server]: ${text.trim()}`);
      if (text.includes('running') || text.includes('Server')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server Error]: ${data.toString().trim()}`);
    });

    serverProcess.on('error', (err) => {
      reject(err);
    });

    // Fallback timer if log doesn't match
    setTimeout(resolve, 3000);
  });
}

function stopServer() {
  if (serverProcess) {
    console.log('Shutting down test server...');
    serverProcess.kill();
  }
}

async function runTests() {
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    if (condition) {
      passedTests++;
      console.log(` ✅ PASS: ${message}`);
    } else {
      failedTests++;
      console.error(` ❌ FAIL: ${message}`);
    }
  }

  try {
    console.log('\n--- Beginning API Integration Tests ---\n');

    // Test 1: GET /api/templates
    console.log('Test 1: Fetching initial preset templates...');
    const tplRes = await fetch(`${BASE_URL}/templates`);
    assert(tplRes.status === 200, 'GET /templates responded with HTTP 200');
    const tplData = await tplRes.json();
    assert(tplData.success === true, 'Response JSON success is true');
    assert(Array.isArray(tplData.templates), 'Templates is an array');
    assert(tplData.templates.length > 0, `Loaded ${tplData.templates.length} seeded templates`);

    // Store a template for reference
    const sampleTpl = tplData.templates[0];

    // Test 2: POST /api/generate (Invalid Input validation)
    console.log('\nTest 2: Verifying form field validation (Missing details)...');
    const badPayload = {
      projectName: 'Test Project',
      clientName: 'Test Client',
      invoiceNumber: 'INV-100',
      invoiceDate: '2026-06-01',
      invoiceAmount: 500000,
      disputedAmount: 100000,
      disputedDetails: '', // Empty
      supportingEvidence: 'M-Book #1',
      resolutionStrategy: 'Meeting',
      tone: 'FIRM'
    };

    const badGenRes = await fetch(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(badPayload)
    });
    assert(badGenRes.status === 400, 'POST /generate with empty fields returns HTTP 400');
    const badGenData = await badGenRes.json();
    assert(badGenData.success === false, 'Error response success is false');
    assert(badGenData.error.includes('disputedDetails'), 'Error correctly flags the missing field');

    // Test 3: POST /api/generate (Valid Input generation)
    console.log('\nTest 3: Generating dispute letter with Prompt v4 template...');
    const goodPayload = {
      projectName: 'Khammam Bypass Ring Road - Section 3',
      clientName: 'Telangana Highways Authority',
      invoiceNumber: 'AKIPL/KHM/RA-01',
      invoiceDate: '2026-05-15',
      invoiceAmount: 25000000,
      disputedAmount: 3500000,
      disputedDetails: 'Quantity measurement discrepancy in concrete layer thickness at Chainage 5+200. Client deducted 35 Lakhs.',
      supportingEvidence: 'Measurement Book (M-Book) #42 Page 18-21 showing 150mm thickness, signed by Executive Engineer.',
      resolutionStrategy: 'Conduct a joint core test extraction at 3 selected chainage points within 7 days.',
      tone: 'ANALYTICAL/EVIDENCE-BASED'
    };

    const genRes = await fetch(`${BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goodPayload)
    });
    assert(genRes.status === 200, 'POST /generate with valid fields returns HTTP 200');
    const genData = await genRes.json();
    assert(genData.success === true, 'Valid generation returns success: true');
    assert(genData.data.id !== undefined, `Saved generation with ID: ${genData.data.id}`);
    
    const letter = genData.data.generatedScript;
    assert(letter.includes('### LETTER HEADER'), 'Letter contains HEADER section');
    assert(letter.includes('### EXECUTIVE SUMMARY'), 'Letter contains EXECUTIVE SUMMARY section');
    assert(letter.includes('### DETAILED ANALYSIS OF DISPUTED ITEMS'), 'Letter contains DETAILED ANALYSIS section');
    assert(letter.includes('### SUBSTANTIATING EVIDENCE & ATTACHMENTS'), 'Letter contains SUBSTANTIATING EVIDENCE section');
    assert(letter.includes('### PROPOSED RESOLUTION PATH & NEXT STEPS'), 'Letter contains PROPOSED RESOLUTION section');
    assert(letter.includes('### FORMAL CLOSURE'), 'Letter contains FORMAL CLOSURE section');
    assert(letter.includes('35,00,000.00'), 'Indian Currency format successfully applied to disputed amount');

    const newGenId = genData.data.id;

    // Test 4: POST /api/feedback (Submit Rating & Comment)
    console.log('\nTest 4: Logging user rating & feedback...');
    const feedbackPayload = {
      generationId: newGenId,
      rating: 5,
      comment: 'Excellent structured layout. Reference to M-Book is perfect.'
    };

    const feedRes = await fetch(`${BASE_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedbackPayload)
    });
    assert(feedRes.status === 200, 'POST /feedback returns HTTP 200');
    const feedData = await feedRes.json();
    assert(feedData.success === true, 'Feedback submission logged success: true');

    // Test 5: GET /api/history (Fetch History Log)
    console.log('\nTest 5: Retrieving history log...');
    const histRes = await fetch(`${BASE_URL}/history`);
    assert(histRes.status === 200, 'GET /history returns HTTP 200');
    const histData = await histRes.json();
    assert(Array.isArray(histData.history), 'History field is an array');
    const lastItem = histData.history.find(h => h.id === newGenId);
    assert(lastItem !== undefined, 'Generated dispute is present in history log');
    assert(lastItem.rating === 5, 'Feedback rating successfully updated in database');

    // Test 6: GET /api/admin/analytics (Calculate metrics & trends)
    console.log('\nTest 6: Fetching Admin Analytics Dashboard KPIs...');
    const analRes = await fetch(`${BASE_URL}/admin/analytics`);
    assert(analRes.status === 200, 'GET /admin/analytics returns HTTP 200');
    const analData = await analRes.json();
    assert(analData.success === true, 'Analytics calculation successful');
    assert(analData.analytics.totalGenerations >= 1, `KPI: Total generations = ${analData.analytics.totalGenerations}`);
    assert(analData.analytics.averageRating === 5.0, `KPI: Average rating is correct (${analData.analytics.averageRating})`);
    assert(analData.analytics.totalDisputedAmount >= 3500000, `KPI: Total disputed value = ${analData.analytics.totalDisputedAmount}`);
    
    const quantityCat = analData.analytics.disputeTypeStats.find(s => s.category === 'Quantity Variation');
    assert(quantityCat !== undefined && quantityCat.count >= 1, 'Analytics correctly categorized the dispute as Quantity Variation');

    console.log('\n--- API Integration Tests Summary ---');
    console.log(`Total Passed: ${passedTests}`);
    console.log(`Total Failed: ${failedTests}`);

    if (failedTests > 0) {
      console.error('\n❌ SOME TESTS FAILED! Check error logs.');
    } else {
      console.log('\n🌟 ALL TESTS PASSED SUCCESSFULLY! The backend logic and database is verified.');
    }

  } catch (error) {
    console.error('Test execution error:', error);
  }
}

// Main execution loop
async function run() {
  try {
    await startServer();
    // Wait an extra second for initialization
    await new Promise(r => setTimeout(r, 1000));
    await runTests();
  } catch (err) {
    console.error('Failed to run integration tests:', err);
  } finally {
    stopServer();
  }
}

run();
