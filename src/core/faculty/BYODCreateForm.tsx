import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldDescription, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateFacultyByod } from './hooks/useFacultyByods'

interface Props {
  facultyId: number
  onCreated?: () => void
  onCancel?: () => void
}

type FormValues = {
  name: string
  os: 'MAC' | 'PC' | 'IPAD' | 'OTHER'
}

export default function BYODCreateForm({ facultyId, onCreated, onCancel }: Props) {
  const { register, handleSubmit, reset, control } = useForm<FormValues>({
    defaultValues: { name: '', os: 'MAC' }
  })
  const createMut = useCreateFacultyByod(facultyId)

  const onSubmit = (values: FormValues) => {
    createMut.mutate({ faculty: facultyId, name: values.name, os: values.os }, {
      onSuccess: () => {
        reset()
        onCreated?.()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-3">
      <FieldSet>
        <FieldLegend>Add BYOD device</FieldLegend>
        <FieldDescription>Add a personal device used by this faculty member.</FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="byod-name">Device name</FieldLabel>
            <Input
              id="byod-name"
              autoComplete="off"
              placeholder="e.g. Jane’s MacBook Pro"
              {...register('name', { required: true })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="byod-os">Operating system</FieldLabel>
            <Controller
              name="os"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="byod-os">
                    <SelectValue placeholder="Select OS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAC">Mac</SelectItem>
                    <SelectItem value="PC">PC</SelectItem>
                    <SelectItem value="IPAD">iPad</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </FieldGroup>
        <div className="mt-2 flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => { reset(); onCancel?.(); }}>
            Cancel
          </Button>
          <Button type="submit" disabled={createMut.isPending}>Add</Button>
        </div>
      </FieldSet>
    </form>
  )
}


