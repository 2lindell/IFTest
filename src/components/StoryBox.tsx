import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import { supabase } from '../lib/supabase'
import { BookOpen } from 'lucide-react'

type AssertionView = {
  viewName: string
  fieldName: string
}

const assertionViews: AssertionView[] = [
  { viewName: 'Rulebook Assertions', fieldName: 'rulebook_assertion' },
  { viewName: 'Relation Assertions', fieldName: 'relation_assertion' },
  { viewName: 'Relation Verb Assertions', fieldName: 'relation_verb_assertion' },
  { viewName: 'Action Assertions', fieldName: 'action_assertion' },
  { viewName: 'Kinds', fieldName: 'kind_assertion' },
  { viewName: 'Kinds of Value', fieldName: 'kind_assertion' },
  { viewName: 'Entity Assertions', fieldName: 'entity_assertion_with_properties' },
  { viewName: 'Kind-Property Assertions', fieldName: 'kindproperty_assertion' },
  { viewName: 'Variable Assertions', fieldName: 'variable_assertion' },
]

type InsertTarget = {
  viewName: string
  fieldName: string
}

function singularizeKindName(kindName: string) {
  const normalized = kindName.trim()
  if (/s$/i.test(normalized) && !/ss$/i.test(normalized)) {
    return normalized.replace(/s$/i, '')
  }
  return normalized
}

function parseActionAssertion(statement: string) {
  const trimmed = statement.trim()
  const actionMatch = trimmed.match(/^(?<name>.+?) is an action (?:(?<apply>applying to (?<applySpec>.+?))|(?<out>out of world)|(?<nothing>nothing))\.$/i)
  if (!actionMatch?.groups) return null

  const actionName = actionMatch.groups.name.trim()
  const outOfWorld = Boolean(actionMatch.groups.out)
  const nothing = Boolean(actionMatch.groups.nothing)
  let directKindName: string | undefined
  let indirectKindName: string | undefined

  const applySpec = actionMatch.groups.applySpec
  if (applySpec) {
    const pairMatch = applySpec.match(/^one (?<first>.+?) and one (?<second>.+)$/i)
    const twoMatch = applySpec.match(/^two (?<kind>.+)$/i)
    const oneMatch = applySpec.match(/^one (?<kind>.+)$/i)

    if (pairMatch?.groups) {
      directKindName = singularizeKindName(pairMatch.groups.first.trim())
      indirectKindName = singularizeKindName(pairMatch.groups.second.trim())
    } else if (twoMatch?.groups) {
      directKindName = singularizeKindName(twoMatch.groups.kind.trim())
      indirectKindName = directKindName
    } else if (oneMatch?.groups) {
      directKindName = singularizeKindName(oneMatch.groups.kind.trim())
    }
  }

  return {
    actionName,
    directKindName,
    indirectKindName,
    outOfWorld,
    nothing,
  }
}

function inferInsertTarget(block: string, kindNameToView: Map<string, string>): InsertTarget {
  const trimmed = block.trim()
  if (/^The verb .+? means the (reversed )?.+? relation\.$/i.test(trimmed)) {
    return { viewName: 'Relation Verb Assertions', fieldName: 'relation_verb_assertion' }
  }
  if (/ is an action /i.test(trimmed)) {
    return { viewName: 'Action Assertions', fieldName: 'action_assertion' }
  }

  if (/^.+? relates (one|various) .+? to (one|various) .+?\.$/i.test(trimmed)) {
    return { viewName: 'Relation Assertions', fieldName: 'relation_assertion' }
  }

  if (/^.+? rules is .+? rulebook.*\.$/i.test(trimmed)) {
    return { viewName: 'Rulebook Assertions', fieldName: 'rulebook_assertion' }
  }

  if (/ is a kind/i.test(trimmed)) {
    const match = trimmed.match(/^(?:A|An|The) (?<kind_name>.+?) is a kind(?: of (?<parent_kind_name>.+?))?\.$/i)
    if (match?.groups?.kind_name) {
      const kindName = match.groups.kind_name.trim()
      const existingView = kindNameToView.get(kindName)
      if (existingView) {
        return { viewName: existingView, fieldName: 'kind_assertion' }
      }
    }
    return { viewName: 'Kinds of Value', fieldName: 'kind_assertion' }
  }

  return { viewName: 'Kinds of Value', fieldName: 'kind_assertion' }
}

export function StoryBox() {
  const [storyText, setStoryText] = useState('')
  const [fetchedResults, setFetchedResults] = useState<{
    viewName: string
    fieldName: string
    rows: Array<Record<string, any>>
    idKey?: string
  }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dryRunSql, setDryRunSql] = useState('')

  useEffect(() => {
    const loadDeclarations = async () => {
      try {
        setLoading(true)

        if (!supabase) {
          throw new Error('Supabase client is not initialized')
        }

        const supabaseClient = supabase

        const results = await Promise.all(
          assertionViews.map(async ({ viewName, fieldName }) => {
            const { data, error: fetchError } = await supabaseClient
              .from(viewName)
              .select('*')

            if (fetchError) {
              throw new Error(`${viewName}: ${fetchError.message}`)
            }

            const rows = ((data ?? []) as unknown) as Array<Record<string, any>>

            // Determine a likely id key (exact 'id' or first key ending with '_id')
            let idKey: string | undefined
            if (rows.length > 0) {
              const sample = rows[0]
              const keys = Object.keys(sample)
              if (keys.includes('id')) idKey = 'id'
              else {
                const found = keys.find((k) => k.toLowerCase().endsWith('_id'))
                if (found) idKey = found
              }
            }

            return {
              viewName,
              fieldName,
              rows,
              idKey,
            }
          }),
        )

        const combinedLines = [] as string[]

        // Preserve one-to-one mapping between fetched rows and editor blocks
        for (const { fieldName, rows } of results) {
          for (const row of rows) {
            const value = row[fieldName] ?? ''
            combinedLines.push(String(value))
          }
        }

        setFetchedResults(results)
        setStoryText(combinedLines.join('\n\n'))
        setError(null)
      } catch (err) {
        console.error('Error loading rulebook declarations:', err)
        setError(err instanceof Error ? err.message : 'Failed to load declarations')
      } finally {
        setLoading(false)
      }
    }

    loadDeclarations()
  }, [])

  const handleSaveDryRun = () => {
    const blocks = storyText.split(/\r?\n\r?\n+/).map((b) => b.trim()).filter(Boolean)
    const ops: Array<{
      viewName: string
      fieldName: string
      idKey?: string
      updates: Array<{ id?: string; value: string; existing: string }>
    }> = []

    let cursor = 0
    for (const { viewName, fieldName, rows, idKey } of fetchedResults) {
      const updates: Array<{ id?: string; value: string; existing: string }> = []
      for (let i = 0; i < rows.length; i++) {
        const existing = String(rows[i][fieldName] ?? '')
        const value = cursor < blocks.length ? blocks[cursor] : ''
        const id = idKey ? String(rows[i][idKey]) : undefined
        updates.push({ id, value, existing })
        if (cursor < blocks.length) cursor++
      }
      ops.push({ viewName, fieldName, idKey, updates })
    }

    const kindNameToView = new Map<string, string>()
    for (const { viewName, fieldName, rows } of fetchedResults) {
      if (fieldName !== 'kind_assertion') continue
      for (const row of rows) {
        const kindName = String(row.kind_name ?? '').trim()
        if (kindName) {
          kindNameToView.set(kindName, viewName)
        }
      }
    }

    const insertGroups = new Map<string, { viewName: string; fieldName: string; values: string[] }>()
    const remaining = blocks.slice(cursor)
    for (const block of remaining) {
      if (!block) continue
      const target = inferInsertTarget(block, kindNameToView)
      const groupKey = `${target.viewName}|${target.fieldName}`
      const existing = insertGroups.get(groupKey)
      if (existing) {
        existing.values.push(block)
      } else {
        insertGroups.set(groupKey, { viewName: target.viewName, fieldName: target.fieldName, values: [block] })
      }
    }

    const paramStmts: Array<{ text: string; params: any[] }> = []
    // For updates: map view -> underlying base table and produce UPDATE/INSERT accordingly
    const mapViewToBase = (viewName: string) => {
      if (viewName === 'Kinds' || viewName === 'Kinds of Value') return 'All Kinds'
      if (viewName === 'Relation Assertions' || viewName === 'Relation Verb Assertions') return 'Relations'
      if (viewName === 'Rulebook Assertions') return 'Rulebooks'
      if (viewName === 'Action Assertions') return 'Actions'
      if (viewName === 'Variable Assertions') return 'Variables'
      if (viewName === 'Entity Assertions') return 'Entities'
      if (viewName === 'Kind-Property Assertions') return 'Kind-Properties'
      return viewName
    }

    for (const op of ops) {
      const { viewName, fieldName, idKey, updates } = op
      const baseTable = mapViewToBase(viewName)
      const whereKey = idKey || 'id'
      for (const u of updates) {
        if (u.value !== u.existing && u.value !== '') {
          if (u.id) {
            paramStmts.push({ text: `UPDATE "${baseTable}" SET ${fieldName} = $1 WHERE ${whereKey} = $2;`, params: [u.value, u.id] })
          } else {
            paramStmts.push({ text: `INSERT INTO "${baseTable}" (${fieldName}) VALUES ($1);`, params: [u.value] })
          }
        }
      }
    }

    // For insert groups, generate SQL that targets base tables and parses semantics
    for (const { values } of insertGroups.values()) {
      for (const value of values) {
        const trimmed = value.trim()
        // kind
        const kindMatch = trimmed.match(/^(?:A|An|The) (?<kind>.+?) is a kind(?: of (?<parent>.+?))?\.$/i)
        if (kindMatch && kindMatch.groups) {
          const kindName = kindMatch.groups.kind.trim()
          const parent = kindMatch.groups.parent ? kindMatch.groups.parent.trim() : null
          if (parent) {
            paramStmts.push({ text: `INSERT INTO "All Kinds" (kind_name, parent_kind_id) VALUES ($1, (SELECT kind_id FROM "All Kinds" WHERE kind_name = $2 LIMIT 1));`, params: [kindName, parent] })
          } else {
            paramStmts.push({ text: `INSERT INTO "All Kinds" (kind_name) VALUES ($1);`, params: [kindName] })
          }
          continue
        }

        // action
        const actionMatch = parseActionAssertion(trimmed)
        if (actionMatch) {
          const { actionName, directKindName, indirectKindName, outOfWorld, nothing } = actionMatch
          if (outOfWorld) {
            paramStmts.push({ text: `INSERT INTO "Actions" (action_name, action_out_of_world) VALUES ($1, true);`, params: [actionName] })
            continue
          }

          if (nothing) {
            paramStmts.push({ text: `INSERT INTO "Actions" (action_name) VALUES ($1);`, params: [actionName] })
            continue
          }

          if (directKindName && indirectKindName) {
            paramStmts.push({ text: `INSERT INTO "Actions" (action_name, action_direct_kind, action_indirect_kind) VALUES ($1, (SELECT kind_id FROM "All Kinds" WHERE lower(kind_name) = lower($2) LIMIT 1), (SELECT kind_id FROM "All Kinds" WHERE lower(kind_name) = lower($3) LIMIT 1));`, params: [actionName, directKindName, indirectKindName] })
            continue
          }

          if (directKindName) {
            paramStmts.push({ text: `INSERT INTO "Actions" (action_name, action_direct_kind) VALUES ($1, (SELECT kind_id FROM "All Kinds" WHERE lower(kind_name) = lower($2) LIMIT 1));`, params: [actionName, directKindName] })
            continue
          }
        }

        // relation
        const relMatch = trimmed.match(/^(?<relname>.+?) relates (?<left>one|various) (?<leftkind>.+?) to (?<right>one|various) (?<rightkind>.+?)\.$/i)
        if (relMatch && relMatch.groups) {
          const relName = relMatch.groups.relname.trim()
          const leftKind = relMatch.groups.leftkind.trim()
          const rightKind = relMatch.groups.rightkind.trim()
          const left = relMatch.groups.left === 'one' ? 'one' : 'various'
          const right = relMatch.groups.right === 'one' ? 'one' : 'various'
          let relationType = 'one-to-one'
          if (left === 'one' && right === 'one') relationType = 'one-to-one'
          else if (left === 'one' && right === 'various') relationType = 'one-to-various'
          else if (left === 'various' && right === 'one') relationType = 'various-to-one'
          else relationType = 'various-to-various'
          paramStmts.push({ text: `INSERT INTO "Relations" (relation_name, relation_type, relation_relates_kind, relation_relates_to_kind) VALUES ($1, $2, (SELECT kind_id FROM "All Kinds" WHERE kind_name = $3 LIMIT 1), (SELECT kind_id FROM "All Kinds" WHERE kind_name = $4 LIMIT 1));`, params: [relName, relationType, leftKind, rightKind] })
          continue
        }

        // relation verb
        const verbMatch = trimmed.match(/^The verb (?<verb>.+?) means the (reversed )?(?<relname>.+?) relation\.$/i)
        if (verbMatch && verbMatch.groups) {
          const verb = verbMatch.groups.verb.trim()
          const relName = verbMatch.groups.relname.trim()
          const isReversed = /means the reversed /i.test(trimmed)
          if (isReversed) {
            paramStmts.push({ text: `UPDATE "Relations" SET relation_reversed_verb = array_append(coalesce(relation_reversed_verb, '{}'), $1) WHERE relation_name = $2;`, params: [verb, relName] })
          } else {
            paramStmts.push({ text: `UPDATE "Relations" SET relation_verb = array_append(coalesce(relation_verb, '{}'), $1) WHERE relation_name = $2;`, params: [verb, relName] })
          }
          continue
        }

        // rulebook
        const rbMatch = trimmed.match(/^(?<rbname>.+?) rules is .*?(?:based (?<basis>.+?) )?rulebook(?:.*producing (?<result>.+?) )?.*\.$/i)
        if (rbMatch && rbMatch.groups) {
          const rbName = rbMatch.groups.rbname.trim()
          const basis = rbMatch.groups.basis ? rbMatch.groups.basis.trim() : null
          const result = rbMatch.groups.result ? rbMatch.groups.result.trim() : null
          if (basis && result) {
            paramStmts.push({ text: `INSERT INTO "Rulebooks" (rulebook_name, rulebook_basis, rulebook_result_kind) VALUES ($1, (SELECT kind_id FROM "All Kinds" WHERE kind_name = $2 LIMIT 1), (SELECT kind_id FROM "All Kinds" WHERE kind_name = $3 LIMIT 1));`, params: [rbName, basis, result] })
          } else if (basis) {
            paramStmts.push({ text: `INSERT INTO "Rulebooks" (rulebook_name, rulebook_basis) VALUES ($1, (SELECT kind_id FROM "All Kinds" WHERE kind_name = $2 LIMIT 1));`, params: [rbName, basis] })
          } else if (result) {
            paramStmts.push({ text: `INSERT INTO "Rulebooks" (rulebook_name, rulebook_result_kind) VALUES ($1, (SELECT kind_id FROM "All Kinds" WHERE kind_name = $2 LIMIT 1));`, params: [rbName, result] })
          } else {
            paramStmts.push({ text: `INSERT INTO "Rulebooks" (rulebook_name) VALUES ($1);`, params: [rbName] })
          }
          continue
        }

        // unparsed statement: generate error comment
        paramStmts.push({ text: `-- ERROR: Could not parse statement: ${trimmed}`, params: [] })
      }
    }
    // Format parameterized statements for display (one per line with params)
    const outLines: string[] = []
    for (const s of paramStmts) {
      outLines.push(`-- params: ${JSON.stringify(s.params)}`)
      outLines.push(s.text)
    }
    const sqlText = outLines.join('\n') || '-- no operations planned'
    console.log('Dry-run parameterized statements:\n' + sqlText)
    setDryRunSql(sqlText)
    alert('Dry-run complete. See the Dry-run Queries box below and the console for details.')
  }

  const handleApplyInsert = async () => {
    if (!confirm('This will attempt to UPDATE existing rows (by id when available) and INSERT new rows. Proceed?')) return
    if (!supabase) {
      alert('Supabase client is not initialized.')
      return
    }
    setSaving(true)
    try {
      const blocks = storyText.split(/\r?\n\r?\n+/).map((b) => b.trim()).filter(Boolean)
      let cursor = 0

      const sb = supabase!
      const mapViewToBase = (viewName: string) => {
        if (viewName === 'Kinds' || viewName === 'Kinds of Value') return 'All Kinds'
        if (viewName === 'Relation Assertions' || viewName === 'Relation Verb Assertions') return 'Relations'
        if (viewName === 'Rulebook Assertions') return 'Rulebooks'
        return viewName
      }

      for (const { viewName, fieldName, rows, idKey } of fetchedResults) {
        const baseTable = mapViewToBase(viewName)
        for (let i = 0; i < rows.length; i++) {
          const value = cursor < blocks.length ? blocks[cursor] : ''
          const existing = String(rows[i][fieldName] ?? '')
          cursor++
          if (value === existing || value === '') continue
          const id = idKey ? rows[i][idKey] : undefined
          if (id) {
            const { error: updateError } = await sb.from(baseTable).update({ [fieldName]: value }).eq(idKey!, id)
            if (updateError) {
              console.error(`Update error for ${baseTable} id=${id}:`, updateError)
              throw updateError
            }
          } else {
            const { error: insertError } = await sb.from(baseTable).insert([{ [fieldName]: value }])
            if (insertError) {
              console.error(`Insert error for ${baseTable}:`, insertError)
              throw insertError
            }
          }
        }
      }

      const kindNameToView = new Map<string, string>()
      for (const { viewName, fieldName, rows } of fetchedResults) {
        if (fieldName !== 'kind_assertion') continue
        for (const row of rows) {
          const kindName = String(row.kind_name ?? '').trim()
          if (kindName) {
            kindNameToView.set(kindName, viewName)
          }
        }
      }

      const remaining = blocks.slice(cursor)

      // Build lookup maps from fetchedResults
      const kindNameToRow = new Map<string, any>()
      const relationNameToRow = new Map<string, any>()
      const rulebookNameToRow = new Map<string, any>()
      for (const { fieldName, rows } of fetchedResults) {
        if (fieldName === 'kind_assertion') {
          for (const r of rows) {
            if (r.kind_name) kindNameToRow.set(String(r.kind_name).trim(), r)
          }
        }
        if (fieldName === 'relation_assertion' || fieldName === 'relation_verb_assertion') {
          for (const r of rows) {
            if (r.relation_name) relationNameToRow.set(String(r.relation_name).trim(), r)
          }
        }
        if (fieldName === 'rulebook_assertion') {
          for (const r of rows) {
            if (r.rulebook_name) rulebookNameToRow.set(String(r.rulebook_name).trim(), r)
          }
        }
      }

      // helpers to ensure base rows exist and return their ids
      const ensureKind = async (kindName: string, parentName?: string) => {
        const existing = kindNameToRow.get(kindName)
        if (existing && existing.kind_id) return existing.kind_id
        // try to find by selecting All Kinds directly
        const { data: found, error: findErr } = await sb.from('All Kinds').select('kind_id').eq('kind_name', kindName).limit(1).single()
        if (findErr && findErr.code !== 'PGRST116') {
          // PGRST116: no rows found for single() — ignore
        }
        if (found && (found as any).kind_id) return String((found as any).kind_id)

        // determine parent id if provided
        let parentId: string | undefined
        if (parentName) {
          const parentRow = kindNameToRow.get(parentName)
          if (parentRow && parentRow.kind_id) parentId = parentRow.kind_id
          else {
            const { data: pFound } = await sb.from('All Kinds').select('kind_id').eq('kind_name', parentName).limit(1).single()
            if (pFound && (pFound as any).kind_id) parentId = String((pFound as any).kind_id)
          }
        }

        const insertPayload: any = { kind_name: kindName }
        if (parentId) insertPayload.parent_kind_id = parentId
        const { data: inserted, error: insertErr } = await sb.from('All Kinds').insert([insertPayload])
        if (insertErr) {
          console.error('Kind insert error:', insertErr)
          throw insertErr
        }
        const newId = (inserted && (inserted as any)[0] && (inserted as any)[0].kind_id) || undefined
        if (newId) kindNameToRow.set(kindName, { kind_id: String(newId), kind_name: kindName })
        return newId
      }

      const ensureRelation = async (relationName: string, leftKindId: any, rightKindId: any, relationType: string) => {
        const existing = relationNameToRow.get(relationName)
        if (existing && existing.relation_id) return existing.relation_id
        const payload: any = {
          relation_name: relationName,
          relation_type: relationType,
          relation_relates_kind: leftKindId,
          relation_relates_to_kind: rightKindId,
        }
        const { data: inserted, error: insertErr } = await sb.from('Relations').insert([payload])
        if (insertErr) {
          console.error('Relation insert error:', insertErr)
          throw insertErr
        }
        const newId = (inserted && (inserted as any)[0] && (inserted as any)[0].relation_id) || undefined
        if (newId) relationNameToRow.set(relationName, { relation_id: String(newId), relation_name: relationName })
        return newId
      }

      const ensureRulebook = async (rulebookName: string, basisKindId?: any, resultKindId?: any) => {
        const existing = rulebookNameToRow.get(rulebookName)
        if (existing && existing.rulebook_id) return existing.rulebook_id
        const payload: any = { rulebook_name: rulebookName }
        if (basisKindId) payload.rulebook_basis = basisKindId
        if (resultKindId) payload.rulebook_result_kind = resultKindId
        const { data: inserted, error: insertErr } = await sb.from('Rulebooks').insert([payload])
        if (insertErr) {
          console.error('Rulebook insert error:', insertErr)
          throw insertErr
        }
        const newId = (inserted && (inserted as any)[0] && (inserted as any)[0].rulebook_id) || undefined
        if (newId) rulebookNameToRow.set(rulebookName, { rulebook_id: String(newId), rulebook_name: rulebookName })
        return newId
      }

      // process remaining blocks by parsing them and inserting into base tables
      for (const block of remaining) {
        if (!block) continue
        // try kind
        const kindMatch = block.match(/^(?:A|An|The) (?<kind>.+?) is a kind(?: of (?<parent>.+?))?\.$/i)
        if (kindMatch && kindMatch.groups) {
          const kindName = kindMatch.groups.kind.trim()
          const parentName = kindMatch.groups.parent ? kindMatch.groups.parent.trim() : undefined
          await ensureKind(kindName, parentName)
          continue
        }

        // try action assertion
        const actionParse = parseActionAssertion(block)
        if (actionParse) {
          const { actionName, directKindName, indirectKindName, outOfWorld, nothing } = actionParse
          if (outOfWorld) {
            await sb.from('Actions').insert([{ action_name: actionName, action_out_of_world: true }])
            continue
          }

          if (nothing) {
            await sb.from('Actions').insert([{ action_name: actionName }])
            continue
          }

          if (directKindName && indirectKindName) {
            const directId = await ensureKind(directKindName)
            const indirectId = await ensureKind(indirectKindName)
            await sb.from('Actions').insert([{ action_name: actionName, action_direct_kind: directId, action_indirect_kind: indirectId }])
            continue
          }

          if (directKindName) {
            const directId = await ensureKind(directKindName)
            await sb.from('Actions').insert([{ action_name: actionName, action_direct_kind: directId }])
            continue
          }
        }

        // try relation assertion
        const relMatch = block.match(/^(?<relname>.+?) relates (?<left>one|various) (?<leftkind>.+?) to (?<right>one|various) (?<rightkind>.+?)\.$/i)
        if (relMatch && relMatch.groups) {
          const relName = relMatch.groups.relname.trim()
          const leftKindName = relMatch.groups.leftkind.trim()
          const rightKindName = relMatch.groups.rightkind.trim()
          const left = relMatch.groups.left === 'one' ? 'one' : 'various'
          const right = relMatch.groups.right === 'one' ? 'one' : 'various'
          let relationType = 'one-to-one'
          if (left === 'one' && right === 'one') relationType = 'one-to-one'
          else if (left === 'one' && right === 'various') relationType = 'one-to-various'
          else if (left === 'various' && right === 'one') relationType = 'various-to-one'
          else relationType = 'various-to-various'

          const leftId = await ensureKind(leftKindName)
          const rightId = await ensureKind(rightKindName)
          await ensureRelation(relName, leftId, rightId, relationType)
          continue
        }

        // try relation verb
        const verbMatch = block.match(/^The verb (?<verb>.+?) means the (reversed )?(?<relname>.+?) relation\.$/i)
        if (verbMatch && verbMatch.groups) {
          const verb = verbMatch.groups.verb.trim()
          const relName = verbMatch.groups.relname.trim()
          const isReversed = /means the reversed /i.test(block)
          const existing = relationNameToRow.get(relName)
          if (existing && existing.relation_id) {
            // fetch full relation to update verb arrays
            const { data: relRows } = await supabase.from('Relations').select('relation_id, relation_verb, relation_reversed_verb').eq('relation_name', relName).limit(1).single()
            const currentVerb = (relRows as any)?.relation_verb ?? []
            const currentRev = (relRows as any)?.relation_reversed_verb ?? []
            const newVerbArr = Array.isArray(currentVerb) ? [...currentVerb] : [currentVerb]
            const newRevArr = Array.isArray(currentRev) ? [...currentRev] : [currentRev]
            if (isReversed) {
              if (!newRevArr.includes(verb)) newRevArr.push(verb)
            } else {
              if (!newVerbArr.includes(verb)) newVerbArr.push(verb)
            }
            const { error: updateErr } = await supabase.from('Relations').update({ relation_verb: newVerbArr, relation_reversed_verb: newRevArr }).eq('relation_id', existing.relation_id)
            if (updateErr) {
              console.error('Relation verb update error:', updateErr)
              throw updateErr
            }
          }
          continue
        }

        // try rulebook
        const rbMatch = block.match(/^(?<rbname>.+?) rules is .*?(?:based (?<basis>.+?) )?rulebook(?:.*producing (?<result>.+?) )?.*\.$/i)
        if (rbMatch && rbMatch.groups) {
          const rbName = rbMatch.groups.rbname.trim()
          const basis = rbMatch.groups.basis ? rbMatch.groups.basis.trim() : undefined
          const result = rbMatch.groups.result ? rbMatch.groups.result.trim() : undefined
          const basisId = basis ? await ensureKind(basis) : undefined
          const resultId = result ? await ensureKind(result) : undefined
          await ensureRulebook(rbName, basisId, resultId)
          continue
        }

        // unparsed statement: error
        throw new Error(`Could not parse statement: ${block}`)
      }

      alert('Update/Insert operations completed (check console for details).')
    } catch (err) {
      console.error('Error applying changes:', err)
      alert('Error applying changes. See console for details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen size={20} />
          Story
        </h2>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
            <p className="font-semibold">Error loading declarations</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="mb-4">
          <Editor
            height="300px"
            defaultLanguage="markdown"
            value={loading ? 'Loading...' : storyText}
            onChange={(val) => setStoryText(val || '')}
            options={{ minimap: { enabled: false }, wordWrap: 'on' }}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSaveDryRun}
            className="px-3 py-2 bg-blue-600 text-white rounded"
            disabled={loading}
          >
            Dry-run Save
          </button>
          <button
            onClick={handleApplyInsert}
            className="px-3 py-2 bg-green-600 text-white rounded"
            disabled={loading || saving}
          >
            Apply Inserts
          </button>
        </div>
        {dryRunSql && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Dry-run Queries</h3>
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
