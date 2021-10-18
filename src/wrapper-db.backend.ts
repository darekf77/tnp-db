declare const global: any;
//#region @backend
import * as low from 'lowdb';
import * as fse from 'fs-extra';
import * as os from 'os';
import * as _ from 'lodash';
import * as path from 'path';
import * as FileSync from 'lowdb/adapters/FileSync';
//#endregion

//#region isomorphic
import { CLASS } from 'typescript-class-helpers';
import { Models } from 'tnp-models';
import { Log, Level } from 'ng2-logger';
import { Helpers, Project } from 'tnp-helpers';
//#endregion

//#region local
import { DbCrud } from './db-crud';
import { ProcessBoundAction } from './models';
import { BuildOptions } from './build-options';
import { DbDaemonController } from './daemon/deamon-controller';
import { DbUpdateProjectEntity } from './daemon/daemon-entity';
import {
  ProjectsController,
  DomainsController,
  BuildsController,
  PortsController,
  CommandsController,
  ProcessController
} from './controllers';
import {
  BuildInstance,
  CommandInstance,
  ProjectInstance,
  ProcessInstance,
  ProcessMetaInfo,
  PortInstance
} from './entites';
//#endregion

import { config, ConfigModels } from 'tnp-config';
import { CLI } from 'tnp-cli';
const buildOptionsParams = ['watch', 'appBuild', 'prod'];
export {
  BuildInstance,
  CommandInstance,
  ProjectInstance,
  ProcessInstance
} from './entites';


// const log = Helpers.Log.create(`[tnp-db][wrapper-db.backend]`);

export class TnpDB {
  //#region static access
  private static _instance: TnpDB;
  private static async instance(location) {
    if (!this._instance) {

      this._instance = new TnpDB(location)
      if (!fse.existsSync(location)) {
        CLI.installEnvironment();
      }
      await this._instance.init(!fse.existsSync(location))
    }
    return this._instance;
  }

  public static Instance(dbLocation?: string) {
    return this.instance(config.dbLocation)
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

  public get portsManaber() {
    return this.__portsCtrl.manager;
  }

  get db() {
    return this.crud?.db;
  }

  public async rawGet<T = any>(keyOrEntityName: string) {
    if (!this.db) {
      return;
    }
    return await this.db.get(keyOrEntityName).value() as T;
  }
  public async rawSet<T = any>(keyOrEntityName: string, json: T) {
    if (!this.db) {
      return;
    }
    await this.db.set(keyOrEntityName, json as any).write();
  }

  private crud: DbCrud;
  //#endregion

  listenToChannel(project: Project, channel: Models.realtime.UpdateType,
    callback: () => void | Promise<void>) {
    DbUpdateProjectEntity.for(project).subscribeRealtimeUpdates({
      callback: (data) => {
        Helpers.log(`ext update. channel: "${channel}" `, data.body.json);
        _.isFunction(callback) && Helpers.runSyncOrAsync(callback);
      },
      property: channel
    });
  }

  async triggerChangeForProject(project: Project, channel: Models.realtime.UpdateType) {
    return await this.crud.worker.triggerChangeOfProject(project.location, channel).received as any; // TODO QUICK_FIX
  }


  //#region constructor/init
  constructor(public readonly location: string) {

  }
  private async init(recreate = true) {
    if (global.reinitDb) {
      recreate = true;
    }
    if (recreate) {
      if (global.dbAlreadyRecreated) {
        Helpers.log(`[tnp-db] db already recreated`);
        return;
      }
      global.dbAlreadyRecreated = true;
      Helpers.log('[db] recreate db instance');
    }
    if (!Helpers.exists(this.location)) {
      Helpers.writeFile(this.location, '');
    }
    this._adapter = new FileSync(this.location);

    this.crud = new DbCrud(low(this._adapter) as any, this);


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
      // if (global['frameworkName'] === 'firedev') {
      //   const pathToFiredevMorphi = path.join(path.dirname(this.location), 'morphi', config.file.db_json);
      //   Helpers.removeF(pathToFiredevMorphi);
      // }
      const previousCommands = await this.crud.getAll<CommandInstance>(CommandInstance);

      Helpers.log(`[db][reinit] writing default values`);
      await this.crud.clearDBandReinit({
        projects: [],
        domains: [],
        ports: [],
        builds: [],
        commands: [],
        processes: []
      });

      await this.__projectsCtrl.addExisted();
      await this.__domainsCtrl.addExisted();
      await (this.__commandsCtrl as CommandsController).addExisted(previousCommands);
      await this.__portsCtrl.addExisted();
      await this.__buildsCtrl.addExisted();
      await this.__processCtrl.addExisted();

      if (config) {
        await this.initCoreProjects();
      }

      Helpers.info(`[db][reinit] DONE`);
      Helpers.log('[db] reinit transacton finish');
    }

    if (global.useWorker) {
      await this.crud.initDeamon(recreate || global.restartWorker);
    }

  }

  //#endregion

  //#region initCoreprojects
  async initCoreProjects() {
    let allCoreProject: (Project & {
      projectLinkedFiles: any; // TODO QUICKFIX,
      filesStructure: any;
    })[] = [];
    Helpers.log(`INITING CORE PROJECTS START
      Project.projects.length ${Project.projects.length}

    `);
    (config.coreProjectVersions as ConfigModels.FrameworkVersion[]).forEach(v => {
      const corePorjectsTypes: ConfigModels.LibType[] = ['angular-lib', 'isomorphic-lib'];
      const projects = corePorjectsTypes.map(t => Project.by(t, v));
      allCoreProject = [
        ...projects,
        ...allCoreProject,
      ] as any;
    });

    for (let index = 0; index < allCoreProject.length; index++) {
      const p = allCoreProject[index];
      Helpers.log(`${p.genericName} ${p.location}`);
      const linkedFiles = p.projectLinkedFiles();
      for (let index2 = 0; index2 < linkedFiles.length; index2++) {
        const l = linkedFiles[index2];
        const source = path.join(l.sourceProject.location, l.relativePath);
        const dest = path.join(p.location, l.relativePath);
        if (!Helpers.exists(source)) {
          Helpers.error(`[config] Core source do not exists: ${source}`, false, true);
        }
        Helpers.info(`link from: ${source} to ${dest}`);
        Helpers.createSymLink(source, dest);
      }
      await p.filesStructure.struct();
    }
    Helpers.log('INITING CORE PROJECTS DONE')
  }

  async getWokerPort() {
    const portsManager = await this.portsManaber;
    return await portsManager.getPortOf({ name: CLASS.getName(DbDaemonController) });
  }

  async killWorker() {
    const portsManager = await this.portsManaber;
    Helpers.log(`[killing worker] starting killing db worker...`);
    try {
      await (this.db as DbDaemonController).triggerSave().received;
      Helpers.log(`[killing worker] trigerr save OK`);
    } catch (error) {
      Helpers.log(`[killing worker] trigerr save ERROR`);
    }
    const portTokill = await portsManager.getPortOf({ name: CLASS.getName(DbDaemonController) })
    await Helpers.killProcessByPort(portTokill);
  }

  //#region check if build allowed
  public async checkBuildIfAllowed(currentProject: Project,
    buildOptions: BuildOptions, pid: number, ppid: number, onlyUpdate: boolean) {
    // console.log('current build options', buildOptions)

    await this.__projectsCtrl.addIfNotExists(ProjectInstance.from(currentProject));

    const killAndRemove = async (existed: BuildInstance) => {
      try {
        Helpers.killProcess(existed.pid)
      } catch (error) {
      }
      await this.crud.remove(existed)
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
          await killAndRemove(existed)
          continue;
        } else if (existed.pid !== process.pid && existed.pid !== ppid) {
          Helpers.log(`

          Current process pid: ${process.pid}, current ppid: ${process.ppid}

          `)
          const confirm = await Helpers.questionYesNo(`

          There is active process on pid ${existed.pid}, do you wanna kill this process ?
         build options: ${existed.buildOptions.toString()}`)
          if (confirm) {
            await killAndRemove(existed)
            continue;
          } else {
            process.exit(0);
          }
        }
      } else {
        await this.__buildsCtrl.add(currentProject, buildOptions, pid, ppid);
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
      let proc = await this.__processCtrl.boundProcess(metaInfo, relation1TO1entityId)
      resolve(proc);
    });
  }

  public async getProceses(): Promise<ProcessInstance[]> {
    return await this.crud.getAll(ProcessInstance);
  }

  async resetProcessess() {
    await this.crud.setBulk([], ProcessInstance);
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

  public async getCommands(): Promise<CommandInstance[]> {
    return await this.crud.getAll(CommandInstance);
  }

  public async lastCommandFrom(location: string, buildCommand = false) {
    return await this.__commandsCtrl.lastCommandFrom(location, buildCommand)
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
      await this.crud.set(cb);
    } else {
      const c = new CommandInstance(command, location);
      await this.crud.set(c);
    }
  }

  public async updateCommandBuildOptions(location: string, buildOptions: BuildOptions) {
    await this.__commandsCtrl.updateCommandBuildOptions(location, buildOptions);
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
    const buildsFromDB = await this.getBuilds();
    if (_.isNil(options)) {
      return buildsFromDB;
    }
    const paramsToCheck = Object.keys(options);
    if (paramsToCheck.length === 0) {
      return buildsFromDB;
    }

    return buildsFromDB.filter(build => {
      return paramsToCheck.filter(p => {
        if (buildOptionsParams.includes(p)) {
          return build.buildOptions && build.buildOptions[p] == options[p];
        } else {
          return build[p] == options[p];
        }
      }).length === paramsToCheck.length;
    });
  }

  public async distBuildFoundedFor(project: Project) {
    return await this.__buildsCtrl.distBuildFoundedFor(project)
  }

  public async appBuildFoundedFor(project: Project) {
    return await this.__buildsCtrl.appBuildFoundedFor(project)
  }

  public async getBuilds(): Promise<BuildInstance[]> {
    await this.__buildsCtrl.update();
    return await this.crud.getAll(BuildInstance);
  }

  public async updateBuildOptions(buildOptions: BuildOptions, pid: number) {
    // console.log('current build options', buildOptions)

    const existed = await this.__buildsCtrl.getExistedByPid(pid);
    if (existed) {
      await existed.updateCmdFrom(buildOptions);
      // console.log(existed);
      await this.crud.set(existed);
      // process.exit(0)
    }

  }
  //#endregion

  //#region projects
  public async getProjects(): Promise<ProjectInstance[]> {
    let projects = await this.crud.getAll<ProjectInstance>(ProjectInstance);
    projects = projects.filter(p => !!p.project);
    await this.crud.setBulk(projects, ProjectInstance)
    return projects;
  }
  public async addProjectIfNotExist(project: Project) {
    // Helpers.log('[tnp-db] addProjectIfNotExist ')
    await this.__projectsCtrl.addIfNotExists(ProjectInstance.from(project));
  }
  public async killInstancesFrom(projects: Project[]) {
    await this.__buildsCtrl.update()
    await this.__buildsCtrl.killInstancesFrom(projects)
    await this.__buildsCtrl.update()
  }
  //#endregion


}
