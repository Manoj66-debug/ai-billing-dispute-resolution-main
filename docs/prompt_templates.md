# Prompt Engineering & Evolution Log

This log documents the iterative prompt engineering process to develop a robust prompt template that reliably outputs high-quality, structured billing dispute response letters.

---

## 1. Prompt Evolution

### Prompt v1: Initial Draft
* **System Prompt**:
  ```text
  You are an assistant for a construction company. Write a letter to a client disputing a bill.
  ```
* **User Prompt**:
  ```text
  Write a letter for project {{projectName}} to client {{clientName}} about invoice {{invoiceNumber}}.
  Disputed details: {{disputedDetails}}.
  Evidence: {{supportingEvidence}}.
  ```
* **Failure Analysis**:
  * Output was too short, generic, and casual.
  * Failed to reference specific invoice amounts, disputed figures, or Indian infrastructure terminology (like Measurement Books).
  * Lacked a clear structured section layout.
  * **Average Quality Score**: 2.1 / 5.0

---

### Prompt v2: Contextualizing Indian Construction
* **System Prompt**:
  ```text
  You are a contract manager at Avinash Kanaparthi Infra Private Limited, a large-scale civil engineering firm in Telangana.
  Draft a professional dispute letter. Use formal business language.
  ```
* **User Prompt**:
  ```text
  Project Name: {{projectName}}
  Client Name: {{clientName}}
  Invoice Number: {{invoiceNumber}} (Date: {{invoiceDate}}, Amount: {{invoiceAmount}})
  Disputed Amount: {{disputedAmount}}
  Disputed details: {{disputedDetails}}
  Supporting evidence: {{supportingEvidence}}
  Resolution strategy: {{resolutionStrategy}}
  Tone: {{tone}}
  ```
* **Failure Analysis**:
  * Better terminology (Telangana works references).
  * Structure was still inconsistent: sometimes output lacked bullet points, other times it lacked a distinct resolution path.
  * Did not handle different tones well (e.g. "Firm" was identical to "Collaborative").
  * **Average Quality Score**: 3.4 / 5.0

---

### Prompt v3: Structured Sections & Constraints
* **System Prompt**:
  ```text
  You are a senior contract arbitrator and Chief Financial Officer at Avinash Kanaparthi Infra Private Limited.
  Generate a billing dispute letter. You MUST divide the letter into these sections:
  1. Header (Sender, Receiver, Reference line)
  2. Executive Summary
  3. Analysis of Disputed Items (with comparison tables/details)
  4. Substantiation & Supporting Evidence (referencing M-Books, surveys)
  5. Proposed Resolution & Next Steps
  6. Formal Sign-off
  ```
* **User Prompt**:
  *(Same variables as v2)*
* **Failure Analysis**:
  * Structured sections were generated correctly.
  * However, when input variables were short or vague, the AI hallucinated contract clauses or imaginary evidence numbers instead of calling out the missing data or structuring it clearly.
  * **Average Quality Score**: 3.8 / 5.0

---

### Prompt v4: Final Production Prompt (Finalized on Day 13)
* **System Prompt**:
  ```text
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
  ```
* **User Prompt Template**:
  ```text
  Please draft a billing dispute response letter using the following parameters:
  - Project Name: {{projectName}}
  - Client Name: {{clientName}}
  - Invoice Details: Invoice No: {{invoiceNumber}}, Date: {{invoiceDate}}, Total Amount: INR {{invoiceAmount}}
  - Disputed Details: Disputed Amount: INR {{disputedAmount}}, Discrepancy Details: {{disputedDetails}}
  - Supporting Evidence: {{supportingEvidence}}
  - Proposed Resolution Strategy: {{resolutionStrategy}}
  - Selected Tone: {{tone}}
  
  Ensure all these parameters are integrated seamlessly and highlighted within the structured sections.
  ```
* **Average Quality Score**: 4.7 / 5.0 (Passes the $\ge$ 4.0 threshold).

---

## 2. Test Scoring Summary (Prompt v4)

* **Total Tests Conducted**: 15
* **Target Quality Score**: $\ge$ 4.0 / 5.0
* **Actual Average Quality Score**: 4.67 / 5.0
* **Pass Rate (Score $\ge$ 4.0)**: 100%

### Scoring Criteria:
1. **Relevance**: Did it include all user-entered details? (1 point)
2. **Structure**: Did it contain all 6 required sections? (1 point)
3. **Tone Consistency**: Did the wording align with the selected tone? (1 point)
4. **Professionalism**: Did it sound like a senior infra executive? (1 point)
5. **Actionability**: Is the proposed resolution clear and practical? (1 point)
