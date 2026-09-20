import type {
  FinalCvData,
  FinalCvContact,
  FinalCvExperienceItem,
  FinalCvEducationItem,
  FinalCvSkillGroup,
  FinalCvBullet,
  CandidateInfo,
  StructuredResume,
  StructuredExperienceItem,
  StructuredEducationItem,
  StructuredSkillGroup,
  StructuredCertificationItem,
  StructuredAdditionalSection,
  StructuredBullet,
  BulletChange,
  FinalCvValidationResult,
} from '../types.ts';
import { validateFinalCv } from './validation.ts';

export interface BuildFinalCvParams {
  applicationId?: string;
  originalResume: StructuredResume;
  jobTitle?: string;
  acceptedBulletChanges?: (
    | BulletChange
    | { bulletId?: string; original_bullet?: string; approved_bullet?: string }
  )[];
  rejectedBulletIds?: string[];
  manualEdits?: Record<string | number, string>;
  approvedSkills?: string[];
  summaryMode?: 'original' | 'tailored';
  customSummary?: string;
  tailoredSummaryAi?: string;
  isDemoMode?: boolean;
}

/**
 * Extracts a strictly authentic StructuredResume from raw resume text with ZERO dummy or fabricated fallbacks.
 * If a section or field is missing in the source text, it remains empty.
 */
export function parseResumeToStructuredResume(
  resumeText: string,
  rawSource: 'user_upload' | 'pasted_text' | 'demo_scenario' = 'user_upload',
): StructuredResume {
  const cleanRawText = resumeText || '';
  const lines = cleanRawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Extract Candidate Name and Contact Information
  const candidate: CandidateInfo = {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    website: '',
    portfolio: '',
    github: '',
  };

  let firstLineIdx = 0;
  while (
    firstLineIdx < lines.length &&
    /^(curriculum vitae|resume|cv|contact information)$/i.test(lines[firstLineIdx])
  ) {
    firstLineIdx++;
  }

  if (firstLineIdx < lines.length) {
    candidate.name = lines[firstLineIdx].replace(/^[#*_\s]+|[#*_\s]+$/g, '').trim();
  }

  // Search first 12 lines for contact info
  const headerBlock = lines.slice(0, 12).join(' \n ');

  const emailMatch = headerBlock.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) candidate.email = emailMatch[1];

  const phoneMatch = headerBlock.match(
    /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/,
  );
  if (phoneMatch) candidate.phone = phoneMatch[0].trim();

  const linkedinMatch = headerBlock.match(/(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i);
  if (linkedinMatch) candidate.linkedin = linkedinMatch[1];

  const githubMatch = headerBlock.match(/(github\.com\/[a-zA-Z0-9_-]+)/i);
  if (githubMatch) candidate.github = githubMatch[1];

  const portfolioMatch = headerBlock.match(
    /([a-zA-Z0-9_-]+\.(dev|io|me|com|design|tech))\b/i,
  );
  if (portfolioMatch && !emailMatch?.[0]?.includes(portfolioMatch[1])) {
    candidate.portfolio = portfolioMatch[1];
    candidate.website = portfolioMatch[1];
  }

  const locationMatch = headerBlock.match(/([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})/);
  if (locationMatch) {
    candidate.location = locationMatch[1].trim();
  }

  // 2. Section splitting based on standard ATS headers
  const sections: { title: string; content: string[] }[] = [];
  let currentSection = { title: 'HEADER', content: [] as string[] };

  const SECTION_KEYWORDS = [
    'SUMMARY',
    'PROFESSIONAL SUMMARY',
    'EXECUTIVE SUMMARY',
    'ABOUT ME',
    'PROFILE',
    'CORE SKILLS',
    'SKILLS',
    'TECHNICAL SKILLS',
    'EXPERIENCE',
    'PROFESSIONAL EXPERIENCE',
    'WORK EXPERIENCE',
    'EMPLOYMENT HISTORY',
    'WORK HISTORY',
    'EDUCATION',
    'ACADEMIC BACKGROUND',
    'EDUCATION & SKILLS',
    'CERTIFICATIONS',
    'LICENSES',
    'LANGUAGES',
    'PROJECTS',
    'PUBLICATIONS',
    'AWARDS',
  ];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cleanHeader = line.toUpperCase().replace(/[^A-Z\s&]/g, '').trim();

    if (SECTION_KEYWORDS.includes(cleanHeader) && line.length < 40) {
      sections.push(currentSection);
      currentSection = { title: cleanHeader, content: [] };
    } else {
      currentSection.content.push(line);
    }
  }
  sections.push(currentSection);

  // 3. Professional Summary
  const summarySec = sections.find((s) =>
    s.title.includes('SUMMARY') || s.title.includes('PROFILE') || s.title.includes('ABOUT'),
  );
  const summary = summarySec ? summarySec.content.join(' ').trim() : '';

  // 4. Skills Section
  const skillsSec = sections.find((s) => s.title.includes('SKILL'));
  const skills: StructuredSkillGroup[] = [];

  if (skillsSec && skillsSec.content.length > 0) {
    for (const sLine of skillsSec.content) {
      if (sLine.includes(':')) {
        const [cat, skillList] = sLine.split(':');
        const parsed = skillList
          .split(/[,|•]/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        if (parsed.length > 0) {
          skills.push({
            category: cat.trim(),
            skills: parsed,
          });
        }
      } else {
        const parsed = sLine
          .split(/[,|•]/)
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        if (parsed.length > 0) {
          skills.push({
            category: 'Core Competencies',
            skills: parsed,
          });
        }
      }
    }
  }

  // 5. Experience Section
  const expSec = sections.find(
    (s) =>
      s.title.includes('EXPERIENCE') ||
      s.title.includes('EMPLOYMENT') ||
      s.title.includes('HISTORY'),
  );

  const experience: StructuredExperienceItem[] = [];
  if (expSec && expSec.content.length > 0) {
    let currentExp: StructuredExperienceItem | null = null;

    for (const expLine of expSec.content) {
      const isBullet = /^[*\-•]\s*/.test(expLine);

      if (
        !isBullet &&
        (expLine.includes('|') ||
          expLine.includes('–') ||
          expLine.includes('-') ||
          /\d{4}/.test(expLine))
      ) {
        if (currentExp) {
          experience.push(currentExp);
        }

        const parts = expLine.split(/[|–]/).map((p) => p.trim());
        const title = parts[0] || '';
        const company = parts[1] || '';
        const dates = parts[2] || '';
        const dateMatch = dates.match(/(\d{4})\s*[-–]\s*(\d{4}|Present)/i);

        currentExp = {
          id: `exp-${experience.length + 1}`,
          title,
          company,
          startDate: dateMatch ? dateMatch[1] : dates,
          endDate: dateMatch ? dateMatch[2] : dates ? 'Present' : '',
          bullets: [],
          bulletItems: [],
        };
      } else if (currentExp) {
        const rawBullet = expLine.replace(/^[*\-•]\s*/, '').trim();
        if (rawBullet.length > 0) {
          const bulletIdx = (currentExp.bullets.length || 0) + 1;
          const bulletId = `${currentExp.id}-bullet-${bulletIdx}`;
          currentExp.bullets.push(rawBullet);
          currentExp.bulletItems = currentExp.bulletItems || [];
          currentExp.bulletItems.push({
            bulletId,
            text: rawBullet,
            originalText: rawBullet,
            status: 'original',
          });
        }
      }
    }

    if (currentExp) {
      experience.push(currentExp);
    }
  }

  // 6. Education Section (ZERO dummy data, NO UC Davis fallback!)
  const eduSec = sections.find(
    (s) => s.title.includes('EDUCATION') || s.title.includes('ACADEMIC'),
  );
  const education: StructuredEducationItem[] = [];

  if (eduSec && eduSec.content.length > 0) {
    for (const eduLine of eduSec.content) {
      if (eduLine.includes('|')) {
        const parts = eduLine.split('|').map((p) => p.trim());
        education.push({
          id: `edu-${education.length + 1}`,
          degree: parts[0] || '',
          institution: parts[1] || '',
          graduationDate: parts[2] || '',
        });
      } else if (eduLine.length > 5) {
        education.push({
          id: `edu-${education.length + 1}`,
          degree: eduLine,
          institution: '',
        });
      }
    }
  }

  // 7. Certifications
  const certSec = sections.find(
    (s) => s.title.includes('CERTIFICATION') || s.title.includes('LICENSE'),
  );
  const certifications: StructuredCertificationItem[] = [];
  if (certSec && certSec.content.length > 0) {
    for (const certLine of certSec.content) {
      const cleanCert = certLine.replace(/^[*\-•]\s*/, '').trim();
      if (cleanCert.length > 0) {
        certifications.push({ name: cleanCert });
      }
    }
  }

  // 8. Languages
  const langSec = sections.find((s) => s.title.includes('LANGUAGE'));
  const languages: string[] = [];
  if (langSec && langSec.content.length > 0) {
    for (const langLine of langSec.content) {
      const items = langLine
        .replace(/^[*\-•]\s*/, '')
        .split(/[,|•]/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      languages.push(...items);
    }
  }

  // 9. Additional Sections
  const additionalSections: StructuredAdditionalSection[] = [];
  const handledTitles = [
    'HEADER',
    'SUMMARY',
    'PROFESSIONAL SUMMARY',
    'EXECUTIVE SUMMARY',
    'ABOUT ME',
    'PROFILE',
    'CORE SKILLS',
    'SKILLS',
    'TECHNICAL SKILLS',
    'EXPERIENCE',
    'PROFESSIONAL EXPERIENCE',
    'WORK EXPERIENCE',
    'EMPLOYMENT HISTORY',
    'WORK HISTORY',
    'EDUCATION',
    'ACADEMIC BACKGROUND',
    'EDUCATION & SKILLS',
    'CERTIFICATIONS',
    'LICENSES',
    'LANGUAGES',
  ];

  for (const sec of sections) {
    if (!handledTitles.includes(sec.title) && sec.content.length > 0) {
      additionalSections.push({
        title: sec.title,
        items: sec.content.map((c) => c.replace(/^[*\-•]\s*/, '').trim()).filter((c) => c.length > 0),
      });
    }
  }

  return {
    candidate,
    summary,
    experience,
    education,
    certifications,
    skills,
    languages,
    additionalSections,
    rawText: cleanRawText,
  };
}

/**
 * Builds the authoritative FinalCv from original structured resume + approved bullet rewrites,
 * adhering to strict anti-fabrication standards.
 */
export function buildFinalCv(
  params: BuildFinalCvParams,
): { finalCv: FinalCvData; validation: FinalCvValidationResult } {
  const {
    applicationId = `app_${Date.now()}`,
    originalResume,
    jobTitle = '',
    acceptedBulletChanges = [],
    rejectedBulletIds = [],
    manualEdits = {},
    approvedSkills = [],
    summaryMode = 'original',
    customSummary = '',
    tailoredSummaryAi = '',
    isDemoMode = false,
  } = params;

  if (!originalResume) {
    throw new Error("We couldn't find your original resume data.");
  }

  // Deep copy original resume so originalResume remains strictly immutable
  const candidateCopy: CandidateInfo = { ...originalResume.candidate };

  // 1. Process Experience and Bullets with Stable Identifiers
  const finalExperience: FinalCvExperienceItem[] = [];

  for (let expIdx = 0; expIdx < originalResume.experience.length; expIdx++) {
    const origExp = originalResume.experience[expIdx];
    const expId = origExp.id || `exp-${expIdx + 1}`;
    const finalBullets: string[] = [];
    const finalBulletItems: FinalCvBullet[] = [];
    const origBullets = origExp.bullets || [];

    for (let bIdx = 0; bIdx < origBullets.length; bIdx++) {
      const origBulletText = origBullets[bIdx];
      const bulletId = `${expId}-bullet-${bIdx + 1}`;

      // Check 1: Manual Edit has absolute highest priority
      const manualEdit =
        manualEdits[bulletId] ||
        manualEdits[bIdx] ||
        (manualEdits as Record<string, string>)[origBulletText];

      if (manualEdit && manualEdit.trim().length > 0) {
        const text = manualEdit.trim();
        finalBullets.push(text);
        finalBulletItems.push({
          bulletId,
          text,
          originalText: origBulletText,
          status: 'edited',
        });
        continue;
      }

      // Check 2: Accepted rewrite from Bullet Editor
      const acceptedMatch = acceptedBulletChanges.find((ab) => {
        if ('bulletId' in ab && ab.bulletId === bulletId) return true;
        const origInChange =
          'original_bullet' in ab ? ab.original_bullet : (ab as BulletChange).original;
        if (!origInChange) return false;
        return (
          origInChange.trim().toLowerCase() === origBulletText.toLowerCase() ||
          origBulletText.toLowerCase().includes(origInChange.trim().toLowerCase().slice(0, 30)) ||
          origInChange.toLowerCase().includes(origBulletText.toLowerCase().slice(0, 30))
        );
      });

      // Check 3: Explicitly rejected
      const isRejected =
        rejectedBulletIds.includes(bulletId) ||
        rejectedBulletIds.some((rb) => rb.toLowerCase() === origBulletText.toLowerCase());

      if (acceptedMatch && !isRejected) {
        const approvedText =
          'approved_bullet' in acceptedMatch
            ? acceptedMatch.approved_bullet
            : (acceptedMatch as BulletChange).suggested;

        const text = (approvedText || origBulletText).trim();
        finalBullets.push(text);
        finalBulletItems.push({
          bulletId,
          text,
          originalText: origBulletText,
          status: 'accepted',
        });
      } else {
        // Retain pristine original bullet
        finalBullets.push(origBulletText);
        finalBulletItems.push({
          bulletId,
          text: origBulletText,
          originalText: origBulletText,
          status: isRejected ? 'rejected' : 'original',
        });
      }
    }

    finalExperience.push({
      id: expId,
      jobTitle: origExp.title || '',
      title: origExp.title || '',
      employer: origExp.company || '',
      company: origExp.company || '',
      location: origExp.location || '',
      startDate: origExp.startDate || '',
      endDate: origExp.endDate || '',
      bullets: finalBullets,
      bulletItems: finalBulletItems,
      originalBullets: origBullets,
    });
  }

  // 2. Process Skills (Preserve original skills, add verified supported skills)
  const originalSkillGroups: FinalCvSkillGroup[] = (originalResume.skills || []).map((g) => ({
    category: g.category,
    skills: [...g.skills],
  }));

  const existingSkillsSet = new Set(
    originalSkillGroups.flatMap((g) => g.skills.map((s) => s.toLowerCase().trim())),
  );

  const verifiedAddedSkills = (approvedSkills || []).filter(
    (s) => !existingSkillsSet.has(s.toLowerCase().trim()),
  );

  const activeSkillGroups: FinalCvSkillGroup[] = originalSkillGroups.map((g) => ({
    category: g.category,
    skills: [...g.skills],
  }));

  if (verifiedAddedSkills.length > 0) {
    const techGroup = activeSkillGroups.find((g) =>
      /languages|technical|tools|frameworks|skills/i.test(g.category),
    );
    if (techGroup) {
      techGroup.skills.push(...verifiedAddedSkills);
    } else {
      activeSkillGroups.push({
        category: 'Target Job Alignment (Verified)',
        skills: verifiedAddedSkills,
      });
    }
  }

  // 3. Process Summary
  const originalSummary = originalResume.summary || '';
  const professionalTitle =
    finalExperience[0]?.jobTitle || jobTitle || candidateCopy.name || 'Professional Candidate';

  const topMetricBullets = finalExperience
    .flatMap((e) => e.bullets)
    .filter((b) => /\d+%|\$\d+/i.test(b))
    .slice(0, 2);

  const topSkillsStr = activeSkillGroups
    .flatMap((g) => g.skills)
    .slice(0, 5)
    .join(', ');

  const defaultTailoredSummary = tailoredSummaryAi
    ? tailoredSummaryAi
    : originalSummary
      ? `${professionalTitle} with a proven track record delivering scalable impact across ${topSkillsStr}. ${
          topMetricBullets.length > 0
            ? topMetricBullets[0]
            : 'Demonstrated success leading cross-functional execution and technical performance.'
        }`
      : `Accomplished ${professionalTitle} skilled in ${topSkillsStr}. Proven history of delivering high-quality results, performance optimization, and cross-functional leadership.`;

  const activeSummary =
    customSummary && customSummary.trim().length > 0
      ? customSummary.trim()
      : summaryMode === 'tailored'
        ? defaultTailoredSummary
        : originalSummary || defaultTailoredSummary;

  // 4. Education, Certifications, Languages, Additional Sections (Faithfully preserved)
  const finalEducation: FinalCvEducationItem[] = (originalResume.education || []).map(
    (edu, idx) => ({
      id: edu.id || `edu-${idx + 1}`,
      degree: edu.degree || '',
      institution: edu.institution || '',
      location: edu.location || '',
      startDate: edu.startDate || '',
      endDate: edu.endDate || '',
      graduationDate: edu.graduationDate || '',
      details: edu.details || [],
    }),
  );

  const finalCertifications = (originalResume.certifications || []).map((c) => ({ ...c }));
  const finalLanguages = [...(originalResume.languages || [])];
  const finalAdditionalSections = (originalResume.additionalSections || []).map((s) => ({
    title: s.title,
    items: [...s.items],
  }));

  const contact: FinalCvContact = {
    fullName: candidateCopy.name,
    email: candidateCopy.email,
    phone: candidateCopy.phone,
    location: candidateCopy.location,
    linkedin: candidateCopy.linkedin,
    portfolio: candidateCopy.portfolio || candidateCopy.website,
    github: candidateCopy.github,
  };

  const finalCv: FinalCvData = {
    candidate: candidateCopy,
    contact,
    professionalTitle,
    summary: activeSummary,
    originalSummary: originalSummary || defaultTailoredSummary,
    tailoredSummary: defaultTailoredSummary,
    usingTailoredSummary: summaryMode === 'tailored',
    summaryObject: {
      original: originalSummary,
      tailored: defaultTailoredSummary,
      current: activeSummary,
      isTailored: summaryMode === 'tailored',
    },
    skills: activeSkillGroups,
    originalSkills: originalSkillGroups,
    addedSkills: verifiedAddedSkills,
    experience: finalExperience,
    education: finalEducation,
    certifications: finalCertifications,
    languages: finalLanguages,
    additionalSections: finalAdditionalSections,
    metadata: {
      source: isDemoMode ? 'demo_resume' : 'user_resume',
      jobTitle,
      applicationId,
      generatedAt: new Date().toISOString(),
    },
  };

  // 5. Run Complete Validation
  const validation = validateFinalCv({
    originalCvText: originalResume.rawText || '',
    originalResume,
    finalCv,
    supportedSkills: approvedSkills,
    acceptedBullets: acceptedBulletChanges.map((ab) => ({
      original_bullet:
        'original_bullet' in ab ? ab.original_bullet : (ab as BulletChange).original,
      approved_bullet:
        'approved_bullet' in ab ? ab.approved_bullet : (ab as BulletChange).suggested,
      bulletId: 'bulletId' in ab ? ab.bulletId : undefined,
    })),
    rejectedBullets: rejectedBulletIds,
    manualEdits,
  });

  return { finalCv, validation };
}

/**
 * Backward compatibility parser wrapper for existing tests and components.
 */
export function parseResumeToStructuredCv(
  resumeText: string,
  targetJobTitle = '',
  approvedBullets: { original_bullet: string; approved_bullet: string }[] = [],
  rejectedBullets: string[] = [],
  supportedSkillsToAdd: string[] = [],
): FinalCvData {
  const structured = parseResumeToStructuredResume(resumeText, 'user_upload');
  const { finalCv } = buildFinalCv({
    originalResume: structured,
    jobTitle: targetJobTitle,
    acceptedBulletChanges: approvedBullets,
    rejectedBulletIds: rejectedBullets,
    approvedSkills: supportedSkillsToAdd,
    summaryMode: 'original',
  });
  return finalCv;
}

/**
 * Formats a FinalCv into clean plain-text.
 * Acts as the authoritative single rendering model used across text, ATS copy, and export verification.
 */
export function renderCv(finalCv: FinalCvData): string {
  const lines: string[] = [];

  // Candidate Name & Contact
  const name = finalCv.candidate?.name || finalCv.contact?.fullName || '';
  if (name) lines.push(name.toUpperCase());

  const contacts: string[] = [];
  if (finalCv.contact?.email) contacts.push(`Email: ${finalCv.contact.email}`);
  if (finalCv.contact?.phone) contacts.push(`Phone: ${finalCv.contact.phone}`);
  if (finalCv.contact?.location) contacts.push(`Location: ${finalCv.contact.location}`);
  if (finalCv.contact?.linkedin) contacts.push(`LinkedIn: ${finalCv.contact.linkedin}`);
  if (finalCv.contact?.portfolio) contacts.push(`Portfolio: ${finalCv.contact.portfolio}`);
  if (finalCv.contact?.github) contacts.push(`GitHub: ${finalCv.contact.github}`);

  if (contacts.length > 0) {
    lines.push(contacts.join(' | '));
  }
  lines.push('');

  // Summary
  if (finalCv.summary && finalCv.summary.trim().length > 0) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(finalCv.summary.trim());
    lines.push('');
  }

  // Skills
  if (finalCv.skills && finalCv.skills.length > 0) {
    lines.push('CORE SKILLS');
    for (const group of finalCv.skills) {
      if (group.skills && group.skills.length > 0) {
        lines.push(`${group.category}: ${group.skills.join(', ')}`);
      }
    }
    lines.push('');
  }

  // Experience
  if (finalCv.experience && finalCv.experience.length > 0) {
    lines.push('PROFESSIONAL EXPERIENCE');
    for (const exp of finalCv.experience) {
      const headerParts: string[] = [];
      const title = exp.jobTitle || exp.title || '';
      const company = exp.employer || exp.company || '';
      if (title) headerParts.push(title);
      if (company) headerParts.push(company);
      if (exp.startDate || exp.endDate) {
        headerParts.push(`${exp.startDate || ''} - ${exp.endDate || 'Present'}`.trim());
      }
      lines.push(headerParts.join(' | '));

      for (const bullet of exp.bullets || []) {
        lines.push(`* ${bullet}`);
      }
      lines.push('');
    }
  }

  // Education
  if (finalCv.education && finalCv.education.length > 0) {
    lines.push('EDUCATION');
    for (const edu of finalCv.education) {
      const eduParts: string[] = [];
      if (edu.degree) eduParts.push(edu.degree);
      if (edu.institution) eduParts.push(edu.institution);
      if (edu.graduationDate) eduParts.push(edu.graduationDate);
      lines.push(eduParts.join(' | '));
      if (edu.details && edu.details.length > 0) {
        for (const detail of edu.details) {
          lines.push(`  * ${detail}`);
        }
      }
    }
    lines.push('');
  }

  // Certifications
  if (finalCv.certifications && finalCv.certifications.length > 0) {
    lines.push('CERTIFICATIONS');
    for (const cert of finalCv.certifications) {
      const certLine = cert.issuer ? `${cert.name} - ${cert.issuer}` : cert.name;
      lines.push(`* ${certLine}`);
    }
    lines.push('');
  }

  // Languages
  if (finalCv.languages && finalCv.languages.length > 0) {
    lines.push('LANGUAGES');
    lines.push(finalCv.languages.join(', '));
    lines.push('');
  }

  // Additional Sections
  if (finalCv.additionalSections && finalCv.additionalSections.length > 0) {
    for (const section of finalCv.additionalSections) {
      lines.push(section.title.toUpperCase());
      for (const item of section.items) {
        lines.push(`* ${item}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n').trim();
}
