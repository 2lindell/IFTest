import { useWorldStore } from '../store/worldStore'
import { ChevronRight, Layers } from 'lucide-react'
import { useState } from 'react'

export function KindsTree() {
  const kinds = useWorldStore((state) => state.kinds)
  const selectedKindId = useWorldStore((state) => state.selectedKindId)
  const setSelectedKind = useWorldStore((state) => state.setSelectedKind)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  
  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
  
  const renderKind = (kind: typeof kinds[0], depth: number = 0) => {
    const children = kinds.filter((k) => k.parent_kind_id === kind.kind_id)
    const isExpanded = expandedIds.has(kind.kind_id)
    
    return (
      <div key={kind.kind_id}>
        <button
          onClick={() => {
            setSelectedKind(kind.kind_id)
            if (children.length > 0) {
              toggleExpanded(kind.kind_id)
            }
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded ${
            selectedKindId === kind.kind_id ? 'bg-blue-50 text-blue-700' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          {children.length > 0 && (
            <ChevronRight
              size={16}
              className={`transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          )}
          <Layers size={16} />
          <span className="text-sm font-medium">{kind.kind_name}</span>
        </button>
        {isExpanded &&
          children.map((child) => renderKind(child, depth + 1))}
      </div>
    )
  }
  
  const rootKinds = kinds.filter((kind) => !kind.parent_kind_id)
  
  return (
    <div className="h-full bg-white rounded-lg shadow overflow-y-auto">
      <div className="px-4 py-3 border-b">
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
