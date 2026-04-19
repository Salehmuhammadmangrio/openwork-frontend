import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/common/UI';
import { useAuthStore } from '../store';
import { formatRelative } from '../utils/helpers';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SUGGESTIONS = ['Write a proposal', 'Pricing advice', 'Skill gap analysis', 'Find matching jobs', 'Profile optimization'];

const getQuickActions = (user, activeRole, availableJobs = []) => {
  const skillsList = user?.skills?.join(', ') || 'full stack';
  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const location = user?.location || 'your region';
  const aiScore = user?.aiSkillScore || 85;
  const isFreelancer = activeRole === 'freelancer' || (user?.role === 'freelancer' && !activeRole);

  const baseActions = [
    { 
      key: 'proposal', 
      icon: '📝', 
      label: 'Write a Proposal', 
      prompt: `Help me write a compelling proposal for a React.js SaaS dashboard development job. I'm ${firstName}, a ${skillsList} developer with experience in my field. Make it engaging and address the specific project requirements.` 
    },
    { 
      key: 'pricing', 
      icon: '💰', 
      label: 'Pricing Advice', 
      prompt: `What should I charge as a ${skillsList} developer${isFreelancer ? ` in ${location}` : ''}? My AI skill score is ${aiScore}. What hourly rate and project pricing would be competitive yet profitable?` 
    },
    { 
      key: 'skills', 
      icon: '🧠', 
      label: 'Skill Gap Analysis', 
      prompt: `I have skills in ${skillsList}. Analyze what skills I should learn next to advance my career and increase my earning potential in 2025, prioritized by market demand and ROI.` 
    },
    { 
      key: 'jobs', 
      icon: '🔍', 
      label: 'Job Recommendations', 
      prompt: `What types of jobs would best suit a ${skillsList} developer with an AI skill score of ${aiScore}${isFreelancer ? ` located in ${location}` : ''}? Which job categories should I target?` 
    },
    { 
      key: 'profile', 
      icon: '👤', 
      label: 'Optimize Profile', 
      prompt: `How can I optimize my OpenWork ${isFreelancer ? 'freelancer' : 'client'} profile to attract better opportunities? What are the most important elements to highlight?` 
    },
    { 
      key: 'dispute', 
      icon: '⚖️', 
      label: 'Dispute Guidance', 
      prompt: `A client refuses to approve my deliverables even though I delivered exactly what was specified. What steps should I take to resolve this professionally?` 
    },
    { 
      key: 'invoice', 
      icon: '🧾', 
      label: 'Invoice Help', 
      prompt: `What should be included in a professional freelancer invoice${isFreelancer ? ` for a client in my region` : ''}? How do I handle taxes and ensure proper documentation?` 
    },
    { 
      key: 'rate', 
      icon: '📊', 
      label: 'Rate Negotiation', 
      prompt: `A client thinks my rate is too high and wants to negotiate lower. How should I respond professionally while maintaining my value?` 
    },
  ];

  // Add job-based quick actions (limit to 8 most recent)
  const jobActions = (availableJobs || []).slice(0, 8).map((job, idx) => ({
    key: `job_${job._id}`,
    icon: '💼',
    label: job.title.substring(0, 25) + (job.title.length > 25 ? '...' : ''),
    prompt: `Help me write a professional proposal for this job: "${job.title}". 
    
Category: ${job.category}
Budget: $${job.budgetMin}–${job.budgetMax} (${job.budgetType})
Duration: ${job.duration}
Experience Level: ${job.experienceLevel}
Required Skills: ${(job.skills || []).join(', ') || 'Not specified'}

Description: ${job.description}

I'm a ${skillsList} developer with AI score ${aiScore}. Create a compelling, concise proposal that addresses the specific requirements and demonstrates how my skills match this job.`
  }));

  return [...baseActions, ...jobActions];
};

function formatAIText(text) {
  if (!text || typeof text !== 'string') return '';

  let formatted = text.trim();

  // 1. Handle fenced code blocks (if any)
  formatted = formatted.replace(/```(?:\w+)?\n?([\s\S]*?)```/g, (match, codeContent) => {
    const code = (codeContent || '').trim();
    if (!code) return '';
    const indented = code.split('\n').map(line => `    ${line}`).join('\n');
    return `\nCode Example:\n${indented}\n`;
  });

  // 2. Inline code
  formatted = formatted.replace(/`([^`]+)`/g, '$1');

  // 3. Convert emoji numbers (1️⃣ 2️⃣ etc.) to clean bold headings
  formatted = formatted.replace(/(\d️⃣)\s*/g, '\n**$1** ');

  // 4. Improved table handling
  const lines = formatted.split('\n');
  const processedLines = [];
  let inTable = false;
  let tableHeaders = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '');

      if (cells.length < 2) {
        processedLines.push(line);
        continue;
      }

      if (!inTable) {
        inTable = true;
        if (i + 1 < lines.length && lines[i + 1].trim().match(/^[\-\|\:\s]+$/)) {
          tableHeaders = cells;
          i++;
          continue;
        }
      }

      if (tableHeaders.length > 0 && cells.length === tableHeaders.length) {
        for (let j = 0; j < cells.length; j++) {
          if (tableHeaders[j] && cells[j]) {
            processedLines.push(`• ${tableHeaders[j]}: ${cells[j]}`);
          }
        }
        processedLines.push('');
      } else {
        processedLines.push(cells.join(' • '));
      }
    }
    else if (line.match(/^[\-\|\:\s]+$/)) {
      continue; // skip separator
    }
    else {
      if (inTable) {
        inTable = false;
        tableHeaders = [];
        if (processedLines.length > 0) processedLines.push('');
      }

      // Convert blockquotes
      if (line.startsWith('>')) {
        line = '“' + line.replace(/^>\s?/, '') + '”';
      }

      processedLines.push(line);
    }
  }

  formatted = processedLines.join('\n');

  // 5. Clean markdown and make it proposal-friendly
  formatted = formatted.replace(/^#{1,6}\s+/gm, '');           // remove headers
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '$1');       // bold
  formatted = formatted.replace(/\*(.*?)\*/g, '$1');           // italic
  formatted = formatted.replace(/~~(.*?)~~/g, '$1');

  // 6. Improve list formatting
  formatted = formatted.replace(/^\s*[-*+]\s+/gm, '• ');
  formatted = formatted.replace(/^\s*\d+\.\s+/gm, '• ');

  // 7. Clean up common AI fluff
  const fluff = [
    /As an AI language model/gi,
    /I'm an AI assistant/gi,
    /I hope this helps/gi,
    /Let me know if you need anything else/gi,
    /Feel free to ask questions/gi,
  ];
  fluff.forEach(regex => formatted = formatted.replace(regex, ''));

  // 8. Final cleanup
  formatted = formatted.replace(/\n{3,}/g, '\n\n');   // max one blank line
  formatted = formatted.replace(/^\s+$/gm, '');
  formatted = formatted.trim();

  // 9. Make first letter capital if needed
  if (formatted && /^[a-z]/.test(formatted[0])) {
    formatted = formatted[0].toUpperCase() + formatted.slice(1);
  }

  return formatted;
}
export default function AIAssistant() {
  const { user, isAuthenticated, activeRole } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSugs, setShowSugs] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch available jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await api.get('/jobs', { params: { status: 'open', limit: 50 } });
        setJobs(data.jobs || []);
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
        setJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: `Hello${user ? `, ${user.fullName?.split(' ')[0]}` : ''}! I'm your OpenWork AI Assistant.

I can help you with:
• Writing compelling, job-winning proposals
• Pricing strategy and rate negotiation  
• Personalized skill gap analysis
• Job matching and career advice
• Profile optimization tips
• Dispute resolution guidance
• Invoicing and contracts

What would you like to work on today?`,
      time: new Date(),
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setInput('');
    setShowSugs(false);

    const userMsg = { role: 'user', content: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.concat(userMsg).map(m => ({ role: m.role, content: m.content }));
      const canClient = user?.role === 'client' || user?.canActAsClient;
      const roleMode = activeRole || (canClient ? 'client' : 'freelancer');
      const systemContext = user ? `User: ${user.fullName}, Role: ${roleMode}, Skills: ${user.skills?.join(', ')}, AI Score: ${user.aiSkillScore}, Location: ${user.location}` : '';

      const { data } = await api.post(
        '/ai/chat',
        { messages: history, systemContext },
        { meta: { skipAuthRedirect: true } }
      );
      setMessages(prev => [...prev, { role: 'assistant', content: data.message, time: new Date() }]);
    } catch (err) {
      // Fallback
      const fallback = getFallback(msg);
      setMessages(prev => [...prev, { role: 'assistant', content: fallback, time: new Date() }]);
      if (err.response?.status !== 402) toast.error('Live AI is unavailable right now, switched to offline assistant mode.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const getFallback = (msg) => {
    const m = msg.toLowerCase();
    if (m.includes('proposal')) return `Strong Proposal Framework:

1. Opening Hook — Reference their specific project goal directly, show you read the full description.

2. Your Match — List 2–3 directly relevant experiences with outcomes. Use numbers: "Built a similar dashboard serving 50K users."

3. Your Approach — Briefly outline your method: tech stack, milestones, testing plan.

4. Timeline & Deliverables — Be specific: "Week 1: wireframes, Week 2–3: core features, Week 4: testing + handoff"

5. Call to Action — "Available for a 20-min discovery call — happy to share relevant portfolio examples."

Keep under 250 words. Clients scan, not read.`;
    if (m.includes('price') || m.includes('rate') || m.includes('charge')) return `Freelancing Rates in South Asia (2025):

Web Development:
• Junior (0–2 yrs): $15–30/hr
• Mid (2–5 yrs): $35–65/hr
• Senior (5+ yrs): $70–120/hr

UI/UX Design: Junior: $12–25 · Mid: $28–50 · Senior: $60–100/hr

Data Science/ML: Junior: $20–40 · Mid: $45–80 · Senior: $85–150/hr

Strategy:
• AI Score 85+ justifies mid-senior pricing
• Fixed-price projects: add 20% premium over hourly
• Never quote below $20/hr — signals low quality
• Increase rates after every 5 positive reviews`;
    if (m.includes('skill')) return `Top Skills to Learn in 2025 for Max ROI:

Immediate (0–3 months):
• TypeScript — adds ~30% to React rates
• Next.js 14 (App Router, Server Components) — very in-demand
• AI/LLM integration (OpenAI API, LangChain) — massive demand surge

Medium-term (3–6 months):
• tRPC + Prisma (type-safe full-stack)
• Playwright/Vitest (testing commands premium)
• Docker + basic Kubernetes

Start with TypeScript — it's the highest ROI skill for JavaScript developers right now. Most clients specifically request it.`;
    if (m.includes('dispute')) return `Dispute Resolution — Step by Step:

1. Document everything — screenshots of requirements, all messages, deliverable files
2. Direct communication — send a professional, fact-based summary to the client
3. Raise a dispute in your OpenWork dashboard → Orders → Raise Dispute
4. Provide evidence — original scope agreement, chat logs, deliverable files
5. Admin review — our team reviews within 24–48 hours

Common outcomes: Full payment release, partial refund, or scope revision.

Always agree on deliverables in writing before starting work. Never deliver final files before payment is secured in escrow.`;
    return `Thanks for your question! I can help with:

• Proposals — Complete, ready-to-send text
• Pricing — Specific numbers for your market
• Skills — Learning roadmap with priorities
• Profile — What clients actually look for
• Disputes — Step-by-step resolution process
• Contracts — What to include and what to avoid

What specific challenge can I help you solve today?`;
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', content: 'Chat cleared. How can I help you?', time: new Date() }]);
    setShowSugs(true);
    inputRef.current?.focus();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ margin: '0 auto', padding: '1rem 1rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="sec-tag">AI-Powered Career Assistant</div>
          <h1 style={{ fontSize: 'clamp(1.75rem,4vw,2.5rem)', fontWeight: 800, margin: '.65rem 0' }}>OpenWork AI Assistant</h1>
          <p style={{ color: 'var(--txt2)', fontSize: '1rem', maxWidth: 520, margin: '0 auto' }}>Your intelligent career partner for proposals, pricing, skills, and professional guidance.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.75rem', alignItems: 'start' }}>
          {/* Chat */}
          <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 20, display: 'flex', flexDirection: 'column', minHeight: "100vh", maxHeight: '100vh', boxShadow: 'var(--inv-shadow)', overflow: 'hidden' }}>
            {/* Chat header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: 'var(--g1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--txt)' }}>OpenWork AI Assistant</div>
                <div style={{ fontSize: '.75rem', color: 'var(--txt2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, background: 'var(--ok)', borderRadius: '50%', display: 'inline-block' }} />
                  Online · Ready to help
                </div>
              </div>
              <Button variant="ghost" size="xs" onClick={clearChat}>Clear Chat</Button>
            </div>

            {/* Messages */}
            <div className="ai-messages" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg, i) =>
              (
                <div key={i} className={`ai-msg ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                  <div className="ai-bubble">
                    {formatAIText(msg.content)}
                  </div>
                  <div className="ai-time">{msg.role === 'assistant' ? 'OpenWork AI' : 'You'} · {msg.time ? formatRelative(msg.time) : ''}</div>
                </div>
              ))}
              {loading && (
                <div className="ai-msg assistant">
                  <div className="ai-bubble" style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: '18px 18px 18px 4px' }}>
                    <div className="typing"><div className="tdot" /><div className="tdot" /><div className="tdot" /></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {showSugs && (
              <div style={{ padding: '0 1.5rem 1rem', borderTop: '1px solid var(--b1)' }}>
                <div style={{ fontSize: '.8rem', color: 'var(--txt2)', marginBottom: '.5rem', fontWeight: 600 }}>Quick Start</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => sendMessage(s)} style={{ fontSize: '.8rem', padding: '6px 14px', background: 'var(--s2)', color: 'var(--txt2)', border: '1px solid var(--b2)', borderRadius: '20px', cursor: 'pointer', transition: 'all .2s', fontFamily: 'Outfit,sans-serif', fontWeight: 500 }}
                      onMouseEnter={e => { e.target.style.color = 'var(--acc)'; e.target.style.borderColor = 'rgba(108,78,246,.3)'; e.target.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.target.style.color = 'var(--txt2)'; e.target.style.borderColor = 'var(--b2)'; e.target.style.transform = 'translateY(0)'; }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid var(--b1)' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about freelancing, proposals, skills..."
                  rows={1}
                  style={{ flex: 1, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 12, padding: '12px 16px', color: 'var(--txt)', fontFamily: 'Outfit,sans-serif', fontSize: '.9rem', outline: 'none', resize: 'none', maxHeight: 120, transition: 'border-color .2s', lineHeight: 1.4 }}
                  onFocus={e => e.target.style.borderColor = 'var(--acc)'}
                  onBlur={e => e.target.style.borderColor = 'var(--b2)'}
                />
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{ width: 44, height: 44, background: !input.trim() || loading ? 'var(--s3)' : 'var(--g1)', border: 'none', borderRadius: 12, cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', transition: 'all .2s', flexShrink: 0, boxShadow: !input.trim() || loading ? 'none' : '0 4px 12px rgba(108,78,246,0.3)' }}>
                  {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : '→'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
            <div className="card" style={{ padding: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.875rem' }}>
                <h3 style={{ fontSize: '.845rem', fontWeight: 700, margin: 0 }}>⚡ Quick Actions</h3>
                {jobs.length > 0 && <span style={{ fontSize: '.65rem', background: 'rgba(108,78,246,.2)', color: 'var(--acc)', padding: '2px 6px', borderRadius: 6 }}>{jobs.length} jobs</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '55vh', overflowY: 'auto', paddingRight: 6 }}>
                {getQuickActions(user, activeRole, jobs).length === 0 ? (
                  <div style={{ fontSize: '.75rem', color: 'var(--txt3)', textAlign: 'center', padding: '.875rem 0' }}>
                    {jobsLoading ? 'Loading jobs...' : 'No quick actions available'}
                  </div>
                ) : (
                  getQuickActions(user, activeRole, jobs).map(a => (
                    <button key={a.key} onClick={() => sendMessage(a.prompt)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: 9, cursor: 'pointer', transition: 'all .2s', color: 'var(--txt2)', fontSize: '.78rem', fontFamily: 'Outfit,sans-serif', textAlign: 'left', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={a.label}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,78,246,.3)'; e.currentTarget.style.color = 'var(--txt)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--txt2)'; }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{a.icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.label}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="card" style={{ padding: '0.875rem' }}>
              <h3 style={{ fontSize: '.845rem', fontWeight: 700, marginBottom: '.75rem' }}>📊 AI Capabilities</h3>
              {[['Proposal Writing', true], ['Job Matching', true], ['Skill Assessment', true], ['Pricing Intelligence', true], ['Dispute Guidance', true], ['Profile Review', false], ['Invoice Help', true], ['Rate Negotiation', true]].map(([cap, active]) => (
                <div key={cap} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', padding: '4px 0', borderBottom: '1px solid var(--b1)' }}>
                  <span style={{ color: 'var(--txt2)' }}>{cap}</span>
                  <span style={{ color: active ? 'var(--ok)' : 'var(--err)' }}>● {active ? 'Active' : 'Offline'}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ background: 'rgba(108,78,246,.05)', borderColor: 'rgba(108,78,246,.18)', padding: '0.875rem' }}>
              <p style={{ fontSize: '.75rem', color: 'var(--txt2)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--txt)' }}>🔒 Privacy:</strong> Your conversations are encrypted. Chat history is used only to provide context within this session and is never shared.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
