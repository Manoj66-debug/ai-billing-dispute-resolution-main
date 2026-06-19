/**
 * AI Billing Dispute Response Letter Mock Generator
 * Generates highly realistic, structured civil engineering letters based on input fields.
 * Used as a fallback when no active Gemini or OpenAI API keys are configured.
 */

function generateMockLetter(inputs) {
  const {
    projectName,
    clientName,
    invoiceNumber,
    invoiceDate,
    invoiceAmount,
    disputedAmount,
    disputedDetails,
    supportingEvidence,
    resolutionStrategy,
    tone
  } = inputs;

  const formattedInvoiceAmount = parseFloat(invoiceAmount).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  });
  
  const formattedDisputedAmount = parseFloat(disputedAmount).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  });

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // 1. Header Text
  const headerSection = `
**AVINASH KANAPARTHI INFRA PRIVATE LIMITED**
Plot No. 45, Infrastructure House, Madhapur, Hyderabad, Telangana - 500081
CIN: U45200TG2015PTC099182 | Email: finance@akinfras.com

---

**Ref No:** AKIPL/FIN/DISP/${invoiceNumber.replace(/[^a-zA-Z0-9]/g, '')}/${new Date().getFullYear()}
**Date:** ${currentDate}

**To,**
**The Superintending Engineer / Project Manager,**
${clientName}
Telangana, India.

**Subject:** Response to Billing Discrepancy & Notice of Dispute Reconciliation - Invoice No: ${invoiceNumber}
**Project:** ${projectName}
`;

  // 2. Executive Summary
  let execSummary = `This formal communication is in reference to the work completed and billed under **Invoice No: ${invoiceNumber}** (Date: ${invoiceDate}) for the project **"${projectName}"**. The total value of the submitted invoice is **${formattedInvoiceAmount}**. We note that a deduction/disputed amount of **${formattedDisputedAmount}** has been withheld or challenged by your department. 

`;

  if (tone === 'COLLABORATIVE') {
    execSummary += `As a long-term partner of ${clientName}, Avinash Kanaparthi Infra Private Limited values our collaborative relationship. We have prepared this response to address your concerns transparently, clear up any misunderstandings, and expedite the verification process to prevent project delays.`;
  } else if (tone === 'FIRM') {
    execSummary += `Please be advised that the unilateral withholding of ${formattedDisputedAmount} represents a substantial delay under the contract terms. We submit this letter to demand immediate reconciliation. Continued withholding of certified work amounts violates payment schedules and may lead to interest penalties under the main agreement.`;
  } else if (tone === 'FORMAL LEGAL') {
    execSummary += `Pursuant to the contract clauses governing dispute resolution, we hereby submit this formal response to your unilateral debit note/dispute notice. We clarify the contract specifications and demand that the full invoice balance of ${formattedInvoiceAmount} be cleared as per the contract schedule.`;
  } else { // ANALYTICAL/EVIDENCE-BASED
    execSummary += `This response provides a factual, data-driven reconciliation of the disputed amount. Based on physical records, joint measurements, and engineering checklists, we have audited the dispute details and present below the reconciliation breakdown.`;
  }

  // 3. Detailed Analysis of Disputed Items
  let detailedAnalysis = `The dispute involves the following item(s) representing a value of **${formattedDisputedAmount}**:\n\n> *"${disputedDetails}"*\n\nUpon auditing our records, we note that the work was executed in strict conformance with the approved drawings, tender specifications, and standard codes. `;

  if (tone === 'ANALYTICAL/EVIDENCE-BASED') {
    detailedAnalysis += `Our calculations show that the billed quantities conform to the geometric design sections. Specifically, the material batching, depth checks, and carriage parameters match the structural designs approved by the department. A comparative audit reveals zero negative variance.`;
  } else if (tone === 'FORMAL LEGAL') {
    detailedAnalysis += `Under Article 8 (Reconciliation and Measurement) of our agreement, once progress measurements are certified by the resident engineer, they cannot be retrospectively altered without joint survey reports. The deduction of ${formattedDisputedAmount} is therefore contractually premature.`;
  } else if (tone === 'FIRM') {
    detailedAnalysis += `The work in question was executed under direct supervision of your field team. The unilateral deduction of ${formattedDisputedAmount} without prior show-cause or joint measurements disrupts working capital and directly impacts subcontractor mobilization schedules.`;
  } else { // COLLABORATIVE
    detailedAnalysis += `We understand that discrepancies can arise in complex infrastructure bills involving multiple subcontractor chains. We wish to highlight that the execution team maintained active communication during concrete pouring/laying stages to ensure alignment.`;
  }

  // 4. Evidence
  const evidenceSection = `We draw your attention to the following substantiating evidence, which has been compiled to resolve this issue:

- **Primary Record**: ${supportingEvidence}
- **Measurement Log**: Entries verified in the physical **Measurement Book (M-Book)** under the supervision of the site engineer.
- **Site Quality Controls**: Concrete core test reports, compaction indices, and material delivery logs maintained at the site laboratory.
- **Site Progress Records**: Multi-angle time-stamped site photographs and daily progress logs showing equipment mobilization.`;

  // 5. Proposed Resolution
  let resolutionSection = `To resolve this billing dispute efficiently and accelerate outstanding invoice payments, we propose the following resolution strategy:\n\n> *"${resolutionStrategy}"*\n\n`;

  if (tone === 'COLLABORATIVE') {
    resolutionSection += `We suggest scheduling a joint verification meeting within the next 3 working days. Our senior project manager and billing head are prepared to review the M-Book entries side-by-side with your representatives to reach an amicable settlement.`;
  } else if (tone === 'FIRM') {
    resolutionSection += `We request your department to release the undisputed portion of the invoice (representing the remaining balance) immediately, while setting up a strict 5-day window to finalize the disputed amount of ${formattedDisputedAmount}. We expect a written confirmation of release to prevent delay claims.`;
  } else if (tone === 'FORMAL LEGAL') {
    resolutionSection += `Please consider this letter as our formal request for dispute reconciliation under Clause 20.1 of the General Conditions of Contract. Should we fail to reach a settlement within 14 days, we reserve the right to escalate this matter to the formal Arbitrator designated under the agreement.`;
  } else { // ANALYTICAL/EVIDENCE-BASED
    resolutionSection += `We request a technical review meeting at the project headquarters. We will bring the original batching plant logs and structural spreadsheets to reconcile the measurements mathematically.`;
  }

  // 6. Closure
  const closureSection = `We remain committed to delivering high-quality infrastructure for the state of Telangana and value our ongoing association with your office. We await your prompt response to schedule the reconciliation.

**Sincerely,**

**For AVINASH KANAPARTHI INFRA PRIVATE LIMITED**

*(Digitally Signed)*
**Chief Financial Officer & Contract Specialist**
Avinash Kanaparthi Infra Private Limited
Copy to: Managing Director, AKIPL; Project Division Office, Warangal/Telangana.`;

  // Combine into a structured Markdown format
  return `### LETTER HEADER
${headerSection}

---

### EXECUTIVE SUMMARY
${execSummary}

---

### DETAILED ANALYSIS OF DISPUTED ITEMS
${detailedAnalysis}

---

### SUBSTANTIATING EVIDENCE & ATTACHMENTS
${evidenceSection}

---

### PROPOSED RESOLUTION PATH & NEXT STEPS
${resolutionSection}

---

### FORMAL CLOSURE
${closureSection}`;
}

module.exports = {
  generateMockLetter
};
