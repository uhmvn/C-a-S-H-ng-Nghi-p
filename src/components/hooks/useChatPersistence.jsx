import { useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * ✨ useChatPersistence Hook
 * Smart auto-save mechanism for chat sessions & journey
 * 
 * Strategies:
 * - Debounced insights save (2s)
 * - Incremental session save (every 3 msgs)
 * - Phase change save
 * - Session close save
 */
export default function useChatPersistence(sessionId, journeyId, userProfile) {
  const lastSaveRef = useRef({ insights: 0, session: 0 });

  /**
   * Quick save insights to journey (debounced externally)
   */
  const saveInsights = useCallback(async (insights) => {
    if (!journeyId || !insights) return;

    try {
      const totalInsights = Object.values(insights).reduce((sum, arr) => sum + (arr?.length || 0), 0);
      
      // Skip if no changes
      if (totalInsights === lastSaveRef.current.insights) return;
      
      console.log('💾 Quick save insights:', totalInsights);

      await base44.entities.StudentJourney.update(journeyId, {
        key_insights: insights,
        total_insights_collected: totalInsights,
        last_updated: new Date().toISOString()
      });

      lastSaveRef.current.insights = totalInsights;
      console.log('✅ Insights saved');
    } catch (err) {
      console.error('❌ Insight save error:', err);
    }
  }, [journeyId]);

  /**
   * Full journey update with milestones
   */
  const updateJourney = useCallback(async (insights, clarity, emotionalState, messages) => {
    if (!journeyId || !userProfile) return;

    try {
      console.log('📝 Full journey update...');
      
      const journey = await base44.entities.StudentJourney.filter({ id: journeyId });
      const currentJourney = journey?.[0] || {};

      const oldClarity = currentJourney.current_clarity_score || 0;
      const milestones = currentJourney.milestones || [];

      // Check for milestone celebrations
      const celebrationThresholds = [25, 50, 75, 90];
      celebrationThresholds.forEach(threshold => {
        if (oldClarity < threshold && clarity >= threshold) {
          milestones.push({
            date: new Date().toISOString(),
            type: 'celebration',
            description: `🎉 Đạt ${threshold}% - ${
              threshold === 25 ? 'Bắt đầu hiểu bản thân!' :
              threshold === 50 ? 'Rõ ràng hơn rồi!' :
              threshold === 75 ? 'Đã xác định được hướng đi!' :
              'Sẵn sàng cho tương lai!'
            }`,
            clarity_score: clarity,
            emotional_state: emotionalState
          });
        }
      });

      // Track interest/goal evolution
      const interestEvolution = currentJourney.interest_evolution || [];
      const goalEvolution = currentJourney.goal_evolution || [];

      if (insights.interests?.length > 0) {
        interestEvolution.push({
          date: new Date().toISOString(),
          interests: insights.interests,
          confidence: clarity
        });
      }

      if (insights.goals?.length > 0) {
        insights.goals.forEach(goal => {
          goalEvolution.push({
            date: new Date().toISOString(),
            goal: goal,
            reason: 'Discovered through conversation',
            confidence: clarity
          });
        });
      }

      // AI observations
      const observations = currentJourney.ai_observations || [];
      observations.push({
        date: new Date().toISOString(),
        observation: `Session ${messages.length} msgs. Clarity: ${oldClarity}% → ${clarity}%. State: ${emotionalState}`,
        significance: clarity > 60 ? 'high' : clarity > 30 ? 'medium' : 'low'
      });

      const updateData = {
        current_clarity_score: clarity,
        current_emotional_state: emotionalState,
        conversation_count: (currentJourney.conversation_count || 0) + 1,
        total_insights_collected: Object.values(insights).reduce((sum, arr) => sum + (arr?.length || 0), 0),
        milestones: milestones.slice(-50), // Keep last 50
        interest_evolution: interestEvolution.slice(-20),
        goal_evolution: goalEvolution.slice(-20),
        ai_observations: observations.slice(-20),
        key_insights: insights,
        last_updated: new Date().toISOString()
      };

      await base44.entities.StudentJourney.update(journeyId, updateData);
      console.log('✅ Journey updated');

      return updateData;
    } catch (err) {
      console.error('❌ Journey update error:', err);
      return null;
    }
  }, [journeyId, userProfile]);

  /**
   * Incremental session save
   */
  const saveSession = useCallback(async (messages, insights, clarity, phase) => {
    if (!sessionId || !userProfile) return;

    try {
      // Skip if no new messages since last save
      if (messages.length === lastSaveRef.current.session) return;

      console.log('💾 Session save:', sessionId);

      const updateData = {
        conversation_history: messages.slice(-50).map(m => ({
          role: m.sender,
          content: m.text,
          timestamp: m.timestamp.toISOString()
        })),
        student_interests: insights.interests || [],
        student_goals: insights.goals || [],
        student_context: {
          clarity: clarity,
          phase: phase,
          insights_count: Object.values(insights).reduce((sum, arr) => sum + (arr?.length || 0), 0),
          message_count: messages.length
        },
        counseling_summary: `AI Companion - ${messages.length} msgs - Clarity: ${clarity}% - Phase: ${phase}`,
        tags: ['ai_companion', phase, userProfile.role || 'student']
      };

      await base44.entities.AICounselingSession.update(sessionId, updateData);
      
      lastSaveRef.current.session = messages.length;
      console.log('✅ Session saved');
    } catch (err) {
      console.error('❌ Session save error:', err);
    }
  }, [sessionId, userProfile]);

  /**
   * Close session (final save)
   */
  const closeSession = useCallback(async (messages) => {
    if (!sessionId) return;

    try {
      console.log('🔒 Closing session:', sessionId);
      
      await base44.entities.AICounselingSession.update(sessionId, {
        is_completed: true,
        completion_date: new Date().toISOString(),
        conversation_history: messages.map(m => ({
          role: m.sender,
          content: m.text,
          timestamp: m.timestamp.toISOString()
        }))
      });

      console.log('✅ Session closed');
    } catch (err) {
      console.error('❌ Close error:', err);
    }
  }, [sessionId]);

  return {
    saveInsights,
    updateJourney,
    saveSession,
    closeSession
  };
}