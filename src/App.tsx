import { useEffect } from 'react'
import { useWorldStore } from './store/worldStore'
import { KindsTree } from './components/KindsTree'
import { RulebooksList } from './components/RulebooksList'
import { KindEditor } from './components/KindEditor'
import { RulebookEditor } from './components/RulebookEditor'
import { RulebookDeclarationsBox } from './components/RulebookDeclarationsBox'
import { supabase } from './lib/supabase'

function App() {
  const setKinds = useWorldStore((state) => state.setKinds)
  const setRulebooks = useWorldStore((state) => state.setRulebooks)
  const selectedKindId = useWorldStore((state) => state.selectedKindId)
  const selectedRulebookId = useWorldStore((state) => state.selectedRulebookId)
  
  useEffect(() => {
    const loadData = async () => {
      if (!supabase) {
        console.warn('Supabase is not configured; skipping data load.')
        setKinds([])
        setRulebooks([])
        return
      }

      try {
        const { data: kinds, error: kindsError } = await supabase
          .from('Kinds')
          .select('*')
        
        const { data: rulebooks, error: rulebooksError } = await supabase
          .from('Rulebooks')
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
  }, [setKinds, setRulebooks])
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Interactive Fiction World Builder
          </h1>
          <p className="text-gray-600 mt-1">Manage Kinds and Rulebooks</p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Sidebar - Kinds and Rulebooks */}
          <div className="col-span-3 space-y-6 overflow-hidden">
            <div className="h-1/2 overflow-hidden">
              <KindsTree />
            </div>
            <div className="h-1/2 overflow-hidden">
              <RulebooksList />
            </div>
          </div>
          
          {/* Main Content - Editors and Details */}
          <div className="col-span-9 overflow-auto">
            {selectedKindId && !selectedRulebookId && (
              <KindEditor />
            )}
            {selectedRulebookId && !selectedKindId && (
              <RulebookEditor />
            )}
            {!selectedKindId && !selectedRulebookId && (
              <div className="bg-white rounded-lg shadow flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <p className="text-lg font-semibold">Select a Kind or Rulebook to begin</p>
                  <p className="text-sm mt-2">Choose from the left panel to edit</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rulebook Declarations Section */}
        <div className="mt-8">
          <RulebookDeclarationsBox />
        </div>
      </main>
    </div>
  )
}

export default App
