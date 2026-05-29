import { create } from 'zustand'
import { Kind, Rulebook, Rule, WorldObject, WorldState } from '../lib/types'

interface Store extends WorldState {
  addKind: (kind: Kind) => void
  updateKind: (id: string, kind: Partial<Kind>) => void
  deleteKind: (id: string) => void
  addRulebook: (rulebook: Rulebook) => void
  updateRulebook: (id: string, rulebook: Partial<Rulebook>) => void
  deleteRulebook: (id: string) => void
  addObject: (object: WorldObject) => void
  updateObject: (id: string, updates: Partial<WorldObject>) => void
  deleteObject: (id: string) => void
  deleteRule: (id: string) => void
  setSelectedKind: (id?: string) => void
  setSelectedRulebook: (id?: string) => void
  setSelectedObject: (id?: string) => void
  setSelectedRule: (id?: string) => void
  setKinds: (kinds: Kind[]) => void
  setRulebooks: (rulebooks: Rulebook[]) => void
  setObjects: (objects: WorldObject[]) => void
  setRules: (rules: Rule[]) => void
}

export const useWorldStore = create<Store>((set) => ({
  kinds: [],
  rulebooks: [],
  objects: [],
  rules: [],
  selectedKindId: undefined,
  selectedRulebookId: undefined,
  selectedObjectId: undefined,
  selectedRuleId: undefined,
  
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
  
  addObject: (object) => set((state) => ({
    objects: [...state.objects, object],
  })),
  
  updateObject: (id, updates) => set((state) => ({
    objects: state.objects.map((object) =>
      object.id === id ? { ...object, ...updates } : object
    ),
  })),
  
  deleteObject: (id) => set((state) => ({
    objects: state.objects.filter((object) => object.id !== id),
    selectedObjectId: state.selectedObjectId === id ? undefined : state.selectedObjectId,
  })),
  
  deleteRule: (id) => set((state) => ({
    rules: state.rules.filter((rule) => rule.id !== id),
    selectedRuleId: state.selectedRuleId === id ? undefined : state.selectedRuleId,
  })),
  
  setSelectedKind: (id) => set({ selectedKindId: id, selectedRulebookId: undefined }),
  setSelectedRulebook: (id) => set({ selectedRulebookId: id, selectedKindId: undefined }),
  setSelectedObject: (id) => set({ selectedObjectId: id }),
  setSelectedRule: (id) => set({ selectedRuleId: id }),
  setKinds: (kinds) => set({ kinds }),
  setRulebooks: (rulebooks) => set({ rulebooks }),
  setObjects: (objects) => set({ objects }),
  setRules: (rules) => set({ rules }),
}))
