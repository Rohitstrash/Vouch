'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { signOut } from './actions'

export default function VouchDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (e) {
        console.error("Session error:", e)
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [supabase])

  const handleGitHubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white font-mono uppercase tracking-widest">
        <p className="animate-pulse">Initializing Vouch...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 text-center">
      <h1 className="text-6xl font-black mb-2 italic text-blue-500 tracking-tighter">VOUCH</h1>
      
      {user ? (
        <div className="space-y-8">
          <p className="text-xl font-mono text-green-400">{user.email}</p>
          <form action={signOut}>
            <button type="submit" className="px-10 py-3 border border-red-500 text-red-500 rounded-full text-xs font-bold uppercase tracking-widest">
              Logout
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <p className="text-gray-400 mb-12 max-w-xs text-sm">Resumes are dead. Build your Proof-of-Work.</p>
          <button 
            onClick={handleGitHubLogin}
            className="bg-white text-black px-12 py-4 rounded-full font-bold hover:scale-105 transition-all shadow-xl shadow-blue-500/10"
          >
            Continue with GitHub
          </button>
        </div>
      )}
    </div>
  )
}
