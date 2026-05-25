import { useWorldStore } from '../store/worldStore'

export function PreviewPanel() {
  const selectedObjectId = useWorldStore((state) => state.selectedObjectId)
  const objects = useWorldStore((state) => state.objects)
  
  const selectedObject = objects.find((obj) => obj.id === selectedObjectId)
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">Preview</h2>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {selectedObject ? (
          <div className="prose prose-sm max-w-none">
            <h1 className="text-2xl font-bold mb-2">{selectedObject.name}</h1>
            <div className="text-gray-700 whitespace-pre-wrap">
              {selectedObject.description}
            </div>
            {Object.keys(selectedObject.properties).length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Properties</h3>
                <dl className="space-y-2">
                  {Object.entries(selectedObject.properties).map(([key, value]) => (
                    <div key={key} className="flex">
                      <dt className="font-medium mr-2">{key}:</dt>
                      <dd className="text-gray-600">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">Select an object to preview</p>
        )}
      </div>
    </div>
  )
}
