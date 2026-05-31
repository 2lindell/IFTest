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

  const storyText = declarations
    .map((d) => d.rulebook_declaration)
    .join('\n\n')

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen size={20} />
          Story
        </h2>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-4">
            <p className="font-semibold">Error loading declarations</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <textarea
          value={loading ? 'Loading...' : storyText}
          readOnly
          className="w-full h-64 p-4 font-sans text-sm text-black border border-gray-300 rounded-lg bg-white resize-none focus:outline-none"
          placeholder="Rulebook declarations will appear here..."
        />
      </div>
    </div>
  )
}
