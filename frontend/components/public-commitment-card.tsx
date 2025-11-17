import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Leaf } from 'lucide-react'

interface PublicCommitmentCardProps {
  userName: string
  userInitials: string
  commitment: string
  category: string
  carbonSaved: number
  frequency: string
  onClick?: () => void
}

export function PublicCommitmentCard({
  userName,
  userInitials,
  commitment,
  category,
  carbonSaved,
  frequency,
  onClick,
}: PublicCommitmentCardProps) {
  return (
    <div className="relative group">
      {/* Pin effect */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
        <div className="w-3 h-3 rounded-full bg-[#5a4a3a] shadow-lg border-2 border-[#3a3a2a]" />
        <div className="w-0.5 h-4 bg-[#4a3a2a] mx-auto shadow-md" />
      </div>
      
      <Card 
        className="hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:-translate-y-1 bg-[#F4FCE7]/95 border-2 border-[#3A7D44]/20 backdrop-blur-sm rotate-[-0.5deg] hover:rotate-0 shadow-lg" 
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-[#2D9C8B]/40 shadow-md">
              <AvatarFallback className="bg-[#6FCF97] text-[#2a2520] font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-[#2a2520]">{userName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs bg-[#2D9C8B]/10 text-[#2D9C8B] border-[#2D9C8B]/30">
                  {category}
                </Badge>
                <span className="text-xs text-[#2a2520]/60 font-medium">{frequency}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed line-clamp-3 text-[#2a2520]/90 font-medium">{commitment}</p>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#2D9C8B]/10 border border-[#2D9C8B]/20">
            <div className="p-2 rounded-full bg-[#2D9C8B]/20">
              <Leaf className="h-4 w-4 text-[#2D9C8B]" />
            </div>
            <div>
              <p className="text-xs text-[#2a2520]/60 font-medium">Carbon Impact</p>
              <p className="font-bold text-[#2D9C8B]">{carbonSaved.toFixed(1)} kg CO₂</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
