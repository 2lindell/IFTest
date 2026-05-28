import { useWorldStore } from '../store/worldStore'
import { useEffect, useState } from 'react'

export function KindEditor() {
  const selectedKindId = useWorldStore((state) => state.selectedKindId)
  const kinds = useWorldStore((state) => state.kinds)
  const updateKind = useWorldStore((state) => state.updateKind)
  
  const selectedKind = kinds.find((kind) => kind.kind_id === selectedKindId)
  const [propertiesJson, setPropertiesJson] = useState('')
  
  useEffect(() => {
    if (selectedKind) {
      setPropertiesJson(JSON.stringify(selectedKind.kind_properties, null, 2))
    }
  }, [selectedKind])
  
  const handlePropertiesChange = (value: string) => {
    setPropertiesJson(value)
    try {
      const parsed = JSON.parse(value)
      if (selectedKind) {
        updateKind(selectedKind.kind_id, {
          kind_properties: parsed,
        })
      }
    } catch (e) {
      // Invalid JSON, don't update yet
    }
  }
  
  if (!selectedKind) {
    return null
  }
  
  const parentKind = selectedKind.parent_kind_id
    ? kinds.find((k) => k.kind_id === selectedKind.parent_kind_id)
    : null
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-2xl font-bold">{selectedKind.kind_name}</h2>
        {parentKind && (
          <p className="text-sm text-gray-600 mt-1">Parent: {parentKind.kind_name}</p>
        )}
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Kind Information</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Kind Name</label>
                <p className="mt-1 text-gray-900">{selectedKind.kind_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kind ID</label>
                <p className="mt-1 text-gray-500 font-mono text-xs">{selectedKind.kind_id}</p>
              </div>
            </div>
          </div>
          
          {/* Properties Editor */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Properties (JSONB)</h3>
            <textarea
              value={propertiesJson}
              onChange={(e) => handlePropertiesChange(e.target.value)}
              className="w-full h-64 p-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="{}"
            />
            <p className="text-xs text-gray-500 mt-2">
              Edit properties as JSON. Changes are saved automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
