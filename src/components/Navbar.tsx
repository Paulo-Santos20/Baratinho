import { Tag, Search, Menu } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-yellow-400 border-b border-yellow-500/20 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 p-1.5 rounded-xl shadow-lg">
            <Tag className="text-yellow-400" size={22} />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900">BARATINHO</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-yellow-500 rounded-full transition-colors">
            <Search size={20} className="text-slate-900" />
          </button>
          <button className="md:hidden p-2 hover:bg-yellow-500 rounded-full transition-colors">
            <Menu size={20} className="text-slate-900" />
          </button>
          <button className="hidden md:block bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all active:scale-95 shadow-md">
            BAIXAR APP
          </button>
        </div>
      </div>
    </nav>
  );
}