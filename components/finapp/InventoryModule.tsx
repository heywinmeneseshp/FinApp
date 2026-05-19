'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Plus, Minus, Search, Box, Tag, 
  Trash2, Edit3, Save, X, AlertCircle,
  Package, TrendingUp, TrendingDown, RefreshCw,
  Truck, CreditCard, Calendar, ShoppingCart,
  ChevronRight, CheckCircle2, DollarSign, ListFilter,
  BarChart3
} from 'lucide-react';
import { useFinanceStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface InventoryModuleProps {
  onBack: () => void;
}

type Tab = 'inventory' | 'suppliers' | 'accountsPayable' | 'reports';

export default function InventoryModule({ onBack }: InventoryModuleProps) {
  const { 
    products, addProduct, updateStock, getTotals,
    suppliers, upsertSupplier, 
    accountsPayable, recordPurchase, payAccountPayable,
    updateProduct, adjustStock, movements, accounts
  } = useFinanceStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isRecordingPurchase, setIsRecordingPurchase] = useState(false);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [isShowingHistory, setIsShowingHistory] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedProductForAdjustment, setSelectedProductForAdjustment] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  const totals = getTotals();

  const inventoryMovements = useMemo(() => {
    return movements.filter(m => 
      m.category === 'Ajuste de Inventario' || 
      m.category === 'Venta' || 
      m.category === 'Compra de Inventario'
    ).map(m => {
      // Logic to determine if it's a physical entrance or exit
      let isEntrance = false;
      let displayAmount = m.amount;
      let displayDescription = m.description;
      let quantity = 0;

      if (m.category === 'Venta') {
        isEntrance = false;
        // For sales, the physical value that "leaves" is the cost of goods
        displayAmount = m.items?.reduce((acc, item) => acc + ((item.cost || 0) * item.quantity), 0) || 0;
        quantity = m.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;
        displayDescription = `Venta: ${displayDescription}`;
      } else if (m.category === 'Compra de Inventario') {
        isEntrance = true;
        displayAmount = m.amount; // The purchase price is the value entering
        displayDescription = `Compra: ${displayDescription}`;
      } else if (m.category === 'Ajuste de Inventario') {
        isEntrance = m.type === 'ingreso';
        displayAmount = m.amount;
      }

      return {
        ...m,
        isPhysicalEntrance: isEntrance,
        inventoryValue: displayAmount,
        inventoryDescription: displayDescription,
        quantity
      };
    }).filter(m => {
      const mDate = new Date(m.date).toISOString().split('T')[0];
      if (dateRange.start && mDate < dateRange.start) return false;
      if (dateRange.end && mDate > dateRange.end) return false;
      return true;
    });
  }, [movements, dateRange]);

  const totalInventoryFlowValue = inventoryMovements.reduce((acc, m) => {
    return m.isPhysicalEntrance ? acc + m.inventoryValue : acc - m.inventoryValue;
  }, 0);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatCurrency = (amount: number | undefined | null) => {
    if (!isMounted) return '$0';
    if (amount === undefined || amount === null) return '$0';
    const num = Number(amount);
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString();
  };

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    cost: '',
    minStock: '5',
    category: '',
    unit: 'Unidad'
  });

  const [purchaseData, setPurchaseData] = useState({
    productId: '',
    quantity: '',
    costUnit: '',
    supplierId: '',
    paymentMethod: 'cash' as 'cash' | 'credit' | 'bank',
    accountId: accounts[0]?.id || 'default-cash',
    dueDate: '',
    observation: ''
  });

  const [newSupplier, setNewSupplier] = useState({
    id: '',
    name: '',
    phone: '',
    email: ''
  });

  const [adjustmentData, setAdjustmentData] = useState({
    price: '',
    cost: '',
    stock: '',
    reason: 'Inventario Físico'
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.cost) return;
    
    const priceNum = Number(newProduct.price);
    const costNum = Number(newProduct.cost);
    
    if (priceNum < 0 || costNum < 0) {
      alert("El precio y costo no pueden ser negativos");
      return;
    }

    addProduct({
      name: newProduct.name,
      price: priceNum,
      cost: costNum,
      stock: 0,
      minStock: Number(newProduct.minStock),
      category: newProduct.category,
      unit: newProduct.unit
    });
    setNewProduct({ name: '', price: '', cost: '', minStock: '5', category: '', unit: 'Unidad' });
    setIsAddingProduct(false);
  };

  const handleRecordPurchase = () => {
    if (!purchaseData.productId || !purchaseData.quantity || !purchaseData.costUnit) return;
    
    const quantityNum = Number(purchaseData.quantity);
    const costNum = Number(purchaseData.costUnit);

    if (quantityNum <= 0 || costNum < 0) {
      alert("Ingresa una cantidad mayor a 0 y un costo válido.");
      return;
    }

    const supplier = suppliers.find(s => s.id === purchaseData.supplierId);
    
    recordPurchase({
      productId: purchaseData.productId,
      quantity: quantityNum,
      cost: costNum,
      paymentMethod: purchaseData.paymentMethod,
      supplierId: purchaseData.supplierId,
      accountId: purchaseData.accountId,
      supplierName: supplier?.name,
      dueDate: purchaseData.dueDate,
      observation: purchaseData.observation
    });

    setIsRecordingPurchase(false);
    setPurchaseData({
      productId: '',
      quantity: '',
      costUnit: '',
      supplierId: '',
      paymentMethod: 'cash',
      accountId: accounts[0]?.id || 'default-cash',
      dueDate: '',
      observation: ''
    });
  };

  const handleAddSupplier = () => {
    if (!newSupplier.name) return;
    upsertSupplier({
      id: newSupplier.id || String(Math.random().toString(36).substr(2, 9)),
      name: newSupplier.name,
      phone: newSupplier.phone,
      email: newSupplier.email
    });
    setIsAddingSupplier(false);
    setNewSupplier({ id: '', name: '', phone: '', email: '' });
  };

  const handleAdjustProduct = () => {
    if (!selectedProductForAdjustment) return;
    
    // Update basic info
    updateProduct(selectedProductForAdjustment.id, {
      price: Number(adjustmentData.price),
      cost: Number(adjustmentData.cost)
    });

    // Handle stock adjustment
    const newStockNum = Number(adjustmentData.stock);
    if (newStockNum !== selectedProductForAdjustment.stock) {
      adjustStock(selectedProductForAdjustment.id, newStockNum, adjustmentData.reason);
    }

    setSelectedProductForAdjustment(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-[#F8FAFC] min-h-screen rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col relative border border-zinc-100"
    >
      <div className="p-6 sm:p-8 bg-[#3068E5] text-white flex flex-col gap-6 sm:gap-8 rounded-t-[2.5rem]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <button onClick={onBack} type="button" className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all active:scale-95">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate">Inventario</h2>
          </div>
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <button 
              onClick={() => setIsAddingProduct(true)}
              className="bg-white/10 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all"
              title="Nuevo Producto"
              type="button"
            >
              <Plus size={20} className="sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={() => setIsShowingHistory(true)}
              className="bg-white/10 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all font-black"
              title="Historial de Ajustes"
              type="button"
            >
              <RefreshCw size={20} className="sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={() => setIsRecordingPurchase(true)}
              className="bg-white text-[#3068E5] p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center hover:bg-zinc-50 active:scale-90 transition-all font-black"
              title="Registrar Compra"
              type="button"
            >
              <ShoppingCart size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        <div className="flex bg-white/10 p-1 rounded-xl sm:rounded-2xl overflow-x-auto no-scrollbar">
          {[
            { id: 'inventory', label: 'Stock', icon: Box },
            { id: 'suppliers', label: 'Prov', icon: Truck },
            { id: 'accountsPayable', label: 'Cuentas', icon: Calendar },
            { id: 'reports', label: 'Reportes', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              type="button"
              className={cn(
                "flex-1 py-2 sm:py-3 px-1 sm:px-2 rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition-all font-bold text-[10px] sm:text-xs uppercase tracking-wider min-w-fit",
                activeTab === tab.id ? "bg-white text-[#3068E5] shadow-lg" : "text-white/70 hover:text-white"
              )}
              title={tab.label}
            >
              <tab.icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className={cn(activeTab === tab.id ? "inline" : "hidden sm:inline")}>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-8 space-y-8 pb-24">
        {activeTab === 'inventory' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F2FAF7] p-4 rounded-3xl border border-[#12C2A2]/10">
                <p className="text-[10px] font-black text-[#12C2A2] uppercase tracking-widest mb-1">Valor Inventario</p>
                <p className="text-lg font-black text-[#151619]">{formatCurrency(totals.inventoryValue)}</p>
              </div>
              <div className="bg-[#FFF2F2] p-4 rounded-3xl border border-[#E53030]/10">
                <p className="text-[10px] font-black text-[#E53030] uppercase tracking-widest mb-1">Cuentas por Pagar</p>
                <p className="text-lg font-black text-[#151619]">{formatCurrency(totals.totalAP)}</p>
              </div>
            </div>

            <div className="relative">
              <form onSubmit={(e) => e.preventDefault()}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full bg-zinc-50 border-none rounded-2xl py-4 pl-12 pr-4 font-bold placeholder:text-zinc-300 focus:ring-2 focus:ring-[#3068E5]"
                />
              </form>
            </div>

            <div className="space-y-4">
              {filteredProducts.map(product => {
                const productPrice = product.price || 0;
                const productCost = product.cost || 0;
                const margin = productPrice > 0 ? ((productPrice - productCost) / productPrice) * 100 : 0;
                return (
                  <div key={product.id} className="bg-white p-5 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col gap-4 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-[#3068E5] group-hover:scale-110 transition-transform">
                          <Package size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-[#151619] text-sm">{product.name}</h4>
                          <span className="text-[10px] bg-zinc-100 px-2 py-0.5 rounded-lg font-bold text-zinc-400 uppercase">
                            {product.category || 'General'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <button 
                          onClick={() => {
                            setSelectedProductForAdjustment(product);
                            setAdjustmentData({
                              price: String(product?.price ?? ''),
                              cost: String(product?.cost ?? ''),
                              stock: String(product?.stock ?? ''),
                              reason: 'Inventario Físico'
                            });
                          }}
                          type="button"
                          className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-200 hover:text-[#3068E5] transition-all active:scale-90"
                          title="Ajustar"
                        >
                          <Edit3 size={16} />
                        </button>
                        <div>
                          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Precio Venta</p>
                          <p className="text-lg font-black text-[#151619]">{formatCurrency(productPrice)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-3 border-t border-zinc-50">
                      <div className="bg-zinc-50/50 p-2 rounded-2xl">
                        <p className="text-[8px] font-black text-zinc-400 uppercase mb-0.5">Stock</p>
                        <p className={cn(
                          "text-xs font-black",
                          (product.stock || 0) <= (product.minStock || 5) ? "text-[#E53030]" : "text-[#12C2A2]"
                        )}>{product.stock || 0} {product.unit}</p>
                      </div>
                      <div className="bg-zinc-50/50 p-2 rounded-2xl">
                        <p className="text-[8px] font-black text-zinc-400 uppercase mb-0.5">Costo</p>
                        <p className="text-xs font-black text-zinc-500">{formatCurrency(productCost)}</p>
                      </div>
                      <div className="bg-zinc-50/50 p-2 rounded-2xl">
                        <p className="text-[8px] font-black text-zinc-400 uppercase mb-0.5">Margen</p>
                        <p className="text-xs font-black text-[#12C2A2]">{margin.toFixed(0)}%</p>
                      </div>
                      <div className="bg-zinc-50/50 p-2 rounded-2xl">
                        <p className="text-[8px] font-black text-zinc-400 uppercase mb-0.5">Valor</p>
                        <p className="text-xs font-black text-[#151619]">{formatCurrency((product.stock || 0) * productCost)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <button 
              onClick={() => setIsAddingSupplier(true)}
              type="button"
              className="w-full p-4 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400 font-bold flex items-center justify-center gap-2 hover:bg-zinc-100 transition-colors"
            >
              <Plus size={18} />
              Añadir Proveedor
            </button>

            {suppliers.map(supplier => (
              <div key={supplier.id} className="bg-white p-5 rounded-[2.5rem] border border-zinc-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F2F5FA] text-[#3068E5] rounded-2xl flex items-center justify-center">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#151619]">{supplier.name}</h4>
                    <p className="text-xs text-zinc-400 font-medium">{supplier.phone || 'Sin teléfono'}</p>
                  </div>
                </div>
                <button type="button" className="p-2 text-zinc-300 hover:text-zinc-500">
                  <ChevronRight size={20} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'accountsPayable' && (
          <div className="space-y-4">
            {accountsPayable.length === 0 ? (
              <div className="text-center py-12 text-zinc-300 space-y-4">
                <Calendar size={48} className="mx-auto opacity-20" />
                <p className="font-bold">No hay cuentas por pagar pendientes</p>
              </div>
            ) : (
              accountsPayable.map(ap => (
                <div key={ap.id} className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FFF2F2] text-[#E53030] rounded-xl flex items-center justify-center">
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-[#151619]">{ap.supplierName}</h4>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Vence: {new Date(ap.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                        ap.status === 'pending' ? "bg-[#FFF2F2] text-[#E53030]" : "bg-[#F2FAF7] text-[#12C2A2]"
                      )}>
                        {ap.status === 'pending' ? 'Pendiente' : ap.status === 'partial' ? 'Parcial' : 'Pagada'}
                      </div>
                  </div>

                  <div className="flex justify-between items-center py-3 border-y border-zinc-50">
                    <div>
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Saldo Pendiente</p>
                      <p className="text-xl font-black text-[#151619]">{formatCurrency(ap.amount - ap.paidAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Total</p>
                      <p className="text-xs font-bold text-zinc-500">{formatCurrency(ap.amount)}</p>
                    </div>
                  </div>

                  {ap.status !== 'paid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                       <button 
                        onClick={() => payAccountPayable(ap.id, ap.amount - ap.paidAmount, 'cash')}
                        type="button"
                        className="bg-[#151619] text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all w-full"
                      >
                        Pagar Todo
                      </button>
                      <button 
                        type="button"
                        className="border border-zinc-100 text-zinc-400 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 active:scale-95 transition-all w-full"
                      >
                        Abonar
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-4">
              <h3 className="font-black text-[#151619]">Resumen de Compras</h3>
              <div className="h-40 bg-zinc-50 rounded-3xl flex items-center justify-center border border-dashed border-zinc-200">
                <BarChart3 className="text-zinc-200" size={48} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-zinc-50 rounded-2xl">
                    <p className="text-[8px] font-black text-zinc-400 uppercase">Compras Mes</p>
                    <p className="text-lg font-black text-[#151619]">{formatCurrency(totals.expenses)}</p>
                 </div>
                 <div className="p-4 bg-zinc-50 rounded-2xl">
                    <p className="text-[8px] font-black text-zinc-400 uppercase">Utilidad Proyectada</p>
                    <p className="text-lg font-black text-[#12C2A2]">{formatCurrency(totals.inventoryValue * 0.4)}</p>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddingProduct && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsAddingProduct(false)}
               className="fixed inset-0 bg-[#151619]/80 backdrop-blur-[2px]"
             />
             <motion.div 
               initial={{ y: "100%", opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: "100%", opacity: 0 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 space-y-8 relative shadow-2xl max-h-[95vh] overflow-y-auto"
             >
               <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black">Nuevo Producto</h3>
                 <button onClick={() => setIsAddingProduct(false)} type="button" className="p-2 bg-zinc-100 rounded-full"><X size={20} /></button>
               </div>
               
               <form 
                 onSubmit={(e) => e.preventDefault()}
                 className="space-y-4"
               >
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Nombre del producto</label>
                   <input 
                     type="text" 
                     value={newProduct.name}
                     onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                     className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold"
                     placeholder="Ej: Gorra Edición Especial"
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Precio Venta ($)</label>
                     <input 
                       type="number" 
                       value={newProduct.price}
                       onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                       className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold"
                       placeholder="0.00"
                     />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Costo Sugerido ($)</label>
                     <input 
                       type="number" 
                       value={newProduct.cost}
                       onChange={(e) => setNewProduct({...newProduct, cost: e.target.value})}
                       className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold"
                       placeholder="0.00"
                     />
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Categoría</label>
                      <input 
                        type="text" 
                        value={newProduct.category}
                        onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                        className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold"
                        placeholder="Ej: Accesorios"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Stock Mínimo</label>
                      <input 
                        type="number" 
                        value={newProduct.minStock}
                        onChange={(e) => setNewProduct({...newProduct, minStock: e.target.value})}
                        className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold"
                        placeholder="5"
                      />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Unidad de Medida</label>
                    <input 
                      type="text" 
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                      className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold"
                      placeholder="Ej: Unidad, Kg, Litro"
                    />
                 </div>

                 <button 
                  type="button"
                  onClick={handleAddProduct}
                  className="w-full bg-[#3068E5] text-white py-6 rounded-[2rem] shadow-xl shadow-[#3068E5]/30 flex items-center justify-center active:scale-95 transition-all"
                  title="Guardar Producto"
                 >
                   <Save size={24} />
                 </button>
               </form>
             </motion.div>
          </div>
        )}

        {isRecordingPurchase && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRecordingPurchase(false)}
              className="fixed inset-0 bg-[#151619]/80 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 space-y-8 relative shadow-2xl max-h-[95vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F2FAF7] text-[#12C2A2] rounded-xl flex items-center justify-center">
                    <ShoppingCart size={20} />
                  </div>
                  <h3 className="text-2xl font-black">Registrar Compra</h3>
                </div>
                <button onClick={() => setIsRecordingPurchase(false)} type="button" className="p-2 bg-zinc-100 rounded-full"><X size={20} /></button>
              </div>

              <form 
                onSubmit={(e) => e.preventDefault()}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Seleccionar Producto</label>
                  <select 
                    value={purchaseData.productId}
                    onChange={(e) => {
                      const prod = products.find(p => p.id === e.target.value);
                      setPurchaseData({...purchaseData, productId: e.target.value, costUnit: String(prod?.cost ?? '')});
                    }}
                    className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold appearance-none"
                  >
                    <option value="">Selecciona un producto...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Cantidad</label>
                    <input 
                      type="number" 
                      value={purchaseData.quantity}
                      onChange={(e) => setPurchaseData({...purchaseData, quantity: e.target.value})}
                      className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Costo Unitario ($)</label>
                    <input 
                      type="number" 
                      value={purchaseData.costUnit}
                      onChange={(e) => setPurchaseData({...purchaseData, costUnit: e.target.value})}
                      className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Proveedor</label>
                  <select 
                    value={purchaseData.supplierId}
                    onChange={(e) => setPurchaseData({...purchaseData, supplierId: e.target.value})}
                    className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold appearance-none"
                  >
                    <option value="">Selecciona proveedor...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">¿De qué cuenta sale el dinero?</label>
                  <select 
                    value={purchaseData.accountId}
                    onChange={(e) => setPurchaseData({...purchaseData, accountId: e.target.value})}
                    className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold appearance-none text-sm"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type === 'cash' ? 'Efectivo' : 'Banco'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Método de Pago</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', label: 'Efectivo', icon: DollarSign },
                      { id: 'bank', label: 'Banco', icon: CreditCard },
                      { id: 'credit', label: 'Crédito', icon: Calendar },
                    ].map(method => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPurchaseData({...purchaseData, paymentMethod: method.id as any})}
                        className={cn(
                          "p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all",
                          purchaseData.paymentMethod === method.id 
                            ? "border-[#12C2A2] bg-[#F2FAF7] text-[#12C2A2]" 
                            : "border-zinc-100 bg-zinc-50 text-zinc-400"
                        )}
                      >
                        <method.icon size={16} />
                        <span className="text-[10px] font-bold uppercase">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {purchaseData.paymentMethod === 'credit' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Fecha de Vencimiento</label>
                    <input 
                      type="date" 
                      value={purchaseData.dueDate}
                      onChange={(e) => setPurchaseData({...purchaseData, dueDate: e.target.value})}
                      className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold text-zinc-600"
                    />
                  </div>
                )}

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black text-zinc-400 uppercase">Total Compra</span>
                    <span className="text-xl font-black text-[#151619]">
                      {formatCurrency(Number(purchaseData.quantity) * Number(purchaseData.costUnit))}
                    </span>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={handleRecordPurchase}
                  className="w-full bg-[#151619] text-white py-6 rounded-[2rem] shadow-xl shadow-[#151619]/20 flex items-center justify-center active:scale-95 transition-all"
                  title="Confirmar Compra"
                >
                  <Save size={24} />
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isAddingSupplier && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsAddingSupplier(false)}
               className="fixed inset-0 bg-[#151619]/80 backdrop-blur-[2px]"
             />
             <motion.div 
               initial={{ y: "100%", opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: "100%", opacity: 0 }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 space-y-8 relative shadow-2xl max-h-[95vh] overflow-y-auto"
             >
               <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-black">Nuevo Proveedor</h3>
                 <button onClick={() => setIsAddingSupplier(false)} type="button" className="p-2 bg-zinc-100 rounded-full"><X size={20} /></button>
               </div>
               
               <form 
                 onSubmit={(e) => e.preventDefault()}
                 className="space-y-4"
               >
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Nombre / Empresa</label>
                   <input 
                     type="text" 
                     value={newSupplier.name}
                     onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                     className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold"
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Teléfono</label>
                      <input 
                        type="text" 
                        value={newSupplier.phone}
                        onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                        className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Email</label>
                      <input 
                        type="email" 
                        value={newSupplier.email}
                        onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                        className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold"
                      />
                    </div>
                 </div>

                 <button 
                  type="button"
                  onClick={handleAddSupplier}
                  className="w-full bg-[#151619] text-white py-6 rounded-[2rem] shadow-xl flex items-center justify-center active:scale-95 transition-all"
                  title="Guardar Proveedor"
                 >
                   <Save size={24} />
                 </button>
               </form>
             </motion.div>
          </div>
        )}

        {selectedProductForAdjustment && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProductForAdjustment(null)}
              className="fixed inset-0 bg-[#151619]/80 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 space-y-8 relative shadow-2xl max-h-[95vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F2F5FA] text-[#3068E5] rounded-xl flex items-center justify-center">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Ajustar Producto</h3>
                    <p className="text-xs text-zinc-400 font-bold uppercase">{selectedProductForAdjustment?.name}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedProductForAdjustment(null)} type="button" className="p-2 bg-zinc-100 rounded-full"><X size={20} /></button>
              </div>

              <form 
                onSubmit={(e) => e.preventDefault()}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Precio Venta ($)</label>
                    <input 
                      type="number" 
                      value={adjustmentData.price}
                      onChange={(e) => setAdjustmentData({...adjustmentData, price: e.target.value})}
                      className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Costo Compra ($)</label>
                    <input 
                      type="number" 
                      value={adjustmentData.cost}
                      onChange={(e) => setAdjustmentData({...adjustmentData, cost: e.target.value})}
                      className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Stock Actual ({selectedProductForAdjustment?.unit})</label>
                  <input 
                    type="number" 
                    value={adjustmentData.stock}
                    onChange={(e) => setAdjustmentData({...adjustmentData, stock: e.target.value})}
                    className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold"
                    placeholder="0"
                  />
                  <p className="text-[9px] text-zinc-400 ml-2 font-medium italic">
                    * El cambio en stock generará una trazabilidad en movimientos.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase ml-2">Motivo del Ajuste</label>
                  <select 
                    value={adjustmentData.reason}
                    onChange={(e) => setAdjustmentData({...adjustmentData, reason: e.target.value})}
                    className="w-full bg-zinc-50 border-none rounded-2xl p-4 font-bold appearance-none"
                  >
                    <option value="Inventario Físico">Inventario Físico</option>
                    <option value="Derrame / Daño">Derrame / Daño</option>
                    <option value="Vencimiento">Vencimiento</option>
                    <option value="Error de Registro">Error de Registro</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <button 
                  type="button"
                  onClick={handleAdjustProduct}
                  className="w-full bg-[#151619] text-white py-6 rounded-[2rem] shadow-xl flex items-center justify-center active:scale-95 transition-all"
                  title="Guardar Ajustes"
                >
                  <Save size={24} />
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isShowingHistory && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShowingHistory(false)}
              className="fixed inset-0 bg-[#151619]/80 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-xl rounded-t-[3rem] sm:rounded-[3rem] p-6 sm:p-10 space-y-8 relative shadow-2xl max-h-[92vh] flex flex-col"
            >
              <div className="flex justify-between items-center flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F2F5FA] text-[#3068E5] rounded-2xl flex items-center justify-center">
                    <RefreshCw size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">Movimientos de Inventario</h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Trazabilidad Total</p>
                  </div>
                </div>
                <button onClick={() => setIsShowingHistory(false)} type="button" className="p-2 bg-zinc-100 rounded-full hover:bg-zinc-200 transition-colors"><X size={24} /></button>
              </div>

              <div className="bg-[#F8FAFC] p-6 rounded-[2.5rem] border border-zinc-100 flex-shrink-0 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Balance de Valor en Inventario</p>
                    <p className="text-3xl font-black text-[#151619]">{formatCurrency(totalInventoryFlowValue)}</p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-[#3068E5]">
                     <TrendingUp size={24} />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-zinc-200">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase ml-2 tracking-wider">Desde</label>
                    <input 
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      className="w-full bg-white border-none rounded-xl p-3 text-[11px] font-bold shadow-sm focus:ring-1 focus:ring-[#3068E5]"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] font-black text-zinc-400 uppercase ml-2 tracking-wider">Hasta</label>
                    <input 
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      className="w-full bg-white border-none rounded-xl p-3 text-[11px] font-bold shadow-sm focus:ring-1 focus:ring-[#3068E5]"
                    />
                  </div>
                  <button 
                    onClick={() => setDateRange({ start: '', end: '' })}
                    className="mt-5 p-3 text-zinc-300 hover:text-zinc-500 transition-colors"
                    title="Limpiar Filtros"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0">
                {inventoryMovements.length === 0 ? (
                  <div className="text-center py-20 text-zinc-300 space-y-4">
                    <RefreshCw size={48} className="mx-auto opacity-10 animate-spin-slow" />
                    <p className="font-bold text-sm">No hay movimientos en este periodo</p>
                  </div>
                ) : (
                  [...inventoryMovements].reverse().map((adj) => (
                    <div key={adj.id} className="bg-white p-5 rounded-[2rem] border border-zinc-50 shadow-sm hover:border-zinc-200 transition-all group">
                      <div className="flex justify-between items-start mb-1">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <span className={cn(
                               "w-2 h-2 rounded-full",
                               adj.isPhysicalEntrance ? "bg-[#12C2A2]" : "bg-[#E53030]"
                             )} />
                             <p className="text-sm font-black text-[#151619]">{adj.inventoryDescription}</p>
                             {adj.items && adj.items.length > 0 && (
                               <div className="mt-2 space-y-1 border-l-2 border-zinc-100 pl-3">
                                 {adj.items.map((item: any, idx: number) => (
                                   <div key={idx} className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold">
                                      <span className="bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 text-[8px]">{item.quantity}x</span>
                                      <span>{item.name}</span>
                                   </div>
                                 ))}
                               </div>
                             )}
                          </div>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase ml-4">{new Date(adj.date).toLocaleDateString()} · {new Date(adj.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-sm font-black text-zinc-400",
                          )}>
                            {adj.isPhysicalEntrance ? 'Entrada' : 'Salida'}
                          </p>
                          <p className={cn(
                            "text-sm font-black",
                            adj.isPhysicalEntrance ? "text-[#12C2A2]" : "text-[#E53030]"
                          )}>
                            {adj.isPhysicalEntrance ? '+' : '-'}{formatCurrency(adj.inventoryValue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

