export interface WorldObject {
  id: string
  name: string
  description: string
  type: 'object' | 'location' | 'character' | 'rule'
  properties: Record<string, unknown>
  parentId?: string
  createdAt: string
  updatedAt: string
}

export interface Rule {
  id: string
  name: string
  condition: string
  action: string
  description: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface WorldState {
  objects: WorldObject[]
  rules: Rule[]
  selectedObjectId?: string
  selectedRuleId?: string
}
