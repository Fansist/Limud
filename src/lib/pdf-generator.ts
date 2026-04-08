/**
 * LIMUD v10.0 — PDF Report Generator
 * Generates branded student progress report PDFs using jsPDF.
 * Server-side only — runs in API routes, not in the browser.
 */

import { jsPDF } from 'jspdf';

interface CourseBreakdown {
  courseName: string;
  subject: string;
  assignments: {
    title: string;
    score: number | null;
    maxScore: number | null;
    status: string;
    gradedAt: string | null;
  }[];
  averageScore: number;
}

interface ReportData {
  studentName: string;
  studentEmail: string;
  districtName: string;
  dateRange: { start: string; end: string };
  summary: {
    totalCourses: number;
    totalAssignments: number;
    completedAssignments: number;
    averageScore: number;
    totalXP: number;
    currentStreak: number;
    level: number;
  };
  courses: CourseBreakdown[];
}

function getLetterGrade(pct: number): string {
  if (pct >= 97) return 'A+';
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 63) return 'D';
  if (pct >= 60) return 'D-';
  return 'F';
}

export function generateStudentReportPDF(data: ReportData): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ─── Header ───
  doc.setFillColor(79, 70, 229); // Indigo-600
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('LIMUD', margin, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Adaptive Learning Platform', margin, 24);
  doc.setFontSize(9);
  doc.text(`Student Progress Report`, pageWidth - margin, 16, { align: 'right' });
  doc.text(`${data.dateRange.start} — ${data.dateRange.end}`, pageWidth - margin, 23, { align: 'right' });
  doc.text(data.districtName, pageWidth - margin, 30, { align: 'right' });

  y = 45;

  // ─── Student Info ───
  doc.setTextColor(31, 41, 55);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.studentName, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(data.studentEmail, margin, y);
  y += 10;

  // ─── Summary Stats ───
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');

  const stats = [
    { label: 'Courses', value: String(data.summary.totalCourses) },
    { label: 'Completed', value: `${data.summary.completedAssignments}/${data.summary.totalAssignments}` },
    { label: 'Avg Score', value: `${data.summary.averageScore.toFixed(1)}%` },
    { label: 'Grade', value: getLetterGrade(data.summary.averageScore) },
    { label: 'XP', value: String(data.summary.totalXP) },
    { label: 'Streak', value: `${data.summary.currentStreak}d` },
    { label: 'Level', value: String(data.summary.level) },
  ];

  const colWidth = contentWidth / stats.length;
  stats.forEach((stat, i) => {
    const x = margin + colWidth * i + colWidth / 2;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(stat.value, x, y + 10, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(stat.label, x, y + 16, { align: 'center' });
  });

  y += 32;

  // ─── Per-Course Breakdown ───
  for (const course of data.courses) {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(79, 70, 229);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${course.courseName}  (${course.subject})`, margin + 3, y + 5.5);
    doc.text(`Avg: ${course.averageScore.toFixed(1)}%`, pageWidth - margin - 3, y + 5.5, { align: 'right' });
    y += 12;

    // Table header
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Assignment', margin + 2, y + 4);
    doc.text('Score', margin + contentWidth * 0.6, y + 4);
    doc.text('Grade', margin + contentWidth * 0.75, y + 4);
    doc.text('Status', margin + contentWidth * 0.88, y + 4);
    y += 8;

    // Table rows
    for (const a of course.assignments) {
      if (y > 275) {
        doc.addPage();
        y = margin;
      }

      doc.setTextColor(55, 65, 81);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const titleText = a.title.length > 40 ? a.title.substring(0, 40) + '...' : a.title;
      doc.text(titleText, margin + 2, y + 3);

      if (a.score !== null && a.maxScore !== null) {
        doc.text(`${a.score}/${a.maxScore}`, margin + contentWidth * 0.6, y + 3);
        const pct = a.maxScore > 0 ? (a.score / a.maxScore) * 100 : 0;
        const grade = getLetterGrade(pct);
        doc.setFont('helvetica', 'bold');
        doc.text(grade, margin + contentWidth * 0.75, y + 3);
      } else {
        doc.text('—', margin + contentWidth * 0.6, y + 3);
        doc.text('—', margin + contentWidth * 0.75, y + 3);
      }

      doc.setFont('helvetica', 'normal');
      const statusColors: Record<string, [number, number, number]> = {
        GRADED: [34, 197, 94],
        SUBMITTED: [59, 130, 246],
        PENDING: [234, 179, 8],
        GRADING: [168, 85, 247],
      };
      const statusColor = statusColors[a.status] || [107, 114, 128];
      doc.setTextColor(...statusColor);
      doc.text(a.status, margin + contentWidth * 0.88, y + 3);

      y += 6;
    }

    y += 6;
  }

  // ─── Footer ───
  const addFooter = (pageNum: number) => {
    doc.setPage(pageNum);
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated by Limud AI · FERPA compliant · ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      margin,
      footerY
    );
    doc.text(`Page ${pageNum}`, pageWidth - margin, footerY, { align: 'right' });
  };

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    addFooter(i);
  }

  // Return as Buffer
  return Buffer.from(doc.output('arraybuffer'));
}
