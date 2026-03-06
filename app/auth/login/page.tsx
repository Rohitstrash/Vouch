'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'

export default function VouchDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [supabase])

  const handleGitHubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        // Dynamically uses your ngrok URL to avoid localhost errors
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white font-mono">
        <p className="animate-pulse">Initializing Vouch...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h1 className="text-5xl font-black mb-4 italic text-blue-500 tracking-tighter">VOUCH</h1>
      
      {user ? (
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <p className="text-gray-500 text-sm uppercase tracking-widest">Authenticated</p>
            <p className="text-xl font-mono text-green-400">{user.email}</p>
          </div>

          <div className="p-8 border border-gray-800 rounded-2xl bg-zinc-900/30 max-w-md">
            <p className="text-gray-400 leading-relaxed">
              Your Proof-of-Work profile is active. Ready to get vouched?
            </p>
          </div>

          {/* This form triggers the server action to clear cookies securely */}
          
        </div>
      ) : (
        <div className="text-center flex flex-col items-center">
          <p className="text-gray-400 mb-12 max-w-xs text-sm leading-relaxed">
            Resumes are dead. Build your Proof-of-Work and let your code speak.
          </p>
          
          <button 
            onClick={handleGitHubLogin}
            className="bg-white text-black px-12 py-4 rounded-full font-bold hover:bg-gray-200 transition-all transform active:scale-95 shadow-xl shadow-blue-500/10"
          >
            Continue with GitHub
          </button>
        </div>
      )}
    </div>
  )
}
