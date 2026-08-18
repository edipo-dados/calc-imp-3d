import { Router, Request, Response } from 'express';
import { projecaoInputSchema } from '../schemas/calculoInput.schema';
import { calcularProjecaoMensal } from '../services/calculoService';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const result = projecaoInputSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten().fieldErrors });
  }
  const projecao = calcularProjecaoMensal(result.data);
  return res.json(projecao);
});

export default router;
