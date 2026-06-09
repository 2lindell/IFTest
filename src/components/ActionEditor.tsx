import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useWorldStore } from '../store/worldStore'

function sqlEscape(value: string) {
  return value.replace(/'/g, "''")
}

function formatArray(values: string[]) {
  return `ARRAY[${values.map((value) => `'${sqlEscape(value)}'`).join(', ')}]`
}

function toCommandArray(text: string) {
  return text
    .split(/[,\r?\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function ActionEditor({
  isNew,
  onSaved,
}: {
  isNew?: boolean
  onSaved?: (actionId: string) => void
}) {
  const selectedActionId = useWorldStore((state) => state.selectedActionId)
  const actions = useWorldStore((state) => state.actions)
  const kinds = useWorldStore((state) => state.kinds)
  const addAction = useWorldStore((state) => state.addAction)
  const updateAction = useWorldStore((state) => state.updateAction)
  const setSelectedAction = useWorldStore((state) => state.setSelectedAction)

  const action = actions.find((item) => item.action_id === selectedActionId)
  const editingExisting = Boolean(action && !isNew)

  const [actionName, setActionName] = useState('')
  const [directKindId, setDirectKindId] = useState('')
  const [indirectKindId, setIndirectKindId] = useState('')
  const [outOfWorld, setOutOfWorld] = useState(false)
  const [commandsText, setCommandsText] = useState('')
  const [variablesText, setVariablesText] = useState('{}')
  const [dryRunSql, setDryRunSql] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (action && !isNew) {
      setActionName(action.action_name || '')
      setDirectKindId(action.action_direct_kind || '')
      setIndirectKindId(action.action_indirect_kind || '')
      setOutOfWorld(Boolean(action.action_out_of_world))
      setCommandsText((action.action_commands || []).join('\n'))
      setVariablesText(JSON.stringify(action.action_variables || {}, null, 2))
      setDryRunSql('')
      setError(null)
      return
    }

    if (isNew) {
      setActionName('')
      setDirectKindId('')
      setIndirectKindId('')
      setOutOfWorld(false)
      setCommandsText('')
      setVariablesText('{}')
      setDryRunSql('')
      setError(null)
    }
  }, [action, isNew])

  const actionsKindOptions = [{ kind_id: '', kind_name: 'None' }, ...kinds]

  const buildSql = () => {
    if (!actionName.trim()) {
      setError('Action name is required for dry-run SQL.')
      return
    }
    setError(null)

    const commands = toCommandArray(commandsText)
    const variables = variablesText.trim() ? variablesText.trim() : ''
    let variablesJson: string | null = null
    if (variables) {
      try {
        variablesJson = JSON.stringify(JSON.parse(variables))
      } catch (err) {
        setError('Variables must be valid JSON.')
        return
      }
    }

    const columns: string[] = ['action_name']
    const values: string[] = [`'${sqlEscape(actionName.trim())}'`]
    if (directKindId) {
      columns.push('action_direct_kind')
      values.push(`'${sqlEscape(directKindId)}'`) // id string will be cast by supabase if necessary
    }
    if (indirectKindId) {
      columns.push('action_indirect_kind')
      values.push(`'${sqlEscape(indirectKindId)}'`)
    }
    if (outOfWorld) {
      columns.push('action_out_of_world')
      values.push('true')
    }
    if (commands.length > 0) {
      columns.push('action_commands')
      values.push(formatArray(commands))
    }
    if (variablesJson !== null) {
      columns.push('action_variables')
      values.push(`'${sqlEscape(variablesJson)}'::jsonb`)
    }

    const sql = editingExisting && action
      ? `UPDATE "Actions" SET ${columns.map((column, index) => `${column} = ${values[index]}`).join(', ')} WHERE action_id = ${sqlEscape(action.action_id)};`
      : `INSERT INTO "Actions" (${columns.join(', ')}) VALUES (${values.join(', ')});`

    setDryRunSql(sql)
  }

  const handleSave = async () => {
    if (!actionName.trim()) {
      setError('Action name is required.')
      return
    }

    let variablesJson: Record<string, unknown> | null = null
    if (variablesText.trim()) {
      try {
        variablesJson = JSON.parse(variablesText)
      } catch (err) {
        setError('Variables must be valid JSON.')
        return
      }
    }

    const payload: Record<string, unknown> = {
      action_name: actionName.trim(),
      action_direct_kind: directKindId || null,
      action_indirect_kind: indirectKindId || null,
      action_out_of_world: outOfWorld,
      action_commands: toCommandArray(commandsText),
      action_variables: variablesJson || {},
    }

    setSaving(true)
    setError(null)
    const sb = supabase
    if (!sb) {
      setError('Supabase client is not initialized.')
      setSaving(false)
      return
    }

    try {
      if (editingExisting && action) {
        const { error: updateError, data } = await sb
          .from('Actions')
          .update(payload)
          .eq('action_id', action.action_id)

        if (updateError) {
          throw updateError
        }

        if (data && data[0]) {
          updateAction(action.action_id, {
            ...payload,
            action_id: action.action_id,
            action_direct_kind_name: kinds.find((k) => k.kind_id === directKindId)?.kind_name,
            action_indirect_kind_name: kinds.find((k) => k.kind_id === indirectKindId)?.kind_name,
          } as any)
        }

        onSaved?.(action.action_id)
      } else {
        const { data, error: insertError } = await sb
          .from('Actions')
          .insert([payload])
          .select('*')
          .single()

        if (insertError) {
          throw insertError
        }

        if (data) {
          const actionId = String((data as any).action_id)
          addAction({
            action_id: actionId,
            action_name: String((data as any).action_name),
            action_direct_kind: data.action_direct_kind ? String(data.action_direct_kind) : undefined,
            action_indirect_kind: data.action_indirect_kind ? String(data.action_indirect_kind) : undefined,
            action_out_of_world: Boolean(data.action_out_of_world),
            action_commands: Array.isArray(data.action_commands) ? data.action_commands.map(String) : [],
            action_variables: data.action_variables ?? {},
            action_direct_kind_name: data.action_direct_kind
              ? kinds.find((k) => k.kind_id === String(data.action_direct_kind))?.kind_name
              : undefined,
            action_indirect_kind_name: data.action_indirect_kind
              ? kinds.find((k) => k.kind_id === String(data.action_indirect_kind))?.kind_name
              : undefined,
          })
          setSelectedAction(actionId)
          onSaved?.(actionId)
        }
      }
    } catch (err) {
      console.error('Error saving action:', err)
      setError(err instanceof Error ? err.message : 'Failed to save action')
    } finally {
      setSaving(false)
    }
  }

  const title = editingExisting ? `Edit Action: ${action?.action_name}` : 'Create New Action'

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Action Name</label>
            <input
              value={actionName}
              onChange={(e) => setActionName(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Pick up"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Direct Kind</label>
            <select
              value={directKindId}
              onChange={(e) => setDirectKindId(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {actionsKindOptions.map((kind) => (
                <option key={kind.kind_id} value={kind.kind_id}>
                  {kind.kind_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Indirect Kind</label>
            <select
              value={indirectKindId}
              onChange={(e) => setIndirectKindId(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {actionsKindOptions.map((kind) => (
                <option key={kind.kind_id} value={kind.kind_id}>
                  {kind.kind_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Out of world</label>
            <input
              type="checkbox"
              checked={outOfWorld}
              onChange={(e) => setOutOfWorld(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Action Commands</label>
          <textarea
            value={commandsText}
            onChange={(e) => setCommandsText(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
            placeholder="Enter one command per line or comma separated"
          />
          <p className="text-xs text-gray-500 mt-2">
            Commands map to action command forms. Leave blank if none.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Action Variables (JSON)</label>
          <textarea
            value={variablesText}
            onChange={(e) => setVariablesText(e.target.value)}
            rows={6}
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
            placeholder="{}"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={buildSql}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Dry-run SQL
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {editingExisting ? 'Save Changes' : 'Create Action'}
          </button>
        </div>

        {dryRunSql && (
          <div>
            <h3 className="text-sm font-medium mb-2">Dry-run SQL</h3>
            <textarea
              readOnly
              value={dryRunSql}
              className="w-full h-40 p-3 font-mono text-sm border border-gray-300 rounded bg-gray-50"
            />
          </div>
        )}
      </div>
    </div>
  )
}
