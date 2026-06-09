import { useWorldStore } from '../store/worldStore'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface KindEditorProps {
  isNew?: boolean
  onSaved?: (id: string) => void
  onCancel?: () => void
}

export function KindEditor({ isNew, onSaved, onCancel }: KindEditorProps) {
  const selectedKindId = useWorldStore((state) => state.selectedKindId)
  const kinds = useWorldStore((state) => state.kinds)
  const addKind = useWorldStore((state) => state.addKind)
  const updateKind = useWorldStore((state) => state.updateKind)
  const setSelectedKind = useWorldStore((state) => state.setSelectedKind)

  const selectedKind = kinds.find((kind) => kind.kind_id === selectedKindId)
  const [kindName, setKindName] = useState('')
  const [parentKindId, setParentKindId] = useState('')
  const [propertiesJson, setPropertiesJson] = useState('{}')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew) {
      setKindName('')
      setParentKindId('')
      setPropertiesJson('{}')
      setError(null)
      return
    }

    if (selectedKind) {
      setKindName(selectedKind.kind_name)
      setParentKindId(selectedKind.parent_kind_id ?? '')
      setPropertiesJson(JSON.stringify(selectedKind.kind_properties ?? {}, null, 2))
      setError(null)
    }
  }, [selectedKind, isNew])

  const handlePropertiesChange = (value: string) => {
    setPropertiesJson(value)
    if (!isNew && selectedKind) {
      try {
        const parsed = JSON.parse(value)
        updateKind(selectedKind.kind_id, {
          kind_properties: parsed,
        })
      } catch (e) {
        // Invalid JSON, don't update yet
      }
    }
  }

  const handleSave = async () => {
    setError(null)

    if (!kindName.trim()) {
      setError('Kind name is required.')
      return
    }

    let parsedProperties: any = {}
    try {
      parsedProperties = JSON.parse(propertiesJson)
    } catch (e) {
      setError('Kind properties must be valid JSON.')
      return
    }

    setSaving(true)
    const payload = {
      kind_name: kindName.trim(),
      parent_kind_id: parentKindId || null,
      kind_properties: parsedProperties,
    }

    try {
      if (!supabase) {
        throw new Error('Supabase client is not available.')
      }

      if (isNew) {
        const { data, error } = await supabase
          .from('All Kinds')
          .insert([payload])
          .select('*')
          .single()

        if (error) throw error
        if (!data) throw new Error('No kind returned from insert.')

        const newKind = {
          kind_id: String(data.kind_id),
          kind_name: String(data.kind_name),
          parent_kind_id: data.parent_kind_id ? String(data.parent_kind_id) : undefined,
          parent_kind_name: undefined,
          source: 'Kinds',
          kind_properties: data.kind_properties ?? {},
        }

        addKind(newKind)
        setSelectedKind(newKind.kind_id)
        onSaved?.(newKind.kind_id)
      } else if (selectedKind) {
        const { error } = await supabase
          .from('All Kinds')
          .update(payload)
          .eq('kind_id', selectedKind.kind_id)

        if (error) throw error

        updateKind(selectedKind.kind_id, {
          kind_name: payload.kind_name,
          parent_kind_id: payload.parent_kind_id ?? undefined,
          kind_properties: payload.kind_properties,
        })
        onSaved?.(selectedKind.kind_id)
      }
    } catch (err: any) {
      setError(err?.message ?? 'Unable to save kind.')
    } finally {
      setSaving(false)
    }
  }

  if (!selectedKind && !isNew) {
    return null
  }

  const parentKind = parentKindId
    ? kinds.find((k) => k.kind_id === parentKindId)
    : null

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{isNew ? 'New Kind' : kindName}</h2>
          {parentKind && (
            <p className="text-sm text-gray-600 mt-1">Parent: {parentKind.kind_name}</p>
          )}
        </div>
        {onCancel && isNew && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Kind Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Kind Name</label>
                <input
                  value={kindName}
                  onChange={(e) => setKindName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Parent Kind</label>
                <select
                  value={parentKindId}
                  onChange={(e) => setParentKindId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {kinds.map((kind) => (
                    <option key={kind.kind_id} value={kind.kind_id}>
                      {kind.kind_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!isNew && selectedKind && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Kind ID</label>
                <p className="mt-1 text-gray-500 font-mono text-xs">{selectedKind.kind_id}</p>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Properties (JSONB)</h3>
            <textarea
              value={propertiesJson}
              onChange={(e) => handlePropertiesChange(e.target.value)}
              className="w-full h-64 p-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="{}"
            />
            <p className="text-xs text-gray-500 mt-2">
              Edit properties as JSON. Save to persist changes.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {saving ? 'Saving…' : isNew ? 'Create Kind' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
