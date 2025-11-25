/**
 * ✨ buildAIContext Utility
 * Builds comprehensive context string for AI prompts
 */
export function buildAIContext(fullContext, insights, messages) {
  if (!fullContext) return '';

  let ctx = '';

  // ===== STUDENT PROFILE =====
  if (fullContext.profile) {
    const p = fullContext.profile;
    ctx += `\n=== HỌC SINH ===\n`;
    ctx += `Tên: ${p.name || 'N/A'}\n`;
    if (p.class) ctx += `Lớp: ${p.class}\n`;
    if (p.grade) ctx += `Khối: ${p.grade}\n`;
    if (p.school) ctx += `Trường: ${p.school}\n`;

    // Family context
    if (p.familyStatus || p.economicStatus) {
      ctx += `\nHoàn cảnh:\n`;
      if (p.familyStatus) ctx += `- Gia đình: ${p.familyStatus}\n`;
      if (p.economicStatus) ctx += `- Kinh tế: ${p.economicStatus}\n`;
      if (p.specialCircumstances) ctx += `- Đặc biệt: ${p.specialCircumstances}\n`;
    }

    // Parents
    if (p.fatherJob || p.motherJob) {
      ctx += `\nPhụ huynh:\n`;
      if (p.fatherJob) ctx += `- Cha: ${p.fatherJob}\n`;
      if (p.motherJob) ctx += `- Mẹ: ${p.motherJob}\n`;
    }

    // Health
    if (p.healthNotes) {
      ctx += `\nSức khỏe: ${p.healthNotes}\n`;
    }
  }

  // ===== ACADEMIC PERFORMANCE =====
  if (fullContext.scores?.gpa) {
    ctx += `\n=== HỌC BẠ ===\n`;
    ctx += `GPA: ${fullContext.scores.gpa}\n`;
    
    if (fullContext.scores.top?.length > 0) {
      ctx += `Môn mạnh: ${fullContext.scores.top.map(s => `${s.name}(${s.score})`).join(', ')}\n`;
    }
    
    if (fullContext.scores.weak?.length > 0) {
      ctx += `Cần cải thiện: ${fullContext.scores.weak.map(s => `${s.name}(${s.score})`).join(', ')}\n`;
    }
  }

  // ===== TEST RESULTS =====
  if (fullContext.tests?.count > 0) {
    ctx += `\n=== TESTS ĐÃ LÀM (${fullContext.tests.count}) ===\n`;
    fullContext.tests.summary.slice(0, 3).forEach(t => {
      ctx += `- ${t.name} (${t.type})\n`;
      if (t.topTypes?.length > 0) {
        ctx += `  Top: ${t.topTypes.slice(0, 2).map(tt => tt.type || tt).join(', ')}\n`;
      }
      if (t.careers?.length > 0) {
        ctx += `  Nghề gợi ý: ${t.careers.slice(0, 3).join(', ')}\n`;
      }
    });
  }

  // ===== PAST EVALUATIONS =====
  if (fullContext.evaluations?.count > 0) {
    ctx += `\n=== ĐÁNH GIÁ TRƯỚC ĐÂY (${fullContext.evaluations.count}) ===\n`;
    const recentEval = fullContext.evaluations.summary[0];
    if (recentEval) {
      if (recentEval.careers?.length > 0) {
        ctx += `Nghề phù hợp: ${recentEval.careers.slice(0, 3).join(', ')}\n`;
      }
      if (recentEval.subjects?.length > 0) {
        ctx += `Môn nên focus: ${recentEval.subjects.join(', ')}\n`;
      }
      ctx += `Độ tin cậy: ${recentEval.confidence}%\n`;
    }
  }

  // ===== JOURNEY PROGRESS =====
  if (fullContext.journey) {
    const j = fullContext.journey;
    ctx += `\n=== HÀNH TRÌNH ===\n`;
    ctx += `Lần chat: ${j.conversation_count || 0}\n`;
    ctx += `Độ rõ ràng: ${j.current_clarity_score || 0}%\n`;
    ctx += `Trạng thái: ${j.current_emotional_state || 'curious'}\n`;

    if (j.milestones?.length > 0) {
      const recent = j.milestones.slice(-2);
      ctx += `Milestones gần:\n`;
      recent.forEach(m => ctx += `- ${m.description}\n`);
    }
  }

  // ===== CURRENT INSIGHTS =====
  if (insights) {
    const hasInsights = Object.values(insights).some(arr => arr?.length > 0);
    if (hasInsights) {
      ctx += `\n=== INSIGHTS ĐÃ THU THẬP ===\n`;
      if (insights.interests?.length > 0) ctx += `🎨 Sở thích: ${insights.interests.join(', ')}\n`;
      if (insights.goals?.length > 0) ctx += `🎯 Mục tiêu: ${insights.goals.join(', ')}\n`;
      if (insights.values?.length > 0) ctx += `💎 Giá trị: ${insights.values.join(', ')}\n`;
      if (insights.concerns?.length > 0) ctx += `💭 Lo lắng: ${insights.concerns.join(', ')}\n`;
      if (insights.personality_traits?.length > 0) ctx += `⭐ Tính cách: ${insights.personality_traits.join(', ')}\n`;
      if (insights.favorite_subjects?.length > 0) ctx += `📚 Môn yêu thích: ${insights.favorite_subjects.join(', ')}\n`;
    }
  }

  // ===== SESSION CONTEXT =====
  if (fullContext.sessions?.count > 0) {
    ctx += `\n=== LỊCH SỬ TƯ VẤN (${fullContext.sessions.count} lần) ===\n`;
    const lastSession = fullContext.sessions.summary[0];
    if (lastSession && lastSession.interests?.length > 0) {
      ctx += `Lần trước nói về: ${lastSession.interests.slice(0, 2).join(', ')}\n`;
    }
  }

  return ctx;
}

/**
 * Build conversation history for context
 */
export function buildConversationHistory(messages, limit = 10) {
  return messages
    .slice(-limit)
    .map(m => `${m.sender === 'user' ? 'Em' : 'Mình'}: ${m.text}`)
    .join('\n\n');
}