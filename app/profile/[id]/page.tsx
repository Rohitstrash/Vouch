// FORCE CLEAN BUILD
// @ts-nocheck
/* eslint-disable */
'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  CheckCircle2, Sparkles, Trophy, Github, Heart, MessageSquare, 
  MoreHorizontal, ExternalLink, ArrowLeft, UserPlus, Send
} from 'lucide-react'

// Helper for time
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
  const params = useParams()
  const profileId = params.id // Grabs the user ID from the URL

  const [loggedInUser, setLoggedInUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProjects, setUserProjects] = useState([])
  const [profileData, setProfileData] = useState(null)
  const [vouchedIds, setVouchedIds] = useState([]) 
  const [globalVouchCounts, setGlobalVouchCounts] = useState({})

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setLoggedInUser(session.user)
          // Get what the logged-in user has vouched for
          const { data: myVouches } = await supabase.from('vouches').select('project_id').eq('voucher_id', session.user.id)
          if (myVouches) setVouchedIds(myVouches.map(v => v.project_id))
        }

        // Get global vouch counts
        const { data: allVouches } = await supabase.from('vouches').select('project_id')
        if (allVouches) {
          const counts = {}
          allVouches.forEach(v => { counts[v.project_id] = (counts[v.project_id] || 0) + 1 })
          setGlobalVouchCounts(counts)
        }

        // Fetch specifically THIS user's projects
        const { data: projects } = await supabase.from('projects').select('*').eq('user_id', profileId).order('created_at', { ascending: false })
        
        if (projects && projects.length > 0) {
          setUserProjects(projects)
          // Extract their profile info from their most recent project
          setProfileData({
            name: projects[0].author_name,
            avatar: projects[0].author_avatar,
            designation: projects[0].author_designation
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [profileId])

  const handleVouch = async (projectId) => {
    if (!loggedInUser?.id || vouchedIds.includes(projectId)) return
    setVouchedIds(prev => [...prev, projectId])
    setGlobalVouchCounts(prev => ({ ...prev, [projectId]: (prev[projectId] || 0) + 1 }))
    try {
      await supabase.from('vouches').insert({ project_id: projectId, voucher_id: loggedInUser.id })
    } catch (e) {}
  }

  if (loading) return <div className="h-screen bg-[#0A0D14] flex items-center justify-center text-blue-500 animate-pulse font-bold text-2xl">Loading Profile...</div>

  if (!profileData) return (
    <div className="h-screen bg-[#0A0D14] flex flex-col items-center justify-center text-white space-y-4">
      <CheckCircle2 size={48} className="text-gray-600 mb-4" />
      <h1 className="text-2xl font-bold">Builder Not Found</h1>
      <p className="text-gray-500">This user hasn't published any projects yet.</p>
      <Link href="/" className="px-6 py-3 mt-4 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-500 transition-colors">Return to Feed</Link>
    </div>
  )

  // Calculate THIS user's specific leaderboard
  const topSkills = Object.entries(
    userProjects.reduce((acc, proj) => {
      const skill = proj.tag || 'Protocol';
      const score = globalVouchCounts[proj.id] || 0; 
      acc[skill] = (acc[skill] || 0) + score;
      return acc;
    }, {})
  ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <main className="min-h-screen bg-[#0A0D14] text-white font-sans selection:bg-blue-500/30">
      
      {/* TOP NAV (Simplified for Profile view) */}
      <nav className="sticky top-0 z-50 bg-[#0A0D14]/90 backdrop-blur-xl border-b border-white/5 px-4 md:px-8 py-4 flex items-center gap-4">
        <Link href="/" className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <CheckCircle2 size={18} className="text-white" strokeWidth={3}/>
          </div>
          <span className="text-xl font-bold tracking-tight">Vouch</span>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-10 pb-20 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFT SIDEBAR - PUBLIC PROFILE */}
        <aside className="flex flex-col gap-6">
           <div className="bg-[#151821] rounded-3xl p-8 flex flex-col items-center relative border border-white/5 overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-600/20 to-transparent" />
             <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#151821] shadow-2xl relative z-10 mb-4">
               <img src={profileData.avatar || 'https://www.gravatar.com/avatar/?d=mp'} className="w-full h-full object-cover" />
             </div>
             <div className="absolute top-24 right-1/2 translate-x-10 translate-y-2 bg-blue-500 rounded-full p-1 border-[3px] border-[#151821] z-20"><CheckCircle2 size={12} className="text-white" strokeWidth={4} /></div>
             <h2 className="text-xl font-bold tracking-tight text-white text-center mt-2">{profileData.name}</h2>
             <p className="text-sm text-gray-500 text-center mt-1">{profileData.designation}</p>

             {/* CONNECT ACTIONS */}
             {loggedInUser?.id !== profileId && (
               <div className="flex gap-2 w-full mt-6">
                 <button className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                   <UserPlus size={16} /> Connect
                 </button>
                 <button className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors">
                   <Send size={18} />
                 </button>
               </div>
             )}
           </div>

           {/* Top Vouched Skills Card */}
           <div className="bg-[#151821] rounded-3xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2.5 bg-purple-500/10 rounded-xl"><Trophy size={18} className="text-purple-400" /></div>
                 <h3 className="font-bold text-white tracking-tight">Verified Skills</h3>
              </div>
              <div className="space-y-4">
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
                ) : (<p className="text-xs text-gray-500 text-center italic">No vouches yet.</p>)}
              </div>
           </div>
        </aside>

        {/* MAIN FEED - USER'S PROJECTS */}
        <div className="col-span-1 lg:col-span-3 space-y-8">
           <div className="flex items-center gap-2 mb-2">
             <Sparkles size={20} className="text-blue-500"/>
             <h2 className="text-2xl font-bold text-white">Proof of Work</h2>
           </div>
           
           <div className="space-y-6">
              {userProjects.map((proj) => (
                <PublicFeedCard 
                  key={proj.id} 
                  {...proj} 
                  vouchCount={globalVouchCounts[proj.id] || 0}
                  vouched={vouchedIds.includes(proj.id)}
                  onVouch={() => handleVouch(proj.id)}
                />
              ))}
           </div>
        </div>

      </div>
    </main>
  )
}

// SIMPLIFIED PUBLIC FEED CARD (No Edit Logic)
function PublicFeedCard({ title, tag, skills, desc, link, vouchCount, onVouch, vouched, author_name, author_avatar, author_designation, created_at, image_url }) {
  const displaySkills = skills || [tag || 'Architecture'];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#151821] border border-white/5 rounded-[2rem] p-6 sm:p-8 hover:border-white/10 transition-colors shadow-xl shadow-black/50">
      <div className="flex justify-between items-start mb-6">
         <div className="flex items-center gap-4">
            <img src={author_avatar || 'https://www.gravatar.com/avatar/?d=mp'} className="w-12 h-12 rounded-full border border-white/10 object-cover" alt="Author" />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-white tracking-tight">{author_name || 'Builder'}</h4>
                <CheckCircle2 size={16} className="text-blue-500" strokeWidth={3} />
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">{author_designation || 'Builder'} • {timeAgo(created_at)}</p>
            </div>
         </div>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">{title}</h2>
      <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-6 max-w-3xl">{desc}</p>
      
      <div className="flex gap-2 mb-8 flex-wrap">
          {displaySkills.map((skill, index) => (<span key={index} className="px-4 py-1.5 bg-white/5 border border-white/5 rounded-full text-xs text-gray-300 font-medium">{skill}</span>))}
      </div>

      <a href={link} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-2xl mb-6 border border-white/5 bg-[#0A0D14] min-h-[256px]">
         <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />
         {image_url ? (
            <img src={image_url} alt={title} className="w-full h-full object-cover rounded-2xl h-64 sm:h-80" />
         ) : (
            <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-blue-900/20 via-[#151821] to-purple-900/20 flex flex-col items-center justify-center relative overflow-hidden">
                <Github size={48} className="text-white/10 mb-4 z-20" />
                <span className="font-mono text-white/20 text-3xl font-black tracking-widest uppercase z-20">{title.substring(0, 3)}</span>
            </div>
         )}
      </a>

      <div className="flex items-center justify-between pt-4 border-t border-white/5">
         <div className="flex items-center gap-6">
            <button onClick={onVouch} disabled={vouched} className={`flex items-center gap-2 text-sm font-medium transition-colors ${vouched ? 'text-blue-500 cursor-default' : 'text-gray-400 hover:text-white'}`}>
               <Heart size={18} className={vouched ? 'fill-blue-500' : ''} /><span>{vouchCount}</span>
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
               <MessageSquare size={18} /><span>Discuss</span>
            </button>
         </div>
      </div>
    </motion.div>
  )
}