import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * ✨ useStudentContext Hook
 * Loads COMPREHENSIVE student data for AI counseling
 * 
 * Returns: { profile, scores, tests, journey, evaluations, sessions, stats, isLoading }
 */
export default function useStudentContext(user, isOpen) {
  const [context, setContext] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !user) {
      setIsLoading(false);
      return;
    }

    const loadFullContext = async () => {
      try {
        setIsLoading(true);
        console.log('📊 Loading comprehensive student context...');

        // ✅ Parallel fetch ALL data
        const [profiles, scores, tests, journeys, evaluations, sessions] = await Promise.all([
          base44.entities.UserProfile.filter({ user_id: user.id }),
          base44.entities.AcademicScore.filter({ user_id: user.id }),
          base44.entities.TestResult.filter({ user_id: user.id }),
          base44.entities.StudentJourney.filter({ user_id: user.id }),
          base44.entities.AIEvaluation.filter({ user_id: user.id }),
          base44.entities.AICounselingSession.filter({ user_id: user.id }, '-session_date', 10)
        ]);

        const profile = profiles?.[0] || null;
        const journey = journeys?.[0] || null;

        // ✅ Calculate academic stats
        const validScores = scores?.filter(s => typeof s.average_score === 'number') || [];
        const gpa = validScores.length > 0
          ? (validScores.reduce((sum, s) => sum + s.average_score, 0) / validScores.length).toFixed(2)
          : null;

        const sortedScores = [...validScores].sort((a, b) => b.average_score - a.average_score);
        const topSubjects = sortedScores.slice(0, 3).map(s => ({
          name: s.subject_name,
          score: s.average_score.toFixed(1)
        }));

        const weakSubjects = sortedScores.slice(-2).map(s => ({
          name: s.subject_name,
          score: s.average_score.toFixed(1)
        }));

        // ✅ Test results summary
        const testSummary = tests?.map(t => ({
          type: t.test_type,
          name: t.test_name,
          date: t.completed_date,
          topTypes: t.top_types || [],
          careers: t.suggested_careers || []
        })) || [];

        // ✅ Past evaluations summary
        const evalSummary = evaluations?.map(e => ({
          date: e.created_date,
          careers: e.suggested_careers || [],
          subjects: e.suggested_subjects || [],
          confidence: e.confidence_score
        })) || [];

        // ✅ Session history summary
        const sessionSummary = sessions?.map(s => ({
          date: s.session_date,
          interests: s.student_interests || [],
          goals: s.student_goals || [],
          tags: s.tags || []
        })) || [];

        const fullContext = {
          profile: {
            ...profile,
            // Full personal info
            name: user.full_name || profile?.full_name,
            email: user.email,
            class: profile?.class_name,
            grade: profile?.grade_level,
            school: profile?.school_name,
            // Family & circumstances
            familyStatus: profile?.family_status,
            economicStatus: profile?.economic_status,
            specialCircumstances: profile?.special_circumstances,
            healthNotes: profile?.health_notes,
            // Parents info
            fatherJob: profile?.father_job,
            motherJob: profile?.mother_job
          },
          scores: {
            raw: validScores,
            gpa: gpa,
            top: topSubjects,
            weak: weakSubjects
          },
          tests: {
            raw: tests || [],
            summary: testSummary,
            count: tests?.length || 0
          },
          journey: journey,
          evaluations: {
            raw: evaluations || [],
            summary: evalSummary,
            count: evaluations?.length || 0
          },
          sessions: {
            raw: sessions || [],
            summary: sessionSummary,
            count: sessions?.length || 0
          },
          stats: {
            hasScores: validScores.length > 0,
            hasTests: (tests?.length || 0) > 0,
            hasEvaluations: (evaluations?.length || 0) > 0,
            hasSessions: (sessions?.length || 0) > 0,
            totalInsights: journey?.total_insights_collected || 0,
            clarity: journey?.current_clarity_score || 0
          }
        };

        console.log('✅ Full context loaded:', {
          profile: !!profile,
          scores: validScores.length,
          tests: tests?.length || 0,
          evaluations: evaluations?.length || 0,
          sessions: sessions?.length || 0,
          gpa: gpa
        });

        setContext(fullContext);
      } catch (err) {
        console.error('❌ Context loading error:', err);
        setContext(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadFullContext();
  }, [user, isOpen]);

  return { context, isLoading };
}