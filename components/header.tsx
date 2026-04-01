'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { Leaf, Menu, X, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('users')
          .select('telegram_username')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
      fetchProfile()
    } else {
      setProfile(null)
    }
  }, [user])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const displayName = profile?.telegram_username || (user?.email?.includes('telegram_') 
    ? "Client" 
    : user?.email?.split('@')[0])

  const isActive = (path: string) => pathname === path

  return (
    // ✅ Sticky Header with Glass effect
    <header className="sticky top-0 z-[100] w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-emerald-100 p-1.5 rounded-lg group-hover:bg-emerald-200 transition-colors">
            <Leaf className="h-5 w-5 text-emerald-600" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">King's Massage</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { name: 'Home', path: '/' },
            { name: 'Book Now', path: '/book' },
            { name: 'My Bookings', path: '/my-bookings', auth: true }
          ].map((item) => (
            (!item.auth || user) && (
              <Link 
                key={item.path}
                href={item.path} 
                className={cn(
                  "text-sm font-semibold transition-all hover:text-emerald-600 relative py-1",
                  isActive(item.path) 
                    ? 'text-emerald-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-emerald-600 after:rounded-full' 
                    : 'text-slate-500'
                )}
              >
                {item.name}
              </Link>
            )
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-5">
          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
              <div className="flex flex-col items-end leading-tight">
                <span className="text-sm font-bold text-slate-900">{displayName}</span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Active</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-500 hover:text-red-600 font-bold transition-colors">
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild className="font-bold text-slate-600">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl px-6 shadow-md shadow-emerald-100">
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden rounded-xl bg-slate-50"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5 text-slate-600" /> : <Menu className="h-5 w-5 text-slate-600" />}
        </Button>
      </div>

      {/* Mobile Menu - Stays within sticky container */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-300">
          <nav className="container flex flex-col gap-1 py-6 px-4 mx-auto">
            <Link 
              href="/" 
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "text-base font-bold p-3 rounded-xl transition-colors",
                isActive('/') ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 active:bg-slate-50'
              )}
            >
              Home
            </Link>
            <Link 
              href="/book"
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "text-base font-bold p-3 rounded-xl transition-colors",
                isActive('/book') ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 active:bg-slate-50'
              )}
            >
              Book Now
            </Link>
            {user && (
              <Link 
                href="/my-bookings"
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "text-base font-bold p-3 rounded-xl transition-colors",
                  isActive('/my-bookings') ? 'bg-emerald-50 text-emerald-600' : 'text-slate-600 active:bg-slate-50'
                )}
              >
                My Bookings
              </Link>
            )}
            <div className="mt-4 pt-4 border-t border-slate-100">
              {user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{displayName}</span>
                      <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Premium Member</span>
                    </div>
                  </div>
                  <Button variant="outline" size="lg" onClick={handleSignOut} className="rounded-2xl font-bold border-red-100 text-red-600 hover:bg-red-50">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button variant="outline" size="lg" asChild className="rounded-2xl font-bold border-slate-200">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button size="lg" asChild className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold shadow-lg shadow-emerald-100">
                    <Link href="/auth/sign-up">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
