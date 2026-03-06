'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { Github, LogOut, ExternalLink, Globe, Plus, CheckCircle, RefreshCw, Zap, MapPin, Figma, Linkedin, Gitlab, X, Edit3, Heart, ShieldCheck, Search, Bell } from 'lucide-react'
import { signOut } from './actions'

type Platform = 'github' | 'figma' | 'linkedin' | 'gitlab'

export default function VouchBeautified() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [activePlatform, setActivePlatform] = useState<Platform>('github')

  // PROFILE & DATA STATES
  const [displayName, setDisplayName] = useState('')
  const [displayBio, setDisplayBio] = useState('Building the future of reputation.')
  const [projects, setProjects] = useState<any[]>([])
  const [vouchedIds, setVouchedIds] = useState<number[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        setDisplayName(session.user.user_metadata?.full_name || session.user.user_metadata?.user_name || 'New Builder')
        if (session.provider_token) fetchGitHubRepos(session.provider_token)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const fetchGitHubRepos = async (token: string) => {
    setIsSyncing(true)
    try {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=6', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        const githubData = data.map(repo => ({
          id: repo.id,
          platform: 'github',
          title: repo.name,
          tag: repo.language || 'Protocol',
          desc: repo.description || 'Verified via GitHub Sync',
          link: repo.html_url,
          vouchCount: Math.floor(Math.random() * 50)
        }))
        setProjects(prev => [...githubData, ...prev.filter(p => p.platform !== 'github')])
      }
    } catch (e) { console.error(e) } finally { setIsSyncing(false) }
  }

  const handleVouch = (id: number) => {
    if (vouchedIds.includes(id)) return
    setVouchedIds(prev => [...prev, id])
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, vouchCount: (p.vouchCount || 0) + 1 } : p
    ))
  }

  const totalReputation = projects.reduce((acc, curr) => acc + (curr.vouchCount || 0), 0)

  const handleUpdateProfile = (e: any) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    setDisplayName(formData.get('name') as string)
    setDisplayBio(formData.get('bio') as string)
    setIsEditOpen(false)
  }

  // Mouse Glow Effect State
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const cardX = useSpring(mouseX, { stiffness: 300, damping: 20 })
  const cardY = useSpring(mouseY, { stiffness: 300, damping: 20 })

  function handleMouseMove({ currentTarget, clientX, clientY }: any) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center font-black text-blue-500 text-5xl italic animate-pulse">VOUCH</div>
  )

  return (
    <main className="min-h-screen bg-[#020202] text-white font-sans selection:bg-blue-600/30 overflow-x-hidden relative">
      {/* Sophisticated Background Radial Pulse */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute top-[-20%] left-[-20%] w-[1200px] h-[1200px] bg-blue-600 blur-[300px] rounded-full" />
         <div className="absolute bottom-[-20%] right-[-20%] w-[1000px] h-[1000px] bg-purple-600 blur-[300px] rounded-full opacity-30" />
      </div>

      <nav className="relative z-10 flex justify-between items-center px-10 py-6 border-b border-white/5 backdrop-blur-xl bg-black/40 sticky top-0">
        <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">VOUCH</h1>
        {user && (
          <div className="flex items-center gap-6 text-gray-400">
             <div className="relative group">
                <Search size={18} className="absolute left-3 top-3 group-hover:text-white transition-colors"/>
                <input placeholder="Search Builders" className="bg-white/5 border border-white/10 rounded-xl px-12 py-2.5 w-72 focus:outline-none focus:border-blue-500 transition-colors"/>
             </div>
             <button onClick={() => fetchGitHubRepos(user.provider_token)} className="hover:text-white transition-all">
               <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
             </button>
             <button className="hover:text-white transition-all"><Bell size={18}/></button>
             <form action={signOut}><button className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-400"><LogOut size={16} /></button></form>
          </div>
        )}
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-10 py-16">
        {user ? (
          <div className="space-y-20">
            {/* PROFILE HEADER - LEFT ALIGNED */}
            <motion.header initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col md:flex-row items-start justify-between gap-10">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
                <div className="relative group">
                  <img src={user.user_metadata.avatar_url} className="w-40 h-40 rounded-[2.5rem] border border-white/10 shadow-2xl transition-all group-hover:border-blue-500/30" alt="Identity" />
                  <motion.button initial={{opacity: 0}} whileHover={{opacity: 1}} onClick={() => setIsEditOpen(true)} className="absolute -bottom-2 -right-2 bg-blue-600 p-3 rounded-2xl border-4 border-[#020202] hover:scale-110 transition-all shadow-xl">
                    <Edit3 size={18} />
                  </motion.button>
                </div>
                <div className="text-center md:text-left space-y-5">
                   <div className="flex flex-wrap justify-center md:justify-start gap-4">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                       <ShieldCheck size={12} className="text-blue-400" />
                       <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic">Verified Identity</span>
                     </div>
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                       <Zap size={12} className="text-purple-400" />
                       <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Rep Score: {totalReputation}</span>
                     </div>
                     <p className="text-gray-500 font-medium text-xs flex items-center gap-2 justify-center md:justify-start"><MapPin size={12}/> Navi Mumbai, IN</p>
                   </div>
                   {/* UNIVERSAL Bold Italic Brand Name */}
                   <h2 className="text-7xl font-black tracking-tighter uppercase leading-none italic text-blue-50">{displayName}</h2>
                   <p className="text-gray-400 font-medium max-w-lg leading-relaxed">{displayBio}</p>
                </div>
              </div>
              {/* HEAVY Premium Button */}
              <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5 group relative overflow-hidden">
                <Plus size={18} /> New Proof
                <span className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity blur-[10px] scale-150"></span>
              </button>
            </motion.header>

            {/* PLATFORM TABS */}
            <div className="space-y-6">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.5em] italic">Active Reputations</h3>
                <div className="flex gap-10 border-b border-white/5 overflow-x-auto no-scrollbar relative">
                {(['github', 'figma', 'linkedin', 'gitlab'] as Platform[]).map((p) => (
                    <button 
                    key={p} 
                    onClick={() => setActivePlatform(p)}
                    className={`pb-5 text-xs font-bold uppercase tracking-[0.1em] transition-all relative ${activePlatform === p ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                    {p}
                    {activePlatform === p && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full"/>}
                    </button>
                ))}
                </div>
            </div>

            {/* PROJECT GRID - Larger Gap */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <AnimatePresence mode="popLayout">
                {projects.filter(p => p.platform === activePlatform).length > 0 ? (
                  projects.filter(p => p.platform === activePlatform).map((proj) => (
                    <WorkCard 
                      key={proj.id} 
                      {...proj} 
                      onVouch={() => handleVouch(proj.id)} 
                      vouched={vouchedIds.includes(proj.id)}
                    />
                  ))
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-3 py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                    <p className="text-gray-600 font-bold uppercase tracking-widest text-xs italic">Awaiting Synchronisation...</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="py-40 text-center">
             <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })} className="bg-white text-black px-12 py-5 rounded-full font-black text-xl shadow-2xl shadow-blue-500/20">Sign in with GitHub</button>
          </div>
        )}
      </div>

      {/* DRAWER: EDIT IDENTITY */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="relative bg-[#0A0A0A] border-l border-white/10 w-full max-w-md h-full p-12 shadow-2xl flex flex-col">
              <div className="flex justify-between items-center mb-16">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Edit Identity</h3>
                <button onClick={() => setIsEditOpen(false)} className="text-gray-500 hover:text-white transition-colors"><X size={28}/></button>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-10 flex-grow">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Display Name</label>
                  <input name="name" defaultValue={displayName} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 transition-colors text-lg" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Bio / Motto</label>
                  <textarea name="bio" defaultValue={displayBio} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none h-32 resize-none focus:border-blue-500 transition-colors text-gray-300leading-relaxed" />
                </div>
                <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all transform active:scale-95 shadow-xl shadow-white/5 mt-auto">Update Protocol</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}

function WorkCard({ title, tag, desc, link, platform, vouchCount, onVouch, vouched }: any) {
  const Icon = platform === 'github' ? Github : platform === 'figma' ? Figma : platform === 'linkedin' ? Linkedin : Gitlab;
  
  // Mouse Glow Effect State
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const glowX = useSpring(mouseX, { stiffness: 300, damping: 20 })
  const glowY = useSpring(mouseY, { stiffness: 300, damping: 20 })

  function handleMouseMove({ currentTarget, clientX, clientY }: any) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <motion.div 
        layout 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        whileHover={{ y: -10 }} 
        className="bg-white/[0.02] border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl group flex flex-col transition-all duration-500 hover:border-blue-500/40 relative overflow-hidden"
        onMouseMove={handleMouseMove}
    >
      {/* Subtle Mouse Following Radial Accent */}
      <motion.div style={{ x: glowX, y: glowY }} className="absolute -inset-20 bg-blue-600/10 blur-[50px] rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></motion.div>

      <div className="relative z-10 space-y-10 flex flex-col h-full">
        <div className="flex justify-between items-start">
            <div className="p-4 bg-white/5 w-fit rounded-2xl group-hover:bg-blue-600/20 transition-colors duration-500"><Icon size={24} className="text-blue-400"/></div>
            {link && link !== '#' && <a href={link} target="_blank" className="p-2 text-gray-600 hover:text-white transition-colors"><ExternalLink size={18}/></a>}
        </div>
        
        <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic mb-2">{tag}</p>
            <h4 className="text-2xl font-black mb-4 italic uppercase tracking-tighter group-hover:text-blue-200 transition-colors leading-tight">{title}</h4>
            <p className="text-sm text-gray-400 leading-relaxed font-medium line-clamp-3 mb-10">{desc}</p>
        </div>
        
        {/* VOUCH SYSTEM UI */}
        <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
            <div className="flex items-center gap-2">
            <Heart size={14} className={`transition-colors ${vouched ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
            <span className="text-xs font-black italic">{vouchCount} Vouches</span>
            </div>
            <button 
            onClick={onVouch}
            disabled={vouched}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                vouched 
                ? 'bg-green-500/10 text-green-500 cursor-default' 
                : 'bg-white/5 hover:bg-blue-600 hover:text-white hover:scale-105 active:scale-95'
            }`}
            >
            {vouched ? '✓ Vouched' : 'Vouch'}
            </button>
        </div>
        
        {/* Simplified Verified Label */}
        <div className="absolute bottom-6 right-10 text-[9px] font-black text-gray-600 uppercase tracking-widest italic flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-1 h-1 bg-green-500 rounded-full"/> Verified Connection
        </div>
      </div>
    </motion.div>
  )
}
