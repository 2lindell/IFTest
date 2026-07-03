import { useState } from 'react'
import { KindsTree } from './KindsTree'
import { RulebooksList } from './RulebooksList'
import { RelationsList } from './RelationsList'
import { ActionsList } from './ActionsList'
import { EntitiesList } from './EntitiesList'
import { PropertiesList } from './PropertiesList'
import { VariablesList } from './VariablesList'
// Kind/Entity properties are now handled inside their editors

const tabs = [
  'Kinds',
  'Rulebooks',
  'Relations',
  'Actions',
  'Entities',
  'Properties',
  'Variables',
]

export function ListsPanel() {
  const [active, setActive] = useState('Kinds')

  return (
    <div className="h-full bg-white rounded-lg shadow overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={`px-3 py-1 rounded ${active === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-2 overflow-auto flex-1 min-h-0">
        {active === 'Kinds' && <KindsTree onNewKind={() => {}} />}
        {active === 'Rulebooks' && <RulebooksList />}
        {active === 'Relations' && <RelationsList onNewRelation={() => {}} />}
        {active === 'Actions' && <ActionsList onNewAction={() => {}} />}
        {active === 'Entities' && <EntitiesList />}
        {active === 'Properties' && <PropertiesList />}
        {active === 'Variables' && <VariablesList />}
        {/* Kind-Properties and Entity-Properties loaded inside editors */}
      </div>
    </div>
  )
}

export default ListsPanel
