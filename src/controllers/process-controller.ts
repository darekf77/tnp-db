//#region @backend
import * as _ from 'lodash';
import * as  psList from 'ps-list';

import { BaseController } from './base-controlller';
import { ProcessInstance, ProcessMetaInfo } from '../entites';
import { Models } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';

@CLASS.NAME('ProcessController')
export class ProcessController extends BaseController {

  async addExisted() {
    // const ps: PsListInfo[] = await psList();
    // // console.log(ps.filter(p => p.cmd.split(' ').filter(p => p.endsWith(`/bin/tnp`)).length > 0));
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
  }

  resetProcessess() {
    this.crud.setBulk([], ProcessInstance);
  }

  async update() {
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
  }


  findProcessByInfo(metaInfo: ProcessMetaInfo) {
    const { className, entityId, entityProperty } = metaInfo;
    const proceses = this.crud.getAll<ProcessInstance>(ProcessInstance);
    let existed: ProcessInstance;
    existed = proceses.find((p) => {
      return (
        p.info &&
        p.info.className === className &&
        p.info.entityId === entityId &&
        p.info.entityProperty === entityProperty
      )
    })
    return existed;
  }

  boundProcess(metaInfo: ProcessMetaInfo, relation1TO1entityId?: number): ProcessInstance {
    let existed: ProcessInstance;
    let saveToDB = true;

    if (!existed) {
      existed = this.findProcessByInfo(metaInfo)
      if(existed && !_.isNumber(relation1TO1entityId)) {
        saveToDB = false;
      }
    }

    if (!existed) {
      existed = new ProcessInstance()
      saveToDB = true;
    }

    existed.setInfo(metaInfo);
    if(_.isNumber(relation1TO1entityId)) {
      existed.relation1TO1entityId = relation1TO1entityId;
    }


    // existed.cwd = metaInfo.cwd;
    // existed.cmd = metaInfo.cmd;
    // existed.pid = metaInfo.pid;

    if(saveToDB) {
      this.crud.set(existed)
    }
    return existed;
  }


}

//#endregion
