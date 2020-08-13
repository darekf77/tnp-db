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
import { Helpers, Project } from 'tnp-helpers';
import { DbCrud } from './db-crud';
import { BuildInstance, CommandInstance, ProjectInstance, ProcessInstance, ProcessMetaInfo, PortInstance } from './entites';
import { CLASS } from 'typescript-class-helpers';
import { Models } from 'tnp-models';
import { ProcessBoundAction } from './models';
import { BuildOptions } from './build-options';
import { Morphi } from 'morphi';
import { DbDaemonController } from './daemon/deamon-controller';
declare const global: any;
if (!global['ENV']) {
  global['ENV'] = {};
}
const config = global['ENV'].config as any;
const buildOptionsParams = ['watch', 'appBuild', 'prod'];
export { BuildInstance, CommandInstance, ProjectInstance, ProcessInstance } from './entites';
//#endregion

const DAEMON_PORT_NAME = 'firedev-daemon';

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
  private db: any;

  public async rawGet<T = any>(keyOrEntityName: string) {
    if (!this.db) {
      return;
    }
    // this.db.read();
    return this.db.get(keyOrEntityName).value() as T;
  }
  public async rawSet<T = any>(keyOrEntityName: string, json: T) {
    if (!this.db) {
      return;
    }
    // this.db.set(keyOrEntityName, json).write();
  }

  private crud: DbCrud;
  //#endregion

  //#region constructor/init
  constructor(private location: string) {

  }
  public async init(recreate = true) {
    // Helpers.log('[db] recreate db instance');
    if (recreate) {
      Helpers.writeFile(this.location, '');
    }
    this._adapter = new FileSync(this.location);
    const result = low(this._adapter);
    this.db = result as any;

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

  static async restartDaemon(db: TnpDB) {
    Helpers.info(`[tnp-db] Restarting daemon..`);
    const portsManger = (await db.__portsCtrl.manager);
    const deamonPort = await portsManger.registerOnFreePort({
      name: DAEMON_PORT_NAME
    });

    console.log(`Assigned port to daemon: ${deamonPort}`);
    const porjDaemon = (await db.getProjects()).find(p => p.project
      && p.project.isStandaloneProject
      && p.project.name === 'background-daemon');
    if (!porjDaemon) {
      Helpers.error(`[tnp-dn] Not able to find daemon project`);
    }
    // porjDaemon.project.run(`node run.js --port ${deamonPort}`).sync();
    const proj = porjDaemon.project;
    Helpers.info(`Starting project: ${proj.genericName} ... `);
    Helpers.killProcessByPort(deamonPort);
    proj.run(`tnp start --port ${deamonPort} &`, {
      output: false,
      silence: true
    }).sync();
    Helpers.info(`Start OK.. project ${proj.name} is running in background:

    link: http://localhost:${deamonPort}

    `);
  }

  //#endregion

  //#region reinint db
  public async reinitDB() {
    if (global['frameworkName'] === 'firedev') {
      const pathToFiredevMorphi = path.join(path.dirname(this.location), 'morphi');
      Helpers.removeFolderIfExists(pathToFiredevMorphi);
    }
    Helpers.log(`[db][reinit] writing default values`);
    await this.crud.clearDBandReinit({
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
    await this.__processCtrl.addExisted();

    if (config) {
      await config.initCoreProjects(Project, Helpers);
    }

    Helpers.info(`[db][reinit] DONE`);
  }
  //#endregion

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
        } else if (existed.pid !== process.pid) {
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

  public async  getCommands(): Promise<CommandInstance[]> {
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
    let projects = await this.crud.getAll<ProjectInstance>(ProjectInstance)
    projects = projects.filter(p => !!p.project);
    await this.crud.setBulk(projects, ProjectInstance)
    return projects;
  }
  public async addProjectIfNotExist(project: Project) {
    await this.__projectsCtrl.addIfNotExists(ProjectInstance.from(project));
  }
  public async killInstancesFrom(projects: Project[]) {
    await this.__buildsCtrl.update()
    await this.__buildsCtrl.killInstancesFrom(projects)
    await this.__buildsCtrl.update()
  }
  //#endregion

  //#region daemon
  private _daemonInstance: {
    controllers: Morphi.Base.Controller<any>[];
    host: string;
  };
  get daemonInstance() {
    return new Promise<DbDaemonController>(async (resolve) => {
      const daemonPort = await this.getDaemonPort();
      const host = `http://localhost:${daemonPort}`;
      const entities = [
        CLASS.getBy('Project')
      ];
      if (!(this._daemonInstance && this._daemonInstance.host === host)) {
        this._daemonInstance = await Morphi.init({
          host,
          onlyForBackendRemoteServerAccess: true,
          controllers: [DbDaemonController],
          entities: entities
        }) as any;
        this._daemonInstance.host = host;
      }
      const { controllers } = this._daemonInstance;
      resolve(_.first(controllers) as any);
    })
  }

  async DaemonTest() {
    const d = await this.daemonInstance;
    try {
      const data = await d.hello().received;
      Helpers.info(data.body.text);
    } catch (er) {
      Helpers.error(er)
    }
  }

  async DaemonKill() {
    const portsManger = (await this.__portsCtrl.manager);
    const instances = await portsManger.getReserverFor({ name: DAEMON_PORT_NAME });
    for (let index = 0; index < instances.length; index++) {
      const ins = instances[index];
      await portsManger.makeFreeAndKill(ins);
    }
  }

  async getDaemonPort(): Promise<number> {
    const portsManger = (await this.__portsCtrl.manager);
    let ins: PortInstance;
    while (true) {
      const instances = await portsManger.getReserverFor({ name: DAEMON_PORT_NAME });
      if (instances.length !== 1) {
        Helpers.info(`[tnp-db] Incorrect ports number for daemon "${instances.length}"... `
          + `db is killing ports`);
        // for (let index = 0; index < instances.length; index++) {
        //   const daemoIns = instances[index];
        //   for (let j = 0; j < daemoIns.array.length; j++) {
        //     const portToKill = daemoIns.array[j];
        //     Helpers.killProcessByPort(portToKill);
        //   }
        // }
        await TnpDB.restartDaemon(this);
        continue;
      }
      ins = _.first(instances);
      if (!_.isNumber(ins.id)) {
        await TnpDB.restartDaemon(this);
        continue;
      }
      break;
    }
    return ins.id as number;
  }
  //#endregion

}
