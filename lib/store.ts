import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Movement {
  id: string;
  type: 'ingreso' | 'gasto';
  amount: number;
  category: string;
  date: string;
  description: string;
}

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
}

interface FinanceState {
  movements: Movement[];
  products: Product[];
  lessonsProgress: Record<string, { status: string; progress: number }>;
  addMovement: (movement: Omit<Movement, 'id' | 'date'>) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateStock: (productId: string, amount: number) => void;
  updateLessonProgress: (lessonId: string, status: string, progress: number) => void;
  getTotals: () => { income: number; expenses: number; balance: number; sales: number };
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      movements: [
        { id: '1', type: 'ingreso', amount: 5000, category: 'Venta', date: new Date().toISOString(), description: 'Venta inicial' }
      ],
      products: [
        { id: '1', name: 'Producto A', stock: 50, price: 100 },
        { id: '2', name: 'Producto B', stock: 20, price: 200 },
      ],
      lessonsProgress: {},
      addMovement: (mv) => set((state) => ({
        movements: [...state.movements, { ...mv, id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString() }]
      })),
      addProduct: (prod) => set((state) => ({
        products: [...state.products, { ...prod, id: Math.random().toString(36).substr(2, 9) }]
      })),
      updateStock: (id, amount) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, stock: p.stock + amount } : p)
      })),
      updateLessonProgress: (lessonId, status, progress) => set((state) => ({
        lessonsProgress: { ...state.lessonsProgress, [lessonId]: { status, progress } }
      })),
      getTotals: () => {
        const { movements } = get();
        const income = movements.filter(m => m.type === 'ingreso').reduce((acc, m) => acc + m.amount, 0);
        const expenses = movements.filter(m => m.type === 'gasto').reduce((acc, m) => acc + m.amount, 0);
        const sales = movements.filter(m => m.type === 'ingreso' && m.category === 'Venta').reduce((acc, m) => acc + m.amount, 0);
        return { income, expenses, balance: income - expenses, sales };
      }
    }),
    {
      name: 'finapp-storage',
    }
  )
);
