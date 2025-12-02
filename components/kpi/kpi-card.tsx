import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface KpiCardProps {
  title: string
  value: string | number
  change: string
  icon: React.ComponentType<{ className?: string }>
  className?: string
}

export const KpiCard: React.FC<KpiCardProps> = ({ 
  title, 
  value, 
  change, 
  icon: Icon,
  className = ""
}) => {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{change}</p>
      </CardContent>
    </Card>
  )
}