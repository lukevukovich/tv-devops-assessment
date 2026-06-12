import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.send('TurboVets DevOps Assessment<br>Luke Vukovich');
});

router.get('/health', (_req, res) => {
  res.send('Healthy');
});

export default router;
