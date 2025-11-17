'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Globe, User, Sparkles, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'Wall',
    href: '/wall',
    icon: Globe,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    label: 'Orgs',
    href: '/organizations',
    icon: Building2,
  },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Gradient background with blur */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1612] via-[#1a1612]/98 to-[#1a1612]/95 backdrop-blur-xl border-t border-[#3A7D44]/30 shadow-2xl" />
        
        {/* Glow effect */}
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-[#3A7D44] to-transparent opacity-50" />
        
        <div className="relative flex items-center justify-around h-20 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1.5 flex-1 h-14 rounded-2xl transition-all duration-300',
                  isActive
                    ? 'scale-110'
                    : 'scale-100 hover:scale-105'
                )}
              >
                {/* Active background with gradient */}
                {isActive && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3A7D44] to-[#2d6335] rounded-2xl shadow-lg shadow-[#3A7D44]/30" />
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent to-[#A8D5BA]/20 rounded-2xl animate-pulse" />
                  </>
                )}
                
                {/* Icon */}
                <div className={cn(
                  "relative z-10 transition-all duration-300",
                  isActive && "drop-shadow-[0_0_8px_rgba(244,252,231,0.5)]"
                )}>
                  <Icon 
                    className={cn(
                      "h-6 w-6 transition-colors duration-300",
                      isActive ? "text-[#F4FCE7]" : "text-[#A8D5BA]/70"
                    )} 
                    strokeWidth={2.5} 
                  />
                </div>
                
                {/* Label */}
                <span className={cn(
                  "relative z-10 text-xs font-bold transition-colors duration-300",
                  isActive ? "text-[#F4FCE7]" : "text-[#A8D5BA]/60"
                )}>
                  {item.label}
                </span>

                {/* Active indicator sparkle */}
                {isActive && (
                  <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-[#F4FCE7] animate-pulse z-20" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
