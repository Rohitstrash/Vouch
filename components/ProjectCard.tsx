import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, MessageCircle, Share2, ExternalLink, MoreHorizontal, Bookmark } from 'lucide-react';

interface ProjectCardProps {
  project: {
    id: string;
    author: {
      name: string;
      title: string;
      avatar: string;
    };
    title: string;
    description: string;
    image: string;
    skills: string[];
    vouches: number;
    comments: number;
    timeAgo: string;
    hasVouched?: boolean;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [vouches, setVouches] = useState(project.vouches);
  const [hasVouched, setHasVouched] = useState(project.hasVouched || false);
  const [isHovered, setIsHovered] = useState(false);

  const handleVouch = () => {
    if (hasVouched) {
      setVouches(prev => prev - 1);
      setHasVouched(false);
    } else {
      setVouches(prev => prev + 1);
      setHasVouched(true);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_32px_rgba(59,130,246,0.1)] transition-all duration-500 group/card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Header */}
      <div className="p-6 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={project.author.avatar} 
              alt={project.author.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shadow-lg"
            />
            <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-white text-lg tracking-tight">{project.author.name}</h3>
              <BadgeCheck className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            </div>
            <p className="text-sm font-medium text-gray-400">{project.author.title} • {project.timeAgo}</p>
          </div>
        </div>
        <button className="text-gray-500 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Project Content */}
      <div className="px-6 pb-5">
        <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight group-hover/card:text-transparent group-hover/card:bg-clip-text group-hover/card:bg-gradient-to-r group-hover/card:from-white group-hover/card:to-gray-400 transition-all duration-300">
          {project.title}
        </h2>
        <p className="text-base text-gray-300 leading-relaxed line-clamp-2 mb-5 font-medium">
          {project.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {project.skills.map((skill) => (
            <span key={skill} className="px-3 py-1.5 bg-white/5 backdrop-blur-md text-gray-300 text-xs font-bold rounded-xl border border-white/10 hover:border-white/20 transition-colors cursor-pointer">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Project Media */}
      <div className="relative w-full aspect-[16/9] bg-black/50 border-y border-white/10 overflow-hidden group cursor-pointer">
        <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay z-10" />
        <img 
          src={project.image} 
          alt={project.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
        />
        <div className={`absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 text-white px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            View Project <ExternalLink className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="p-5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleVouch}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 border ${
              hasVouched 
                ? 'bg-gradient-to-r from-blue-600/90 to-purple-600/90 border-transparent text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]' 
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            <motion.div
              animate={hasVouched ? { rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              <BadgeCheck className={`w-5 h-5 ${hasVouched ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-blue-400'}`} />
            </motion.div>
            Vouch {vouches > 0 && <span className={hasVouched ? 'text-blue-100' : 'text-gray-500'}>• {vouches.toLocaleString()}</span>}
          </motion.button>
          
          <button className="flex items-center gap-2.5 px-4 py-2.5 text-gray-400 hover:text-white transition-all text-sm font-bold rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10">
            <MessageCircle className="w-5 h-5" />
            <span className="hidden sm:inline">{project.comments}</span>
          </button>
          
          <button className="flex items-center gap-2.5 px-4 py-2.5 text-gray-400 hover:text-white transition-all text-sm font-bold rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
        
        <button className="text-gray-400 hover:text-white transition-all p-2.5 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10">
          <Bookmark className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
