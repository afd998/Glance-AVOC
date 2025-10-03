import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import BYODTable from './BYODTable'
import BYODCreateForm from './BYODCreateForm'

interface Props {
  facultyId: number
  themeHexColors: string[]
}

export default function BYODDevicesCard({ facultyId, themeHexColors }: Props) {
  const [showByodForm, setShowByodForm] = useState(false)

  return (
    <Card className="p-0 overflow-hidden" style={{ background: `linear-gradient(135deg, ${themeHexColors[1]}BB, ${themeHexColors[2]}99)` }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-lg text-black">BYOD Devices</CardTitle>
            <CardDescription className="text-black/70">Manage personal devices for this instructor</CardDescription>
          </div>
          <CardAction>
            <Button size="icon" variant="outline" title="Add BYOD Device" onClick={() => setShowByodForm(!showByodForm)}>
              <Plus className="w-4 h-4" />
            </Button>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <BYODTable facultyId={facultyId} />
        {showByodForm && (
          <div className="mt-6 rounded-md border border-white/20 dark:border-white/10 p-3">
            <BYODCreateForm
              facultyId={facultyId}
              onCreated={() => setShowByodForm(false)}
              onCancel={() => setShowByodForm(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}


