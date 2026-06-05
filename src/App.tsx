import { useEffect } from 'react'
import { useWorldStore } from './store/worldStore'
import { KindsTree } from './components/KindsTree'
import { RulebooksList } from './components/RulebooksList'
import { RelationsList } from './components/RelationsList'
import { KindEditor } from './components/KindEditor'
import { RulebookEditor } from './components/RulebookEditor'
import { RelationEditor } from './components/RelationEditor'
import { StoryBox } from './components/StoryBox'
import { supabase } from './lib/supabase'
import { Kind } from './lib/types'

function App() {
  const setKinds = useWorldStore((state) => state.setKinds)
  const setRulebooks = useWorldStore((state) => state.setRulebooks)
  const setRelations = useWorldStore((state) => state.setRelations)
  const selectedKindId = useWorldStore((state) => state.selectedKindId)
  const selectedRulebookId = useWorldStore((state) => state.selectedRulebookId)
  const selectedRelationId = useWorldStore((state) => state.selectedRelationId)
  
  useEffect(() => {
    const loadData = async () => {
      if (!supabase) {
        console.warn('Supabase is not configured; skipping data load.')
        setKinds([])
        setRulebooks([])
        setRelations([])
        return
      }

      try {
        const kindViews = ['Kinds', 'Kinds of Value']
        const loadedKinds: Kind[] = []

        for (const view of kindViews) {
          const { data, error } = await supabase.from(view).select('*')
          if (error) throw error
          if (data) {
            for (const row of data) {
              loadedKinds.push({
                kind_id: String((row as any).kind_id),
                kind_name: String((row as any).kind_name),
                parent_kind_name: (row as any).parent_kind_name
                  ? String((row as any).parent_kind_name)
                  : undefined,
                parent_kind_id: undefined,
                source: view,
                kind_properties: (row as any).kind_properties ?? {},
              })
            }
          }
        }

        const kindByName = new Map<string, typeof loadedKinds[number]>()
        for (const kind of loadedKinds) {
          kindByName.set(kind.kind_name, kind)
        }

        for (const kind of loadedKinds) {
          if (kind.parent_kind_name) {
            const parent = kindByName.get(kind.parent_kind_name)
            kind.parent_kind_id = parent?.kind_id
          }
        }

        const { data: rulebooks, error: rulebooksError } = await supabase
          .from('Rulebooks')
          .select('*')

        if (rulebooksError) throw rulebooksError

        const { data: assertionRows, error: assertionsError } = await supabase
          .from('Rulebook Assertions')
          .select('rulebook_id, rulebook_basis_name, rulebook_result_kind_name')

        if (assertionsError) throw assertionsError

        const assertionMap = new Map(
          (assertionRows ?? []).map((row: any) => [String(row.rulebook_id), row]),
        )

        const enrichedRulebooks = (rulebooks ?? []).map((rulebook: any) => {
          const assertion = assertionMap.get(String(rulebook.rulebook_id))
          return {
            ...rulebook,
            rulebook_basis_name: assertion?.rulebook_basis_name,
            rulebook_result_kind_name: assertion?.rulebook_result_kind_name,
          }
        })

        const { data: relationsData, error: relationsError } = await supabase
          .from('Relations')
          .select('*')

        if (relationsError) throw relationsError

        const { data: relationAssertions, error: relationAssertionsError } = await supabase
          .from('Relation Assertions')
          .select('relation_id, relation_relates_kind_name, relation_relates_to_kind_name')

        if (relationAssertionsError) throw relationAssertionsError

        const relationAssertionMap = new Map(
          (relationAssertions ?? []).map((row: any) => [String(row.relation_id), row]),
        )

        const enrichedRelations = (relationsData ?? []).map((relation: any) => {
          const assertion = relationAssertionMap.get(String(relation.relation_id))
          return {
            relation_id: String(relation.relation_id),
            relation_name: relation.relation_name,
            relation_verb: relation.relation_verb || [],
            relation_reversed_verb: relation.relation_reversed_verb || [],
            relation_relates_kind: String(relation.relation_relates_kind),
            relation_relates_to_kind: String(relation.relation_relates_to_kind),
            relation_type: relation.relation_type,
            relation_relates_kind_name: assertion?.relation_relates_kind_name,
            relation_relates_to_kind_name: assertion?.relation_relates_to_kind_name,
          }
        })

        setKinds(loadedKinds)
        setRulebooks(enrichedRulebooks)
        setRelations(enrichedRelations)
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }
    
    loadData()
  }, [setKinds, setRulebooks, setRelations])
  
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
          {/* Left Sidebar - Kinds, Rulebooks, and Relations */}
          <div className="col-span-3 space-y-4 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-hidden min-h-0">
              <KindsTree />
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <RulebooksList />
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <RelationsList />
            </div>
          </div>
          
          {/* Main Content - Editors and Details */}
          <div className="col-span-9 overflow-auto">
            {selectedKindId && !selectedRulebookId && !selectedRelationId && (
              <KindEditor />
            )}
            {selectedRulebookId && !selectedKindId && !selectedRelationId && (
              <RulebookEditor />
            )}
            {selectedRelationId && !selectedKindId && !selectedRulebookId && (
              <RelationEditor />
            )}
            {!selectedKindId && !selectedRulebookId && !selectedRelationId && (
              <div className="bg-white rounded-lg shadow flex items-center justify-center p-8">
                <div className="text-center text-gray-500">
                  <p className="text-lg font-semibold">Select a Kind, Rulebook, or Relation to begin</p>
                  <p className="text-sm mt-2">Choose from the left panel to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rulebook Declarations Section */}
        <div className="mt-8">
          <StoryBox />
        </div>
      </main>
    </div>
  )
}

export default App
