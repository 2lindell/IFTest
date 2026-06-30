import { useWorldStore } from '../store/worldStore'
import { PlusCircle } from 'lucide-react'

export function PropertiesList() {
  const properties = useWorldStore((s) => s.properties)

  return (
    <div className="h-full bg-white rounded-lg shadow overflow-y-auto">
      <div className="px-4 py-3 border-b sticky top-0 bg-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PlusCircle size={20} />
          <h2 className="text-lg font-semibold">Properties</h2>
        </div>
        <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs">New</button>
      </div>
      <div className="p-2">
        {properties.length === 0 ? (
          <div className="text-sm text-gray-500 p-2">No properties yet.</div>
        ) : (
          properties.map((p: any) => (
            <div key={p.property_id} className="mb-2 rounded border border-gray-200 overflow-hidden">
              <div className="w-full text-left p-3">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-medium truncate">{p.property_name ?? p.property_adjective}</p>
                    <p className="text-xs text-gray-600 truncate">{p.property_kind_name ?? ''}</p>
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

export default PropertiesList
