'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, LogOut, ExternalLink, Globe, Plus, CheckCircle, X, RefreshCw, Zap, MapPin, Box, Figma, Linkedin, Gitlab } from 'lucide-react'
import { signOut } from './actions'

export default function VouchDashboardRestored() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('GITHUB')
  const [projects, setProjects] = useState<any[]>([])

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
    const timer = setTimeout(() => setLoading(false), 5000)
    return () => clearTimeout(timer)
  }, [supabase])

  const fetchGitHubRepos = async (token: string) => {
    try {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=6', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        const githubProjects = data.map(repo => ({
          id: repo.id,
          title: repo.name.toUpperCase(),
          tag: (repo.language || 'Protocol').toUpperCase(),
          desc: repo.description || 'Verified via GitHub Sync',
          platform: 'GITHUB',
          icon: <Github size={20} className="text-blue-400" />,
          link: repo.html_url
        }))
        setProjects(githubProjects)
      }
    } catch (e) { console.error(e) }
  }

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
            {/* Header with Avatar and Rep Count */}
            <header className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="relative group">
                  <img src={user.user_metadata.avatar_url} className="w-32 h-32 rounded-3xl border border-white/10 group-hover:border-blue-500/50 transition-all" alt="Profile" />
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl border-4 border-black"><Zap size={14} /></div>
                </div>
                <div className="space-y-2">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                     <CheckCircle size={10} className="text-blue-400" />
                     <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic">Verified Identity</span>
                   </div>
                   <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">{user.user_metadata.full_name || 'ROHIT SAHA'}</h2>
                   <p className="text-gray-500 font-medium italic tracking-tight">{user.user_metadata.bio || 'Building the future of reputation.'}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 hover:text-white transition-all transform active:scale-95 shadow-xl shadow-white/5">
                <Zap size={16} /> New Proof
              </button>
            </header>

            {/* Network Reputation Tabs */}
            <section className="space-y-8">
               <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] italic">Network Reputation</h3>
                  <div className="flex gap-8 border-b border-white/5 pb-1">
                    {['GITHUB', 'FIGMA', 'LINKEDIN', 'GITLAB'].map((tab) => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-4 text-[11px] font-black tracking-widest flex items-center gap-2 transition-all ${activeTab === tab ? 'text-white border-b-2 border-white' : 'text-gray-600 hover:text-gray-400'}`}
                      >
                        {tab === 'GITHUB' && <Github size={14}/>}
                        {tab === 'FIGMA' && <Figma size={14}/>}
                        {tab === 'LINKEDIN' && <Linkedin size={14}/>}
                        {tab === 'GITLAB' && <Gitlab size={14}/>}
                        {tab}
                      </button>
                    ))}
                  </div>
               </div>

               {/* Projects Grid */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <AnimatePresence mode='wait'>
                    {projects.filter(p => p.platform === activeTab).length > 0 ? (
                      projects.filter(p => p.platform === activeTab).map((proj) => (
                        <WorkCard key={proj.id} {...proj} />
                      ))
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-3 py-20 text-center border border-dashed border-white/5 rounded-[3rem]">
                        <p className="text-gray-600 font-bold uppercase tracking-widest text-xs italic">No {activeTab.toLowerCase()} work found.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </section>
          </div>
        ) : (
          <div className="py-40 text-center space-y-8">
            <h2 className="text-7xl font-black tracking-tighter uppercase italic text-blue-500">VOUCH.</h2>
            <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })} className="bg-white text-black px-12 py-5 rounded-full font-black text-xl shadow-2xl shadow-blue-500/20">Enter the Network</button>
          </div>
        )}
      </div>

      {/* Manual Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative bg-[#0A0A0A] border border-white/10 p-12 rounded-[3.5rem] w-full max-w-xl shadow-2xl">
               <h3 className="text-3xl font-black mb-10 uppercase italic tracking-tighter">Create New Proof</h3>
               <form onSubmit={(e: any) => {
                 e.preventDefault()
                 const formData = new FormData(e.target)
                 const newProj = {
                   id: Date.now(),
                   title: (formData.get('title') as string).toUpperCase(),
                   tag: (formData.get('tag') as string).toUpperCase(),
                   desc: formData.get('desc'),
                   platform: activeTab,
                   icon: activeTab === 'GITHUB' ? <Github size={20} className="text-blue-400" /> : <Box size={20} className="text-purple-400" />,
                   status: "Verified"
                 }
                 setProjects([newProj, ...projects])
                 setIsModalOpen(false)
               }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Project Title</label>
                    <input name="title" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. Vouch Protocol" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tag</label>
                    <input name="tag" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. Typescript" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Description</label>
                    <textarea name="desc" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 h-24 resize-none" placeholder="What did you build?" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all">Vouch to Network</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}

function WorkCard({ icon, title, tag, desc, link }: any) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} className="bg-white/[0.03] border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-2xl group relative overflow-hidden transition-all duration-500 hover:border-blue-500/30">
      <div className="mb-10 p-4 bg-white/5 w-fit rounded-2xl group-hover:bg-blue-500/10 transition-colors duration-500">{icon}</div>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic">{tag}</p>
        {link && <a href={link} target="_blank" className="text-gray-500 hover:text-white transition-colors"><ExternalLink size={16}/></a>}
      </div>
      <h4 className="text-3xl font-black mb-4 italic uppercase tracking-tighter leading-tight">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed font-medium line-clamp-2">{desc}</p>
    </motion.div>
  )
}