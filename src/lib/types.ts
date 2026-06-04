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

export interface Rule {
  id: string
  name: string
  description: string
}

export interface WorldState {
  kinds: Kind[]
  rulebooks: Rulebook[]
  objects: WorldObject[]
  rules: Rule[]
  selectedKindId?: string
  selectedRulebookId?: string
  selectedObjectId?: string
  selectedRuleId?: string
}
