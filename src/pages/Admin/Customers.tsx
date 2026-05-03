import { useState, useEffect } from 'react';
import { getAllCustomers, createOrUpdateCustomer, Customer } from '../../lib/services';
import { Users, Search, PlusCircle, CreditCard, RotateCcw, X, Edit, PhoneCall, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Customer>>({ phone: '', name: '', address: '' });
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
      alert('Error fetching customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) {
       setError("Phone number is required");
       return;
    }
    setLoading(true);
    setError('');
    try {
      await createOrUpdateCustomer({
        phone: formData.phone,
        name: formData.name,
        address: formData.address,
      });
      setIsModalOpen(false);
      setFormData({ phone: '', name: '', address: '' });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };
  
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("REK RADIANT TRADERS", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Report Type: CUSTOMERS`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);

    const tableColumn = ["Name", "Phone", "Purchases", "Spent", "Returns", "Return Amt"];
    const tableRows: any[] = [];
    
    customers.forEach(c => {
      tableRows.push([
        c.name || 'Unknown',
        c.phone,
        c.totalPurchaseCount || 0,
        `$${(c.totalPurchaseAmount || 0).toFixed(2)}`,
        c.totalReturnCount || 0,
        `$${(c.totalReturnAmount || 0).toFixed(2)}`
      ]);
    });

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 45 });
    doc.save(`customers_report.pdf`);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full bg-[#050505] text-[#e0e0e0]">
      <header className="h-20 border-b border-[#222] bg-[#050505] p-8 flex justify-between items-center z-10 flex-shrink-0">
        <h1 className="text-xl font-serif italic text-emerald-500 tracking-tight flex items-center gap-2">
          <Users className="h-6 w-6" />
          Customers
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={exportPDF}
            className="px-4 py-2 bg-[#111] border border-[#222] text-[#666] hover:text-white hover:border-[#444] text-[11px] uppercase tracking-widest rounded transition flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Export PDF
          </button>
          <button 
            onClick={() => {
              setFormData({ phone: '', name: '', address: '' });
              setIsModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-[11px] uppercase tracking-widest font-bold transition flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" /> Add Customer
          </button>
        </div>
      </header>

      <section className="flex-1 p-8 overflow-y-auto">
        <div className="mb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444]" />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#111] border border-[#222] text-[#e0e0e0] text-[11px] uppercase tracking-widest rounded focus:outline-none focus:border-[#444] transition"
            />
          </div>
        </div>

        <div className="rounded-lg border border-[#222] bg-[#0a0a0a] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#111] text-[10px] uppercase tracking-widest text-[#555] border-b border-[#222]">
              <tr>
                <th className="p-4">Customer Info</th>
                <th className="p-4">Address</th>
                <th className="p-4 text-center">Total Purchases</th>
                <th className="p-4 text-right">Spent ($)</th>
                <th className="p-4 text-center">Returned Count</th>
                <th className="p-4 text-right">Return ($)</th>
                <th className="p-4 w-16 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-[#ccc] font-mono">
              {loading && customers.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-[#555] font-sans">Loading customers...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-[#555] font-sans">No customers found.</td></tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id} className="border-b border-[#111] hover:bg-[#0d0d0d]">
                    <td className="p-4">
                      <div className="text-white font-sans text-xs">{c.name || 'Unknown'}</div>
                      <div className="text-[10px] text-[#666] flex items-center gap-1 mt-1">
                        <PhoneCall className="h-3 w-3" /> {c.phone}
                      </div>
                    </td>
                    <td className="p-4 text-[11px] font-sans text-[#888] max-w-[150px] truncate" title={c.address}>
                      {c.address || '-'}
                    </td>
                    <td className="p-4 text-center"><span className="px-2 py-1 bg-[#111] border border-[#222] rounded">{c.totalPurchaseCount || 0}</span></td>
                    <td className="p-4 text-right text-emerald-500">${(c.totalPurchaseAmount || 0).toFixed(2)}</td>
                    <td className="p-4 text-center text-[#666]">{c.totalReturnCount || 0}</td>
                    <td className="p-4 text-right text-red-500/80">${(c.totalReturnAmount || 0).toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => {
                          setFormData({ phone: c.phone, name: c.name, address: c.address });
                          setIsModalOpen(true);
                        }}
                        className="text-[#666] hover:text-emerald-500 transition mx-auto block"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-[#222] rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-[#222] flex justify-between items-center bg-[#111]">
              <h2 className="text-lg font-serif italic text-emerald-500 tracking-tight">Customer Detail</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#666] hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {error && <div className="mb-4 bg-red-900/20 text-red-500 p-3 rounded text-[11px] uppercase tracking-widest border border-red-500/30">{error}</div>}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase text-[#666] tracking-widest mb-1">Phone Number *</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 bg-[#111] border border-[#222] text-white rounded focus:outline-none focus:border-[#444] text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#666] tracking-widest mb-1">Full Name</label>
                  <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-[#111] border border-[#222] text-white rounded focus:outline-none focus:border-[#444] text-sm font-sans" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#666] tracking-widest mb-1">Address</label>
                  <textarea rows={2} value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 bg-[#111] border border-[#222] text-[#ccc] rounded focus:outline-none focus:border-[#444] text-sm font-sans" />
                </div>

                <div className="mt-6 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-[#111] text-[#666] border border-[#222] rounded text-[11px] uppercase tracking-widest hover:text-white hover:bg-[#222] transition">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-900/20 disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
