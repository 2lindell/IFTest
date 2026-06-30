import { create } from 'zustand'
import { Action, Kind, Rulebook, Rule, Relation, WorldObject, WorldState } from '../lib/types'

interface Store extends WorldState {
  addKind: (kind: Kind) => void
  updateKind: (id: string, kind: Partial<Kind>) => void
  deleteKind: (id: string) => void
  addRulebook: (rulebook: Rulebook) => void
  updateRulebook: (id: string, rulebook: Partial<Rulebook>) => void
  deleteRulebook: (id: string) => void
  addRule: (rule: Rule) => void
  updateRule: (id: string, rule: Partial<Rule>) => void
  addObject: (object: WorldObject) => void
  updateObject: (id: string, updates: Partial<WorldObject>) => void
  deleteObject: (id: string) => void
  deleteRule: (id: string) => void
  addRelation: (relation: Relation) => void
  updateRelation: (id: string, relation: Partial<Relation>) => void
  deleteRelation: (id: string) => void
  addAction: (action: Action) => void
  updateAction: (id: string, action: Partial<Action>) => void
  deleteAction: (id: string) => void
  setSelectedKind: (id?: string) => void
  setSelectedRulebook: (id?: string) => void
  setSelectedObject: (id?: string) => void
  setSelectedRule: (id?: string) => void
  setSelectedRelation: (id?: string) => void
  setSelectedAction: (id?: string) => void
  setKinds: (kinds: Kind[]) => void
  setRulebooks: (rulebooks: Rulebook[]) => void
  setObjects: (objects: WorldObject[]) => void
  setRules: (rules: Rule[]) => void
  setRelations: (relations: Relation[]) => void
  setActions: (actions: Action[]) => void
  entities: any[]
  properties: any[]
  variables: any[]
  kindProperties: any[]
  entityProperties: any[]
  setEntities: (entities: any[]) => void
  setProperties: (properties: any[]) => void
  setVariables: (variables: any[]) => void
  setKindProperties: (kps: any[]) => void
  setEntityProperties: (eps: any[]) => void
}

export const useWorldStore = create<Store>((set) => ({
  kinds: [],
  rulebooks: [],
  objects: [],
  rules: [],
  relations: [],
  actions: [],
  entities: [],
  properties: [],
  variables: [],
  kindProperties: [],
  entityProperties: [],
  selectedKindId: undefined,
  selectedRulebookId: undefined,
  selectedObjectId: undefined,
  selectedRuleId: undefined,
  selectedRelationId: undefined,
  selectedActionId: undefined,
  
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
    rules: state.rules.filter((rule) => rule.rulebook_id !== id),
    selectedRulebookId: state.selectedRulebookId === id ? undefined : state.selectedRulebookId,
  })),
  
  addRule: (rule) => set((state) => ({
    rules: [...state.rules, rule],
  })),
  
  updateRule: (id, updates) => set((state) => ({
    rules: state.rules.map((rule) =>
      rule.id === id ? { ...rule, ...updates } : rule
    ),
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
  
  addRelation: (relation) => set((state) => ({
    relations: [...state.relations, relation],
  })),
  
  updateRelation: (id, updates) => set((state) => ({
    relations: state.relations.map((relation) =>
      relation.relation_id === id ? { ...relation, ...updates } : relation
    ),
  })),
  
  deleteRelation: (id) => set((state) => ({
    relations: state.relations.filter((relation) => relation.relation_id !== id),
    selectedRelationId: state.selectedRelationId === id ? undefined : state.selectedRelationId,
  })),
  addAction: (action) => set((state) => ({
    actions: [...state.actions, action],
  })),
  updateAction: (id, updates) => set((state) => ({
    actions: state.actions.map((action) =>
      action.action_id === id ? { ...action, ...updates } : action
    ),
  })),
  deleteAction: (id) => set((state) => ({
    actions: state.actions.filter((action) => action.action_id !== id),
    selectedActionId: state.selectedActionId === id ? undefined : state.selectedActionId,
  })),
  setSelectedKind: (id) => set({ selectedKindId: id, selectedRulebookId: undefined, selectedRelationId: undefined, selectedActionId: undefined }),
  setSelectedRulebook: (id) => set({ selectedRulebookId: id, selectedKindId: undefined, selectedRelationId: undefined, selectedActionId: undefined }),
  setSelectedObject: (id) => set({ selectedObjectId: id }),
  setSelectedRule: (id) => set({ selectedRuleId: id }),
  setSelectedRelation: (id) => set({ selectedRelationId: id, selectedKindId: undefined, selectedRulebookId: undefined, selectedActionId: undefined }),
  setSelectedAction: (id) => set({ selectedActionId: id, selectedKindId: undefined, selectedRulebookId: undefined, selectedRelationId: undefined }),
  setKinds: (kinds) => set({ kinds }),
  setRulebooks: (rulebooks) => set({ rulebooks }),
  setEntities: (entities) => set({ entities }),
  setProperties: (properties) => set({ properties }),
  setVariables: (variables) => set({ variables }),
  setKindProperties: (kps) => set({ kindProperties: kps }),
  setEntityProperties: (eps) => set({ entityProperties: eps }),
  setObjects: (objects) => set({ objects }),
  setRules: (rules) => set({ rules }),
  setRelations: (relations) => set({ relations }),
  setActions: (actions) => set({ actions }),
}))
