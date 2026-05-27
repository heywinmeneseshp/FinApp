import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from './auth-options';

// â”€â”€â”€ Session helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export async function getSessionUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session.user.id;
}

// â”€â”€â”€ Error classes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso no encontrado') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

// â”€â”€â”€ Response helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function error(err: unknown) {
  if (err instanceof AppError) {
    return NextResponse.json(
      { error: err.message },
      { status: err.statusCode },
    );
  }

  if (err instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: err.issues },
      { status: 400 },
    );
  }

  console.error('Unhandled API error:', err);
  return NextResponse.json(
    { error: 'Error interno del servidor' },
    { status: 500 },
  );
}

// â”€â”€â”€ Zod schemas compartidos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const productSchema = z.object({
  name: z.string().min(1).max(100),
  stock: z.number().int().min(0).default(0),
  price: z.number().min(0),
  cost: z.number().min(0).default(0),
  minStock: z.number().int().min(0).default(5),
  category: z.string().max(80).optional().default(''),
  unit: z.string().max(40).optional().default('Unidad'),
});

export const movementSchema = z.object({
  type: z.enum(['ingreso', 'gasto']),
  amount: z.number().positive(),
  category: z.string().max(80).optional().default(''),
  description: z.string().max(200).optional().default(''),
  date: z.string().optional(),
  accountId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  paymentMethod: z.enum(['cash', 'credit', 'bank']).optional().default('cash'),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        price: z.number().min(0),
        cost: z.number().min(0).default(0),
      }),
    )
    .optional()
    .default([]),
});

export const customerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().max(20).optional().default(''),
  email: z.string().email().optional().or(z.literal('')).default(''),
  acceptedReceipt: z.boolean().optional().default(false),
  acceptedPromotions: z.boolean().optional().default(false),
});

// â”€â”€â”€ Generar UUID simple (fallback si crypto no disponible) â”€â”€
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
