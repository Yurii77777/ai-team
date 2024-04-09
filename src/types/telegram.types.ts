import { Role, ToolType } from './ai.types';

export interface CheckAndUpdatePostParams {
  post: string;
  threadId: string;
  assistantId: string;
}

export interface RunAssistantParams {
  threadId: string;
  assistantId: string;
  role: Role;
  message: string;
}

export interface InitializeAssistantParams {
  name: string;
  instructions: string;
  tools: Array<ToolType>;
  model: string;
}
