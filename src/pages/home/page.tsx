import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useApp } from '@/context/AppContext';
import HeroScreen from './components/HeroScreen';
import ParticleCanvas from './components/ParticleCanvas';
import ChatScreen from './components/ChatScreen';
import ResultScreen from './components/ResultScreen';
import LeadCaptureScreen from './components/LeadCaptureScreen';
import ThankYouScreen from './components/ThankYouScreen';
import { ensureCareerDataSeeded } from '@/services/claude';

const ANALYTICS_KEY = 'galileo_orientador_analytics';

interface AnalyticsEvent {
  event: string;
  timestamp: number;
  data?: Record<string, string>;
}

function getAnalytics(): AnalyticsEvent[] {
  try {
    return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
  } catch {
    return [];
  }
}

function trackEvent(event: string, data?: Record<string, string>) {
  const analytics = getAnalytics();
  analytics.push({ event, timestamp: Date.now(), data });
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
}

// Expose analytics summary to window
if (typeof window !== 'undefined') {
  (window as Record<string, unknown>).getAnalyticsSummary = () => {
    const events = getAnalytics();
    const totalSessions = events.filter((e) => e.event === 'hero_view').length;
    const completions = events.filter((e) => e.event === 'lead_submit').length;
    const rate = totalSessions > 0 ? Math.round((completions / totalSessions) * 100) : 0;

    const careerCounts: Record<string, number> = {};
    events
      .filter((e) => e.event === 'result_view' && e.data?.career)
      .forEach((e) => {
        const c = e.data?.career || 'unknown';
        careerCounts[c] = (careerCounts[c] || 0) + 1;
      });

    const topCareer = Object.entries(careerCounts).sort((a, b) => b[1] - a[1])[0];

    const firstEvents = events.filter((e) => e.event === 'hero_view');
    const lastEvents = events.filter((e) => e.event === 'lead_submit');
    const avgTime =
      firstEvents.length > 0 && lastEvents.length > 0
        ? Math.round(
            lastEvents.reduce((sum, e) => sum + e.timestamp, 0) / lastEvents.length -
              firstEvents.reduce((sum, e) => sum + e.timestamp, 0) / firstEvents.length
          ) / 1000
        : 0;

    return {
      totalSessions,
      completions,
      conversionRate: `${rate}%`,
      topCareer: topCareer ? `${topCareer[0]} (${topCareer[1]})` : 'N/A',
      avgTimeSeconds: avgTime,
    };
  };
}

const slideVariants = {
  enter: { x: '30%', opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: '-30%', opacity: 0 },
};

function OrientadorApp() {
  const { state, dispatch } = useApp();
  const [showParticles, setShowParticles] = useState(true);

  useEffect(() => {
    trackEvent('hero_view');
  }, []);

  // Auto-seed career embeddings table on first load
  useEffect(() => {
    ensureCareerDataSeeded();
  }, []);

  const handleStart = useCallback(() => {
    trackEvent('cta_click');
    setShowParticles(false);
    dispatch({ type: 'SET_SCREEN', payload: 'chat' });
    trackEvent('chat_start');
  }, [dispatch]);

  const handleChatComplete = useCallback(() => {
    trackEvent('chat_complete');
    dispatch({ type: 'SET_SCREEN', payload: 'result' });
    trackEvent('result_view', {
      career: state.recommendation?.primary.shortName || '',
    });
  }, [dispatch, state.recommendation]);

  const handleContinueToLead = useCallback(() => {
    trackEvent('lead_start', {
      career: state.recommendation?.primary.shortName || '',
    });
    dispatch({ type: 'SET_SCREEN', payload: 'lead' });
  }, [dispatch, state.recommendation]);

  const handleLeadSubmit = useCallback(() => {
    trackEvent('lead_submit', {
      career: state.recommendation?.primary.shortName || '',
    });
    dispatch({ type: 'SET_SCREEN', payload: 'thanks' });
  }, [dispatch, state.recommendation]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
    setShowParticles(true);
    trackEvent('hero_view');
  }, [dispatch]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-galileo-navy">
      {showParticles && <ParticleCanvas />}

      <AnimatePresence mode="wait">
        {state.screen === 'hero' && (
          <motion.div
            key="hero"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <HeroScreen onStart={handleStart} />
          </motion.div>
        )}

        {state.screen === 'chat' && (
          <motion.div
            key="chat"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <ChatScreen onComplete={handleChatComplete} />
          </motion.div>
        )}

        {state.screen === 'result' && (
          <motion.div
            key="result"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <ResultScreen onContinue={handleContinueToLead} />
          </motion.div>
        )}

        {state.screen === 'lead' && (
          <motion.div
            key="lead"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <LeadCaptureScreen onSubmit={handleLeadSubmit} />
          </motion.div>
        )}

        {state.screen === 'thanks' && (
          <motion.div
            key="thanks"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <ThankYouScreen onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HomePage() {
  return (
    <AppProvider>
      <OrientadorApp />
    </AppProvider>
  );
}