import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { subMonths, isAfter, isBefore } from 'date-fns';

/**
 * ✨ useProgressTracking Hook
 * Tracks academic progress over time
 * Detects trends, compares vs goals, generates alerts
 */
export default function useProgressTracking(userId, userProfile, insights, isOpen) {
  const [progressData, setProgressData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId || !userProfile || userProfile.role !== 'student') {
      setIsLoading(false);
      return;
    }

    const analyzeProgress = async () => {
      try {
        setIsLoading(true);
        console.log('📊 Analyzing progress...');

        // Fetch scores from last 6 months
        const sixMonthsAgo = subMonths(new Date(), 6);
        const allScores = await base44.entities.AcademicScore.filter(
          { student_id: userProfile.id },
          '-exam_date',
          100
        );

        if (!allScores || allScores.length === 0) {
          setProgressData(null);
          setAlerts([]);
          return;
        }

        // Filter recent scores
        const recentScores = allScores.filter(s => {
          const examDate = new Date(s.exam_date);
          return isAfter(examDate, sixMonthsAgo);
        });

        // Group by subject
        const scoresBySubject = {};
        recentScores.forEach(score => {
          if (!scoresBySubject[score.subject_name]) {
            scoresBySubject[score.subject_name] = [];
          }
          scoresBySubject[score.subject_name].push({
            score: score.average_score,
            date: new Date(score.exam_date)
          });
        });

        // Calculate trends
        const trends = {};
        const alerts = [];

        Object.entries(scoresBySubject).forEach(([subject, scores]) => {
          if (scores.length < 2) return;

          // Sort by date
          scores.sort((a, b) => a.date - b.date);

          // Calculate trend
          const recent = scores.slice(-3).map(s => s.score);
          const older = scores.slice(0, -3).map(s => s.score);

          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.length > 0 
            ? older.reduce((a, b) => a + b, 0) / older.length 
            : recentAvg;

          const change = recentAvg - olderAvg;
          const trend = change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable';

          trends[subject] = {
            trend,
            change: change.toFixed(1),
            current: recentAvg.toFixed(1),
            previous: olderAvg.toFixed(1),
            scores
          };

          // Generate alerts
          if (trend === 'down' && recentAvg < 6.5) {
            alerts.push({
              type: 'warning',
              subject,
              message: `Điểm ${subject} đang giảm (${olderAvg.toFixed(1)} → ${recentAvg.toFixed(1)})`,
              action: 'Cần ôn tập thêm',
              priority: recentAvg < 5 ? 'high' : 'medium'
            });
          }

          if (trend === 'up' && recentAvg >= 8) {
            alerts.push({
              type: 'success',
              subject,
              message: `Điểm ${subject} đang tăng tốt! (${olderAvg.toFixed(1)} → ${recentAvg.toFixed(1)})`,
              action: 'Tiếp tục phát huy',
              priority: 'low'
            });
          }
        });

        // Check goal alignment
        if (insights?.goals?.length > 0) {
          const goalKeywords = ['kỹ sư', 'bác sĩ', 'kế toán', 'kinh tế', 'công nghệ', 'IT'];
          const hasSTEMGoal = insights.goals.some(g => 
            ['kỹ sư', 'bác sĩ', 'công nghệ', 'IT'].some(k => g.toLowerCase().includes(k))
          );

          if (hasSTEMGoal) {
            // Check STEM subjects
            const stemSubjects = ['Toán', 'Lý', 'Hóa', 'Sinh'];
            const stemScores = stemSubjects
              .filter(s => trends[s])
              .map(s => parseFloat(trends[s].current));

            if (stemScores.length > 0) {
              const stemAvg = stemScores.reduce((a, b) => a + b, 0) / stemScores.length;

              if (stemAvg < 7) {
                alerts.push({
                  type: 'warning',
                  subject: 'Mục tiêu',
                  message: `Mục tiêu "${insights.goals[0]}" cần điểm STEM cao hơn`,
                  action: `Điểm TB STEM: ${stemAvg.toFixed(1)} - Nên đạt ≥8`,
                  priority: 'high'
                });
              }
            }
          }
        }

        // Calculate overall progress
        const allCurrentScores = Object.values(trends).map(t => parseFloat(t.current));
        const overallAvg = allCurrentScores.length > 0
          ? (allCurrentScores.reduce((a, b) => a + b, 0) / allCurrentScores.length).toFixed(1)
          : 0;

        setProgressData({
          trends,
          overallAvg,
          totalSubjects: Object.keys(trends).length,
          improvingCount: Object.values(trends).filter(t => t.trend === 'up').length,
          decliningCount: Object.values(trends).filter(t => t.trend === 'down').length
        });

        // Sort alerts by priority
        const sortedAlerts = alerts.sort((a, b) => {
          const priority = { high: 3, medium: 2, low: 1 };
          return priority[b.priority] - priority[a.priority];
        });

        setAlerts(sortedAlerts);
        console.log('✅ Progress analyzed:', { trends, alerts: sortedAlerts });

      } catch (err) {
        console.error('❌ Progress tracking error:', err);
        setProgressData(null);
        setAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeProgress();
  }, [userId, userProfile, insights, isOpen]);

  return { progressData, alerts, isLoading };
}