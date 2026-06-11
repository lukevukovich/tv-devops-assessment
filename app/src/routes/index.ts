import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.send('Luke Vukovich - TurboVets DevOps Assessment');
});

router.get('/health', (_req, res) => {
  res.send('Status: healthy');
});

export default router;
