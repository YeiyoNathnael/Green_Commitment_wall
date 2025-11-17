'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Home, Globe, User, Sparkles, BarChart3, Building2, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LeafIcon } from '@/components/leaf-icon'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    label: 'Green Wall',
    href: '/wall',
    icon: Globe,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
    gradient: 'from-teal-500 to-cyan-500',
  },
  {
    label: 'Stats',
    href: '/stats',
    icon: BarChart3,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    label: 'Organizations',
    href: '/organizations',
    icon: Building2,
    gradient: 'from-purple-500 to-pink-500',
  },
]

export function DesktopSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [isHovered, setIsHovered] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false })
      toast.success('Logged out successfully')
      router.push('/')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "hidden md:flex fixed left-0 top-0 bottom-0 border-r border-[#3A7D44]/20 flex-col z-50 transition-all duration-300 ease-in-out",
        "bg-gradient-to-b from-[#1a1612]/95 via-[#2a2520]/95 to-[#1a1612]/95 backdrop-blur-xl",
        "shadow-2xl shadow-black/50",
        isHovered ? "w-72" : "w-24"
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#3A7D44]/10 via-transparent to-[#A8D5BA]/5 pointer-events-none" />
      
      {/* Animated background effect */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-[#3A7D44]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-10 w-40 h-40 bg-[#A8D5BA]/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-[#3A7D44]/20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#3A7D44] to-[#A8D5BA] flex items-center justify-center shadow-lg shadow-[#3A7D44]/30 group-hover:shadow-[#3A7D44]/50 transition-all group-hover:scale-110 duration-300">
              <LeafIcon className="w-7 h-7 text-white" />
            </div>
            {isHovered && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-200">
                <span className="text-xl font-bold bg-gradient-to-r from-[#F4FCE7] to-[#A8D5BA] bg-clip-text text-transparent">
                  EcoPromise
                </span>
                <span className="text-xs text-[#A8D5BA]/70 font-medium">Green Commitment Wall</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-r from-[#3A7D44] to-[#2d6335] text-[#F4FCE7] shadow-lg shadow-[#3A7D44]/30'
                    : 'text-[#A8D5BA]/80 hover:text-[#F4FCE7] hover:bg-[#3A7D44]/20',
                  !isHovered && 'justify-center'
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#A8D5BA]/20 to-transparent animate-pulse" />
                )}
                <Icon className={cn(
                  "h-5 w-5 relative z-10 transition-transform duration-300 shrink-0",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                {isHovered && (
                  <>
                    <span className="font-semibold relative z-10 animate-in fade-in slide-in-from-left-2 duration-200">{item.label}</span>
                    {isActive && (
                      <Sparkles className="h-4 w-4 ml-auto text-[#F4FCE7] animate-pulse" />
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-[#3A7D44]/20 space-y-3">
          {/* User Info */}
          {session?.user && (
            <div className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-xl bg-[#3A7D44]/10",
              !isHovered && "justify-center"
            )}>
              <Avatar className="w-9 h-9 border-2 border-[#3A7D44]/30">
                {session.user.image && <AvatarImage src={session.user.image} />}
                <AvatarFallback className="bg-[#3A7D44] text-white text-sm font-bold">
                  {session.user.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {isHovered && (
                <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-200">
                  <p className="text-sm font-semibold text-[#F4FCE7] truncate">{session.user.name}</p>
                  <p className="text-xs text-[#A8D5BA]/70 truncate">{session.user.email}</p>
                </div>
              )}
            </div>
          )}

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all",
              !isHovered && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5" />
            {isHovered && <span className="font-semibold">Logout</span>}
          </Button>
        </div>

        {/* Hover indicator */}
        {!isHovered && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-transparent via-[#3A7D44] to-transparent opacity-50 animate-pulse" />
        )}
      </div>
    </aside>
  )
}
