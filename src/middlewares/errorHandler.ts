import type { NextFunction, Request, Response } from 'express';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ erro: err.message });
  }

  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: string }).code === 'P2002') {
    return res.status(409).json({ erro: 'Conflito de dados no banco' });
  }

  console.error(err);
  return res.status(500).json({ erro: 'Erro interno do servidor' });
}