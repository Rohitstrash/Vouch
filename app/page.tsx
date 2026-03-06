'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, LogOut, ExternalLink, Box, Palette, Cpu, Plus } from 'lucide-react'
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
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="text-blue-500 font-black text-4xl italic"
      >
        VOUCH
      </motion.div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-blue-500/30">
      {/* Dynamic Background Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] -right-[10%] w-[30%] h-[30%] bg-purple-900/10 blur-[100px] rounded-full" />
      </div>

      <nav className="relative z-10 flex justify-between items-center p-6 border-b border-white/5 backdrop-blur-md bg-black/20">
        <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">VOUCH</h1>
        {user && (
          <form action={signOut}>
            <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
              <LogOut size={14} /> Logout
            </button>
          </form>
        )}
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {!user ? (
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center text-center py-20"
          >
            <h2 className="text-6xl md:text-8xl font-black mb-6 leading-none tracking-tight">
              PROOF OF <span className="text-blue-500">WORK</span>.
            </h2>
            <p className="text-gray-400 max-w-lg text-lg mb-12">
              The world's first dynamic reputation protocol. Build your legacy, not your resume.
            </p>
            <button 
              onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
              className="group relative flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full font-bold text-lg hover:scale-105 transition-all active:scale-95"
            >
              <Github /> Continue with GitHub
            </button>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {/* Profile Header */}
            <motion.header 
              initial={{ x: -20, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }}
              className="flex flex-col md:flex-row md:items-end justify-between gap-6"
            >
              <div>
                <p className="text-blue-500 font-mono text-sm mb-2 uppercase tracking-[0.3em]">Verified Builder</p>
                <h2 className="text-5xl font-black truncate max-w-md">{user.user_metadata.full_name || 'ROHIT SAHA'}</h2>
                <p className="text-gray-500 mt-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> 
                  Currently building Vouch @ Adobe
                </p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
                <Plus size={18} /> New Proof
              </button>
            </motion.header>

            {/* Proof of Work Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <WorkCard 
                icon={<Cpu className="text-blue-400" />} 
                title="Obstacle Avoiding Robot" 
                tag="Robotics" 
                desc="Arduino-powered autonomous bot with ultrasonic sensors." 
              />
              <WorkCard 
                icon={<Palette className="text-purple-400" />} 
                title="Watercolor Series" 
                tag="Art" 
                desc="Experimental wet-on-wet watercolor landscapes." 
              />
              <WorkCard 
                icon={<Box className="text-green-400" />} 
                title="Vouch Protocol" 
                tag="Software" 
                desc="Next.js + Supabase Proof-of-Work ecosystem." 
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

function WorkCard({ icon, title, tag, desc }: any) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm group cursor-pointer hover:border-blue-500/50 transition-all"
    >
      <div className="mb-4 p-3 bg-white/5 w-fit rounded-2xl group-hover:bg-blue-500/10 transition-colors">
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1">{tag}</p>
      <h3 className="text-xl font-bold mb-2 flex items-center justify-between">
        {title} <ExternalLink size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </motion.div>
  )
}
