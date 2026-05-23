import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../middlewares/errorHandler';
import { prisma } from '../prisma/client';

export class CategoriaController {
  async listar(_req: Request, res: Response, next: NextFunction) {
    try {
      const categorias = await prisma.categoria.findMany({
        orderBy: { nome: 'asc' },
        include: {
          _count: {
            select: {
              produtos: true,
            },
          },
        },
      });

      return res.json(categorias);
    } catch (error) {
      return next(error);
    }
  }

  async buscarPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);

      const categoria = await prisma.categoria.findUnique({
        where: { id },
        include: {
          produtos: {
            orderBy: { nome: 'asc' },
          },
        },
      });

      if (!categoria) {
        throw new AppError('Categoria não encontrada', 404);
      }

      return res.json(categoria);
    } catch (error) {
      return next(error);
    }
  }
}