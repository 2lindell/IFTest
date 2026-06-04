import { useWorldStore } from '../store/worldStore'
import { BookOpen, Trash2 } from 'lucide-react'

export function RulebooksList() {
  const rulebooks = useWorldStore((state) => state.rulebooks)
  const kinds = useWorldStore((state) => state.kinds)
  const selectedRulebookId = useWorldStore((state) => state.selectedRulebookId)
  const setSelectedRulebook = useWorldStore((state) => state.setSelectedRulebook)
  const deleteRulebook = useWorldStore((state) => state.deleteRulebook)

  const lookupKindName = (kindId: string) =>
    kinds.find((kind) => kind.kind_id === kindId)?.kind_name || kindId
  
  return (
    <div className="h-full bg-white rounded-lg shadow overflow-y-auto">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen size={20} />
          Rulebooks
        </h2>
      </div>
      <div className="p-2">
        {rulebooks.length === 0 ? (
          <p className="text-sm text-gray-500 p-2">No rulebooks yet</p>
        ) : (
          rulebooks.map((rulebook) => (
            <div
              key={rulebook.rulebook_id}
              className={`flex items-center justify-between p-3 mb-2 rounded border ${
                selectedRulebookId === rulebook.rulebook_id
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <button
                onClick={() => setSelectedRulebook(rulebook.rulebook_id)}
                className="flex-1 text-left"
              >
                <p className="font-medium text-sm">{rulebook.rulebook_name}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {rulebook.rulebook_basis_name || lookupKindName(rulebook.rulebook_basis)}
                </p>
              </button>
              <button
                onClick={() => deleteRulebook(rulebook.rulebook_id)}
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
