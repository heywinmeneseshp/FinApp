import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db } from './firebase';
import { collection, doc, writeBatch, getDocs, setDoc } from 'firebase/firestore';
import { generateId } from './generate-id';
import { robustStorage } from './storage';

interface Customer {
  id: string; 
  name: string;
  email: string;
  phone: string;
  acceptedReceipt: boolean;
  acceptedPromotions: boolean;
  lastUpdated: string;
}

interface Movement {
  id: string;
  type: 'ingreso' | 'gasto';
  amount: number;
  category: string;
  date: string;
  description: string;
  items?: { productId: string; quantity: number; price: number; cost?: number }[];
  customerId?: string;
  supplierId?: string;
  paymentMethod?: 'cash' | 'credit' | 'bank';
  accountId?: string;
}

interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'savings' | 'other';
  initialBalance: number;
  color?: string;
}

interface Product {
  id: string;
  name: string;
  stock: number;
  price: number;
  cost: number;
  minStock?: number;
  category?: string;
  unit?: string;
}

interface Supplier {
  id: string; 
  name: string;
  phone?: string;
  email?: string;
}

interface AccountPayable {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paidAmount: number;
  date: string;
  dueDate: string;
  status: 'pending' | 'partial' | 'paid';
  description: string;
  purchaseItems?: { productId: string; name: string; quantity: number; cost: number }[];
}

interface AccountReceivable {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  paidAmount: number;
  date: string;
  dueDate: string;
  status: 'pending' | 'partial' | 'paid';
  description: string;
}

interface FinanceState {
  user: { uid: string; email: string | null; sessionId?: string } | null;
  movements: Movement[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  accountsPayable: AccountPayable[];
  accountsReceivable: AccountReceivable[];
  accounts: Account[];
  lessonsProgress: Record<string, { status: string; progress: number }>;
  hasUnsavedChanges: boolean;
  syncVersion: number;
  lastCloudSync: string | null;
  setUser: (user: { uid: string; email: string | null; sessionId?: string } | null) => void;
  setSessionId: (sessionId: string) => void;
  addMovement: (movement: Omit<Movement, 'id' | 'date'>) => void;
  addSale: (items: { productId: string; quantity: number; price: number }[], description: string, customerId?: string, paymentMethod?: 'cash' | 'credit' | 'bank', dueDate?: string, accountId?: string) => void;
  recordPurchase: (data: {
    productId: string;
    quantity: number;
    cost: number;
    paymentMethod: 'cash' | 'credit' | 'bank';
    supplierId?: string;
    supplierName?: string;
    dueDate?: string;
    observation?: string;
    accountId?: string;
  }) => void;
  payAccountPayable: (id: string, amount: number, method: 'cash' | 'bank', accountId?: string) => void;
  collectAccountReceivable: (id: string, amount: number, method: 'cash' | 'bank', accountId?: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  upsertCustomer: (customer: Customer) => void;
  upsertSupplier: (supplier: Supplier) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, data: Partial<Omit<Account, 'id'>>) => void;
  deleteAccount: (id: string) => void;
  updateStock: (productId: string, amount: number) => void;
  adjustStock: (productId: string, newStock: number, reason: string) => void;
  updateProduct: (productId: string, data: Partial<Omit<Product, 'id'>>) => void;
  updateLessonProgress: (lessonId: string, status: string, progress: number) => void;
  getTotals: () => { 
    income: number; 
    expenses: number; 
    balance: number; 
    sales: number;
    inventoryValue: number;
    totalAP: number;
    totalAR: number;
    netProfit: number;
  };
  syncLocalToCloud: () => Promise<void>;
  syncCloudToLocal: () => Promise<void>;
  setSyncVersion: (v: number) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      user: null,
      movements: [
        { id: '1', type: 'ingreso', amount: 5000, category: 'Venta', date: new Date().toISOString(), description: 'Venta inicial' }
      ],
      products: [
        { id: '1', name: 'Zapatillas Runner', stock: 15, price: 8500, cost: 4500, minStock: 5 },
        { id: '2', name: 'Camiseta Deportiva', stock: 42, price: 2500, cost: 1200, minStock: 10 },
        { id: '3', name: 'Gorra Training', stock: 8, price: 1500, cost: 700, minStock: 5 },
      ],
      customers: [],
      suppliers: [],
      accountsPayable: [],
      accountsReceivable: [],
      accounts: [
        { id: 'default-cash', name: 'Caja Principal (Efectivo)', type: 'cash', initialBalance: 0, color: '#12C2A2' },
        { id: 'default-bank', name: 'Banco Principal', type: 'bank', initialBalance: 0, color: '#3B82F6' }
      ],
      lessonsProgress: {},
      hasUnsavedChanges: false,
      syncVersion: 0,
      lastCloudSync: null,
      setUser: (user) => set({ user }),
      setSyncVersion: (v) => set({ syncVersion: v }),
      setSessionId: (sessionId) => set((state) => ({ 
        user: state.user ? { ...state.user, sessionId } : null 
      })),
      addMovement: (mv) => set((state) => ({
        movements: [...state.movements, { 
          ...mv, 
          amount: Number(mv.amount.toFixed(2)),
          id: generateId(), 
          date: new Date().toISOString() 
        }],
        hasUnsavedChanges: true
      })),
      addSale: (items, description, customerId, paymentMethod = 'cash', dueDate, accountId) => {
        if (items.length === 0) return;
        const total = Number(items.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2));
        const saleId = generateId();
        const productsState = get().products;
        const customersState = get().customers;
        
        const itemsWithCost = items.map(item => {
          const product = productsState.find(p => p.id === item.productId);
          return { ...item, cost: product?.cost || 0 };
        });

        set((state) => {
          const newMovements = [...state.movements];
          const newAR = [...state.accountsReceivable];
          const customer = customersState.find(c => c.id === customerId);

          if (paymentMethod !== 'credit') {
            newMovements.push({
              id: saleId,
              type: 'ingreso',
              amount: total,
              category: 'Venta',
              date: new Date().toISOString(),
              description: description || `Venta de ${items.length} productos`,
              items: itemsWithCost,
              customerId,
              paymentMethod,
              accountId: accountId || (paymentMethod === 'bank' ? 'default-bank' : 'default-cash')
            });
          } else if (customerId && dueDate) {
            newAR.push({
              id: saleId,
              customerId,
              customerName: customer?.name || 'Cliente',
              amount: total,
              paidAmount: 0,
              date: new Date().toISOString(),
              dueDate: dueDate,
              status: 'pending',
              description: description || `Venta a crédito: ${items.length} productos`
            });
          }

          return {
            movements: newMovements,
            accountsReceivable: newAR,
            products: state.products.map(p => {
              const saleItem = items.find(i => i.productId === p.id);
              return saleItem ? { ...p, stock: p.stock - saleItem.quantity } : p;
            }),
            hasUnsavedChanges: true
          };
        });
      },
      recordPurchase: (data) => {
        const total = Number((data.cost * data.quantity).toFixed(2));
        const purchaseId = generateId();
        const date = new Date().toISOString();
        const product = get().products.find(p => p.id === data.productId);

        set((state) => {
          const newMovements = [...state.movements];
          const newAP = [...state.accountsPayable];
          
          if (data.paymentMethod !== 'credit') {
            newMovements.push({
              id: purchaseId,
              type: 'gasto',
              amount: total,
              category: 'Compra de Inventario',
              date,
              description: `Compra: ${data.quantity}x ${product?.name || 'Producto'}`,
              paymentMethod: data.paymentMethod,
              supplierId: data.supplierId,
              accountId: data.accountId || (data.paymentMethod === 'bank' ? 'default-bank' : 'default-cash')
            });
          } else if (data.supplierId && data.dueDate) {
            newAP.push({
              id: purchaseId,
              supplierId: data.supplierId,
              supplierName: data.supplierName || 'Proveedor',
              amount: total,
              paidAmount: 0,
              date,
              dueDate: data.dueDate,
              status: 'pending',
              description: `Compra a crédito: ${data.quantity}x ${product?.name}`,
              purchaseItems: [{ productId: data.productId, name: product?.name || '', quantity: data.quantity, cost: data.cost }]
            });
          }

          return {
            movements: newMovements,
            accountsPayable: newAP,
            products: state.products.map(p => {
              if (p.id === data.productId) {
                const existingStock = Math.max(0, p.stock || 0);
                const existingCost = p.cost || 0;
                const newQuantity = data.quantity;
                const newPurchasePrice = data.cost;
                
                // Formula de Precio Medio Ponderado (PMP): ((Q1 * C1) + (Q2 * C2)) / (Q1 + Q2)
                const totalQuantity = existingStock + newQuantity;
                const newAverageCost = totalQuantity > 0 
                  ? ((existingStock * existingCost) + (newQuantity * newPurchasePrice)) / totalQuantity
                  : newPurchasePrice;

                return { 
                  ...p, 
                  stock: totalQuantity, 
                  cost: Number(newAverageCost.toFixed(2))
                };
              }
              return p;
            }),
            hasUnsavedChanges: true
          };
        });
      },
      payAccountPayable: (id, amount, method, accountId) => {
        set((state) => {
          const apIndex = state.accountsPayable.findIndex(a => a.id === id);
          if (apIndex === -1) return state;

          const ap = state.accountsPayable[apIndex];
          const newPaidAmount = ap.paidAmount + amount;
          const newStatus = newPaidAmount >= ap.amount ? 'paid' : 'partial';

          const updatedAP = [...state.accountsPayable];
          updatedAP[apIndex] = { ...ap, paidAmount: newPaidAmount, status: newStatus };

          const newMovement: Movement = {
            id: generateId(),
            type: 'gasto',
            amount: amount,
            category: 'Pago a Proveedor',
            date: new Date().toISOString(),
            description: `Pago de deuda a ${ap.supplierName}`,
            paymentMethod: method,
            supplierId: ap.supplierId,
            accountId: accountId || (method === 'bank' ? 'default-bank' : 'default-cash')
          };

          return {
            accountsPayable: updatedAP,
            movements: [...state.movements, newMovement],
            hasUnsavedChanges: true
          };
        });
      },
      collectAccountReceivable: (id, amount, method, accountId) => {
        set((state) => {
          const arIndex = state.accountsReceivable.findIndex(a => a.id === id);
          if (arIndex === -1) return state;

          const ar = state.accountsReceivable[arIndex];
          const newPaidAmount = ar.paidAmount + amount;
          const newStatus = newPaidAmount >= ar.amount ? 'paid' : 'partial';

          const updatedAR = [...state.accountsReceivable];
          updatedAR[arIndex] = { ...ar, paidAmount: newPaidAmount, status: newStatus };

          const newMovement: Movement = {
            id: generateId(),
            type: 'ingreso',
            amount: amount,
            category: 'Cobro a Cliente',
            date: new Date().toISOString(),
            description: `Cobro de deuda de ${ar.customerName}`,
            paymentMethod: method,
            customerId: ar.customerId,
            accountId: accountId || (method === 'bank' ? 'default-bank' : 'default-cash')
          };

          return {
            accountsReceivable: updatedAR,
            movements: [...state.movements, newMovement],
            hasUnsavedChanges: true
          };
        });
      },
      addProduct: (prod) => set((state) => ({
        products: [...state.products, { ...prod, id: generateId() }],
        hasUnsavedChanges: true
      })),
      upsertCustomer: (customer) => set((state) => {
        const existingIndex = state.customers.findIndex(c => c.id === customer.id);
        if (existingIndex >= 0) {
          const updatedCustomers = [...state.customers];
          updatedCustomers[existingIndex] = { ...customer, lastUpdated: new Date().toISOString() };
          return { customers: updatedCustomers, hasUnsavedChanges: true };
        }
        return { customers: [...state.customers, { ...customer, lastUpdated: new Date().toISOString() }], hasUnsavedChanges: true };
      }),
      upsertSupplier: (supplier) => set((state) => {
        const existingIndex = state.suppliers.findIndex(s => s.id === supplier.id);
        if (existingIndex >= 0) {
          const updatedSuppliers = [...state.suppliers];
          updatedSuppliers[existingIndex] = supplier;
          return { suppliers: updatedSuppliers, hasUnsavedChanges: true };
        }
        return { suppliers: [...state.suppliers, supplier], hasUnsavedChanges: true };
      }),
      addAccount: (account) => set((state) => ({
        accounts: [...state.accounts, { ...account, id: generateId() }],
        hasUnsavedChanges: true
      })),
      updateAccount: (id, data) => set((state) => ({
        accounts: state.accounts.map(a => a.id === id ? { ...a, ...data } : a),
        hasUnsavedChanges: true
      })),
      deleteAccount: (id) => set((state) => ({
        accounts: state.accounts.filter(a => a.id !== id),
        movements: state.movements.map(m => m.accountId === id ? { ...m, accountId: undefined } : m),
        hasUnsavedChanges: true
      })),
      updateStock: (id, amount) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, stock: p.stock + amount } : p),
        hasUnsavedChanges: true
      })),
      adjustStock: (id, newStock, reason) => set((state) => {
        const product = state.products.find(p => p.id === id);
        if (!product) return state;
        
        const diff = newStock - product.stock;
        if (diff === 0) return state;

        const adjustmentId = generateId();
        const newMovement: Movement = {
          id: adjustmentId,
          type: diff > 0 ? 'ingreso' : 'gasto',
          amount: Math.abs(diff * product.cost),
          category: 'Ajuste de Inventario',
          date: new Date().toISOString(),
          description: `Ajuste (${reason}): ${diff > 0 ? '+' : ''}${diff} unidades de ${product.name}`,
          items: [{ productId: id, quantity: Math.abs(diff), price: product.price, cost: product.cost }]
        };

        return {
          products: state.products.map(p => p.id === id ? { ...p, stock: newStock } : p),
          movements: [...state.movements, newMovement],
          hasUnsavedChanges: true
        };
      }),
      updateProduct: (id, data) => set((state) => ({
        products: state.products.map(p => p.id === id ? { ...p, ...data } : p),
        hasUnsavedChanges: true
      })),
      updateLessonProgress: (id, status, progress) => set((state) => ({
        lessonsProgress: { ...state.lessonsProgress, [id]: { status, progress } },
        hasUnsavedChanges: true
      })),
      getTotals: () => {
        const { movements, products, accountsPayable, accountsReceivable, accounts } = get();
        
        // Suma de balances de cuentas (Saldo Real)
        const totalAccountBalance = accounts.reduce((acc, account) => {
          const accountMovements = movements.filter(m => m.accountId === account.id || (account.id === 'default-cash' && !m.accountId));
          const netMovements = accountMovements.reduce((mAcc, m) => {
            return m.type === 'ingreso' ? mAcc + m.amount : mAcc - m.amount;
          }, account.initialBalance);
          return acc + netMovements;
        }, 0);

        const income = movements.filter(m => m.type === 'ingreso').reduce((acc, m) => acc + m.amount, 0);
        const expenses = movements.filter(m => m.type === 'gasto').reduce((acc, m) => acc + m.amount, 0);
        
        // Cuentas por Cobrar Pendientes
        const totalAR = accountsReceivable.filter(a => a.status !== 'paid').reduce((acc, a) => acc + ((a.amount || 0) - (a.paidAmount || 0)), 0);
        
        // Cuentas por Pagar Pendientes
        const totalAP = accountsPayable.filter(a => a.status !== 'paid').reduce((acc, a) => acc + ((a.amount || 0) - (a.paidAmount || 0)), 0);

        // Ventas Totales (Efectivo + Crédito)
        const cashSales = movements.filter(m => m.type === 'ingreso' && m.category === 'Venta').reduce((acc, m) => acc + m.amount, 0);
        const creditSales = accountsReceivable.reduce((acc, a) => acc + (a.amount || 0), 0);
        const totalSales = cashSales + creditSales;

        // Costo de Ventas (COGS)
        const cashSalesCOGS = movements.filter(m => m.category === 'Venta').reduce((acc, m) => {
          return acc + (m.items?.reduce((iAcc, item) => iAcc + ((item.cost || 0) * item.quantity), 0) || 0);
        }, 0);
        
        // Gastos Operativos
        const operativeExpenses = movements.filter(m => m.type === 'gasto' && m.category !== 'Compra de Inventario' && m.category !== 'Pago a Proveedor').reduce((acc, m) => acc + m.amount, 0);

        // Utilidad Neta
        const netProfit = totalSales - cashSalesCOGS - operativeExpenses;
        const inventoryValue = products.reduce((acc, p) => acc + ((p.stock || 0) * (p.cost || 0)), 0);
        
        return { 
          income,
          expenses, 
          balance: Number(totalAccountBalance), 
          sales: Number(totalSales), 
          inventoryValue: Number(inventoryValue), 
          totalAP: Number(totalAP),
          totalAR: Number(totalAR),
          netProfit: Number(netProfit)
        };
      },
      syncLocalToCloud: async () => {
        const { user, movements, products, customers, suppliers, accounts, accountsPayable, accountsReceivable, lessonsProgress } = get();
        if (!user) throw new Error('Inicia sesión para sincronizar');

        const newVersion = Date.now();
        const batch = writeBatch(db);
        
        const writeWithVersion = (refPath: string, data: Record<string, unknown>) => {
          batch.set(doc(db, refPath), { ...data, _syncVersion: newVersion, _syncedAt: new Date().toISOString() });
        };

        products.forEach(p => writeWithVersion(`users/${user.uid}/products/${p.id}`, p as unknown as Record<string, unknown>));
        movements.forEach(m => writeWithVersion(`users/${user.uid}/movements/${m.id}`, m as unknown as Record<string, unknown>));
        customers.forEach(c => writeWithVersion(`users/${user.uid}/customers/${c.id}`, c as unknown as Record<string, unknown>));
        suppliers.forEach(s => writeWithVersion(`users/${user.uid}/suppliers/${s.id}`, s as unknown as Record<string, unknown>));
        accounts.forEach(a => writeWithVersion(`users/${user.uid}/accounts/${a.id}`, a as unknown as Record<string, unknown>));
        accountsPayable.forEach(ap => writeWithVersion(`users/${user.uid}/accountsPayable/${ap.id}`, ap as unknown as Record<string, unknown>));
        accountsReceivable.forEach(ar => writeWithVersion(`users/${user.uid}/accountsReceivable/${ar.id}`, ar as unknown as Record<string, unknown>));
        
        Object.entries(lessonsProgress).forEach(([id, data]) => {
          writeWithVersion(`users/${user.uid}/lessonsProgress/${id}`, data as unknown as Record<string, unknown>);
        });

        batch.set(doc(db, `users/${user.uid}/_meta`, 'sync'), {
          lastSyncVersion: newVersion,
          lastSyncAt: new Date().toISOString(),
        });

        await batch.commit();
        set({ hasUnsavedChanges: false, syncVersion: newVersion, lastCloudSync: new Date().toISOString() });
      },
      syncCloudToLocal: async () => {
        const { user, syncVersion } = get();
        if (!user) throw new Error('Inicia sesión para restaurar');

        const [prodSnap, movSnap, custSnap, suppSnap, accSnap, apSnap, arSnap, lpSnap, metaSnap] = await Promise.all([
          getDocs(collection(db, `users/${user.uid}/products`)),
          getDocs(collection(db, `users/${user.uid}/movements`)),
          getDocs(collection(db, `users/${user.uid}/customers`)),
          getDocs(collection(db, `users/${user.uid}/suppliers`)),
          getDocs(collection(db, `users/${user.uid}/accounts`)),
          getDocs(collection(db, `users/${user.uid}/accountsPayable`)),
          getDocs(collection(db, `users/${user.uid}/accountsReceivable`)),
          getDocs(collection(db, `users/${user.uid}/lessonsProgress`)),
          getDocs(collection(db, `users/${user.uid}/_meta`))
        ]);

        const stripMeta = <T>(data: Record<string, unknown>): T => {
          const { _syncVersion, _syncedAt, ...rest } = data;
          return rest as T;
        };

        const products = prodSnap.docs.map(doc => stripMeta<Product>(doc.data() as Record<string, unknown>));
        const movements = movSnap.docs.map(doc => stripMeta<Movement>(doc.data() as Record<string, unknown>));
        const customers = custSnap.docs.map(doc => stripMeta<Customer>(doc.data() as Record<string, unknown>));
        const suppliers = suppSnap.docs.map(doc => stripMeta<Supplier>(doc.data() as Record<string, unknown>));
        const accounts = accSnap.docs.map(doc => stripMeta<Account>(doc.data() as Record<string, unknown>));
        const accountsPayable = apSnap.docs.map(doc => stripMeta<AccountPayable>(doc.data() as Record<string, unknown>));
        const accountsReceivable = arSnap.docs.map(doc => stripMeta<AccountReceivable>(doc.data() as Record<string, unknown>));
        
        const lessonsProgress: Record<string, { status: string; progress: number }> = {};
        lpSnap.docs.forEach(doc => {
          const data = stripMeta<{ status: string; progress: number }>(doc.data() as Record<string, unknown>);
          lessonsProgress[doc.id] = data;
        });

        const cloudVersion = metaSnap.docs.find(d => d.id === 'sync')?.data()?.lastSyncVersion || 0;

        if (cloudVersion >= syncVersion) {
          if (products.length > 0) set({ products });
          if (movements.length > 0) set({ movements });
          if (customers.length > 0) set({ customers });
          if (suppliers.length > 0) set({ suppliers });
          if (accounts.length > 0) set({ accounts });
          if (accountsPayable.length > 0) set({ accountsPayable });
          if (accountsReceivable.length > 0) set({ accountsReceivable });
          if (Object.keys(lessonsProgress).length > 0) set({ lessonsProgress });
          set({ hasUnsavedChanges: false, syncVersion: cloudVersion, lastCloudSync: new Date().toISOString() });
        } else {
          throw new Error('Los datos locales son más recientes que la nube. Sube tus cambios primero.');
        }
      }
    }),
    { name: 'finance-storage', storage: createJSONStorage(() => robustStorage) }
  )
);
