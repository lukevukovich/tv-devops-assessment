import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.send('Luke Vukovich - TurboVets DevOps Assessment');
});

export default router;
