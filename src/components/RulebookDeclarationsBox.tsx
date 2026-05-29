import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BookOpen } from 'lucide-react'

interface RulebookDeclaration {
  rulebook_id: string
  rulebook_name: string
  rulebook_declaration: string
}

export function RulebookDeclarationsBox() {
  const [declarations, setDeclarations] = useState<RulebookDeclaration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDeclarations = async () => {
      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('rulebookdeclarations')
          .select('*')

        if (fetchError) throw fetchError
        setDeclarations(data || [])
        setError(null)
      } catch (err) {
        console.error('Error loading rulebook declarations:', err)
        setError(err instanceof Error ? err.message : 'Failed to load declarations')
      } finally {
        setLoading(false)
      }
    }

    loadDeclarations()
  }, [])

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen size={20} className="text-blue-600" />
          Rulebook Declarations
        </h2>
        <p className="text-sm text-gray-600 mt-1">Inform 7 declarations for all rulebooks</p>
      </div>

      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading declarations...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-semibold">Error loading declarations</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && declarations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No rulebook declarations found</p>
          </div>
        )}

        {!loading && !error && declarations.length > 0 && (
          <div className="space-y-4">
            {declarations.map((declaration) => (
              <div
                key={declaration.rulebook_id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-semibold text-gray-900">{declaration.rulebook_name}</h3>
                </div>
                <div className="p-4">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
                    {declaration.rulebook_declaration}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
