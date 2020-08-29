import { Morphi } from 'morphi';
//#region @backend
import { TnpDB } from '../wrapper-db.backend';
import { Project, Helpers } from 'tnp-helpers';
import { BootstrapWorker } from 'background-worker-process';
import { WorkerProcessClass } from 'background-worker-process';
import type { DbCrud } from '../db-crud';
import * as _ from 'lodash';
import * as path from 'path';


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
  pathToDb: string;
  private _data: any = {
    projects: [
      'test1'
    ]
  };

  get data() {
    return this._data;
  }

  //#region @backend
  private debounce(fn: Function) {
    return fn;
    // return _.debounce(fn, 1000);
  }
  saveToFile =
    this.debounce(() => {
      const pathToDb = (_.isString(this.pathToDb) && this.pathToDb.endsWith('.json')) ? this.pathToDb :
        path.join(process.cwd(), 'tmp-worker-db.json');
      Helpers.writeFile(pathToDb, this.data);
      console.log(`Data update in db in ${pathToDb}`);
    });
  //#endregion


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
      _.keys(data).forEach(key => {
        this.data[key] = data[key];
      });
      this.saveToFile();
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
      this.saveToFile();
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
      _.keys(data).forEach(key => {
        this.data[key] = data[key];
      });
      this.saveToFile();
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
