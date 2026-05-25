import { create } from 'zustand'
import { WorldObject, Rule, WorldState } from '../lib/types'

interface Store extends WorldState {
  addObject: (object: WorldObject) => void
  updateObject: (id: string, object: Partial<WorldObject>) => void
  deleteObject: (id: string) => void
  addRule: (rule: Rule) => void
  updateRule: (id: string, rule: Partial<Rule>) => void
  deleteRule: (id: string) => void
  setSelectedObject: (id?: string) => void
  setSelectedRule: (id?: string) => void
  setObjects: (objects: WorldObject[]) => void
  setRules: (rules: Rule[]) => void
}

export const useWorldStore = create<Store>((set) => ({
  objects: [],
  rules: [],
  selectedObjectId: undefined,
  selectedRuleId: undefined,
  
  addObject: (object) => set((state) => ({
    objects: [...state.objects, object],
  })),
  
  updateObject: (id, updates) => set((state) => ({
    objects: state.objects.map((obj) =>
      obj.id === id ? { ...obj, ...updates } : obj
    ),
  })),
  
  deleteObject: (id) => set((state) => ({
    objects: state.objects.filter((obj) => obj.id !== id),
    selectedObjectId: state.selectedObjectId === id ? undefined : state.selectedObjectId,
  })),
  
  addRule: (rule) => set((state) => ({
    rules: [...state.rules, rule],
  })),
  
  updateRule: (id, updates) => set((state) => ({
    rules: state.rules.map((rule) =>
      rule.id === id ? { ...rule, ...updates } : rule
    ),
  })),
  
  deleteRule: (id) => set((state) => ({
    rules: state.rules.filter((rule) => rule.id !== id),
    selectedRuleId: state.selectedRuleId === id ? undefined : state.selectedRuleId,
  })),
  
  setSelectedObject: (id) => set({ selectedObjectId: id }),
  setSelectedRule: (id) => set({ selectedRuleId: id }),
  setObjects: (objects) => set({ objects }),
  setRules: (rules) => set({ rules }),
}))
