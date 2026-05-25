import { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { useWorldStore } from '../store/worldStore'

export function EditorPanel() {
  const editorRef = useRef(null)
  const selectedObjectId = useWorldStore((state) => state.selectedObjectId)
  const objects = useWorldStore((state) => state.objects)
  const updateObject = useWorldStore((state) => state.updateObject)
  
  const selectedObject = objects.find((obj) => obj.id === selectedObjectId)
  
  const handleEditorChange = (value: string | undefined) => {
    if (value && selectedObject) {
      updateObject(selectedObject.id, {
        description: value,
      })
    }
  }
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">
          {selectedObject ? `Editing: ${selectedObject.name}` : 'Select an object to edit'}
        </h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="markdown"
          value={selectedObject?.description || ''}
          onChange={handleEditorChange}
          theme="light"
          options={{
            minimap: { enabled: false },
            wordWrap: 'on',
            lineNumbers: 'off',
          }}
        />
      </div>
    </div>
  )
}
