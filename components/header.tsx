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
  const [profile, setProfile] = useState<any>(null) // Added for King's Massage profile data
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

  // ✅ New Effect: Fetch the friendly name from your public.users table
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

  // ✅ Logic to hide the long technical email
  const displayName = profile?.telegram_username || (user?.email?.includes('telegram_') 
    ? "Client" 
    : user?.email?.split('@')[0])

  const isActive = (path: string) => pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-emerald-500" />
          <span className="font-bold text-lg tracking-tight">King's Massage</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            href="/" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isActive('/') ? 'text-emerald-600' : 'text-muted-foreground'
            )}
          >
            Home
          </Link>
          <Link 
            href="/book" 
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isActive('/book') ? 'text-emerald-600' : 'text-muted-foreground'
            )}
          >
            Book Now
          </Link>
          {user && (
            <Link 
              href="/my-bookings" 
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                isActive('/my-bookings') ? 'text-emerald-600' : 'text-muted-foreground'
              )}
            >
              My Bookings
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-slate-900">{displayName}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Premium Member</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="rounded-xl font-bold text-xs">
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="font-bold">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild className="bg-emerald-600 hover:bg-emerald-700 font-bold rounded-xl px-5">
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background animate-in slide-in-from-top-1">
          <nav className="container flex flex-col gap-4 py-6 px-4">
            <Link 
              href="/" 
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "text-base font-bold py-2",
                isActive('/') ? 'text-emerald-600' : 'text-slate-600'
              )}
            >
              Home
            </Link>
            <Link 
              href="/book"
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "text-base font-bold py-2",
                isActive('/book') ? 'text-emerald-600' : 'text-slate-600'
              )}
            >
              Book Now
            </Link>
            {user && (
              <Link 
                href="/my-bookings"
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "text-base font-bold py-2",
                  isActive('/my-bookings') ? 'text-emerald-600' : 'text-slate-600'
                )}
              >
                My Bookings
              </Link>
            )}
            <div className="pt-6 mt-2 border-t border-slate-100">
              {user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{displayName}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Client Account</span>
                    </div>
                  </div>
                  <Button variant="destructive" size="lg" onClick={handleSignOut} className="rounded-2xl font-bold w-full">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button variant="outline" size="lg" asChild className="rounded-2xl font-bold">
                    <Link href="/auth/login">Sign In</Link>
                  </Button>
                  <Button size="lg" asChild className="bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold">
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
