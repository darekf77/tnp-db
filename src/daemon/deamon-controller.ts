import { Morphi } from 'morphi';
//#region @backend
import { TnpDB } from '../wrapper-db.backend';
import { Project } from 'tnp-helpers';
import { BootstrapWorker } from 'background-worker-process';
import { WorkerProcessClass } from 'background-worker-process';
import type { DbCrud } from '../db-crud';



export interface IDBCrud {
  read: () => any;
  defaults: (any) => { write: () => any; }
  set: (objPath: string, json: object) => { write: () => any; }
  get: (objPath: string) => { value: () => any; }
}

//#endregion

@Morphi.Controller({
  className: 'DbDaemonController'
})
export class DbDaemonController
  //#region @backend
  extends WorkerProcessClass implements Morphi.BASE_CONTROLLER_INIT, IDBCrud
//#endregion
{

  //#region @backend

  @Morphi.Http.POST()
  copyAllToWorker(@Morphi.Http.Param.Body('data') data: any): Morphi.Response<any> {
    return async (req, res) => {
      console.log(data);
      return 'huhuhuhu';
    }
  }
  //#endregion


  //#region @backend
  get filename() {
    return __filename;
  }
  //#endregion

  @Morphi.Http.GET()
  hello(): Morphi.Response {
    //#region @backendFunc
    return async (req, res) => 'hello';
    //#endregion
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

  async initExampleDbData() {

  }


}

//#region @backend
export default BootstrapWorker.bootstrap(DbDaemonController);
//#endregion
