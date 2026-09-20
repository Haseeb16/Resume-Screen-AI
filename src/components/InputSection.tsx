import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  File,
  X,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { DocumentInput } from '../types.ts';
import { SAMPLE_SCENARIOS } from '../sampleData.ts';

interface InputSectionProps {
  resume: DocumentInput;
  jobDescription: DocumentInput;
  onResumeChange: (input: DocumentInput) => void;
  onJobChange: (input: DocumentInput) => void;
  onAnalyze: () => void;
  isLoading: boolean;
  onLoadSample: (scenarioId: string) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  resume,
  jobDescription,
  onResumeChange,
  onJobChange,
  onAnalyze,
  isLoading,
  onLoadSample,
}) => {
  const [resumeTab, setResumeTab] = useState<'pdf' | 'text'>('pdf');
  const [jobTab, setJobTab] = useState<'pdf' | 'text'>('text');
  const [resumeDragActive, setResumeDragActive] = useState(false);
  const [jobDragActive, setJobDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const resumeFileInputRef = useRef<HTMLInputElement>(null);
  const jobFileInputRef = useRef<HTMLInputElement>(null);

  // File size formatter
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFile = (
    file: File,
    type: 'resume' | 'job',
  ) => {
    setUploadError(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Only PDF files are supported for upload. Alternatively, paste plain text.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds the 15MB limit. Please upload a smaller PDF or paste text.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const docInput: DocumentInput = {
        type: 'pdf',
        name: file.name,
        size: file.size,
        data: base64,
      };

      if (type === 'resume') {
        onResumeChange(docInput);
        setResumeTab('pdf');
      } else {
        onJobChange(docInput);
        setJobTab('pdf');
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read the uploaded PDF file. Please try again or paste text.');
    };
    reader.readAsDataURL(file);
  };

  const isResumeReady = Boolean(
    (resume.type === 'pdf' && resume.data) ||
      (resume.type === 'text' && resume.text?.trim()),
  );

  const isJobReady = Boolean(
    (jobDescription.type === 'pdf' && jobDescription.data) ||
      (jobDescription.type === 'text' && jobDescription.text?.trim()),
  );

  const canAnalyze = isResumeReady && isJobReady && !isLoading;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Intro hero banner */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multimodal Recruiter Screen Engine</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Would a recruiter interview you in 7 seconds?
        </h2>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          Simulate an authentic first-pass screening review, calculate exact weighted job alignment, identify missing or underused skills, and rewrite your bullets to the strict HAMS standard.
        </p>

        {/* Quick sample loader */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Or load a sample profile:</span>
          {SAMPLE_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              id={`sample-btn-${sc.id}`}
              type="button"
              onClick={() => {
                setUploadError(null);
                onLoadSample(sc.id);
                setResumeTab('text');
                setJobTab('text');
              }}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium shadow-2xs hover:border-slate-400 transition-all flex items-center gap-1.5"
            >
              <span>{sc.title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {sc.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {uploadError && (
        <div
          id="upload-error-banner"
          className="max-w-4xl mx-auto mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm"
        >
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">{uploadError}</div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-400 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main 2-column input grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT SIDE / RESUME */}
        <div
          id="resume-input-card"
          className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all focus-within:border-slate-300"
        >
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Your Resume</h3>
                <p className="text-xs text-slate-500">PDF document or plain text paste</p>
              </div>
            </div>
            {isResumeReady && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Resume Loaded</span>
              </span>
            )}
          </div>

          {/* Card Tabs */}
          <div className="flex border-b border-slate-200 bg-white">
            <button
              id="resume-tab-pdf"
              type="button"
              onClick={() => setResumeTab('pdf')}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                resumeTab === 'pdf'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/30'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload PDF</span>
            </button>
            <button
              id="resume-tab-text"
              type="button"
              onClick={() => setResumeTab('text')}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                resumeTab === 'text'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/30'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paste Text</span>
            </button>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {resumeTab === 'pdf' ? (
              <div>
                {resume.type === 'pdf' && resume.data ? (
                  <div
                    id="resume-file-loaded-view"
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <File className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {resume.name || 'resume.pdf'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(resume.size)} • PDF Ready for Gemini Analysis
                        </p>
                      </div>
                    </div>
                    <button
                      id="remove-resume-file-btn"
                      type="button"
                      onClick={() => {
                        onResumeChange({ type: 'pdf', data: '', name: '', size: 0 });
                        if (resumeFileInputRef.current) {
                          resumeFileInputRef.current.value = '';
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors ml-3"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    id="resume-dropzone"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setResumeDragActive(true);
                    }}
                    onDragLeave={() => setResumeDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setResumeDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFile(e.dataTransfer.files[0], 'resume');
                      }
                    }}
                    onClick={() => resumeFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      resumeDragActive
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <input
                      ref={resumeFileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFile(e.target.files[0], 'resume');
                        }
                      }}
                    />
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-3">
                      <UploadCloud className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Click to upload or drag & drop your Resume PDF
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      PDF format up to 15MB • Analyzed natively with Gemini document reasoning
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  id="resume-text-input"
                  rows={10}
                  value={resume.text || ''}
                  onChange={(e) =>
                    onResumeChange({
                      type: 'text',
                      text: e.target.value,
                    })
                  }
                  placeholder="Paste your full resume text here (Summary, Work Experience, Skills, Education)..."
                  className="w-full p-3.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-800 resize-y"
                />
                <div className="flex justify-between items-center text-xs text-slate-500 mt-2 px-1">
                  <span>
                    {resume.text ? `${resume.text.trim().split(/\s+/).filter(Boolean).length} words` : '0 words'}
                  </span>
                  {resume.text && (
                    <button
                      type="button"
                      onClick={() => onResumeChange({ type: 'text', text: '' })}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      Clear text
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE / JOB DESCRIPTION */}
        <div
          id="job-input-card"
          className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all focus-within:border-slate-300"
        >
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Job Description</h3>
                <p className="text-xs text-slate-500">Target role posting or requirements</p>
              </div>
            </div>
            {isJobReady && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Job Loaded</span>
              </span>
            )}
          </div>

          {/* Card Tabs */}
          <div className="flex border-b border-slate-200 bg-white">
            <button
              id="job-tab-text"
              type="button"
              onClick={() => setJobTab('text')}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                jobTab === 'text'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paste Text</span>
            </button>
            <button
              id="job-tab-pdf"
              type="button"
              onClick={() => setJobTab('pdf')}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                jobTab === 'pdf'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/30'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload PDF</span>
            </button>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {jobTab === 'pdf' ? (
              <div>
                {jobDescription.type === 'pdf' && jobDescription.data ? (
                  <div
                    id="job-file-loaded-view"
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                        <File className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {jobDescription.name || 'job_description.pdf'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(jobDescription.size)} • PDF Ready for Gemini Analysis
                        </p>
                      </div>
                    </div>
                    <button
                      id="remove-job-file-btn"
                      type="button"
                      onClick={() => {
                        onJobChange({ type: 'pdf', data: '', name: '', size: 0 });
                        if (jobFileInputRef.current) {
                          jobFileInputRef.current.value = '';
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors ml-3"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    id="job-dropzone"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setJobDragActive(true);
                    }}
                    onDragLeave={() => setJobDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setJobDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFile(e.dataTransfer.files[0], 'job');
                      }
                    }}
                    onClick={() => jobFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      jobDragActive
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <input
                      ref={jobFileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFile(e.target.files[0], 'job');
                        }
                      }}
                    />
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-3">
                      <UploadCloud className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      Click to upload or drag & drop Job Description PDF
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      PDF format up to 15MB • Full document context extracted
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  id="job-text-input"
                  rows={10}
                  value={jobDescription.text || ''}
                  onChange={(e) =>
                    onJobChange({
                      type: 'text',
                      text: e.target.value,
                    })
                  }
                  placeholder="Paste the job posting description here (Role overview, Responsibilities, Requirements, Preferred qualifications)..."
                  className="w-full p-3.5 text-xs sm:text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-slate-800 resize-y"
                />
                <div className="flex justify-between items-center text-xs text-slate-500 mt-2 px-1">
                  <span>
                    {jobDescription.text
                      ? `${jobDescription.text.trim().split(/\s+/).filter(Boolean).length} words`
                      : '0 words'}
                  </span>
                  {jobDescription.text && (
                    <button
                      type="button"
                      onClick={() => onJobChange({ type: 'text', text: '' })}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      Clear text
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main CTA Section */}
      <div className="mt-8 flex flex-col items-center justify-center">
        <button
          id="main-analyze-button"
          type="button"
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className={`w-full sm:w-auto min-w-[280px] px-8 py-4 rounded-xl font-bold text-base shadow-sm transition-all flex items-center justify-center gap-2.5 ${
            canAnalyze
              ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer shadow-emerald-600/20 hover:shadow-md'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Analyze My Resume</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {!isResumeReady && !isJobReady && (
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Please provide both your resume and the target job description to begin analysis.
          </p>
        )}
        {isResumeReady && !isJobReady && (
          <p className="text-xs text-amber-600 mt-2 font-medium">
            Resume ready. Please provide the job description to begin analysis.
          </p>
        )}
        {!isResumeReady && isJobReady && (
          <p className="text-xs text-amber-600 mt-2 font-medium">
            Job description ready. Please provide your resume to begin analysis.
          </p>
        )}
      </div>
    </div>
  );
};
