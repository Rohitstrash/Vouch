'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, LogOut, ExternalLink, Globe, Plus, CheckCircle, RefreshCw, Zap, MapPin, Figma, Linkedin, Gitlab, X, Edit3, Heart, ShieldCheck, Lock } from 'lucide-react'
import { signOut } from './actions'

type Platform = 'github' | 'figma' | 'linkedin' | 'gitlab'

export default function VouchSecureSocial() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [activePlatform, setActivePlatform] = useState<Platform>('github')

  // PROFILE & REPUTATION STATES
  const [displayName, setDisplayName] = useState('')
  const [displayBio, setDisplayBio] = useState('Building the future of reputation.')
  const [projects, setProjects] = useState<any[]>([])
  
  // THE VOUCH LOCK STATE (Stores IDs of projects this user has vouched for)
  const [vouchedProjectIds, setVouchedProjectIds] = useState<number[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function getUserData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        setDisplayName(session.user.user_metadata.full_name || session.user.user_metadata.user_name)
        
        // Load existing vouches from local storage for this specific user
        const savedVouches = localStorage.getItem(`vouch_lock_${session.user.id}`)
        if (savedVouches) setVouchedProjectIds(JSON.parse(savedVouches))
        
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
        const githubData = data.map(repo => ({
          id: repo.id,
          platform: 'github',
          title: repo.name,
          tag: repo.language || 'Protocol',
          desc: repo.description || 'Verified via GitHub Sync',
          link: repo.html_url,
          vouchCount: Math.floor(Math.random() * 20) + 5 // Simulated initial score
        }))
        setProjects(prev => [...githubData, ...prev.filter(p => p.platform !== 'github')])
      }
    } catch (e) { console.error(e) } finally { setIsSyncing(false) }
  }

  // --- SECURE VOUCH HANDLER ---
  const handleVouch = (id: number) => {
    // 1. Check if user already vouched for this project
    if (vouchedProjectIds.includes(id)) return;

    // 2. Update project count
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, vouchCount: (p.vouchCount || 0) + 1 } : p
    ))

    // 3. Lock the vouch for this user
    const newVouches = [...vouchedProjectIds, id]
    setVouchedProjectIds(newVouches)
    
    // 4. Persist to local storage
    if (user) {
      localStorage.setItem(`vouch_lock_${user.id}`, JSON.stringify(newVouches))
    }
  }

  const totalReputation = projects.reduce((acc, curr) => acc + (curr.vouchCount || 0), 0)

  // --- OTHER HANDLERS ---
  const handleNewProof = (e: any) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const newEntry = {
      id: Date.now(),
      platform: activePlatform,
      title: formData.get('title'),
      tag: formData.get('tag'),
      desc: formData.get('desc'),
      link: '#',
      vouchCount: 0
    }
    setProjects([newEntry, ...projects])
    setIsModalOpen(false)
  }

  const handleUpdateProfile = (e: any) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    setDisplayName(formData.get('name') as string)
    setDisplayBio(formData.get('bio') as string)
    setIsEditOpen(false)
  }

  if (loading) return <div className="h-screen bg-black flex items-center justify-center font-black text-blue-500 text-4xl italic animate-pulse">VOUCH</div>

  return (
    <main className="min-h-screen bg-[#020202] text-white selection:bg-blue-600/30 font-sans overflow-x-hidden">
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-white/5 backdrop-blur-xl bg-black/40 sticky top-0">
        <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">VOUCH</h1>
        {user && (
          <div className="flex items-center gap-6">
             <button onClick={() => fetchGitHubRepos(user.provider_token)} className="text-gray-500 hover:text-white">
               <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
             </button>
             <form action={signOut}><button className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-400"><LogOut size={16} /></button></form>
          </div>
        )}
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {user && (
          <div className="space-y-16">
            <motion.header initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                  <img src={user.user_metadata.avatar_url} className="w-32 h-32 rounded-[2.5rem] border-2 border-blue-500/20 shadow-2xl shadow-blue-500/10" alt="Identity" />
                  <button onClick={() => setIsEditOpen(true)} className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl border-4 border-[#020202] hover:scale-110 transition-all">
                    <Edit3 size={16} />
                  </button>
                </div>
                <div className="text-center md:text-left space-y-4">
                   <div className="flex flex-wrap justify-center md:justify-start gap-3">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                       <ShieldCheck size={12} className="text-blue-400" />
                       <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest leading-none">Verified Identity</span>
                     </div>
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                       <Zap size={12} className="text-purple-400" />
                       <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest leading-none">Rep Score: {totalReputation}</span>
                     </div>
                   </div>
                   <h2 className="text-6xl font-black tracking-tighter uppercase leading-none italic">{displayName}</h2>
                   <p className="text-gray-500 font-medium max-w-md">{displayBio}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all transform active:scale-95 shadow-xl shadow-white/5">
                <Plus size={16} /> New Proof
              </button>
            </motion.header>

            <section className="space-y-10">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-6 italic">Network Reputation</h3>
                <div className="flex gap-10 overflow-x-auto no-scrollbar">
                  <PlatformTab active={activePlatform === 'github'} icon={<Github size={20}/>} label="GitHub" onClick={() => setActivePlatform('github')} />
                  <PlatformTab active={activePlatform === 'figma'} icon={<Figma size={20}/>} label="Figma" onClick={() => setActivePlatform('figma')} />
                  <PlatformTab active={activePlatform === 'linkedin'} icon={<Linkedin size={20}/>} label="LinkedIn" onClick={() => setActivePlatform('linkedin')} />
                  <PlatformTab active={activePlatform === 'gitlab'} icon={<Gitlab size={20}/>} label="GitLab" onClick={() => setActivePlatform('gitlab')} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {projects.filter(p => p.platform === activePlatform).length > 0 ? (
                    projects.filter(p => p.platform === activePlatform).map((proj) => (
                      <WorkCard 
                        key={proj.id} 
                        {...proj} 
                        onVouch={() => handleVouch(proj.id)} 
                        hasVouched={vouchedProjectIds.includes(proj.id)}
                      />
                    ))
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-3 py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                      <p className="text-gray-600 font-bold tracking-widest uppercase text-xs italic">Awaiting Synchronisation...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-[#0A0A0A] border border-white/10 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl">
               <h3 className="text-2xl font-black mb-8 italic uppercase tracking-tighter">Add {activePlatform} Proof</h3>
               <form onSubmit={handleNewProof} className="space-y-6">
                  <input name="title" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 transition-all" placeholder="Project Title" />
                  <input name="tag" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500 transition-all" placeholder="Category (e.g. Fine Art)" />
                  <textarea name="desc" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none h-32" placeholder="Tell the network what you built..." />
                  <button type="submit" className="w-full bg-blue-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all">Publish to Network</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="relative bg-[#0A0A0A] border-l border-white/10 w-full max-w-md h-full p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-12">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Edit Identity</h3>
                <button onClick={() => setIsEditOpen(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Protocol Name</label>
                  <input name="name" defaultValue={displayName} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Network Bio</label>
                  <textarea name="bio" defaultValue={displayBio} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none h-32" />
                </div>
                <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Update Identity</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}

function PlatformTab({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 pb-4 border-b-2 transition-all shrink-0 ${active ? 'border-blue-500 text-white' : 'border-transparent text-gray-600 hover:text-gray-400'}`}>
      {icon}
      <span className="text-xs font-black uppercase tracking-widest italic">{label}</span>
    </button>
  )
}

function WorkCard({ title, tag, desc, link, platform, vouchCount, onVouch, hasVouched }: any) {
  const Icon = platform === 'github' ? Github : platform === 'figma' ? Figma : platform === 'linkedin' ? Linkedin : Gitlab;
  
  return (
    <motion.div layout initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white/[0.02] border border-white/10 p-10 rounded-[3.5rem] backdrop-blur-3xl group flex flex-col transition-all duration-500 hover:border-blue-500/30">
      <div className="flex justify-between items-start mb-10">
        <div className="p-4 bg-white/5 w-fit rounded-[1.2rem] group-hover:bg-blue-600/20 transition-colors duration-500"><Icon size={24} className="text-blue-400"/></div>
        {link && link !== '#' && <a href={link} target="_blank" className="p-2 text-gray-600 hover:text-white transition-colors"><ExternalLink size={18}/></a>}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic mb-2 tracking-[0.2em]">{tag}</p>
      <h4 className="text-2xl font-bold mb-4 italic uppercase tracking-tighter group-hover:text-blue-400 transition-colors">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed font-medium line-clamp-3 mb-10">{desc}</p>
      
      <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Heart size={14} className={hasVouched ? "text-blue-500 fill-blue-500" : "text-gray-600"} />
          <span className={`text-[11px] font-black italic tracking-widest ${hasVouched ? 'text-blue-500' : 'text-gray-400'}`}>
            {vouchCount} {vouchCount === 1 ? 'VOUCH' : 'VOUCHES'}
          </span>
        </div>
        
        <button 
          onClick={onVouch}
          disabled={hasVouched}
          className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all transform active:scale-95 flex items-center gap-2 ${
            hasVouched 
              ? 'bg-blue-500/10 text-blue-500/50 cursor-not-allowed border border-blue-500/20' 
              : 'bg-white text-black hover:bg-blue-600 hover:text-white'
          }`}
        >
          {hasVouched ? <><Lock size={10}/> Vouched</> : 'Vouch'}
        </button>
      </div>
    </motion.div>
  )
}