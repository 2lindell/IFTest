export interface Kind {
  kind_id: string
  kind_name: string
  parent_kind_id?: string
  kind_properties: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface Rulebook {
  rulebook_id: string
  rulebook_name: string
  rulebook_basis: string
  rulebook_result_kind: string
  rulebook_named_outcomes_success?: string
  rulebook_named_outcomes_failure?: string
  createdAt?: string
  updatedAt?: string
}

export interface WorldState {
  kinds: Kind[]
  rulebooks: Rulebook[]
  selectedKindId?: string
  selectedRulebookId?: string
}
