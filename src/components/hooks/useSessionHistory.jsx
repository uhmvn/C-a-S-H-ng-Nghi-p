import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { subDays } from 'date-fns';

/**
 * ✨ useSessionHistory Hook
 * Fetches and manages chat session history
 * Auto-cleanup >10 days
 */
export default function useSessionHistory(userId, isOpen) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) {
      setIsLoading(false);
      return;
    }

    const loadSessions = async () => {
      try {
        setIsLoading(true);
        console.log('📂 Loading session history...');

        // Fetch all sessions for user
        const allSessions = await base44.entities.AICounselingSession.filter(
          { user_id: userId },
          '-session_date',
          50
        );

        if (!allSessions || allSessions.length === 0) {
          setSessions([]);
          return;
        }

        // Check for old sessions (>10 days)
        const now = new Date();
        const tenDaysAgo = subDays(now, 10);

        const validSessions = [];
        const oldSessions = [];

        allSessions.forEach(session => {
          const sessionDate = new Date(session.session_date);
          if (sessionDate < tenDaysAgo && session.is_completed) {
            oldSessions.push(session);
          } else {
            validSessions.push(session);
          }
        });

        // Archive old sessions (mark for cleanup)
        if (oldSessions.length > 0) {
          console.log(`🗑️ Found ${oldSessions.length} old sessions (>10 days)`);
          // Option: Auto-delete or just mark
          // For now, keep them but mark as "old"
        }

        setSessions(validSessions);
        console.log(`✅ Loaded ${validSessions.length} sessions`);
      } catch (err) {
        console.error('❌ Session history error:', err);
        setSessions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, [userId, isOpen]);

  const deleteSession = async (sessionId) => {
    try {
      console.log('🗑️ Deleting session:', sessionId);
      await base44.entities.AICounselingSession.delete(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      console.log('✅ Session deleted');
    } catch (err) {
      console.error('❌ Delete error:', err);
    }
  };

  return { sessions, isLoading, deleteSession };
}