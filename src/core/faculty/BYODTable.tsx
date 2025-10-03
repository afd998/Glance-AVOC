import { columns as buildColumns } from "./BYODTableColumns"
import { DataTable } from "../../components/ui/data-table"
import { useFacultyByods, useDeleteFacultyByod, useUpdateFacultyByod } from "./hooks/useFacultyByods"
import React from 'react'

interface Props { facultyId: number }

export default function BYODTable({ facultyId }: Props) {
  const { data = [] } = useFacultyByods(facultyId)
  const updateMut = useUpdateFacultyByod(facultyId)
  const deleteMut = useDeleteFacultyByod(facultyId)

  const [editingRowId, setEditingRowId] = React.useState<number | null>(null)
  const [draft, setDraft] = React.useState<{ name: string; os: 'MAC' | 'PC' | 'IPAD' | 'OTHER' }>({ name: '', os: 'MAC' })

  const handleEdit = (row: any) => {
    setEditingRowId(row.id)
    setDraft({ name: row.name ?? '', os: (row.os as any) ?? 'MAC' })
  }

  const handleDelete = (row: any) => {
    if (confirm('Delete this BYOD entry?')) deleteMut.mutate(row.id)
  }

  const handleSave = () => {
    if (!editingRowId) return
    updateMut.mutate({ id: editingRowId, name: draft.name, os: draft.os }, {
      onSuccess: () => setEditingRowId(null)
    })
  }

  const handleCancel = () => {
    setEditingRowId(null)
  }

  const cols = buildColumns({
    editingRowId,
    draft,
    onDraftChange: (patch) => setDraft((d) => ({ ...d, ...patch })),
    onEdit: handleEdit,
    onDelete: handleDelete,
    onSave: handleSave,
    onCancel: handleCancel,
  })
  return <DataTable columns={cols} data={data} />
}




