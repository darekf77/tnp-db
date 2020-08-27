import { Morphi } from 'morphi';
//#region @backend
import { TnpDB } from '../wrapper-db.backend';
import { Project } from 'tnp-helpers';
import { BootstrapWorker } from 'background-worker-process';
import { WorkerProcessClass } from 'background-worker-process';
import type { DbCrud } from '../db-crud';
import type { DBBaseEntity } from '../entites/base-entity';
//#endregion

@Morphi.Controller({
  className: 'DbDaemonController'
})
// @ts-ignore
export class DbDaemonController
  //#region @backend
  extends WorkerProcessClass
  implements DbCrud
//#endregion
{
//#region @backend
  initDeamon(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  clearDBandReinit(defaultValues: { [entityName: string]: any[]; }): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getAll<T extends DBBaseEntity<any>>(classFN: Function): Promise<T[]> {
    throw new Error("Method not implemented.");
  }
  addIfNotExist(entity: DBBaseEntity<any>): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  remove(entity: DBBaseEntity<any>): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  set(entity: DBBaseEntity<any>): Promise<void> {
    throw new Error("Method not implemented.");
  }
  setBulk(entites: DBBaseEntity<any>[], classFN: Function): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  get filename() {
    return __filename;
  }
  //#endregion

  @Morphi.Http.GET()
  hello(): Morphi.Response {
    return async (req, res) => 'hello';
  }

  @Morphi.Http.GET()
  allprojects(): Morphi.Response<any> {
    //#region @backendFunc
    return async (req, res) => {
      const db = TnpDB.InstanceSync;
      const projects = (await db.getProjects()).map(p => {
        return Project.From(p.locationOfProject);
      });
      return projects;
    }
    //#endregion
  }

}

//#region @backend
export default BootstrapWorker.bootstrap(DbDaemonController);
//#endregion
