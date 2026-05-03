import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, KeyRound, FileEdit, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(password, note)) {
      navigate('/admin/dashboard');
    } else {
      setError('Invalid admin password');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans text-white">
      <div className="w-[400px] border border-[#222] bg-[#0a0a0a] rounded-xl overflow-hidden shadow-2xl">
        <div className="p-8 pb-6 border-b border-[#222] bg-[#111]">
          <h2 className="text-2xl font-serif italic text-emerald-500 tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6" />
            Admin Access
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-[#666] mt-1">Authenticate to continue</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-900/20 text-red-500 p-3 rounded text-[11px] uppercase tracking-widest border border-red-500/30 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase text-[#666] tracking-widest mb-1">Admin Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#444]" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-[#111] border border-[#222] rounded text-white focus:outline-none focus:border-emerald-500 transition font-mono text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[#666] tracking-widest mb-1">Session Note (Optional)</label>
              <div className="relative">
                <FileEdit className="absolute left-3 top-3 h-4 w-4 text-[#444]" />
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  className="w-full pl-9 pr-4 py-3 bg-[#111] border border-[#222] rounded focus:outline-none focus:border-[#444] transition text-sm text-[#ccc]"
                  placeholder="e.g. Morning Shift..."
                />
              </div>
              <p className="text-[9px] uppercase tracking-widest text-[#444] mt-1">Note attached to sales.</p>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 text-white rounded font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-emerald-900/20"
            >
              Authenticate
            </button>
          </form>
        </div>

        <div className="p-4 border-t border-[#222] bg-[#111] text-center">
          <Link to="/" className="inline-flex items-center text-[10px] uppercase tracking-widest text-[#666] hover:text-white transition">
            <ArrowLeft className="h-3 w-3 mr-1" /> Back to POS panel
          </Link>
        </div>
      </div>
    </div>
  );
}
