import { ProcessInstance, IProcessInstanceInfo } from './entites/process-instance';

export type ProcessBoundAction = (
  process: ProcessInstance
) => Promise<{
  metaInfo: IProcessInstanceInfo,
  relation1TO1entityId?: number
}>;
