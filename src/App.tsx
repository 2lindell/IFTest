import { useEffect } from 'react'
import { useWorldStore } from './store/worldStore'
import { ObjectTree } from './components/ObjectTree'
import { RulesList } from './components/RulesList'
import { EditorPanel } from './components/Editor'
import { PreviewPanel } from './components/Preview'
import { supabase } from './lib/supabase'

function App() {
  const setObjects = useWorldStore((state) => state.setObjects)
  const setRules = useWorldStore((state) => state.setRules)
  
  useEffect(() => {
  const loadData = async () => {
    try {
      const { data: kinds, error: kindsError } = await supabase
        .from('kinds')
        .select('*')
      
      const { data: rulebooks, error: rulebooksError } = await supabase
        .from('rulebooks')
        .select('*')
      
      if (kindsError) throw kindsError
      if (rulebooksError) throw rulebooksError
      
      setKinds(kinds || [])
      setRulebooks(rulebooks || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }
  
  loadData()
}, [])
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Interactive Fiction World Builder
          </h1>
          <p className="text-gray-600 mt-1">Design and edit your world model</p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Sidebar - Object Tree and Rules */}
          <div className="col-span-3 space-y-6 overflow-hidden">
            <div className="h-1/2 overflow-hidden">
              <ObjectTree />
            </div>
            <div className="h-1/2 overflow-hidden">
              <RulesList />
            </div>
          </div>
          
          {/* Main Content - Editor and Preview */}
          <div className="col-span-9 grid grid-cols-2 gap-6 overflow-hidden">
            <div className="overflow-hidden">
              <EditorPanel />
            </div>
            <div className="overflow-hidden">
              <PreviewPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
