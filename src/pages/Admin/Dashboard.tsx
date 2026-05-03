import { useEffect, useState } from 'react';
import { getAllSales, getAllProducts, getAllCustomers, Sale, Product, Customer } from '../../lib/services';
import { Layers, DollarSign, Package, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { adminNote } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllSales(), getAllProducts(), getAllCustomers()])
      .then(([sData, pData, cData]) => {
        setSales(sData);
        setProducts(pData);
        setCustomers(cData);
      })
      .catch((err) => {
        console.error(err);
        alert(err instanceof Error ? err.message : 'Error loading dashboard data');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const totalSalesAmount = sales.reduce((sum, sale) => {
    const saleReturnAmt = sale.items.reduce((itemSum, item) => itemSum + (item.returnedQuantity || 0) * item.price, 0);
    return sum + (sale.totalAmount - saleReturnAmt);
  }, 0);
  const totalProducts = products.length;
  const currentStockCount = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockProducts = products.filter(p => p.stock < 10);
  const totalCustomers = customers.length;

  const topSelling = sales
    .flatMap(sale => sale.items)
    .reduce((acc, item) => {
      if (item) {
        const existing = acc.find(i => i.barcode === item.barcode);
        if (existing) {
          existing.quantity += item.quantity;
          existing.total += item.total;
        } else {
          acc.push({ ...item });
        }
      }
      return acc;
    }, [] as any[])
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
    
  const mostActiveCustomers = [...customers]
    .sort((a, b) => (b.totalPurchaseAmount || 0) - (a.totalPurchaseAmount || 0))
    .slice(0, 5);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading dashboard data...</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505]">
      {/* Top Header Stats */}
      <header className="h-20 border-b border-[#222] bg-[#050505] flex items-center px-8 gap-8 overflow-x-auto flex-shrink-0">
        <div>
          <p className="text-[10px] uppercase tracking-tighter text-[#666]">Total Revenue</p>
          <p className="text-2xl font-light text-white">${totalSalesAmount.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-tighter text-[#666]">Active Sales</p>
          <p className="text-2xl font-light text-white">{sales.length}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-tighter text-[#666]">Total Customers</p>
          <p className="text-2xl font-light text-white">{totalCustomers}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-tighter text-[#666]">Total Catalog</p>
          <p className="text-2xl font-light text-white">{totalProducts}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-tighter text-[#666]">Total Units</p>
          <p className="text-2xl font-light text-white">{currentStockCount}</p>
        </div>
        
        <div className="ml-auto flex items-center gap-3 min-w-0">
          <span className="text-[11px] text-[#666] truncate max-w-[150px] sm:max-w-[300px]" title={`Session Note: ${adminNote || 'None'}`}>Session Note: {adminNote || 'None'}</span>
          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-tr from-emerald-900 to-emerald-400 flex items-center justify-center">
            <Layers className="h-4 w-4 text-white" />
          </div>
        </div>
      </header>

      <section className="flex-1 p-8 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Low Stock Alerts */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-serif italic text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-emerald-500" />
                Low Stock Alerts
              </h2>
            </div>
            
            <div className="rounded-lg border border-[#222] bg-[#0a0a0a] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#111] text-[10px] uppercase tracking-widest text-[#555] border-b border-[#222]">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4">Barcode</th>
                    <th className="p-4 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-[#999] font-mono">
                  {lowStockProducts.map(p => (
                    <tr key={p.id} className="border-b border-[#111] hover:bg-[#0d0d0d]">
                      <td className="p-4">
                        <div className="text-white font-sans text-[12px] truncate max-w-[150px]" title={p.name}>{p.name}</div>
                      </td>
                      <td className="p-4 text-[#666]">{p.barcode}</td>
                      <td className="p-4 text-right text-red-500 flex items-center justify-end gap-1 font-bold">
                        {p.stock}
                      </td>
                    </tr>
                  ))}
                  {lowStockProducts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-[#555] font-sans text-xs">All products are adequately stocked</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-serif italic text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Top Selling Products
              </h2>
            </div>
            
            <div className="rounded-lg border border-[#222] bg-[#0a0a0a] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#111] text-[10px] uppercase tracking-widest text-[#555] border-b border-[#222]">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4 text-center">Units Sold</th>
                    <th className="p-4 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-[#999] font-mono">
                  {topSelling.map((p, idx) => (
                    <tr key={idx} className="border-b border-[#111] hover:bg-[#0d0d0d]">
                      <td className="p-4">
                        <div className="text-white font-sans text-[12px] truncate max-w-[150px]" title={p.name}>{p.name}</div>
                      </td>
                      <td className="p-4 text-center text-[#ccc]">{p.quantity}</td>
                      <td className="p-4 text-right text-emerald-500">${p.total.toFixed(2)}</td>
                    </tr>
                  ))}
                  {topSelling.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-[#555] font-sans text-xs">No sales data directly available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Most Active Customers */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <h2 className="text-lg font-serif italic text-white flex items-center gap-2">
                 <Users className="h-4 w-4 text-emerald-500" />
                 Most Active Customers
               </h2>
            </div>
            <div className="rounded-lg border border-[#222] bg-[#0a0a0a] overflow-hidden">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-[#111] text-[10px] uppercase tracking-widest text-[#555] border-b border-[#222]">
                   <tr>
                     <th className="p-4">Customer</th>
                     <th className="p-4 text-center">Purchases</th>
                     <th className="p-4 text-right">Spent</th>
                   </tr>
                 </thead>
                 <tbody className="text-sm text-[#999] font-mono">
                    {mostActiveCustomers.map(c => (
                       <tr key={c.id} className="border-b border-[#111] hover:bg-[#0d0d0d]">
                         <td className="p-4">
                           <div className="text-white font-sans text-[12px]">{c.name || 'Unknown'}</div>
                           <div className="text-[10px] text-[#666] mt-1">{c.phone}</div>
                         </td>
                         <td className="p-4 text-center">{c.totalPurchaseCount || 0}</td>
                         <td className="p-4 text-right text-emerald-500">${(c.totalPurchaseAmount || 0).toFixed(2)}</td>
                       </tr>
                    ))}
                    {mostActiveCustomers.length === 0 && (
                       <tr><td colSpan={3} className="p-8 text-center text-[#555] font-sans text-xs">No customer records yet</td></tr>
                    )}
                 </tbody>
               </table>
            </div>
          </div>

          {/* Recent Sales */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-serif italic text-white">Recent Sales Ledger</h2>
            </div>
            
            <div className="rounded-lg border border-[#222] bg-[#0a0a0a] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#111] text-[10px] uppercase tracking-widest text-[#555] border-b border-[#222]">
                  <tr>
                    <th className="p-4">Time</th>
                    <th className="p-4">Total</th>
                    <th className="p-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-[#999] font-mono">
                  {sales.slice(0, 5).map(sale => {
                    const retAmt = sale.items.reduce((s, i) => s + (i.returnedQuantity || 0) * i.price, 0);
                    return (
                    <tr key={sale.id} className="border-b border-[#111] hover:bg-[#0d0d0d]">
                      <td className="p-4 text-[#ccc]">
                        {sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleTimeString() : 'Just now'}
                      </td>
                      <td className="p-4 text-emerald-500 font-bold">
                        ${(sale.totalAmount - retAmt).toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                         <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${
                           sale.status === 'returned' ? 'text-red-500 border-red-500/20 bg-red-500/10' :
                           sale.status === 'partial_return' ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10' :
                           'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'
                         }`}>
                           {sale.status || 'completed'}
                         </span>
                      </td>
                    </tr>
                  )})}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-[#555] font-sans text-xs">No transactions yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
