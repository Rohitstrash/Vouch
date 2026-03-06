'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, LogOut, ExternalLink, Globe, Plus, CheckCircle, X, RefreshCw, Zap, MapPin, Figma, Linkedin, Gitlab } from 'lucide-react'
import { signOut } from './actions'

type Platform = 'github' | 'figma' | 'linkedin' | 'gitlab'

export default function VouchMultiverse() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [activePlatform, setActivePlatform] = useState<Platform>('github')

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
          platform: 'github',
          title: repo.name,
          tag: repo.language || 'Protocol',
          desc: repo.description || 'Verified via GitHub Sync',
          link: repo.html_url
        })))
      }
    } catch (e) { console.error(e) } finally { setIsSyncing(false) }
  }

  const handleLogin = () => supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: `${window.location.origin}/auth/callback`, scopes: 'repo read:user' }
  })

  if (loading) return <div className="h-screen bg-black flex items-center justify-center font-black text-blue-500 text-4xl italic animate-pulse transition-all">VOUCH</div>

  return (
    <main className="min-h-screen bg-[#020202] text-white selection:bg-blue-600/30 font-sans overflow-x-hidden">
      {/* Background Accents */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-purple-600 blur-[100px] rounded-full" />
      </div>

      <nav className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-white/5 backdrop-blur-xl bg-black/40 sticky top-0">
        <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">VOUCH</h1>
        {user ? (
          <div className="flex items-center gap-6">
             <button onClick={() => supabase.auth.getSession().then(({data}) => data.session?.provider_token && fetchGitHubRepos(data.session.provider_token))} className="text-gray-500 hover:text-white transition-colors">
               <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
             </button>
             <form action={signOut}><button className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-all"><LogOut size={16} /></button></form>
          </div>
        ) : (
          <button onClick={handleLogin} className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm">Sign In</button>
        )}
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {user ? (
          <div className="space-y-16">
            <motion.header initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <img src={user.user_metadata.avatar_url} className="w-32 h-32 rounded-[2.5rem] border-2 border-blue-500/20 shadow-2xl" alt="Identity" />
                <div className="text-center md:text-left space-y-3">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                     <CheckCircle size={10} className="text-blue-400" />
                     <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Verified Identity</span>
                   </div>
                   <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">{user.user_metadata.full_name || user.user_metadata.user_name}</h2>
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-500 font-medium text-sm">
                      <span className="flex items-center gap-1.5"><MapPin size={14}/> {user.user_metadata.location || "Global"}</span>
                      <span className="flex items-center gap-1.5 text-blue-500/80">@{user.user_metadata.user_name}</span>
                   </div>
                </div>
              </div>
              <button className="bg-blue-600 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 transition-all transform active:scale-95 shadow-xl shadow-blue-600/20">
                <Zap size={16} /> New Proof
              </button>
            </motion.header>

            {/* PLATFORM NAVIGATION SECTION */}
            <section className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-8 gap-6">
                <div className="flex gap-8 overflow-x-auto pb-2 scrollbar-hide">
                  <PlatformTab active={activePlatform === 'github'} icon={<Github size={18}/>} label="GitHub" onClick={() => setActivePlatform('github')} />
                  <PlatformTab active={activePlatform === 'figma'} icon={<Figma size={18}/>} label="Figma" onClick={() => setActivePlatform('figma')} />
                  <PlatformTab active={activePlatform === 'linkedin'} icon={<Linkedin size={18}/>} label="LinkedIn" onClick={() => setActivePlatform('linkedin')} />
                  <PlatformTab active={activePlatform === 'gitlab'} icon={<Gitlab size={18}/>} label="GitLab" onClick={() => setActivePlatform('gitlab')} />
                </div>
                <span className="px-3 py-1 rounded-md bg-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{activePlatform} NETWORK</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <AnimatePresence mode="wait">
                  {projects.filter(p => p.platform === activePlatform).length > 0 ? (
                    projects.filter(p => p.platform === activePlatform).map((proj) => (
                      <WorkCard key={proj.id} {...proj} />
                    ))
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-3 py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                      <p className="text-gray-600 font-bold tracking-widest uppercase text-xs italic">Awaiting Sync from {activePlatform}...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        ) : (
          <div className="py-40 text-center space-y-10">
            <h2 className="text-7xl md:text-9xl font-black tracking-tighter uppercase italic leading-none">Vouch for <span className="text-blue-600 text-shadow-glow">Work.</span></h2>
            <button onClick={handleLogin} className="bg-white text-black px-12 py-5 rounded-full font-black text-xl hover:bg-blue-600 hover:text-white transition-all">Connect GitHub</button>
          </div>
        )}
      </div>
    </main>
  )
}

function PlatformTab({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 pb-2 border-b-2 transition-all ${active ? 'border-blue-500 text-white' : 'border-transparent text-gray-600 hover:text-gray-400'}`}>
      {icon}
      <span className="text-xs font-black uppercase tracking-widest italic">{label}</span>
    </button>
  )
}

function WorkCard({ title, tag, desc, link, platform }: any) {
  const Icon = platform === 'github' ? Github : platform === 'figma' ? Figma : platform === 'linkedin' ? Linkedin : Gitlab;
  
  return (
    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} whileHover={{ y: -10 }} className="bg-white/[0.02] border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl group relative overflow-hidden transition-all duration-500 hover:border-blue-500/40">
      <div className="mb-8 p-4 bg-white/5 w-fit rounded-2xl group-hover:bg-blue-500/20 transition-colors duration-500"><Icon size={24} className="text-blue-400"/></div>
      <div className="flex justify-between items-start mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic">{tag}</p>
        {link && <a href={link} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors"><ExternalLink size={16}/></a>}
      </div>
      <h4 className="text-2xl font-bold mb-4 italic uppercase tracking-tighter group-hover:text-blue-400 transition-colors">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed font-medium line-clamp-3">{desc}</p>
    </motion.div>
  )
}