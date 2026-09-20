import { Type } from '@google/genai';
import { getGemini } from './gemini.ts';
import {
  RECRUITER_TEST_PROMPT,
  MATCH_PROMPT,
  SKILL_FINDER_PROMPT,
  BULLET_EDITOR_PROMPT,
  FINAL_CV_BUILDER_PROMPT,
} from './prompts.ts';
import {
  validateAnalysisResult,
  validateTailoredBullet,
  hasMetric,
  detectsInventedMetric,
  calculateWordCount,
  extractBusinessImpactFromText,
  validateFinalCv,
} from '../src/lib/validation.ts';
import {
  parseResumeToStructuredCv,
  parseResumeToStructuredResume,
  buildFinalCv,
} from '../src/lib/cvParser.ts';
import type {
  AnalysisResult,
  BulletEditorResponse,
  DocumentInput,
  FinalCvData,
  FinalCvValidationResult,
  StructuredResume,
  BulletChange,
} from '../src/types.ts';

// Clean base64 string if client sent data URI scheme
function sanitizeBase64(base64Str: string): string {
  if (base64Str.includes(',')) {
    return base64Str.split(',')[1];
  }
  return base64Str.trim();
}

async function callGeminiWithFallback<T>(
  fn: (modelName: string) => Promise<T>,
  models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'],
  maxRetriesPerModel = 2,
): Promise<T> {
  let lastError: any = null;

  for (const model of models) {
    let attempt = 0;
    let delay = 1000;

    while (attempt < maxRetriesPerModel) {
      try {
        return await fn(model);
      } catch (error: any) {
        attempt++;
        lastError = error;
        const msg = String(error?.message || error || '');
        const isRetryable =
          error?.status === 503 ||
          error?.code === 503 ||
          msg.includes('503') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE') ||
          error?.status === 429 ||
          error?.code === 429 ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED');

        if (!isRetryable) {
          throw error;
        }

        console.warn(
          `[Gemini API] Model ${model} returned retryable error (${msg.slice(0, 90)}). Attempt ${attempt}/${maxRetriesPerModel}...`,
        );
        await new Promise((res) => setTimeout(res, delay));
        delay *= 1.5;
      }
    }
  }

  throw lastError || new Error('All Gemini model fallbacks exhausted.');
}

export function parseResumeInput(input: DocumentInput): any {
  if (input.type === 'pdf' && input.data) {
    return {
      inlineData: {
        mimeType: 'application/pdf',
        data: sanitizeBase64(input.data),
      },
    };
  }
  return {
    text: `=== CANDIDATE RESUME ===\n${input.text || ''}\n`,
  };
}

export function parseJobDescriptionInput(input: DocumentInput): any {
  if (input.type === 'pdf' && input.data) {
    return {
      inlineData: {
        mimeType: 'application/pdf',
        data: sanitizeBase64(input.data),
      },
    };
  }
  return {
    text: `=== TARGET JOB DESCRIPTION ===\n${input.text || ''}\n`,
  };
}

const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    job_title: {
      type: Type.STRING,
      description: 'The target job title identified from the job description.',
    },
    candidate_headline: {
      type: Type.STRING,
      description: 'The candidate primary role or professional title identified from the resume.',
    },
    detected_bullets: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 to 6 actual experience bullet points extracted verbatim from the candidate resume.',
    },
    six_second_test: {
      type: Type.OBJECT,
      properties: {
        decision: {
          type: Type.STRING,
          description: 'Recruiter decision: "YES" or "NO"',
        },
        confidence: {
          type: Type.INTEGER,
          description: 'Recruiter confidence score from 0 to 100',
        },
        first_glance_reason: {
          type: Type.STRING,
          description: '1-2 punchy sentences summarizing immediate first-glance impression.',
        },
        strongest_signals: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Maximum 3 strongest positive signals seen immediately in 6 seconds.',
        },
        biggest_concern: {
          type: Type.STRING,
          description: 'The single biggest concern, gap, or reservation noticed.',
        },
        recruiter_view: {
          type: Type.STRING,
          description: 'Recruiter internal ATS summary note, maximum 60 words.',
        },
      },
      required: [
        'decision',
        'confidence',
        'first_glance_reason',
        'strongest_signals',
        'biggest_concern',
        'recruiter_view',
      ],
    },
    match: {
      type: Type.OBJECT,
      properties: {
        score: {
          type: Type.INTEGER,
          description: 'Composite match score 0 to 100 based on weighted dimensions.',
        },
        threshold_80_reached: {
          type: Type.BOOLEAN,
          description: 'True if score >= 80, otherwise false.',
        },
        strongest_matches: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3 to 5 areas where the resume matches the job description strongly.',
        },
        important_gaps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '2 to 5 specific requirements where the resume has notable gaps.',
        },
        explanation: {
          type: Type.STRING,
          description: 'Objective explanation of alignment and dimension weights.',
        },
        dimension_scores: {
          type: Type.OBJECT,
          properties: {
            hard_skills: {
              type: Type.INTEGER,
              description: 'Hard skills / tools alignment score (0-100, 35% weight)',
            },
            responsibilities: {
              type: Type.INTEGER,
              description: 'Responsibilities / scope alignment score (0-100, 25% weight)',
            },
            seniority: {
              type: Type.INTEGER,
              description: 'Seniority / experience alignment score (0-100, 15% weight)',
            },
            domain: {
              type: Type.INTEGER,
              description: 'Domain / industry alignment score (0-100, 10% weight)',
            },
            education: {
              type: Type.INTEGER,
              description: 'Education / certifications alignment score (0-100, 5% weight)',
            },
            keywords: {
              type: Type.INTEGER,
              description: 'Terminology / keyword alignment score (0-100, 10% weight)',
            },
          },
          required: [
            'hard_skills',
            'responsibilities',
            'seniority',
            'domain',
            'education',
            'keywords',
          ],
        },
      },
      required: [
        'score',
        'threshold_80_reached',
        'strongest_matches',
        'important_gaps',
        'explanation',
        'dimension_scores',
      ],
    },
    skill_finder: {
      type: Type.OBJECT,
      properties: {
        skills: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              skill: {
                type: Type.STRING,
                description: 'Name of the skill',
              },
              category: {
                type: Type.STRING,
                description:
                  'One of: "Technical / Hard Skills", "Tools / Platforms", "Methods / Frameworks", "Domain Knowledge", "Business Skills"',
              },
              importance: {
                type: Type.STRING,
                description: '"critical" | "high" | "medium" | "nice_to_have"',
              },
              resume_evidence: {
                type: Type.STRING,
                description:
                  'Evidence or quote from resume showing this skill, or "No evidence found" if unsupported.',
              },
              evidence_level: {
                type: Type.STRING,
                description: '"explicit" | "reasonable" | "unsupported"',
              },
              recommended_action: {
                type: Type.STRING,
                description:
                  '"keep" | "add_to_skills" | "add_to_experience" | "do_not_add"',
              },
              suggested_resume_location: {
                type: Type.STRING,
                description: 'Where to place or emphasize this skill, or "None"',
              },
              reasoning: {
                type: Type.STRING,
                description: 'Explanation for why this action was recommended.',
              },
            },
            required: [
              'skill',
              'category',
              'importance',
              'resume_evidence',
              'evidence_level',
              'recommended_action',
              'suggested_resume_location',
              'reasoning',
            ],
          },
        },
        critical_skills_missing_from_resume: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Key required skills missing from the resume.',
        },
        skills_already_present_but_underused: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Skills present in the resume that should be emphasized more.',
        },
      },
      required: [
        'skills',
        'critical_skills_missing_from_resume',
        'skills_already_present_but_underused',
      ],
    },
  },
  required: [
    'job_title',
    'candidate_headline',
    'six_second_test',
    'match',
    'skill_finder',
  ],
};

export async function analyzeResume(
  resumeInput: DocumentInput,
  jobInput: DocumentInput,
): Promise<AnalysisResult> {
  const ai = getGemini();

  const resumePart = parseResumeInput(resumeInput);
  const jobPart = parseJobDescriptionInput(jobInput);

  const instructions = `
You are "ResumeScreen AI", a world-class talent acquisition and resume analysis system.
You will evaluate the provided candidate resume against the provided target job description.

Analyze the documents and generate a complete structured evaluation containing:
1. SIX-SECOND TEST:
${RECRUITER_TEST_PROMPT}

2. RESUME-JOB MATCH:
${MATCH_PROMPT}

3. SKILL FINDER:
${SKILL_FINDER_PROMPT}

CRITICAL ANTI-FABRICATION MANDATE:
- NEVER invent qualifications, skills, tools, responsibilities, certifications, achievements, or metrics that are not supported by the candidate's resume.
- Any skill with no evidence in the resume MUST be marked evidence_level="unsupported" and recommended_action="do_not_add".
- The AI optimizes positioning and clarity; it NEVER fabricates experience.
`;

  const response = await callGeminiWithFallback((modelName) =>
    ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { text: instructions },
          resumePart,
          jobPart,
          {
            text: 'Please execute the 6-second screen, match score calculation, and skill finder now. Return the full structured JSON response according to the provided schema.',
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: analysisResponseSchema,
      },
    }),
  );

  const responseText = response.text;
  if (!responseText) {
    throw new Error('No response received from Gemini analysis engine.');
  }

  const rawParsed = JSON.parse(responseText);

  // Enforce all 8 rules and unit-level validations
  const validatedResult = validateAnalysisResult(rawParsed);
  if (!validatedResult.business_impact || validatedResult.business_impact.detected_impacts.length === 0) {
    validatedResult.business_impact = extractBusinessImpactFromText(
      resumeInput.text || '',
      validatedResult.detected_bullets || [],
    );
  }

  // Generate unique application ID for tracking and audit
  validatedResult.application_id = `app_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Parse structured resume from input text or extracted data
  try {
    if (resumeInput.text && resumeInput.text.trim().length > 0) {
      const source = resumeInput.type === 'pdf' ? 'user_upload' : 'pasted_text';
      validatedResult.structured_resume = parseResumeToStructuredResume(resumeInput.text, source);
    } else if (resumeInput.type === 'pdf' && resumeInput.data) {
      // PDF extraction via Gemini for structured fields
      try {
        const resumePart = parseResumeInput(resumeInput);
        const extractPrompt = `Extract the authentic candidate resume into structured JSON with EXACT fidelity.
Do not fabricate or hallucinate any fields.
JSON schema:
{
  "candidate": { "name": string, "email": string, "phone": string, "location": string, "linkedin": string, "website": string },
  "summary": string,
  "experience": [{ "company": string, "title": string, "location": string, "startDate": string, "endDate": string, "bullets": string[] }],
  "education": [{ "degree": string, "institution": string, "location": string, "graduationDate": string }],
  "skills": [{ "category": string, "skills": string[] }],
  "certifications": string[],
  "languages": string[]
}`;
        const extractRes = await callGeminiWithFallback((modelName) =>
          ai.models.generateContent({
            model: modelName,
            contents: { parts: [{ text: extractPrompt }, resumePart] },
            config: { responseMimeType: 'application/json' },
          }),
        );
        if (extractRes.text) {
          const parsedCv = JSON.parse(extractRes.text);
          let bulletCounter = 1;
          const experience = (parsedCv.experience || []).map((exp: any, eIdx: number) => ({
            id: `exp-${eIdx + 1}`,
            company: exp.company || exp.employer || '',
            title: exp.title || exp.jobTitle || '',
            location: exp.location || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
            bullets: (exp.bullets || []).map((b: any) => {
              const text = typeof b === 'string' ? b : b.text || '';
              return {
                id: `bullet-${bulletCounter++}`,
                text,
                originalText: text,
                isModified: false,
              };
            }),
          }));
          validatedResult.structured_resume = {
            metadata: {
              source: 'user_upload',
              parsedAt: new Date().toISOString(),
              version: '1.0',
            },
            candidate: {
              name: parsedCv.candidate?.name || validatedResult.candidate_headline || '',
              email: parsedCv.candidate?.email || '',
              phone: parsedCv.candidate?.phone || '',
              location: parsedCv.candidate?.location || '',
              linkedin: parsedCv.candidate?.linkedin || '',
              website: parsedCv.candidate?.website || '',
            },
            summary: parsedCv.summary || '',
            experience,
            education: (parsedCv.education || []).map((edu: any, idx: number) => ({
              id: `edu-${idx + 1}`,
              institution: edu.institution || '',
              degree: edu.degree || '',
              location: edu.location || '',
              graduationDate: edu.graduationDate || '',
            })),
            skills: (parsedCv.skills || []).map((s: any) => ({
              category: s.category || 'Skills',
              skills: Array.isArray(s.skills) ? s.skills : [],
            })),
            certifications: Array.isArray(parsedCv.certifications) ? parsedCv.certifications : [],
            languages: Array.isArray(parsedCv.languages) ? parsedCv.languages : [],
            rawText: '',
          };
        }
      } catch (pdfExtractErr) {
        console.warn('Could not extract structured resume from PDF:', pdfExtractErr);
      }
    }
  } catch (parseErr) {
    console.warn('Error parsing structured resume in analyzeResume:', parseErr);
  }

  return validatedResult;
}

const bulletEditorResponseSchema = {
  type: Type.OBJECT,
  properties: {
    bullets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original_bullet: {
            type: Type.STRING,
            description: 'The source bullet provided by user',
          },
          tailored_bullet: {
            type: Type.STRING,
            description:
              'Rewritten HAMS bullet strictly fewer than 20 words (maximum 19 words).',
          },
          word_count: {
            type: Type.INTEGER,
            description: 'Exact number of words in tailored_bullet (must be <= 19).',
          },
          hard_skill: {
            type: Type.STRING,
            description: 'The hard skill or tool emphasized in this bullet.',
          },
          action_verb: {
            type: Type.STRING,
            description: 'The opening action verb used.',
          },
          metric: {
            type: Type.STRING,
            description: 'The verified metric from original, or "None (unverified)".',
          },
          metric_missing: {
            type: Type.BOOLEAN,
            description: 'True if the original bullet did not contain any verified metric.',
          },
          metric_to_verify: {
            type: Type.STRING,
            description:
              'Verification hint for the user if metric was missing (e.g. "[verify: % latency reduction]"), or null if metric exists.',
          },
          why_changed: {
            type: Type.STRING,
            description:
              '1-2 sentence explanation of how this rewrite strengthens recruiter positioning.',
          },
        },
        required: [
          'original_bullet',
          'tailored_bullet',
          'word_count',
          'hard_skill',
          'action_verb',
          'metric',
          'metric_missing',
          'why_changed',
        ],
      },
    },
  },
  required: ['bullets'],
};

const singleBulletResponseSchema = {
  type: Type.OBJECT,
  properties: {
    original_bullet: {
      type: Type.STRING,
      description: 'The source bullet provided by the candidate.',
    },
    tailored_bullet: {
      type: Type.STRING,
      description:
        'The rewritten HAMS resume bullet. MUST BE 19 WORDS OR FEWER. No fabricated metrics.',
    },
    word_count: {
      type: Type.INTEGER,
      description: 'Accurate word count of tailored_bullet (must be <= 19).',
    },
    hard_skill: {
      type: Type.STRING,
      description: 'The primary technical or domain hard skill emphasized.',
    },
    action_verb: {
      type: Type.STRING,
      description: 'The strong opening past-tense action verb (e.g. Engineered).',
    },
    metric: {
      type: Type.STRING,
      description:
        'The verified metric preserved from original bullet, or "None (unverified)".',
    },
    metric_missing: {
      type: Type.BOOLEAN,
      description: 'True if original bullet did not contain any verified metric.',
    },
    metric_to_verify: {
      type: Type.STRING,
      description:
        'Verification hint if metric was missing (e.g. "[verify: % latency reduction]"), or null.',
    },
    why_changed: {
      type: Type.STRING,
      description: '1-2 sentence explanation of recruiter positioning improvements.',
    },
  },
  required: [
    'original_bullet',
    'tailored_bullet',
    'word_count',
    'hard_skill',
    'action_verb',
    'metric',
    'metric_missing',
    'why_changed',
  ],
};

export async function rewriteBullets(
  bullets: string[],
  jobInput: DocumentInput,
  resumeContext?: string,
): Promise<BulletEditorResponse> {
  const ai = getGemini();
  const jobPart = parseJobDescriptionInput(jobInput);

  const cleanBullets = bullets
    .map((b) => b.trim())
    .filter((b) => b.length > 0);

  if (cleanBullets.length === 0) {
    return { bullets: [] };
  }

  const bulletListText = cleanBullets
    .map((b, idx) => `[Bullet ${idx + 1}]: ${b}`)
    .join('\n\n');

  const instructions = `
You are the Bullet Editor for "ResumeScreen AI".
${BULLET_EDITOR_PROMPT}

CRITICAL RULES:
1. MAX 19 WORDS PER TAILORED BULLET.
2. HAMS Structure: Action Verb + Hard Skill + Work/Impact + One Metric.
3. NEVER INVENT METRICS. If none exists, set metric_missing=true, metric="None (unverified)", and provide a bracketed verification recommendation in metric_to_verify.
4. PRESERVE ORIGINAL FACTS. Do not invent achievements.
`;

  const promptParts: any[] = [{ text: instructions }, jobPart];

  if (resumeContext) {
    promptParts.push({
      text: `=== SUPPORTING RESUME CONTEXT ===\n${resumeContext.slice(0, 3000)}\n`,
    });
  }

  promptParts.push({
    text: `Here are the original bullets to tailor:\n\n${bulletListText}\n\nRewrite every bullet adhering strictly to HAMS, maximum 19 words, and zero metric fabrication. Return the structured JSON output.`,
  });

  const response = await callGeminiWithFallback((modelName) =>
    ai.models.generateContent({
      model: modelName,
      contents: {
        parts: promptParts,
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: bulletEditorResponseSchema,
      },
    }),
  );

  const responseText = response.text;
  if (!responseText) {
    throw new Error('No response received from Gemini bullet rewriting engine.');
  }

  const parsed = JSON.parse(responseText);
  const rawBullets = parsed.bullets || [];

  // Automatic post-generation validation and targeted revision loop
  const validatedBullets = await Promise.all(
    cleanBullets.map(async (origBullet, idx) => {
      const returned = rawBullets[idx] || {
        original_bullet: origBullet,
        tailored_bullet: origBullet,
      };

      const originalText = returned.original_bullet || origBullet;
      let tailoredText = String(returned.tailored_bullet || originalText).trim();
      let wordCount = calculateWordCount(tailoredText);
      const originalHasMetric = hasMetric(originalText);
      const inventedMetric = detectsInventedMetric(
        originalText,
        tailoredText,
        returned.metric,
        returned.metric_missing,
      );

      // Validation check:
      // If word_count > 19: automatically ask Gemini to revise the bullet.
      // If the bullet contains an invented or unsupported metric: reject the bullet and regenerate.
      if (wordCount > 19 || inventedMetric) {
        console.warn(
          `[Bullet ${idx + 1}] Validation failed: wordCount=${wordCount} (limit: 19), inventedMetric=${inventedMetric}. Requesting automatic revision from Gemini...`,
        );

        try {
          const failureReasons: string[] = [];
          if (wordCount > 19) {
            failureReasons.push(
              `- Word count is ${wordCount} words (exceeds the strict 19-word ceiling).`,
            );
          }
          if (inventedMetric) {
            failureReasons.push(
              `- INVENTED METRIC DETECTED: Original bullet had no metrics, but fabricated numbers or an invented metric ("${returned.metric || 'metric'}") were added. NEVER invent metrics. Return metric_missing=true and metric="None (unverified)".`,
            );
          }

          const revisionParts: any[] = [
            {
              text: `You are the ResumeScreen AI Bullet Editor.
The previous rewritten bullet FAILED strict validation:

Original Bullet: "${originalText}"
Failed Rewritten Bullet: "${tailoredText}"
Validation Violations:
${failureReasons.join('\n')}

MANDATORY INSTRUCTIONS FOR REVISION:
1. WORD COUNT: MUST BE 19 WORDS OR FEWER. Count every word.
2. ACTION VERB: Begin with a strong action verb.
3. HARD SKILL: Include a supported hard skill from the job description.
4. METRIC: ${
  originalHasMetric
    ? 'Preserve the verified metric from the original bullet.'
    : 'NO METRIC: Original has NO metric. DO NOT INVENT ANY METRIC OR NUMBERS. Set metric_missing=true and metric="None (unverified)".'
}
5. Do not invent technologies or exaggerate ownership.

Return structured JSON adhering to the schema.`,
            },
            jobPart,
          ];

          const revResponse = await callGeminiWithFallback((modelName) =>
            ai.models.generateContent({
              model: modelName,
              contents: { parts: revisionParts },
              config: {
                responseMimeType: 'application/json',
                responseSchema: singleBulletResponseSchema,
              },
            }),
          );

          if (revResponse.text) {
            const revParsed = JSON.parse(revResponse.text);
            return validateTailoredBullet(revParsed, originalText);
          }
        } catch (revError) {
          console.error(
            `[Bullet ${idx + 1}] Automatic revision call failed, using deterministic validation fallback:`,
            revError,
          );
        }
      }

      return validateTailoredBullet(returned, originalText);
    }),
  );

  return { bullets: validatedBullets };
}

export async function buildFinalCvStructured(
  resumeInput: DocumentInput,
  jobInput: DocumentInput,
  approvedBullets: (BulletChange | { original_bullet: string; approved_bullet: string; bulletId?: string })[] = [],
  rejectedBullets: string[] = [],
  supportedSkillsToAdd: string[] = [],
  targetJobTitle = '',
  manualEdits: Record<string, string> = {},
  summaryMode: 'original' | 'tailored' = 'original',
  customSummary = '',
  originalResumeInput?: StructuredResume,
  applicationId = '',
  isDemoMode = false,
): Promise<{ finalCv: FinalCvData; validation: FinalCvValidationResult }> {
  // 1. Resolve authoritative original resume
  let originalResume: StructuredResume;
  if (
    originalResumeInput &&
    (originalResumeInput.candidate?.name || (originalResumeInput.experience && originalResumeInput.experience.length > 0))
  ) {
    originalResume = originalResumeInput;
  } else if (resumeInput.text && resumeInput.text.trim().length > 0) {
    const source = resumeInput.type === 'pdf' ? 'user_upload' : 'pasted_text';
    originalResume = parseResumeToStructuredResume(resumeInput.text, source);
  } else {
    // If it's a PDF without pre-parsed text, create a minimal authentic structure from whatever candidate headline we have
    originalResume = {
      metadata: {
        source: 'user_upload',
        parsedAt: new Date().toISOString(),
        version: '1.0',
      },
      candidate: {
        name: '',
        email: '',
        phone: '',
        location: '',
      },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      certifications: [],
      languages: [],
      rawText: '',
    };
  }

  // 2. Build final CV using authoritative cvParser
  const finalCv = buildFinalCv({
    originalResume,
    jobTitle: targetJobTitle,
    acceptedBulletChanges: approvedBullets,
    rejectedBulletIds: rejectedBullets,
    manualEdits,
    approvedSkills: supportedSkillsToAdd,
    summaryMode,
    customSummary,
    applicationId,
    isDemoMode,
  });

  // 3. Optionally use Gemini to polish tailoredSummary with zero hallucination if requested
  if (summaryMode === 'tailored' && !customSummary && finalCv.experience.length > 0) {
    try {
      const ai = getGemini();
      const resumePart = parseResumeInput(resumeInput);
      const jobPart = parseJobDescriptionInput(jobInput);

      const summaryPrompt = `
You are the ResumeScreen AI Final CV Builder.
${FINAL_CV_BUILDER_PROMPT}

Candidate Career Experience:
${JSON.stringify(finalCv.experience.map((e) => ({ role: e.jobTitle, company: e.employer, highlights: e.bullets.slice(0, 2) })))}

Verified Supported Skills:
${finalCv.skills.flatMap((s) => s.skills).join(', ')}

Candidate Original Summary:
"${finalCv.originalSummary}"

Generate:
1. "tailoredSummary": A high-impact 2-3 sentence recruiter profile explicitly tailored to the target job description. Ground every statement in verified resume evidence. NEVER invent years of experience, degrees, or unverified achievements.

Return structured JSON: { "tailoredSummary": "..." }
`;

      const summaryResponse = await callGeminiWithFallback((modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [{ text: summaryPrompt }, resumePart, jobPart],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                tailoredSummary: { type: Type.STRING },
              },
              required: ['tailoredSummary'],
            },
          },
        }),
      );

      if (summaryResponse.text) {
        const parsed = JSON.parse(summaryResponse.text);
        if (parsed.tailoredSummary && parsed.tailoredSummary.trim().length > 20) {
          finalCv.tailoredSummary = parsed.tailoredSummary.trim();
          finalCv.summary = finalCv.tailoredSummary;
        }
      }
    } catch (err) {
      console.warn('[Final CV Builder] Using deterministic summary fallback:', err);
    }
  }

  // 4. Run strict 13-point validation with originalResume cross-referencing
  const originalCvText = originalResume.rawText || resumeInput.text || '';
  const validation = validateFinalCv({
    originalCvText,
    finalCv,
    originalResume,
    supportedSkills: supportedSkillsToAdd,
    acceptedBullets: approvedBullets.map((b) => ({
      original_bullet: (b as any).original_bullet || (b as any).originalText || '',
      approved_bullet: (b as any).approved_bullet || (b as any).tailored_bullet || (b as any).suggestedText || '',
    })),
    rejectedBullets,
    manualEdits,
  });

  return { finalCv, validation };
}


