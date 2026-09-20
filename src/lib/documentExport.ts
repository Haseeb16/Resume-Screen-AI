import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from 'docx';
import type { FinalCvData } from '../types.ts';

/**
 * Exports the rendered A4 HTML CV to a high-resolution PDF document.
 */
export async function exportToPdf(elementId: string, filename: string): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) {
    throw new Error('CV document sheet element not found in DOM.');
  }

  // Create temporary container style if needed
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;

  while (heightLeft > 5) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}

/**
 * Compiles and downloads a native ATS-compliant Microsoft Word (.docx) document.
 */
export async function exportToDocx(cv: FinalCvData, filename: string): Promise<void> {
  const children: Paragraph[] = [];

  // Candidate Name Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: cv.contact.fullName.toUpperCase(),
          bold: true,
          size: 32, // 16pt
          font: 'Calibri',
        }),
      ],
    }),
  );

  // Contact Info Line
  const contactParts: string[] = [];
  if (cv.contact.email) contactParts.push(cv.contact.email);
  if (cv.contact.phone) contactParts.push(cv.contact.phone);
  if (cv.contact.location) contactParts.push(cv.contact.location);
  if (cv.contact.linkedin) contactParts.push(cv.contact.linkedin);
  if (cv.contact.portfolio) contactParts.push(cv.contact.portfolio);
  if (cv.contact.github) contactParts.push(cv.contact.github);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            size: 19, // 9.5pt
            font: 'Calibri',
            color: '475569',
          }),
        ],
      }),
    );
  }

  const createSectionHeader = (title: string): Paragraph => {
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      border: {
        bottom: {
          color: '94A3B8',
          space: 4,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 22, // 11pt
          font: 'Calibri',
          color: '0F172A',
        }),
      ],
    });
  };

  // 1. Professional Summary
  const activeSummary = cv.usingTailoredSummary ? cv.tailoredSummary : cv.originalSummary || cv.summary;
  if (activeSummary) {
    children.push(createSectionHeader('Professional Summary'));
    children.push(
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: activeSummary,
            size: 20, // 10pt
            font: 'Calibri',
          }),
        ],
      }),
    );
  }

  // 2. Core Skills
  if (cv.skills && cv.skills.length > 0) {
    children.push(createSectionHeader('Core Skills'));
    for (const group of cv.skills) {
      children.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: `${group.category}: `,
              bold: true,
              size: 20,
              font: 'Calibri',
              color: '1E293B',
            }),
            new TextRun({
              text: group.skills.join(', '),
              size: 20,
              font: 'Calibri',
            }),
          ],
        }),
      );
    }
  }

  // 3. Professional Experience
  if (cv.experience && cv.experience.length > 0) {
    children.push(createSectionHeader('Professional Experience'));

    for (const exp of cv.experience) {
      // Role & Employer Line
      const datesStr = [exp.startDate, exp.endDate].filter(Boolean).join(' - ');
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 60 },
          children: [
            new TextRun({
              text: exp.jobTitle,
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '0F172A',
            }),
            new TextRun({
              text: `  |  ${exp.employer}`,
              bold: true,
              size: 21,
              font: 'Calibri',
              color: '334155',
            }),
            ...(datesStr
              ? [
                  new TextRun({
                    text: `  (${datesStr})`,
                    italics: true,
                    size: 19,
                    font: 'Calibri',
                    color: '64748B',
                  }),
                ]
              : []),
          ],
        }),
      );

      // Bullets
      for (const bullet of exp.bullets) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: bullet,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
        );
      }
    }
  }

  // 4. Education
  if (cv.education && cv.education.length > 0) {
    children.push(createSectionHeader('Education'));

    for (const edu of cv.education) {
      const datesStr = edu.graduationDate ? `  (${edu.graduationDate})` : '';
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({
              text: edu.degree,
              bold: true,
              size: 20,
              font: 'Calibri',
            }),
            new TextRun({
              text: `  |  ${edu.institution}${datesStr}`,
              size: 20,
              font: 'Calibri',
              color: '334155',
            }),
          ],
        }),
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 in
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
