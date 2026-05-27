import { useFinanceStore } from '@/lib/store';

describe('finance store totals', () => {
  beforeEach(() => {
    useFinanceStore.setState({
      movements: [],
      products: [],
      customers: [],
      suppliers: [],
      accountsPayable: [],
      accountsReceivable: [],
      accounts: [],
      lessonsProgress: {},
      hasUnsavedChanges: false,
      syncVersion: 0,
      lastCloudSync: null,
      user: null,
    });
  });

  it('combines cash sales, credit sales, receivables, payables and inventory value', () => {
    useFinanceStore.setState({
      accounts: [{ id: 'cash', name: 'Caja', type: 'cash', initialBalance: 100 }],
      products: [{ id: 'p1', name: 'Cafe', stock: 3, price: 20, cost: 8 }],
      movements: [{
        id: 'm1',
        type: 'ingreso',
        amount: 40,
        category: 'Venta',
        date: '2026-01-01T00:00:00.000Z',
        description: 'Venta',
        accountId: 'cash',
        items: [{ productId: 'p1', quantity: 2, price: 20, cost: 8 }],
      }],
      accountsReceivable: [{
        id: 'ar1',
        customerId: 'c1',
        customerName: 'Cliente',
        amount: 30,
        paidAmount: 10,
        date: '2026-01-01',
        dueDate: '2026-02-01',
        status: 'partial',
        description: 'Credito',
      }],
      accountsPayable: [{
        id: 'ap1',
        supplierId: 's1',
        supplierName: 'Proveedor',
        amount: 50,
        paidAmount: 15,
        date: '2026-01-01',
        dueDate: '2026-02-01',
        status: 'partial',
        description: 'Compra',
      }],
    });

    const totals = useFinanceStore.getState().getTotals();

    expect(totals.balance).toBe(140);
    expect(totals.sales).toBe(70);
    expect(totals.totalAR).toBe(20);
    expect(totals.totalAP).toBe(35);
    expect(totals.inventoryValue).toBe(24);
    expect(totals.netProfit).toBe(54);
  });
});
