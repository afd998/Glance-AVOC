
import { ColumnDef } from "@tanstack/react-table"
import { Database } from "@/types/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { IoLogoApple } from "react-icons/io5"
import { Pencil, Trash2 } from "lucide-react"

type ByodRow = Database['public']['Tables']['faculty_byods']['Row']

type Draft = { name: string; os: 'MAC' | 'PC' | 'IPAD' | 'OTHER' }

export const columns = (
  params: {
    editingRowId: number | null,
    draft: Draft,
    onDraftChange: (patch: Partial<Draft>) => void,
    onEdit: (row: ByodRow) => void,
    onDelete: (row: ByodRow) => void,
    onSave: () => void,
    onCancel: () => void,
  }
): ColumnDef<ByodRow>[] => [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const r = row.original as ByodRow
      if (params.editingRowId === r.id) {
        return (
          <Input
            value={params.draft.name}
            onChange={(e) => params.onDraftChange({ name: e.target.value })}
          />
        )
      }
      return <span>{r.name}</span>
    }
  },
  {
    accessorKey: 'os',
    header: 'OS',
    cell: ({ row }) => {
      const r = row.original as ByodRow
      const label = (v?: string | null) => v === 'MAC' ? 'Mac' : v === 'PC' ? 'PC' : v === 'IPAD' ? 'iPad' : v ? v : ''
      if (params.editingRowId === r.id) {
        return (
          <Select
            value={params.draft.os}
            onValueChange={(v) => params.onDraftChange({ os: v as 'MAC' | 'PC' | 'IPAD' | 'OTHER' })}
          >
            <SelectTrigger className="h-9 w-24">
              <SelectValue placeholder="Select OS" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value="MAC">Mac</SelectItem>
              <SelectItem value="PC">PC</SelectItem>
              <SelectItem value="IPAD">iPad</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        )
      }
      return (
        <div className="flex items-center gap-2">
          {(r.os === 'MAC' || r.os === 'IPAD') && <IoLogoApple className="w-4 h-4" />}
          <span>{label(r.os)}</span>
        </div>
      )
    }
  },
  { 
    accessorKey: 'created_at', 
    header: 'Created At',
    cell: ({ row }) => {
      const date = new Date(row.original.created_at)
      return <span>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    }
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const r = row.original as ByodRow
      const isEditing = params.editingRowId === r.id
      return (
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button className="text-green-700 underline" onClick={params.onSave}>Save</button>
              <button className="text-gray-600 underline" onClick={params.onCancel}>Cancel</button>
            </>
          ) : (
            <ButtonGroup>
              <Button variant="outline" size="icon" title="Edit BYOD" onClick={() => params.onEdit(r)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" title="Delete BYOD" onClick={() => params.onDelete(r)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </ButtonGroup>
          )}
        </div>
      )
    }
  }
]