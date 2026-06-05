import { useState } from 'react'
import { useWorldStore } from '../store/worldStore'
import { BookOpen, Trash2, ChevronDown, ChevronRight, Zap } from 'lucide-react'

export function RulebooksList() {
  const rulebooks = useWorldStore((state) => state.rulebooks)
  const rules = useWorldStore((state) => state.rules)
  const kinds = useWorldStore((state) => state.kinds)
  const selectedRulebookId = useWorldStore((state) => state.selectedRulebookId)
  const selectedRuleId = useWorldStore((state) => state.selectedRuleId)
  const setSelectedRulebook = useWorldStore((state) => state.setSelectedRulebook)
  const setSelectedRule = useWorldStore((state) => state.setSelectedRule)
  const deleteRulebook = useWorldStore((state) => state.deleteRulebook)
  const deleteRule = useWorldStore((state) => state.deleteRule)
  
  const [expandedRulebookIds, setExpandedRulebookIds] = useState<Set<string>>(new Set())

  const toggleExpanded = (rulebookId: string) => {
    const newExpanded = new Set(expandedRulebookIds)
    if (newExpanded.has(rulebookId)) {
      newExpanded.delete(rulebookId)
    } else {
      newExpanded.add(rulebookId)
    }
    setExpandedRulebookIds(newExpanded)
  }

  const lookupKindName = (kindId: string) =>
    kinds.find((kind) => kind.kind_id === kindId)?.kind_name || kindId
  
  const getRulesForRulebook = (rulebookId: string) =>
    rules.filter((rule) => rule.rulebook_id === rulebookId)
  
  return (
    <div className="h-full bg-white rounded-lg shadow overflow-y-auto">
      <div className="px-4 py-3 border-b sticky top-0 bg-white">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen size={20} />
          Rulebooks
        </h2>
      </div>
      <div className="p-2">
        {rulebooks.length === 0 ? (
          <p className="text-sm text-gray-500 p-2">No rulebooks yet</p>
        ) : (
          rulebooks.map((rulebook) => {
            const rulebookRules = getRulesForRulebook(rulebook.rulebook_id)
            const isExpanded = expandedRulebookIds.has(rulebook.rulebook_id)
            const hasRules = rulebookRules.length > 0
            
            return (
              <div key={rulebook.rulebook_id} className="space-y-1">
                <div className="flex items-center gap-2">
                  {hasRules && (
                    <button
                      onClick={() => toggleExpanded(rulebook.rulebook_id)}
                      className="p-0 hover:bg-gray-200 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </button>
                  )}
                  {!hasRules && <div className="w-4" />}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setSelectedRulebook(rulebook.rulebook_id)}
                      className={`w-full text-left rounded transition-colors ${
                        selectedRulebookId === rulebook.rulebook_id
                          ? 'bg-blue-50 text-blue-700 font-semibold'
                          : 'text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <div className="px-2 py-1">
                        <p className="text-sm font-medium truncate">{rulebook.rulebook_name}</p>
                        <p className="text-xs text-gray-600 truncate">
                          {rulebook.rulebook_basis_name || lookupKindName(rulebook.rulebook_basis)}
                        </p>
                      </div>
                    </button>
                  </div>
                  <button
                    onClick={() => deleteRulebook(rulebook.rulebook_id)}
                    className="ml-2 p-1 hover:bg-red-100 text-red-600 rounded flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                {hasRules && isExpanded && (
                  <div className="ml-4 border-l border-gray-200 pl-2 space-y-1">
                    {rulebookRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center gap-2 group"
                      >
                        <button
                          onClick={() => setSelectedRule(rule.id)}
                          className={`flex-1 text-left rounded transition-colors ${
                            selectedRuleId === rule.id
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="px-2 py-1 flex items-center gap-2">
                            <Zap size={14} className="flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{rule.name}</p>
                              {rule.description && (
                                <p className="text-xs text-gray-600 truncate">{rule.description}</p>
                              )}
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
