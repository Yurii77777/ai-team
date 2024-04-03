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

export interface InitializeAssistantParams {
  name: string;
  instructions: string;
  tools: Array<ToolType>;
  model: string;
}

export enum Tool {
  CODE_INTERPRETER = 'code_interpreter',
}

type ToolType = {
  type: Tool;
};
