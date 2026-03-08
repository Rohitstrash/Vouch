import React from 'react';
import { ProjectCard } from './ProjectCard';
import { Filter, Clock, Flame } from 'lucide-react';

const MOCK_PROJECTS = [
  {
    id: '1',
    author: {
      name: 'David Park',
      title: 'UX/UI Designer',
      avatar: 'https://images.unsplash.com/photo-1658702157657-cb67f8268f38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMG9mJTIwYmxhY2slMjBtYW4lMjBnbGFzc2VzfGVufDF8fHx8MTc3MjkwNzUxNnww&ixlib=rb-4.1.0&q=80&w=150',
    },
    title: 'Fintech Dashboard Redesign',
    description: 'A complete overhaul of the legacy banking dashboard focusing on user retention and clearer data visualization. Built responsive components from the ground up.',
    image: 'https://images.unsplash.com/photo-1771922748624-b205cf5d002d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkYXNoYm9hcmQlMjB1aSUyMGRlc2lnbiUyMHdlYnNpdGV8ZW58MXx8fHwxNzcyOTA3NTEyfDA&ixlib=rb-4.1.0&q=80&w=1080',
    skills: ['Figma', 'UI Design', 'Data Visualization', 'Prototyping'],
    vouches: 1243,
    comments: 84,
    timeAgo: '2 hours ago',
  },
  {
    id: '2',
    author: {
      name: 'Alex Rivera',
      title: 'Full Stack Developer',
      avatar: 'https://images.unsplash.com/photo-1748200100427-52921dec8597?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMG9mJTIweW91bmclMjB3aGl0ZSUyMG1hbiUyMHNtaWxpbmd8ZW58MXx8fHwxNzcyOTA3NTE2fDA&ixlib=rb-4.1.0&q=80&w=150',
    },
    title: 'Rust CLI Image Compressor',
    description: 'Developed a blazing fast CLI tool in Rust that compresses images by up to 70% without visible quality loss. Distributed via crates.io and Homebrew.',
    image: 'https://images.unsplash.com/photo-1724260793422-7754e5d06fbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2RlJTIwb24lMjBjb21wdXRlciUyMHNjcmVlbnxlbnwxfHx8fDE3NzI4MzgzODh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    skills: ['Rust', 'CLI Tools', 'Optimization', 'Open Source'],
    vouches: 856,
    comments: 112,
    timeAgo: '5 hours ago',
  },
  {
    id: '3',
    author: {
      name: 'Sarah Chen',
      title: '3D Artist & Creative Dev',
      avatar: 'https://images.unsplash.com/photo-1634552516330-ab1ccc0f605e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMG9mJTIwYXNpYW4lMjB3b21hbiUyMHNtaWxpbmd8ZW58MXx8fHwxNzcyOTA3NTE2fDA&ixlib=rb-4.1.0&q=80&w=150',
    },
    title: 'Abstract Procedural Worlds',
    description: 'An interactive WebGL experience generating procedural abstract landscapes in real-time in the browser. Using Three.js and custom GLSL shaders.',
    image: 'https://images.unsplash.com/photo-1745922968123-1573f7f0d8e2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMDNkJTIwYXJ0JTIwcmVuZGVyfGVufDF8fHx8MTc3MjkwNzUxNnww&ixlib=rb-4.1.0&q=80&w=1080',
    skills: ['Three.js', 'WebGL', 'Creative Coding', 'Blender'],
    vouches: 2104,
    comments: 320,
    timeAgo: '1 day ago',
  }
];

export function Feed() {
  return (
    <div className="flex-1 max-w-2xl w-full mx-auto">
      {/* Feed Filters */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
        <div className="flex gap-3 bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-inner">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all border border-white/10">
            <Flame className="w-4 h-4 text-purple-400" /> Trending
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 text-gray-400 hover:text-white rounded-xl text-sm font-bold transition-all hover:bg-white/5">
            <Clock className="w-4 h-4" /> Latest
          </button>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 text-gray-300 hover:text-white border border-white/10 text-sm font-bold rounded-xl transition-all hover:bg-white/10 backdrop-blur-md">
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-8 pb-20">
        {MOCK_PROJECTS.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
