export enum Role {
  User = 'user',
  Assistant = 'assistant',
}

type OpenAImessageItem = {
  role: Role;
  content: string;
};

export interface AddMessageToThreadParams {
  threadId: string;
  message: OpenAImessageItem;
}

export interface RunAssistantParams {
  threadId: string;
  assistantId: string;
}
