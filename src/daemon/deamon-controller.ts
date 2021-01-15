import { Morphi } from 'morphi';
//#region @backend
import { TnpDB } from '../wrapper-db.backend';
import { Project, Helpers } from 'tnp-helpers';
import { BootstrapWorker } from 'background-worker-process';
import { WorkerProcessClass } from 'background-worker-process';
import * as _ from 'lodash';
import * as path from 'path';
import * as moment from 'moment';
import { DbUpdateProjectEntity } from '../daemon/daemon-entity';
import { CLASS } from 'typescript-class-helpers';

export interface IDBCrud {
  read: () => Promise<any>;
  defaults: (any) => { write: () => Promise<any>; }
  set: (objPath: string, json: object) => { write: () => Promise<any>; }
  get: (objPath: string) => { value: () => Promise<any>; }
}

//#endregion

const TEXT_AREA_CSS = 'style="width: 772px; min-height: 50px;"';

@Morphi.Controller({
  className: 'DbDaemonController'
})
export class DbDaemonController
  //#region @backend
  extends WorkerProcessClass implements Morphi.BASE_CONTROLLER_INIT, IDBCrud
//#endregion
{
  logArr = [];
  log(msg: string) {
    //#region @backend
    msg = `<strong>[${moment().format()}]</strong> ${msg}`;
    Helpers.log(msg);
    this.logArr.push(msg);
    //#endregion
  }
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
  private debounce(fn: any) {
    return _.debounce(fn, 1000);
  }

  private saveToFileAction() {
    const pathToDb = (_.isString(this.pathToDb) && this.pathToDb.endsWith('.json')) ? this.pathToDb :
      path.join(process.cwd(), 'tmp-worker-db.json');
    Helpers.writeFile(pathToDb, this.data);
    this.log(`[debounce] Data update in db in <a href="file://${pathToDb}">${pathToDb}</a>`);
  }

  private saveToFileDebounceAction = this.debounce(() => {
    this.saveToFileAction();
  });
  //#endregion

  read = async () => {
    // no needed here
  };

  @Morphi.Http.POST('/defaults')
  defaultsWriteToDB(@Morphi.Http.Param.Body('data') data: any): Morphi.Response<any> {
    //#region @backendFunc
    return async (req, res) => {
      this.log(`defaultsWriteToDB: <br>${JSON.stringify(data)} `);
      _.keys(data).forEach(key => {
        this.data[key] = data[key];
      });
      this.saveToFileDebounceAction();
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

  @Morphi.Http.PUT('/save')
  triggerSave(): Morphi.Response<any> {
    //#region @backendFunc
    return async () => {
      this.log(`[triggerSave]`)
      this.saveToFileAction();
    }
    //#endregion
  }

  @Morphi.Http.GET()
  triggerChangeOfProject(
    @Morphi.Http.Param.Query('location') location: string,
    @Morphi.Http.Param.Query('channel') channel: string,
  ): Morphi.Response<any> {
    //#region @backendFunc
    return async () => {
      this.logArr = [];
      if (channel) {
        this.log(`[TrigggerEntityPropertyChanges] for locatino: "${location}", channel: "${channel}"`);
        const a = DbUpdateProjectEntity.for({ location } as any);
        Morphi.Realtime.Server.TrigggerEntityPropertyChanges(a, channel);
      } else {
        this.log(`[triggerChangeOfProject] for locatino: "${location}"`)
        Morphi.Realtime.Server.TrigggerEntityChanges(DbUpdateProjectEntity, location);
      }

    }
    //#endregion
  }

  @Morphi.Http.PUT('/set')
  setValueToDb(
    @Morphi.Http.Param.Query('objPath') objPath: string,
    @Morphi.Http.Param.Body('json') json: object): Morphi.Response<any> {
    //#region @backendFunc
    return async (req, res) => {
      this.log(`[setValueToDb] key ${objPath} = <br> <textarea ${TEXT_AREA_CSS} >${JSON.stringify(json, null, 4)
        }</textarea> `);
      _.set(this.data, objPath, json);
      this.saveToFileDebounceAction();
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
      this.log(`[getValueFromDb] key ${objPath} = <br> <textarea ${TEXT_AREA_CSS} >${this.data[objPath] ? JSON.stringify(this.data[objPath]) : '<nothing>'
        }</textarea> `)
      return _.get(this.data, objPath);
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
  copyAllToWorker(
    @Morphi.Http.Param.Body('data') data: any,
    @Morphi.Http.Param.Query('pathToDb') pathToDb: string
  ): Morphi.Response<any> {
    return async (req, res) => {
      this.log(`[copyAllToWorker]`)
      if (Helpers.exists(pathToDb)) {
        this.pathToDb = pathToDb;
      }
      _.keys(data).forEach(key => {
        this.data[key] = data[key];
      });
      this.saveToFileDebounceAction();
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
    this.log(`[hello]`)
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

  @Morphi.Http.GET('/info')
  info(): Morphi.Response<string> {
    return async () => {
      this.log(`[info]`)
      return `

      <h1><a href="log" > log </a> </h1>
      <h1><a href="wholeDb" > whole json db </a> </h1>

      `
    }
  }



  @Morphi.Http.GET('/log')
  showLog(): Morphi.Response<string> {
    return async () => {
      this.log(`[showLog]`)
      return this.logArr.join('<hr>')
    }
  }

  @Morphi.Http.GET('/wholeDb')
  wholeDb() {
    //#region @backendFunc
    return async () => {
      this.log(`[wholeDb]`)
      return JSON.stringify(this.data);
    }
    //#endregion
  }


  @Morphi.Http.GET('/entity/:entityname')
  showEntity(@Morphi.Http.Param.Path('entityname') entityname: string): Morphi.Response<string> {
    //#region @backendFunc
    return async () => {
      const entity = this.data[entityname];
      if (_.isUndefined(entity)) {
        return `no entity by name: ${entityname}`;
      }
      this.log(`[showEntity] entity: ${entityname}`)
      return JSON.stringify(entity);
    }
    //#endregion
  }

  async initExampleDbData() {
    this.log(`[initExampleDbData]`)
  }


}

//#region @backend
export default BootstrapWorker.bootstrap(DbDaemonController);
//#endregion
