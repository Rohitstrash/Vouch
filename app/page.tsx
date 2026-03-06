import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Github, LogOut, ExternalLink, Globe, Plus, CheckCircle, RefreshCw, Zap, MapPin, Figma, Linkedin, Gitlab, X, Edit3 } from 'lucide-react'
import { Github, LogOut, ExternalLink, Globe, Plus, CheckCircle, RefreshCw, Zap, MapPin, Figma, Linkedin, Gitlab, X, Edit3, Heart, ShieldCheck } from 'lucide-react'
import { signOut } from './actions'

type Platform = 'github' | 'figma' | 'linkedin' | 'gitlab'

export default function VouchPro() {
export default function VouchSocial() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [activePlatform, setActivePlatform] = useState<Platform>('github')

  // DYNAMIC DATA STATES
  // PROFILE STATES
  const [displayName, setDisplayName] = useState('')
  const [displayBio, setDisplayBio] = useState('Building the future of reputation.')
  const [projects, setProjects] = useState<any[]>([])
@@ -53,14 +53,24 @@ export default function VouchPro() {
          title: repo.name,
          tag: repo.language || 'Protocol',
          desc: repo.description || 'Verified via GitHub Sync',
          link: repo.html_url
          link: repo.html_url,
          vouchCount: Math.floor(Math.random() * 50) // Initial random "reputation"
        }))
        setProjects(prev => [...githubData, ...prev.filter(p => p.platform !== 'github')])
      }
    } catch (e) { console.error(e) } finally { setIsSyncing(false) }
  }

  // --- HANDLERS ---
  // CALCULATE GLOBAL REPUTATION SCORE
  const totalReputation = projects.reduce((acc, curr) => acc + (curr.vouchCount || 0), 0)

  // --- SOCIAL HANDLERS ---
  const handleVouch = (id: number) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, vouchCount: (p.vouchCount || 0) + 1 } : p
    ))
  }

  const handleNewProof = (e: any) => {
    e.preventDefault()
    const formData = new FormData(e.target)
@@ -70,7 +80,8 @@ export default function VouchPro() {
      title: formData.get('title'),
      tag: formData.get('tag'),
      desc: formData.get('desc'),
      link: '#'
      link: '#',
      vouchCount: 0
    }
    setProjects([newEntry, ...projects])
    setIsModalOpen(false)
@@ -92,7 +103,7 @@ export default function VouchPro() {
        <h1 className="text-2xl font-black italic tracking-tighter text-blue-500">VOUCH</h1>
        {user && (
          <div className="flex items-center gap-6">
             <button onClick={() => fetchGitHubRepos(user.provider_token)} className="text-gray-500 hover:text-white transition-colors">
             <button onClick={() => fetchGitHubRepos(user.provider_token)} className="text-gray-500 hover:text-white">
               <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
             </button>
             <form action={signOut}><button className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-all"><LogOut size={16} /></button></form>
@@ -106,23 +117,29 @@ export default function VouchPro() {
            {/* PROFILE HEADER */}
            <motion.header initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="relative group">
                <div className="relative">
                  <img src={user.user_metadata.avatar_url} className="w-32 h-32 rounded-[2.5rem] border-2 border-blue-500/20 shadow-2xl" alt="Identity" />
                  <button onClick={() => setIsEditOpen(true)} className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl border-4 border-[#020202] hover:scale-110 transition-transform">
                  <button onClick={() => setIsEditOpen(true)} className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl border-4 border-[#020202] hover:scale-110 transition-all">
                    <Edit3 size={16} />
                  </button>
                </div>
                <div className="text-center md:text-left space-y-3">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                     <CheckCircle size={10} className="text-blue-400" />
                     <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Verified Identity</span>
                <div className="text-center md:text-left space-y-4">
                   <div className="flex flex-wrap justify-center md:justify-start gap-3">
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                       <ShieldCheck size={12} className="text-blue-400" />
                       <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Verified Identity</span>
                     </div>
                     <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                       <Zap size={12} className="text-purple-400" />
                       <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Rep Score: {totalReputation}</span>
                     </div>
                   </div>
                   <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">{displayName}</h2>
                   <h2 className="text-6xl font-black tracking-tighter uppercase leading-none italic">{displayName}</h2>
                   <p className="text-gray-500 font-medium max-w-md">{displayBio}</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 hover:text-white transition-all transform active:scale-95 shadow-xl shadow-white/5">
                <Zap size={16} /> New Proof
              <button onClick={() => setIsModalOpen(true)} className="bg-white text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all transform active:scale-95 shadow-xl shadow-white/5">
                <Plus size={16} /> New Proof
              </button>
            </motion.header>

@@ -142,7 +159,7 @@ export default function VouchPro() {
                <AnimatePresence mode="popLayout">
                  {projects.filter(p => p.platform === activePlatform).length > 0 ? (
                    projects.filter(p => p.platform === activePlatform).map((proj) => (
                      <WorkCard key={proj.id} {...proj} />
                      <WorkCard key={proj.id} {...proj} onVouch={() => handleVouch(proj.id)} />
                    ))
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-3 py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
@@ -156,44 +173,37 @@ export default function VouchPro() {
        )}
      </div>

      {/* MODAL: NEW PROOF */}
      {/* MODALS (Same as before but included for completeness) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-[#0A0A0A] border border-white/10 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="relative bg-[#0A0A0A] border border-white/10 p-10 rounded-[3rem] w-full max-w-lg">
               <h3 className="text-2xl font-black mb-8 italic uppercase tracking-tighter">Add {activePlatform} Proof</h3>
               <form onSubmit={handleNewProof} className="space-y-6">
                  <input name="title" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-blue-500 outline-none transition-all" placeholder="Project Title" />
                  <input name="tag" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-blue-500 outline-none transition-all" placeholder="Category (e.g. UI Design)" />
                  <textarea name="desc" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-blue-500 outline-none transition-all h-32" placeholder="Description" />
                  <button type="submit" className="w-full bg-blue-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500">Publish Proof</button>
                  <input name="title" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500" placeholder="Project Title" />
                  <input name="tag" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-blue-500" placeholder="Category" />
                  <textarea name="desc" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none h-32" placeholder="Description" />
                  <button type="submit" className="w-full bg-blue-600 py-5 rounded-2xl font-black text-xs uppercase tracking-widest">Publish Proof</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DRAWER: EDIT PROFILE */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative bg-[#0A0A0A] border-l border-white/10 w-full max-w-md h-full p-10 flex flex-col shadow-2xl">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="relative bg-[#0A0A0A] border-l border-white/10 w-full max-w-md h-full p-10">
              <div className="flex justify-between items-center mb-12">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Edit Profile</h3>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Edit Identity</h3>
                <button onClick={() => setIsEditOpen(false)} className="text-gray-500 hover:text-white"><X size={24}/></button>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Public Name</label>
                  <input name="name" defaultValue={displayName} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Bio / Motto</label>
                  <textarea name="bio" defaultValue={displayBio} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:border-blue-500 outline-none h-32" />
                </div>
                <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all">Save Changes</button>
                <input name="name" defaultValue={displayName} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none" placeholder="Display Name" />
                <textarea name="bio" defaultValue={displayBio} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none h-32" placeholder="Bio" />
                <button type="submit" className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest">Update Protocol</button>
              </form>
            </motion.div>
          </div>
@@ -212,19 +222,31 @@ function PlatformTab({ active, icon, label, onClick }: any) {
  )
}

function WorkCard({ title, tag, desc, link, platform }: any) {
function WorkCard({ title, tag, desc, link, platform, vouchCount, onVouch }: any) {
  const Icon = platform === 'github' ? Github : platform === 'figma' ? Figma : platform === 'linkedin' ? Linkedin : Gitlab;
  
  return (
    <motion.div layout initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} whileHover={{ y: -10 }} className="bg-white/[0.02] border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl group relative overflow-hidden transition-all duration-500 hover:border-blue-500/40 h-full flex flex-col">
      <div className="mb-8 p-4 bg-white/5 w-fit rounded-2xl group-hover:bg-blue-500/20 transition-colors duration-500"><Icon size={24} className="text-blue-400"/></div>
      <div className="flex justify-between items-start mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic">{tag}</p>
        {link && link !== '#' && <a href={link} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors"><ExternalLink size={16}/></a>}
    <motion.div layout initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} whileHover={{ y: -10 }} className="bg-white/[0.02] border border-white/10 p-10 rounded-[3rem] backdrop-blur-2xl group flex flex-col transition-all duration-500 hover:border-blue-500/40">
      <div className="flex justify-between items-start mb-8">
        <div className="p-4 bg-white/5 w-fit rounded-2xl group-hover:bg-blue-600/20 transition-colors duration-500"><Icon size={24} className="text-blue-400"/></div>
        {link && link !== '#' && <a href={link} target="_blank" className="p-2 text-gray-600 hover:text-white transition-colors"><ExternalLink size={18}/></a>}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic mb-2">{tag}</p>
      <h4 className="text-2xl font-bold mb-4 italic uppercase tracking-tighter group-hover:text-blue-400 transition-colors">{title}</h4>
      <p className="text-sm text-gray-500 leading-relaxed font-medium line-clamp-3 mb-6">{desc}</p>
      <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest italic">Protocol Verified</span>
      <p className="text-sm text-gray-500 leading-relaxed font-medium line-clamp-3 mb-10">{desc}</p>
      
      {/* VOUCH SYSTEM UI */}
      <div className="mt-auto flex items-center justify-between pt-6 border-t border-white/5">
        <div className="flex items-center gap-2">
          <Heart size={14} className="text-red-500 fill-red-500/10" />
          <span className="text-xs font-black italic">{vouchCount} Vouches</span>
        </div>
        <button 
          onClick={onVouch}
          className="bg-white/5 hover:bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
        >
          Vouch
        </button>
      </div>
    </motion.div>
  )