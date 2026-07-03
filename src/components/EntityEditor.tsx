import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useWorldStore } from '../store/worldStore'

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

function wrapTextValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return trimmed
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed
  }
  return `"${trimmed.replace(/"/g, '\\"')}"`
}

function sqlEscape(value: string) {
  return value.replace(/'/g, "''")
}

function formatJsonbValue(value: any) {
  return `'${sqlEscape(JSON.stringify(value))}'::jsonb`
}

function buildPropertyStatements(entityId: string, actions: any[]) {
  const statements: string[] = []

  for (const action of actions) {
    const propertyId = Number(action.propertyId)
    if (action.type === 'delete') {
      statements.push(
        `DELETE FROM "Entity-Properties" WHERE entityproperty_entity_id = ${entityId} AND entityproperty_property_id = ${propertyId};`,
      )
    } else if (action.type === 'insert') {
      statements.push(
        `INSERT INTO "Entity-Properties" (entityproperty_property_id, entityproperty_entity_id, entityproperty_initial_value) VALUES (${propertyId}, ${entityId}, ${formatJsonbValue(action.value)});`,
      )
    } else if (action.type === 'update') {
      statements.push(
        `UPDATE "Entity-Properties" SET entityproperty_initial_value = ${formatJsonbValue(action.value)} WHERE entityproperty_entity_id = ${entityId} AND entityproperty_property_id = ${propertyId};`,
      )
    }
  }

  return statements.join('\n')
}

function buildEntityStatements(entity: any, entityName: string, entityKindId: string, isNew: boolean, propertyActions: any[]) {
  const statements: string[] = []

  if (isNew) {
    if (propertyActions.length > 0) {
      const valueRows = propertyActions
        .filter((action: any) => action.type === 'insert')
        .map((action: any) => {
          const valueSql = formatJsonbValue(action.value)
          return `(${Number(action.propertyId)}, (SELECT entity_id FROM inserted), ${valueSql})`
        })
        .join(', ')

      if (valueRows.length > 0) {
        statements.push(
          `WITH inserted AS (INSERT INTO "Entities" (entity_name, entity_of_kind_id) VALUES ('${sqlEscape(entityName.trim())}', ${Number(entityKindId)}) RETURNING entity_id)
INSERT INTO "Entity-Properties" (entityproperty_property_id, entityproperty_entity_id, entityproperty_initial_value) VALUES ${valueRows};`,
        )
      } else {
        statements.push(
          `INSERT INTO "Entities" (entity_name, entity_of_kind_id) VALUES ('${sqlEscape(entityName.trim())}', ${Number(entityKindId)});`,
        )
      }
    } else {
      statements.push(
        `INSERT INTO "Entities" (entity_name, entity_of_kind_id) VALUES ('${sqlEscape(entityName.trim())}', ${Number(entityKindId)});`,
      )
    }
  } else if (entity) {
    const changes: string[] = []
    if (String(entity.entity_name) !== entityName.trim()) {
      changes.push(`entity_name = '${sqlEscape(entityName.trim())}'`)
    }
    if (String(entity.entity_of_kind_id) !== String(entityKindId)) {
      changes.push(`entity_of_kind_id = ${Number(entityKindId)}`)
    }
    if (changes.length > 0) {
      statements.push(`UPDATE "Entities" SET ${changes.join(', ')} WHERE entity_id = ${Number(entity.entity_id)};`)
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
  if (item.selectedOption) {
    return item.selectedOption
  }
  return null
}

function buildEntityPropertyBaselineMap(properties: any[], entityPropertiesIndex: Record<string, any> | null, currentProps: any[]) {
  const explicitMap: Record<string, any> = {}
  const baselineMap: Record<string, any> = {}

  currentProps.forEach((ep: any) => {
    const id = String(ep.entityproperty_property_id)
    explicitMap[id] = ep.entityproperty_initial_value
    baselineMap[id] = ep.entityproperty_initial_value
  })

  if (!entityPropertiesIndex) {
    return { baselineMap, explicitMap }
  }

  Object.entries(entityPropertiesIndex).forEach(([key, value]) => {
    if (key.startsWith('property_')) {
      baselineMap[key.replace('property_', '')] = value
    } else {
      const property = properties.find((p: any) => p.property_name === key)
      if (property) {
        const id = String(property.property_id)
        if (!(id in baselineMap)) {
          baselineMap[id] = value
        }
      }
    }
  })

  return { baselineMap, explicitMap }
}

function getPendingPropertyActions(pendingProps: any[], baselineMap: Record<string, any>, explicitMap: Record<string, any>) {
  const actions: any[] = []

  for (const item of pendingProps) {
    const propertyId = String(item.property.property_id)
    const existing = explicitMap[propertyId]
    const baselineValue = baselineMap[propertyId]
    const value = item.applied ? getPropertyValueFromEdit(item) : null

    if (item.applied) {
      const isDifferent = JSON.stringify(value) !== JSON.stringify(baselineValue)
      if (!isDifferent) {
        continue
      }

      if (existing !== undefined) {
        actions.push({ type: 'update', propertyId: item.property.property_id, value })
      } else {
        actions.push({ type: 'insert', propertyId: item.property.property_id, value })
      }
    } else if (baselineValue !== undefined) {
      actions.push({ type: 'delete', propertyId: item.property.property_id })
    }
  }

  return actions
}

function getEntityPropertyDescription(property: any, kp: any, kinds: any[]) {
  const parsed = parseInitialValue(kp?.entityproperty_initial_value)
  const normalized = parsed != null ? String(parsed).trim() : ''
  const hasOpposite = Boolean(property.property_opposite_adjective)
  const hasAdjective = Boolean(property.property_adjective)
  const isNamed = Boolean(property.property_name)
  const kind = kinds.find((k) => String(k.kind_id) === String(property.property_kind_id))
  const isTextKind = kind?.kind_name?.toLowerCase() === 'text'

  if (isNamed) {
    if (normalized.length) {
      const displayValue = isTextKind ? wrapTextValue(normalized) : normalized
      return `has ${property.property_name} ${displayValue}`
    }
    return `has ${property.property_name}`
  }

  if (hasOpposite || hasAdjective) {
    if (normalized.length) {
      const value = isTextKind ? wrapTextValue(normalized) : normalized
      const lower = normalized.toLowerCase()
      const adj = String(property.property_adjective || '').trim()
      const opposite = String(property.property_opposite_adjective || '').trim()

      if (opposite && lower === opposite.toLowerCase()) {
        return opposite
      }
      if (adj && lower === adj.toLowerCase()) {
        return adj
      }
      return value
    }

    if (hasAdjective && hasOpposite) {
      return `${property.property_adjective} not ${property.property_opposite_adjective}`
    }
    if (property.property_adjective) {
      return property.property_adjective
    }
    if (property.property_opposite_adjective) {
      return property.property_opposite_adjective
    }
  }

  if (property.property_name) {
    return `has ${property.property_name}`
  }

  return 'has a property'
}

export function EntityEditor() {
  const selectedEntityId = useWorldStore((state) => state.selectedEntityId)
  const entities = useWorldStore((state) => state.entities)
  const kinds = useWorldStore((state) => state.kinds)
  const properties = useWorldStore((state) => state.properties)
  const kindProperties = useWorldStore((state) => state.kindProperties)
  const entityProperties = useWorldStore((state) => state.entityProperties)
  const setEntities = useWorldStore((state) => state.setEntities)
  const setEntityProperties = useWorldStore((state) => state.setEntityProperties)
  const setSelectedEntity = useWorldStore((state) => state.setSelectedEntity)
  
  const entity = entities.find((item) => String(item.entity_id) === String(selectedEntityId))
  const [isNew, setIsNew] = useState(false)
  const [entityName, setEntityName] = useState('')
  const [entityKindId, setEntityKindId] = useState('')
  const [showPropsModal, setShowPropsModal] = useState(false)
  const [editProps, setEditProps] = useState<any[]>([])
  const [entityPropertiesIndex, setEntityPropertiesIndex] = useState<Record<string, any> | null>(null)
  const [pendingEntityProperties, setPendingEntityProperties] = useState<any[] | null>(null)
  const [propsError, setPropsError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dryRunSql, setDryRunSql] = useState('')
  const [previewActions, setPreviewActions] = useState<any[]>([])
  const [showSavePreview, setShowSavePreview] = useState(false)

  const getAncestorKindIds = (kindId: string) => {
    const result = new Set<string>()
    let currentKind = kinds.find((k) => String(k.kind_id) === String(kindId))
    while (currentKind?.parent_kind_id) {
      const parentId = String(currentKind.parent_kind_id)
      if (result.has(parentId)) break
      result.add(parentId)
      currentKind = kinds.find((k) => String(k.kind_id) === parentId)
    }
    return result
  }

  useEffect(() => {
    if (entity) {
      setEntityName(entity.entity_name)
      setEntityKindId(entity.entity_of_kind_id)
      setError(null)
      setIsNew(false)
      // Clear any pending edits when switching to an existing entity
      resetPendingChanges()
      return
    }

    if (selectedEntityId === 'new') {
      setEntityName('')
      setEntityKindId(kinds?.[0]?.kind_id ?? '')
      setError(null)
      setIsNew(true)
      // Clear pending edits when creating a new entity
      resetPendingChanges()
      return
    }
  }, [entity, selectedEntityId, kinds])

  const loadEntityIndex = async () => {
    if (!entity || selectedEntityId === 'new') {
      setEntityPropertiesIndex(null)
      return
    }
    if (!supabase) {
      console.warn('Supabase client is not initialized for entity index lookup.')
      setEntityPropertiesIndex(null)
      return
    }

    try {
      const { data, error } = await supabase
        .from('Entity Assertions')
        .select('entity_properties_index')
        .eq('entity_id', Number(selectedEntityId))
        .single()

      if (error) {
        console.warn('Failed to load entity_properties_index:', error.message)
        setEntityPropertiesIndex(null)
        return
      }

      setEntityPropertiesIndex((data as any)?.entity_properties_index ?? null)
    } catch (err) {
      console.warn('Unexpected error loading entity_properties_index:', err)
      setEntityPropertiesIndex(null)
    }
  }

  useEffect(() => {
    loadEntityIndex()
  }, [entity, selectedEntityId])

  const openPropsModal = () => {
    if (!entity) return

    const applicableKindIds = getAncestorKindIds(entity.entity_of_kind_id)
    applicableKindIds.add(String(entity.entity_of_kind_id))

    const applicableKindPropertyIds = new Set(
      (kindProperties || [])
        .filter((kp: any) => applicableKindIds.has(String(kp.kindproperty_kind_id)))
        .map((kp: any) => String(kp.kindproperty_property_id)),
    )

    const applicableProperties = (properties || []).filter((p: any) => {
      return (
        p.property_kind_id == null ||
        applicableKindIds.has(String(p.property_kind_id)) ||
        applicableKindPropertyIds.has(String(p.property_id))
      )
    })

    const index = entityPropertiesIndex ?? {}
    const indexByPropertyId = new Map<string, any>()
    const indexByPropertyName = new Map<string, any>()

    Object.entries(index).forEach(([key, value]) => {
      if (key.startsWith('property_')) {
        indexByPropertyId.set(key.replace('property_', ''), value)
      } else {
        indexByPropertyName.set(key, value)
      }
    })

    const currentEntityProps = (entityProperties || [])
      .filter((ep: any) => String(ep.entityproperty_entity_id) === String(entity.entity_id))

    const entityPropById = new Map<string, any>()
    currentEntityProps.forEach((ep: any) => {
      entityPropById.set(String(ep.entityproperty_property_id), ep)
    })

    // Build a map of the first-seen Kind-Properties row for each property id
    const sourceMap: Record<string, any> = {}
    for (const kp of (kindProperties || [])) {
      const pid = String(kp.kindproperty_property_id)
      if (!sourceMap[pid]) sourceMap[pid] = kp
    }

    const list = applicableProperties.map((property: any) => {
      const propertyId = String(property.property_id)
      const indexValue = indexByPropertyId.has(propertyId)
        ? indexByPropertyId.get(propertyId)
        : undefined
      const nameValue = property.property_name ? indexByPropertyName.get(property.property_name) : undefined
      const ep = entityPropById.get(propertyId)
      const applied = indexValue !== undefined || (property.property_name ? nameValue !== undefined : Boolean(ep))
      const initialValue = property.property_name
        ? indexValue !== undefined || nameValue !== undefined
          ? JSON.stringify(indexValue !== undefined ? indexValue : nameValue)
          : ep?.entityproperty_initial_value != null
            ? JSON.stringify(ep.entityproperty_initial_value)
            : ''
        : ''
      const selectedOption = !property.property_name
        ? indexValue !== undefined
          ? String(indexValue)
          : ep?.entityproperty_initial_value != null
            ? String(ep.entityproperty_initial_value)
            : ''
        : ''

      const src = sourceMap[propertyId]
      return {
        property,
        applied,
        initialValue,
        selectedOption,
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

    setEditProps(list)
    setPendingEntityProperties(list)
    setPropsError(null)
    setShowPropsModal(true)
  }

  const saveProps = () => {
    if (!entity) return

    for (const item of editProps) {
      if (item.applied) {
        if (item.property.property_name && !item.initialValue.trim()) {
          setPropsError(`Provide an initial value for ${item.property.property_name}.`)
          return
        }
        if (!item.property.property_name && !item.selectedOption.trim()) {
          setPropsError(`Select a property choice for ${item.property.property_adjective}.`)
          return
        }
      }
    }

    setPendingEntityProperties(editProps)
    setPropsError(null)
    setShowPropsModal(false)
  }

  const resetPendingChanges = () => {
    setPendingEntityProperties(null)
    setEditProps([])
    setShowSavePreview(false)
    setPropsError(null)
  }

  const prepareSavePreview = () => {
    if (!entityName.trim()) {
      setError('Entity name is required.')
      return
    }
    if (!entityKindId) {
      setError('Entity kind is required.')
      return
    }

    setError(null)
    const currentProps = (entityProperties || [])
      .filter((ep: any) => String(ep.entityproperty_entity_id) === String(entity?.entity_id))
    const pendingProps = pendingEntityProperties ?? []
    const { baselineMap, explicitMap } = buildEntityPropertyBaselineMap(properties || [], entityPropertiesIndex, currentProps)
    const actions = getPendingPropertyActions(pendingProps, baselineMap, explicitMap)

    const entitySql = buildEntityStatements(entity, entityName, entityKindId, isNew, actions)
    const propertySql = !isNew ? buildPropertyStatements(String(entity?.entity_id ?? 0), actions) : ''
    const sqlPreview = [entitySql, propertySql].filter(Boolean).join('\n\n') || '-- No database changes detected.'

    setPreviewActions(actions)
    setDryRunSql(sqlPreview)
    setShowSavePreview(true)
  }

  const confirmSave = async () => {
    if (!entityName.trim()) {
      setError('Entity name is required.')
      return
    }
    if (!entityKindId) {
      setError('Entity kind is required.')
      return
    }
    if (!supabase) {
      setError('Supabase client is not initialized.')
      return
    }

    setSaving(true)
    setError(null)
    setPropsError(null)

    try {
      let savedEntityId = entity?.entity_id
      if (isNew) {
        const payload = {
          entity_name: entityName.trim(),
          entity_of_kind_id: Number(entityKindId),
        }
        const { data, error } = await supabase
          .from('Entities')
          .insert([payload])
          .select('entity_id')
          .single()
        if (error) throw error
        if (!data) throw new Error('Failed to create entity.')
        savedEntityId = String(data.entity_id)
        const newEntity = {
          entity_id: savedEntityId,
          entity_name: entityName.trim(),
          entity_of_kind_id: String(entityKindId),
          entity_of_kind_name: kinds.find((k) => k.kind_id === String(entityKindId))?.kind_name,
        }
        setEntities([...(entities || []), newEntity])
        setSelectedEntity(savedEntityId)
        setIsNew(false)
      } else if (entity) {
        const updates: Record<string, unknown> = {}
        if (String(entity.entity_name) !== entityName.trim()) {
          updates.entity_name = entityName.trim()
        }
        if (String(entity.entity_of_kind_id) !== String(entityKindId)) {
          updates.entity_of_kind_id = Number(entityKindId)
        }
        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from('Entities')
            .update(updates)
            .eq('entity_id', entity.entity_id)
          if (error) throw error
          setEntities((entities || []).map((existing: any) =>
            String(existing.entity_id) === String(entity.entity_id)
              ? { ...existing, entity_name: entityName.trim(), entity_of_kind_id: entityKindId, entity_of_kind_name: kinds.find((k) => k.kind_id === String(entityKindId))?.kind_name }
              : existing
          ))
        }
      }

      const deleteActions = previewActions.filter((action: any) => action.type === 'delete')
      const upsertActions = previewActions.filter((action: any) => action.type === 'insert' || action.type === 'update')

      if (upsertActions.length > 0) {
        const upsertPayload = upsertActions.map((action: any) => ({
          entityproperty_property_id: Number(action.propertyId),
          entityproperty_entity_id: Number(savedEntityId),
          entityproperty_initial_value: action.value,
        }))
        const { error: upsertError } = await supabase
          .from('Entity-Properties')
          .upsert(upsertPayload, { onConflict: ['entityproperty_property_id', 'entityproperty_entity_id'] as any })
        if (upsertError) throw upsertError
      }

      for (const deleteAction of deleteActions) {
        const { error: deleteError } = await supabase
          .from('Entity-Properties')
          .delete()
          .match({
            entityproperty_entity_id: Number(savedEntityId),
            entityproperty_property_id: Number(deleteAction.propertyId),
          })
        if (deleteError) throw deleteError
      }

      const remaining = (entityProperties || []).filter((ep: any) => {
        if (String(ep.entityproperty_entity_id) !== String(savedEntityId)) {
          return true
        }
        return !deleteActions.some((action: any) => String(action.propertyId) === String(ep.entityproperty_property_id))
      })
      const newLocal = [...remaining, ...upsertActions.map((action: any) => ({
        entityproperty_property_id: String(action.propertyId),
        entityproperty_entity_id: String(savedEntityId),
        entityproperty_initial_value: action.value,
      }))]

      setEntityProperties(newLocal)
      await loadEntityIndex()
      setPendingEntityProperties(null)
      setShowSavePreview(false)
    } catch (err: any) {
      setError(err?.message ?? 'Unable to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => {
    prepareSavePreview()
  }

  if (!entity && !isNew) {
    return null
  }

  const kind = kinds.find((k) => k.kind_id === entityKindId)

  const currentEntityProps = (entityProperties || [])
    .filter((ep: any) => String(ep.entityproperty_entity_id) === String(entity?.entity_id))

  const { baselineMap } = buildEntityPropertyBaselineMap(properties || [], entityPropertiesIndex, currentEntityProps)

  const displayProperties = (() => {
    const pending = pendingEntityProperties || []
    if (pending.length > 0) {
      // Ensure pending list is ordered by sourceKindId if present
      const sorted = [...pending].sort((a: any, b: any) => {
        if (a.sourceKindId && b.sourceKindId) return Number(a.sourceKindId) - Number(b.sourceKindId)
        if (a.sourceKindId) return -1
        if (b.sourceKindId) return 1
        return Number(a.property.property_id) - Number(b.property.property_id)
      })

      return sorted.map((item) => {
        const propertyId = String(item.property.property_id)
        const value = getPropertyValueFromEdit(item)
        const baselineValue = baselineMap[propertyId]
        const changed = item.applied
          ? JSON.stringify(value) !== JSON.stringify(baselineValue)
          : baselineValue !== undefined

        return {
          property: item.property,
          value,
          changed,
          applied: item.applied,
          propertyId,
        }
      })
    }

    if (entityPropertiesIndex) {
      // When displaying from the index, preserve order by source Kind-Properties kind id
      // Build source map from kindProperties
      const sourceMap: Record<string, any> = {}
      for (const kp of (kindProperties || [])) {
        const pid = String(kp.kindproperty_property_id)
        if (!sourceMap[pid]) sourceMap[pid] = kp
      }

      const entries = Object.entries(entityPropertiesIndex).map(([key, value]) => {
        let prop: any = null
        let srcId = ''
        if (key.startsWith('property_')) {
          const propertyId = key.replace('property_', '')
          prop = (properties || []).find((p: any) => String(p.property_id) === String(propertyId))
          const src = sourceMap[propertyId]
          srcId = src ? String(src.kindproperty_kind_id) : ''
        } else {
          prop = (properties || []).find((p: any) => p.property_name === key)
          if (prop) {
            const src = sourceMap[String(prop.property_id)]
            srcId = src ? String(src.kindproperty_kind_id) : ''
          }
        }

        return { key, value, prop, srcId }
      })

      entries.sort((a: any, b: any) => {
        if (a.srcId && b.srcId) return Number(a.srcId) - Number(b.srcId)
        if (a.srcId) return -1
        if (b.srcId) return 1
        const aId = a.prop ? Number(a.prop.property_id) : 0
        const bId = b.prop ? Number(b.prop.property_id) : 0
        return aId - bId
      })

      return entries.map(({ key, value, prop }) => {
        return {
          property: prop,
          value,
          changed: false,
          applied: true,
          propertyId: key,
        }
      })
    }

    return currentEntityProps.map((ep: any) => ({
      property: (properties || []).find((p: any) => String(p.property_id) === String(ep.entityproperty_property_id)),
      value: ep.entityproperty_initial_value,
      changed: false,
      applied: true,
      propertyId: String(ep.entityproperty_property_id),
    }))
  })()

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{isNew ? 'New Entity' : entity?.entity_name}</h2>
          {kind && <p className="text-sm text-gray-600 mt-1">Kind: {kind.kind_name}</p>}
        </div>
        <button
          type="button"
          onClick={() => setSelectedEntity(undefined)}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Entity Name</label>
              <input
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Kind</label>
              <select
                value={entityKindId}
                onChange={(e) => setEntityKindId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {kinds.map((k) => (
                  <option key={k.kind_id} value={k.kind_id}>
                    {k.kind_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold mb-3">Properties</h4>
              <button onClick={openPropsModal} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">Edit Properties</button>
            </div>
            <div className="space-y-2">
              {displayProperties.length > 0 ? (
                displayProperties.map((item: any) => {
                  if (!item.property) {
                    return null
                  }

                  const displayText = getEntityPropertyDescription(item.property, { entityproperty_initial_value: item.value }, kinds)
                  return (
                    <div
                      key={`${item.propertyId}-${item.property.property_id}-${item.applied ? 'on' : 'off'}`}
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
                  disabled={previewActions.length === 0 || saving}
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
        {pendingEntityProperties && (
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
              <h3 className="text-lg font-semibold">Manage Properties for {entity?.entity_name || 'this entity'}</h3>
              <button onClick={() => setShowPropsModal(false)} className="text-gray-600">Close</button>
            </div>

            <div className="space-y-3 max-h-72 overflow-auto">
              {editProps.map((item, idx) => (
                <div key={item.property.property_id} className="flex items-start gap-3 p-2 border-b">
                  <div>
                    <input type="checkbox" checked={item.applied} onChange={(e) => {
                      const copy = [...editProps]
                      copy[idx] = { ...item, applied: e.target.checked }
                      setEditProps(copy)
                    }} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.property.property_name ?? item.property.property_adjective}</div>
                    {item.property.property_name ? (
                      <div className="text-xs text-gray-600">Kind: {kinds.find((k) => String(k.kind_id) === String(item.property.property_kind_id))?.kind_name ?? 'Unknown'}</div>
                    ) : null}

                    {item.property.property_name ? (
                      <div className="mt-2">
                        <label className="block text-xs text-gray-600">Initial Value (JSON)</label>
                        <input value={item.initialValue} onChange={(e) => {
                          const copy = [...editProps]
                          copy[idx] = { ...item, initialValue: e.target.value }
                          setEditProps(copy)
                        }} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 font-mono text-sm" placeholder='e.g. "north" or {"direction":"north"}' />
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

export default EntityEditor
