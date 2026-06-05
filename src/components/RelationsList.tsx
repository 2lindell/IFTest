import { useWorldStore } from '../store/worldStore'
import { Link, Trash2 } from 'lucide-react'

export function RelationsList() {
  const relations = useWorldStore((state) => state.relations)
  const kinds = useWorldStore((state) => state.kinds)
  const selectedRelationId = useWorldStore((state) => state.selectedRelationId)
  const setSelectedRelation = useWorldStore((state) => state.setSelectedRelation)
  const deleteRelation = useWorldStore((state) => state.deleteRelation)

  const lookupKindName = (kindId: string) =>
    kinds.find((kind) => kind.kind_id === kindId)?.kind_name || kindId
  
  return (
    <div className="h-full bg-white rounded-lg shadow overflow-y-auto">
      <div className="px-4 py-3 border-b sticky top-0 bg-white">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Link size={20} />
          Relations
        </h2>
      </div>
      <div className="p-2">
        {relations.length === 0 ? (
          <p className="text-sm text-gray-500 p-2">No relations yet</p>
        ) : (
          relations.map((relation) => (
            <div
              key={relation.relation_id}
              className="flex items-center justify-between p-3 mb-2 rounded border group"
            >
              <button
                onClick={() => setSelectedRelation(relation.relation_id)}
                className={`flex-1 text-left transition-colors ${
                  selectedRelationId === relation.relation_id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <p className="font-medium text-sm">{relation.relation_name}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {lookupKindName(relation.relation_relates_kind)} → {lookupKindName(relation.relation_relates_to_kind)}
                </p>
              </button>
              <button
                onClick={() => deleteRelation(relation.relation_id)}
                className="ml-2 p-1 hover:bg-red-100 text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
