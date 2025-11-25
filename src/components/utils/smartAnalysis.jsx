/**
 * ✨ Smart Analysis Utils
 * Analyze patterns, predict outcomes, suggest actions
 */

/**
 * Build enhanced context with progress analysis
 */
export function buildProgressContext(progressData, alerts, insights) {
  if (!progressData) return '';

  let ctx = '\n=== PHÂN TÍCH TIẾN ĐỘ ===\n';
  ctx += `Điểm TB chung: ${progressData.overallAvg}\n`;
  ctx += `Môn đang tăng: ${progressData.improvingCount} | Giảm: ${progressData.decliningCount}\n\n`;

  // Trends
  if (progressData.trends) {
    const improving = [];
    const declining = [];
    const stable = [];

    Object.entries(progressData.trends).forEach(([subject, data]) => {
      if (data.trend === 'up') {
        improving.push(`${subject} (${data.previous}→${data.current})`);
      } else if (data.trend === 'down') {
        declining.push(`${subject} (${data.previous}→${data.current})`);
      } else {
        stable.push(`${subject} (${data.current})`);
      }
    });

    if (improving.length > 0) {
      ctx += `📈 Đang cải thiện: ${improving.join(', ')}\n`;
    }
    if (declining.length > 0) {
      ctx += `📉 Cần chú ý: ${declining.join(', ')}\n`;
    }
    if (stable.length > 0) {
      ctx += `➖ Ổn định: ${stable.join(', ')}\n`;
    }
  }

  // Alerts
  if (alerts.length > 0) {
    ctx += `\n⚠️ CẢNH BÁO:\n`;
    alerts.slice(0, 3).forEach(alert => {
      ctx += `- ${alert.message}\n`;
    });
  }

  // Goal alignment analysis
  if (insights?.goals?.length > 0 && progressData.trends) {
    ctx += `\n🎯 PHÂN TÍCH MỤC TIÊU:\n`;
    ctx += `Mục tiêu: ${insights.goals[0]}\n`;

    // Check if STEM goal
    const hasSTEMGoal = ['kỹ sư', 'bác sĩ', 'công nghệ', 'IT', 'khoa học'].some(k =>
      insights.goals[0].toLowerCase().includes(k)
    );

    if (hasSTEMGoal) {
      const stemSubjects = ['Toán', 'Lý', 'Hóa', 'Sinh'];
      const stemScores = stemSubjects
        .filter(s => progressData.trends[s])
        .map(s => ({
          subject: s,
          score: parseFloat(progressData.trends[s].current)
        }));

      if (stemScores.length > 0) {
        const stemAvg = stemScores.reduce((a, b) => a + b.score, 0) / stemScores.length;
        ctx += `Điểm TB STEM: ${stemAvg.toFixed(1)}\n`;

        if (stemAvg >= 8) {
          ctx += `→ Phù hợp với mục tiêu! Tiếp tục phát huy.\n`;
        } else if (stemAvg >= 7) {
          ctx += `→ Khá tốt, cần cải thiện thêm để đạt mục tiêu.\n`;
        } else {
          ctx += `→ Cần nỗ lực nhiều hơn. Tập trung ${stemScores.sort((a, b) => a.score - b.score)[0].subject}\n`;
        }
      }
    }
  }

  return ctx;
}

/**
 * Generate proactive suggestions based on progress
 */
export function generateProactiveSuggestions(progressData, alerts, insights, clarity) {
  const suggestions = [];

  if (!progressData) return suggestions;

  // Priority alerts
  const highAlerts = alerts.filter(a => a.priority === 'high');
  if (highAlerts.length > 0 && clarity < 70) {
    suggestions.push({
      icon: '⚠️',
      label: 'Cảnh báo',
      prompt: `Mình thấy có ${highAlerts.length} điểm cần chú ý. Em muốn nói chuyện về điều này?`,
      color: 'from-red-500 to-orange-600',
      priority: 'high'
    });
  }

  // Improvement opportunities
  if (progressData.decliningCount > 0 && clarity >= 40) {
    const declining = Object.entries(progressData.trends)
      .filter(([_, data]) => data.trend === 'down')
      .map(([subject]) => subject);

    suggestions.push({
      icon: '📉',
      label: 'Cải thiện',
      prompt: `Điểm ${declining[0]} đang giảm. Em muốn mình tư vấn cách học tốt hơn không?`,
      color: 'from-orange-500 to-red-600',
      priority: 'medium'
    });
  }

  // Celebrate improvements
  if (progressData.improvingCount >= 2 && clarity >= 50) {
    suggestions.push({
      icon: '🎉',
      label: 'Xuất sắc',
      prompt: `Em đang tiến bộ rất tốt! ${progressData.improvingCount} môn đang tăng. Em có bí quyết gì?`,
      color: 'from-green-500 to-teal-600',
      priority: 'low'
    });
  }

  // Goal alignment check
  if (insights?.goals?.length > 0 && clarity >= 60) {
    suggestions.push({
      icon: '🎯',
      label: 'Mục tiêu',
      prompt: `Với điểm hiện tại, em có đang đi đúng hướng với mục tiêu "${insights.goals[0]}"?`,
      color: 'from-purple-500 to-pink-600',
      priority: 'medium'
    });
  }

  return suggestions;
}

/**
 * Predict outcomes based on current trends
 */
export function predictOutcomes(progressData, insights) {
  if (!progressData || !progressData.trends) return null;

  const predictions = [];

  Object.entries(progressData.trends).forEach(([subject, data]) => {
    if (data.scores.length < 3) return;

    const recent = data.scores.slice(-3).map(s => s.score);
    const trend = data.trend;

    if (trend === 'up') {
      const avgIncrease = parseFloat(data.change);
      const projected = parseFloat(data.current) + avgIncrease;

      predictions.push({
        subject,
        current: data.current,
        projected: projected.toFixed(1),
        message: `Nếu tiếp tục, ${subject} có thể đạt ${projected.toFixed(1)}`
      });
    } else if (trend === 'down') {
      const avgDecrease = parseFloat(data.change);
      const projected = parseFloat(data.current) + avgDecrease;

      predictions.push({
        subject,
        current: data.current,
        projected: Math.max(0, projected).toFixed(1),
        message: `Cần cải thiện, nếu không ${subject} có thể xuống ${Math.max(0, projected).toFixed(1)}`,
        warning: true
      });
    }
  });

  return predictions;
}