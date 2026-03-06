'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Github, LogOut, ExternalLink, Globe, Plus, CheckCircle, 
  RefreshCw, Zap, MapPin, Figma, Linkedin, Gitlab, X, 
  Edit3, Heart, ShieldCheck, Rocket, Share2, Chrome, Fingerprint 
} from 'lucide-react'
import { signOut } from './actions'

type Platform = 'github' | 'figma' | 'linkedin' | 'gitlab'

export default function VouchSocial() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [activePlatform, setActivePlatform] = useState<Platform>('github')

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

  const handleLogin = (provider: 'github' | 'google' = 'github') => {
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center font-black text-blue-500 text-5xl italic animate-pulse">VOUCH</div>
  )

  return (
    <main className="min-h-screen bg-[#020202] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {!user ? (
        /* CLEANED CYBER-PROTOCOL LOGIN PAGE */
        <div className="relative min-h-screen flex items-center justify-center px-6">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/20 blur-[150px] rounded-full animate-pulse" />
            <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/15 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          <div className="relative z-10 w-full max-w-[420px] py-12 flex flex-col items-center">
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center mb-12 text-center">
              <div className="relative mb-6">
                 <Share2 size={64} className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                 <div className="absolute inset-0 bg-cyan-400 blur-3xl opacity-20" />
              </div>
              <h1 className="text-6xl font-black italic tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent uppercase">VOUCH</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-400/80 mt-3 leading-relaxed">The Anti-Resume. <br/> Verify Your Skills.</p>
            </motion.div>

            {/* SIMPLIFIED LOGIN CARD (UNUSABLE INPUTS REMOVED) */}
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-10">
              
              <div className="text-center space-y-2">
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Protocol Entrance</p>
                 <h3 className="text-xl font-bold italic uppercase tracking-tighter">Ready for Launch?</h3>
              </div>

              <button 
                onClick={() => handleLogin('github')}
                className="w-full py-6 rounded-[1.5rem] bg-gradient-to-r from-cyan-400 to-purple-500 text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-cyan-500/20"
              >
                <Rocket size={20} /> Launch (Login)
              </button>

              <div className="text-center space-y-6 pt-2">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic flex items-center justify-center gap-2">
                   <div className="w-8 h-px bg-white/5"/> Or Continue With <div className="w-8 h-px bg-white/5"/>
                </span>
                <div className="flex justify-center gap-5">
                  <button onClick={() => handleLogin('github')} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"><Github size={22}/></button>
                  <button className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors opacity-40"><Figma size={22}/></button>
                  <button className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors opacity-40"><Chrome size={22}/></button>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-16 flex flex-col items-center space-y-8 text-center">
               <Fingerprint size={36} className="text-gray-700 animate-pulse" />
               <p className="text-[10px] font-bold text-gray-600 tracking-wide uppercase">
                 Don't have an account? <br/> <button className="text-cyan-400 underline underline-offset-8 mt-2">Join the Revolution.</button>
               </p>
            </motion.div>
          </div>
        </div>
      ) : (
        /* YOUR PERFECT DASHBOARD (UNTOUCHED) */
        <>
          <nav className="relative z-10 flex justify-between items-center px-10 py-6 border-b border-white/5 backdrop-blur-xl bg-black/40 sticky top-0">
            <h1 className="text-2xl font-black italic tracking-tighter text-blue-500 uppercase">VOUCH</h1>
            <div className="flex items-center gap-6">
               <button onClick={() => fetchGitHubRepos(user.provider_token)} className="text-gray-500 hover:text-white transition-all">
                 <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
               </button>
               <form action={signOut}><button className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-all"><LogOut size={16} /></button></form>
            </div>
          </nav>

          <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
            <div className="space-y-16">
              <motion.header initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="relative">
                    <img src={user.user_metadata.avatar_url} className="w-32 h-32 rounded-[2.5rem] border-2 border-blue-500/20 shadow-2xl" alt="Identity" />
                    <button onClick={() => setIsEditOpen(true)} className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl border-4 border-[#020202] hover:scale-110 transition-all"><Edit3 size={16} /></button>
                  </div>
                  <div className="text-center md:text-left space-y-4">
                     <div className="flex flex-wrap justify-center md:justify-start gap-3">
                       <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20"><ShieldCheck size={12} className="text-blue-400" /><span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Verified Identity</span></div>
                       <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20"><Zap size={12} className="text-purple-400" /><span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Rep Score: {totalReputation}</span></div>
                     </div>
                     <h2 className="text-6xl font-black tracking-tighter uppercase leading-none italic">{displayName}</h2>
                     <p className="text-gray-500 font-medium max-w-md">{displayBio}</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl shadow-white/5"><Plus size={16} /> New Proof</button>
              </motion.header>

              <div className="flex gap-8 border-b border-white/5 overflow-x-auto no-scrollbar">
                {(['github', 'figma', 'linkedin', 'gitlab'] as Platform[]).map((p) => (
                  <button key={p} onClick={() => setActivePlatform(p)} className={`pb-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all ${activePlatform === p ? 'text-white border-b-2 border-white' : 'text-gray-600 hover:text-gray-400'}`}>{p}</button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                  {projects.filter(p => p.platform === activePlatform).length > 0 ? (
                    projects.filter(p => p.platform === activePlatform).map((proj) => (
                      <WorkCard key={proj.id} {...proj} onVouch={() => handleVouch(proj.id)} vouched={vouchedIds.includes(proj.id)} />
                    ))
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-3 py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]"><p className="text-gray-600 font-bold uppercase tracking-widest text-xs italic">Awaiting Protocol Sync...</p></motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DRAWER & MODAL LOGIC REMAINS THE SAME */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="relative bg-[#0A0A0A] border-l border-white/10 w-full max-w-md h-full p-10 shadow-2xl">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-12">Edit Identity</h3>
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <input name="name" defaultValue={displayName} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500" placeholder="Display Name" />
                <textarea name="bio" defaultValue={displayBio} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none h-32 resize-none" placeholder="Bio" />
                <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Update Protocol</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative bg-[#0A0A0A] border border-white/10 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl">
               <h3 className="text-2xl font-black mb-8 italic uppercase tracking-tighter">Add {activePlatform} Proof</h3>
               <form onSubmit={(e: any) => {
                 e.preventDefault()
                 const formData = new FormData(e.target)
                 const newProj = {
                   id: Date.now(),
                   title: formData.get('title'),
                   tag: formData.get('tag'),
                   desc: formData.get('desc'),
                   platform: activePlatform,
                   vouchCount: 0
                 }
                 setProjects([newProj, ...projects])
                 setIsModalOpen(false)
               }} className="space-y-6">
                  <input name="title" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500" placeholder="Project Title" />
                  <input name="tag" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500" placeholder="Category" />
                  <textarea name="desc" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none h-32" placeholder="Description" />
                  <button type="submit" className="w-full bg-blue-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest">Publish Proof</button>
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
  return (
    <motion.div layout initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} whileHover={{ y: -10 }} className="bg-white/[0.02] border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl group flex flex-col transition-all duration-500 hover:border-blue-500/40">
      <div className="flex justify-between items-start mb-8">
        <div className="p-4 bg-white/5 w-fit rounded-2xl group-hover:bg-blue-600/20 transition-colors duration-500"><Icon size={24} className="text-blue-400"/></div>
        {link && link !== '#' && <a href={link} target="_blank" className="p-2 text-gray-600 hover:text-white transition-colors"><ExternalLink size={18}/></a>}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic mb-2">{tag}</p>
      <h4 className="text-2xl font-bold mb-4 italic uppercase tracking-tighter group-hover:text-blue-400 transition-colors leading-tight">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed font-medium line-clamp-3 mb-10">{desc}</p>
      <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Heart size={14} className={`transition-colors ${vouched ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
          <span className="text-xs font-black italic">{vouchCount} Vouches</span>
        </div>
        <button onClick={onVouch} disabled={vouched} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${vouched ? 'bg-green-500/10 text-green-500 cursor-default' : 'bg-white/5 hover:bg-blue-600 hover:text-white hover:scale-105 active:scale-95'}`}>{vouched ? '✓ Vouched' : 'Vouch'}</button>
      </div>
    </motion.div>
  )
}
