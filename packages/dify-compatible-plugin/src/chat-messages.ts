import type { PluginDefinition, RegistApi, Request } from '@ace-fetch/core';

export interface DifyStreamReadOptions {}

export type CitationItem = {
  content: string;
  data_source_type: string;
  dataset_name: string;
  dataset_id: string;
  document_id: string;
  document_name: string;
  hit_count: number;
  index_node_hash: string;
  segment_id: string;
  segment_position: number;
  score: number;
  word_count: number;
};

export type MessageEnd = {
  id: string;
  metadata: {
    retriever_resources?: CitationItem[];
    annotation_reply: {
      id: string;
      account: {
        id: string;
        name: string;
      };
    };
  };
};

export type MessageReplace = {
  id: string;
  task_id: string;
  answer: string;
  conversation_id: string;
};

export type AnnotationReply = {
  id: string;
  task_id: string;
  answer: string;
  conversation_id: string;
  annotation_id: string;
  annotation_author_name: string;
};

export enum TransferMethod {
  all = 'all',
  local_file = 'local_file',
  remote_url = 'remote_url',
}

export type VisionFile = {
  id?: string;
  type: string;
  transfer_method: TransferMethod;
  url: string;
  upload_file_id: string;
  belongs_to?: string;
};

export type ThoughtItem = {
  id: string;
  tool: string; // plugin or dataset. May has multi.
  thought: string;
  tool_input: string;
  message_id: string;
  observation: string;
  position: number;
  files?: string[];
  message_files?: VisionFile[];
};

export type WorkflowStartedResponse = {
  task_id: string;
  workflow_run_id: string;
  event: string;
  data: {
    id: string;
    workflow_id: string;
    sequence_number: number;
    created_at: number;
  };
};

export type WorkflowFinishedResponse = {
  task_id: string;
  workflow_run_id: string;
  event: string;
  data: {
    id: string;
    workflow_id: string;
    status: string;
    outputs: any;
    error: string;
    elapsed_time: number;
    total_tokens: number;
    total_steps: number;
    created_at: number;
    finished_at: number;
  };
};

export type NodeStartedResponse = {
  task_id: string;
  workflow_run_id: string;
  event: string;
  data: {
    id: string;
    node_id: string;
    node_type: string;
    index: number;
    predecessor_node_id?: string;
    inputs: any;
    created_at: number;
    extras?: any;
  };
};

export type NodeFinishedResponse = {
  task_id: string;
  workflow_run_id: string;
  event: string;
  data: {
    id: string;
    node_id: string;
    node_type: string;
    index: number;
    predecessor_node_id?: string;
    inputs: any;
    process_data: any;
    outputs: any;
    status: string;
    error: string;
    elapsed_time: number;
    execution_metadata: {
      total_tokens: number;
      total_price: number;
      currency: string;
    };
    created_at: number;
  };
};

export type IOnDataMoreInfo = {
  conversationId?: string;
  taskId?: string;
  messageId: string;
  errorMessage?: string;
  errorCode?: string;
};

export type IOnData = (message: string, isFirstMessage: boolean, moreInfo: IOnDataMoreInfo) => void;
export type IOnThought = (though: ThoughtItem) => void;
export type IOnFile = (file: VisionFile) => void;
export type IOnMessageEnd = (messageEnd: MessageEnd) => void;
export type IOnMessageReplace = (messageReplace: MessageReplace) => void;
export type IOnAnnotationReply = (messageReplace: AnnotationReply) => void;
export type IOnCompleted = (hasError?: boolean) => void;
export type IOnError = (msg: string, code?: string) => void;
export type IOnWorkflowStarted = (workflowStarted: WorkflowStartedResponse) => void;
export type IOnWorkflowFinished = (workflowFinished: WorkflowFinishedResponse) => void;
export type IOnNodeStarted = (nodeStarted: NodeStartedResponse) => void;
export type IOnNodeFinished = (nodeFinished: NodeFinishedResponse) => void;

function unicodeToChar(text: string) {
  return text.replace(/\\u[0-9a-f]{4}/g, (_match, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  });
}

function handleStream<R = any>(
  stream: ReadableStream<R>,
  onData: IOnData,
  onCompleted?: IOnCompleted,
  onThought?: IOnThought,
  onMessageEnd?: IOnMessageEnd,
  onMessageReplace?: IOnMessageReplace,
  onFile?: IOnFile,
  onWorkflowStarted?: IOnWorkflowStarted,
  onWorkflowFinished?: IOnWorkflowFinished,
  onNodeStarted?: IOnNodeStarted,
  onNodeFinished?: IOnNodeFinished,
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let bufferObj: Record<string, any>;
  let isFirstMessage = true;
  function read() {
    let hasError = false;
    reader.read().then((result: any) => {
      if (result.done) {
        onCompleted && onCompleted();
        return;
      }
      buffer += decoder.decode(result.value, { stream: true });
      const lines = buffer.split('\n');
      try {
        lines.forEach((message) => {
          if (message.startsWith('data: ')) {
            // check if it starts with data:
            try {
              bufferObj = JSON.parse(message.substring(6)) as Record<string, any>; // remove data: and parse as json
            } catch (e) {
              // mute handle message cut off
              onData('', isFirstMessage, {
                conversationId: bufferObj?.conversation_id,
                messageId: bufferObj?.message_id,
              });
              return;
            }
            if (bufferObj.status === 400 || !bufferObj.event) {
              onData('', false, {
                conversationId: undefined,
                messageId: '',
                errorMessage: bufferObj?.message,
                errorCode: bufferObj?.code,
              });
              hasError = true;
              onCompleted?.(true);
              return;
            }
            if (bufferObj.event === 'message' || bufferObj.event === 'agent_message') {
              // can not use format here. Because message is splited.
              onData(unicodeToChar(bufferObj.answer), isFirstMessage, {
                conversationId: bufferObj.conversation_id,
                taskId: bufferObj.task_id,
                messageId: bufferObj.id,
              });
              isFirstMessage = false;
            } else if (bufferObj.event === 'agent_thought') {
              onThought?.(bufferObj as ThoughtItem);
            } else if (bufferObj.event === 'message_file') {
              onFile?.(bufferObj as VisionFile);
            } else if (bufferObj.event === 'message_end') {
              onMessageEnd?.(bufferObj as MessageEnd);
            } else if (bufferObj.event === 'message_replace') {
              onMessageReplace?.(bufferObj as MessageReplace);
            } else if (bufferObj.event === 'workflow_started') {
              onWorkflowStarted?.(bufferObj as WorkflowStartedResponse);
            } else if (bufferObj.event === 'workflow_finished') {
              onWorkflowFinished?.(bufferObj as WorkflowFinishedResponse);
            } else if (bufferObj.event === 'node_started') {
              onNodeStarted?.(bufferObj as NodeStartedResponse);
            } else if (bufferObj.event === 'node_finished') {
              onNodeFinished?.(bufferObj as NodeFinishedResponse);
            }
          }
        });
        buffer = lines[lines.length - 1];
      } catch (e) {
        onData('', false, {
          conversationId: undefined,
          messageId: '',
          errorMessage: `${e}`,
        });
        hasError = true;
        onCompleted?.(true);
        return;
      }
      if (!hasError) read();
    });
  }
  read();
}

/**
 * regist dify stream read plugin on current promise request
 * @param request request promise
 * @param options dify stream read options
 */
export function registDifyStreamRead(request: Request, options: DifyStreamReadOptions = {}): Request {
  return (config) => {
    const {
      onData,
      onCompleted,
      onThought,
      onFile,
      onMessageEnd,
      onMessageReplace,
      onWorkflowStarted,
      onWorkflowFinished,
      onNodeStarted,
      onNodeFinished,
      ...rest
    } = config || {};
    return request(rest).then(async (response) => {
      if (response.status === 200 && onData && response.data && response.data instanceof ReadableStream) {
        handleStream(
          response.data,
          onData,
          onCompleted,
          onThought,
          onMessageEnd,
          onMessageReplace,
          onFile,
          onWorkflowStarted,
          onWorkflowFinished,
          onNodeStarted,
          onNodeFinished,
        );
      }
      return response;
    });
  };
}

/**
 * 注册Dify消息流处理插件
 * 只在regist apis上运行 (and 自定义条件下)
 * @param options 插件配置
 */
export const createDifyStreamReadPlugin: PluginDefinition<DifyStreamReadOptions> =
  (options = {}) =>
  ({ registApis }) => {
    return Object.keys(registApis).reduce((prev, key) => {
      prev[key] = registDifyStreamRead(registApis[key], options);
      return prev;
    }, {} as RegistApi);
  };

declare module '@ace-fetch/core' {
  export interface RequestCustomConfig {
    onData?: IOnData;
    onCompleted?: IOnCompleted;
    onThought?: IOnThought;
    onMessageEnd?: IOnMessageEnd;
    onMessageReplace?: IOnMessageReplace;
    onFile?: IOnFile;
    onWorkflowStarted?: IOnWorkflowStarted;
    onWorkflowFinished?: IOnWorkflowFinished;
    onNodeStarted?: IOnNodeStarted;
    onNodeFinished?: IOnNodeFinished;
  }
}
