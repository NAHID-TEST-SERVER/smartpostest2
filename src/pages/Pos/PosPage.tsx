import { useState, useCallback, useRef } from 'react';
import { Camera, Search, Trash2, Plus, Minus, ShoppingCart, LogIn, CheckCircle, Printer, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import Scanner from '../../components/Scanner';
import { getProductByBarcode, createSale, SaleItem, Product, getCustomerByPhone } from '../../lib/services';
import { useAuth } from '../../context/AuthContext';

export default function PosPage() {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const { adminNote } = useAuth();
  
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '' });
  const [finalInvoice, setFinalInvoice] = useState<any>(null);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // 1200Hz beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // lower volume

      oscillator.start(audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.15);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (err) {
      console.error("Audio beep failed", err);
    }
  };

  const handleAddProduct = useCallback(async (barcode: string) => {
    if (!barcode) return;
    setLoading(true);
    setError('');
    try {
      const product = await getProductByBarcode(barcode);
      if (product) {
        playBeep(); // Beep when successfully found
        setCart(prev => {
          const existing = prev.find(item => item.barcode === barcode);
          if (existing) {
            return prev.map(item => 
              item.barcode === barcode 
                ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
                : item
            );
          }
          return [...prev, {
            productId: product.id!,
            barcode: product.barcode,
            name: product.name,
            price: product.price,
            quantity: 1,
            total: product.price,
            costPrice: product.costPrice 
          } as any];
        });
      } else {
        setError('Product not found for barcode: ' + barcode);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching product');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddProduct(manualBarcode);
    setManualBarcode('');
  };

  const lastScanRef = useRef<{ barcode: string; time: number }>({ barcode: '', time: 0 });

  const onScanSuccess = useCallback((decodedText: string) => {
    const now = Date.now();
    const lastScan = lastScanRef.current;
    
    // Prevent duplicate scans within 1.5 seconds
    if (lastScan.barcode === decodedText && (now - lastScan.time) < 1500) {
      return;
    }
    
    lastScanRef.current = { barcode: decodedText, time: now };
    handleAddProduct(decodedText);
  }, []);

  
  const onScanFailure = useCallback((error: any) => {
    // Suppress console spam from Html5QrcodeScanner
    if (error && typeof error === 'string' && error.includes('camera')) {
       setError("Camera permission denied or camera not available. Please allow camera access.");
    }
  }, []);

  const updateQuantity = (barcode: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.barcode === barcode) {
        const newQ = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQ, total: newQ * item.price };
      }
      return item;
    }));
  };

  const removeItem = (barcode: string) => {
    setCart(prev => prev.filter(item => item.barcode !== barcode));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.total, 0);

  const finalizeSale = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const totalCost = cart.reduce((sum, item) => sum + ((item as any).costPrice || 0) * item.quantity, 0);
      const saleData: any = {
        items: cart,
        totalAmount,
        totalCost,
        adminNote: adminNote || ''
      };
      
      if (customerInfo.name || customerInfo.phone || customerInfo.address) {
        saleData.customerInfo = customerInfo;
      }
      
      const docRef = await createSale(saleData);
      
      setFinalInvoice({
        ...saleData,
        id: docRef.id,
        date: new Date()
      });
      
      setCart([]);
      setCustomerInfo({ name: '', phone: '', address: '' });
      setSuccessMsg('Sale finalized! Ready to print invoice.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to finalize sale');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePhoneBlur = async () => {
    if (!customerInfo.phone) return;
    try {
      const cust = await getCustomerByPhone(customerInfo.phone);
      if (cust) {
        setCustomerInfo(prev => ({
          ...prev,
          name: cust.name || prev.name,
          address: cust.address || prev.address
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (finalInvoice) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 print:bg-white print:p-0">
        
        {/* Actions - Hidden when printing */}
        <div className="mb-8 flex gap-4 print:hidden">
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded uppercase tracking-widest text-xs font-bold transition"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>
          <button 
            onClick={() => setFinalInvoice(null)} 
            className="flex items-center gap-2 bg-[#111] hover:bg-[#222] border border-[#333] text-white px-6 py-3 rounded uppercase tracking-widest text-xs transition"
          >
            <X className="h-4 w-4" />
            New Sale
          </button>
        </div>

        {/* Invoice Receipt Format */}
        <div className="bg-white text-black p-4 w-full max-w-[300px] print:w-[120px] print:max-w-[120px] print:p-0 print:m-0 mx-auto text-xs font-mono receipt-container">
          <style>{`
            @media print {
              @page { margin: 0; }
              body { margin: 0; background: white; color: black; }
              .print\\:hidden { display: none !important; }
              .receipt-container { 
                width: 120px !important; 
                max-width: 120px !important; 
                overflow: hidden; 
                font-size: 8px !important;
                line-height: 1.2;
              }
              .receipt-container * {
                font-size: 8px !important;
              }
              .receipt-container h1 {
                font-size: 10px !important;
              }
            }
          `}</style>
          
          <div className="text-center mb-4 border-b border-black pb-2 border-dashed">
            <h1 className="font-bold text-sm uppercase">REK RADIANT TRADERS</h1>
            <p>SALAMPUR LALPUR NATORE</p>
            <p>Phone: 01328276240</p>
          </div>
          
          <div className="mb-4">
            <p>Date: {finalInvoice.date.toLocaleString()}</p>
            <p>Inv #: {finalInvoice.id.slice(0,8)}</p>
            {finalInvoice.customerInfo && (
              <div className="mt-2 border-t border-black pt-2 border-dashed">
                <p>Customer Info:</p>
                {finalInvoice.customerInfo.name && <p>Name: {finalInvoice.customerInfo.name}</p>}
                {finalInvoice.customerInfo.phone && <p>Phone: {finalInvoice.customerInfo.phone}</p>}
                {finalInvoice.customerInfo.address && <p>Address: {finalInvoice.customerInfo.address}</p>}
              </div>
            )}
          </div>
          
          <div className="border-b border-black pb-2 mb-2 border-dashed">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="pb-1">Item</th>
                  <th className="pb-1 text-right">Amt</th>
                </tr>
              </thead>
              <tbody>
                {finalInvoice.items.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="align-top py-1 max-w-[70px]">
                      <div className="truncate" title={item.name}>{item.name}</div>
                      <div className="text-[10px] print:text-[6px] text-gray-500">{item.quantity} x ${item.price.toFixed(2)}</div>
                    </td>
                    <td className="align-top text-right py-1">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="text-right font-bold text-sm mb-4">
            TOTAL: ${finalInvoice.totalAmount.toFixed(2)}
          </div>
          
          <div className="text-center text-[10px] print:text-[6px] border-t border-black pt-2 border-dashed">
            <p>Thank you for shopping with us!</p>
            <p className="mt-1">&copy; REK RADIANT TRADERS</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] flex flex-col font-sans print:hidden">
      {/* Header */}
      <header className="h-20 border-b border-[#222] bg-[#050505] text-white p-4 flex justify-between items-center px-8">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-emerald-500" />
          <h1 className="text-xl font-serif italic text-emerald-500 tracking-tight">Smart POS</h1>
        </div>
        <Link to="/admin/login" className="flex items-center gap-1 text-[11px] uppercase tracking-widest bg-[#111] border border-[#333] hover:text-white text-[#666] px-4 py-1.5 rounded transition">
          <LogIn className="h-4 w-4" />
          Admin
        </Link>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto p-4 flex flex-col gap-4">
        
        {/* Alerts */}
        {error && <div className="bg-red-900/20 text-red-500 p-3 rounded-lg text-sm border border-red-500/30">{error}</div>}
        {successMsg && <div className="bg-emerald-900/20 text-emerald-500 p-3 rounded-lg text-sm border border-emerald-500/30 flex items-center gap-2"><CheckCircle className="h-4 w-4"/> {successMsg}</div>}

        {/* Input Section */}
        <div className="bg-[#0a0a0a] p-4 rounded-xl border border-[#222]">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#444]" />
              <input 
                type="text" 
                value={manualBarcode}
                onChange={e => setManualBarcode(e.target.value)}
                placeholder="Enter Barcode" 
                className="w-full pl-10 pr-4 py-3 bg-[#111] border border-[#222] text-white rounded focus:outline-none focus:border-emerald-500 transition text-sm"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !manualBarcode}
              className="bg-[#111] border border-[#333] text-[#e0e0e0] px-4 py-2 rounded text-[11px] uppercase tracking-widest disabled:opacity-50"
            >
              Add
            </button>
          </form>

          <div className="mt-4 flex items-center gap-4">
            <div className="h-px bg-[#222] flex-1"></div>
            <span className="text-[#444] text-[9px] uppercase tracking-widest">OR</span>
            <div className="h-px bg-[#222] flex-1"></div>
          </div>

          <button 
            onClick={() => setIsScanning(!isScanning)}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-[#111] text-emerald-500 border border-emerald-500/20 px-4 py-3 rounded text-[11px] uppercase tracking-widest hover:border-emerald-500/40 transition"
          >
            <Camera className="h-4 w-4" />
            {isScanning ? 'Close Scanner' : 'Scan Barcode with Camera'}
          </button>

          {isScanning && (
            <div className="bg-[#050505] p-2 rounded mt-4 border border-[#333]">
              <Scanner onScanSuccess={onScanSuccess} onScanFailure={onScanFailure} />
            </div>
          )}
        </div>

        {/* Cart / Invoice List */}
        <div className="flex-1 bg-[#0a0a0a] rounded-xl border border-[#222] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#222] bg-[#111] flex justify-between">
            <span className="text-[10px] uppercase text-[#666] tracking-widest">Cart ({cart.length} Items)</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center text-[#444] py-10 flex flex-col items-center gap-2">
                <ShoppingCart className="h-10 w-10 opacity-20" />
                <p className="text-sm">No items added yet</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.barcode} className="p-3 bg-[#1a1a1a] rounded flex justify-between items-center border border-[#222]">
                  <div className="text-[11px] min-w-0 flex-1 mr-3">
                    <p className="text-white truncate" title={item.name}>{item.name}</p>
                    <p className="text-[#666] truncate">#{item.barcode}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center border border-[#222] rounded bg-[#111] overflow-hidden">
                      <button onClick={() => updateQuantity(item.barcode, -1)} className="px-2 py-1 hover:bg-[#222] text-[#666]"><Minus className="h-3 w-3" /></button>
                      <span className="w-6 text-center text-xs font-mono text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.barcode, 1)} className="px-2 py-1 hover:bg-[#222] text-[#666]"><Plus className="h-3 w-3" /></button>
                    </div>
                    
                    <div className="text-right min-w-[3rem] font-mono text-emerald-500 text-xs">
                      ${item.total.toFixed(2)}
                    </div>
                    
                    <button onClick={() => removeItem(item.barcode)} className="text-red-500/80 hover:text-red-500 ml-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Customer Info (Optional) */}
          <div className="p-4 border-t border-[#222] bg-[#111] space-y-3">
             <p className="text-[10px] text-[#666] uppercase tracking-widest">Customer Details (Optional)</p>
             <div className="space-y-2">
               <input 
                 type="text" 
                 placeholder="Customer Name" 
                 value={customerInfo.name}
                 onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                 className="w-full px-3 py-2 bg-[#050505] border border-[#222] text-white rounded focus:outline-none focus:border-emerald-500 transition text-xs"
               />
               <input 
                 type="tel" 
                 placeholder="Phone Number" 
                 value={customerInfo.phone}
                 onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                 onBlur={handlePhoneBlur}
                 className="w-full px-3 py-2 bg-[#050505] border border-[#222] text-white rounded focus:outline-none focus:border-emerald-500 transition text-xs"
               />
               <input 
                 type="text" 
                 placeholder="Address" 
                 value={customerInfo.address}
                 onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                 className="w-full px-3 py-2 bg-[#050505] border border-[#222] text-white rounded focus:outline-none focus:border-emerald-500 transition text-xs"
               />
             </div>
          </div>

          {/* Footer Total & Finalize */}
          <div className="p-4 border-t border-[#222] bg-[#111] space-y-4">
            <div className="flex justify-between items-end mb-4">
              <p className="text-xs text-[#666] uppercase tracking-widest">Total Amount</p>
              <p className="text-2xl text-white font-mono">${totalAmount.toFixed(2)}</p>
            </div>
            <button 
              onClick={finalizeSale}
              disabled={loading || cart.length === 0}
              className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest text-[12px] shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Processing...' : 'Finalize Sale'}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
