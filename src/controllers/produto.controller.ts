import type { NextFunction, Request, Response } from 'express';

import { prisma } from '../prisma/client';
import { AppError } from '../middlewares/errorHandler';

export class ProdutoController {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const { busca, categoriaId, apenasAlerta } = req.query;

      const produtos = await prisma.produto.findMany({
        where: {
          ...(typeof busca === 'string' && busca.trim().length > 0
            ? { nome: { contains: busca.trim() } }
            : {}),
          ...(typeof categoriaId === 'string' ? { categoriaId } : {}),
        },
        include: { categoria: true },
        orderBy: { nome: 'asc' },
      });

      const filtrados = apenasAlerta === 'true'
        ? produtos.filter((produto) => produto.quantidade < produto.quantidadeMinima)
        : produtos;

      return res.json(filtrados);
    } catch (error) {
      return next(error);
    }
  }

  async buscarPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);

      const produto = await prisma.produto.findUnique({
        where: { id },
        include: { categoria: true },
      });

      if (!produto) {
        throw new AppError('Produto não encontrado', 404);
      }

      return res.json(produto);
    } catch (error) {
      return next(error);
    }
  }

  async criar(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        nome,
        categoriaId,
        quantidade,
        quantidadeMinima,
        preco,
        unidade,
        observacao,
        foto,
      } = req.body;

      if (!nome || !categoriaId || preco === undefined) {
        throw new AppError('Campos obrigatórios: nome, categoriaId e preco', 400);
      }

      const categoriaExiste = await prisma.categoria.findUnique({ where: { id: String(categoriaId) } });

      if (!categoriaExiste) {
        throw new AppError('Categoria não encontrada', 404);
      }

      const produto = await prisma.produto.create({
        data: {
          nome: String(nome).trim(),
          categoriaId: String(categoriaId),
          quantidade: quantidade !== undefined ? Number(quantidade) : 0,
          quantidadeMinima: quantidadeMinima !== undefined ? Number(quantidadeMinima) : 0,
          preco: Number(preco),
          unidade: unidade ? String(unidade) : 'un',
          observacao: observacao ? String(observacao) : null,
          foto: foto ? String(foto) : null,
        },
        include: { categoria: true },
      });

      return res.status(201).json(produto);
    } catch (error) {
      return next(error);
    }
  }

  async atualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const {
        nome,
        categoriaId,
        quantidade,
        quantidadeMinima,
        preco,
        unidade,
        observacao,
        foto,
      } = req.body;

      const produtoExiste = await prisma.produto.findUnique({ where: { id } });

      if (!produtoExiste) {
        throw new AppError('Produto não encontrado', 404);
      }

      if (categoriaId !== undefined) {
        const categoriaExiste = await prisma.categoria.findUnique({ where: { id: String(categoriaId) } });

        if (!categoriaExiste) {
          throw new AppError('Categoria não encontrada', 404);
        }
      }

      const produto = await prisma.produto.update({
        where: { id },
        data: {
          ...(nome !== undefined ? { nome: String(nome).trim() } : {}),
          ...(categoriaId !== undefined ? { categoriaId: String(categoriaId) } : {}),
          ...(quantidade !== undefined ? { quantidade: Number(quantidade) } : {}),
          ...(quantidadeMinima !== undefined ? { quantidadeMinima: Number(quantidadeMinima) } : {}),
          ...(preco !== undefined ? { preco: Number(preco) } : {}),
          ...(unidade !== undefined ? { unidade: String(unidade) } : {}),
          ...(observacao !== undefined ? { observacao: observacao ? String(observacao) : null } : {}),
          ...(foto !== undefined ? { foto: foto ? String(foto) : null } : {}),
          ultimaMovimentacao: new Date(),
        },
        include: { categoria: true },
      });

      return res.json(produto);
    } catch (error) {
      return next(error);
    }
  }

  async deletar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);

      const produtoExiste = await prisma.produto.findUnique({ where: { id } });

      if (!produtoExiste) {
        throw new AppError('Produto não encontrado', 404);
      }

      await prisma.produto.delete({ where: { id } });

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  async registrarMovimentacao(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const { tipo, quantidade, observacao } = req.body;

      if (!tipo || (tipo !== 'entrada' && tipo !== 'saida')) {
        throw new AppError('Tipo inválido. Use "entrada" ou "saida"', 400);
      }

      const qty = Number(quantidade);
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new AppError('Quantidade deve ser número positivo', 400);
      }

      const result = await prisma.$transaction(async (tx) => {
        const produto = await tx.produto.findUnique({ where: { id } });
        if (!produto) throw new AppError('Produto não encontrado', 404);

        const novoSaldo = tipo === 'entrada' ? produto.quantidade + qty : produto.quantidade - qty;
        if (novoSaldo < 0) throw new AppError('Saldo insuficiente para essa saída', 409);

        const movimentacao = await tx.movimentacao.create({
          data: {
            tipo,
            quantidade: qty,
            observacao: observacao ? String(observacao) : null,
            produtoId: id,
          },
        });

        const produtoAtualizado = await tx.produto.update({
          where: { id },
          data: { quantidade: novoSaldo, ultimaMovimentacao: new Date() },
        });

        return { movimentacao, produtoAtualizado };
      });

      return res.status(201).json(result.movimentacao);
    } catch (error) {
      return next(error);
    }
  }

  async listarMovimentacoes(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);

      const produto = await prisma.produto.findUnique({ where: { id } });
      if (!produto) throw new AppError('Produto não encontrado', 404);

      const historico = await prisma.movimentacao.findMany({
        where: { produtoId: id },
        orderBy: { criadoEm: 'desc' },
      });

      return res.json(historico);
    } catch (error) {
      return next(error);
    }
  }
}