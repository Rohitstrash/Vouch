'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, LogOut, ExternalLink, Cpu, Palette, Box, Plus, CheckCircle, X, RefreshCw, Globe } from 'lucide-react'
import { signOut } from './actions'

export default function VouchDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
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
        // If we already have the token from login, try to fetch repos automatically
        if (session.provider_token) {
          fetchGitHubRepos(session.provider_token)
        }
      }
      setLoading(false)
    }
    getUserData()
  }, [])

  // --- THE NEW GITHUB FETCH FUNCTION ---
  const fetchGitHubRepos = async (token: string) => {
    setIsSyncing(true)
    try {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=6', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (Array.isArray(data)) {
        const githubProjects = data.map(repo => ({
          id: repo.id,
          title: repo.name,
          tag: repo.language || 'Code',
          desc: repo.description || 'Verified GitHub Repository',
          status: "Synced",
          icon: <Globe className="text-blue-400" />,
          link: repo.html_url
        }))
        setProjects(githubProjects)
      }
    } catch (e) {
      console.error("Sync Error:", e)
    } finally {
      setIsSyncing(false)
    }
  }

  // --- UPDATED LOGIN WITH SCOPES ---
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'repo read:user', // This is the secret sauce for access
        queryParams: {
          access_type: 'offline',
          prompt: 'consent', // Forces the "Authorize" screen to show again
        }
      }
    })
  }

  const handleAddProject = (e: any) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const newProj = {
      id: Date.now(),
      title: formData.get('title') as string,
      tag: formData.get('tag') as string,
      desc: formData.get('desc') as string,
      status: "In Review",
      icon: <Box className="text-green-400" />
    }
    setProjects([newProj, ...projects])
    setIsModalOpen(false)
  }

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-blue-500 font-black text-5xl italic tracking-tighter">VOUCH</motion.div>
    </div>
  )

  return (
    <main className="min-h-screen bg-[#020202] text-white selection:bg-blue-500/30 overflow-x-hidden font-sans">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[400px] h-[400px] bg-purple-600/5 blur-[100px] rounded-full" />
      </div>

      <nav className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-white/5 backdrop-blur-xl bg-black/40 sticky top-0">
        <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">VOUCH</h1>
        {user ? (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                supabase.auth.getSession().then(({data}) => {
                  if (data.session?.provider_token) fetchGitHubRepos(data.session.provider_token)
                })
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
            </button>
            <form action={signOut} className="flex items-center gap-6">
              <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-500/80 hover:text-red-400 transition-colors">
                <LogOut size={14} /> Logout
              </button>
            </form>
          </div>
        ) : (
          <button onClick={handleLogin} className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm">Sign In</button>
        )}
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {user ? (
          <>
            <motion.header initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <CheckCircle size={12} className="text-blue-400" />
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Verified Identity</span>
                </div>
                <h2 className="text-6xl font-black tracking-tighter leading-none uppercase">{user?.user_metadata?.full_name || 'ROHIT SAHA'}</h2>
                <p className="text-gray-400 font-medium flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Building @ Adobe</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-white text-black px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all transform active:scale-95 flex items-center gap-2"
              >
                <Plus size={18} /> New Proof
              </button>
            </motion.header>

            <section className="space-y-8">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.4em]">Active Reputations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnimatePresence>
                  {projects.length > 0 ? projects.map((proj) => (
                    <WorkCard key={proj.id} {...proj} />
                  )) : (
                    <div className="col-span-3 py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                      <p className="text-gray-500">No work synced. Click the sync icon or add manually.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </>
        ) : (
          <div className="py-40 text-center">
            <h2 className="text-5xl font-black mb-8 uppercase italic">Vouch for your <span className="text-blue-500">work.</span></h2>
            <button onClick={handleLogin} className="bg-white text-black px-12 py-5 rounded-full font-black text-lg hover:bg-blue-500 hover:text-white transition-all">Continue with GitHub</button>
          </div>
        )}
      </div>

      {/* Modal remains the same but with high-class style */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-[#0A0A0A] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
               <div className="absolute top-0 right-0 p-6">
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
               </div>
               <h3 className="text-2xl font-black mb-6 uppercase tracking-tight">Create New Proof</h3>
               <form onSubmit={handleAddProject} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Project Title</label>
                    <input name="title" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. Vouch Protocol" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Category</label>
                    <input name="tag" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. Software / Robotics" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Description</label>
                    <textarea name="desc" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors h-32" placeholder="What did you build?" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all">Publish to Network</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}

function WorkCard({ icon, title, tag, desc, status, link }: any) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} whileHover={{ y: -8 }} className="bg-white/[0.03] border border-white/10 p-8 rounded-[2rem] backdrop-blur-md group relative overflow-hidden transition-all duration-300">
      <div className="mb-6 p-4 bg-white/5 w-fit rounded-2xl group-hover:bg-blue-500/20 transition-colors">{icon}</div>
      <div className="flex justify-between items-start mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500/80">{tag}</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase">{status}</span>
          {link && <a href={link} target="_blank" className="text-gray-500 hover:text-white"><ExternalLink size={14}/></a>}
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed font-medium">{desc}</p>
    </motion.div>
  )
}
