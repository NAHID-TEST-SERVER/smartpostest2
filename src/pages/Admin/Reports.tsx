import { useState, useEffect } from 'react';
import { getAllSales, getAllProducts, Sale, Product, returnSaleItem } from '../../lib/services';
import { Download, FileText, TrendingUp, DollarSign, Package, CornerUpLeft, Search, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Return modal states
  const [returnModalSale, setReturnModalSale] = useState<Sale | null>(null);
  const [returnProcessing, setReturnProcessing] = useState(false);
  const [returnAmounts, setReturnAmounts] = useState<Record<string, number>>({});

  const loadData = () => {
    setLoading(true);
    Promise.all([getAllSales(), getAllProducts()])
      .then(([sData, pData]) => {
        setSales(sData);
        setProducts(pData);
      })
      .catch((err) => {
        console.error(err);
        alert(err instanceof Error ? err.message : 'Error loading data');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReturnItem = async (saleId: string, itemBarcode: string) => {
    const qty = returnAmounts[itemBarcode];
    if (!qty || qty <= 0) return;
    
    setReturnProcessing(true);
    try {
      await returnSaleItem(saleId, itemBarcode, qty);
      setReturnAmounts(prev => ({ ...prev, [itemBarcode]: 0 }));
      loadData(); // Re-fetch all data to show updated state
      // Find the updated sale in new data if possible, or just close modal
      setReturnModalSale(null); 
    } catch (err: any) {
      alert(err.message || 'Return failed');
    } finally {
      setReturnProcessing(false);
    }
  };

  const exportPDF = (type: 'sales' | 'products' | 'customers') => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("REK RADIANT TRADERS", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report Type: ${type.toUpperCase()}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

    if (type === 'sales') {
      const tableColumn = ["Date", "Txn ID", "Customer", "Items", "Revenue", "Status"];
      const tableRows: any[] = [];
      
      sales.forEach(sale => {
        const dateStr = sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleDateString() : '';
        const itemsList = sale.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
        tableRows.push([
          dateStr,
          sale.id?.slice(0, 8),
          sale.customerInfo ? sale.customerInfo.phone : 'Walking',
          itemsList,
          `$${sale.totalAmount.toFixed(2)}`,
          sale.status || 'completed'
        ]);
      });

      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 45 });
    } else if (type === 'products') {
      const tableColumn = ["Barcode", "Product Name", "Stock", "Cost", "Price", "Value"];
      const tableRows: any[] = [];
      
      products.forEach(p => {
        tableRows.push([
          p.barcode,
          p.name,
          p.stock.toString(),
          `$${(p.costPrice || 0).toFixed(2)}`,
          `$${p.price.toFixed(2)}`,
          `$${(p.stock * p.price).toFixed(2)}`
        ]);
      });

      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 45 });
    }

    doc.save(`${type}_report.pdf`);
  };

  const filteredSales = sales.filter(s => 
    s.id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.customerInfo?.phone && s.customerInfo.phone.includes(searchTerm))
  );

  if (loading && sales.length === 0) return <div className="p-8 text-gray-500">Loading reports...</div>;

  const totalRevenue = sales.reduce((sum, sale) => {
    const saleReturnAmt = sale.items.reduce((itemSum, item) => itemSum + (item.returnedQuantity || 0) * item.price, 0);
    return sum + (sale.totalAmount - saleReturnAmt);
  }, 0);
  
  const totalCostOfGoodsSold = sales.reduce((sum, sale) => {
    const saleReturnCost = sale.items.reduce((itemSum, item) => itemSum + (item.returnedQuantity || 0) * ((item as any).costPrice || 0), 0);
    return sum + ((sale.totalCost || 0) - saleReturnCost);
  }, 0);
  const grossProfit = totalRevenue - totalCostOfGoodsSold;
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const inventoryValueSalePrice = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const inventoryValueCostPrice = products.reduce((sum, p) => sum + ((p.costPrice || 0) * p.stock), 0);

  return (
    <div className="flex flex-col h-full bg-[#050505] text-[#e0e0e0]">
      <header className="h-20 border-b border-[#222] bg-[#050505] p-8 flex justify-between items-center z-10 flex-shrink-0">
        <h1 className="text-xl font-serif italic text-emerald-500 tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Ledger & Reports
        </h1>
        <div className="flex gap-2 relative group">
          <button className="px-4 py-2 bg-emerald-600 text-white text-[11px] uppercase tracking-widest rounded transition hover:bg-emerald-700 flex items-center gap-2">
            <Download className="h-4 w-4" /> Export PDF
          </button>
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-[#222] rounded shadow-xl hidden group-hover:block z-50">
            <button onClick={() => exportPDF('sales')} className="w-full text-left px-4 py-3 text-xs hover:bg-[#2a2a2a] transition">Sales Report</button>
            <button onClick={() => exportPDF('products')} className="w-full text-left px-4 py-3 text-xs hover:bg-[#2a2a2a] transition border-t border-[#222]">Products Inventory</button>
          </div>
        </div>
      </header>

      <section className="flex-1 p-8 overflow-y-auto">
        {/* Ledger Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg border border-[#222] bg-[#0a0a0a] p-6 text-center">
            <h3 className="text-[10px] uppercase tracking-widest text-[#666] mb-2 flex items-center justify-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Total Revenue
            </h3>
            <p className="text-3xl font-light text-white">${totalRevenue.toFixed(2)}</p>
          </div>

          <div className="rounded-lg border border-[#222] bg-[#0a0a0a] p-6 text-center">
            <h3 className="text-[10px] uppercase tracking-widest text-[#666] mb-2 flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Gross Profit
            </h3>
            <p className="text-3xl font-light text-white">${grossProfit.toFixed(2)}</p>
            <p className="text-xs text-emerald-500 font-mono mt-2">Margin: {margin.toFixed(1)}%</p>
          </div>

          <div className="rounded-lg border border-[#222] bg-[#0a0a0a] p-6 text-center">
            <h3 className="text-[10px] uppercase tracking-widest text-[#666] mb-2 flex items-center justify-center gap-2">
              <Package className="h-4 w-4 text-[#444]" />
              Inventory Value
            </h3>
            <p className="text-3xl font-light text-white">${inventoryValueCostPrice.toFixed(2)}</p>
            <p className="text-[10px] text-[#666] font-mono mt-2 uppercase">Sale Val: ${inventoryValueSalePrice.toFixed(2)}</p>
          </div>

          <div className="rounded-lg border border-[#222] bg-[#0a0a0a] p-6 text-center">
            <h3 className="text-[10px] uppercase tracking-widest text-[#666] mb-2 flex items-center justify-center gap-2">
              <CornerUpLeft className="h-4 w-4 text-red-500" />
              Total Returns
            </h3>
            <p className="text-3xl font-light text-white">
              {sales.filter(s => s.status === 'returned' || s.status === 'partial_return').length}
            </p>
          </div>
        </div>

        <div className="mb-4 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444]" />
          <input 
            type="text" 
            placeholder="Search Txn ID or Phone..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#111] border border-[#222] text-[#e0e0e0] text-[11px] uppercase tracking-widest rounded focus:outline-none focus:border-[#444] transition"
          />
        </div>

        {/* Spreadsheet View */}
        <div className="rounded-lg border border-[#222] bg-[#0a0a0a] overflow-hidden">
           <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-[#111] text-[10px] uppercase tracking-widest text-[#555] border-b border-[#222]">
              <tr>
                <th className="p-4">Date / Transaction ID</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items Sold</th>
                <th className="p-4 text-right">Revenue ($)</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#999] font-mono">
              {filteredSales.map((sale) => {
                const returnAmount = sale.items.reduce((s, i) => s + (i.returnedQuantity || 0) * i.price, 0);
                const actualRevenue = sale.totalAmount - returnAmount;
                return (
                <tr key={sale.id} className="border-b border-[#111] hover:bg-[#0d0d0d]">
                  <td className="p-4 text-[#ccc]">
                    <div className="text-white font-sans text-xs">
                      {sale.timestamp?.toDate ? sale.timestamp.toDate().toLocaleString() : 'Just now'}
                    </div>
                    <div className="text-[10px] mt-1 text-[#666]">ID: {sale.id}</div>
                  </td>
                  <td className="p-4 font-sans text-xs">
                     {sale.customerInfo ? (
                        <>
                          <div className="text-white">{sale.customerInfo.name || 'Unknown'}</div>
                          <div className="text-[#666] text-[10px] mt-1">{sale.customerInfo.phone}</div>
                        </>
                     ) : <span className="text-[#666] italic">Walking Customer</span>}
                  </td>
                  <td className="p-4">
                    <div className="text-[11px] font-sans text-white max-w-[200px] truncate" title={sale.items.map(i => `${i.name} (${i.quantity})`).join(', ')}>
                      {sale.items.map(i => `${i.name} (${i.quantity})`).join(', ')}
                    </div>
                  </td>
                  <td className="p-4 text-right text-emerald-500 font-bold">${actualRevenue.toFixed(2)}</td>
                  <td className="p-4">
                     <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${
                       sale.status === 'returned' ? 'text-red-500 border-red-500/20 bg-red-500/10' :
                       sale.status === 'partial_return' ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10' :
                       'text-emerald-500 border-emerald-500/20 bg-emerald-500/10'
                     }`}>
                       {sale.status || 'completed'}
                     </span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setReturnModalSale(sale)}
                      disabled={sale.status === 'returned'}
                      className="text-[10px] uppercase tracking-widest text-[#666] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Issue Return
                    </button>
                  </td>
                </tr>
              )})}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#555] font-sans text-xs">No matching sales records.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Return Modal */}
      {returnModalSale && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
           <div className="bg-[#0a0a0a] border border-[#222] rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
             <div className="p-6 border-b border-[#222] flex justify-between items-center bg-[#111]">
               <h2 className="text-lg font-serif italic text-emerald-500 tracking-tight">Return Items - {returnModalSale.id?.slice(0,8)}</h2>
               <button onClick={() => setReturnModalSale(null)} className="text-[#666] hover:text-white transition">
                 <X className="h-5 w-5" />
               </button>
             </div>
             
             <div className="p-6">
               <table className="w-full text-left border-collapse mb-6">
                  <thead className="bg-[#111] text-[10px] uppercase tracking-widest text-[#555] border border-[#222]">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3 text-center">Purchased</th>
                      <th className="p-3 text-center">Already Ret.</th>
                      <th className="p-3 text-center">Ret. Qty</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-[#ccc] font-mono border border-[#222]">
                    {returnModalSale.items.map(item => {
                      const returningQty = returnAmounts[item.barcode] || 0;
                      const maxToReturn = item.quantity - (item.returnedQuantity || 0);
                      
                      return (
                        <tr key={item.barcode} className="border-t border-[#222]">
                          <td className="p-3 text-white font-sans text-xs">{item.name}</td>
                          <td className="p-3 text-center">{item.quantity}</td>
                          <td className="p-3 text-center text-red-500">{item.returnedQuantity || 0}</td>
                          <td className="p-3 text-center w-24">
                            <input 
                              type="number" 
                              min="0"
                              max={maxToReturn}
                              value={returningQty}
                              onChange={e => setReturnAmounts(prev => ({...prev, [item.barcode]: parseInt(e.target.value) || 0}))}
                              className="w-16 px-2 py-1 bg-[#111] border border-[#333] text-center text-white rounded focus:outline-none focus:border-emerald-500 transition text-sm"
                              disabled={maxToReturn === 0}
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleReturnItem(returnModalSale.id!, item.barcode)}
                              disabled={returnProcessing || returningQty <= 0 || returningQty > maxToReturn}
                              className="px-3 py-1.5 bg-red-900/40 text-red-500 border border-red-500/30 rounded text-[10px] uppercase tracking-widest disabled:opacity-50 transition"
                            >
                              Process
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
               </table>
             </div>
           </div>
         </div>
      )}
    </div>
  );
}
