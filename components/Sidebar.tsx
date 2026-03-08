import React from 'react';
import { BadgeCheck, Trophy, Sparkles, Users, Plus } from 'lucide-react';

export function Sidebar() {
  const topSkills = [
    { name: 'React', vouches: 842 },
    { name: 'UX Design', vouches: 621 },
    { name: 'Node.js', vouches: 430 },
    { name: 'System Architecture', vouches: 312 },
    { name: 'Tailwind CSS', vouches: 290 },
  ];

  return (
    <div className="hidden lg:flex flex-col gap-6 w-80 shrink-0 sticky top-28 h-[calc(100vh-7rem)] overflow-y-auto pb-8 scrollbar-hide">
      {/* Profile Card */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="relative">
            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <img 
                src="https://images.unsplash.com/photo-1634552516330-ab1ccc0f605e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMG9mJTIwYXNpYW4lMjB3b21hbiUyMHNtaWxpbmd8ZW58MXx8fHwxNzcyOTA3NTE2fDA&ixlib=rb-4.1.0&q=80&w=200" 
                alt="Profile" 
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full p-1.5 border-2 border-black shadow-[0_0_15px_rgba(59,130,246,0.6)]" title="Verified Identity">
              <BadgeCheck className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <h2 className="mt-5 font-bold text-xl text-white tracking-tight">Maya Lin</h2>
          <p className="text-sm text-gray-400 mt-1 font-medium">Senior Product Engineer</p>
          
          <div className="mt-6 flex gap-3 w-full">
            <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-3 text-center border border-white/5 hover:bg-white/10 transition-colors">
              <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-purple-400 to-blue-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.3)]">
                12k
              </div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Reputation</div>
            </div>
            <div className="flex-1 bg-white/5 backdrop-blur-md rounded-2xl p-3 text-center border border-white/5 hover:bg-white/10 transition-colors">
              <div className="text-2xl font-extrabold text-white">14</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Projects</div>
            </div>
          </div>

          <button className="w-full mt-6 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] flex items-center justify-center gap-2 group/btn">
            <Plus className="h-5 w-5 group-hover/btn:rotate-90 transition-transform duration-300" />
            New Proof
          </button>
        </div>
      </div>

      {/* Vouched Skills */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/20 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Trophy className="h-5 w-5 text-purple-400" />
          </div>
          <h3 className="font-bold text-white tracking-tight">Top Vouched</h3>
        </div>
        
        <div className="space-y-4">
          {topSkills.map((skill, i) => (
            <div key={skill.name} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="text-sm font-bold text-gray-600 w-4">{i + 1}</div>
                <div className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                  {skill.name}
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2.5 py-1 rounded-lg text-xs font-bold group-hover:bg-purple-500/20 transition-colors shadow-[0_0_10px_rgba(168,85,247,0.0)] group-hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                <BadgeCheck className="h-3.5 w-3.5" />
                {skill.vouches}
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-6 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 text-sm font-semibold rounded-2xl transition-all hover:text-white">
          View all skills
        </button>
      </div>
    </div>
  );
}
