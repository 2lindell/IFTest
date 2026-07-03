import { useWorldStore } from '../store/worldStore'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface KindEditorProps {
  isNew?: boolean
  onSaved?: (id: string) => void
  onCancel?: () => void
}

function parseInitialValue(value: any) {
  if (value == null) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    if (Array.isArray(value)) return JSON.stringify(value)
    if ('property' in value && value.property != null) return String(value.property)
    if ('text' in value && value.text != null) return String(value.text)
    const keys = Object.keys(value)
    if (keys.length === 1) return String(value[keys[0]])
    return JSON.stringify(value)
  }
  return String(value)
}

function sqlEscape(value: string) {
  return value.replace(/'/g, "''")
}

function formatJsonbValue(value: any) {
  return `'${sqlEscape(JSON.stringify(value))}'::jsonb`
}

function buildKindPropertyStatements(kindId: string, actions: any[]) {
  const statements: string[] = []

  for (const action of actions) {
    const propertyId = Number(action.propertyId)
    if (action.type === 'delete') {
      statements.push(
        `DELETE FROM "Kind-Properties" WHERE kindproperty_kind_id = ${kindId} AND kindproperty_property_id = ${propertyId};`,
      )
    } else if (action.type === 'insert') {
      statements.push(
        `INSERT INTO "Kind-Properties" (kindproperty_property_id, kindproperty_kind_id, kindproperty_initial_value, kindproperty_implication) VALUES (${propertyId}, ${kindId}, ${formatJsonbValue(action.value)}, '{}'::text[]);`,
      )
    } else if (action.type === 'update') {
      statements.push(
        `UPDATE "Kind-Properties" SET kindproperty_initial_value = ${formatJsonbValue(action.value)} WHERE kindproperty_kind_id = ${kindId} AND kindproperty_property_id = ${propertyId};`,
      )
    }
  }

  return statements.join('\n')
}

function buildKindStatements(kind: any, kindNameValue: string, parentKindIdValue: string, isNewKind: boolean, propertyActions: any[]) {
  const statements: string[] = []

  if (isNewKind) {
    if (propertyActions.length > 0) {
      const valueRows = propertyActions
        .filter((action: any) => action.type === 'insert')
        .map((action: any) => {
          const valueSql = formatJsonbValue(action.value)
          return `(${Number(action.propertyId)}, (SELECT kind_id FROM inserted), ${valueSql}, '{}'::text[])`
        })
        .join(', ')

      if (valueRows.length > 0) {
        statements.push(
          `WITH inserted AS (INSERT INTO "All Kinds" (kind_name, kind_parent_id) VALUES ('${sqlEscape(kindNameValue.trim())}', ${parentKindIdValue ? Number(parentKindIdValue) : 'NULL'}) RETURNING kind_id)
INSERT INTO "Kind-Properties" (kindproperty_property_id, kindproperty_kind_id, kindproperty_initial_value, kindproperty_implication) VALUES ${valueRows};`,
        )
      } else {
        statements.push(
          `INSERT INTO "All Kinds" (kind_name, kind_parent_id) VALUES ('${sqlEscape(kindNameValue.trim())}', ${parentKindIdValue ? Number(parentKindIdValue) : 'NULL'});`,
        )
      }
    } else {
      statements.push(
        `INSERT INTO "All Kinds" (kind_name, kind_parent_id) VALUES ('${sqlEscape(kindNameValue.trim())}', ${parentKindIdValue ? Number(parentKindIdValue) : 'NULL'});`,
      )
    }
  } else if (kind) {
    const changes: string[] = []
    if (String(kind.kind_name) !== kindNameValue.trim()) {
      changes.push(`kind_name = '${sqlEscape(kindNameValue.trim())}'`)
    }
    if (String(kind.parent_kind_id) !== String(parentKindIdValue || '')) {
      changes.push(`kind_parent_id = ${parentKindIdValue ? Number(parentKindIdValue) : 'NULL'}`)
    }
    if (changes.length > 0) {
      statements.push(`UPDATE "All Kinds" SET ${changes.join(', ')} WHERE kind_id = ${Number(kind.kind_id)};`)
    }
  }

  return statements.join('\n')
}

function getPropertyValueFromEdit(item: any) {
  if (item.property.property_name) {
    if (!item.initialValue) return null
    try {
      return JSON.parse(item.initialValue)
    } catch {
      return item.initialValue
    }
  }
  return item.selectedOption ? item.selectedOption : null
}

function getPendingPropertyActions(pendingProps: any[], currentProps: any[]) {
  const currentMap = currentProps.reduce((map: Record<string, any>, kp: any) => {
    map[String(kp.kindproperty_property_id)] = kp
    return map
  }, {} as Record<string, any>)

  const actions: any[] = []
  for (const item of pendingProps) {
    const propertyId = String(item.property.property_id)
    const existing = currentMap[propertyId]
    const value = getPropertyValueFromEdit(item)

    if (item.applied) {
      if (!existing) {
        actions.push({ type: 'insert', propertyId: item.property.property_id, value })
      } else if (JSON.stringify(existing.kindproperty_initial_value) !== JSON.stringify(value)) {
        actions.push({ type: 'update', propertyId: item.property.property_id, value })
      }
    } else if (existing) {
      actions.push({ type: 'delete', propertyId: item.property.property_id })
    }
  }

  return actions
}

function getEitherOrDescription(prop: any, kp: any) {
  const a = prop.property_adjective
  let b = prop.property_opposite_adjective
  if (!a && !b) return null
  if (!b || !b.trim()) {
    b = ''
  }

  const parsed = parseInitialValue(kp?.kindproperty_initial_value)
  if (parsed) {
    const normalized = String(parsed).trim()
    if (normalized.length) {
      const lower = normalized.toLowerCase()
      if (b && lower === String(b).toLowerCase()) {
        return `usually ${b}, not ${a}`
      }
      if (lower === String(a).toLowerCase()) {
        return b ? `usually ${a}, not ${b}` : `usually ${a}`
      }
      if (!b && normalized.toLowerCase().startsWith('not ')) {
        return `usually ${normalized}`
      }
      return b ? `usually ${normalized}, not ${b}` : `usually ${normalized}`
    }
  }

  return b ? `usually ${a}, not ${b}` : `can be ${a}`
}

function indefiniteArticle(word: string | undefined | null) {
  if (!word || !word.trim()) return 'a'
  const w = word.trim().toLowerCase()
  return /^[aeiou]/.test(w) ? 'an' : 'a'
}

function getPropertyDescription(prop: any, kp: any, kinds: any[]) {
  const useEitherOr = prop.property_opposite_adjective || (prop.property_adjective && !prop.property_name)
  if (useEitherOr) {
    return getEitherOrDescription(prop, kp)
  }

  const kindName = kinds.find((k) => String(k.kind_id) === String(prop.property_kind_id))?.kind_name?.toLowerCase()
  if (prop.property_name?.trim()) {
    return `has ${indefiniteArticle(kindName)} ${kindName ?? 'kind'} called ${prop.property_name}`
  }
  if (kindName) {
    return `has ${indefiniteArticle(kindName)} ${kindName}`
  }
  return 'has a property'
}

export function KindEditor({ isNew, onSaved, onCancel }: KindEditorProps) {
  const selectedKindId = useWorldStore((state) => state.selectedKindId)
  const kinds = useWorldStore((state) => state.kinds)
  const properties = useWorldStore((s) => s.properties)
  const kindProperties = useWorldStore((s) => s.kindProperties)
  const setKindProperties = useWorldStore((s) => s.setKindProperties)
  const addKind = useWorldStore((state) => state.addKind)
  const updateKind = useWorldStore((state) => state.updateKind)
  const setSelectedKind = useWorldStore((state) => state.setSelectedKind)

  const selectedKind = kinds.find((kind) => kind.kind_id === selectedKindId)
  const [kindName, setKindName] = useState('')
  const [parentKindId, setParentKindId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPropsModal, setShowPropsModal] = useState(false)
  const [editProps, setEditProps] = useState<any[]>([])
  const [pendingKindProperties, setPendingKindProperties] = useState<any[] | null>(null)
  const [propsError, setPropsError] = useState<string | null>(null)
  const [dryRunSql, setDryRunSql] = useState('')
  const [previewActions, setPreviewActions] = useState<any[]>([])
  const [showSavePreview, setShowSavePreview] = useState(false)

  useEffect(() => {
    if (isNew) {
      setKindName('')
      setParentKindId('')
      setError(null)
      return
    }

    if (selectedKind) {
      setKindName(selectedKind.kind_name)
      setParentKindId(selectedKind.parent_kind_id ?? '')
      setError(null)
    }
  }, [selectedKind, isNew])

  const openPropsModal = () => {
    const kindId = selectedKind?.kind_id
    const kpForKind = (kindProperties || []).filter((kp: any) => String(kp.kindproperty_kind_id) === String(kindId))
    const applicableProperties = (properties || []).filter((p: any) => {
      return p.property_kind_id == null || (kindId && String(p.property_kind_id) === kindId)
    })

    // Map first-seen Kind-Properties row for each property to determine original source kind
    const sourceMap: Record<string, any> = {}
    for (const kp of (kindProperties || [])) {
      const pid = String(kp.kindproperty_property_id)
      if (!sourceMap[pid]) sourceMap[pid] = kp
    }

    let list = applicableProperties.map((p: any) => {
      const kp = kpForKind.find((k: any) => String(k.kindproperty_property_id) === String(p.property_id))
      const src = sourceMap[String(p.property_id)]
      return {
        property: p,
        applied: Boolean(kp),
        initialValue: kp && kp.kindproperty_initial_value != null ? JSON.stringify(kp.kindproperty_initial_value) : '',
        selectedOption: kp && kp.kindproperty_initial_value != null ? String(kp.kindproperty_initial_value) : '',
        sourceKindId: src ? String(src.kindproperty_kind_id) : '',
      }
    })

    // Sort by originating kind id (numeric), then by property id
    list.sort((a: any, b: any) => {
      if (a.sourceKindId && b.sourceKindId) return Number(a.sourceKindId) - Number(b.sourceKindId)
      if (a.sourceKindId) return -1
      if (b.sourceKindId) return 1
      return Number(a.property.property_id) - Number(b.property.property_id)
    })

    const initial = pendingKindProperties ?? list
    setEditProps(initial)
    setPendingKindProperties(initial)
    setPropsError(null)
    setShowPropsModal(true)
  }

  const saveProps = () => {
    for (const item of editProps) {
      if (!item.applied) {
        continue
      }
      if (item.property.property_name && !item.initialValue.trim()) {
        setPropsError(`Provide an initial value for ${item.property.property_name}.`)
        return
      }
      if (!item.property.property_name && !item.selectedOption?.trim()) {
        setPropsError(`Select a property choice for ${item.property.property_adjective}.`)
        return
      }
    }

    setPendingKindProperties(editProps)
    setPropsError(null)
    setShowPropsModal(false)
  }

  const resetPendingChanges = () => {
    setPendingKindProperties(null)
    setEditProps([])
    setShowSavePreview(false)
    setPropsError(null)
  }

  const currentKindProperties = selectedKind
    ? (kindProperties || []).filter((kp: any) => String(kp.kindproperty_kind_id) === String(selectedKind.kind_id))
    : []

  const displayProperties = pendingKindProperties
    ? pendingKindProperties
    : currentKindProperties.map((kp: any) => {
        const prop = (properties || []).find((p: any) => String(p.property_id) === String(kp.kindproperty_property_id))
        return {
          property: prop,
          value: kp.kindproperty_initial_value,
          changed: false,
          applied: true,
        }
      })

  const prepareSavePreview = () => {
    if (!kindName.trim()) {
      setError('Kind name is required.')
      return
    }

    setError(null)
    const actions = getPendingPropertyActions(pendingKindProperties ?? [], currentKindProperties)
    const kindSql = buildKindStatements(selectedKind, kindName, parentKindId, Boolean(isNew), actions)
    const propertySql = isNew ? '' : buildKindPropertyStatements(String(selectedKind?.kind_id ?? 0), actions)
    const sqlPreview = [kindSql, propertySql].filter(Boolean).join('\n\n') || '-- No database changes detected.'

    setPreviewActions(actions)
    setDryRunSql(sqlPreview)
    setShowSavePreview(true)
  }

  const confirmSave = async () => {
    setError(null)
    setPropsError(null)

    if (!kindName.trim()) {
      setError('Kind name is required.')
      return
    }
    if (!supabase) {
      setError('Supabase client is not available.')
      return
    }

    setSaving(true)

    try {
      let savedKindId = selectedKind?.kind_id
      if (isNew) {
        const payload = {
          kind_name: kindName.trim(),
          kind_parent_id: parentKindId || null,
        }
        const { data, error } = await supabase
          .from('All Kinds')
          .insert([payload])
          .select('kind_id')
          .single()
        if (error) throw error
        if (!data) throw new Error('Failed to create kind.')

        savedKindId = String(data.kind_id)

        const newKind = {
          kind_id: savedKindId,
          kind_name: kindName.trim(),
          parent_kind_id: parentKindId || undefined,
          kind_properties: {},
        }
        addKind(newKind)
        setSelectedKind(savedKindId)
        onSaved?.(savedKindId)
      } else if (selectedKind) {
        const updates: Record<string, unknown> = {}
        if (String(selectedKind.kind_name) !== kindName.trim()) {
          updates.kind_name = kindName.trim()
        }
        if (String(selectedKind.parent_kind_id) !== String(parentKindId || '')) {
          updates.kind_parent_id = parentKindId || null
        }
        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from('All Kinds')
            .update(updates)
            .eq('kind_id', selectedKind.kind_id)
          if (error) throw error
          updateKind(selectedKind.kind_id, {
            kind_name: kindName.trim(),
            parent_kind_id: parentKindId || undefined,
          })
        }
      }

      const deleteActions = previewActions.filter((action: any) => action.type === 'delete')
      const upsertActions = previewActions.filter((action: any) => action.type === 'insert' || action.type === 'update')

      if (upsertActions.length > 0) {
        const upsertPayload = upsertActions.map((action: any) => ({
          kindproperty_property_id: Number(action.propertyId),
          kindproperty_kind_id: Number(savedKindId),
          kindproperty_initial_value: action.value,
          kindproperty_implication: [] as string[],
        }))
        const { error: upsertError } = await supabase
          .from('Kind-Properties')
          .upsert(upsertPayload, { onConflict: ['kindproperty_property_id', 'kindproperty_kind_id'] as any })
        if (upsertError) throw upsertError
      }

      for (const deleteAction of deleteActions) {
        const { error: deleteError } = await supabase
          .from('Kind-Properties')
          .delete()
          .match({
            kindproperty_kind_id: Number(savedKindId),
            kindproperty_property_id: Number(deleteAction.propertyId),
          })
        if (deleteError) throw deleteError
      }

      const remaining = (kindProperties || []).filter((kp: any) => {
        if (String(kp.kindproperty_kind_id) !== String(savedKindId)) {
          return true
        }
        return !deleteActions.some((action: any) => String(action.propertyId) === String(kp.kindproperty_property_id))
      })

      const newLocal = [
        ...remaining,
        ...upsertActions.map((action: any) => ({
          kindproperty_property_id: String(action.propertyId),
          kindproperty_kind_id: String(savedKindId),
          kindproperty_initial_value: action.value,
          kindproperty_implication: [],
        })),
      ]

      setKindProperties(newLocal)
      setPendingKindProperties(null)
      setShowSavePreview(false)
    } catch (err: any) {
      setError(err?.message ?? 'Unable to save kind.')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => {
    prepareSavePreview()
  }

  if (!selectedKind && !isNew) {
    return null
  }

  const parentKind = parentKindId ? kinds.find((k) => k.kind_id === parentKindId) : null
  const currentKindName = isNew ? 'New Kind' : kindName
  const showConfirmEnabled = showSavePreview && dryRunSql.trim() !== '-- No database changes detected.'

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{currentKindName}</h2>
          {parentKind && <p className="text-sm text-gray-600 mt-1">Parent: {parentKind.kind_name}</p>}
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
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold mb-3">Properties</h4>
              <button onClick={openPropsModal} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Edit Properties</button>
            </div>
            <div className="space-y-2">
              {displayProperties.length > 0 ? (
                displayProperties.map((item: any) => {
                  if (!item.property) return null
                  const displayText = getPropertyDescription(item.property, { kindproperty_initial_value: item.value }, kinds)
                  return (
                    <div
                      key={`${item.property.property_id}-${item.applied ? 'on' : 'off'}`}
                      className={`text-sm rounded px-3 py-2 ${item.changed ? 'bg-yellow-100 border border-yellow-200 text-yellow-900' : 'text-gray-700'}`}
                    >
                      <span>{displayText}</span>
                    </div>
                  )
                })
              ) : (
                <div className="text-sm text-gray-500">No properties are currently set.</div>
              )}
            </div>
          </div>

          {showSavePreview && (
            <div className="rounded-lg border border-gray-200 bg-slate-50 p-4 text-sm">
              <div className="mb-2 text-gray-700">Preview the SQL commands that will be applied to the database.</div>
              <textarea
                readOnly
                value={dryRunSql || '-- No database changes detected.'}
                className="w-full min-h-[180px] rounded border border-gray-300 bg-white p-3 text-xs font-mono text-gray-800"
              />
              <div className="flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setShowSavePreview(false)}
                  className="px-3 py-1 border rounded"
                >
                  Back to edit
                </button>
                <button
                  type="button"
                  onClick={confirmSave}
                  disabled={!showConfirmEnabled || saving}
                  className="px-3 py-1 bg-green-600 text-white rounded disabled:cursor-not-allowed disabled:bg-green-300"
                >
                  {saving ? 'Saving…' : 'Confirm Save'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
        {pendingKindProperties && (
          <button
            type="button"
            onClick={resetPendingChanges}
            disabled={saving}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset Changes
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {saving ? 'Saving…' : 'Preview SQL'}
        </button>
      </div>

      {showPropsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowPropsModal(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Manage Properties for {kindName || 'this kind'}</h3>
              <button onClick={() => setShowPropsModal(false)} className="text-gray-600">Close</button>
            </div>

                  <div className="space-y-3 max-h-72 overflow-auto">
              {editProps.map((item, idx) => (
                <div key={item.property.property_id} className="flex items-start gap-3 p-2 border-b">
                  <div>
                    <input
                      type="checkbox"
                      checked={item.applied}
                      onChange={(e) => {
                        const copy = [...editProps]
                        copy[idx] = { ...item, applied: e.target.checked }
                        setEditProps(copy)
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.property.property_name ?? item.property.property_adjective}</div>
                    {item.property.property_name ? (
                      <div className="text-xs text-gray-600">Kind: {kinds.find((k) => String(k.kind_id) === String(item.property.property_kind_id))?.kind_name ?? 'Unknown'}</div>
                    ) : (
                      <div className="text-xs text-gray-600">{getPropertyDescription(item.property, { kindproperty_initial_value: item.initialValue ? JSON.parse(item.initialValue) : null }, kinds)}</div>
                    )}

                    {item.property.property_name ? (
                      <div className="mt-2">
                        <label className="block text-xs text-gray-600">Initial Value (JSON)</label>
                        <input
                          value={item.initialValue}
                          onChange={(e) => {
                            const copy = [...editProps]
                            copy[idx] = { ...item, initialValue: e.target.value }
                            setEditProps(copy)
                          }}
                          className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 font-mono text-sm"
                          placeholder='e.g. "blue" or {"count":1}'
                        />
                      </div>
                    ) : (
                      <div className="mt-2">
                        <label className="block text-xs text-gray-600">Select whether the property applies or not</label>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <label className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm">
                            <input
                              type="radio"
                              name={`property-${item.property.property_id}`}
                              value={item.property.property_adjective}
                              checked={item.selectedOption === item.property.property_adjective}
                              onChange={() => {
                                const copy = [...editProps]
                                copy[idx] = { ...item, selectedOption: item.property.property_adjective }
                                setEditProps(copy)
                              }}
                            />
                            {item.property.property_adjective}
                          </label>
                          {item.property.property_opposite_adjective ? (
                            <label className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm">
                              <input
                                type="radio"
                                name={`property-${item.property.property_id}`}
                                value={item.property.property_opposite_adjective}
                                checked={item.selectedOption === item.property.property_opposite_adjective}
                                onChange={() => {
                                  const copy = [...editProps]
                                  copy[idx] = { ...item, selectedOption: item.property.property_opposite_adjective }
                                  setEditProps(copy)
                                }}
                              />
                              {item.property.property_opposite_adjective}
                            </label>
                          ) : (
                            <label className="inline-flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm">
                              <input
                                type="radio"
                                name={`property-${item.property.property_id}`}
                                value={`not ${item.property.property_adjective}`}
                                checked={item.selectedOption === `not ${item.property.property_adjective}`}
                                onChange={() => {
                                  const copy = [...editProps]
                                  copy[idx] = { ...item, selectedOption: `not ${item.property.property_adjective}` }
                                  setEditProps(copy)
                                }}
                              />
                              not {item.property.property_adjective}
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {propsError && <div className="text-xs text-red-600 mt-2">{propsError}</div>}

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowPropsModal(false)} className="px-3 py-1 border rounded">Cancel</button>
              <button onClick={saveProps} className="px-3 py-1 bg-blue-600 text-white rounded">Save Properties</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
