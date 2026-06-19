require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { generateMockLetter } = require('./mockGenerator');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// System Prompt (Prompt v4)
const SYSTEM_PROMPT = `
You are a senior contract arbitrator, Chief Financial Officer, and legal counsel at AVINASH KANAPARTHI INFRA PRIVATE LIMITED, a premier infrastructure firm in Telangana.
Your task is to draft a highly professional, contractually sound, and persuasive Billing Dispute Resolution Letter.

You MUST adhere to the following rules:
1. Structure the letter with clear Markdown headers:
   - ### LETTER HEADER (Sender: Avinash Kanaparthi Infra, Receiver: Client)
   - ### EXECUTIVE SUMMARY (Overview of invoice, total amount, and disputed amount)
   - ### DETAILED ANALYSIS OF DISPUTED ITEMS (Breakdown of quantities/rates, highlighting discrepancies)
   - ### SUBSTANTIATING EVIDENCE & ATTACHMENTS (Explicit references to physical records like M-Books, Site logs, Quality certificates, etc.)
   - ### PROPOSED RESOLUTION PATH & NEXT STEPS (Actionable solution, e.g., joint verification site-visit, escrow release, revised billing)
   - ### FORMAL CLOSURE (Professional sign-off)
2. Tone adaptation:
   - COLLABORATIVE: Emphasize long-term partnership, joint verification, and mutual benefit.
   - FIRM: Focus heavily on contractual obligations, timeline impact, interest penalties, and formal audit records.
   - ANALYTICAL/EVIDENCE-BASED: Focus on data, measurement records, joint logs, and factual reconciliation.
   - FORMAL LEGAL: Cite contract clauses, standard legal terms, and notice periods.
3. Do NOT hallucinate data. If details are missing, use professional placeholders like "[Refer to contract Section X]" or list the input parameter name.
4. Write in formal Indian Business English (using terms like 'Lakh', 'Crore', 'M-Book', 'R.A. Bill', 'Security Deposit', 'Telangana PWD schedule of rates' where relevant).
`;

function buildUserPrompt(inputs) {
  return `
Please draft a billing dispute response letter using the following parameters:
- Project Name: ${inputs.projectName}
- Client Name: ${inputs.clientName}
- Invoice Details: Invoice No: ${inputs.invoiceNumber}, Date: ${inputs.invoiceDate}, Total Amount: INR ${inputs.invoiceAmount}
- Disputed Details: Disputed Amount: INR ${inputs.disputedAmount}, Discrepancy Details: ${inputs.disputedDetails}
- Supporting Evidence: ${inputs.supportingEvidence}
- Proposed Resolution Strategy: ${inputs.resolutionStrategy}
- Selected Tone: ${inputs.tone}

Ensure all these parameters are integrated seamlessly and highlighted within the structured sections.
`;
}

// 1. POST /api/generate
app.post('/api/generate', async (req, res) => {
  const start = Date.now();
  const inputs = req.body;

  // Basic validation
  const requiredFields = ['projectName', 'clientName', 'invoiceNumber', 'invoiceDate', 'invoiceAmount', 'disputedAmount', 'disputedDetails', 'supportingEvidence', 'resolutionStrategy', 'tone'];
  for (const field of requiredFields) {
    if (!inputs[field] || inputs[field].toString().trim() === '') {
      return res.status(400).json({ success: false, error: `Missing required field: ${field}` });
    }
  }

  let generatedScript = '';
  let mode = 'mock';

  try {
    if (process.env.GEMINI_API_KEY) {
      console.log('Using live Gemini API...');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_PROMPT
      });
      const userPrompt = buildUserPrompt(inputs);
      
      // Implement timeout handling (30s)
      const generatePromise = model.generateContent(userPrompt);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI API Timeout (30s)')), 30000));
      
      const response = await Promise.race([generatePromise, timeoutPromise]);
      generatedScript = response.response.text();
      mode = 'live-gemini';
    } else if (process.env.OPENAI_API_KEY) {
      console.log('Using live OpenAI API...');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const userPrompt = buildUserPrompt(inputs);

      const generatePromise = openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ]
      });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI API Timeout (30s)')), 30000));

      const completion = await Promise.race([generatePromise, timeoutPromise]);
      generatedScript = completion.choices[0].message.content;
      mode = 'live-openai';
    } else {
      console.log('No API keys found. Using Mock AI mode...');
      generatedScript = generateMockLetter(inputs);
      mode = 'mock';
    }

    const responseTimeMs = Date.now() - start;

    // Save to SQLite database
    const stmt = db.prepare(`
      INSERT INTO generations (
        project_name, client_name, invoice_number, invoice_date, invoice_amount,
        disputed_amount, disputed_details, supporting_evidence, resolution_strategy,
        tone, generated_script, response_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      inputs.projectName,
      inputs.clientName,
      inputs.invoiceNumber,
      inputs.invoiceDate,
      parseFloat(inputs.invoiceAmount),
      parseFloat(inputs.disputedAmount),
      inputs.disputedDetails,
      inputs.supportingEvidence,
      inputs.resolutionStrategy,
      inputs.tone,
      generatedScript,
      responseTimeMs,
      function (err) {
        if (err) {
          console.error('Error saving to history:', err.message);
          return res.status(500).json({ success: false, error: 'Database save failed.' });
        }
        res.json({
          success: true,
          mode,
          data: {
            id: this.lastID,
            generatedScript,
            responseTimeMs,
            ...inputs
          }
        });
      }
    );
    stmt.finalize();

  } catch (error) {
    console.error('AI Generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during AI text generation.'
    });
  }
});

// 2. GET /api/history
app.get('/api/history', (req, res) => {
  db.all(`
    SELECT id, project_name, client_name, invoice_number, invoice_date, 
           invoice_amount, disputed_amount, tone, rating, comment, created_at 
    FROM generations 
    ORDER BY created_at DESC
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching history:', err.message);
      return res.status(500).json({ success: false, error: 'Database query failed.' });
    }
    res.json({ success: true, history: rows });
  });
});

// 3. GET /api/history/:id
app.get('/api/history/:id', (req, res) => {
  db.get(`
    SELECT * FROM generations WHERE id = ?
  `, [req.params.id], (err, row) => {
    if (err) {
      console.error('Error fetching record:', err.message);
      return res.status(500).json({ success: false, error: 'Database query failed.' });
    }
    if (!row) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }
    res.json({ success: true, record: row });
  });
});

// 4. POST /api/feedback
app.post('/api/feedback', (req, res) => {
  const { generationId, rating, comment } = req.body;

  if (!generationId || rating === undefined) {
    return res.status(400).json({ success: false, error: 'Missing generationId or rating.' });
  }

  const ratingVal = parseInt(rating);
  if (ratingVal < 1 || ratingVal > 5) {
    return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5.' });
  }

  db.run(`
    UPDATE generations 
    SET rating = ?, comment = ? 
    WHERE id = ?
  `, [ratingVal, comment || '', generationId], function (err) {
    if (err) {
      console.error('Error updating feedback:', err.message);
      return res.status(500).json({ success: false, error: 'Database update failed.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: 'Generation record not found.' });
    }
    res.json({ success: true, message: 'Feedback submitted successfully.' });
  });
});

// 5. GET /api/admin/analytics
app.get('/api/admin/analytics', (req, res) => {
  db.serialize(() => {
    let analytics = {
      totalGenerations: 0,
      averageRating: 0.0,
      totalDisputedAmount: 0.0,
      averageResponseTimeMs: 0.0,
      disputeTypeStats: [],
      qualityTrend: []
    };

    // Total generations, avg rating, total disputed, avg response time
    db.get(`
      SELECT 
        COUNT(*) as count,
        AVG(rating) as avg_rating,
        SUM(disputed_amount) as total_disputed,
        AVG(response_time_ms) as avg_time
      FROM generations
    `, [], (err, summaryRow) => {
      if (err) {
        console.error('Error in analytics summary:', err.message);
        return res.status(500).json({ success: false, error: 'Analytics compilation failed.' });
      }

      if (summaryRow) {
        analytics.totalGenerations = summaryRow.count || 0;
        analytics.averageRating = summaryRow.avg_rating ? parseFloat(summaryRow.avg_rating.toFixed(2)) : 0.0;
        analytics.totalDisputedAmount = summaryRow.total_disputed || 0.0;
        analytics.averageResponseTimeMs = summaryRow.avg_time ? Math.round(summaryRow.avg_time) : 0;
      }

      // Quality trend (by day)
      db.all(`
        SELECT DATE(created_at) as date, AVG(rating) as avg_rating, COUNT(*) as count
        FROM generations
        WHERE rating IS NOT NULL
        GROUP BY DATE(created_at)
        ORDER BY date ASC
        LIMIT 15
      `, [], (err, trendRows) => {
        if (err) {
          console.error('Error in analytics trend:', err.message);
        } else {
          analytics.qualityTrend = trendRows.map(row => ({
            date: row.date,
            avgRating: parseFloat(row.avg_rating.toFixed(2)),
            count: row.count
          }));
        }

        // Categorize common issues from details (Keyword match heuristic)
        db.all(`
          SELECT disputed_details FROM generations
        `, [], (err, detailRows) => {
          if (err) {
            console.error('Error in detail categorization:', err.message);
          } else {
            let categories = {
              'Quantity Variation': 0,
              'Delay Penalties': 0,
              'Material Escalation': 0,
              'Quality Testing': 0,
              'Other Billing Issues': 0
            };

            detailRows.forEach(row => {
              const text = (row.disputed_details || '').toLowerCase();
              if (text.includes('quantity') || text.includes('volume') || text.includes('meter') || text.includes('deviation')) {
                categories['Quantity Variation']++;
              } else if (text.includes('delay') || text.includes('penalty') || text.includes('liquidated') || text.includes('extension')) {
                categories['Delay Penalties']++;
              } else if (text.includes('escalation') || text.includes('rate') || text.includes('price') || text.includes('wpi')) {
                categories['Material Escalation']++;
              } else if (text.includes('quality') || text.includes('strength') || text.includes('core') || text.includes('test')) {
                categories['Quality Testing']++;
              } else {
                categories['Other Billing Issues']++;
              }
            });

            analytics.disputeTypeStats = Object.keys(categories).map(cat => ({
              category: cat,
              count: categories[cat]
            }));
          }

          res.json({ success: true, analytics });
        });
      });
    });
  });
});

// 6. GET /api/templates
app.get('/api/templates', (req, res) => {
  db.all(`
    SELECT * FROM templates ORDER BY id ASC
  `, [], (err, rows) => {
    if (err) {
      console.error('Error fetching templates:', err.message);
      return res.status(500).json({ success: false, error: 'Database query failed.' });
    }
    res.json({ success: true, templates: rows });
  });
});

// 7. POST /api/templates
app.post('/api/templates', (req, res) => {
  const { title, projectName, clientName, invoiceNumber, invoiceAmount, disputedAmount, disputedDetails, supportingEvidence, resolutionStrategy, tone } = req.body;

  if (!title || !projectName || !clientName || !invoiceNumber || !invoiceAmount || !disputedAmount) {
    return res.status(400).json({ success: false, error: 'Missing required preset template fields.' });
  }

  db.run(`
    INSERT INTO templates (
      title, project_name, client_name, invoice_number, invoice_amount, 
      disputed_amount, disputed_details, supporting_evidence, resolution_strategy, tone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    title, projectName, clientName, invoiceNumber, 
    parseFloat(invoiceAmount), parseFloat(disputedAmount), 
    disputedDetails || '', supportingEvidence || '', 
    resolutionStrategy || '', tone || 'ANALYTICAL/EVIDENCE-BASED'
  ], function (err) {
    if (err) {
      console.error('Error saving template:', err.message);
      return res.status(500).json({ success: false, error: 'Failed to create template.' });
    }
    res.json({ success: true, templateId: this.lastID, message: 'Template preset created.' });
  });
});

// 8. POST /api/register
app.post('/api/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  db.run(`
    INSERT INTO users (email, password) VALUES (?, ?)
  `, [email, password], function (err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ success: false, error: 'Email is already registered.' });
      }
      console.error('Error registering user:', err.message);
      return res.status(500).json({ success: false, error: 'Registration failed.' });
    }
    res.json({ success: true, user: { email }, message: 'Registration successful.' });
  });
});

// 9. POST /api/login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  db.get(`
    SELECT * FROM users WHERE email = ? AND password = ?
  `, [email, password], (err, row) => {
    if (err) {
      console.error('Error during login:', err.message);
      return res.status(500).json({ success: false, error: 'Authentication failed.' });
    }
    if (!row) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }
    res.json({ success: true, user: { email }, message: 'Login successful.' });
  });
});

// Serve static frontend assets
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

// Fallback catch-all route for single-page app
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY ? 'Live AI' : 'Mock Fallback'} mode on port ${PORT}`);
});
