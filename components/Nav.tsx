import React from 'react';
import { Link } from 'react-router';
import { Search, Bell, Menu, BadgeCheck, MessageSquare } from 'lucide-react';

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 w-full bg-black/40 backdrop-blur-2xl border-b border-white/10 supports-[backdrop-filter]:bg-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/dashboard" className="flex items-center gap-3 cursor-pointer group">
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.5)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.7)] transition-all">
              <BadgeCheck className="h-6 w-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tighter text-white">VOUCH</span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-4 py-2.5 border border-white/10 rounded-2xl leading-5 bg-white/5 backdrop-blur-md placeholder-gray-500 text-white focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 sm:text-sm transition-all shadow-inner"
                placeholder="Search projects, skills, or people..."
              />
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button className="text-gray-400 hover:text-white transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] ring-2 ring-black"></span>
            </button>
            <button className="text-gray-400 hover:text-white transition-colors hidden sm:block">
              <MessageSquare className="h-5 w-5" />
            </button>
            <div className="h-10 w-10 rounded-full overflow-hidden border border-white/20 cursor-pointer hover:border-white/40 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <img 
                src="https://images.unsplash.com/photo-1634552516330-ab1ccc0f605e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMG9mJTIwYXNpYW4lMjB3b21hbiUyMHNtaWxpbmd8ZW58MXx8fHwxNzcyOTA3NTE2fDA&ixlib=rb-4.1.0&q=80&w=100" 
                alt="Profile" 
                className="h-full w-full object-cover"
              />
            </div>
            <button className="md:hidden text-gray-400 hover:text-white">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
