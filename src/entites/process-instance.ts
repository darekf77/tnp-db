//#region @backend
import * as _ from 'lodash';
import { DBBaseEntity } from './base-entity';
import { CLASS } from 'typescript-class-helpers';

export type ProcessMetaInfo = {
  className: string;
  entityId: string;
  entityProperty: string;
  cmd?: string;
  cwd?: string;
  pid?: number;
}

@CLASS.NAME('ProcessInstance')
export class ProcessInstance extends DBBaseEntity {
  isEqual(anotherInstace: ProcessInstance): boolean {
    return (
      this.className === anotherInstace.className &&
      this.entityId === anotherInstace.entityId &&
      this.entityProperty === anotherInstace.entityProperty
    )
  }

  // pid: number;
  // cmd: string;
  // cwd: string;
  // name: string;
  relation1TO1entityId: number;
  className?: string;
  entityId?: string;
  entityProperty?: string;

  setInfo(metaInfo: ProcessMetaInfo) {
    const { className, entityId, entityProperty } = metaInfo;
    this.className = className;
    this.entityId = entityId;
    this.entityProperty = entityProperty;
  }

  get info(): ProcessMetaInfo {

    return {
      className: this.className,
      entityId: this.entityId,
      entityProperty: this.entityProperty,
    };
  }

}
//#endregion
