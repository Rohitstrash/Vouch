'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, LogOut, ExternalLink, Plus, CheckCircle, Zap, MapPin, Figma, Linkedin, Gitlab, ShieldCheck } from 'lucide-react'
import { signOut } from './actions'

export default function VouchProSocial() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('GITHUB')
  const [projects, setProjects] = useState<any[]>([])
  const [vouchedProjects, setVouchedProjects] = useState<Set<number>>(new Set())

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function getUserData() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setUser(session.user)
          if (session.provider_token) fetchGitHubRepos(session.provider_token)
        }
      } finally { setLoading(false) }
    }
    getUserData()
  }, [supabase])

  const fetchGitHubRepos = async (token: string) => {
    try {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=6', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setProjects(data.map(repo => ({
          id: repo.id,
          title: repo.name.toUpperCase(),
          tag: (repo.language || 'Protocol').toUpperCase(),
          desc: repo.description || 'Verified via GitHub Sync',
          platform: 'GITHUB',
          vouches: Math.floor(Math.random() * 10), // Simulated initial vouches
          link: repo.html_url
        })))
      }
    } catch (e) { console.error(e) }
  }

  const handleVouch = (projectId: number) => {
    if (vouchedProjects.has(projectId)) return
    
    setVouchedProjects(new Set(vouchedProjects).add(projectId))
    setProjects(projects.map(p => 
      p.id === projectId ? { ...p, vouches: p.vouches + 1 } : p
    ))
  }

  // Calculate total reputation score
  const totalReputation = projects.reduce((acc, curr) => acc + (curr.vouches || 0), 0)

  if (loading) return <div className="h-screen bg-black flex items-center justify-center font-black text-blue-500 text-5xl italic animate-pulse">VOUCH</div>

  return (
    <main className="min-h-screen bg-[#020202] text-white font-sans selection:bg-blue-500/30">
      <nav className="flex justify-between items-center px-10 py-6 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <h1 className="text-xl font-black italic tracking-tighter text-blue-500">VOUCH</h1>
        {user && <form action={signOut}><button className="text-gray-500 hover:text-red-500 transition-colors"><LogOut size={18}/></button></form>}
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-16">
        {user ? (
          <div className="space-y-12">
            <header className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <img src={user.user_metadata.avatar_url} className="w-32 h-32 rounded-3xl border border-white/10" alt="Profile" />
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <CheckCircle size={10} className="text-blue-400" />
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic">Verified Identity</span>
                      </div>
                      {/* NEW REPUTATION COUNT BADGE */}
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <ShieldCheck size={10} className="text-green-400" />
                        <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">{totalReputation} REP SCORE</span>
                      </div>
                   </div>
                   <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">{user.user_metadata.full_name}</h2>
                   <p className="text-gray-500 font-medium italic">Building @ {user.user_metadata.company || 'Adobe'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all transform active:scale-95 shadow-xl shadow-white/5">
                <Plus size={16} /> New Proof
              </button>
            </header>

            {/* Reputation Tabs */}
            <section className="space-y-8">
               <div className="flex gap-8 border-b border-white/5 pb-1 overflow-x-auto no-scrollbar">
                {['GITHUB', 'FIGMA', 'LINKEDIN', 'GITLAB'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-[11px] font-black tracking-widest transition-all ${activeTab === tab ? 'text-white border-b-2 border-white' : 'text-gray-600 hover:text-gray-400'}`}>{tab}</button>
                ))}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <AnimatePresence mode='wait'>
                    {projects.filter(p => p.platform === activeTab).map((proj) => (
                      <WorkCard 
                        key={proj.id} 
                        {...proj} 
                        hasVouched={vouchedProjects.has(proj.id)}
                        onVouch={() => handleVouch(proj.id)}
                      />
                    ))}
                  </AnimatePresence>
               </div>
            </section>
          </div>
        ) : (
          <div className="py-40 text-center">
             <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })} className="bg-white text-black px-12 py-5 rounded-full font-black text-xl">Enter Network</button>
          </div>
        )}
      </div>
    </main>
  )
}

function WorkCard({ title, tag, desc, link, vouches, hasVouched, onVouch }: any) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-2xl group relative flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic">{tag}</p>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-gray-500 uppercase">{vouches} Vouches</span>
             {link && <a href={link} target="_blank" className="text-gray-500 hover:text-white"><ExternalLink size={14}/></a>}
          </div>
        </div>
        <h4 className="text-2xl font-black mb-4 italic uppercase tracking-tighter leading-tight">{title}</h4>
        <p className="text-sm text-gray-500 leading-relaxed font-medium line-clamp-3 mb-8">{desc}</p>
      </div>
      
      {/* VOUCH BUTTON */}
      <button 
        onClick={onVouch}
        disabled={hasVouched}
        className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
          hasVouched 
          ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default' 
          : 'bg-white text-black hover:bg-blue-600 hover:text-white'
        }`}
      >
        {hasVouched ? '✓ Vouched' : 'Vouch for Project'}
      </button>
    </motion.div>
  )
}