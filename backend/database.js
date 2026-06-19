const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'disputes.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeTables();
  }
});

function initializeTables() {
  db.serialize(() => {
    // Create generations table
    db.run(`
      CREATE TABLE IF NOT EXISTS generations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT NOT NULL,
        client_name TEXT NOT NULL,
        invoice_number TEXT NOT NULL,
        invoice_date TEXT NOT NULL,
        invoice_amount REAL NOT NULL,
        disputed_amount REAL NOT NULL,
        disputed_details TEXT NOT NULL,
        supporting_evidence TEXT NOT NULL,
        resolution_strategy TEXT NOT NULL,
        tone TEXT NOT NULL,
        generated_script TEXT NOT NULL,
        rating INTEGER DEFAULT NULL,
        comment TEXT DEFAULT NULL,
        response_time_ms INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create templates table
    db.run(`
      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        project_name TEXT NOT NULL,
        client_name TEXT NOT NULL,
        invoice_number TEXT NOT NULL,
        invoice_amount REAL NOT NULL,
        disputed_amount REAL NOT NULL,
        disputed_details TEXT NOT NULL,
        supporting_evidence TEXT NOT NULL,
        resolution_strategy TEXT NOT NULL,
        tone TEXT NOT NULL
      )
    `, () => {
      // Seed templates if table is empty
      db.get('SELECT COUNT(*) as count FROM templates', (err, row) => {
        if (row && row.count === 0) {
          seedTemplates();
        }
      });
    });
  });
}

function seedTemplates() {
  const sampleTemplates = [
    {
      title: "Quantity Deviation in Concrete Laying",
      project_name: "Warangal-Khammam Highway Expansion - Section B",
      client_name: "Telangana State Road Development Corporation (TSRDC)",
      invoice_number: "TSRDC/2026/RA-04",
      invoice_amount: 45000000.00,
      disputed_amount: 6800000.00,
      disputed_details: "TSRDC claims the volume of grade M40 concrete poured at Chainage 12+500 to 14+200 is 1,200 cubic meters instead of the billed 1,360 cubic meters. They issued a debit note withholding INR 68,00.000.",
      supporting_evidence: "Joint measurement sheets recorded in Measurement Book (M-Book) #124 page 56-59, signed by client's site engineer on May 12, 2026; weighbridge transit slips; batching plant auto-logs.",
      resolution_strategy: "Request joint on-site core-drilling verification and review the concrete batching plant log records alongside M-Book logs. Release of withheld amount pending core results.",
      tone: "ANALYTICAL/EVIDENCE-BASED"
    },
    {
      title: "Delay Penalty & Extension of Time (EoT) Dispute",
      project_name: "Karimnagar Flyover & Utility Realignment Project",
      client_name: "Telangana Roads & Buildings Department",
      invoice_number: "TRB/KMNR/FLY-09",
      invoice_amount: 82000000.00,
      disputed_amount: 8200000.00,
      disputed_details: "Department deducted a 10% penalty (INR 82,00,000) for delay in completion of the portal beam casting, alleging negligence by Avinash Kanaparthi Infra.",
      supporting_evidence: "Unforeseen site obstacles: delayed clearance of high-tension electrical cables by Telangana Transco (Reference Letter Transco/EE/902 dated Dec 2025); site survey photos showing blockages; approved extension request TRB/SE/EoT-04.",
      resolution_strategy: "Cite Clause 14.2 of contract regarding Force Majeure and utility owner delays. Demand full reimbursement of the deducted penalty as the delay was non-attributable to our operations.",
      tone: "FIRM"
    },
    {
      title: "Material Escalation Rate Mismatch",
      project_name: "Mahbubnagar Water Grid Supply Network Pipeline",
      client_name: "Telangana Irrigation & CAD Department (Rural Water Supply)",
      invoice_number: "I-CAD/RWS/MBNR-33",
      invoice_amount: 15000000.00,
      disputed_amount: 1250000.00,
      disputed_details: "Client disputed the steel reinforcement escalation rate billed under R.A. Bill 6, claiming that wholesale price index (WPI) calculations should use the October 2025 index rather than the November 2025 index.",
      supporting_evidence: "Contract clause 47.1 specifying price adjustment formula; RBI index bulletins; formal bill submission cover letters; approved schedule of rates (SoR) reference sheets.",
      resolution_strategy: "Offer a collaborative reconciliation meeting to walk through the RBI WPI data sheets. Show that steel delivery invoices align with November indices, but suggest a middle ground split if verified.",
      tone: "COLLABORATIVE"
    }
  ];

  const stmt = db.prepare(`
    INSERT INTO templates (
      title, project_name, client_name, invoice_number, invoice_amount, 
      disputed_amount, disputed_details, supporting_evidence, resolution_strategy, tone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  sampleTemplates.forEach((tpl) => {
    stmt.run(
      tpl.title,
      tpl.project_name,
      tpl.client_name,
      tpl.invoice_number,
      tpl.invoice_amount,
      tpl.disputed_amount,
      tpl.disputed_details,
      tpl.supporting_evidence,
      tpl.resolution_strategy,
      tpl.tone
    );
  });

  stmt.finalize(() => {
    console.log('Seeded initial template presets in SQLite.');
  });
}

module.exports = db;
