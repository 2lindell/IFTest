import { useWorldStore } from '../store/worldStore'
import { Layers } from 'lucide-react'

export function KindsTree() {
  const kinds = useWorldStore((state) => state.kinds)
  const selectedKindId = useWorldStore((state) => state.selectedKindId)
  const setSelectedKind = useWorldStore((state) => state.setSelectedKind)
  
  const renderKind = (kind: typeof kinds[0], depth: number = 0) => {
    const children = kinds.filter((k) => k.parent_kind_id === kind.kind_id)
    
    return (
      <div key={kind.kind_id}>
        <button
          onClick={() => setSelectedKind(kind.kind_id)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded transition-colors ${
            selectedKindId === kind.kind_id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-900'
          }`}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          <Layers size={16} className="flex-shrink-0" />
          <span className="text-sm">{kind.kind_name}</span>
        </button>
        {children.map((child) => renderKind(child, depth + 1))}
      </div>
    )
  }
  
  const rootKinds = kinds.filter((kind) => !kind.parent_kind_id)
  
  return (
    <div className="h-full bg-white rounded-lg shadow overflow-y-auto">
      <div className="px-4 py-3 border-b sticky top-0 bg-white">
        <h2 className="text-lg font-semibold">Kinds</h2>
      </div>
      <div className="p-2">
        {rootKinds.length === 0 ? (
          <p className="text-sm text-gray-500 p-2">No kinds yet</p>
        ) : (
          rootKinds.map((kind) => renderKind(kind))
        )}
      </div>
    </div>
  )
}
