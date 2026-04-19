// ─── LANDING ─────────────────────────────────────────────────
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Hero, HowItWorks, Features, Testimonials, CTA, Footer } from '../components/landingpage';

export function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => { if (isAuthenticated) navigate('/dashboard'); }, [isAuthenticated]);

  const features = [
    { icon: '🧠', title: 'AI Skill Certification', desc: 'Verified scores across 50+ domains. AI scores build trust with clients instantly.' },
    { icon: '🎯', title: 'Smart Job Matching', desc: 'ML engine matches you with jobs where your success probability is highest.' },
    { icon: '🔒', title: 'Escrow Protection', desc: 'Milestone-based escrow via Stripe. Funds locked until work is approved.' },
    { icon: '💬', title: 'Real-Time Chat', desc: 'WebSocket messaging with file sharing. Full conversation history.' },
    { icon: '📊', title: 'Analytics Dashboard', desc: 'Chart.js earnings graphs, proposal rates, AI score trends helps better to undersatnd.' },
    { icon: '⚡', title: 'Open Offers', desc: 'List services with Basic/Standard/Premium packages. Clients buy instantly.' },
  ];

  const testimonials = [
    { name: 'Aisha Khan', role: 'Full Stack Dev · Lahore', rating: 5, text: '"The AI skill test gave me credibility I couldn\'t get elsewhere. Within 2 weeks, 3 project offers."', ini: 'AK', color: 'linear-gradient(135deg,#6C4EF6,#9B6DFF)' },
    { name: 'Rahul Sharma', role: 'CTO · TechBridge', rating: 5, text: '"We hired 3 developers through OpenWork. AI pre-screening saved us days of interviews."', ini: 'RS', color: 'linear-gradient(135deg,#FF6B35,#FF4D6A)' },
    { name: 'Muhammad Hassan', role: 'UI/UX · Sukkur', rating: 5, text: '"OpenWork\'s fair AI ranking changed everything. My skills speak for themselves now."', ini: 'MH', color: 'linear-gradient(135deg,#00E5C3,#00B894)' },
  ];

  return (
    <div style={{ paddingTop: 64 }}>
      {/* HERO */}
      <Hero navigate={navigate}/>

      <HowItWorks/>

      {/* FEATURES */}
      <Features features={features} />

      {/* TESTIMONIALS */}
      <Testimonials testimonials={testimonials} />

      {/* CTA */}
      <CTA navigate={navigate}/>

      {/* FOOTER */}
      <Footer Link={Link}/>
    </div>
  );
}
export default Landing;
