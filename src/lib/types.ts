export interface Kind {
  kind_id: string
  kind_name: string
  parent_kind_id?: string
  parent_kind_name?: string
  source?: string
  kind_properties: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface Rulebook {
  rulebook_id: string
  rulebook_name: string
  rulebook_basis: string
  rulebook_result_kind: string
  rulebook_basis_name?: string
  rulebook_result_kind_name?: string
  rulebook_named_outcomes_success?: string
  rulebook_named_outcomes_failure?: string
  createdAt?: string
  updatedAt?: string
}

export interface WorldObject {
  id: string
  name: string
  description: string
  parentId?: string
  type: string
  properties: Record<string, unknown>
}

export interface Entity {
  entity_id: string
  entity_name: string
  entity_of_kind_id: string
  entity_of_kind_name?: string
}

export interface Rule {
  id: string
  name: string
  description: string
  rulebook_id?: string
}

export interface Action {
  action_id: string
  action_name: string
  action_direct_kind?: string
  action_indirect_kind?: string
  action_direct_kind_name?: string
  action_indirect_kind_name?: string
  action_out_of_world?: boolean
  action_commands?: string[]
  action_variables?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface Relation {
  relation_id: string
  relation_name: string
  relation_verb: string[]
  relation_reversed_verb?: string[]
  relation_relates_kind: string
  relation_relates_to_kind: string
  relation_relates_kind_name?: string
  relation_relates_to_kind_name?: string
  relation_type?: string
  createdAt?: string
  updatedAt?: string
}

export interface WorldState {
  kinds: Kind[]
  rulebooks: Rulebook[]
  objects: WorldObject[]
  rules: Rule[]
  relations: Relation[]
  actions: Action[]
  selectedKindId?: string
  selectedRulebookId?: string
  selectedObjectId?: string
  selectedEntityId?: string
  selectedRuleId?: string
  selectedRelationId?: string
  selectedActionId?: string
}
