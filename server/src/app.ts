import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import orcamentosRouter from './routes/orcamentos';
import filamentosRouter from './routes/filamentos';
import projecaoRouter from './routes/projecao';
import impressorasRouter from './routes/impressoras';
import { authRequired } from './middleware/auth';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (public)
app.use('/api/auth', authRouter);

// Protected routes (require login)
app.use('/api/orcamentos', authRequired, orcamentosRouter);
app.use('/api/filamentos', authRequired, filamentosRouter);
app.use('/api/projecao', authRequired, projecaoRouter);
app.use('/api/impressoras', authRequired, impressorasRouter);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

export default app;
