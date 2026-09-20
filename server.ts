import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { analyzeResume, rewriteBullets, buildFinalCvStructured } from './server/analysis.ts';
import type { DocumentInput } from './src/types.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support up to 35MB for PDF base64 payloads
  app.use(express.json({ limit: '35mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'ResumeScreen AI',
      timestamp: new Date().toISOString(),
    });
  });

  // Main Resume Analysis endpoint
  app.post('/api/analyze', async (req, res) => {
    try {
      const { resume, jobDescription } = req.body as {
        resume?: DocumentInput;
        jobDescription?: DocumentInput;
      };

      if (!resume || (!resume.text?.trim() && !resume.data)) {
        return res.status(400).json({
          error: 'Resume content is required. Please provide either a PDF upload or paste text.',
        });
      }

      if (!jobDescription || (!jobDescription.text?.trim() && !jobDescription.data)) {
        return res.status(400).json({
          error: 'Job description is required. Please provide either a PDF upload or paste text.',
        });
      }

      // Check for oversized PDF data (> 20MB raw payload)
      if (resume.type === 'pdf' && resume.data && resume.data.length > 25 * 1024 * 1024) {
        return res.status(413).json({
          error: 'Resume PDF is too large. Please upload a file smaller than 15MB.',
        });
      }

      if (
        jobDescription.type === 'pdf' &&
        jobDescription.data &&
        jobDescription.data.length > 25 * 1024 * 1024
      ) {
        return res.status(413).json({
          error: 'Job description PDF is too large. Please upload a file smaller than 15MB.',
        });
      }

      const result = await analyzeResume(resume, jobDescription);
      return res.json(result);
    } catch (error: any) {
      console.error('Error in /api/analyze:', error?.message || error);
      const isGeminiError =
        error?.message?.includes('API_KEY') ||
        error?.message?.includes('quota') ||
        error?.message?.includes('RESOURCE_EXHAUSTED');

      return res.status(500).json({
        error: isGeminiError
          ? 'Gemini AI service encountered an issue. Please verify your API key in Settings > Secrets.'
          : error?.message || 'Failed to analyze resume. Please verify your inputs and try again.',
      });
    }
  });

  // Bullet Tailoring endpoint
  app.post('/api/tailor-bullets', async (req, res) => {
    try {
      const { bullets, jobDescription, resumeContext } = req.body as {
        bullets?: string[];
        jobDescription?: DocumentInput;
        resumeContext?: string;
      };

      if (!bullets || !Array.isArray(bullets) || bullets.filter((b) => b?.trim()).length === 0) {
        return res.status(400).json({
          error: 'At least one bullet point must be provided for tailoring.',
        });
      }

      if (!jobDescription || (!jobDescription.text?.trim() && !jobDescription.data)) {
        return res.status(400).json({
          error: 'Job description is required to tailor bullets.',
        });
      }

      const result = await rewriteBullets(bullets, jobDescription, resumeContext);
      return res.json(result);
    } catch (error: any) {
      console.error('Error in /api/tailor-bullets:', error?.message || error);
      return res.status(500).json({
        error: error?.message || 'Failed to tailor bullets. Please try again.',
      });
    }
  });

  // Final CV Builder endpoint
  app.post('/api/build-final-cv', async (req, res) => {
    try {
      const {
        resume,
        jobDescription,
        approvedBullets = [],
        rejectedBullets = [],
        supportedSkillsToAdd = [],
        targetJobTitle = '',
        manualEdits = {},
        summaryMode = 'original',
        customSummary = '',
        originalResume,
        applicationId = '',
        isDemoMode = false,
      } = req.body as {
        resume?: DocumentInput;
        jobDescription?: DocumentInput;
        approvedBullets?: any[];
        rejectedBullets?: string[];
        supportedSkillsToAdd?: string[];
        targetJobTitle?: string;
        manualEdits?: Record<string, string>;
        summaryMode?: 'original' | 'tailored';
        customSummary?: string;
        originalResume?: any;
        applicationId?: string;
        isDemoMode?: boolean;
      };

      if (
        (!resume || (!resume.text?.trim() && !resume.data)) &&
        (!originalResume || (!originalResume.candidate?.name && (!originalResume.experience || originalResume.experience.length === 0)))
      ) {
        return res.status(400).json({
          error: "We couldn't find your original resume data. Resume content is required to build Final CV.",
        });
      }

      const jobDescInput = jobDescription || { type: 'text', text: '' };
      const resumeInput = resume || { type: 'text', text: originalResume?.rawText || '' };
      const result = await buildFinalCvStructured(
        resumeInput,
        jobDescInput,
        approvedBullets,
        rejectedBullets,
        supportedSkillsToAdd,
        targetJobTitle,
        manualEdits,
        summaryMode,
        customSummary,
        originalResume,
        applicationId,
        isDemoMode,
      );

      return res.json(result);
    } catch (error: any) {
      console.error('Error in /api/build-final-cv:', error?.message || error);
      return res.status(500).json({
        error: error?.message || 'Failed to build Final CV. Please try again.',
      });
    }
  });

  // Vite middleware for development, static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ResumeScreen AI server running on port ${PORT}`);
  });
}

startServer();
