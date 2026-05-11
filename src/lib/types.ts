export const nodeTypes = ["root", "topic", "people_group", "person", "place", "event", "source", "claim", "question", "timeline", "concept"] as const;
export const nodeStatuses = ["unchecked", "researching", "verified", "disputed", "archived"] as const;
export const relationshipTypes = [
  "related_to",
  "descended_from",
  "influenced_by",
  "genealogy",
  "legal_tradition",
  "political_succession",
  "theological_dispute",
  "empire_state_formation",
  "conversion",
  "reform_standardization",
  "located_in",
  "source_for",
  "contradicts",
  "caused",
  "part_of",
  "connected_to",
  "migrated_to",
  "allied_with",
  "enemy_of",
  "same_as_question"
] as const;
export const sourceTypes = ["academic", "government", "encyclopedia", "book", "article", "news", "forum", "archive", "primary_text", "unknown"] as const;
export const reliabilityLevels = ["primary", "strong", "moderate", "weak", "unknown"] as const;
export const claimStates = ["unchecked", "partially_supported", "strongly_supported", "disputed", "rejected"] as const;
export const researchCategories = [
  "Person",
  "Place",
  "Event",
  "Concept",
  "Legal tradition",
  "Empire/state",
  "Text/scripture",
  "Scripture/Text",
  "Religious movement",
  "Legal/doctrinal teaching",
  "Controversy",
  "User question"
] as const;

export type ResearchNodeType = (typeof nodeTypes)[number];
export type ResearchStatus = (typeof nodeStatuses)[number];
export type RelationshipType = (typeof relationshipTypes)[number];
export type SourceType = (typeof sourceTypes)[number];
export type ReliabilityLevel = (typeof reliabilityLevels)[number];
export type ClaimState = (typeof claimStates)[number];
export type ResearchCategory = (typeof researchCategories)[number];

export const typeHelp: Record<ResearchNodeType, string> = {
  root: "central subject of a Tree",
  topic: "general branch/topic",
  people_group: "ethnic group, tribe, civilization, dynasty, collective",
  person: "individual",
  place: "geographic location",
  event: "historical/current event",
  source: "research source",
  claim: "statement needing evidence",
  question: "unresolved research question",
  timeline: "chronological chain",
  concept: "abstract idea/category"
};

export const statusHelp: Record<ResearchStatus, string> = {
  unchecked: "added but unresearched",
  researching: "actively investigating",
  verified: "supported by strong evidence",
  disputed: "conflicting evidence",
  archived: "stored but inactive"
};

export interface ResearchNode {
  id: string;
  title: string;
  type: ResearchNodeType;
  treeId?: string;
  clusterId?: string;
  parentId?: string;
  category?: ResearchCategory;
  importance?: "root" | "major" | "detail";
  level?: number;
  fixedPosition?: boolean;
  layoutHint?: "root" | "branch" | "leaf" | "bridge";
  dateRange?: string;
  shortSummary?: string;
  detailedSummary?: string;
  relatedQuestions?: string[];
  relatedAnswers?: string[];
  connections?: Array<{
    targetId: string;
    relationship: string;
    explanation: string;
  }>;
  status: ResearchStatus;
  x: number;
  y: number;
  notePath: string;
  tags: string[];
  claims?: ResearchClaim[];
}

export interface ResearchEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: RelationshipType;
  notes?: string;
}

export interface ResearchBridgeEdge {
  id: string;
  sourceTreeId: string;
  sourceNodeId: string;
  targetTreeId: string;
  targetNodeId: string;
  label: string;
  type: RelationshipType | "cross_tree";
  notes?: string;
}

export interface ResearchTreeMetadata {
  id: string;
  title: string;
  themeColor: "teal" | "green" | "purple" | "gold" | "rose" | "blue";
  rootNodeId: string;
  preferredPosition: { x: number; y: number };
  layoutRadius: number;
  branchSpacing: number;
  description: string;
}

export interface ResearchSource {
  id: string;
  title: string;
  sourceKind?: "url" | "file";
  url?: string;
  originalFilename?: string;
  storedFilePath?: string;
  mimeType?: string;
  uploadedAt?: string;
  authorPublisher?: string;
  accessDate?: string;
  type: SourceType;
  reliability: ReliabilityLevel;
  note?: string;
}

export interface ResearchClaim {
  id: string;
  text: string;
  state: ClaimState;
  evidence: string;
  sourceIds: string[];
  confidence: ReliabilityLevel;
  disputeNotes: string;
}

export interface ResearchTree {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodes: ResearchNode[];
  edges: ResearchEdge[];
  metadata?: ResearchTreeMetadata;
  bridgeEdges?: ResearchBridgeEdge[];
  qas?: ResearchQa[];
}

export interface ResearchQa {
  id: string;
  question: string;
  answer: string;
  linkedNodeIds: string[];
  dateAdded: string;
}

export interface LoadedTree {
  tree: ResearchTree;
  notes: Record<string, string>;
  sources: ResearchSource[];
}

export interface InboxItem {
  id: string;
  title: string;
  body: string;
  url?: string;
  status: "open" | "attached" | "archived";
  createdAt: string;
  treeId?: string;
}

export interface ParsedNote {
  title: string;
  summary: string;
  notes: string;
  relatedQuestions: string[];
  assistantAnswerSummary: string;
  connections: string[];
  sources: string[];
  openQuestions: string[];
  claims: string[];
}
