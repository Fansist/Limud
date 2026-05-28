/**
 * LIMUD v10.0 — Email Templates
 * HTML email templates for transactional notifications.
 */

const BRAND_COLOR = '#2563eb';
const FOOTER = `
  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;">
    <p>Limud — AI-Powered Adaptive Learning Platform</p>
    <p>FERPA & COPPA compliant · <a href="https://limud.co/privacy" style="color:${BRAND_COLOR};">Privacy Policy</a></p>
  </div>
`;

function wrap(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1f2937;">
  <div style="background:${BRAND_COLOR};padding:16px 24px;border-radius:12px 12px 0 0;">
    <h1 style="color:white;font-size:20px;margin:0;">Limud</h1>
  </div>
  <div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    ${body}
    ${FOOTER}
  </div>
</body>
</html>`;
}

export function welcomeEmail({ name, role, loginUrl }: { name: string; role: string; loginUrl: string }): string {
  return wrap(`
    <h2 style="color:${BRAND_COLOR};font-size:18px;">Welcome to Limud, ${name}! 🎉</h2>
    <p>Your <strong>${role.toLowerCase()}</strong> account is ready. Here's what you can do:</p>
    <ul style="line-height:1.8;">
      ${role === 'STUDENT' ? '<li>Take the Learning DNA survey to personalize your experience</li><li>Start working on adaptive assignments</li><li>Use the AI Socratic Tutor anytime</li>' : ''}
      ${role === 'TEACHER' ? '<li>Upload curriculum and let AI adapt it per student</li><li>Generate quizzes with one click</li><li>Use auto-grading to save hours</li>' : ''}
      ${role === 'PARENT' ? '<li>View your children\'s progress at a glance</li><li>Run AI Check-In summaries weekly</li>' : ''}
      ${role === 'ADMIN' ? '<li>Manage your district\'s schools and classrooms</li><li>Monitor compliance and analytics</li>' : ''}
    </ul>
    <a href="${loginUrl}" style="display:inline-block;background:${BRAND_COLOR};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Log In to Limud →</a>
  `);
}

export function gradePosted({ studentName, assignmentTitle, score, maxScore, feedback }: {
  studentName: string; assignmentTitle: string; score: number; maxScore: number; feedback?: string;
}): string {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return wrap(`
    <h2 style="color:${BRAND_COLOR};font-size:18px;">Hi ${studentName}, your assignment was graded! 📝</h2>
    <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#6b7280;">Assignment</p>
      <p style="margin:4px 0 0;font-size:16px;font-weight:600;">${assignmentTitle}</p>
    </div>
    <div style="display:flex;gap:24px;margin:16px 0;">
      <div style="text-align:center;flex:1;">
        <div style="font-size:28px;font-weight:700;color:${BRAND_COLOR};">${score}/${maxScore}</div>
        <div style="font-size:12px;color:#6b7280;">Score</div>
      </div>
      <div style="text-align:center;flex:1;">
        <div style="font-size:28px;font-weight:700;color:${pct >= 70 ? '#22c55e' : '#ef4444'};">${pct}%</div>
        <div style="font-size:12px;color:#6b7280;">Percentage</div>
      </div>
    </div>
    ${feedback ? `<div style="background:#eff6ff;padding:12px;border-radius:8px;border-left:4px solid ${BRAND_COLOR};margin:16px 0;font-size:14px;">${feedback}</div>` : ''}
    <a href="https://limud.co/student/assignments" style="display:inline-block;background:${BRAND_COLOR};color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">View Details →</a>
  `);
}

export function assignmentDueReminder({ studentName, assignmentTitle, dueDate, courseUrl }: {
  studentName: string; assignmentTitle: string; dueDate: string; courseUrl: string;
}): string {
  return wrap(`
    <h2 style="color:${BRAND_COLOR};font-size:18px;">Hi ${studentName}, assignment due tomorrow ⏰</h2>
    <div style="background:#fef3c7;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #f59e0b;">
      <p style="margin:0;font-size:14px;color:#92400e;font-weight:600;">${assignmentTitle}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#a16207;">Due: ${dueDate}</p>
    </div>
    <p>Don't forget to submit your work before the deadline. Need help? Ask the AI Tutor anytime!</p>
    <a href="${courseUrl}" style="display:inline-block;background:${BRAND_COLOR};color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Open Assignment →</a>
  `);
}

export function weeklyParentDigest({ parentName, children }: {
  parentName: string;
  children: {
    name: string;
    avgScore: number;
    completedCount: number;
    highlights: string[];
  }[];
}): string {
  const childCards = children.map(child => `
    <div style="background:#f9fafb;padding:16px;border-radius:8px;margin:12px 0;border:1px solid #e5e7eb;">
      <h3 style="margin:0 0 8px;font-size:16px;">${child.name}</h3>
      <div style="display:flex;gap:16px;margin-bottom:8px;">
        <span style="font-size:13px;"><strong>${child.avgScore}%</strong> avg score</span>
        <span style="font-size:13px;">✅ <strong>${child.completedCount}</strong> completed</span>
      </div>
      ${child.highlights.length > 0 ? `
        <div style="font-size:13px;color:#6b7280;">
          ${child.highlights.map(h => `<p style="margin:2px 0;">• ${h}</p>`).join('')}
        </div>
      ` : ''}
    </div>
  `).join('');

  return wrap(`
    <h2 style="color:${BRAND_COLOR};font-size:18px;">Weekly Learning Digest for ${parentName} 📊</h2>
    <p>Here's how your children are doing this week:</p>
    ${childCards}
    <a href="https://limud.co/parent/dashboard" style="display:inline-block;background:${BRAND_COLOR};color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">View Full Dashboard →</a>
  `);
}

/**
 * Escape user-controlled text for safe interpolation into HTML.
 * Prevents broken markup or XSS from names, indicators, feedback, etc.
 */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * At-risk alert — sent when detectStruggle() level rises into 'medium' or 'high'.
 * Tone: supportive, not stigmatizing. Frames as "here's how to help" not "your kid is failing".
 */
export function atRiskAlert(opts: {
  parentName: string;
  childName: string;
  level: 'medium' | 'high';
  indicators: string[];     // human-readable, max 3 shown
  recommendations: string[]; // human-readable, max 3 shown
  reportUrl: string;        // link to /parent/reports/[childId]
}): { subject: string; html: string; text: string } {
  const { parentName, childName, level, indicators, recommendations, reportUrl } = opts;
  const topIndicators = indicators.slice(0, 3);
  const topRecs = recommendations.slice(0, 3);
  const accent = level === 'high' ? '#f59e0b' : '#3b82f6';
  const headline = level === 'high'
    ? `A few signs we want to share with you about ${childName}`
    : `Just a quick check-in on ${childName}`;

  const indicatorsBlock = topIndicators.length > 0
    ? `
      <h3 style="font-size:15px;margin:20px 0 8px;color:#1f2937;">What we're noticing</h3>
      <ul style="line-height:1.7;padding-left:20px;margin:0;">
        ${topIndicators.map(i => `<li>${esc(i)}</li>`).join('')}
      </ul>`
    : '';

  const recsBlock = topRecs.length > 0
    ? `
      <h3 style="font-size:15px;margin:20px 0 8px;color:#1f2937;">Ways you can help</h3>
      <ul style="line-height:1.7;padding-left:20px;margin:0;">
        ${topRecs.map(r => `<li>${esc(r)}</li>`).join('')}
      </ul>`
    : '';

  const html = wrap(`
    <h2 style="color:${BRAND_COLOR};font-size:18px;margin:0 0 8px;">${esc(headline)}</h2>
    <p style="margin:0 0 12px;">Hi ${esc(parentName)},</p>
    <p style="margin:0 0 12px;">We're sending a friendly heads-up so you can support ${esc(childName)} early. Nothing is wrong — these are just patterns Limud uses to help families step in at the right moment.</p>
    <div style="background:#f9fafb;padding:14px 16px;border-radius:8px;border-left:4px solid ${accent};margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#6b7280;">Check-in level</p>
      <p style="margin:4px 0 0;font-size:15px;font-weight:600;text-transform:capitalize;">${esc(level)}</p>
    </div>
    ${indicatorsBlock}
    ${recsBlock}
    <p style="margin:20px 0 0;">You can see the full picture and recent work in your parent dashboard.</p>
    <a href="${esc(reportUrl)}" style="display:inline-block;background:${BRAND_COLOR};color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px;">Open ${esc(childName)}'s Report →</a>
  `);

  const textLines = [
    `Hi ${parentName},`,
    '',
    `We're sending a friendly heads-up so you can support ${childName} early. Nothing is wrong — these are just patterns Limud uses to help families step in at the right moment.`,
    '',
    `Check-in level: ${level}`,
  ];
  if (topIndicators.length > 0) {
    textLines.push('', 'What we are noticing:');
    topIndicators.forEach(i => textLines.push(`  - ${i}`));
  }
  if (topRecs.length > 0) {
    textLines.push('', 'Ways you can help:');
    topRecs.forEach(r => textLines.push(`  - ${r}`));
  }
  textLines.push('', `Open ${childName}'s report: ${reportUrl}`, '', '— Limud');

  return {
    subject: `Limud check-in for ${childName}`,
    html,
    text: textLines.join('\n'),
  };
}

/**
 * Grade-posted notification — sent when a teacher records a graded submission for a child
 * AND parent has eventOnGradePosted = true.
 */
export function gradePostedToParent(opts: {
  parentName: string;
  childName: string;
  assignmentTitle: string;
  scoreDisplay: string;     // e.g. "91/100" or "87%"
  feedbackPreview?: string; // truncated to ~200 chars
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  const { parentName, childName, assignmentTitle, scoreDisplay, feedbackPreview, dashboardUrl } = opts;

  const feedbackBlock = feedbackPreview
    ? `<div style="background:#eff6ff;padding:12px;border-radius:8px;border-left:4px solid ${BRAND_COLOR};margin:16px 0;font-size:14px;">${esc(feedbackPreview)}</div>`
    : '';

  const html = wrap(`
    <h2 style="color:${BRAND_COLOR};font-size:18px;margin:0 0 8px;">A new grade for ${esc(childName)}</h2>
    <p style="margin:0 0 12px;">Hi ${esc(parentName)},</p>
    <p style="margin:0 0 12px;">${esc(childName)}'s teacher just recorded a grade in Limud.</p>
    <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#6b7280;">Assignment</p>
      <p style="margin:4px 0 12px;font-size:15px;font-weight:600;">${esc(assignmentTitle)}</p>
      <p style="margin:0;font-size:13px;color:#6b7280;">Score</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:${BRAND_COLOR};">${esc(scoreDisplay)}</p>
    </div>
    ${feedbackBlock}
    <a href="${esc(dashboardUrl)}" style="display:inline-block;background:${BRAND_COLOR};color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;">View Dashboard →</a>
  `);

  const textLines = [
    `Hi ${parentName},`,
    '',
    `${childName}'s teacher just recorded a grade in Limud.`,
    '',
    `Assignment: ${assignmentTitle}`,
    `Score: ${scoreDisplay}`,
  ];
  if (feedbackPreview) {
    textLines.push('', `Feedback: ${feedbackPreview}`);
  }
  textLines.push('', `View dashboard: ${dashboardUrl}`, '', '— Limud');

  return {
    subject: `New grade for ${childName}: ${assignmentTitle}`,
    html,
    text: textLines.join('\n'),
  };
}

/**
 * v17 — 6-digit sign-in code for the OWNER 2FA challenge.
 * Plain inline HTML (no wrap()) so the code stands out and is paste-friendly.
 * `code` is server-generated and contains only digits, so no escaping needed.
 */
export function otpCodeEmail(code: string, ttlMin = 5): { subject: string; html: string } {
  return {
    subject: 'Your Limud sign-in code: ' + code,
    html: '<div style="font:14px/1.5 system-ui;color:#111">' +
      '<p>Your Limud sign-in code:</p>' +
      '<p style="font:bold 28px monospace;letter-spacing:6px;padding:12px 0">' + code + '</p>' +
      '<p>Expires in ' + ttlMin + ' minutes. Do not share this code.</p>' +
      '<p>If you did not request this code, change your password immediately.</p>' +
      '</div>',
  };
}
