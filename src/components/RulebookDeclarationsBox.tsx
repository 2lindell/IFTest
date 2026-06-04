import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { BookOpen } from 'lucide-react'

type AssertionView = {
  viewName: string
  fieldName: string
}

const assertionViews: AssertionView[] = [
  { viewName: 'Rulebook Assertions', fieldName: 'rulebook_assertion' },
  { viewName: 'Relation Assertions', fieldName: 'relation_assertion' },
  { viewName: 'Relation Verb Assertions', fieldName: 'relation_verb_assertion' },  { viewName: 'Kinds', fieldName: 'kind_assertion' },
  { viewName: 'Kinds of Value', fieldName: 'kind_assertion' },]

export function RulebookDeclarationsBox() {
  const [storyLines, setStoryLines] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDeclarations = async () => {
      try {
        setLoading(true)

        if (!supabase) {
          throw new Error('Supabase client is not initialized')
        }

        const supabaseClient = supabase

        const results = await Promise.all(
          assertionViews.map(async ({ viewName, fieldName }) => {
            const { data, error: fetchError } = await supabaseClient
              .from(viewName)
              .select(fieldName)

            if (fetchError) {
              throw new Error(`${viewName}: ${fetchError.message}`)
            }

            return {
              viewName,
              fieldName,
              rows: ((data ?? []) as unknown) as Array<Record<string, string>>,
            }
          }),
        )

        const seenLines = new Set<string>()
        const combinedLines = [] as string[]

        for (const { viewName, fieldName, rows } of results) {
          for (const row of rows) {
            const value = row[fieldName]
            if (!value) continue
            if (viewName === 'Kinds of Value' && seenLines.has(value)) continue
            combinedLines.push(value)
            seenLines.add(value)
          }
        }

        setStoryLines(combinedLines)
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

  const storyText = storyLines.join('\n\n')

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
