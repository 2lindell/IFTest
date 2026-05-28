import { create } from 'zustand'
import { Kind, Rulebook, WorldState } from '../lib/types'

interface Store extends WorldState {
  addKind: (kind: Kind) => void
  updateKind: (id: string, kind: Partial<Kind>) => void
  deleteKind: (id: string) => void
  addRulebook: (rulebook: Rulebook) => void
  updateRulebook: (id: string, rulebook: Partial<Rulebook>) => void
  deleteRulebook: (id: string) => void
  setSelectedKind: (id?: string) => void
  setSelectedRulebook: (id?: string) => void
  setKinds: (kinds: Kind[]) => void
  setRulebooks: (rulebooks: Rulebook[]) => void
}

export const useWorldStore = create<Store>((set) => ({
  kinds: [],
  rulebooks: [],
  selectedKindId: undefined,
  selectedRulebookId: undefined,
  
  addKind: (kind) => set((state) => ({
    kinds: [...state.kinds, kind],
  })),
  
  updateKind: (id, updates) => set((state) => ({
    kinds: state.kinds.map((kind) =>
      kind.kind_id === id ? { ...kind, ...updates } : kind
    ),
  })),
  
  deleteKind: (id) => set((state) => ({
    kinds: state.kinds.filter((kind) => kind.kind_id !== id),
    selectedKindId: state.selectedKindId === id ? undefined : state.selectedKindId,
  })),
  
  addRulebook: (rulebook) => set((state) => ({
    rulebooks: [...state.rulebooks, rulebook],
  })),
  
  updateRulebook: (id, updates) => set((state) => ({
    rulebooks: state.rulebooks.map((rulebook) =>
      rulebook.rulebook_id === id ? { ...rulebook, ...updates } : rulebook
    ),
  })),
  
  deleteRulebook: (id) => set((state) => ({
    rulebooks: state.rulebooks.filter((rulebook) => rulebook.rulebook_id !== id),
    selectedRulebookId: state.selectedRulebookId === id ? undefined : state.selectedRulebookId,
  })),
  
  setSelectedKind: (id) => set({ selectedKindId: id, selectedRulebookId: undefined }),
  setSelectedRulebook: (id) => set({ selectedRulebookId: id, selectedKindId: undefined }),
  setKinds: (kinds) => set({ kinds }),
  setRulebooks: (rulebooks) => set({ rulebooks }),
}))
