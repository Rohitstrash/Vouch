// @ts-nocheck
/* eslint-disable */
'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState, Suspense } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Bell, MessageSquare, Flame, Clock, Filter, 
  CheckCircle2, MoreHorizontal, Sparkles, Trophy, 
  Github, LogOut, Heart, Plus, Zap, RefreshCw, ExternalLink, ArrowRight, Mail,
  Edit2, X, Save, ImageIcon, Trash2, Users, Globe
} from 'lucide-react'
import { signOut } from './actions'

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
  
  const [feedProjects, setFeedProjects] = useState([])
  const [myProjects, setMyProjects] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  const [vouchedIds, setVouchedIds] = useState([]) 
  const [globalVouchCounts, setGlobalVouchCounts] = useState({})

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // --- NEW: Added 'trending' to the filter state ---
  const [feedFilter, setFeedFilter] = useState('global') 
  const [followingIds, setFollowingIds] = useState([])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginView, setIsLoginView] = useState(false)
  const [authMsg, setAuthMsg] = useState({ text: '', type: '' })

  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({ full_name: '', bio: '', avatar_url: '' })

  const [designation, setDesignation] = useState('')
  const [tempDesignation, setTempDesignation] = useState('')
  const [isEditingDesignation, setIsEditingDesignation] = useState(false)

  const [isAddingProject, setIsAddingProject] = useState(false)
  const [newProjectForm, setNewProjectForm] = useState({ title: '', desc: '', link: '', tag: '', image_url: '' })

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
          const currentUser = session.user
          setUser(currentUser)
          setProfileForm({
            full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.user_name || currentUser.email.split('@')[0],
            bio: currentUser.user_metadata?.bio || 'Building the future.',
            avatar_url: currentUser.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'
          })
          setDesignation(currentUser.user_metadata?.designation || 'Software Engineer')
          
          const { data: myVouches } = await supabase.from('vouches').select('project_id').eq('voucher_id', currentUser.id)
          if (myVouches) setVouchedIds(myVouches.map(v => v.project_id))

          const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(20)
          if (notifs) {
              setNotifications(notifs)
              setUnreadCount(notifs.filter(n => !n.is_read).length)
          }

          const { data: myConnections } = await supabase.from('connections').select('following_id').eq('follower_id', currentUser.id)
          if (myConnections) {
              setFollowingIds(myConnections.map(c => c.following_id))
          }

          const { data: globalDbProjects } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
          
          const token = currentUser.provider_token
          const githubUsername = currentUser.user_metadata?.preferred_username || currentUser.user_metadata?.user_name
          
          if (token) {
            await fetchAndSaveGitHubRepos(token, globalDbProjects || [], true, currentUser)
          } else if (githubUsername) {
            await fetchAndSaveGitHubRepos(githubUsername, globalDbProjects || [], false, currentUser)
          } else if (globalDbProjects) {
            setFeedProjects(globalDbProjects)
            setMyProjects(globalDbProjects.filter(p => p.user_id === currentUser.id))
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

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`, 
        },
        (payload) => {
          const newNotif = payload.new;
          setNotifications((prev) => [newNotif, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, supabase]);

  useEffect(() => {
    if (loading || isSyncing || !user) return;

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      
      let dbQuery = supabase.from('projects').select('*').order('created_at', { ascending: false });
      
      if (searchQuery.trim() !== '') {
         dbQuery = dbQuery.or(`title.ilike.%${searchQuery}%,author_name.ilike.%${searchQuery}%,tag.ilike.%${searchQuery}%,desc.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await dbQuery.limit(50);
      
      if (!error && data) {
         setFeedProjects(data);
      }
      setIsSearching(false);
    }, 400); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user, loading, isSyncing]);

  const handleToggleNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
       setUnreadCount(0);
       setNotifications(prev => prev.map(n => ({...n, is_read: true})));
       await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    }
  }

  const fetchAndSaveGitHubRepos = async (authIdentifier, existingDbProjects, isToken, currentUser) => {
    setIsSyncing(true)
    try {
      const url = isToken ? 'https://api.github.com/user/repos?sort=updated&per_page=10' : `https://api.github.com/users/${authIdentifier}/repos?sort=updated&per_page=10`
      const headers = isToken ? { Authorization: `Bearer ${authIdentifier}` } : {}
      const res = await fetch(url, { headers })
      
      if (!res.ok) {
        setFeedProjects(existingDbProjects)
        setMyProjects(existingDbProjects.filter(p => p.user_id === currentUser.id))
        return
      }

      const data = await res.json()
      if (Array.isArray(data)) {
        const githubDataToInsert = data.map(repo => ({
          id: repo.id.toString(), 
          user_id: currentUser.id,
          title: repo.name,
          tag: repo.language || 'Protocol',
          skills: [repo.language, 'Architecture', 'Open Source'].filter(Boolean), 
          desc: repo.description || 'Verified via GitHub Sync. Building scalable solutions.',
          link: repo.html_url,
          created_at: repo.pushed_at, 
          author_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.user_name || currentUser.email.split('@')[0],
          author_avatar: currentUser.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp',
          author_designation: currentUser.user_metadata?.designation || 'Software Engineer'
        }))
        
        const existingIds = new Set(existingDbProjects.map(p => p.id))
        const uniqueGithubData = githubDataToInsert.filter(repo => !existingIds.has(repo.id))

        if (uniqueGithubData.length > 0) {
           const { error } = await supabase.from('projects').upsert(uniqueGithubData)
           if (error) {
               alert("Supabase Database Error (GitHub Sync): " + error.message)
               return 
           }
        }

        const finalProjects = [...uniqueGithubData, ...existingDbProjects].sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
        setFeedProjects(finalProjects)
        setMyProjects(finalProjects.filter(p => p.user_id === currentUser.id))
      }
    } catch (e) { 
      console.error("Sync error:", e)
      setFeedProjects(existingDbProjects)
      setMyProjects(existingDbProjects.filter(p => p.user_id === currentUser.id))
    } finally { 
      setIsSyncing(false) 
    }
  }

  const handleToggleVouch = async (projectId) => {
    if (!user?.id) return;
    
    const project = feedProjects.find(p => p.id === projectId) || myProjects.find(p => p.id === projectId);
    const isCurrentlyVouched = vouchedIds.includes(projectId);

    if (isCurrentlyVouched) {
      setVouchedIds(prev => prev.filter(id => id !== projectId));
      setGlobalVouchCounts(prev => ({ ...prev, [projectId]: Math.max(0, (prev[projectId] || 1) - 1) }));
      
      try {
        await supabase.from('vouches').delete().match({ project_id: projectId, voucher_id: user.id });
      } catch (e) {
        console.error("Error un-vouching:", e);
      }
    } else {
      setVouchedIds(prev => [...prev, projectId]);
      setGlobalVouchCounts(prev => ({ ...prev, [projectId]: (prev[projectId] || 0) + 1 }));
      
      try {
        await supabase.from('vouches').insert({ project_id: projectId, voucher_id: user.id });

        if (project && project.user_id !== user.id) {
            await supabase.from('notifications').insert({
               user_id: project.user_id,
               actor_name: user.user_metadata?.full_name || user.user_metadata?.user_name || user.email.split('@')[0] || 'A Builder',
               actor_avatar: user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp',
               project_id: projectId,
               project_title: project.title,
               type: 'vouch'
            });
        }
      } catch (e) {
        console.error("Error vouching:", e);
      }
    }
  }

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!user) return

    const rawSkills = newProjectForm.tag ? newProjectForm.tag.split(',').map(s => s.trim()).filter(Boolean) : [];
    const customId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    const newProject = {
      id: customId,
      user_id: user.id,
      title: newProjectForm.title,
      desc: newProjectForm.desc,
      link: newProjectForm.link,
      tag: rawSkills[0] || 'Design',
      skills: rawSkills.length > 0 ? rawSkills : ['Design'],
      created_at: new Date().toISOString(),
      author_name: user.user_metadata?.full_name || user.user_metadata?.user_name || user.email.split('@')[0],
      author_avatar: user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp',
      author_designation: designation || 'Builder',
      image_url: newProjectForm.image_url
    }

    try {
      const { error } = await supabase.from('projects').insert([newProject])
      if (error) throw error

      setFeedProjects(prev => [newProject, ...prev])
      setMyProjects(prev => [newProject, ...prev])
      setIsAddingProject(false)
      setNewProjectForm({ title: '', desc: '', link: '', tag: '', image_url: '' })
    } catch (error) {
      alert("Error adding project: " + error.message)
    }
  }

  const handleGithubLogin = () => {
    supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/auth/callback`, scopes: 'repo read:user' } })
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setAuthMsg({ text: 'Processing...', type: 'info' })
    if (isLoginView) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setAuthMsg({ text: error.message, type: 'error' })
      else window.location.reload()
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback` }})
      if (error) setAuthMsg({ text: error.message, type: 'error' })
      else setAuthMsg({ text: 'Success! Check your email to confirm your account.', type: 'success' })
    }
  }

  const saveProfile = async () => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: profileForm.full_name, bio: profileForm.bio, avatar_url: profileForm.avatar_url }
      })
      if (error) throw error
      
      await supabase.from('projects').update({
          author_name: profileForm.full_name,
          author_avatar: profileForm.avatar_url
      }).eq('user_id', user.id)

      setUser(data.user) 
      setIsEditingProfile(false) 
      
      window.location.reload()
    } catch (error) { alert("Error updating profile: " + error.message) }
  }

  const handleSaveDesignation = async () => {
    try {
      const { error } = await supabase.auth.updateUser({ data: { designation: tempDesignation } })
      if (error) throw error

      await supabase.from('projects').update({ author_designation: tempDesignation }).eq('user_id', user.id)

      setDesignation(tempDesignation)
      setIsEditingDesignation(false)
      window.location.reload()
    } catch (error) { alert("Error updating designation: " + error.message) }
  }

  const updateProjectInDb = async (projectId, updates) => {
    try {
      const { data, error } = await supabase.from('projects').update(updates).eq('id', projectId).select()
      if (error) throw error

      if (!data || data.length === 0) {
          alert("Update Blocked: You need to disable Row Level Security (RLS) on the 'projects' table in Supabase.")
          return
      }

      setFeedProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p))
      setMyProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p))
    } catch (error) { alert("Supabase Error: " + error.message) }
  }

  const deleteProjectInDb = async (projectId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this project? This cannot be undone.");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;
      setFeedProjects(prev => prev.filter(p => p.id !== projectId));
      setMyProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error) {
      alert("Error deleting project: " + error.message);
    }
  }

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm("Are you absolutely sure? This will permanently delete your profile, all your projects, and all your vouches. This cannot be undone.");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;

      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      alert("Error deleting account: " + error.message);
    }
  }

  if (loading) return <div className="h-screen bg-[#0A0D14] flex items-center justify-center text-blue-500 animate-pulse font-bold text-2xl">Initializing Network...</div>

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0D14] flex flex-col items-center justify-center p-4 relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[400px] bg-[#151821] border border-white/5 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-black/50 relative z-10">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(37,99,235,0.4)]"><CheckCircle2 size={28} className="text-white" strokeWidth={2.5} /></div>
            <h1 className="text-2xl font-black text-white text-center tracking-tight mb-2">{isLoginView ? 'Welcome Back' : 'Join Vouch'}</h1>
            <p className="text-sm text-gray-400 text-center mb-8">{isLoginView ? 'Sign in to continue.' : 'Showcase projects. Earn reputation.'}</p>
            <button onClick={handleGithubLogin} className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-3 text-sm font-bold text-white transition-all mb-6"><Github size={18}/> Continue with GitHub</button>
            <div className="relative flex items-center py-2 mb-6"><div className="flex-grow border-t border-white/5"></div><span className="flex-shrink-0 mx-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest">OR</span><div className="flex-grow border-t border-white/5"></div></div>
            <form onSubmit={handleEmailAuth} className="space-y-4">
               <div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full bg-[#0A0D14] border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"/></div>
               <div className="relative"><Zap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" /><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" className="w-full bg-[#0A0D14] border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"/></div>
               {authMsg.text && (<p className={`text-xs font-medium text-center ${authMsg.type === 'error' ? 'text-red-400' : authMsg.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>{authMsg.text}</p>)}
               <button type="submit" className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all flex justify-center items-center gap-2 group">{isLoginView ? 'Log In' : 'Create Account'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></button>
            </form>
            <p className="text-xs text-gray-400 text-center mt-8">{isLoginView ? "Don't have an account? " : "Already have an account? "} <button onClick={() => {setIsLoginView(!isLoginView); setAuthMsg({text: '', type: ''})}} className="text-blue-400 font-bold hover:text-blue-300">{isLoginView ? 'Sign up' : 'Log in'}</button></p>
         </motion.div>
      </div>
    )
  }

  // --- NEW: Calculate the active projects based on the 3 filters! ---
  let activeProjects = feedProjects;
  if (feedFilter === 'following') {
    activeProjects = feedProjects.filter(p => followingIds.includes(p.user_id));
  } else if (feedFilter === 'trending') {
    activeProjects = [...feedProjects].sort((a, b) => {
      const countA = globalVouchCounts[a.id] || 0;
      const countB = globalVouchCounts[b.id] || 0;
      return countB - countA;
    });
  }

  const topSkills = Object.entries(
    myProjects.reduce((acc, proj) => {
      const skillsList = (proj.skills && proj.skills.length > 0) ? proj.skills : [proj.tag || 'Protocol'];
      const score = globalVouchCounts[proj.id] || 0; 
      skillsList.forEach(skill => { acc[skill] = (acc[skill] || 0) + score; });
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <main className="min-h-screen bg-[#0A0D14] text-white font-sans selection:bg-blue-500/30 relative">
      
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#151821] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md relative">
              <button onClick={() => setIsEditingProfile(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full"><X size={18} /></button>
              <h2 className="text-xl font-bold text-white mb-6">Edit Profile</h2>
              <div className="space-y-4">
                <div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Display Name</label><input type="text" value={profileForm.full_name} onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})} className="w-full bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" /></div>
                <div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Bio</label><input type="text" value={profileForm.bio} onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})} className="w-full bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" /></div>
                <div><label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Avatar URL</label><input type="text" value={profileForm.avatar_url} onChange={(e) => setProfileForm({...profileForm, avatar_url: e.target.value})} className="w-full bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" /></div>
                <button onClick={saveProfile} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl mt-4 transition-colors">Save Changes</button>
              </div>

              <div className="mt-8 pt-6 border-t border-red-500/20">
                <h3 className="text-red-400 text-xs font-bold uppercase tracking-wider mb-3">Danger Zone</h3>
                <button 
                  onClick={handleDeleteAccount} 
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl border border-red-500/20 transition-colors"
                >
                  Delete Account Permanently
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddingProject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#151821] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-lg relative my-8">
              <button onClick={() => setIsAddingProject(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full"><X size={18} /></button>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Sparkles className="text-blue-500" size={20}/> Post a Project</h2>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Project Title <span className="text-red-500">*</span></label>
                  <input type="text" required value={newProjectForm.title} onChange={(e) => setNewProjectForm({...newProjectForm, title: e.target.value})} placeholder="e.g. Modern Landing Page Design" className="w-full bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Description <span className="text-red-500">*</span></label>
                  <textarea required value={newProjectForm.desc} onChange={(e) => setNewProjectForm({...newProjectForm, desc: e.target.value})} placeholder="What did you build? What problem does it solve?" rows={3} className="w-full bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 resize-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">External Link</label>
                  <input type="url" value={newProjectForm.link} onChange={(e) => setNewProjectForm({...newProjectForm, link: e.target.value})} placeholder="https://dribbble.com/... or https://yoursite.com" className="w-full bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Skills / Tags (Comma separated)</label>
                  <input type="text" value={newProjectForm.tag} onChange={(e) => setNewProjectForm({...newProjectForm, tag: e.target.value})} placeholder="Figma, UI/UX, React..." className="w-full bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Cover Image URL</label>
                  <input type="url" value={newProjectForm.image_url} onChange={(e) => setNewProjectForm({...newProjectForm, image_url: e.target.value})} placeholder="https://imgur.com/...png" className="w-full bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" />
                </div>
                <button type="submit" className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl mt-6 transition-colors shadow-lg shadow-blue-600/20">
                  Publish to Network
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="sticky top-0 z-50 bg-[#0A0D14]/90 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <CheckCircle2 size={18} className="text-white" strokeWidth={3}/>
          </div>
          <span className="text-xl font-bold tracking-tight hidden md:block">Vouch</span>
        </div>

        <div className="hidden md:flex items-center bg-[#151821] rounded-full px-5 py-2.5 w-[500px] border border-white/5 focus-within:border-blue-500/50 transition-colors">
           {isSearching ? (
             <RefreshCw size={18} className="text-blue-500 mr-3 animate-spin" />
           ) : (
             <Search size={18} className="text-gray-500 mr-3" />
           )}
           <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search the global network..." className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-gray-500" />
        </div>

        <div className="flex items-center gap-6">
          
          <div className="relative">
            <div className="relative cursor-pointer" onClick={handleToggleNotifications}>
              <Bell size={20} className={`transition-colors ${showNotifications ? 'text-white' : 'text-gray-400 hover:text-white'}`} />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0A0D14]"></div>
              )}
            </div>
            
            {showNotifications && (
              <div className="absolute top-10 right-0 w-80 bg-[#151821] border border-white/10 rounded-2xl shadow-2xl p-4 z-50">
                <h3 className="text-sm font-bold text-white mb-3">Notifications</h3>
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} className={`flex gap-3 items-start p-3 rounded-xl ${n.is_read ? 'bg-white/5 opacity-70' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                        <div className={`p-2 rounded-lg ${n.type === 'vouch' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                           {n.type === 'vouch' ? <Heart size={14}/> : <MessageSquare size={14}/>}
                        </div>
                        <div>
                           <p className="text-xs text-gray-300">
                             <span className="text-white font-bold">{n.actor_name}</span> {n.type === 'vouch' ? 'vouched for' : 'commented on'} your project <span className="text-white font-medium">{n.project_title}</span>
                           </p>
                           <p className="text-[10px] text-gray-500 mt-1">{timeAgo(n.created_at)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 text-center italic py-4">No notifications yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <MessageSquare size={20} className="text-gray-400 hover:text-white cursor-pointer transition-colors hidden sm:block" />
          
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
             <button onClick={() => setIsEditingProfile(true)} className="relative group rounded-full overflow-hidden border border-white/10 focus:ring-2 focus:ring-blue-500 transition-all">
               <img src={user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} className="w-9 h-9 object-cover" alt="Edit Profile" />
               <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={12} className="text-white" /></div>
             </button>
             <form action={signOut}><button type="submit" className="text-gray-500 hover:text-red-500 transition-colors mt-1"><LogOut size={18}/></button></form>
          </div>
       </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-10 pb-20 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <aside className="hidden lg:flex flex-col gap-6">
           <div className="bg-[#151821] rounded-3xl p-8 flex flex-col items-center relative border border-white/5 overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-600/20 to-transparent" />
             <button onClick={() => setIsEditingProfile(true)} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-blue-600 rounded-full text-white/70 hover:text-white backdrop-blur-md transition-all z-20 opacity-0 group-hover:opacity-100"><Edit2 size={14} /></button>
             <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#151821] shadow-2xl relative z-10 mb-4 group-hover:scale-105 transition-transform"><img src={user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'} className="w-full h-full object-cover" /></div>
             <div className="absolute top-24 right-1/2 translate-x-10 translate-y-2 bg-blue-500 rounded-full p-1 border-[3px] border-[#151821] z-20"><CheckCircle2 size={12} className="text-white" strokeWidth={4} /></div>
             <h2 className="text-xl font-bold tracking-tight text-white text-center mt-2 flex items-center gap-2">{user.user_metadata?.full_name || user.user_metadata?.user_name || user.email.split('@')[0]}</h2>
             
             <div className="relative mt-1 group w-full flex justify-center">
                {isEditingDesignation ? (
                  <div className="flex items-center gap-1.5 bg-[#0A0D14] border border-white/10 rounded-lg p-1">
                    <input type="text" value={tempDesignation} onChange={(e) => setTempDesignation(e.target.value)} className="bg-transparent border-none outline-none text-sm text-white px-2 py-0.5 w-40 text-center" autoFocus/>
                    <button onClick={handleSaveDesignation} className="p-1 text-green-400 hover:text-green-300"><Save size={14} /></button>
                    <button onClick={() => setIsEditingDesignation(false)} className="p-1 text-red-400 hover:text-red-300"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 text-center">{designation}</p>
                    <button onClick={() => { setTempDesignation(designation); setIsEditingDesignation(true); }} className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-white bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={12} /></button>
                  </>
                )}
             </div>
           </div>

           <button onClick={() => setIsAddingProject(true)} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-2xl p-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 text-white font-bold">
              <Plus size={18} strokeWidth={3} /> Post a Project
           </button>

           <div className="bg-[#151821] rounded-3xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2.5 bg-purple-500/10 rounded-xl"><Trophy size={18} className="text-purple-400" /></div>
                 <h3 className="font-bold text-white tracking-tight">My Top Vouched</h3>
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
                ) : (<p className="text-xs text-gray-500 text-center italic py-4">Publish projects to rank skills.</p>)}
              </div>
           </div>
        </aside>

        <div className="col-span-1 lg:col-span-3 space-y-8">
           
           {/* --- NEW: The 3-Button Filter System --- */}
           <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex bg-[#151821] p-1.5 rounded-2xl border border-white/5 w-fit">
                <button 
                  onClick={() => setFeedFilter('global')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${feedFilter === 'global' ? 'bg-[#232733] text-white shadow-sm border border-white/5' : 'text-gray-500 hover:text-gray-400'}`}
                >
                  <Globe size={16} className={feedFilter === 'global' ? 'text-blue-500' : ''}/> Global
                </button>
                <button 
                  onClick={() => setFeedFilter('trending')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${feedFilter === 'trending' ? 'bg-[#232733] text-white shadow-sm border border-white/5' : 'text-gray-500 hover:text-gray-400'}`}
                >
                  <Flame size={16} className={feedFilter === 'trending' ? 'text-orange-500' : ''}/> Trending
                </button>
                <button 
                  onClick={() => setFeedFilter('following')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${feedFilter === 'following' ? 'bg-[#232733] text-white shadow-sm border border-white/5' : 'text-gray-500 hover:text-gray-400'}`}
                >
                  <Users size={16} className={feedFilter === 'following' ? 'text-purple-500' : ''}/> Following
                </button>
              </div>
              <button onClick={() => setIsAddingProject(true)} className="lg:hidden flex items-center gap-2 px-5 py-2.5 bg-blue-600 rounded-2xl text-sm font-bold text-white transition-colors">
                <Plus size={16}/> Post Project
              </button>
           </div>

           <div className="space-y-6">
              {activeProjects.length > 0 ? (
                activeProjects.map((proj) => (
                  <FeedCard 
                    key={proj.id} 
                    {...proj} 
                    currentUser={user}
                    currentUserId={user.id}
                    vouchCount={globalVouchCounts[proj.id] || 0}
                    vouched={vouchedIds.includes(proj.id)}
                    onVouch={() => handleToggleVouch(proj.id)}
                    onUpdateProject={updateProjectInDb}
                    onDeleteProject={deleteProjectInDb}
                  />
                ))
              ) : (
                <div className="bg-[#151821] border border-white/5 rounded-3xl p-16 text-center">
                  {feedFilter === 'following' ? (
                     <>
                        <Users size={32} className="text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 font-medium">You aren't following anyone yet, or they haven't posted.</p>
                     </>
                  ) : searchQuery ? (
                     <p className="text-gray-400 font-medium">No projects match "{searchQuery}" on the global network.</p>
                  ) : (
                     <><RefreshCw size={32} className="text-gray-600 mx-auto mb-4 animate-spin" /><p className="text-gray-400 font-medium">Syncing global network...</p></>
                  )}
                </div>
              )}
           </div>
        </div>

      </div>
    </main>
  )
}

function FeedCard({ id, user_id, title, tag, skills, desc, link, vouchCount, onVouch, vouched, author_name, author_avatar, author_designation, created_at, image_url, onUpdateProject, onDeleteProject, currentUserId, currentUser }) {
  const isOwner = user_id === currentUserId;

  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tempTags, setTempTags] = useState(skills?.join(', ') || tag);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState(image_url || '');

  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editDesc, setEditDesc] = useState(desc);
  const [editLink, setEditLink] = useState(link || '');

  const saveProjectDetails = async () => {
    await onUpdateProject(id, { title: editTitle, desc: editDesc, link: editLink });
    setIsEditingProject(false);
  }

  const saveTags = async () => {
    const newSkills = tempTags.split(',').map(s => s.trim()).filter(Boolean);
    await onUpdateProject(id, { skills: newSkills, tag: newSkills[0] || 'Protocol' });
    setIsEditingTags(false);
  }

  const saveImage = async () => {
    await onUpdateProject(id, { image_url: tempImageUrl });
    setIsEditingImage(false);
  }

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  const toggleComments = async () => {
    if (!showComments) {
      const { data } = await supabase.from('comments').select('*').eq('project_id', id).order('created_at', { ascending: true });
      if (data) setComments(data);
    }
    setShowComments(!showComments);
  }

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);

    const commentObj = {
      project_id: id,
      user_id: currentUserId,
      content: newComment.trim(),
      author_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.user_name || currentUser.email.split('@')[0] || 'Builder',
      author_avatar: currentUser.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp'
    };

    try {
      const { data, error } = await supabase.from('comments').insert([commentObj]).select();
      if (error) throw error;
      
      if (!data || data.length === 0) {
          alert("Save Blocked! Please go to Supabase -> Table Editor -> 'comments' -> and turn OFF Row Level Security (RLS).");
          setIsSubmittingComment(false);
          return; 
      }
      
      if (data) setComments(prev => [...prev, data[0]]);
      setNewComment('');

      if (!isOwner) {
          supabase.from('notifications').insert({
             user_id: user_id, 
             actor_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.user_name || currentUser.email.split('@')[0] || 'A Builder',
             actor_avatar: currentUser.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp',
             project_id: id,
             project_title: title,
             type: 'comment'
          }).then();
      }

    } catch (err) {
      alert("Error posting comment: " + err.message);
    } finally {
      setIsSubmittingComment(false);
    }
  }

  const deleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      alert("Error deleting comment: " + err.message);
    }
  }

  const saveEditedComment = async (commentId) => {
    if (!editCommentText.trim()) return;
    try {
      const { error } = await supabase.from('comments').update({ content: editCommentText }).eq('id', commentId);
      if (error) throw error;
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editCommentText } : c));
      setEditingCommentId(null);
    } catch (err) {
      alert("Error saving comment: " + err.message);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#151821] border border-white/5 rounded-[2rem] p-6 sm:p-8 hover:border-white/10 transition-colors shadow-xl shadow-black/50">
      
      <div className="flex justify-between items-start mb-6">
         <div className="flex items-center gap-4">
            <Link href={`/profile/${user_id}`}>
              <img src={author_avatar || 'https://www.gravatar.com/avatar/?d=mp'} className="w-12 h-12 rounded-full border border-white/10 object-cover cursor-pointer hover:opacity-80 transition-opacity" alt="Author" />
            </Link>
            <div>
              <Link href={`/profile/${user_id}`} className="flex items-center gap-1.5 cursor-pointer hover:underline decoration-white/30">
                <h4 className="font-bold text-white tracking-tight">{author_name || 'Network Builder'}</h4>
                <CheckCircle2 size={16} className="text-blue-500" strokeWidth={3} />
              </Link>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{author_designation || 'Builder'} • {timeAgo(created_at)}</p>
            </div>
         </div>

         {isOwner && (
           <div className="relative">
             <button onClick={() => setShowProjectMenu(!showProjectMenu)} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
               <MoreHorizontal size={20} />
             </button>
             {showProjectMenu && (
               <div className="absolute right-0 top-10 w-40 bg-[#1A1D27] border border-white/10 rounded-xl shadow-2xl py-1 z-50 overflow-hidden">
                 <button onClick={() => { setIsEditingProject(true); setShowProjectMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 flex items-center gap-2"><Edit2 size={14}/> Edit Info</button>
                 <button onClick={() => { onDeleteProject(id); setShowProjectMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5"><Trash2 size={14}/> Delete</button>
               </div>
             )}
           </div>
         )}
      </div>

      {isEditingProject ? (
        <div className="space-y-4 mb-6 bg-[#0A0D14] p-4 rounded-2xl border border-white/10">
           <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Project Title" className="w-full bg-transparent border-b border-white/10 px-2 py-2 text-xl font-bold text-white outline-none focus:border-blue-500" />
           <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Project Description" rows={3} className="w-full bg-transparent border-b border-white/10 px-2 py-2 text-sm text-gray-300 outline-none focus:border-blue-500 resize-none" />
           <input type="url" value={editLink} onChange={e => setEditLink(e.target.value)} placeholder="External Link (Optional)" className="w-full bg-transparent border-b border-white/10 px-2 py-2 text-sm text-blue-400 outline-none focus:border-blue-500" />
           <div className="flex gap-2 justify-end mt-2">
              <button onClick={() => setIsEditingProject(false)} className="px-4 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5">Cancel</button>
              <button onClick={saveProjectDetails} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-1"><Save size={12}/> Save Info</button>
           </div>
        </div>
      ) : (
        <>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">{title}</h2>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6 max-w-3xl whitespace-pre-line">{desc}</p>
        </>
      )}

      <div className="flex items-center gap-2 mb-8 group relative flex-wrap">
          {isEditingTags ? (
              <div className="flex items-center gap-2 bg-[#0A0D14] border border-white/10 rounded-lg p-1.5 w-full max-w-lg">
                <input type="text" value={tempTags} onChange={(e) => setTempTags(e.target.value)} placeholder="Comma-separated skills..." className="bg-transparent border-none outline-none text-xs text-white px-2 py-0.5 w-full" autoFocus/>
                <button onClick={saveTags} className="p-1 text-green-400 hover:text-green-300"><Save size={14} /></button>
                <button onClick={() => setIsEditingTags(false)} className="p-1 text-red-400 hover:text-red-300"><X size={14} /></button>
              </div>
          ) : (
            <>
                {skills && skills.length > 0 ? (
                    skills.map((skill, index) => (<span key={index} className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-xs text-gray-300 font-medium hover:bg-white/10 cursor-pointer transition-colors">{skill}</span>))
                ) : (<span className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-xs text-gray-300 font-medium hover:bg-white/10 cursor-pointer transition-colors">{tag || 'Architecture'}</span>)}
                 
                 {isOwner && (
                   <button onClick={() => setIsEditingTags(true)} className="p-1.5 text-gray-600 hover:text-white bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={12} /></button>
                 )}
            </>
          )}
      </div>

      <div className="relative group overflow-hidden rounded-2xl mb-6 border border-white/5 bg-[#0A0D14] min-h-[256px]">
          {isEditingImage ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#151821] p-8 z-30">
                 <input type="text" value={tempImageUrl} onChange={(e) => setTempImageUrl(e.target.value)} placeholder="Paste new image URL..." className="w-full bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500" autoFocus/>
                <div className="flex gap-2">
                    <button onClick={saveImage} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-sm transition-colors"><Save size={14}/> Save Image</button>
                    <button onClick={() => setIsEditingImage(false)} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl text-sm transition-colors"><X size={14}/> Cancel</button>
                </div>
              </div>
          ) : (
              isOwner && (
                <button onClick={() => setIsEditingImage(true)} className="absolute top-4 right-4 p-3 bg-black/60 hover:bg-blue-600 rounded-full text-white/70 hover:text-white backdrop-blur-md transition-all z-20 opacity-0 group-hover:opacity-100"><ImageIcon size={16} /></button>
              )
          )}
          
          <a href={link || '#'} target={link ? "_blank" : "_self"} rel="noopener noreferrer" className={`block relative h-full ${!link && 'cursor-default'}`}>
             <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />
             {image_url ? (
                <img src={image_url} alt={title} className="w-full h-full object-cover rounded-2xl h-64 sm:h-80" />
             ) : (
                 <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-blue-900/20 via-[#151821] to-purple-900/20 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full -top-1/2 -left-1/4 group-hover:bg-blue-500/20 transition-colors duration-700" />
                    <Sparkles size={48} className="text-white/10 mb-4 z-20" />
                    <span className="font-mono text-white/20 text-3xl font-black tracking-widest uppercase z-20">{title.substring(0, 3)}</span>
                 </div>
             )}
             {link && (
               <div className="absolute bottom-4 right-4 z-20 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"><span className="text-xs font-bold text-white">View Source</span><ExternalLink size={14} className="text-white"/></div>
             )}
          </a>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
         <div className="flex items-center gap-6">
            <button onClick={onVouch} className={`flex items-center gap-2 text-sm font-medium transition-colors ${vouched ? 'text-blue-500 hover:text-blue-400' : 'text-gray-400 hover:text-white'}`}>
               <Heart size={18} className={vouched ? 'fill-blue-500' : ''} />
               <span>{vouchCount}</span>
            </button>
            <button onClick={toggleComments} className={`flex items-center gap-2 text-sm font-medium transition-colors ${showComments ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
               <MessageSquare size={18} /><span>{comments.length > 0 ? `${comments.length} Comments` : 'Discuss'}</span>
            </button>
         </div>
         {vouched && (
           <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20"><CheckCircle2 size={14} className="text-blue-400" /><span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Vouched</span></div>
         )}
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-6 border-t border-white/5 mt-6 space-y-4">
              
              {comments.length > 0 ? (
                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <img src={c.author_avatar || 'https://www.gravatar.com/avatar/?d=mp'} className="w-8 h-8 rounded-full bg-white/10 border border-white/5 object-cover" alt="Avatar"/>
                      
                      <div className="flex-1 bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-white">{c.author_name}</span>
                          <span className="text-[10px] text-gray-500">{timeAgo(c.created_at)}</span>
                        </div>

                        {editingCommentId === c.id ? (
                          <div className="mt-2 flex gap-2">
                             <input type="text" value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} autoFocus className="flex-1 bg-[#0A0D14] border border-white/10 rounded-lg px-2 py-1 text-sm text-white outline-none focus:border-blue-500"/>
                             <button onClick={() => saveEditedComment(c.id)} className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded font-bold hover:bg-blue-500">Save</button>
                             <button onClick={() => setEditingCommentId(null)} className="text-[10px] bg-white/10 text-white px-2 py-1 rounded hover:bg-white/20">Cancel</button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-300">{c.content}</p>
                            
                            {c.user_id === currentUserId && (
                              <div className="flex gap-3 mt-2">
                                <button onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.content); }} className="text-[10px] font-bold text-gray-500 hover:text-blue-400 transition-colors uppercase tracking-wider">Edit</button>
                                <button onClick={() => deleteComment(c.id)} className="text-[10px] font-bold text-gray-500 hover:text-red-400 transition-colors uppercase tracking-wider">Delete</button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center mb-4 italic">No comments yet. Start the discussion!</p>
              )}

              <form onSubmit={submitComment} className="flex gap-2">
                <input 
                  type="text" 
                  value={newComment} 
                  onChange={e => setNewComment(e.target.value)} 
                  placeholder="Leave a comment..." 
                  className="flex-1 bg-[#0A0D14] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                  type="submit" 
                  disabled={isSubmittingComment || !newComment.trim()} 
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Post
                </button>
              </form>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  )
}