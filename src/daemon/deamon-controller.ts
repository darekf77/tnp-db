import { Morphi } from 'morphi';
//#region @backend
import { TnpDB } from '../wrapper-db.backend';
import { Project } from 'tnp-helpers';
//#endregion

@Morphi.Controller()
export class DbDaemonController {

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
