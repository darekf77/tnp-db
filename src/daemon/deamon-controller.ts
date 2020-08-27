import { Morphi } from 'morphi';
//#region @backend
import { TnpDB } from '../wrapper-db.backend';
import { Project } from 'tnp-helpers';
import { BootstrapWorker } from 'background-worker-process';
import { WorkerProcessClass } from 'background-worker-process';
//#endregion


@Morphi.Controller({
  className: 'DbDaemonController'
})
export class DbDaemonController
  //#region @backend
  extends WorkerProcessClass
//#endregion
{

  //#region @backend
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
