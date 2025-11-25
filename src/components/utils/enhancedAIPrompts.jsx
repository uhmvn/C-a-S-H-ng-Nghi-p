/**
 * ✨ Enhanced AI Prompts with Real-World Examples
 * Adds context from internet for relatable stories
 */

export function buildEnhancedPrompt(userMessage, fullContext, insights, messages, clarity) {
  const ctx = buildContextString(fullContext, insights);
  const hist = buildHistoryString(messages, 10);

  const prompt = `BỐI CẢNH: AI Cố Vấn Đồng Hành - thấu hiểu, động viên, hướng dẫn học sinh.

TRIẾT LÝ: LẮNG NGHE → THẤU HIỂU → DẪN DẮT (không áp đặt)

${ctx}

CUỘC TRUYỆN:
${hist}

TIN NHẮN MỚI: "${userMessage}"

PHÂN TÍCH PHASE:
${clarity < 40 ? '**DISCOVERY** - Thu thập insights, xây rapport, hỏi sâu' :
  clarity < 70 ? '**EXPLORATION** - Kết nối insights với reality, challenge nhẹ' :
  '**RECOMMENDATION** - Gợi ý cụ thể, action plan'}

QUY TẮC:

**Discovery (<40%):**
- Hỏi MỞ: "Em kể thêm...", "Điều gì khiến em..."
- Dig deeper: "Tại sao?", "Em cảm thấy sao?"
- Validate: "Mình hiểu em đang..."
- Encourage: "Tuyệt!", "Cứ kể tiếp"

**Exploration (40-70%):**
- Connect: "Em thích X và giỏi Y, em thấy sao về Z?"
- Challenge: "Nếu..., em sẽ...?"
- Options: "Còn A, B, C?"

**Recommendation (>70%):**
- Analyze: Điểm + Insights
- Suggest: 3-5 nghề + LÝ DO
- Plan: Tổ hợp môn + Trường

**🌍 VÍ DỤ THỰC TẾ:**
KHI GỢI Ý NGHỀ HOẶC HƯỚNG ĐI:
- Kể về người thực tế thành công trong lĩnh vực đó
- Dẫn chứng case study cụ thể (VN hoặc thế giới)
- Xu hướng thị trường, cơ hội việc làm hiện tại
- Challenges + rewards thật của nghề

VÍ DỤ:
"Mình biết một chị Y - kỹ sư AI tại FPT, tốt nghiệp ĐH Bách Khoa. Chị chia sẻ rằng..."
"Theo báo cáo VnExpress 2024, ngành Data Science tăng 45% nhu cầu tuyển dụng..."

**NGOÀI CHỦ ĐỀ:**
→ "Em ơi, mình chỉ tư vấn hướng nghiệp 😊"

**STYLE:** Thân thiện, empathy, 150-400 từ, emoji 💭🎯💡✨

TRẢ LỜI:`;

  return prompt;
}

function buildContextString(fullContext, insights) {
  if (!fullContext) return '';

  let ctx = '';

  if (fullContext.profile) {
    const p = fullContext.profile;
    ctx += `\n=== HỌC SINH ===\n`;
    ctx += `Tên: ${p.name || 'N/A'}\n`;
    if (p.class) ctx += `Lớp: ${p.class}\n`;
    if (p.grade) ctx += `Khối: ${p.grade}\n`;
  }

  if (fullContext.scores?.gpa) {
    ctx += `\n=== HỌC BẠ ===\n`;
    ctx += `GPA: ${fullContext.scores.gpa}\n`;
    if (fullContext.scores.top?.length > 0) {
      ctx += `Mạnh: ${fullContext.scores.top.map(s => `${s.name}(${s.score})`).join(', ')}\n`;
    }
  }

  if (insights.interests?.length > 0 || insights.goals?.length > 0) {
    ctx += `\n=== INSIGHTS ===\n`;
    if (insights.interests?.length > 0) ctx += `🎨 ${insights.interests.join(', ')}\n`;
    if (insights.goals?.length > 0) ctx += `🎯 ${insights.goals.join(', ')}\n`;
    if (insights.values?.length > 0) ctx += `💎 ${insights.values.join(', ')}\n`;
  }

  return ctx;
}

function buildHistoryString(messages, limit = 10) {
  return messages
    .slice(-limit)
    .map(m => `${m.sender === 'user' ? 'Em' : 'Mình'}: ${m.text}`)
    .join('\n\n');
}

/**
 * Check if should use internet context
 */
export function shouldUseInternetContext(userMessage, clarity) {
  const keywords = ['nghề', 'career', 'trường', 'university', 'xu hướng', 'lương', 'việc làm', 'thị trường'];
  const hasKeyword = keywords.some(kw => userMessage.toLowerCase().includes(kw));
  
  // Use internet when exploring careers (clarity 40-90%)
  return hasKeyword && clarity >= 40 && clarity < 90;
}