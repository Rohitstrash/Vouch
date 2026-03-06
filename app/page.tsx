'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, LogOut, ExternalLink, Globe, Plus, CheckCircle, X, RefreshCw, Zap, MapPin, Briefcase } from 'lucide-react'
import { signOut } from './actions'

export default function VouchUniversal() {
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
  }, [supabase])

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
          tag: repo.language || 'Project',
          desc: repo.description || 'Verified via GitHub Sync',
          status: "Synced",
          icon: <Globe className="text-blue-500" />,
          link: repo.html_url
        })))
      }
    } catch (e) {
      console.error("Sync failed", e)
    } finally { setIsSyncing(false) }
  }

  const handleLogin = () => supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { 
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'repo read:user',
        queryParams: { access_type: 'offline', prompt: 'consent' }
    }
  })

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-blue-500 font-black italic text-4xl">VOUCH</motion.div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#020202] text-white selection:bg-blue-600/30 font-sans overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600 blur-[100px] rounded-full" />
      </div>

      <nav className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-white/5 backdrop-blur-xl bg-black/40 sticky top-0">
        <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">VOUCH</h1>
        {user ? (
          <div className="flex items-center gap-6">
             <button onClick={() => {
                supabase.auth.getSession().then(({data}) => {
                  if (data.session?.provider_token) fetchGitHubRepos(data.session.provider_token)
                })
             }} className="text-gray-500 hover:text-white transition-colors">
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
          <div className="py-40 text-center space-y-10">
            <h2 className="text-7xl md:text-9xl font-black tracking-tighter uppercase italic leading-none">
              Build your <span className="text-blue-600">Legacy.</span>
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto text-lg font-medium">The high-class protocol for verifying your real-world proof of work.</p>
            <button onClick={handleLogin} className="bg-white text-black px-12 py-5 rounded-full font-black text-xl hover:bg-blue-600 hover:text-white transition-all shadow-2xl shadow-blue-500/20">
              <Github className="inline mr-2" /> Connect GitHub
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            <motion.header initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <img 
                  src={user.user_metadata.avatar_url} 
                  className="w-32 h-32 rounded-[2.5rem] border-2 border-blue-500/20 shadow-2xl shadow-blue-500/10" 
                  alt="Identity" 
                />
                <div className="text-center md:text-left space-y-3">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                     <CheckCircle size={10} className="text-blue-400" />
                     <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Verified Identity</span>
                   </div>
                   {/* DYNAMIC NAME FROM GITHUB */}
                   <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">
                     {user.user_metadata.full_name || user.user_metadata.user_name}
                   </h2>
                   {/* DYNAMIC BIO & LOCATION */}
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-500 font-medium text-sm">
                      <span className="flex items-center gap-1.5"><MapPin size={14}/> {user.user_metadata.location || "Global"}</span>
                      {user.user_metadata.user_name && <span className="flex items-center gap-1.5 text-blue-500/80">@{user.user_metadata.user_name}</span>}
                   </div>
                </div>
              </div>
              <button className="bg-blue-600 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 transition-all transform active:scale-95 shadow-xl shadow-blue-600/20">
                <Zap size={16} /> New Proof
              </button>
            </motion.header>

            <section className="space-y-10">
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.5em] italic">Network Reputation</h3>
                <span className="px-3 py-1 rounded-md bg-white/5 text-[10px] font-bold text-gray-400">{projects.length} RECORDS FOUND</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {projects.map((proj) => <WorkCard key={proj.id} {...proj} />)}
                {projects.length === 0 && (
                  <div className="col-span-3 py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                    <p className="text-gray-600 font-bold tracking-widest uppercase text-xs italic">Awaiting Synchronisation...</p>
                  </div>
                )}
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
    <motion.div whileHover={{ y: -10 }} className="bg-white/[0.02] border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl group relative overflow-hidden transition-all duration-500 hover:border-blue-500/40">
      <div className="mb-8 p-4 bg-white/5 w-fit rounded-2xl group-hover:bg-blue-500/20 transition-colors duration-500">{icon}</div>
      <div className="flex justify-between items-start mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic">{tag}</p>
        {link && <a href={link} target="_blank" className="text-gray-500 hover:text-white transition-colors"><ExternalLink size={16}/></a>}
      </div>
      <h4 className="text-2xl font-bold mb-4 italic uppercase tracking-tighter group-hover:text-blue-400 transition-colors">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed font-medium line-clamp-3">{desc}</p>
    </motion.div>
  )
}
