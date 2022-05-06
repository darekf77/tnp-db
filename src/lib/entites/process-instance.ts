//#region imports
import { _ } from 'tnp-core';
import { Models, DBBaseEntity } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';
//#endregion

export type IProcessInstanceInfo = Pick<ProcessInstance, 'className' | 'entityId' | 'entityProperty'>;

@CLASS.NAME('ProcessInstance') // @ts-ignore
export class ProcessInstance extends DBBaseEntity<ProcessInstance> {
  //#region static methods

  //#region static methods / from
  public static from(data?: IProcessInstanceInfo) {
    return new ProcessInstance(data || {});
  }
  //#endregion

  //#endregion

  //#region fields & getters
  relation1TO1entityId: number;
  className?: string;
  entityId?: string;
  entityProperty?: string;
  cmd?: string;
  cwd?: string;
  pid?: number;
  get info(): IProcessInstanceInfo {
    return {
      className: this.className,
      entityId: this.entityId,
      entityProperty: this.entityProperty,
    };
  }
  //#endregion

  //#region api

  //#region api / prepare instance
  async prepareInstance() {
    this.assignProps();
    return this;
  }
  //#endregion

  //#region api / get raw data
  async getRawData(): Promise<object> {
    return {
      relation1TO1entityId: this.relation1TO1entityId,
      className: this.className,
      entityId: this.entityId,
      entityProperty: this.entityProperty,
      cmd: this.cmd,
      pid: this.pid,
    } as Pick<ProcessInstance,
      'relation1TO1entityId' |
      'className' |
      'entityId' |
      'entityProperty' |
      'cmd' |
      'cwd' |
      'pid'
    >;
  }
  //#endregion

  //#region api / assign props
  assignProps(): void {
    //#region @backend
    Object.assign(this, this.data);
    //#endregion
  }
  //#endregion

  //#region api / is eqal
  isEqual(anotherInstace: ProcessInstance): boolean {
    return (
      this.className === anotherInstace.className &&
      this.entityId === anotherInstace.entityId &&
      this.entityProperty === anotherInstace.entityProperty
    );
  }
  //#endregion

  //#region api / set info
  setInfo(metaInfo: IProcessInstanceInfo) {
    const { className, entityId, entityProperty } = metaInfo;
    this.className = className;
    this.entityId = entityId;
    this.entityProperty = entityProperty;
  }
  //#endregion

  //#endregion
}
