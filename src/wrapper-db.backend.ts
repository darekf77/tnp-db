//#region imports / exports
import * as low from 'lowdb';
import * as fse from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as FileSync from 'lowdb/adapters/FileSync'

import {
  ProjectsController,
  DomainsController,
  BuildsController,
  PortsController,
  CommandsController,
  ProcessController
} from './controllers';
import { Helpers } from 'tnp-helpers';
import { DbCrud } from './db-crud';
import { BuildInstance, CommandInstance, ProjectInstance, ProcessInstance, ProcessMetaInfo } from './entites';
import { CLASS } from 'typescript-class-helpers';
import { Models } from 'tnp-models';
import { ProcessBoundAction } from './models';
declare const global: any;
declare const ENV: any;
const config = ENV.config as any;
const buildOptionsParams = ['watch', 'appBuild', 'prod'];
export { BuildInstance, CommandInstance, ProjectInstance, ProcessInstance } from './entites';
//#endregion

export class TnpDB {
  //#region static access
  private static _instance: TnpDB;
  private static async instance(location) {
    if (!this._instance) {

      this._instance = new TnpDB(location)
      await this._instance.init(!fse.existsSync(location))
    }
    return this._instance;
  }
  public static Instance(dbLocation: string) {
    return this.instance(dbLocation)
  }

  public static get InstanceSync() {
    if (!this._instance) {
      Helpers.error(`Please use (await TnpDB.Instance) here`);
    }
    return this._instance;
  }
  //#endregion

  //#region fields
  private __projectsCtrl: ProjectsController;
  private __domainsCtrl: DomainsController;
  private __buildsCtrl: BuildsController;
  private __portsCtrl: PortsController;
  private __commandsCtrl: CommandsController;
  private __processCtrl: ProcessController;
  private _adapter;
  private db;
  private crud: DbCrud;
  //#endregion

  //#region constructor/init
  constructor(private location: string) { }
  public async init(recreate = true) {
    // Helpers.log('[db] recreate db instance');
    if (recreate) {
      Helpers.writeFile(this.location, '');
    }
    this._adapter = new FileSync(this.location);
    this.db = low(this._adapter)
    this.crud = new DbCrud(this.db);
    // Helpers.log('[db] Writed default values');
    this.__projectsCtrl = new ProjectsController(this.crud);
    this.__domainsCtrl = new DomainsController(this.crud);
    this.__buildsCtrl = new BuildsController(this.crud);
    this.__portsCtrl = new PortsController(this.crud);
    this.__commandsCtrl = new CommandsController(this.crud)
    this.__processCtrl = new ProcessController(this.crud);

    // Helpers.log('[db] controllers inited');

    if (recreate) {
      Helpers.log('[db] reinit transacton started');
      Helpers.log(`REMOVE FILE ${config.pathes.tmp_transaction_pid_txt}`)
      Helpers.removeFileIfExists(config.pathes.tmp_transaction_pid_txt);
      await this.reinitDB();
      Helpers.log('[db] reinit transacton finish');
    }
  }
  //#endregion

  //#region reinint db
  public async reinitDB() {
    Helpers.log(`[db][reinit] writing default values`);
    this.crud.clearDBandReinit({
      projects: [],
      domains: [],
      ports: [],
      builds: [],
      commands: [],
      processes: []
    });
    Helpers.log(`[db][reinit] adding existed projects`);
    await this.__projectsCtrl.addExisted()
    Helpers.log(`[db][reinit] adding existed domains`);
    await this.__domainsCtrl.addExisted()
    Helpers.log(`[db][reinit] adding existed commands`);
    await this.__commandsCtrl.addExisted()
    Helpers.log(`[db][reinit] adding existed ports`);
    await this.__portsCtrl.addExisted()
    Helpers.log(`[db][reinit] adding existed builds`);
    await this.__buildsCtrl.addExisted()
    Helpers.log(`[db][reinit] adding existed processes`);
    await this.__processCtrl.addExisted()
    Helpers.info(`[db][reinit] DONE`);
  }
  //#endregion

  //#region check if build allowed
  public async checkBuildIfAllowed(currentProject: Models.other.IProject,
    buildOptions: Models.dev.IBuildOptions, pid: number, ppid: number, onlyUpdate: boolean) {
    // console.log('current build options', buildOptions)

    this.__projectsCtrl.addIfNotExists(ProjectInstance.from(currentProject));

    const killAndRemove = (existed: BuildInstance) => {
      try {
        Helpers.killProcess(existed.pid)
      } catch (error) {
      }
      this.crud.remove(existed)
    };

    // TODO fix it when process exists with pid but is it is not process of TNP!
    while (true) {
      if (onlyUpdate) {
        break;
      }

      const existed = await this.__buildsCtrl.getExistedForOptions(currentProject, buildOptions, pid, ppid);
      if (existed && currentProject.isGenerated === existed.project.isGenerated) {
        if (global.tnpNonInteractive) {
          Helpers.warn('automatic kill of active build instance in static build mode');
          killAndRemove(existed)
          continue;
        } else if (existed.pid !== process.pid) {
          Helpers.log(`

          Current process pid: ${process.pid}, current ppid: ${process.ppid}

          `)
          const confirm = await Helpers.questionYesNo(`

          There is active process on pid ${existed.pid}, do you wanna kill this process ?
         build options: ${existed.buildOptions.toString()}`)
          if (confirm) {
            killAndRemove(existed)
            continue;
          } else {
            process.exit(0);
          }
        }
      } else {
        this.__buildsCtrl.add(currentProject, buildOptions, pid, ppid);
      }
      break;
    }

  }
  //#endregion

  //#region processes
  /**
   * bounding of realtime BE/FE processes
   */
  public async boundActions(
    action1: ProcessBoundAction,
    action2: ProcessBoundAction) {


    let d = await action1(void 0);
    let proc = await this.boundProcess(d.metaInfo, d.relation1TO1entityId);
    d = await action2(proc);
    if (d) {
      await this.boundProcess(d.metaInfo, d.relation1TO1entityId);
    }

  }

  private boundProcess(metaInfo: ProcessMetaInfo, relation1TO1entityId?: number): Promise<ProcessInstance> {
    return new Promise<ProcessInstance>(async (resolve) => {
      let proc = this.__processCtrl.boundProcess(metaInfo, relation1TO1entityId)
      resolve(proc);
    });
  }

  public getProceses(): ProcessInstance[] {
    return this.crud.getAll(ProcessInstance);
  }

  resetProcessess() {
    this.crud.setBulk([], ProcessInstance);
  }

  public async updateProcesses() {
    Helpers.log(`[db] Updating buillds...`)
    await this.__buildsCtrl.update();
  }

  //#endregion

  //#region commands
  public async runCommand(cmd: CommandInstance) {
    await this.__commandsCtrl.runCommand(cmd);
  }

  public getCommands(): CommandInstance[] {
    return this.crud.getAll(CommandInstance);
  }

  public lastCommandFrom(location: string, buildCommand = false) {
    return this.__commandsCtrl.lastCommandFrom(location, buildCommand)
  }

  public async setCommand(command: string) {
    // console.log(`Set commadn: ${command}`)
    let location: string = process.cwd();
    if (!fse.existsSync(location)) {
      Helpers.error(`Cannot set command - location doesn't exists: ${location}`)
      return
    }

    const cb = new CommandInstance(command, location);
    if (_.isString(cb.command) && cb.command.trim().startsWith(`${config.frameworkName} b`)) {
      cb.isBuildCommand = true;
      this.crud.set(cb);
    } else {
      const c = new CommandInstance(command, location);
      this.crud.set(c);
    }
  }

  public async updateCommandBuildOptions(location: string, buildOptions: Models.dev.IBuildOptions) {
    this.__commandsCtrl.updateCommandBuildOptions(location, buildOptions);
  }
  //#endregion

  //#region builds
  async getBuildsBy(options: {
    location?: string;
    watch?: boolean;
    prod?: boolean;
    appBuild?: boolean;
    baseHref?: boolean;
    pid?: number;
    ppid?: number;
  }) {
    const buildsFromDB = this.getBuilds();
    if (_.isNil(options)) {
      return buildsFromDB;
    }
    const paramsToCheck = Object.keys(options);
    if (paramsToCheck.length === 0) {
      return buildsFromDB;
    }

    return buildsFromDB.filter(build => {
      // build.buildOptions.copyto
      return paramsToCheck.filter(p => {
        if (buildOptionsParams.includes(p)) {
          return build.buildOptions && build.buildOptions[p] == options[p];
        } else {
          return build[p] == options[p];
        }
      }).length === paramsToCheck.length;
    });
  }

  public distBuildFoundedFor(project: Models.other.IProject) {
    return this.__buildsCtrl.distBuildFoundedFor(project)
  }

  public appBuildFoundedFor(project: Models.other.IProject) {
    return this.__buildsCtrl.appBuildFoundedFor(project)
  }

  public getBuilds(): BuildInstance[] {
    return this.crud.getAll(BuildInstance);
  }

  public async updateBuildOptions(buildOptions: Models.dev.IBuildOptions, pid: number) {
    // console.log('current build options', buildOptions)

    const existed = await this.__buildsCtrl.getExistedByPid(pid);
    if(existed) {
      existed.updateCmdFrom(buildOptions);
      // console.log(existed);
      this.crud.set(existed);
      // process.exit(0)
    }

  }
  //#endregion

  //#region projects
  public getProjects(): ProjectInstance[] {
    return this.crud.getAll(ProjectInstance)
  }
  public addProjectIfNotExist(project: Models.other.IProject) {
    this.__projectsCtrl.addIfNotExists(ProjectInstance.from(project));
  }
  public async killInstancesFrom(projects: Models.other.IProject[]) {
    await this.__buildsCtrl.update()
    await this.__buildsCtrl.killInstancesFrom(projects)
    await this.__buildsCtrl.update()
  }
  //#endregion


}
