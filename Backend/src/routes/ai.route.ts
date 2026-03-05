import { Router } from 'express';
import {
    evaluateResume,
    buildResume,
    buildCoverLetter,
    getBaseResume,
    updateBaseResume,
} from '../controllers/ai.controller.js';

const router = Router();

// ─── 3-Step Resume Generation Flow ───────────────────────────────────────────
//
// Step 1: Evaluate   →  POST /resume/evaluate/:jobId
//                          ↓  returns { evaluationId }
//
// Step 2: Build PDF  →  POST /resume/build/:evaluationId
//                          ↓  returns { resumeUrl }
//
// Step 3: Cover Ltr  →  POST /resume/cover-letter/:evaluationId
//                          ↓  returns { coverLetterUrl }
//
// Steps 2 and 3 can run independently (or in parallel from client) once you have evaluationId.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/evaluate', evaluateResume);
router.post('/build/:evaluationId', buildResume);
router.post('/cover-letter/:evaluationId', buildCoverLetter);

// Base resume CRUD
router.get('/base', getBaseResume);
router.patch('/base', updateBaseResume);

export default router;