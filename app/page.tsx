'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, LogOut, ExternalLink, Globe, Plus, CheckCircle, X, RefreshCw, Zap, MapPin, Box, Figma, Linkedin, Gitlab, Link as LinkIcon } from 'lucide-react'
import { signOut } from './actions'

export default function VouchProFinal() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [projects, setProjects] = useState<any[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // --- THE PROPER PLACE FOR THE SAFETY NET ---
  useEffect(() => {
    async function getUserData() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (session) {
          setUser(session.user)
          // Use the provider token from the session to fetch repos
          if (session.provider_token) fetchGitHubRepos(session.provider_token)
        }
      } catch (e) {
        console.error("Auth initialization failed", e)
      } finally {
        // ALWAYS stops the black loading screen
        setLoading(false)
      }
    }

    getUserData()

    // EMERGENCY TIMEOUT: If nothing happens in 5s, show the UI anyway
    const timer = setTimeout(() => setLoading(false), 5000)
    return () => clearTimeout(timer)
  }, [supabase])

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
          tag: "GitHub",
          desc: repo.description || 'Verified via GitHub Sync',
          status: "Synced",
          icon: <Github size={24} />,
          link: repo.html_url
        }))
        setProjects(prev => [...githubProjects, ...prev.filter(p => p.tag !== "GitHub")])
      }
    } catch (e) { console.error(e) } finally { setIsSyncing(false) }
  }

  const handleAddAsset = (e: any) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const platform = formData.get('platform') as string
    
    const icons: any = {
      Figma: <Figma className="text-[#F24E1E]" />,
      LinkedIn: <Linkedin className="text-[#0A66C2]" />,
      GitLab: <Gitlab className="text-[#FC6D26]" />,
      Other: <Box className="text-blue-500" />
    }

    const newAsset = {
      id: Date.now(),
      title: formData.get('title'),
      platform: platform,
      desc: formData.get('desc'),
      link: formData.get('link'),
      icon: icons[platform] || icons.Other,
      status: "Verified"
    }

    setProjects([newAsset, ...projects])
    setIsModalOpen(false)
  }

  const handleLogin = () => supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: `${window.location.origin}/auth/callback`, scopes: 'repo read:user' }
  })

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center font-black text-blue-500 text-5xl italic animate-pulse">VOUCH</div>
  )

  return (
    <main className="min-h-screen bg-[#020202] text-white selection:bg-blue-600/30 font-sans overflow-x-hidden">
      <nav className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-white/5 backdrop-blur-xl bg-black/40 sticky top-0">
        <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">VOUCH</h1>
        {user && (
          <form action={signOut}><button className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-400"><LogOut size={16} /></button></form>
        )}
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {!user ? (
          <div className="py-40 text-center space-y-10">
            <h2 className="text-7xl font-black tracking-tighter uppercase italic text-blue-600">Proof of Work.</h2>
            <button onClick={handleLogin} className="bg-white text-black px-12 py-5 rounded-full font-black text-xl hover:bg-blue-600 transition-all">Continue with GitHub</button>
          </div>
        ) : (
          <div className="space-y-16">
            <header className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <img src={user.user_metadata.avatar_url} className="w-24 h-24 rounded-[2rem] border border-white/10 shadow-2xl" alt="Identity" />
                <div className="text-center md:text-left">
                   <h2 className="text-5xl font-black tracking-tighter uppercase">{user.user_metadata.full_name || user.user_metadata.user_name}</h2>
                   <p className="text-gray-500 font-medium flex items-center gap-2 justify-center md:justify-start">
                     <MapPin size={14} /> {user.user_metadata.location || "Global"}
                   </p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all">
                <Plus size={16} /> Link Asset
              </button>
            </header>

            <section className="space-y-10">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.5em] italic border-b border-white/5 pb-6">Active Reputations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <AnimatePresence>
                  {projects.map((proj) => <WorkCard key={proj.id} {...proj} />)}
                </AnimatePresence>
              </div>
            </section>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="relative bg-[#0A0A0A] border border-white/10 p-10 rounded-[3rem] w-full max-w-xl shadow-2xl">
               <h3 className="text-3xl font-black mb-8 uppercase italic tracking-tighter">Link New Asset</h3>
               <form onSubmit={handleAddAsset} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Platform</label>
                    <select name="platform" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none appearance-none text-sm">
                        <option value="Figma">Figma</option>
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="GitLab">GitLab</option>
                        <option value="Other">Custom</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Project Name</label>
                    <input name="title" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none" placeholder="e.g. Adobe UI" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Link (URL)</label>
                    <input name="link" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none" placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Description</label>
                    <textarea name="desc" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 h-24 resize-none" placeholder="What did you build?" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest">Verify & Link</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  )
}

function WorkCard({ icon, title, tag, desc, status, link, platform }: any) {
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -10 }} className="bg-white/[0.02] border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl group relative overflow-hidden transition-all duration-500">
      <div className="mb-8 p-4 bg-white/5 w-fit rounded-2xl group-hover:bg-blue-500/20 transition-colors duration-500">{icon}</div>
      <div className="flex justify-between items-start mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic">{tag || platform}</p>
        {link && <a href={link} target="_blank" className="text-gray-500 hover:text-white transition-colors"><ExternalLink size={16}/></a>}
      </div>
      <h4 className="text-2xl font-bold mb-4 italic uppercase tracking-tighter">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed font-medium line-clamp-2">{desc}</p>
    </motion.div>
  )
}
