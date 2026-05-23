import dotenv from 'dotenv';

import app from './app';

dotenv.config();

const port = Number(process.env.PORT) || 3333;

app.listen(port, () => {
  console.log(`API ProEstoque rodando na porta ${port}`);
});