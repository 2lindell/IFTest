import { useWorldStore } from '../store/worldStore'

export function KindsTree() {
  const kinds = useWorldStore((state) => state.kinds)
  const selectedKindId = useWorldStore((state) => state.selectedKindId)
  const setSelectedKind = useWorldStore((state) => state.setSelectedKind)
  
  const renderKind = (kind: typeof kinds[0], depth: number = 0) => {
    const children = kinds.filter((k) => k.parent_kind_id === kind.kind_id)
    const indentStep = 16
    const lineOffset = 8
    const indent = depth * indentStep

    return (
      <div key={kind.kind_id} className="space-y-1 relative" style={{ paddingLeft: `${indent}px` }}>
        {children.length > 0 && <div className="absolute inset-y-0 left-0 w-px bg-gray-200" />}
        <button
          onClick={() => setSelectedKind(kind.kind_id)}
          className={`w-full text-left rounded transition-colors ${
            selectedKindId === kind.kind_id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-900 hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${lineOffset}px` }}
        >
          <span className="text-sm">{kind.kind_name}</span>
        </button>
        {children.length > 0 && (
          <div className="space-y-1">
            {children.map((child) => renderKind(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }
  
  const rootKinds = kinds.filter((kind) => !kind.parent_kind_id)
  const kindRoots = rootKinds.filter((kind) => kind.source === 'Kinds')
  const valueRoots = rootKinds.filter((kind) => kind.source === 'Kinds of Value')
  
  return (
    <div className="h-full bg-white rounded-lg shadow overflow-y-auto">
      <div className="px-4 py-3 border-b sticky top-0 bg-white">
        <h2 className="text-lg font-semibold">Kinds</h2>
      </div>
      <div className="p-2">
        {rootKinds.length === 0 ? (
          <p className="text-sm text-gray-500 p-2">No kinds yet</p>
        ) : (
          <div className="space-y-2">
            {kindRoots.map((kind) => renderKind(kind))}
            {kindRoots.length > 0 && valueRoots.length > 0 && (
              <div className="border-t border-gray-200 my-2" />
            )}
            {valueRoots.map((kind) => renderKind(kind))}
          </div>
        )}
      </div>
    </div>
  )
}
