//#region imports
//#region isomorphic
import { _ } from 'tnp-core';
import { Models, BaseController } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';
import { Helpers } from 'tnp-helpers';
import { DbCrud } from 'firedev-crud';
//#endregion
import { ProcessInstance, IProcessInstanceInfo } from '../entites';
//#endregion

@CLASS.NAME('ProcessController')
export class ProcessController extends BaseController<DbCrud> {

  //#region add existed
  async addExisted() {
    //#region @backend
    Helpers.log(`[db][reinit] adding existed processes`);
    // const ps: PsListInfo[] = await psList();
    // // console.log(ps.filter(p => p.cmd?.split(' ').filter(p => p.endsWith(`/bin/tnp`)).length > 0));
    // const proceses = ps
    //   .filter(p => {
    //     return !!p.cmd.split(' ').find(p => p.endsWith(`/bin/tnp`))
    //   })
    //   .map(p => {
    //     const proc = new ProcessInstance();
    //     proc.pid = p.pid;
    //     proc.cmd = p.cmd;
    //     proc.name = p.name;
    //     return proc;
    //   })

    this.crud.setBulk([], ProcessInstance);
    //#endregion
  }
  //#endregion

  //#region update
  async update() {
    //#region @backend
    // const ps: PsListInfo[] = await psList();
    // const all = this.crud.getAll<ProcessInstance>(ProcessInstance);
    // // console.log('[UPDATE BUILDS] BEFORE FILTER', all.map(c => c.pid))
    // const filteredBuilds = all.filter(b => {
    //   if(_.isNumber(b.relation1TO1entityId)) {
    //     return true;
    //   }
    //   if (ps.filter(p => p.pid == b.pid).length > 0) {
    //     return true;
    //   }
    //   return false;
    // })
    // // console.log('[UPDATE BUILDS] AFTER FILTER', filteredBuilds.map(c => c.pid))
    // // process.exit(0)
    // this.crud.setBulk(filteredBuilds, ProcessInstance);
    //#endregion
  }
  //#endregion

  //#region find process by info
  async findProcessByInfo(metaInfo: IProcessInstanceInfo) {
    //#region @backendFunc
    const { className, entityId, entityProperty } = metaInfo; // @ts-ignore
    const proceses = await this.crud.getAll<ProcessInstance>(ProcessInstance);
    let existed: ProcessInstance;
    existed = proceses.find((p) => {
      return (
        p.info &&
        p.info.className === className &&
        p.info.entityId === entityId &&
        p.info.entityProperty === entityProperty
      );
    });
    return existed;
    //#endregion
  }
  //#endregion

  //#region bound process
  async boundProcess(
    metaInfo: IProcessInstanceInfo,
    relation1TO1entityId?: number
  )
    : Promise<ProcessInstance> {
    //#region @backendFunc
    let existed: ProcessInstance;
    let saveToDB = true;

    if (!existed) {
      existed = await this.findProcessByInfo(metaInfo);
      if (existed && !_.isNumber(relation1TO1entityId)) {
        saveToDB = false;
      }
    }

    if (!existed) {
      existed = ProcessInstance.from();
      saveToDB = true;
    }

    existed.setInfo(metaInfo);
    if (_.isNumber(relation1TO1entityId)) {
      existed.relation1TO1entityId = relation1TO1entityId;
    }


    // existed.cwd = metaInfo.cwd;
    // existed.cmd = metaInfo.cmd;
    // existed.pid = metaInfo.pid;

    if (saveToDB) { // @ts-ignore
      await this.crud.set(existed);
    }
    return existed;
    //#endregion
  }
  //#endregion


}

