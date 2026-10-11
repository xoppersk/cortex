import adminJson from "../../data/admin.json";
import conversationsJson from "../../data/conversations.json";
import evaluationsJson from "../../data/evaluations.json";
import knowledgeJson from "../../data/knowledge.json";
import membersJson from "../../data/members.json";
import playbooksJson from "../../data/playbooks.json";
import statesJson from "../../data/states.json";
import templatesJson from "../../data/templates.json";
import threadJson from "../../data/thread.json";
import usageJson from "../../data/usage.json";
import workspaceJson from "../../data/workspace.json";
import type {
  AdminData,
  ConversationsData,
  EvaluationsData,
  KnowledgeData,
  MembersData,
  PlaybooksData,
  StatesData,
  TemplatesData,
  ThreadData,
  UsageData,
  WorkspaceData,
} from "./types";

const workspaceData = workspaceJson as unknown as WorkspaceData;
const membersData = membersJson as unknown as MembersData;
const conversationsData = conversationsJson as unknown as ConversationsData;
const threadData = threadJson as unknown as ThreadData;
const playbooksData = playbooksJson as unknown as PlaybooksData;
const knowledgeData = knowledgeJson as unknown as KnowledgeData;
const usageData = usageJson as unknown as UsageData;
const evaluationsData = evaluationsJson as unknown as EvaluationsData;
const templatesData = templatesJson as unknown as TemplatesData;
const statesData = statesJson as unknown as StatesData;

export function getWorkspaceData(): WorkspaceData {
  return workspaceData;
}

export function getMembers(): MembersData {
  return membersData;
}

export function getConversations(): ConversationsData {
  return conversationsData;
}

export function getConversation(id: string) {
  return conversationsData.conversations.find((conversation) => conversation.id === id);
}

export function getThread(): ThreadData {
  return threadData;
}

export function getPlaybooks(): PlaybooksData {
  return playbooksData;
}

export function getPlaybook(id: string) {
  if (id === playbooksData.featured.id) return playbooksData.featured;
  return [...playbooksData.team, ...playbooksData.private, ...playbooksData.archived].find(
    (playbook) => playbook.id === id,
  );
}

export function getKnowledge(): KnowledgeData {
  return knowledgeData;
}

export function getCollection(id: string) {
  return knowledgeData.collections.find((collection) => collection.id === id);
}

export function getDocument(id: string) {
  return knowledgeData.documents.find((document) => document.id === id);
}

export function getUsage(): UsageData {
  return usageData;
}

export function getEvaluations(): EvaluationsData {
  return evaluationsData;
}

export function getTemplates(): TemplatesData {
  return templatesData;
}

export function getStates(): StatesData {
  return statesData;
}

export function getAdminData(): AdminData {
  return adminJson as AdminData;
}

export const fixtureTotals = {
  spendByModel: usageData.byModel.reduce((total, row) => total + row.amount, 0),
  spendByPerson: usageData.byPerson.reduce((total, row) => total + row.amount, 0),
  spendByProject: usageData.byProject.reduce((total, row) => total + row.amount, 0),
  documents: knowledgeData.collections.reduce((total, row) => total + row.documents, 0),
  passages: knowledgeData.collections.reduce((total, row) => total + row.passages, 0),
  conversations: conversationsData.conversations.length,
  conversationsByProject: conversationsData.projects.map((project) => ({
    name: project.name,
    declared: project.count,
    actual: conversationsData.conversations.filter((item) => item.project === project.name).length,
  })),
};
