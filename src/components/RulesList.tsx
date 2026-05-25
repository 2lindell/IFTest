import { useWorldStore } from '../store/worldStore'
import { Zap, Trash2 } from 'lucide-react'

export function RulesList() {
  const rules = useWorldStore((state) => state.rules)
  const selectedRuleId = useWorldStore((state) => state.selectedRuleId)
  const setSelectedRule = useWorldStore((state) => state.setSelectedRule)
  const deleteRule = useWorldStore((state) => state.deleteRule)
  
  return (
    <div className="h-full bg-white rounded-lg shadow overflow-y-auto">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap size={20} />
          World Rules
        </h2>
      </div>
      <div className="p-2">
        {rules.length === 0 ? (
          <p className="text-sm text-gray-500 p-2">No rules yet</p>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center justify-between p-3 mb-2 rounded border ${
                selectedRuleId === rule.id
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <button
                onClick={() => setSelectedRule(rule.id)}
                className="flex-1 text-left"
              >
                <p className="font-medium text-sm">{rule.name}</p>
                <p className="text-xs text-gray-600 mt-1">{rule.description}</p>
              </button>
              <button
                onClick={() => deleteRule(rule.id)}
                className="ml-2 p-1 hover:bg-red-100 text-red-600 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
