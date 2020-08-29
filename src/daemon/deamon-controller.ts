import { Morphi } from 'morphi';
//#region @backend
import { TnpDB } from '../wrapper-db.backend';
import { Project } from 'tnp-helpers';
import { BootstrapWorker } from 'background-worker-process';
import { WorkerProcessClass } from 'background-worker-process';
import type { DbCrud } from '../db-crud';



export interface IDBCrud {
  read: () => Promise<any>;
  defaults: (any) => { write: () => Promise<any>; }
  set: (objPath: string, json: object) => { write: () => Promise<any>; }
  get: (objPath: string) => { value: () => Promise<any>; }
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
  private data: any = {
    projects: [
      'test1'
    ]
  };

  @Morphi.Http.GET('/read')
  readFromWorker(): Morphi.Response<any> {
    //#region @backendFunc
    return async (req, res) => {
      return void 0;
    }
    //#endregion
  }

  read = async () => {
    const result = await this.readFromWorker().received;
    return result.body.json
  };

  @Morphi.Http.POST('/defaults')
  defaultsWriteToDB(@Morphi.Http.Param.Body('data') data: any): Morphi.Response<any> {
    //#region @backendFunc
    return async (req, res) => {
      this.data = data;
      return data;
    }
    //#endregion
  }

  defaults = (data: any) => {
    return {
      write: async () => {
        const result = await this.defaultsWriteToDB(data).received;
        return result.body.json;
      }
    }
  };

  @Morphi.Http.PUT('/set')
  setValueToDb(
    @Morphi.Http.Param.Query('objPath') objPath: string,
    @Morphi.Http.Param.Body('json') json: object): Morphi.Response<any> {
    //#region @backendFunc
    return async (req, res) => {
      this.data[objPath] = json;
      return this.data[objPath];
    }
    //#endregion
  }

  set = (objPath: string, json: object) => {
    return {
      write: async () => {
        const result = await this.setValueToDb(objPath, json).received;
        return result.body.json;
      }
    }
  };

  @Morphi.Http.GET('/get')
  getValueFromDb(@Morphi.Http.Param.Query('objPath') objPath: string): Morphi.Response<any> {
    //#region @backendFunc
    return async (req, res) => {
      return this.data[objPath];
    }
    //#endregion
  }

  get = (objPath: string) => {
    return {
      value: async () => {
        const result = await this.getValueFromDb(objPath).received;
        return result.body.json;
      }
    }
  };

  //#region @backend

  @Morphi.Http.POST()
  copyAllToWorker(@Morphi.Http.Param.Body('data') data: any): Morphi.Response<any> {
    return async (req, res) => {
      this.data = data;
      return this.data;
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
