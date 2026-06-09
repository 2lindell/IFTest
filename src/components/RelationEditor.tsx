import { useEffect, useState } from 'react'
import { useWorldStore } from '../store/worldStore'
import { supabase } from '../lib/supabase'

function conjugateToThirdPerson(verb: string): string {
  const phrase = verb.toLowerCase().trim()
  
  // Remove "to " prefix if present
  const cleanPhrase = phrase.startsWith('to ') ? phrase.slice(3) : phrase
  
  // Split into words to isolate the main verb from any prepositions/particles
  const words = cleanPhrase.split(' ')
  const mainVerb = words[0]
  const restOfPhrase = words.slice(1).join(' ')
  
  // Irregular verbs
  const irregulars: Record<string, string> = {
    'be': 'is',
    'have': 'has',
    'do': 'does',
    'go': 'goes',
    'say': 'says',
    'get': 'gets',
    'make': 'makes',
    'know': 'knows',
    'take': 'takes',
    'see': 'sees',
    'come': 'comes',
    'think': 'thinks',
    'use': 'uses',
    'find': 'finds',
    'give': 'gives',
    'tell': 'tells',
    'work': 'works',
    'call': 'calls',
    'try': 'tries',
    'ask': 'asks',
    'need': 'needs',
    'feel': 'feels',
    'become': 'becomes',
    'leave': 'leaves',
    'put': 'puts',
    'mean': 'means',
    'keep': 'keeps',
    'let': 'lets',
    'begin': 'begins',
    'seem': 'seems',
    'help': 'helps',
    'talk': 'talks',
    'turn': 'turns',
    'start': 'starts',
    'show': 'shows',
    'hear': 'hears',
    'play': 'plays',
    'run': 'runs',
    'move': 'moves',
    'like': 'likes',
    'live': 'lives',
    'believe': 'believes',
    'hold': 'holds',
    'bring': 'brings',
    'happen': 'happens',
    'write': 'writes',
    'provide': 'provides',
    'sit': 'sits',
    'stand': 'stands',
    'lose': 'loses',
    'pay': 'pays',
    'meet': 'meets',
    'include': 'includes',
    'continue': 'continues',
    'set': 'sets',
    'learn': 'learns',
    'change': 'changes',
    'lead': 'leads',
    'understand': 'understands',
    'watch': 'watches',
    'follow': 'follows',
    'stop': 'stops',
    'create': 'creates',
    'speak': 'speaks',
    'read': 'reads',
    'allow': 'allows',
    'add': 'adds',
    'spend': 'spends',
    'grow': 'grows',
    'open': 'opens',
    'walk': 'walks',
    'win': 'wins',
    'offer': 'offers',
    'remember': 'remembers',
    'love': 'loves',
    'consider': 'considers',
    'appear': 'appears',
    'buy': 'buys',
    'wait': 'waits',
    'serve': 'serves',
    'die': 'dies',
    'send': 'sends',
    'expect': 'expects',
    'build': 'builds',
    'stay': 'stays',
    'fall': 'falls',
    'cut': 'cuts',
    'reach': 'reaches',
    'kill': 'kills',
    'remain': 'remains',
    'suggest': 'suggests',
    'raise': 'raises',
    'pass': 'passes',
    'sell': 'sells',
    'require': 'requires',
    'report': 'reports',
    'decide': 'decides',
    'pull': 'pulls',
    'explain': 'explains',
    'develop': 'develops',
    'carry': 'carries',
    'break': 'breaks',
    'receive': 'receives',
    'agree': 'agrees',
    'support': 'supports',
    'hit': 'hits',
    'produce': 'produces',
    'eat': 'eats',
    'cover': 'covers',
    'catch': 'catches',
    'draw': 'draws',
    'choose': 'chooses',
    'cause': 'causes',
    'relate': 'relates',
    'own': 'owns',
    'possess': 'possesses',
  }
  
  if (irregulars[mainVerb]) {
    const conjugated = irregulars[mainVerb]
    return restOfPhrase ? conjugated + ' ' + restOfPhrase : conjugated
  }
  
  // Regular conjugation rules
  const lastChar = mainVerb[mainVerb.length - 1]
  
  // Words ending in -s, -x, -z, -ch, -sh: add 'es'
  if (mainVerb.endsWith('s') || mainVerb.endsWith('x') || mainVerb.endsWith('z') || 
      mainVerb.endsWith('ch') || mainVerb.endsWith('sh')) {
    const conjugated = mainVerb + 'es'
    return restOfPhrase ? conjugated + ' ' + restOfPhrase : conjugated
  }
  
  // Words ending in consonant + 'y': change 'y' to 'ies'
  if (lastChar === 'y' && 'bcdfghjklmnpqrstvwxz'.includes(mainVerb[mainVerb.length - 2])) {
    const conjugated = mainVerb.slice(0, -1) + 'ies'
    return restOfPhrase ? conjugated + ' ' + restOfPhrase : conjugated
  }
  
  // Words ending in 'o' preceded by consonant: add 'es'
  if (lastChar === 'o' && 'bcdfghjklmnpqrstvwxz'.includes(mainVerb[mainVerb.length - 2])) {
    const conjugated = mainVerb + 'es'
    return restOfPhrase ? conjugated + ' ' + restOfPhrase : conjugated
  }
  
  // Default: add 's'
  const conjugated = mainVerb + 's'
  return restOfPhrase ? conjugated + ' ' + restOfPhrase : conjugated
}

function isVariousOnSide(relationType: string | undefined, side: 'from' | 'to') {
  if (!relationType) return false
  const t = relationType.toLowerCase()
  // Normalize separators and trim
  const parts = t.split('-to-').map((p) => p.trim())
  if (parts.length === 2) {
    const [left, right] = parts
    if (side === 'from') return left.includes('various')
    return right.includes('various')
  }
  // Fallback: if the string mentions 'various' assume both sides
  return t.includes('various')
}

function annotateKindName(kindName: string | undefined, relationType: string | undefined, side: 'from' | 'to') {
  const base = (kindName || '').toLowerCase()
  return isVariousOnSide(relationType, side) ? `${base}(s)` : base
}

function presentPluralForm(verb: string): string {
  const phrase = (verb || '').toLowerCase().trim()
  const cleanPhrase = phrase.startsWith('to ') ? phrase.slice(3) : phrase
  const words = cleanPhrase.split(' ')
  const mainVerb = words[0]
  const rest = words.slice(1).join(' ')

  // plural (non-3rd-person-singular) present tense
  const irregularPlurals: Record<string, string> = {
    'be': 'are',
    'have': 'have',
    'do': 'do',
    'go': 'go',
    'say': 'say',
    'get': 'get',
    'is': 'are',
    'was': 'were',
  }

  if (irregularPlurals[mainVerb]) {
    return rest ? irregularPlurals[mainVerb] + ' ' + rest : irregularPlurals[mainVerb]
  }

  // most verbs use base form for plural subjects
  return rest ? mainVerb + ' ' + rest : mainVerb
}

interface RelationEditorProps {
  isNew?: boolean
  onSaved?: (id: string) => void
  onCancel?: () => void
}

export function RelationEditor({ isNew, onSaved, onCancel }: RelationEditorProps) {
  const selectedRelationId = useWorldStore((state) => state.selectedRelationId)
  const relations = useWorldStore((state) => state.relations)
  const kinds = useWorldStore((state) => state.kinds)
  const addRelation = useWorldStore((state) => state.addRelation)
  const updateRelation = useWorldStore((state) => state.updateRelation)
  const setSelectedRelation = useWorldStore((state) => state.setSelectedRelation)

  const selectedRelation = relations.find(
    (r) => r.relation_id === selectedRelationId
  )

  const [relationName, setRelationName] = useState('')
  const [relationType, setRelationType] = useState('')
  const [relatesKindId, setRelatesKindId] = useState('')
  const [relatesToKindId, setRelatesToKindId] = useState('')
  const [verbsText, setVerbsText] = useState('')
  const [reversedVerbsText, setReversedVerbsText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew) {
      setRelationName('')
      setRelationType('')
      setRelatesKindId('')
      setRelatesToKindId('')
      setVerbsText('')
      setReversedVerbsText('')
      setError(null)
      return
    }

    if (selectedRelation) {
      setRelationName(selectedRelation.relation_name || '')
      setRelationType(selectedRelation.relation_type || '')
      setRelatesKindId(selectedRelation.relation_relates_kind)
      setRelatesToKindId(selectedRelation.relation_relates_to_kind)
      setVerbsText((selectedRelation.relation_verb || []).join('\n'))
      setReversedVerbsText((selectedRelation.relation_reversed_verb || []).join('\n'))
      setError(null)
    }
  }, [selectedRelation, isNew])

  const lookupKindName = (kindId: string) =>
    kinds.find((kind) => kind.kind_id === kindId)?.kind_name || kindId

  const splitVerbs = (text: string) =>
    text
      .split('\n')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)

  const verbs = splitVerbs(verbsText)
  const reversedVerbs = splitVerbs(reversedVerbsText)
  const fromVarious = isVariousOnSide(relationType, 'from')
  const toVarious = isVariousOnSide(relationType, 'to')
  const forwardInf = verbs[0] || 'relate'
  const forwardSing = conjugateToThirdPerson(forwardInf)
  const forwardPlur = presentPluralForm(forwardInf)

  const reversedInf = reversedVerbs[0] || ''
  const reversedSing = reversedInf ? conjugateToThirdPerson(reversedInf) : ''
  const reversedPlur = reversedInf ? presentPluralForm(reversedInf) : ''

  if (!selectedRelation && !isNew) {
    return null
  }

  const selectedRelatesKind = relatesKindId ? lookupKindName(relatesKindId) : ''
  const selectedRelatesToKind = relatesToKindId ? lookupKindName(relatesToKindId) : ''

  const handleSave = async () => {
    setError(null)

    if (!relationName.trim()) {
      setError('Relation name is required.')
      return
    }

    if (!relatesKindId || !relatesToKindId) {
      setError('Both related kinds must be selected.')
      return
    }

    setSaving(true)

    const payload = {
      relation_name: relationName.trim(),
      relation_type: relationType || null,
      relation_relates_kind: relatesKindId,
      relation_relates_to_kind: relatesToKindId,
      relation_verb: verbs,
      relation_reversed_verb: reversedVerbs,
    }

    try {
      if (!supabase) {
        throw new Error('Supabase client is not available.')
      }

      if (isNew) {
        const { data, error } = await supabase
          .from('Relations')
          .insert([payload])
          .select('*')
          .single()

        if (error) throw error
        if (!data) throw new Error('No relation returned from insert.')

        const newRelation = {
          relation_id: String(data.relation_id),
          relation_name: String(data.relation_name),
          relation_type: data.relation_type,
          relation_relates_kind: String(data.relation_relates_kind),
          relation_relates_to_kind: String(data.relation_relates_to_kind),
          relation_verb: data.relation_verb || [],
          relation_reversed_verb: data.relation_reversed_verb || [],
          relation_relates_kind_name: lookupKindName(String(data.relation_relates_kind)),
          relation_relates_to_kind_name: lookupKindName(String(data.relation_relates_to_kind)),
        }

        addRelation(newRelation)
        setSelectedRelation(newRelation.relation_id)
        onSaved?.(newRelation.relation_id)
      } else if (selectedRelation) {
        const { error } = await supabase
          .from('Relations')
          .update(payload)
          .eq('relation_id', selectedRelation.relation_id)

        if (error) throw error

        updateRelation(selectedRelation.relation_id, {
          relation_name: payload.relation_name,
          relation_type: payload.relation_type ?? undefined,
          relation_relates_kind: payload.relation_relates_kind,
          relation_relates_to_kind: payload.relation_relates_to_kind,
          relation_verb: payload.relation_verb,
          relation_reversed_verb: payload.relation_reversed_verb,
          relation_relates_kind_name: lookupKindName(payload.relation_relates_kind),
          relation_relates_to_kind_name: lookupKindName(payload.relation_relates_to_kind),
        })
        onSaved?.(selectedRelation.relation_id)
      }
    } catch (err: any) {
      setError(err?.message ?? 'Unable to save relation.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{isNew ? 'New Relation' : relationName}</h2>
          {!isNew && selectedRelation && (
            <p className="text-sm text-gray-600 mt-1">Relation ID: {selectedRelation.relation_id}</p>
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
            <h3 className="text-lg font-semibold mb-3">Relation Details</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Relation Name</label>
                <input
                  value={relationName}
                  onChange={(e) => setRelationName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Relation Type</label>
                <input
                  value={relationType}
                  onChange={(e) => setRelationType(e.target.value)}
                  placeholder="e.g. one-to-many"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Relates Kind</label>
                <select
                  value={relatesKindId}
                  onChange={(e) => setRelatesKindId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a kind</option>
                  {kinds.map((kind) => (
                    <option key={kind.kind_id} value={kind.kind_id}>
                      {kind.kind_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Relates To Kind</label>
                <select
                  value={relatesToKindId}
                  onChange={(e) => setRelatesToKindId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a kind</option>
                  {kinds.map((kind) => (
                    <option key={kind.kind_id} value={kind.kind_id}>
                      {kind.kind_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verbs</label>
              <textarea
                value={verbsText}
                onChange={(e) => setVerbsText(e.target.value)}
                rows={6}
                placeholder="one verb per line"
                className="w-full rounded-lg border border-gray-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reversed Verbs</label>
              <textarea
                value={reversedVerbsText}
                onChange={(e) => setReversedVerbsText(e.target.value)}
                rows={6}
                placeholder="one verb per line"
                className="w-full rounded-lg border border-gray-300 p-3 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-blue-900">
              <strong>Relation:</strong> {annotateKindName(selectedRelatesKind || selectedRelation?.relation_relates_kind_name || lookupKindName(selectedRelation?.relation_relates_kind || ''), relationType, 'from')}{' '}
              {fromVarious ? `${forwardSing} (${forwardPlur})` : forwardSing}{' '}
              {annotateKindName(selectedRelatesToKind || selectedRelation?.relation_relates_to_kind_name || lookupKindName(selectedRelation?.relation_relates_to_kind || ''), relationType, 'to')}
            </p>
            {reversedVerbs.length > 0 && (
              <p className="text-sm text-blue-900">
                <strong>Reversed:</strong> {annotateKindName(selectedRelatesToKind || selectedRelation?.relation_relates_to_kind_name || lookupKindName(selectedRelation?.relation_relates_to_kind || ''), relationType, 'to')}{' '}
                {toVarious ? `${reversedSing} (${reversedPlur})` : reversedSing}{' '}
                {annotateKindName(selectedRelatesKind || selectedRelation?.relation_relates_kind_name || lookupKindName(selectedRelation?.relation_relates_kind || ''), relationType, 'from')}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {saving ? 'Saving…' : isNew ? 'Create Relation' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
