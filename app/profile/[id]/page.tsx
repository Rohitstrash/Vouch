// @ts-nocheck
/* eslint-disable */
'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, CheckCircle2, Flame, Heart, MessageSquare, 
  ExternalLink, Sparkles, Trophy, Github, Globe, UserPlus, Check
} from 'lucide-react'

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

export default function PublicProfile() {
  const { id } = useParams()
  const [currentUser, setCurrentUser] = useState(null)
  const [profileUser, setProfileUser] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [vouchedIds, setVouchedIds] = useState([])
  const [globalVouchCounts, setGlobalVouchCounts] = useState({})
  
  // --- NEW: Connection State ---
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        let loggedInUser = null;
        
        if (session) {
            loggedInUser = session.user;
            setCurrentUser(loggedInUser);
        }

        const { data: allVouches } = await supabase.from('vouches').select('project_id')
        if (allVouches) {
          const counts = {}
          allVouches.forEach(v => { counts[v.project_id] = (counts[v.project_id] || 0) + 1 })
          setGlobalVouchCounts(counts)
        }

        if (loggedInUser) {
          const { data: myVouches } = await supabase.from('vouches').select('project_id').eq('voucher_id', loggedInUser.id)
          if (myVouches) setVouchedIds(myVouches.map(v => v.project_id))
          
          // Check if I am following this profile
          const { data: connection } = await supabase.from('connections').select('*').eq('follower_id', loggedInUser.id).eq('following_id', id)
          if (connection && connection.length > 0) setIsFollowing(true)
        }

        // Get this profile's total followers
        const { data: followers } = await supabase.from('connections').select('follower_id').eq('following_id', id)
        if (followers) setFollowerCount(followers.length)

        const { data: userProjects } = await supabase.from('projects').select('*').eq('user_id', id).order('created_at', { ascending: false })
        if (userProjects && userProjects.length > 0) {
          setProjects(userProjects)
          setProfileUser({
            name: userProjects[0].author_name,
            avatar: userProjects[0].author_avatar,
            designation: userProjects[0].author_designation
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [id])

  // --- NEW: Handle Connect / Follow Logic ---
  const handleConnect = async () => {
      if (!currentUser) return alert("You must be logged in to connect with builders!");
      
      if (isFollowing) {
          setIsFollowing(false);
          setFollowerCount(prev => prev - 1);
          await supabase.from('connections').delete().match({ follower_id: currentUser.id, following_id: id });
      } else {
          setIsFollowing(true);
          setFollowerCount(prev => prev + 1);
          await supabase.from('connections').insert({ follower_id: currentUser.id, following_id: id });
          
          // Send notification!
          await supabase.from('notifications').insert({
             user_id: id, 
             actor_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.user_name || currentUser.email.split('@')[0] || 'A Builder',
             actor_avatar: currentUser.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/?d=mp',
             type: 'connect',
             project_title: 'your network' // Reusing this column for the UI message format
          });
      }
  }

  const handleVouch = async (projectId) => {
    if (!currentUser?.id) return;
    
    const isCurrentlyVouched = vouchedIds.includes(projectId);

    if (isCurrentlyVouched) {
      setVouchedIds(prev => prev.filter(vid => vid !== projectId));
      setGlobalVouchCounts(prev => ({ ...prev, [projectId]: Math.max(0, (prev[projectId] || 1) - 1) }));
      await supabase.from('vouches').delete().match({ project_id: projectId, voucher_id: currentUser.id });
    } else {
      setVouchedIds(prev => [...prev, projectId]);
      setGlobalVouchCounts(prev => ({ ...prev, [projectId]: (prev[projectId] || 0) + 1 }));
      await supabase.from('vouches').insert({ project_id: projectId, voucher_id: currentUser.id });
    }
  }

  if (loading) return <div className="h-screen bg-[#0A0D14] flex items-center justify-center text-blue-500 animate-pulse font-bold text-2xl">Loading Profile...</div>

  if (!profileUser) return (
    <div className="min-h-screen bg-[#0A0D14] flex flex-col items-center justify-center p-4">
       <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
       <Link href="/" className="text-blue-500 hover:text-blue-400 flex items-center gap-2"><ArrowLeft size={16}/> Back to Home</Link>
    </div>
  )

  const topSkills = Object.entries(
    projects.reduce((acc, proj) => {
      const skillsList = (proj.skills && proj.skills.length > 0) ? proj.skills : [proj.tag || 'Protocol'];
      const score = globalVouchCounts[proj.id] || 0; 
      skillsList.forEach(skill => {
          acc[skill] = (acc[skill] || 0) + score;
      });
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <main className="min-h-screen bg-[#0A0D14] text-white font-sans selection:bg-blue-500/30">
      <nav className="sticky top-0 z-50 bg-[#0A0D14]/90 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
           <Link href="/" className="flex items-center gap-3 group">
             <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:bg-blue-500 transition-colors">
               <ArrowLeft size={16} className="text-white" strokeWidth={3}/>
             </div>
             <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors hidden sm:block">Back to Network</span>
           </Link>
           <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center"><CheckCircle2 size={12} className="text-white" strokeWidth={3}/></div>
             <span className="text-lg font-bold tracking-tight">Vouch</span>
           </div>
        </div>
      </nav>

      <div className="max-w-[1000px] mx-auto px-4 md:px-8 pt-12 pb-20">
        
        <div className="bg-[#151821] border border-white/5 rounded-[2.5rem] p-8 md:p-12 mb-12 relative overflow-hidden flex flex-col md:flex-row items-center md:items-start gap-8">
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
           
           <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#0A0D14] shadow-2xl relative z-10 overflow-hidden shrink-0">
              <img src={profileUser.avatar || 'https://www.gravatar.com/avatar/?d=mp'} className="w-full h-full object-cover" alt="Profile" />
           </div>
           
           <div className="flex-1 text-center md:text-left z-10 w-full">
              <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2 justify-center md:justify-start">
                 <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{profileUser.name}</h1>
                 <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20 w-fit mx-auto md:mx-0"><CheckCircle2 size={14} className="text-blue-400" /><span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Verified Builder</span></div>
              </div>
              <p className="text-lg text-gray-400 mb-6">{profileUser.designation}</p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-6 border-t border-white/5 pt-6 w-full">
                 <div className="flex gap-6">
                    <div><p className="text-2xl font-bold text-white">{projects.length}</p><p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Projects</p></div>
                    <div><p className="text-2xl font-bold text-blue-400">{Object.values(globalVouchCounts).reduce((a, b) => a + b, 0)}</p><p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Vouches</p></div>
                    <div><p className="text-2xl font-bold text-purple-400">{followerCount}</p><p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Followers</p></div>
                 </div>
                 
                 {/* --- NEW: Connect / Follow Button --- */}
                 {currentUser && currentUser.id !== id && (
                    <div className="sm:ml-auto">
                      <button onClick={handleConnect} className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg ${isFollowing ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 shadow-none border border-transparent' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20'}`}>
                        {isFollowing ? <><Check size={16}/> Following</> : <><UserPlus size={16}/> Connect</>}
                      </button>
                    </div>
                 )}
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           <div className="lg:col-span-1">
             <div className="bg-[#151821] rounded-3xl p-6 border border-white/5 sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                   <div className="p-2.5 bg-purple-500/10 rounded-xl"><Trophy size={18} className="text-purple-400" /></div>
                   <h3 className="font-bold text-white tracking-tight">Top Vouched Skills</h3>
                </div>
                <div className="space-y-4">
                  {topSkills.length > 0 ? (
                    topSkills.map((skill, i) => (
                      <div key={skill.name} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           <span className="text-xs font-bold text-gray-600 w-3">{i + 1}</span>
                           <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">{skill.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                           <CheckCircle2 size={10} className="text-purple-400" />
                           <span className="text-[10px] font-bold text-purple-400">{skill.count}</span>
                        </div>
                      </div>
                    ))
                  ) : (<p className="text-xs text-gray-500 italic py-4">No skills ranked yet.</p>)}
                </div>
             </div>
           </div>

           <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                 <Flame size={20} className="text-orange-500"/>
                 <h2 className="text-xl font-bold text-white tracking-tight">Portfolio & Projects</h2>
              </div>
              
              {projects.length > 0 ? (
                projects.map((proj) => (
                  <ProfileProjectCard 
                    key={proj.id} 
                    {...proj} 
                    vouchCount={globalVouchCounts[proj.id] || 0}
                    vouched={vouchedIds.includes(proj.id)}
                    onVouch={() => handleVouch(proj.id)}
                    currentUser={currentUser}
                  />
                ))
              ) : (
                <div className="bg-[#151821] border border-white/5 rounded-3xl p-12 text-center">
                   <Globe size={32} className="text-gray-600 mx-auto mb-4" />
                   <p className="text-gray-400 font-medium">This builder hasn't published any projects yet.</p>
                </div>
              )}
           </div>

        </div>
      </div>
    </main>
  )
}

function ProfileProjectCard({ id, title, tag, skills, desc, link, vouchCount, onVouch, vouched, created_at, image_url, currentUser }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#151821] border border-white/5 rounded-[2rem] p-6 sm:p-8 hover:border-white/10 transition-colors shadow-xl shadow-black/50">
      <div className="flex justify-between items-start mb-4">
         <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{timeAgo(created_at)}</span>
      </div>
      
      <p className="text-gray-400 text-sm leading-relaxed mb-6 whitespace-pre-line">{desc}</p>

      <div className="flex items-center gap-2 mb-8 flex-wrap">
          {skills && skills.length > 0 ? (
              skills.map((skill, index) => (<span key={index} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs text-gray-300 font-medium">{skill}</span>))
          ) : (<span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-xs text-gray-300 font-medium">{tag || 'Architecture'}</span>)}
      </div>

      <div className="relative group overflow-hidden rounded-2xl mb-6 border border-white/5 bg-[#0A0D14] min-h-[200px]">
          <a href={link || '#'} target={link ? "_blank" : "_self"} rel="noopener noreferrer" className={`block relative h-full ${!link && 'cursor-default'}`}>
             <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />
             {image_url ? (
                <img src={image_url} alt={title} className="w-full h-full object-cover rounded-2xl h-56 sm:h-72" />
             ) : (
                 <div className="w-full h-56 sm:h-72 bg-gradient-to-br from-blue-900/20 via-[#151821] to-purple-900/20 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full -top-1/2 -left-1/4 group-hover:bg-blue-500/20 transition-colors duration-700" />
                    <Sparkles size={32} className="text-white/10 mb-3 z-20" />
                    <span className="font-mono text-white/20 text-2xl font-black tracking-widest uppercase z-20">{title.substring(0, 3)}</span>
                 </div>
             )}
             {link && (
               <div className="absolute bottom-4 right-4 z-20 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"><span className="text-xs font-bold text-white">View Source</span><ExternalLink size={14} className="text-white"/></div>
             )}
          </a>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
         <div className="flex items-center gap-6">
            <button onClick={onVouch} disabled={!currentUser} className={`flex items-center gap-2 text-sm font-medium transition-colors ${vouched ? 'text-blue-500 hover:text-blue-400' : currentUser ? 'text-gray-400 hover:text-white' : 'text-gray-600 cursor-not-allowed'}`}>
               <Heart size={18} className={vouched ? 'fill-blue-500' : ''} />
               <span>{vouchCount}</span>
            </button>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
               <MessageSquare size={18} /><span>Discuss on Feed</span>
            </div>
         </div>
      </div>
    </motion.div>
  )
}