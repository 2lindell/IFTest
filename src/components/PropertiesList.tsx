import { useState } from 'react'
import { useWorldStore } from '../store/worldStore'
import { PlusCircle } from 'lucide-react'

export function PropertiesList() {
  const properties = useWorldStore((s) => s.properties)
  const kinds = useWorldStore((s) => s.kinds)
  const kindProperties = useWorldStore((s) => s.kindProperties)
  const setKindProperties = useWorldStore((s) => s.setKindProperties)

  const [showModal, setShowModal] = useState(false)
  const [targetId, setTargetId] = useState<string>('')
  const [initialValue, setInitialValue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const setProperties = useWorldStore((s) => s.setProperties)
  const [createNew, setCreateNew] = useState(false)
  const [newType, setNewType] = useState<'either-or' | 'named'>('either-or')
  const [newAdjA, setNewAdjA] = useState('')
  const [newAdjB, setNewAdjB] = useState('')
  const [newName, setNewName] = useState('')

  const eitherOr = properties.filter((p: any) => p.property_opposite_adjective)
  const named = properties.filter((p: any) => p.property_name)

  const openModal = () => {
    setCreateNew(true)
    setNewType('either-or')
    setTargetId(kinds?.[0]?.kind_id ? String(kinds[0].kind_id) : '')
    setInitialValue('')
    setNewAdjA('')
    setNewAdjB('')
    setNewName('')
    setError(null)
    setShowModal(true)
  }

  const closeModal = () => setShowModal(false)

  const handleAdd = () => {
    // If creating a new property
    if (createNew) {
      // validate name/adjectives
      if (newType === 'either-or') {
        if (!newAdjA.trim() || !newAdjB.trim()) {
          setError('Both adjectives are required for either-or properties.')
          return
        }
      } else {
        if (!newName.trim()) {
          setError('Name is required for named properties.')
          return
        }
      }

      let parsed: any = null
      if (initialValue) {
        try {
          parsed = JSON.parse(initialValue)
        } catch (e) {
          setError('Initial value must be valid JSON or empty')
          return
        }
      }

      // generate id
      const maxId = properties.reduce((acc: number, p: any) => Math.max(acc, Number(p.property_id || 0)), 0)
      const newId = maxId + 1 || Date.now()
      const newProp: any = {
        property_id: newId,
        property_kind_id: Number(targetId) || null,
      }

      if (newType === 'either-or') {
        newProp.property_adjective = newAdjA.trim()
        newProp.property_opposite_adjective = newAdjB.trim()
      } else {
        newProp.property_name = newName.trim()
      }

      // persist property in store
      setProperties([...(properties || []), newProp])

      // For named properties, bind to the selected kind.
      if (newType === 'named') {
        const newKP = {
          kindproperty_property_id: newProp.property_id,
          kindproperty_kind_id: Number(targetId),
          kindproperty_initial_value: parsed,
          kindproperty_implication: [] as string[],
        }
        setKindProperties([...(kindProperties || []), newKP])
      }

      setShowModal(false)
      return
    }

    // only create-new flow is supported now
  }

  return (
    <div className="h-full bg-white rounded-lg shadow overflow-y-auto">
      <div className="px-4 py-3 border-b sticky top-0 bg-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PlusCircle size={20} />
          <h2 className="text-lg font-semibold">Properties</h2>
        </div>
        <button onClick={openModal} className="px-2 py-1 bg-blue-600 text-white rounded text-xs">New</button>
      </div>

      <div className="p-2">
        {properties.length === 0 ? (
          <div className="text-sm text-gray-500 p-2">No properties yet.</div>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Either-Or Properties</h3>
              {eitherOr.length === 0 ? (
                <div className="text-xs text-gray-500">None</div>
              ) : (
                eitherOr.map((p: any) => (
                  <div key={p.property_id} className="mb-2 rounded border border-gray-200 p-3">
                    <div>
                      <p className="text-sm font-medium truncate">
                        usually {p.property_adjective}{p.property_opposite_adjective ? `, not ${p.property_opposite_adjective}` : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2">Named Properties</h3>
              {named.length === 0 ? (
                <div className="text-xs text-gray-500">None</div>
              ) : (
                named.map((p: any) => (
                  <div key={p.property_id} className="mb-2 rounded border border-gray-200 p-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium truncate">{p.property_name}</p>
                        <p className="text-xs text-gray-600">Kind: {kinds.find(k => String(k.kind_id) === String(p.property_kind_id))?.kind_name?.toLowerCase() ?? '—'}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={closeModal} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Property</h3>
              <button onClick={closeModal} className="text-gray-600">Close</button>
            </div>

            <div>
              <div>
                <p className="font-semibold">Create New Property</p>
                <div className="mb-2">
                  <label className="block text-xs text-gray-600">Type</label>
                  <div className="flex gap-2 mt-2">
                    <label className="flex items-center gap-2"><input type="radio" checked={newType === 'either-or'} onChange={() => setNewType('either-or')} /> Either-Or</label>
                    <label className="flex items-center gap-2"><input type="radio" checked={newType === 'named'} onChange={() => setNewType('named')} /> Named</label>
                  </div>
                </div>

                {newType === 'either-or' ? (
                  <div>
                    <label className="block text-xs text-gray-600">Adjective A</label>
                    <input value={newAdjA} onChange={(e) => setNewAdjA(e.target.value)} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1" />
                    <label className="block text-xs text-gray-600 mt-2">Adjective B</label>
                    <input value={newAdjB} onChange={(e) => setNewAdjB(e.target.value)} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1" />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-gray-600">Name</label>
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1" />
                  </div>
                )}

                {newType === 'named' && (
                  <div className="mb-2">
                    <label className="block text-xs text-gray-600">Select Kind</label>
                    <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1">
                      {kinds.map((it: any) => (
                        <option key={it.kind_id} value={it.kind_id}>{it.kind_name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="mb-2">
                  <label className="block text-xs text-gray-600">Initial Value (JSON)</label>
                  <input value={initialValue} onChange={(e) => setInitialValue(e.target.value)} className="mt-1 block w-full rounded border border-gray-300 px-2 py-1 font-mono text-sm" placeholder='e.g. "blue" or {"count":1}' />
                </div>

                {error && <div className="text-xs text-red-600 mb-2">{error}</div>}

                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={closeModal} className="px-3 py-1 border rounded">Cancel</button>
                  <button onClick={handleAdd} className="px-3 py-1 bg-blue-600 text-white rounded">Create & Add</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertiesList
