import cors from 'cors';
import express from 'express';

import { errorHandler } from './middlewares/errorHandler';
import { router } from './routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'ProEstoque API' });
});

app.use('/api', router);
app.use(errorHandler);

export default app;