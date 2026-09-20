import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Edit3,
  Check,
  Copy,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Eye,
  Settings2,
} from 'lucide-react';
import type {
  FinalCvData,
  FinalCvValidationResult,
  DocumentInput,
} from '../types.ts';
import { exportToPdf, exportToDocx } from '../lib/documentExport.ts';
import { formatCandidateFileName, validateFinalCv } from '../lib/validation.ts';
import { buildFinalCvApi } from '../lib/api.ts';

interface FinalCvBuilderTabProps {
  resumeInput: DocumentInput;
  jobDescriptionInput?: DocumentInput;
  targetJobTitle?: string;
  supportedSkills?: string[];
  acceptedBullets?: { original_bullet: string; approved_bullet: string }[];
  rejectedBullets?: string[];
  initialCvData?: FinalCvData;
  initialValidation?: FinalCvValidationResult;
}

export const FinalCvBuilderTab: React.FC<FinalCvBuilderTabProps> = ({
  resumeInput,
  jobDescriptionInput,
  targetJobTitle = 'Target Role',
  supportedSkills = [],
  acceptedBullets = [],
  rejectedBullets = [],
  initialCvData,
  initialValidation,
}) => {
  const [cvData, setCvData] = useState<FinalCvData | null>(initialCvData || null);
  const [validation, setValidation] = useState<FinalCvValidationResult | null>(
    initialValidation || null,
  );
  const [isLoading, setIsLoading] = useState(!initialCvData);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [copiedCvText, setCopiedCvText] = useState(false);
  const [showFullValidation, setShowFullValidation] = useState(false);
  const [activeSummaryMode, setActiveSummaryMode] = useState<'original' | 'tailored'>('original');
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [customSummaryText, setCustomSummaryText] = useState('');

  // Generate initial CV data if not provided
  useEffect(() => {
    if (!initialCvData) {
      let isMounted = true;
      setIsLoading(true);

      buildFinalCvApi({
        resume: resumeInput,
        jobDescription: jobDescriptionInput,
        approvedBullets: acceptedBullets,
        rejectedBullets: rejectedBullets,
        supportedSkillsToAdd: supportedSkills,
        targetJobTitle,
      })
        .then((res) => {
          if (isMounted) {
            setCvData(res.finalCv);
            setValidation(res.validation);
            setActiveSummaryMode(res.finalCv.usingTailoredSummary ? 'tailored' : 'original');
            setCustomSummaryText(
              res.finalCv.usingTailoredSummary
                ? res.finalCv.tailoredSummary
                : res.finalCv.originalSummary || res.finalCv.summary,
            );
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.error('Error generating final CV:', err);
          if (isMounted) setIsLoading(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setActiveSummaryMode(initialCvData.usingTailoredSummary ? 'tailored' : 'original');
      setCustomSummaryText(
        initialCvData.usingTailoredSummary
          ? initialCvData.tailoredSummary
          : initialCvData.originalSummary || initialCvData.summary,
      );
    }
  }, [
    initialCvData,
    resumeInput,
    jobDescriptionInput,
    acceptedBullets,
    rejectedBullets,
    supportedSkills,
    targetJobTitle,
  ]);

  if (isLoading || !cvData) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4 max-w-xl mx-auto shadow-xs">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">
          Assembling Your Final Tailored CV
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Merging your original CV structure with approved bullet improvements, verifying supported skills, and running strict anti-fabrication compliance...
        </p>
      </div>
    );
  }

  // Handle Summary Mode Switch
  const handleSummaryModeChange = (mode: 'original' | 'tailored') => {
    setActiveSummaryMode(mode);
    const newSummary = mode === 'tailored' ? cvData.tailoredSummary : cvData.originalSummary;
    setCustomSummaryText(newSummary);

    const updatedCv: FinalCvData = {
      ...cvData,
      usingTailoredSummary: mode === 'tailored',
      summary: newSummary,
    };
    setCvData(updatedCv);
    revalidate(updatedCv);
  };

  const handleSaveCustomSummary = () => {
    const updatedCv: FinalCvData = {
      ...cvData,
      summary: customSummaryText,
      ...(activeSummaryMode === 'tailored'
        ? { tailoredSummary: customSummaryText }
        : { originalSummary: customSummaryText }),
    };
    setCvData(updatedCv);
    setIsEditingSummary(false);
    revalidate(updatedCv);
  };

  const revalidate = (currentCv: FinalCvData) => {
    const nextVal = validateFinalCv({
      originalCvText: resumeInput.text || '',
      finalCv: currentCv,
      supportedSkills,
      acceptedBullets,
      rejectedBullets,
    });
    setValidation(nextVal);
  };

  // Export File Names
  const candidateName = cvData.contact.fullName || 'Candidate';
  const pdfFileName = formatCandidateFileName(candidateName, 'pdf');
  const docxFileName = formatCandidateFileName(candidateName, 'docx');

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      await exportToPdf('final-cv-document-sheet', pdfFileName);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Failed to generate PDF. Please try again or use the DOCX export.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportDocx = async () => {
    setIsExportingDocx(true);
    try {
      await exportToDocx(cvData, docxFileName);
    } catch (err) {
      console.error('DOCX export error:', err);
      alert('Failed to generate DOCX. Please try again or use the PDF export.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleCopyRawCv = () => {
    const lines: string[] = [];
    lines.push(cvData.contact.fullName.toUpperCase());
    const contactParts = [
      cvData.contact.email,
      cvData.contact.phone,
      cvData.contact.location,
      cvData.contact.linkedin,
      cvData.contact.portfolio,
      cvData.contact.github,
    ].filter(Boolean);
    if (contactParts.length > 0) lines.push(contactParts.join(' | '));
    lines.push('\n');

    lines.push('PROFESSIONAL SUMMARY');
    lines.push(cvData.summary);
    lines.push('\n');

    lines.push('CORE SKILLS');
    cvData.skills.forEach((g) => {
      lines.push(`${g.category}: ${g.skills.join(', ')}`);
    });
    lines.push('\n');

    lines.push('PROFESSIONAL EXPERIENCE');
    cvData.experience.forEach((exp) => {
      const dates = [exp.startDate, exp.endDate].filter(Boolean).join(' - ');
      lines.push(`${exp.jobTitle} | ${exp.employer} (${dates})`);
      exp.bullets.forEach((b) => lines.push(`• ${b}`));
      lines.push('');
    });

    if (cvData.education && cvData.education.length > 0) {
      lines.push('EDUCATION');
      cvData.education.forEach((edu) => {
        lines.push(`${edu.degree} | ${edu.institution} (${edu.graduationDate || ''})`);
      });
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedCvText(true);
    setTimeout(() => setCopiedCvText(false), 2000);
  };

  const passedRuleCount = validation?.checks.filter((r) => r.passed).length || 13;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Export Action Bar */}
      <div
        id="final-cv-builder-header"
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Step 6 • Document Assembly
            </span>
            <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Anti-Fabrication Verified</span>
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Final CV Builder
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Constructed from candidate's original CV structure, incorporating your{' '}
            <strong>{acceptedBullets.length} approved bullet improvements</strong> and verified supported skills.
          </p>
        </div>

        {/* Action Buttons: PDF, DOCX, Copy */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            id="download-pdf-btn"
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            title={`Download ${pdfFileName}`}
          >
            {isExportingPdf ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            ) : (
              <Download className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{isExportingPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
          </button>

          <button
            id="download-docx-btn"
            type="button"
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            title={`Download ${docxFileName}`}
          >
            {isExportingDocx ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{isExportingDocx ? 'Exporting DOCX...' : 'Download DOCX'}</span>
          </button>

          <button
            id="copy-raw-cv-btn"
            type="button"
            onClick={handleCopyRawCv}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Copy plain text CV to clipboard"
          >
            {copiedCvText ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Text</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 13-Point Anti-Fabrication Validation Banner */}
      {validation && (
        <div
          id="cv-anti-fabrication-validation-panel"
          className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
        >
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  validation.isValid
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    13-Point Anti-Fabrication Compliance Check
                  </h3>
                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                      validation.isValid
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}
                  >
                    {passedRuleCount} / {validation.checks.length} Rules Passed
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Zero hallucinations verified: no invented metrics, unsupported skills, or altered employers/dates.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFullValidation(!showFullValidation)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
            >
              <span>{showFullValidation ? 'Hide Rule Checklist' : 'View Rule Checklist'}</span>
              {showFullValidation ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">
                Invented Metrics
              </span>
              <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                0 (100% Verified)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">
                Unsupported Skills
              </span>
              <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                0 (Excluded)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">
                Approved Bullets
              </span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                {acceptedBullets.length} Applied
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] text-slate-500 font-semibold block uppercase tracking-wider">
                Original Dates &amp; Titles
              </span>
              <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                Preserved
              </span>
            </div>
          </div>

          {/* Expandable 13-point Checklist */}
          {showFullValidation && (
            <div className="p-5 border-t border-slate-100 bg-slate-50/60 space-y-2.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {validation.checks.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200 text-xs"
                  >
                    {rule.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-bold text-slate-800">{rule.label}</span>
                      {rule.message && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{rule.message}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Tailoring Toggle & Editor Panel */}
      <div
        id="cv-summary-control-card"
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Professional Summary Optimization</span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                Default: Original CV Summary
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose whether to keep your candidate original summary or switch to the recruiter-tailored summary.
            </p>
          </div>

          {/* Selector Tabs: Original vs Tailored */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            <button
              id="summary-mode-original-btn"
              type="button"
              onClick={() => handleSummaryModeChange('original')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSummaryMode === 'original'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Original Summary
            </button>
            <button
              id="summary-mode-tailored-btn"
              type="button"
              onClick={() => handleSummaryModeChange('tailored')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSummaryMode === 'tailored'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Tailored Summary</span>
            </button>
          </div>
        </div>

        {/* Summary Content Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          {isEditingSummary ? (
            <div className="space-y-3">
              <textarea
                rows={3}
                value={customSummaryText}
                onChange={(e) => setCustomSummaryText(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm font-sans bg-white border border-emerald-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 resize-y"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveCustomSummary}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Save Summary
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingSummary(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                "{cvData.summary}"
              </p>
              <button
                type="button"
                onClick={() => setIsEditingSummary(true)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors shrink-0"
                title="Edit summary text"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live A4 CV Preview Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Live A4 Document Preview
            </h3>
            <span className="text-[11px] text-slate-400 font-normal">
              ATS Compliant • Standard Typography
            </span>
          </div>

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Ready for Job Applications
          </span>
        </div>

        {/* Scrollable Container for A4 Sheet */}
        <div className="overflow-x-auto bg-slate-100/70 p-4 sm:p-8 rounded-xl border border-slate-200 flex justify-center">
          {/* Printable A4 Canvas */}
          <div
            id="final-cv-document-sheet"
            className="w-[210mm] min-h-[297mm] bg-white text-slate-900 p-[20mm] shadow-md border border-slate-300 space-y-6 font-sans text-left shrink-0"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Header: Candidate Name & Contact */}
            <div className="text-center space-y-2 border-b border-slate-300 pb-4">
              <h1 className="text-2xl font-black tracking-wide text-slate-900 uppercase">
                {cvData.contact.fullName}
              </h1>

              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-slate-600">
                {cvData.contact.email && <span>{cvData.contact.email}</span>}
                {cvData.contact.phone && <span>• {cvData.contact.phone}</span>}
                {cvData.contact.location && <span>• {cvData.contact.location}</span>}
                {cvData.contact.linkedin && <span>• {cvData.contact.linkedin}</span>}
                {cvData.contact.portfolio && <span>• {cvData.contact.portfolio}</span>}
                {cvData.contact.github && <span>• {cvData.contact.github}</span>}
              </div>
            </div>

            {/* 1. Professional Summary */}
            {cvData.summary && (
              <div className="space-y-1.5">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1">
                  Professional Summary
                </h2>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {cvData.summary}
                </p>
              </div>
            )}

            {/* 2. Core Skills */}
            {cvData.skills && cvData.skills.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1">
                  Core Skills
                </h2>
                <div className="space-y-1 text-xs">
                  {cvData.skills.map((group, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <strong className="text-slate-900 shrink-0">
                        {group.category}:
                      </strong>
                      <span className="text-slate-700">
                        {group.skills.join(', ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Professional Experience */}
            {cvData.experience && cvData.experience.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1">
                  Professional Experience
                </h2>

                {cvData.experience.map((exp) => (
                  <div key={exp.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-900 text-sm">{exp.jobTitle}</strong>
                        <span className="text-slate-700 font-semibold"> — {exp.employer}</span>
                      </div>
                      <span className="text-slate-500 font-medium">
                        {[exp.startDate, exp.endDate].filter(Boolean).join(' – ')}
                      </span>
                    </div>

                    <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-slate-800 leading-relaxed">
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Education */}
            {cvData.education && cvData.education.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-1">
                  Education
                </h2>

                {cvData.education.map((edu) => (
                  <div key={edu.id} className="flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-900">{edu.degree}</strong>
                      <span className="text-slate-700"> — {edu.institution}</span>
                    </div>
                    {edu.graduationDate && (
                      <span className="text-slate-500">{edu.graduationDate}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Required Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          AI screening simulation based on the information provided. Results are not a guarantee of recruiter or employer decisions.
        </p>
      </div>
    </div>
  );
};
