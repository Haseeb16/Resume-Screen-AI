import type {
  AnalysisResult,
  BulletEditorResponse,
  DocumentInput,
  FinalCvData,
  FinalCvValidationResult,
  StructuredResume,
  BulletChange,
} from '../types.ts';
import {
  validateAnalysisResult,
  validateBulletEditorResponse,
  validateFinalCv,
} from './validation.ts';
import {
  buildFinalCv,
  parseResumeToStructuredResume,
} from './cvParser.ts';

export async function runAnalysis(
  resume: DocumentInput,
  jobDescription: DocumentInput,
): Promise<AnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resume, jobDescription }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Analysis request failed with status ${response.status}`,
    );
  }

  const rawJson = await response.json();
  // Validate schema and enforce rules before passing to UI state for rendering
  return validateAnalysisResult(rawJson);
}

export async function tailorBullets(
  bullets: string[],
  jobDescription: DocumentInput,
  resumeContext?: string,
): Promise<BulletEditorResponse> {
  const response = await fetch('/api/tailor-bullets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ bullets, jobDescription, resumeContext }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Bullet tailoring failed with status ${response.status}`,
    );
  }

  const rawJson = await response.json();
  return validateBulletEditorResponse(rawJson, bullets);
}

export async function buildFinalCvApi(params: {
  resume?: DocumentInput;
  jobDescription?: DocumentInput;
  originalResume?: StructuredResume;
  approvedBullets: (
    | BulletChange
    | { original_bullet?: string; approved_bullet?: string; bulletId?: string; originalText?: string; suggestedText?: string }
  )[];
  rejectedBullets: string[];
  manualEdits?: Record<string | number, string>;
  supportedSkillsToAdd: string[];
  targetJobTitle?: string;
  summaryMode?: 'original' | 'tailored';
  customSummary?: string;
  applicationId?: string;
  isDemoMode?: boolean;
}): Promise<{ finalCv: FinalCvData; validation: FinalCvValidationResult }> {
  try {
    const response = await fetch('/api/build-final-cv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.finalCv && data.validation) {
        return data;
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error) {
        console.warn('Backend build-final-cv returned error:', errorData.error);
      }
    }
  } catch (err) {
    console.warn('API /api/build-final-cv error, using resilient client builder:', err);
  }

  // Client-side fallback builder with 100% fidelity to real user data
  let originalResume: StructuredResume | null = null;
  if (
    params.originalResume &&
    (params.originalResume.candidate?.name ||
      (params.originalResume.experience && params.originalResume.experience.length > 0))
  ) {
    originalResume = params.originalResume;
  } else if (params.resume?.text && params.resume.text.trim().length > 0) {
    const source = params.resume.type === 'pdf' ? 'user_upload' : 'pasted_text';
    originalResume = parseResumeToStructuredResume(params.resume.text, source);
  }

  if (!originalResume) {
    throw new Error("We couldn't find your original resume data.");
  }

  const finalCv = buildFinalCv({
    originalResume,
    jobTitle: params.targetJobTitle || '',
    acceptedBulletChanges: params.approvedBullets,
    rejectedBulletIds: params.rejectedBullets,
    manualEdits: (params.manualEdits as Record<string, string>) || {},
    approvedSkills: params.supportedSkillsToAdd,
    summaryMode: params.summaryMode || 'original',
    customSummary: params.customSummary || '',
    applicationId: params.applicationId || '',
    isDemoMode: params.isDemoMode || false,
  });

  const originalCvText = originalResume.rawText || params.resume?.text || '';
  const validation = validateFinalCv({
    originalCvText,
    finalCv,
    originalResume,
    supportedSkills: params.supportedSkillsToAdd,
    acceptedBullets: params.approvedBullets.map((b) => ({
      original_bullet: (b as any).original_bullet || (b as any).originalText || '',
      approved_bullet: (b as any).approved_bullet || (b as any).suggestedText || (b as any).tailored_bullet || '',
    })),
    rejectedBullets: params.rejectedBullets,
    manualEdits: (params.manualEdits as Record<string, string>) || {},
  });

  return { finalCv, validation };
}

