'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, LogOut, ExternalLink, Box, Palette, Cpu, Plus, CheckCircle } from 'lucide-react'
import { signOut } from './actions'

export default function VouchHighClass() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [supabase])

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 1, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-blue-500 font-black text-5xl italic tracking-tighter"
      >
        VOUCH
      </motion.div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#020202] text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Dynamic Background Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-purple-600/5 blur-[100px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-white/5 backdrop-blur-xl bg-black/40 sticky top-0">
        <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">VOUCH</h1>
        {user && (
          <form action={signOut} className="flex items-center gap-6">
            <span className="hidden md:block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Build Protocol v1.0</span>
            <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500/80 hover:text-red-400 transition-colors">
              <LogOut size={14} /> Logout
            </button>
          </form>
        )}
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        <div className="space-y-16">
          {/* Profile Header */}
          <motion.header 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-8"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                <CheckCircle size={12} className="text-blue-400" />
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Verified Identity</span>
              </div>
              <h2 className="text-6xl font-black tracking-tight leading-none uppercase">
                {user?.user_metadata?.full_name || 'Rohit Saha'}
              </h2>
              <div className="flex items-center gap-4 text-gray-400 font-medium">
                <span className="flex items-center gap-2 hover:text-white transition-colors cursor-default">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> 
                  Currently Building @ Adobe
                </span>
                <span className="w-1 h-1 bg-gray-700 rounded-full" />
                <span className="hover:text-white transition-colors cursor-default">Navi Mumbai, IN</span>
              </div>
            </div>
            
            <button className="bg-white text-black px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all transform active:scale-95 shadow-xl shadow-white/5">
              <Plus size={18} className="inline mr-2" /> Create Proof
            </button>
          </motion.header>

          {/* Proof of Work Grid */}
          <section className="space-y-8">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.4em]">Active Reputations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <WorkCard 
                icon={<Cpu className="text-blue-400" />} 
                title="Obstacle Avoiding Robot" 
                tag="Robotics" 
                status="Verified"
                desc="Autonomous navigation system built with Arduino, ultrasonic sensors, and L298N driver." 
              />
              <WorkCard 
                icon={<Palette className="text-purple-400" />} 
                title="Watercolor Collection" 
                tag="Fine Art" 
                status="Live"
                desc="Exploring atmospheric perspective and wet-on-wet techniques in landscape painting." 
              />
              <WorkCard 
                icon={<Box className="text-green-400" />} 
                title="Vouch Protocol" 
                tag="Web3/SaaS" 
                status="In Progress"
                desc="Redefining the resume with a decentralized, proof-based reputation ecosystem." 
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function WorkCard({ icon, title, tag, desc, status }: any) {
  return (
    <motion.div 
      whileHover={{ y: -8, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
      className="bg-white/[0.03] border border-white/10 p-8 rounded-[2rem] backdrop-blur-md group relative overflow-hidden transition-all duration-300 hover:border-blue-500/30"
    >
      <div className="relative z-10">
        <div className="mb-6 p-4 bg-white/5 w-fit rounded-2xl group-hover:bg-blue-500/20 transition-colors duration-300">
          {icon}
        </div>
        <div className="flex justify-between items-start mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500/80">{tag}</p>
          <span className="text-[10px] font-bold text-gray-500 uppercase">{status}</span>
        </div>
        <h3 className="text-2xl font-bold mb-4 flex items-center justify-between group-hover:text-blue-400 transition-colors">
          {title} <ExternalLink size={18} className="opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0" />
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed font-medium">{desc}</p>
      </div>
      {/* Decorative gradient inside card */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  )
}
