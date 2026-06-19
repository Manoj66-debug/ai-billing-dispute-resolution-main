import { useState, useEffect } from 'react';
import { 
  FileText, Send, History, BarChart3, Moon, Sun, 
  Copy, Download, Share2, Star, RefreshCw, 
  AlertTriangle, CheckCircle, FileCheck, Layers, Landmark
} from 'lucide-react';
import Login from './Login';

const API_BASE = '/api';

function App() {
  const [activeTab, setActiveTab] = useState('generator');
  const [theme, setTheme] = useState('dark');
  
  // Form State
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [disputedAmount, setDisputedAmount] = useState('');
  const [disputedDetails, setDisputedDetails] = useState('');
  const [supportingEvidence, setSupportingEvidence] = useState('');
  const [resolutionStrategy, setResolutionStrategy] = useState('');
  const [tone, setTone] = useState('ANALYTICAL/EVIDENCE-BASED');
  
  // UI & API States
  const [validationErrors, setValidationErrors] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [alert, setAlert] = useState(null);
  
  // Feedback States
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackHoverRating, setFeedbackHoverRating] = useState(0);

  // Authentication States
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('akinfras_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Stepper & M-Book Calculator States
  const [formStep, setFormStep] = useState(1);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcRate, setCalcRate] = useState('');
  const [calcBilledQty, setCalcBilledQty] = useState('');
  const [calcVerifiedQty, setCalcVerifiedQty] = useState('');

  // Theme toggle helper
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const showToast = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // API Calls
  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE}/templates`);
      const data = await res.json();
      if (data.success) setTemplates(data.templates);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
        if (data.history.length > 0 && !selectedHistoryItem) {
          // pre-select first item in history tab view
          fetchHistoryDetail(data.history[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const fetchHistoryDetail = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/history/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedHistoryItem(data.record);
      }
    } catch (err) {
      console.error('Error fetching history details:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/analytics`);
      const data = await res.json();
      if (data.success) setAnalytics(data.analytics);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  // Load presets, history and analytics on mount
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchTemplates();
    fetchHistory();
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Stepper & Calculator Validation
  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!projectName.trim()) errors.projectName = 'Project name is required';
      if (!clientName.trim()) errors.clientName = 'Client organization is required';
      
      if (!invoiceNumber.trim()) {
        errors.invoiceNumber = 'Invoice number is required';
      } else if (invoiceNumber.length > 30) {
        errors.invoiceNumber = 'Invoice number must be under 30 characters';
      }

      if (!invoiceDate) errors.invoiceDate = 'Invoice submission date is required';
      
      if (!invoiceAmount) {
        errors.invoiceAmount = 'Total invoice amount is required';
      } else if (parseFloat(invoiceAmount) <= 0) {
        errors.invoiceAmount = 'Invoice amount must be greater than zero';
      }
    } else if (step === 2) {
      if (!disputedAmount) {
        errors.disputedAmount = 'Disputed amount is required';
      } else if (parseFloat(disputedAmount) <= 0) {
        errors.disputedAmount = 'Disputed amount must be greater than zero';
      } else if (invoiceAmount && parseFloat(disputedAmount) > parseFloat(invoiceAmount)) {
        errors.disputedAmount = 'Disputed amount cannot exceed total invoice value';
      }

      if (!disputedDetails.trim()) {
        errors.disputedDetails = 'Discrepancy description is required';
      } else if (disputedDetails.length < 20) {
        errors.disputedDetails = 'Description must be at least 20 characters';
      }
    } else if (step === 3) {
      if (!supportingEvidence.trim()) {
        errors.supportingEvidence = 'Primary supporting evidence is required';
      }
      if (!resolutionStrategy.trim()) {
        errors.resolutionStrategy = 'Proposed resolution strategy is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = () => {
    return validateStep(1) && validateStep(2) && validateStep(3);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      showToast('danger', 'Please verify and complete all steps before drafting.');
      return;
    }

    setIsGenerating(true);
    setGeneratedResult(null);
    setFeedbackRating(0);
    setFeedbackComment('');
    setFeedbackSubmitted(false);

    const payload = {
      projectName,
      clientName,
      invoiceNumber,
      invoiceDate,
      invoiceAmount: parseFloat(invoiceAmount),
      disputedAmount: parseFloat(disputedAmount),
      disputedDetails,
      supportingEvidence,
      resolutionStrategy,
      tone
    };

    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        const fullText = data.data.generatedScript;
        setGeneratedResult({
          ...data.data,
          generatedScript: ''
        });
        setFeedbackRating(0);
        showToast('success', `AI drafting started in ${data.mode} mode...`);
        
        let currentLen = 0;
        const interval = setInterval(() => {
          currentLen += Math.min(25, fullText.length - currentLen);
          setGeneratedResult(prev => {
            if (!prev) return null;
            return {
              ...prev,
              generatedScript: fullText.substring(0, currentLen)
            };
          });
          
          if (currentLen >= fullText.length) {
            clearInterval(interval);
            showToast('success', 'Response letter fully drafted.');
          }
        }, 15);
        
        fetchHistory();
        fetchAnalytics();
      } else {
        showToast('danger', data.error || 'Generation failed.');
      }
    } catch (err) {
      showToast('danger', 'Server connection error. Please ensure backend is running.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    handleSubmit();
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (feedbackRating === 0) {
      showToast('warning', 'Please select a star rating first.');
      return;
    }

    const id = generatedResult ? generatedResult.id : (selectedHistoryItem ? selectedHistoryItem.id : null);
    if (!id) return;

    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationId: id,
          rating: feedbackRating,
          comment: feedbackComment
        })
      });
      const data = await res.json();
      if (data.success) {
        setFeedbackSubmitted(true);
        showToast('success', 'Feedback submitted. Thank you!');
        fetchHistory();
        fetchAnalytics();
      } else {
        showToast('danger', 'Failed to submit feedback.');
      }
    } catch (err) {
      showToast('danger', 'Could not save feedback.');
      console.error(err);
    }
  };

  // Preset quick fill
  const handlePresetSelect = (tpl) => {
    setProjectName(tpl.project_name);
    setClientName(tpl.client_name);
    setInvoiceNumber(tpl.invoice_number);
    setInvoiceAmount(tpl.invoice_amount.toString());
    setDisputedAmount(tpl.disputed_amount.toString());
    setDisputedDetails(tpl.disputed_details);
    setSupportingEvidence(tpl.supporting_evidence);
    setResolutionStrategy(tpl.resolution_strategy);
    setTone(tpl.tone);
    setValidationErrors({});
    showToast('success', `Loaded preset: ${tpl.title}`);
  };

  // Utility Actions
  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Copied to clipboard!');
  };

  const handleShare = (text) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Copied secure link share template!');
  };

  const handleExportTxt = (record) => {
    const text = record.generated_script || record.generatedScript;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dispute_letter_${record.invoice_number || record.invoiceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Downloaded text file.');
  };

  const handleExportPdf = () => {
    // Print triggers standard browser dialog styled nicely by @media print in index.css
    window.print();
  };

  const handleSignOut = () => {
    localStorage.removeItem('akinfras_user');
    setCurrentUser(null);
    showToast('success', 'Logged out successfully.');
  };

  if (!currentUser) {
    return (
      <Login 
        onAuthSuccess={(user) => setCurrentUser(user)} 
        theme={theme} 
        showToast={showToast} 
      />
    );
  }

  return (
    <div className="app-container">
      {/* Toast Alert */}
      {alert && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          maxWidth: '400px'
        }} className={`alert-banner ${alert.type === 'danger' ? '' : alert.type === 'warning' ? 'alert-banner-warning' : ''}`}>
          {alert.type === 'success' ? <CheckCircle size={18} style={{color: 'var(--success)'}} /> : <AlertTriangle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">AK</div>
          <div className="logo-text">
            <h1>AVINASH KANAPARTHI INFRA</h1>
            <span>Billing Dispute Resolution Center</span>
          </div>
        </div>

        <div className="header-actions">
          {/* User Profile */}
          <div className="user-profile-badge">
            <span style={{
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: 'var(--success)'
            }}></span>
            <span>{currentUser.email}</span>
          </div>

          {/* Navigation Tabs */}
          <nav className="nav-tabs">
            <button 
              className={`nav-tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
              onClick={() => setActiveTab('generator')}
            >
              <Send size={16} /> Generator
            </button>
            <button 
              className={`nav-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('history');
                fetchHistory();
              }}
            >
              <History size={16} /> History Log
            </button>
            <button 
              className={`nav-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('analytics');
                fetchAnalytics();
              }}
            >
              <BarChart3 size={16} /> Analytics
            </button>
          </nav>

          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="btn btn-secondary" style={{ padding: '0.5rem', borderRadius: '50%' }}>
            {theme === 'dark' ? <Sun size={18} style={{color: 'var(--warning)'}} /> : <Moon size={18} />}
          </button>

          {/* Sign Out */}
          <button onClick={handleSignOut} className="btn btn-secondary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.8rem', width: 'auto' }} title="Log out of system">
            Sign Out
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT CHANGER */}
      <main style={{ flexGrow: 1 }}>
        {/* TAB 1: GENERATOR */}
        {activeTab === 'generator' && (
          <div className="dashboard-grid">
            {/* Form Section */}
            <div className="glass-panel">
              <h2 className="panel-title"><Layers size={20} style={{color: 'var(--color-primary)'}} /> Dispute Intake Form</h2>
              
              {/* Presets */}
              <div className="presets-container">
                <label>Template Presets (Click to Auto-fill)</label>
                <div className="presets-grid">
                  {templates.map((tpl) => (
                    <button 
                      key={tpl.id} 
                      type="button" 
                      className="preset-card"
                      onClick={() => handlePresetSelect(tpl)}
                    >
                      <div className="preset-title">{tpl.title}</div>
                      <div className="preset-desc">{tpl.disputed_details}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stepper Progress Indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'relative', padding: '0 0.5rem', marginTop: '0.5rem' }}>
                <div style={{ position: 'absolute', top: '15px', left: '1rem', right: '1rem', height: '2px', background: 'rgba(255,255,255,0.06)', zIndex: '1' }}></div>
                <div style={{ position: 'absolute', top: '15px', left: '1rem', width: `${((formStep - 1) / 2) * 85}%`, height: '2px', background: 'var(--color-primary)', zIndex: '2', transition: 'width 0.3s ease' }}></div>
                
                {[1, 2, 3].map((step) => (
                  <button 
                    key={step}
                    type="button"
                    onClick={() => {
                      if (step < formStep) {
                        setFormStep(step);
                      } else if (step > formStep) {
                        let canAdvance = true;
                        for (let i = formStep; i < step; i++) {
                          if (!validateStep(i)) {
                            canAdvance = false;
                            break;
                          }
                        }
                        if (canAdvance) setFormStep(step);
                      }
                    }}
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: formStep >= step ? 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))' : 'var(--bg-secondary)', 
                      border: '1px solid var(--border-glass)',
                      color: formStep >= step ? '#0a0f1d' : 'var(--text-muted)',
                      fontWeight: '700',
                      zIndex: '3',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem'
                    }}
                  >
                    {step}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1.5rem', padding: '0 0.2rem', fontWeight: '500' }}>
                <span>1. Invoice Data</span>
                <span style={{ marginRight: '0.5rem' }}>2. Disputed Items</span>
                <span>3. Supporting Docs</span>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit}>
                {/* STEP 1: PROJECT & INVOICE METADATA */}
                {formStep === 1 && (
                  <div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Project Name & Location</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Warangal Bypass Highway Section 2"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          className={validationErrors.projectName ? 'error' : ''}
                        />
                        {validationErrors.projectName && <div className="input-error-msg">{validationErrors.projectName}</div>}
                      </div>

                      <div className="form-group">
                        <label>Client Organization</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Telangana Roads & Buildings Dept"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className={validationErrors.clientName ? 'error' : ''}
                        />
                        {validationErrors.clientName && <div className="input-error-msg">{validationErrors.clientName}</div>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Invoice Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. AKIPL/2026/RA-02"
                          value={invoiceNumber}
                          onChange={(e) => setInvoiceNumber(e.target.value)}
                          className={validationErrors.invoiceNumber ? 'error' : ''}
                        />
                        <div className="input-counter">
                          <span>{invoiceNumber.length}/30 chars</span>
                        </div>
                        {validationErrors.invoiceNumber && <div className="input-error-msg">{validationErrors.invoiceNumber}</div>}
                      </div>

                      <div className="form-group">
                        <label>Invoice Submission Date</label>
                        <input 
                          type="date" 
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                          className={validationErrors.invoiceDate ? 'error' : ''}
                        />
                        {validationErrors.invoiceDate && <div className="input-error-msg">{validationErrors.invoiceDate}</div>}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Total Billed Invoice Value (INR)</label>
                      <input 
                        type="number" 
                        placeholder="e.g. 5000000"
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(e.target.value)}
                        className={validationErrors.invoiceAmount ? 'error' : ''}
                      />
                      {validationErrors.invoiceAmount && <div className="input-error-msg">{validationErrors.invoiceAmount}</div>}
                    </div>
                  </div>
                )}

                {/* STEP 2: DISPUTED VALUES & DETAILS */}
                {formStep === 2 && (
                  <div>
                    <div className="form-group" style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <label style={{ margin: '0' }}>Disputed/Withheld Amount (INR)</label>
                        <button 
                          type="button" 
                          className="auth-link" 
                          style={{ fontSize: '0.75rem' }} 
                          onClick={() => setShowCalculator(!showCalculator)}
                        >
                          {showCalculator ? '✕ Hide M-Book Calc' : '🧮 Open M-Book Calc'}
                        </button>
                      </div>
                      <input 
                        type="number" 
                        placeholder="e.g. 1200000"
                        value={disputedAmount}
                        onChange={(e) => setDisputedAmount(e.target.value)}
                        className={validationErrors.disputedAmount ? 'error' : ''}
                      />
                      {validationErrors.disputedAmount && <div className="input-error-msg">{validationErrors.disputedAmount}</div>}
                    </div>

                    {/* M-Book Concrete Quantity Calculator Box */}
                    {showCalculator && (
                      <div className="calculator-box">
                        <div className="calculator-title">
                          <span>🧮 M-Book Discrepancy Calculator</span>
                        </div>
                        <div className="form-row" style={{ marginBottom: '0.75rem' }}>
                          <div className="form-group" style={{ marginBottom: '0' }}>
                            <label style={{ fontSize: '0.75rem' }}>Billed Qty</label>
                            <input 
                              type="number" 
                              placeholder="e.g. 1360" 
                              value={calcBilledQty}
                              onChange={(e) => setCalcBilledQty(e.target.value)}
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                            />
                          </div>
                          <div className="form-group" style={{ marginBottom: '0' }}>
                            <label style={{ fontSize: '0.75rem' }}>Verified Qty</label>
                            <input 
                              type="number" 
                              placeholder="e.g. 1200" 
                              value={calcVerifiedQty}
                              onChange={(e) => setCalcVerifiedQty(e.target.value)}
                              style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                            />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                          <label style={{ fontSize: '0.75rem' }}>Unit Item Rate (INR)</label>
                          <input 
                            type="number" 
                            placeholder="e.g. 42500" 
                            value={calcRate}
                            onChange={(e) => setCalcRate(e.target.value)}
                            style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                          />
                        </div>

                        {/* Calculated Output details */}
                        {calcBilledQty && calcVerifiedQty && calcRate && (
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                              <span>Quantity Discrepancy:</span>
                              <span style={{ fontWeight: '600', color: 'var(--color-accent)' }}>
                                {(parseFloat(calcBilledQty) - parseFloat(calcVerifiedQty)).toFixed(2)} units
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Computed Cost Impact:</span>
                              <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                                {((parseFloat(calcBilledQty) - parseFloat(calcVerifiedQty)) * parseFloat(calcRate)).toLocaleString('en-IN', {
                                  style: 'currency',
                                  currency: 'INR',
                                  maximumFractionDigits: 0
                                })}
                              </span>
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            type="button" 
                            className="btn btn-primary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', width: 'auto' }}
                            disabled={!calcBilledQty || !calcVerifiedQty || !calcRate}
                            onClick={() => {
                              const diff = parseFloat(calcBilledQty) - parseFloat(calcVerifiedQty);
                              const rate = parseFloat(calcRate);
                              const computedValue = diff * rate;
                              setDisputedAmount(computedValue.toString());
                              
                              const calcText = `\n[Calc: Billed ${calcBilledQty} - Verified ${calcVerifiedQty} = Discrepancy ${diff.toFixed(2)} @ INR ${rate}/unit]`;
                              if (!disputedDetails.includes('[Calc:')) {
                                setDisputedDetails(prev => prev + calcText);
                              }
                              
                              showToast('success', 'Applied calculations to dispute amount!');
                              setShowCalculator(false);
                            }}
                          >
                            Apply to Form
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', width: 'auto' }}
                            onClick={() => setShowCalculator(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="form-group">
                      <label>Discrepancy Details & Description</label>
                      <textarea 
                        rows="4" 
                        placeholder="Describe exactly what the client is disputing (e.g. concrete measurement mismatch, steel price escalation, delay penalty)..."
                        value={disputedDetails}
                        onChange={(e) => setDisputedDetails(e.target.value)}
                        className={validationErrors.disputedDetails ? 'error' : ''}
                      />
                      <div className="input-counter">
                        <span>At least 20 characters</span>
                        <span>{disputedDetails.length} chars</span>
                      </div>
                      {validationErrors.disputedDetails && <div className="input-error-msg">{validationErrors.disputedDetails}</div>}
                    </div>
                  </div>
                )}

                {/* STEP 3: EVIDENCE, RESOLUTION & TONE */}
                {formStep === 3 && (
                  <div>
                    <div className="form-group">
                      <label>Primary Supporting Evidence / Documentation</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Measurement Book (M-Book) #14 Page 32-35, Batching Plant auto-delivery log"
                        value={supportingEvidence}
                        onChange={(e) => setSupportingEvidence(e.target.value)}
                        className={validationErrors.supportingEvidence ? 'error' : ''}
                      />
                      {validationErrors.supportingEvidence && <div className="input-error-msg">{validationErrors.supportingEvidence}</div>}
                    </div>

                    <div className="form-group">
                      <label>Proposed Dispute Resolution Strategy</label>
                      <textarea 
                        rows="3" 
                        placeholder="e.g. Request joint survey site inspection; demand immediate release of undisputed amount; submit revised calculations"
                        value={resolutionStrategy}
                        onChange={(e) => setResolutionStrategy(e.target.value)}
                        className={validationErrors.resolutionStrategy ? 'error' : ''}
                      />
                      {validationErrors.resolutionStrategy && <div className="input-error-msg">{validationErrors.resolutionStrategy}</div>}
                    </div>

                    <div className="form-group">
                      <label>Draft Response Tone</label>
                      <select value={tone} onChange={(e) => setTone(e.target.value)}>
                        <option value="ANALYTICAL/EVIDENCE-BASED">Analytical & Evidence-based (Focus on numbers & logs)</option>
                        <option value="COLLABORATIVE">Collaborative (Focus on partnership & joint audit)</option>
                        <option value="FIRM">Firm (Focus on payment deadlines & cash-flow impact)</option>
                        <option value="FORMAL LEGAL">Formal Legal (Focus on contract clauses & arbitration rules)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* STEPPER BUTTON BAR */}
                <div className="stepper-btn-bar">
                  {formStep > 1 ? (
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setFormStep(formStep - 1)}
                      style={{ width: 'auto' }}
                    >
                      Back
                    </button>
                  ) : (
                    <div></div> // placeholder for layout spacing
                  )}

                  {formStep < 3 ? (
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={() => {
                        if (validateStep(formStep)) {
                          setFormStep(formStep + 1);
                        } else {
                          showToast('danger', 'Please correct the errors in the active step.');
                        }
                      }}
                      style={{ width: 'auto' }}
                    >
                      Next Step
                    </button>
                  ) : (
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={isGenerating}
                      style={{ width: 'auto' }}
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="pulse-text" size={16} /> Generating...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Draft Response Letter
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Output Display Section */}
            <div className="glass-panel output-card">
              <div className="output-header">
                <h2 className="panel-title" style={{borderBottom: 'none', paddingBottom: '0', marginBottom: '0'}}>
                  <FileText size={20} style={{color: 'var(--color-primary)'}} /> Generated Letter Preview
                </h2>
                {generatedResult && (
                  <span className={`output-mode-badge ${generatedResult.mode === 'mock' ? 'badge-mock' : 'badge-live'}`}>
                    {generatedResult.mode === 'mock' ? 'Mock Heuristics' : 'Live AI Agent'}
                  </span>
                )}
              </div>

              {isGenerating ? (
                <div className="pulse-loader">
                  <div className="pulse-spinner">
                    <div className="pulse-circle"></div>
                    <div className="pulse-circle"></div>
                  </div>
                  <div className="pulse-text">AI Arbitrator is drafting letter...</div>
                </div>
              ) : generatedResult ? (
                <>
                  {generatedResult.mode === 'mock' && (
                    <div className="alert-banner alert-banner-warning">
                      <AlertTriangle size={16} />
                      <span><strong>Mock Mode active</strong>: Running locally. Set `GEMINI_API_KEY` in backend `.env` for active LLM generation.</span>
                    </div>
                  )}
                  
                  {/* Styled Rendered Letter */}
                  <div className="output-content">
                    {/* Rendered markdown sections with basic tag replacement */}
                    {generatedResult.generatedScript.split('---').map((chunk, idx) => {
                      // simple replacement of md bolding and list styling
                      let formatted = chunk
                        .replace(/### (.*)/g, '<h3>$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/> \*(.*?)\*/g, '<blockquote>$1</blockquote>')
                        .replace(/> (.*?)\n/g, '<blockquote>$1</blockquote>')
                        .replace(/- \*\*(.*?)\*\*: (.*)/g, '<li><strong>$1</strong>: $2</li>')
                        .replace(/- (.*)/g, '<li>$1</li>');
                      return <div key={idx} dangerouslySetInnerHTML={{ __html: formatted }} />;
                    })}
                  </div>

                  {/* Actions Bar */}
                  <div className="output-actions-bar">
                    <button className="btn btn-secondary" onClick={() => handleCopyText(generatedResult.generatedScript)}>
                      <Copy size={16} /> Copy
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleExportTxt(generatedResult)}>
                      <Download size={16} /> Txt
                    </button>
                    <button className="btn btn-secondary" onClick={handleExportPdf}>
                      <FileCheck size={16} /> Print/PDF
                    </button>
                    <button className="btn btn-secondary" onClick={() => handleShare(generatedResult.generatedScript)}>
                      <Share2 size={16} /> Share
                    </button>
                  </div>
                  <button 
                    className="btn btn-secondary" 
                    style={{marginTop: '0.75rem', width: '100%', borderColor: 'rgba(0, 242, 254, 0.2)'}}
                    onClick={handleRegenerate}
                  >
                    <RefreshCw size={16} /> Regenerate Response Letter
                  </button>

                  {/* Feedback Form */}
                  <div className="feedback-container">
                    <h4>How accurate is this dispute letter?</h4>
                    {!feedbackSubmitted ? (
                      <form onSubmit={handleFeedbackSubmit}>
                        <div className="rating-stars">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              type="button"
                              className={`star-btn ${val <= (feedbackHoverRating || feedbackRating) ? 'active' : ''}`}
                              onClick={() => setFeedbackRating(val)}
                              onMouseEnter={() => setFeedbackHoverRating(val)}
                              onMouseLeave={() => setFeedbackHoverRating(0)}
                            >
                              <Star size={24} fill={val <= (feedbackHoverRating || feedbackRating) ? 'var(--warning)' : 'none'} />
                            </button>
                          ))}
                        </div>
                        <div className="feedback-form">
                          <input 
                            type="text" 
                            placeholder="Add comments or suggestions for editing..."
                            value={feedbackComment}
                            onChange={(e) => setFeedbackComment(e.target.value)}
                          />
                          <button type="submit" className="btn btn-primary" style={{width: 'auto'}}>Submit</button>
                        </div>
                      </form>
                    ) : (
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.9rem', marginTop: '0.5rem'}}>
                        <CheckCircle size={18} />
                        <span>Feedback logged! Thank you for improving the model.</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: '4rem 1.5rem', color: 'var(--text-muted)', textAlign: 'center'}}>
                  <FileText size={48} strokeWidth={1} style={{marginBottom: '1rem'}} />
                  <h3>No Letter Generated Yet</h3>
                  <p style={{fontSize: '0.85rem', marginTop: '0.25rem'}}>Fill in the dispute details in the left panel and click draft response to start.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'history' && (
          <div className="glass-panel">
            <h2 className="panel-title"><History size={20} style={{color: 'var(--color-primary)'}} /> Dispute Generation Log</h2>
            
            {history.length === 0 ? (
              <div className="history-empty">
                <History size={48} strokeWidth={1} style={{marginBottom: '1rem'}} />
                <h3>No History Logs Found</h3>
                <p>Ensure backend database is seeded and you have run at least one generation.</p>
              </div>
            ) : (
              <div className="history-layout">
                {/* List Sidebar */}
                <div className="history-sidebar">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      className={`history-item-card ${selectedHistoryItem && selectedHistoryItem.id === item.id ? 'active' : ''}`}
                      onClick={() => fetchHistoryDetail(item.id)}
                    >
                      <div className="history-item-meta">
                        <span>Invoice: {item.invoice_number}</span>
                        <span>{new Date(item.created_at).toLocaleDateString('en-IN')}</span>
                      </div>
                      <div className="history-item-proj">{item.project_name}</div>
                      <div className="history-item-client">{item.client_name}</div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem'}}>
                        <span style={{
                          fontSize: '0.7rem', 
                          background: 'rgba(255,255,255,0.05)', 
                          padding: '0.15rem 0.4rem', 
                          borderRadius: '4px',
                          color: 'var(--color-primary)'
                        }}>{item.tone}</span>
                        {item.rating && (
                          <span style={{fontSize: '0.75rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.1rem'}}>
                            <Star size={12} fill="var(--warning)" /> {item.rating}/5
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Display Panel */}
                <div className="glass-panel output-card" style={{border: 'none', padding: '0', background: 'transparent'}}>
                  {selectedHistoryItem ? (
                    <>
                      <div className="output-header">
                        <div style={{display: 'flex', flexDirection: 'column'}}>
                          <h3 style={{fontSize: '1.1rem'}}>{selectedHistoryItem.project_name}</h3>
                          <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{selectedHistoryItem.client_name} | Invoice No: {selectedHistoryItem.invoice_number}</span>
                        </div>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                          <button className="btn btn-secondary" style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem'}} onClick={() => handleCopyText(selectedHistoryItem.generated_script)}>
                            <Copy size={14} /> Copy
                          </button>
                          <button className="btn btn-secondary" style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem'}} onClick={() => handleExportTxt(selectedHistoryItem)}>
                            <Download size={14} /> Txt
                          </button>
                        </div>
                      </div>

                      <div className="output-content" style={{maxHeight: '480px'}}>
                        {selectedHistoryItem.generated_script.split('---').map((chunk, idx) => {
                          let formatted = chunk
                            .replace(/### (.*)/g, '<h3>$1</h3>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/> \*(.*?)\*/g, '<blockquote>$1</blockquote>')
                            .replace(/> (.*?)\n/g, '<blockquote>$1</blockquote>')
                            .replace(/- \*\*(.*?)\*\*: (.*)/g, '<li><strong>$1</strong>: $2</li>')
                            .replace(/- (.*)/g, '<li>$1</li>');
                          return <div key={idx} dangerouslySetInnerHTML={{ __html: formatted }} />;
                        })}
                      </div>

                      {/* Display existing feedback or show feedback submission */}
                      <div className="feedback-container">
                        {selectedHistoryItem.rating ? (
                          <div>
                            <h4>Submitted Quality Evaluation</h4>
                            <div style={{display: 'flex', gap: '0.25rem', margin: '0.25rem 0'}}>
                              {[1, 2, 3, 4, 5].map((val) => (
                                <Star 
                                  key={val} 
                                  size={18} 
                                  fill={val <= selectedHistoryItem.rating ? 'var(--warning)' : 'none'} 
                                  color={val <= selectedHistoryItem.rating ? 'var(--warning)' : 'var(--text-dark)'} 
                                />
                              ))}
                            </div>
                            {selectedHistoryItem.comment && (
                              <p style={{fontSize: '0.85rem', color: 'var(--text-muted)', italic: 'true', marginTop: '0.25rem'}}>
                                "{selectedHistoryItem.comment}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <h4>Rate this stored draft:</h4>
                            <form onSubmit={handleFeedbackSubmit}>
                              <div className="rating-stars">
                                {[1, 2, 3, 4, 5].map((val) => (
                                  <button
                                    key={val}
                                    type="button"
                                    className={`star-btn ${val <= (feedbackHoverRating || feedbackRating) ? 'active' : ''}`}
                                    onClick={() => setFeedbackRating(val)}
                                    onMouseEnter={() => setFeedbackHoverRating(val)}
                                    onMouseLeave={() => setFeedbackHoverRating(0)}
                                  >
                                    <Star size={20} fill={val <= (feedbackHoverRating || feedbackRating) ? 'var(--warning)' : 'none'} />
                                  </button>
                                ))}
                              </div>
                              <div className="feedback-form">
                                <input 
                                  type="text" 
                                  placeholder="Review comment..."
                                  value={feedbackComment}
                                  onChange={(e) => setFeedbackComment(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary" style={{width: 'auto'}}>Submit</button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div style={{textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-muted)'}}>
                      Select an item from the sidebar to review details.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="glass-panel">
            <h2 className="panel-title"><BarChart3 size={20} style={{color: 'var(--color-primary)'}} /> Dispute Resolution Dashboard</h2>
            
            {analytics ? (
              <>
                {/* KPI Cards */}
                <div className="analytics-grid">
                  <div className="kpi-card">
                    <div className="kpi-icon"><Layers size={22} /></div>
                    <div className="kpi-data">
                      <h4>Drafts Generated</h4>
                      <p>{analytics.totalGenerations}</p>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-icon"><Star size={22} style={{color: 'var(--warning)'}} /></div>
                    <div className="kpi-data">
                      <h4>Model Quality Score</h4>
                      <p>{analytics.averageRating > 0 ? `${analytics.averageRating} / 5` : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-icon"><Landmark size={22} style={{color: 'var(--success)'}} /></div>
                    <div className="kpi-data">
                      <h4>Total Disputed Value</h4>
                      <p>{analytics.totalDisputedAmount.toLocaleString('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0
                      })}</p>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-icon"><RefreshCw size={22} /></div>
                    <div className="kpi-data">
                      <h4>Avg Compile Speed</h4>
                      <p>{(analytics.averageResponseTimeMs / 1000).toFixed(2)}s</p>
                    </div>
                  </div>
                </div>

                {/* Charts Area */}
                <div className="charts-section">
                  {/* Dispute Category Bar Chart */}
                  <div className="chart-card">
                    <h4>Dispute Categorization (By Volume)</h4>
                    <div className="chart-container">
                      {analytics.disputeTypeStats && analytics.disputeTypeStats.map((stat, idx) => {
                        const maxCount = Math.max(...analytics.disputeTypeStats.map(s => s.count)) || 1;
                        const pctHeight = `${(stat.count / maxCount) * 100}%`;
                        
                        return (
                          <div className="bar-chart-item" key={idx} style={{width: '18%'}}>
                            <div className="bar-graphic-container">
                              <div 
                                className="bar-graphic" 
                                style={{ height: pctHeight }}
                                data-val={stat.count}
                              ></div>
                            </div>
                            <span className="bar-label" title={stat.category}>{stat.category}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quality Trend list */}
                  <div className="chart-card">
                    <h4>Daily Average Quality Rating Trend</h4>
                    <div className="trend-chart-list">
                      {analytics.qualityTrend && analytics.qualityTrend.length > 0 ? (
                        analytics.qualityTrend.map((row, idx) => {
                          const widthPct = `${(row.avgRating / 5.0) * 100}%`;
                          return (
                            <div className="trend-row" key={idx}>
                              <span className="trend-label">{row.date}</span>
                              <div className="trend-bar-wrapper">
                                <div className="trend-bar-fill" style={{ width: widthPct }}></div>
                              </div>
                              <span className="trend-val">{row.avgRating} ★</span>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{textAlign: 'center', color: 'var(--text-muted)', padding: '2rem'}}>
                          No quality evaluations logged yet. Rate generated letters to populate.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Activities list */}
                <div className="glass-panel" style={{marginTop: '1.5rem', background: 'rgba(0,0,0,0.1)'}}>
                  <h4>Recent Dispute Filings</h4>
                  <div style={{overflowX: 'auto', marginTop: '0.75rem'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left'}}>
                      <thead>
                        <tr style={{borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)'}}>
                          <th style={{padding: '0.5rem'}}>Invoice No</th>
                          <th style={{padding: '0.5rem'}}>Project Name</th>
                          <th style={{padding: '0.5rem'}}>Client</th>
                          <th style={{padding: '0.5rem', textAlign: 'right'}}>Disputed Amount</th>
                          <th style={{padding: '0.5rem'}}>Date Logged</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.slice(0, 5).map((h) => (
                          <tr key={h.id} style={{borderBottom: '1px solid rgba(255,255,255,0.02)'}}>
                            <td style={{padding: '0.5rem', fontWeight: '600'}}>{h.invoice_number}</td>
                            <td style={{padding: '0.5rem'}}>{h.project_name}</td>
                            <td style={{padding: '0.5rem'}}>{h.client_name}</td>
                            <td style={{padding: '0.5rem', textAlign: 'right', fontWeight: '500', color: 'var(--color-primary)'}}>
                              {h.disputed_amount.toLocaleString('en-IN', {style: 'currency', currency: 'INR', maximumFractionDigits: 0})}
                            </td>
                            <td style={{padding: '0.5rem'}}>{new Date(h.created_at).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div style={{textAlign: 'center', padding: '4rem', color: 'var(--text-muted)'}}>
                Compiling dashboard analytics...
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer>
        <p>&copy; {new Date().getFullYear()} Avinash Kanaparthi Infra Private Limited. Internal AI Contract Arbitration Portal. All rights reserved.</p>
        <p style={{fontSize: '0.65rem', marginTop: '0.25rem', color: 'var(--text-dark)'}}>Powered by Gemini 1.5 & Node.js Express. Strictly Confidential.</p>
      </footer>
    </div>
  );
}

export default App;
