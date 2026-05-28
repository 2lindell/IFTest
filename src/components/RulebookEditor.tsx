import { useWorldStore } from '../store/worldStore'

export function RulebookEditor() {
  const selectedRulebookId = useWorldStore((state) => state.selectedRulebookId)
  const rulebooks = useWorldStore((state) => state.rulebooks)
  
  const selectedRulebook = rulebooks.find(
    (rb) => rb.rulebook_id === selectedRulebookId
  )
  
  if (!selectedRulebook) {
    return null
  }
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-2xl font-bold">{selectedRulebook.rulebook_name}</h2>
      </div>
      
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rulebook ID
              </label>
              <p className="text-gray-900 font-mono text-xs">{selectedRulebook.rulebook_id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Basis
              </label>
              <p className="text-gray-900">{selectedRulebook.rulebook_basis}</p>
            </div>
          </div>
          
          {/* Result Kind */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Result Kind
            </label>
            <p className="text-gray-900">{selectedRulebook.rulebook_result_kind}</p>
          </div>
          
          {/* Named Outcomes */}
          <div className="grid grid-cols-2 gap-6">
            {selectedRulebook.rulebook_named_outcomes_success && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Success Outcome
                </label>
                <p className="text-green-700">
                  {selectedRulebook.rulebook_named_outcomes_success}
                </p>
              </div>
            )}
            {selectedRulebook.rulebook_named_outcomes_failure && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Failure Outcome
                </label>
                <p className="text-red-700">
                  {selectedRulebook.rulebook_named_outcomes_failure}
                </p>
              </div>
            )}
          </div>
          
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Rules for this rulebook will be available in a
              separate Rules table once you've created it in your database.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
