// @ts-nocheck
/* eslint-disable */
'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Bell, MessageSquare, Flame, Clock, Filter, 
  CheckCircle2, MoreHorizontal, Sparkles, Trophy, 
  Github, LogOut, Heart, Plus, Zap, RefreshCw, ExternalLink, ArrowRight, Mail,
  Edit2, X, Save, ImageIcon
} from 'lucide-react'
import { signOut } from './actions'

// --- HELPER FUNCTION: REALTIME TIME AGO ---
function timeAgo(dateString) {
  if (!dateString) return "Unknown time";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

export default function VouchNetworkFeed() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [projects, setProjects] = useState([])
  const [vouchedIds, setVouchedIds] = useState([]) 
  const [globalVouchCounts, setGlobalVouchCounts] = useState({})

  // Auth States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginView, setIsLoginView] = useState(false)
  const [authMsg, setAuthMsg] = useState({ text: '', type: '' })

  // --- NEW DYNAMIC STATES ---
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ full_name: '', bio: '', avatar_url: '' })

  // --- EDITABLE DESIGNATION STATES ---
  const [designation, setDesignation] = useState('')
  const [tempDesignation, setTempDesignation] = useState('')
  const [isEditingDesignation, setIsEditingDesignation] = useState(false)

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
          // Set initial profile form state
          setProfileForm({
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.user_name || session.user.email.split('@')[0],
            bio: session.user.user_metadata?.bio || 'Building the future.',
            avatar_url: session.user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'
          })
          setDesignation(session.user.user_metadata?.designation || 'Software Engineer')
          
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
          skills: [repo.language, 'Architecture', 'Open Source'].filter(Boolean), 
          desc: repo.description || 'Verified via GitHub Sync. Building scalable solutions.',
          link: repo.html_url,
          createdAt: repo.pushed_at, // Dynamic time setup
          image_url: null, // Dynamic image setup
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

  const handleGithubLogin = () => {
    supabase.auth.signInWithOAuth({ 
      provider: 'github', 
      options: { redirectTo: `${window.location.origin}/auth/callback`, scopes: 'repo read:user' } 
    })
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setAuthMsg({ text: 'Processing...', type: 'info' })
    
    if (isLoginView) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setAuthMsg({ text: error.message, type: 'error' })
      else window.location.reload()
    } else {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      })
      if (error) setAuthMsg({ text: error.message, type: 'error' })
      else setAuthMsg({ text: 'Success! Check your email to confirm your account.', type: 'success' })
    }
  }

  // --- SAVE UPDATED PROFILE ---
  const saveProfile = async () => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { 
          full_name: profileForm.full_name,
          bio: profileForm.bio,
          avatar_url: profileForm.avatar_url
        }
      })
      if (error) throw error
      setUser(data.user) // Update local user state
      setIsEditingProfile(false) // Close modal
    } catch (error) {
      alert("Error updating profile: " + error.message)
    }
  }

  // --- SAVE UPDATED DESIGNATION ---
  const handleSaveDesignation = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { designation: tempDesignation }
      })
      if (error) throw error
      setDesignation(tempDesignation)
      setIsEditingDesignation(false)
    } catch (error) {
      alert("Error updating designation: " + error.message)
    }
  }

  // --- UPDATE PROJECT IN SUPABASE ---
  const updateProjectInDb = async (projectId, updates) => {
    try {
      const { error } = await supabase.from('projects').update(updates).eq('id', projectId)
      if (error) throw error
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p))
    } catch (error) {
      alert("Error updating project: " + error.message)
    }
  }

  if (loading) return <div className="h-screen bg-[#0A0D14] flex items-center justify-center text-blue-500 animate-pulse font-bold text-2xl">Initializing Network...</div>

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0D14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
         
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="w-full max-w-[400px] bg-[#151821] border border-white/5 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-black/50 relative z-10"
         >
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(37,99,235,0.4)]">
               <CheckCircle2 size={28} className="text-white" strokeWidth={2.5} />
            </div>

            <h1 className="text-2xl font-black text-white text-center tracking-tight mb-2">
              {isLoginView ? 'Welcome Back' : 'Join Vouch'}
            </h1>
            <p className="text-sm text-gray-400 text-center mb-8">
              {isLoginView ? 'Sign in to continue.' : 'Showcase projects. Earn reputation.'}
            </p>

            <button 
              onClick={handleGithubLogin} 
              className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-sm font-bold text-white transition-all mb-6"
            >
               <Github size={18}/> Continue with GitHub
            </button>

            <div className="relative flex items-center py-2 mb-6">
               <div className="flex-grow border-t border-white/5"></div>
               <span className="flex-shrink-0 mx-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">OR</span>
               <div className="flex-grow border-t border-white/5"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
               <div className="relative">
                 <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                 <input 
                   type="email" 
                   required
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="Enter your email" 
                   className="w-full bg-[#0A0D14] border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                 />
               </div>
               <div className="relative">
                 <Zap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                 <input 
                   type="password" 
                   required
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="Choose a password" 
                   className="w-full bg-[#0A0D14] border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                 />
               </div>

               {authMsg.text && (
                 <p className={`text-xs font-medium text-center ${authMsg.type === 'error' ? 'text-red-400' : authMsg.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                   {authMsg.text}
                 </p>
               )}

               <button 
                 type="submit" 
                 className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all flex justify-center items-center gap-2 group"
               >
                  {isLoginView ? 'Log In' : 'Create Account'} 
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-8">
              {isLoginView ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => {
                  setIsLoginView(!isLoginView)
                  setAuthMsg({text: '', type: ''})
                }} 
                className="text-blue-400 font-bold hover:text-blue-300"
              >
                {isLoginView ? 'Sign up' : 'Log in'}
              </button>
            </p>
         </motion.div>
      </div>
    )
  }

  // --- DYNAMIC SEARCH FILTER ---
  const displayedProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.tag && p.tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const topSkills = Object.entries(
    projects.reduce((acc, proj) => {
      const skill = proj.tag || 'Protocol';
      const score = globalVouchCounts[proj.id] || 0; 
      acc[skill] = (acc[skill] || 0) + score;
      return acc;
    }, {})
  )
  .map(([name, count]) => ({ name, count }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);

  return (
    <main className="min-h-screen bg-[#0A0D14] text-white font-sans selection:bg-blue-500/30 relative">
      
      {/* PROFILE EDIT MODAL */}
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#151821] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md relative"
            >
              <button onClick={() => setIsEditingProfile(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full"><X size={18} /></button>
              <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Display Name</label>
                  <input type="text" value={profileForm.full_name} onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})} className="w-full bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Bio</label>
                  <input type="text" value={profileForm.bio} onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})} className="w-full bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Avatar URL</label>
                  <input type="text" value={profileForm.avatar_url} onChange={(e) => setProfileForm({...profileForm, avatar_url: e.target.value})} className="w-full bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                </div>
                <button onClick={saveProfile} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl mt-4 transition-colors">
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP NAVIGATION */}
      <nav className="sticky top-0 z-50 bg-[#0A0D14]/90 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <CheckCircle2 size={18} className="text-white" strokeWidth={3}/>
          </div>
          <span className="text-xl font-bold tracking-tight hidden md:block">Vouch</span>
        </div>

        {/* DYNAMIC SEARCH BAR */}
        <div className="hidden md:flex items-center bg-[#151821] rounded-full px-5 py-2.5 w-[500px] border border-white/5 focus-within:border-blue-500/50 transition-colors">
           <Search size={18} className="text-gray-500 mr-3" />
           <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search projects, skills, or people..." 
             className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-500" 
           />
        </div>

        <div className="flex items-center gap-6">
          {/* NOTIFICATION PANEL */}
          <div className="relative">
            <Bell 
              size={20} 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`cursor-pointer transition-colors ${showNotifications ? 'text-white' : 'text-gray-400 hover:text-white'}`} 
            />
            {showNotifications && (
              <div className="absolute top-8 right-0 w-80 bg-[#151821] border border-white/10 rounded-2xl shadow-2xl p-4 z-50">
                <h3 className="text-sm font-bold text-white mb-3">Notifications</h3>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start bg-white/5 p-3 rounded-xl">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400"><Heart size={14}/></div>
                    <div>
                      <p className="text-xs text-gray-300"><span className="text-white font-bold">Alex</span> vouched for your project <span className="text-blue-400">Vouch Network</span></p>
                      <p className="text-[10px] text-gray-500 mt-1">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start p-3 hover:bg-white/5 rounded-xl transition-colors">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400"><Trophy size={14}/></div>
                    <div>
                      <p className="text-xs text-gray-300">Your <span className="text-purple-400 font-bold">TypeScript</span> skill ranked up to #1!</p>
                      <p className="text-[10px] text-gray-500 mt-1">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <MessageSquare size={20} className="text-gray-400 hover:text-white cursor-pointer transition-colors hidden sm:block" />
          
          {/* CLICKABLE PROFILE PICTURE FOR MOBILE */}
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
             <button 
               onClick={() => setIsEditingProfile(true)}
               className="relative group rounded-full overflow-hidden border border-white/10 focus:ring-2 focus:ring-blue-500 transition-all"
             >
               <img 
                 src={user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} 
                 className="w-9 h-9 object-cover" 
                 alt="Edit Profile" 
               />
               <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                 <Edit2 size={12} className="text-white" />
               </div>
             </button>
             
             <form action={signOut}>
               <button type="submit" className="text-gray-500 hover:text-red-500 transition-colors mt-1">
                 <LogOut size={18}/>
               </button>
             </form>
          </div>
       </div>
      </nav>

      {/* MAIN LAYOUT GRID */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-10 pb-20 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT SIDEBAR */}
        <aside className="hidden lg:flex flex-col gap-6">
           
           {/* DYNAMIC PROFILE HEADER CARD */}
           <div className="bg-[#151821] rounded-3xl p-8 flex flex-col items-center relative border border-white/5 overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-600/20 to-transparent" />
             <button 
               onClick={() => setIsEditingProfile(true)}
               className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-blue-600 rounded-full text-white/70 hover:text-white backdrop-blur-md transition-all z-20 opacity-0 group-hover:opacity-100"
             >
               <Edit2 size={14} />
             </button>
             
             <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#151821] shadow-2xl relative z-10 mb-4 group-hover:scale-105 transition-transform">
               <img src={user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} className="w-full h-full object-cover" />
             </div>
             <div className="absolute top-24 right-1/2 translate-x-10 translate-y-2 bg-blue-500 rounded-full p-1 border-[3px] border-[#151821] z-20">
               <CheckCircle2 size={12} className="text-white" strokeWidth={4} />
             </div>
             <h2 className="text-xl font-bold tracking-tight text-white text-center mt-2 flex items-center gap-2">
               {user.user_metadata?.full_name || user.user_metadata?.user_name || user.email.split('@')[0]}
             </h2>
             
             {/* EDITABLE DESIGNATION */}
             <div className="relative mt-1 group w-full flex justify-center">
                {isEditingDesignation ? (
                  <div className="flex items-center gap-1.5 bg-[#0A0D14] border border-white/10 rounded-lg p-1">
                    <input 
                      type="text" 
                      value={tempDesignation}
                      onChange={(e) => setTempDesignation(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm text-white px-2 py-0.5 w-40 text-center"
                      autoFocus
                    />
                    <button onClick={handleSaveDesignation} className="p-1 text-green-400 hover:text-green-300"><Save size={14} /></button>
                    <button onClick={() => setIsEditingDesignation(false)} className="p-1 text-red-400 hover:text-red-300"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 text-center">{designation}</p>
                    <button 
                      onClick={() => { setTempDesignation(designation); setIsEditingDesignation(true); }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-white bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Edit2 size={12} />
                    </button>
                  </>
                )}
             </div>
           </div>

           {/* Top Vouched Skills Card */}
           <div className="bg-[#151821] rounded-3xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2.5 bg-purple-500/10 rounded-xl"><Trophy size={18} className="text-purple-400" /></div>
                 <h3 className="font-bold text-white tracking-tight">Top Vouched</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                {topSkills.length > 0 ? (
                  topSkills.map((skill, i) => (
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
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center italic py-4">Publish projects to rank skills.</p>
                )}
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
              {displayedProjects.length > 0 ? (
                displayedProjects.map((proj) => (
                  <FeedCard 
                    key={proj.id} 
                    {...proj} 
                    author={user.user_metadata}
                    userDesignation={designation}
                    vouchCount={globalVouchCounts[proj.id] || 0}
                    vouched={vouchedIds.includes(proj.id)}
                    onVouch={() => handleVouch(proj.id)}
                    onUpdateProject={updateProjectInDb}
                  />
                ))
              ) : (
                <div className="bg-[#151821] border border-white/5 rounded-3xl p-16 text-center">
                  {searchQuery ? (
                     <p className="text-gray-400 font-medium">No projects match "{searchQuery}"</p>
                  ) : (
                    <>
                      <RefreshCw size={32} className="text-gray-600 mx-auto mb-4 animate-spin" />
                      <p className="text-gray-400 font-medium">Syncing network protocols...</p>
                    </>
                  )}
                </div>
              )}
           </div>
        </div>

      </div>
    </main>
  )
}

// FEED POST COMPONENT
function FeedCard({ id, title, tag, skills, desc, link, vouchCount, onVouch, vouched, author, userDesignation, createdAt, image_url, onUpdateProject }) {
  // New States for local editing
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tempTags, setTempTags] = useState(skills?.join(', ') || tag);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(image_url || '');

  const saveTags = async () => {
    const newSkills = tempTags.split(',').map(s => s.trim()).filter(Boolean);
    await onUpdateProject(id, { skills: newSkills, tag: newSkills[0] || 'Protocol' });
    setIsEditingTags(false);
  }

  const saveImage = async () => {
    await onUpdateProject(id, { image_url: tempImageUrl });
    setIsEditingImage(false);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="bg-[#151821] border border-white/5 rounded-[2rem] p-6 sm:p-8 hover:border-white/10 transition-colors shadow-xl shadow-black/50"
    >
      {/* Post Header */}
      <div className="flex justify-between items-start mb-6">
         <div className="flex items-center gap-4">
            <img src={author?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} className="w-12 h-12 rounded-full border border-white/10" alt="Author" />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-white tracking-tight">{author?.full_name || author?.user_name || 'Builder'}</h4>
                <CheckCircle2 size={16} className="text-blue-500" strokeWidth={3} />
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {userDesignation} • {timeAgo(createdAt)}
              </p>
            </div>
         </div>
         <button className="text-gray-500 hover:text-white p-2"><MoreHorizontal size={20}/></button>
      </div>

      {/* Post Content */}
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">{title}</h2>
      <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6 max-w-3xl">{desc}</p>

      {/* EDITABLE SKILL TAGS */}
      <div className="flex items-center gap-2 mb-8 group relative flex-wrap">
          {isEditingTags ? (
              <div className="flex items-center gap-2 bg-[#0A0D14] border border-white/10 rounded-lg p-1.5 w-full max-w-lg">
                <input 
                  type="text" 
                  value={tempTags}
                  onChange={(e) => setTempTags(e.target.value)}
                  placeholder="Comma-separated skills..."
                  className="bg-transparent border-none outline-none text-xs text-white px-2 py-0.5 w-full"
                  autoFocus
                />
                <button onClick={saveTags} className="p-1 text-green-400 hover:text-green-300"><Save size={14} /></button>
                <button onClick={() => setIsEditingTags(false)} className="p-1 text-red-400 hover:text-red-300"><X size={14} /></button>
              </div>
          ) : (
            <>
                {skills && skills.length > 0 ? (
                    skills.map((skill, index) => (
                       <span key={index} className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-xs text-gray-300 font-medium hover:bg-white/10 cursor-pointer transition-colors">
                          {skill}
                       </span>
                    ))
                ) : (
                    <span className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-xs text-gray-300 font-medium hover:bg-white/10 cursor-pointer transition-colors">
                       {tag || 'Architecture'}
                    </span>
                )}
                 <button 
                  onClick={() => setIsEditingTags(true)}
                  className="p-1.5 text-gray-600 hover:text-white bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Edit2 size={12} />
                </button>
            </>
          )}
      </div>

      {/* EDITABLE MEDIA PREVIEW */}
      <div className="relative group overflow-hidden rounded-2xl mb-6 border border-white/5 bg-[#0A0D14] min-h-[256px]">
          {isEditingImage ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#151821] p-8 z-30">
                 <input 
                  type="text" 
                  value={tempImageUrl}
                  onChange={(e) => setTempImageUrl(e.target.value)}
                  placeholder="Paste new image URL..."
                  className="w-full bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  autoFocus
                />
                <div className="flex gap-2">
                    <button onClick={saveImage} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition-colors"><Save size={14}/> Save Image</button>
                    <button onClick={() => setIsEditingImage(false)} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl text-sm transition-colors"><X size={14}/> Cancel</button>
                </div>
              </div>
          ) : (
              <button 
                onClick={() => setIsEditingImage(true)}
                className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-blue-600 rounded-full text-white/70 hover:text-white backdrop-blur-md transition-all z-20 opacity-0 group-hover:opacity-100"
              >
                <ImageIcon size={16} />
              </button>
          )}
          
          <a href={link} target="_blank" rel="noopener noreferrer" className="block relative h-full">
             <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />
             
             {image_url ? (
                <img src={image_url} alt={title} className="w-full h-full object-cover rounded-2xl h-64 sm:h-80" />
             ) : (
                 <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-blue-900/20 via-[#151821] to-purple-900/20 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full -top-1/2 -left-1/4 group-hover:bg-blue-500/20 transition-colors duration-700" />
                    <Github size={48} className="text-white/10 mb-4 z-20" />
                    <span className="font-mono text-white/20 text-3xl font-black tracking-widest uppercase z-20">{title.substring(0, 3)}</span>
                 </div>
             )}
             
             {/* Link Overlay */}
             <div className="absolute bottom-4 right-4 z-20 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                <span className="text-xs font-bold text-white">View Source</span>
                <ExternalLink size={14} className="text-white"/>
             </div>
          </a>
      </div>

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