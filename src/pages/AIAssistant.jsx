import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/common/UI';
import { useAuthStore } from '../store';
import { formatRelative } from '../utils/helpers';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import '../styles/ai.css';

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
        setJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    setMessages(
      [{
        role: 'assistant',
        content: `Hello${user ? `, ${user.fullName?.split(' ')[0]}` : ''}! I'm your OpenWork AI Assistant.

I can help you with:

- Writing compelling, job-winning proposals
- Pricing strategy and rate negotiation
- Personalized skill gap analysis
- Job matching and career advice
- Profile optimization tips
- Dispute resolution guidance
- Invoicing and contracts

What would you like to work on today?`,
        time: new Date(),
      }]
    );
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
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message, time: new Date()
      }]);
    } catch (err) {
      // Fallback
      const fallback = getFallback(msg);
      setMessages(
        prev => [...prev,
        { role: 'assistant', content: fallback, time: new Date() }]);
      if (err.response?.status !== 402)
        toast.error('Live AI is unavailable right now, switched to offline assistant mode.');
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
    <div className="ai-assistant-container">
      <div className="ai-assistant-bg-orb-1" />
      <div className="ai-assistant-bg-orb-2" />
      <div className="ai-assistant-content" style={{ margin: '0 auto', padding: '1rem 1rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="sec-tag">🤖 AI-Powered Career Assistant</div>
          <h1 className="ai-header-title">OpenWork AI Assistant</h1>
          <p className="ai-header-desc">Your intelligent career partner for proposals, pricing, skills, and professional guidance.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.75rem', alignItems: 'start' }}>
          {/* Chat */}
          <div className="ai-chat-container">
            {/* Chat header */}
            <div className="ai-chat-header">
              <div className="ai-chat-icon">🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--txt)' }}>OpenWork AI Assistant</div>
                <div className="ai-chat-status">
                  <span style={{ width: 6, height: 6, background: 'var(--ok)', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px rgba(0,200,100,0.5)' }} />
                  Online · Ready to help
                </div>
              </div>
              <Button variant="ghost" size="xs" onClick={clearChat} style={{ color: 'var(--txt2)', transition: 'all 0.2s' }}>Clear Chat</Button>
            </div>

            {/* Messages */}
            <div className="ai-messages-container">
              {messages.map((msg, i) =>
              (
                <div key={i} className={`ai-msg ${msg.role === 'user' ? 'user' : 'assistant'}`} style={{ animation: 'fadeInUp 0.4s ease' }}>
                  <div className={`ai-bubble ${msg.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-assistant'}`}>
                    <div className="ai-markdown">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <div className="ai-time">{msg.role === 'assistant' ? 'OpenWork AI' : 'You'} · {msg.time ? formatRelative(msg.time) : ''}</div>
                </div>
              ))}
              {loading && (
                <div className="ai-msg assistant">
                  <div className={`ai-bubble ai-bubble-assistant`}>
                    <div className="typing"><div className="tdot" /><div className="tdot" /><div className="tdot" /></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>


            {/* Input */}
            <div className="ai-input-container">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about freelancing, proposals, skills..."
                rows={1}
                className="ai-textarea"
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="ai-send-btn">
                {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : '→'}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
            <div className="ai-sidebar-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.875rem' }}>
                <h3 className="ai-sidebar-title">⚡ Quick Actions</h3>
                {jobs.length > 0 && <span className="ai-sidebar-badge">{jobs.length} jobs</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '55vh', overflowY: 'auto', paddingRight: 6 }}>
                {getQuickActions(user, activeRole, jobs).length === 0 ? (
                  <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '.875rem 0' }}>
                    {jobsLoading ? 'Loading jobs...' : 'No quick actions available'}
                  </div>
                ) : (
                  getQuickActions(user, activeRole, jobs).map(a => (
                    <button key={a.key} onClick={() => sendMessage(a.prompt)} className="ai-action-btn" title={a.label}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{a.icon}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.label}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="ai-sidebar-card">
              <h3 className="ai-sidebar-title">📊 AI Capabilities</h3>
              {[['Proposal Writing', true], ['Job Matching', true], ['Skill Assessment', true], ['Pricing Intelligence', true], ['Dispute Guidance', true], ['Profile Review', false], ['Invoice Help', true], ['Rate Negotiation', true]].map(([cap, active]) => (
                <div key={cap} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.75rem', padding: '4px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <span style={{ color: 'var(--txt2)' }}>{cap}</span>
                  <span style={{ color: active ? 'var(--ok)' : 'rgba(255,100,100,0.7)', display: 'flex', alignItems: 'center', gap: '2px' }}>● {active ? 'Active' : 'Offline'}</span>
                </div>
              ))}
            </div>
            {/* 
            <div className="ai-privacy-card">
              <p className="ai-privacy-text">
                <strong style={{ color: '#fff
            </div> */}

            <div className="ai-privacy-card">
              <p className="ai-privacy-text">
                <strong style={{ color: '#fff' }}>🔒 Privacy:</strong> Your conversations are encrypted. Chat history is used only to provide context within this session and is never shared.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
