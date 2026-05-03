import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, FileText, Settings, LogOut, ArrowLeft, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { isAdminAuthenticated, logoutAdmin } = useAuth();
  const location = useLocation();

  if (!isAdminAuthenticated && location.pathname !== '/admin/login') {
    return <Navigate to="/admin/login" replace />;
  }

  if (location.pathname === '/admin/login') {
    return <Outlet />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Reports & Ledger', path: '/admin/reports', icon: FileText },
  ];

  return (
    <div className="min-h-screen flex bg-[#050505] text-[#e0e0e0] font-sans flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-[#222] bg-[#0a0a0a] flex flex-col flex-shrink-0">
        <div className="p-8 border-b border-[#222] flex flex-col">
          <div className="flex justify-between items-center w-full">
            <h2 className="text-xl font-serif italic text-emerald-500 tracking-tight">Nahid Billing</h2>
            <Link to="/" className="md:hidden text-[#666] hover:text-white">
               <ArrowLeft className="h-6 w-6" />
            </Link>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[#666] mt-1">Admin Console</p>
        </div>
        
        <nav className="flex-1 py-6 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {navItems.map(item => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-6 py-3 transition-colors text-sm whitespace-nowrap md:whitespace-normal ${
                  isActive ? 'bg-[#111] text-white border-l-2 border-emerald-500' : 'text-[#666] hover:text-white'
                }`}
              >
                <div className={`w-4 h-4 rounded-sm flex-shrink-0 ${isActive ? 'bg-emerald-500 opacity-50' : 'border border-[#444]'}`}></div>
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-[#222]">
           <div className="p-4 bg-[#0d0d0d] rounded-lg border border-[#222] md:flex flex-col gap-2 hidden">
             <Link to="/" className="flex items-center gap-3 text-xs text-[#666] hover:text-white transition">
               <ArrowLeft className="h-4 w-4" />
               <span className="uppercase tracking-widest">Back to POS</span>
             </Link>
             <button onClick={logoutAdmin} className="mt-4 w-full flex justify-center text-[10px] uppercase tracking-widest text-red-500 border border-red-500/30 px-2 py-2 rounded hover:bg-red-500/10 transition">
               Logout
             </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto h-auto md:h-screen">
        <Outlet />
      </main>
    </div>
  );
}
