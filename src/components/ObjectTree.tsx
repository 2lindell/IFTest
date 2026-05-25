import { useWorldStore } from '../store/worldStore'
import { ChevronRight, Package, MapPin, Users, Zap } from 'lucide-react'
import { useState } from 'react'

export function ObjectTree() {
  const objects = useWorldStore((state) => state.objects)
  const selectedObjectId = useWorldStore((state) => state.selectedObjectId)
  const setSelectedObject = useWorldStore((state) => state.setSelectedObject)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  
  const typeIcons = {
    object: Package,
    location: MapPin,
    character: Users,
    rule: Zap,
  }
  
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
  
  const renderObject = (object: typeof objects[0], depth: number = 0) => {
    const children = objects.filter((obj) => obj.parentId === object.id)
    const isExpanded = expandedIds.has(object.id)
    const Icon = typeIcons[object.type as keyof typeof typeIcons]
    
    return (
      <div key={object.id}>
        <button
          onClick={() => {
            setSelectedObject(object.id)
            if (children.length > 0) {
              toggleExpanded(object.id)
            }
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 rounded ${
            selectedObjectId === object.id ? 'bg-blue-50 text-blue-700' : ''
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
          {Icon && <Icon size={16} />}
          <span className="text-sm font-medium">{object.name}</span>
        </button>
        {isExpanded &&
          children.map((child) => renderObject(child, depth + 1))}
      </div>
    )
  }
  
  const rootObjects = objects.filter((obj) => !obj.parentId)
  
  return (
    <div className="h-full bg-white rounded-lg shadow overflow-y-auto">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">World Objects</h2>
      </div>
      <div className="p-2">
        {rootObjects.length === 0 ? (
          <p className="text-sm text-gray-500 p-2">No objects yet</p>
        ) : (
          rootObjects.map((obj) => renderObject(obj))
        )}
      </div>
    </div>
  )
}
