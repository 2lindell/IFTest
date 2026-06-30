import { useWorldStore } from '../store/worldStore'
import { PlusCircle } from 'lucide-react'

export function EntitiesList() {
  const entities = useWorldStore((s) => s.entities)

  return (
    <div className="h-full bg-white rounded-lg shadow overflow-y-auto">
      <div className="px-4 py-3 border-b sticky top-0 bg-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PlusCircle size={20} />
          <h2 className="text-lg font-semibold">Entities</h2>
        </div>
        <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs">New</button>
      </div>
      <div className="p-2">
        {entities.length === 0 ? (
          <div className="text-sm text-gray-500 p-2">No entities yet.</div>
        ) : (
          entities.map((e: any) => (
            <div key={e.entity_id} className="mb-2 rounded border border-gray-200 overflow-hidden">
              <div className="w-full text-left p-3">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium truncate">{e.entity_name}</p>
                    <p className="text-xs text-gray-600 truncate">{e.entity_of_kind_name ?? ''}</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default EntitiesList
