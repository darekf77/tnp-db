//#region @backend
import { ProcessInstance, ProcessMetaInfo } from './entites/process-instance';

export type ProcessBoundAction = (
  process: ProcessInstance
) => Promise<{
  metaInfo: ProcessMetaInfo,
  relation1TO1entityId?: number
}>

//#endregion
