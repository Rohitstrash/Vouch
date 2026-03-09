// @ts-nocheck
/* eslint-disable */
'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Bell, MessageSquare, Flame, Clock, Filter, 
  CheckCircle2, MoreHorizontal, Sparkles, Trophy, 
  Github, LogOut, Heart, Plus, Zap, RefreshCw, ExternalLink
} from 'lucide-react'
import { signOut } from './actions'

export default function VouchNetworkFeed() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [projects, setProjects] = useState([])
  const [vouchedIds, setVouchedIds] = useState([]) 
  const [globalVouchCounts, setGlobalVouchCounts] = useState({})

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  useEffect(() => {
    async function initializeProtocol() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        const { data: allVouches } = await supabase.from('vouches').select('project_id')
        if (allVouches) {
          const counts = {}
          allVouches.forEach(v => { counts[v.project_id] = (counts[v.project_id] || 0) + 1 })
          setGlobalVouchCounts(counts)
        }

        if (session) {
          setUser(session.user)
          
          const { data: myVouches } = await supabase.from('vouches').select('project_id').eq('voucher_id', session.user.id)
          if (myVouches) setVouchedIds(myVouches.map(v => v.project_id))

          const { data: dbProjects } = await supabase.from('projects').select('*').eq('user_id', session.user.id)
          
          const token = session.provider_token
          const githubUsername = session.user.user_metadata?.preferred_username || session.user.user_metadata?.user_name
          
          if (token) {
            await fetchGitHubRepos(token, dbProjects || [], true)
          } else if (githubUsername) {
            await fetchGitHubRepos(githubUsername, dbProjects || [], false)
          } else if (dbProjects) {
            setProjects(dbProjects)
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    initializeProtocol()
  }, [])

  const fetchGitHubRepos = async (authIdentifier, existingDbProjects, isToken) => {
    setIsSyncing(true)
    try {
      const url = isToken 
        ? 'https://api.github.com/user/repos?sort=updated&per_page=10' 
        : `https://api.github.com/users/${authIdentifier}/repos?sort=updated&per_page=10`
      
      const headers = isToken ? { Authorization: `Bearer ${authIdentifier}` } : {}
      const res = await fetch(url, { headers })
      
      if (!res.ok) {
        setProjects(existingDbProjects)
        return
      }

      const data = await res.json()
      if (Array.isArray(data)) {
        const githubData = data.map(repo => ({
          id: repo.id.toString(),
          platform: 'github',
          title: repo.name,
          tag: repo.language || 'Protocol',
          desc: repo.description || 'Verified via GitHub Sync. Building scalable solutions.',
          link: repo.html_url,
          difficulty_weight: 1 
        }))
        
        const existingIds = new Set(existingDbProjects.map(p => p.id))
        const uniqueGithubData = githubData.filter(repo => !existingIds.has(repo.id))
        setProjects([...uniqueGithubData, ...existingDbProjects])
      }
    } catch (e) { 
      setProjects(existingDbProjects)
    } finally { 
      setIsSyncing(false) 
    }
  }

  const handleVouch = async (projectId) => {
    if (!user?.id || vouchedIds.includes(projectId)) return
    setVouchedIds(prev => [...prev, projectId])
    setGlobalVouchCounts(prev => ({ ...prev, [projectId]: (prev[projectId] || 0) + 1 }))
    try {
      await supabase.from('vouches').insert({ project_id: projectId, voucher_id: user.id })
    } catch (e) {}
  }

  const handleLogin = () => {
    supabase.auth.signInWithOAuth({ 
      provider: 'github', 
      options: { redirectTo: `${window.location.origin}/auth/callback`, scopes: 'repo read:user' } 
    })
  }

  if (loading) return <div className="h-screen bg-[#0A0D14] flex items-center justify-center text-blue-500 animate-pulse font-bold text-2xl">Initializing Network...</div>

  if (!user) {
    return (
      <div className="h-screen bg-[#0A0D14] flex flex-col items-center justify-center text-white px-4">
         <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-blue-500/20">
            <CheckCircle2 size={32} className="text-white" />
         </div>
         <h1 className="text-5xl font-black tracking-tight mb-4">Vouch Network</h1>
         <p className="text-gray-400 mb-10 text-center max-w-sm">The professional network for builders. Verify your skills, build your reputation.</p>
         <button onClick={handleLogin} className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-3">
            <Github size={20}/> Continue with GitHub
         </button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0A0D14] text-white font-sans selection:bg-blue-500/30">
      {/* TOP NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-[#0A0D14]/90 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <CheckCircle2 size={18} className="text-white" strokeWidth={3}/>
          </div>
          <span className="text-xl font-bold tracking-tight hidden md:block">Vouch</span>
        </div>

        <div className="hidden md:flex items-center bg-[#151821] rounded-full px-5 py-2.5 w-[500px] border border-white/5 focus-within:border-blue-500/50 transition-colors">
           <Search size={18} className="text-gray-500 mr-3" />
           <input type="text" placeholder="Search projects, skills, or people..." className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-500" />
        </div>

        <div className="flex items-center gap-6">
           <Bell size={20} className="text-gray-400 hover:text-white cursor-pointer transition-colors" />
           <MessageSquare size={20} className="text-gray-400 hover:text-white cursor-pointer transition-colors hidden sm:block" />
           <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <img src={user.user_metadata.avatar_url} className="w-9 h-9 rounded-full border border-white/10" alt="Avatar" />
              <form action={signOut}><button className="text-gray-500 hover:text-red-500 transition-colors"><LogOut size={18}/></button></form>
           </div>
        </div>
      </nav>

      {/* MAIN LAYOUT GRID */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-10 pb-20 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:flex flex-col gap-6">
           
           {/* Profile Header Card */}
           <div className="bg-[#151821] rounded-3xl p-8 flex flex-col items-center relative border border-white/5 overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-600/20 to-transparent" />
             <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#151821] shadow-2xl relative z-10 mb-4 group-hover:scale-105 transition-transform">
               <img src={user.user_metadata.avatar_url} className="w-full h-full object-cover" />
             </div>
             <div className="absolute top-24 right-1/2 translate-x-10 translate-y-2 bg-blue-500 rounded-full p-1 border-[3px] border-[#151821] z-20">
               <CheckCircle2 size={12} className="text-white" strokeWidth={4} />
             </div>
             <h2 className="text-xl font-bold tracking-tight text-white text-center mt-2">{user.user_metadata.full_name || user.user_metadata.user_name}</h2>
             <p className="text-sm text-gray-500 text-center mt-1">Building the future.</p>
           </div>

           {/* Top Vouched Skills Card */}
           <div className="bg-[#151821] rounded-3xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2.5 bg-purple-500/10 rounded-xl"><Trophy size={18} className="text-purple-400" /></div>
                 <h3 className="font-bold text-white tracking-tight">Top Vouched</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                {[
                  { name: 'React', count: 842 },
                  { name: 'UX Design', count: 621 },
                  { name: 'Node.js', count: 430 },
                  { name: 'System Architecture', count: 312 },
                  { name: 'Tailwind CSS', count: 290 }
                ].map((skill, i) => (
                  <div key={skill.name} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-4">
                       <span className="text-xs font-bold text-gray-600 w-3">{i + 1}</span>
                       <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{skill.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-colors">
                       <CheckCircle2 size={10} className="text-purple-400" />
                       <span className="text-[10px] font-bold text-purple-400">{skill.count}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white transition-colors border border-white/5">
                View all skills
              </button>
           </div>

           {/* Grow Network CTA */}
           <button className="w-full bg-gradient-to-br from-blue-900/40 to-[#151821] hover:from-blue-800/40 border border-blue-500/20 rounded-3xl p-6 flex items-center justify-center gap-3 transition-all group shadow-lg shadow-blue-900/10">
              <Sparkles size={20} className="text-blue-400 group-hover:animate-pulse" />
              <span className="font-bold text-white tracking-wide">Grow Network</span>
           </button>
        </aside>

        {/* MAIN FEED */}
        <div className="col-span-1 lg:col-span-3 space-y-8">
           
           {/* Feed Controls */}
           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex bg-[#151821] p-1.5 rounded-2xl border border-white/5 w-fit">
                <button className="flex items-center gap-2 px-6 py-2.5 bg-[#232733] rounded-xl text-sm font-semibold text-white shadow-sm border border-white/5">
                  <Flame size={16} className="text-orange-500"/> Trending
                </button>
                <button className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                  <Clock size={16}/> Latest
                </button>
              </div>
              <button className="flex items-center gap-2 px-5 py-2.5 border border-white/10 bg-[#151821] rounded-2xl text-sm font-medium hover:bg-white/5 transition-colors">
                <Filter size={16} className="text-gray-400"/> Filter
              </button>
           </div>

           {/* Projects Feed */}
           <div className="space-y-6">
              {projects.length > 0 ? (
                projects.map((proj) => (
                  <FeedCard 
                    key={proj.id} 
                    {...proj} 
                    author={user.user_metadata}
                    vouchCount={globalVouchCounts[proj.id] || Math.floor(Math.random() * 50) + 10} // Fallback random for preview matching
                    vouched={vouchedIds.includes(proj.id)}
                    onVouch={() => handleVouch(proj.id)} 
                  />
                ))
              ) : (
                <div className="bg-[#151821] border border-white/5 rounded-3xl p-16 text-center">
                  <RefreshCw size={32} className="text-gray-600 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-400 font-medium">Syncing network protocols...</p>
                </div>
              )}
           </div>
        </div>

      </div>
    </main>
  )
}

// FEED POST COMPONENT
function FeedCard({ title, tag, desc, link, vouchCount, onVouch, vouched, author }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-[#151821] border border-white/5 rounded-[2rem] p-6 sm:p-8 hover:border-white/10 transition-colors shadow-xl shadow-black/50"
    >
      {/* Post Header */}
      <div className="flex justify-between items-start mb-6">
         <div className="flex items-center gap-4">
            <img src={author.avatar_url} className="w-12 h-12 rounded-full border border-white/10" alt="Author" />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-white tracking-tight">{author.full_name || author.user_name}</h4>
                <CheckCircle2 size={16} className="text-blue-500" strokeWidth={3} />
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Software Engineer • 2 hours ago</p>
            </div>
         </div>
         <button className="text-gray-500 hover:text-white p-2"><MoreHorizontal size={20}/></button>
      </div>

      {/* Post Content */}
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">{title}</h2>
      <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6 max-w-3xl">{desc}</p>

      {/* Skill Tags */}
      <div className="flex gap-2 mb-8 flex-wrap">
         <span className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-xs text-gray-300 font-medium hover:bg-white/10 cursor-pointer transition-colors">
            {tag || 'Architecture'}
         </span>
         <span className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-xs text-gray-300 font-medium hover:bg-white/10 cursor-pointer transition-colors">
            TypeScript
         </span>
         <span className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-xs text-gray-300 font-medium hover:bg-white/10 cursor-pointer transition-colors">
            Protocol Design
         </span>
      </div>

      {/* Media Preview (Generative Placeholder) */}
      <a href={link} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-2xl mb-6 border border-white/5 bg-[#0A0D14]">
         <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />
         
         {/* Abstract Geometric Pattern Background */}
         <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-blue-900/20 via-[#151821] to-purple-900/20 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full -top-1/2 -left-1/4 group-hover:bg-blue-500/20 transition-colors duration-700" />
            <Github size={48} className="text-white/10 mb-4 z-20" />
            <span className="font-mono text-white/20 text-3xl font-black tracking-widest uppercase z-20">{title.substring(0, 3)}</span>
         </div>
         
         {/* Link Overlay */}
         <div className="absolute bottom-4 right-4 z-20 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
            <span className="text-xs font-bold text-white">View Source</span>
            <ExternalLink size={14} className="text-white"/>
         </div>
      </a>

      {/* Engagement Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
         <div className="flex items-center gap-6">
            <button 
              onClick={onVouch}
              disabled={vouched}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${vouched ? 'text-blue-500 cursor-default' : 'text-gray-400 hover:text-white'}`}
            >
               <Heart size={18} className={vouched ? 'fill-blue-500' : ''} />
               <span>{vouchCount}</span>
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
               <MessageSquare size={18} />
               <span>Discuss</span>
            </button>
         </div>
         
         {vouched && (
           <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20">
             <CheckCircle2 size={14} className="text-blue-400" />
             <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Vouched</span>
           </div>
         )}
      </div>
    </motion.div>
  )
}