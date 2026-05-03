import { useState, useEffect } from 'react';
import { getAllProducts, addProduct, updateProduct, deleteProduct, Product } from '../../lib/services';
import { Plus, Edit2, Trash2, X, Search, Camera } from 'lucide-react';
import Scanner from '../../components/Scanner';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchScanning, setIsSearchScanning] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    barcode: '', name: '', price: 0, costPrice: 0, stock: 0
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Error loading products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setFormData({ barcode: '', name: '', price: 0, costPrice: 0, stock: 0 });
    setIsModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id!);
    setFormData({ 
      barcode: p.barcode, 
      name: p.name, 
      price: p.price, 
      costPrice: p.costPrice || 0,
      stock: p.stock 
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(id);
      loadData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      await updateProduct(editId, formData);
    } else {
      await addProduct(formData);
    }
    setIsModalOpen(false);
    loadData();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode.includes(searchTerm)
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505]">
      <section className="flex-1 p-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-serif italic text-white">Product Catalog</h2>
          <div className="flex gap-2">
            <button 
              onClick={openAdd}
              className="px-4 py-1.5 bg-emerald-600 text-white text-[11px] uppercase tracking-widest rounded transition hover:bg-emerald-700"
            >
              + Add Product
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444]" />
              <input 
                type="text" 
                placeholder="Search by name or barcode..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#111] border border-[#222] text-[#e0e0e0] text-[11px] uppercase tracking-widest rounded focus:outline-none focus:border-[#444] transition"
              />
            </div>
            <button 
              onClick={() => setIsSearchScanning(!isSearchScanning)}
              className={`p-2 border rounded transition flex items-center justify-center ${isSearchScanning ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-500' : 'bg-[#111] border-[#222] hover:border-[#444] text-[#888]'}`}
              title="Scan Barcode to Search"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          
          {isSearchScanning && (
            <div className="max-w-md mt-4 p-2 bg-[#0a0a0a] border border-[#222] rounded">
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-[10px] uppercase text-[#666] tracking-widest">Scan Barcode</span>
                <button onClick={() => setIsSearchScanning(false)} className="text-[#666] hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </div>
              <Scanner 
                onScanSuccess={(text) => {
                  setSearchTerm(text);
                  setIsSearchScanning(false);
                }} 
              />
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[#222] bg-[#0a0a0a] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-[#555] text-xs">Loading products...</div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="bg-[#111] text-[10px] uppercase tracking-widest text-[#555] border-b border-[#222]">
                <tr>
                  <th className="p-4">Barcode</th>
                  <th className="p-4">Name</th>
                  <th className="p-4 text-right">Cost Price</th>
                  <th className="p-4 text-right">Sale Price</th>
                  <th className="p-4 text-right">Stock</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[#999] font-mono">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="border-b border-[#111] hover:bg-[#0d0d0d]">
                    <td className="p-4 text-[#ccc]">{p.barcode}</td>
                    <td className="p-4">
                      <div className="text-white font-sans text-xs truncate max-w-[200px]" title={p.name}>{p.name}</div>
                    </td>
                    <td className="p-4 text-right">${(p.costPrice || 0).toFixed(2)}</td>
                    <td className="p-4 text-right text-emerald-500">${p.price.toFixed(2)}</td>
                    <td className="p-4 text-right">{p.stock}</td>
                    <td className="p-4 flex items-center justify-center gap-2">
                       <button onClick={() => openEdit(p)} className="p-1 px-2 border border-[#333] text-[#999] hover:text-white rounded text-[10px] uppercase tracking-widest bg-[#111] transition">
                         Edit
                       </button>
                       <button onClick={() => handleDelete(p.id!)} className="p-1 px-2 border border-red-900/30 text-red-500 hover:text-red-400 rounded text-[10px] uppercase tracking-widest bg-red-900/10 transition">
                         Delete
                       </button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#555] font-sans text-xs">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#050505]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] rounded-lg border border-[#222] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-[#222] bg-[#111] flex justify-between items-center">
              <h2 className="text-sm font-serif italic text-white tracking-tight">{editId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => { setIsModalOpen(false); setIsScanning(false); }} className="text-[#666] hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 font-sans">
              {isScanning ? (
                <div className="mb-6">
                  <div className="bg-[#050505] border border-emerald-500/20 rounded p-2">
                    <Scanner 
                      onScanSuccess={(text) => {
                        setFormData({ ...formData, barcode: text });
                        setIsScanning(false);
                      }} 
                    />
                  </div>
                  <button type="button" onClick={() => setIsScanning(false)} className="mt-4 w-full text-center text-[10px] uppercase tracking-widest text-[#666] hover:text-white transition">Cancel Scan</button>
                </div>
              ) : (
                <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase text-[#666] tracking-widest mb-1">Barcode</label>
                    <div className="flex gap-2">
                      <input required type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="flex-1 px-3 py-2 bg-[#111] border border-[#222] text-white rounded focus:outline-none focus:border-[#444] text-xs font-mono" />
                      <button type="button" onClick={() => setIsScanning(true)} className="px-3 py-2 bg-[#111] border border-[#333] hover:border-[#444] text-[#999] rounded flex items-center justify-center" title="Scan Barcode">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] uppercase text-[#666] tracking-widest mb-1">Product Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-[#111] border border-[#222] text-white rounded focus:outline-none focus:border-[#444] text-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase text-[#666] tracking-widest mb-1">Cost Price ($)</label>
                      <input required type="number" step="0.01" min="0" value={formData.costPrice === undefined || Number.isNaN(formData.costPrice) ? '' : formData.costPrice} onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value)})} className="w-full px-3 py-2 bg-[#111] border border-[#222] text-white rounded focus:outline-none focus:border-[#444] text-sm font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-[#666] tracking-widest mb-1">Sale Price ($)</label>
                      <input required type="number" step="0.01" min="0" value={formData.price === undefined || Number.isNaN(formData.price) ? '' : formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full px-3 py-2 bg-[#111] border border-[#222] text-white rounded focus:outline-none focus:border-[#444] text-sm font-mono text-emerald-500" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-[#666] tracking-widest mb-1">Stock Quantity</label>
                    <input required type="number" min="0" value={formData.stock === undefined || Number.isNaN(formData.stock) ? '' : formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value, 10)})} className="w-full px-3 py-2 bg-[#111] border border-[#222] text-white rounded focus:outline-none focus:border-[#444] text-sm font-mono" />
                  </div>
                </form>
              )}
            </div>

            <div className="p-4 border-t border-[#222] bg-[#111] flex justify-end gap-2">
              <button type="button" onClick={() => { setIsModalOpen(false); setIsScanning(false); }} className="px-4 py-2 bg-[#050505] border border-[#333] text-[#999] hover:text-white rounded text-[11px] uppercase tracking-widest transition">
                Cancel
              </button>
              <button form="productForm" type="submit" disabled={isScanning} className="px-4 py-2 bg-emerald-600 text-white rounded text-[11px] uppercase tracking-widest disabled:opacity-50 transition">
                {editId ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
