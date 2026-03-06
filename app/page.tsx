'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, LogOut, ExternalLink, Globe, Plus, CheckCircle, X, RefreshCw, User, Zap } from 'lucide-react'
import { signOut } from './actions'

export default function VouchDynamic() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [projects, setProjects] = useState<any[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function getUserData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        if (session.provider_token) fetchGitHubRepos(session.provider_token)
      }
      setLoading(false)
    }
    getUserData()
  }, [])

  const fetchGitHubRepos = async (token: string) => {
    setIsSyncing(true)
    try {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=6', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setProjects(data.map(repo => ({
          id: repo.id,
          title: repo.name,
          tag: repo.language || 'Protocol',
          desc: repo.description || 'Verified Proof of Work',
          status: "Synced",
          icon: <Globe className="text-blue-500" />,
          link: repo.html_url
        })))
      }
    } finally { setIsSyncing(false) }
  }

  const handleLogin = () => supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { 
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'repo read:user' 
    }
  })

  if (loading) return <div className="h-screen bg-black flex items-center justify-center font-black text-blue-500 text-5xl animate-pulse">VOUCH</div>

  return (
    <main className="min-h-screen bg-[#020202] text-white selection:bg-blue-500/30 overflow-x-hidden font-sans">
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-white/5 backdrop-blur-xl bg-black/40 sticky top-0">
        <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">VOUCH</h1>
        {user ? (
          <div className="flex items-center gap-4">
             <button onClick={handleLogin} className="text-gray-500 hover:text-white transition-colors">
               <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
             </button>
             <form action={signOut}><button className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-400"><LogOut size={16} /></button></form>
          </div>
        ) : (
          <button onClick={handleLogin} className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm">Sign In</button>
        )}
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {!user ? (
          <div className="py-40 text-center space-y-8">
            <h2 className="text-7xl font-black tracking-tighter uppercase italic">Proof of <span className="text-blue-600">Work.</span></h2>
            <p className="text-gray-500 max-w-lg mx-auto font-medium">The world's first dynamic reputation protocol for builders, artists, and engineers.</p>
            <button onClick={handleLogin} className="bg-white text-black px-12 py-5 rounded-full font-black text-lg hover:bg-blue-500 hover:text-white transition-all shadow-2xl shadow-blue-500/20">
              <Github className="inline mr-2" /> Start Building
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            <motion.header initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="flex items-center gap-6">
                <img src={user.user_metadata.avatar_url} className="w-24 h-24 rounded-[2rem] border-2 border-blue-500/20 shadow-2xl" alt="Profile" />
                <div className="space-y-2">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                     <CheckCircle size={10} className="text-blue-400" />
                     <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Verified Builder</span>
                   </div>
                   <h2 className="text-5xl font-black tracking-tighter uppercase">{user.user_metadata.full_name || user.user_metadata.user_name}</h2>
                   <p className="text-gray-500 font-medium flex items-center gap-2">@{user.user_metadata.user_name} • Navi Mumbai, IN</p>
                </div>
              </div>
              <button className="bg-blue-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 transition-all">
                <Zap size={16} /> New Proof
              </button>
            </motion.header>

            <section className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em] italic">Active Reputations</h3>
                <span className="text-xs text-blue-500 font-bold">{projects.length} PROJECTS SYNCED</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {projects.map((proj) => <WorkCard key={proj.id} {...proj} />)}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}

function WorkCard({ icon, title, tag, desc, status, link }: any) {
  return (
    <motion.div whileHover={{ y: -8 }} className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-md group relative overflow-hidden transition-all duration-300">
      <div className="mb-6 p-4 bg-white/5 w-fit rounded-2xl group-hover:bg-blue-500/20 transition-colors">{icon}</div>
      <div className="flex justify-between items-start mb-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/80 italic">{tag}</p>
        {link && <a href={link} target="_blank" className="text-gray-500 hover:text-white transition-colors"><ExternalLink size={14}/></a>}
      </div>
      <h3 className="text-2xl font-bold mb-4 italic uppercase tracking-tighter">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed font-medium line-clamp-2">{desc}</p>
    </motion.div>
  )
}
