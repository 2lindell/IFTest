import { useWorldStore } from '../store/worldStore'

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
    'follow': 'follows',
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
  const lastTwo = mainVerb.slice(-2)
  const lastThree = mainVerb.slice(-3)
  
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

export function RelationEditor() {
  const selectedRelationId = useWorldStore((state) => state.selectedRelationId)
  const relations = useWorldStore((state) => state.relations)
  const kinds = useWorldStore((state) => state.kinds)
  
  const selectedRelation = relations.find(
    (r) => r.relation_id === selectedRelationId
  )

  const lookupKindName = (kindId: string) =>
    kinds.find((kind) => kind.kind_id === kindId)?.kind_name || kindId
  
  if (!selectedRelation) {
    return null
  }
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-2xl font-bold">{selectedRelation.relation_name}</h2>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relation ID
              </label>
              <p className="text-gray-900 font-mono text-xs">{selectedRelation.relation_id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relation Type
              </label>
              <p className="text-gray-900 capitalize">
                {selectedRelation.relation_type || 'N/A'}
              </p>
            </div>
          </div>

          {/* Related Kinds */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relates Kind
              </label>
              <p className="text-gray-900">
                {selectedRelation.relation_relates_kind_name || lookupKindName(selectedRelation.relation_relates_kind)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relates To Kind
              </label>
              <p className="text-gray-900">
                {selectedRelation.relation_relates_to_kind_name || lookupKindName(selectedRelation.relation_relates_to_kind)}
              </p>
            </div>
          </div>

          {/* Verbs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verbs
            </label>
            <div className="flex flex-wrap gap-2">
              {selectedRelation.relation_verb && selectedRelation.relation_verb.length > 0 ? (
                selectedRelation.relation_verb.map((verb, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {verb}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No verbs defined</p>
              )}
            </div>
          </div>

          {/* Reversed Verbs */}
          {selectedRelation.relation_reversed_verb && selectedRelation.relation_reversed_verb.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verbs (Reversed)
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedRelation.relation_reversed_verb.map((verb, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {verb}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-blue-900">
              <strong>Relation:</strong> {lookupKindName(selectedRelation.relation_relates_kind).toLowerCase()} {conjugateToThirdPerson(selectedRelation.relation_verb?.[0] || 'relates')} {lookupKindName(selectedRelation.relation_relates_to_kind).toLowerCase()}
            </p>
            {selectedRelation.relation_reversed_verb && selectedRelation.relation_reversed_verb.length > 0 && (
              <p className="text-sm text-blue-900">
                <strong>Reversed:</strong> {lookupKindName(selectedRelation.relation_relates_to_kind).toLowerCase()} {conjugateToThirdPerson(selectedRelation.relation_reversed_verb[0])} {lookupKindName(selectedRelation.relation_relates_kind).toLowerCase()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
