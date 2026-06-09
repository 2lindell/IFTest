import { PlusCircle } from 'lucide-react'
import { useWorldStore } from '../store/worldStore'

function pluralize(kindName: string) {
  if (!kindName) return ''
  if (kindName.endsWith('s')) return kindName
  return `${kindName}s`
}

export function ActionsList({ onNewAction }: { onNewAction: () => void }) {
  const actions = useWorldStore((state) => state.actions)
  const selectedActionId = useWorldStore((state) => state.selectedActionId)
  const setSelectedAction = useWorldStore((state) => state.setSelectedAction)
  const deleteAction = useWorldStore((state) => state.deleteAction)

  const describeAction = (action: any) => {
    if (action.action_out_of_world) {
      return 'out of world'
    }

    const direct = action.action_direct_kind_name
    const indirect = action.action_indirect_kind_name

    if (direct && indirect) {
      if (direct === indirect) {
        return `applying to two ${pluralize(direct)}`
      }
      return `applying to one ${direct} and one ${indirect}`
    }

    if (direct) {
      return `applying to one ${direct}`
    }

    return 'applying to nothing'
  }

  return (
    <div className="h-full bg-white rounded-lg shadow overflow-y-auto">
      <div className="px-4 py-3 border-b sticky top-0 bg-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PlusCircle size={20} />
          <h2 className="text-lg font-semibold">Actions</h2>
        </div>
        <button
          onClick={onNewAction}
          className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
        >
          New
        </button>
      </div>
      <div className="p-2">
        {actions.length === 0 ? (
          <div className="text-sm text-gray-500 p-2">No actions yet. Click New to create one.</div>
        ) : (
          actions.map((action) => (
            <div key={action.action_id} className="mb-2 rounded border border-gray-200 overflow-hidden">
              <button
                onClick={() => setSelectedAction(action.action_id)}
                className={`w-full text-left p-3 transition-colors ${
                  selectedActionId === action.action_id ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="text-sm font-medium truncate">{action.action_name}</p>
                    <p className="text-xs text-gray-600 truncate">{describeAction(action)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      deleteAction(action.action_id)
                    }}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Delete
                  </button>
                </div>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
