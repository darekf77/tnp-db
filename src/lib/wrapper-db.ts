// //#region imports
// //#region @backend
// import { CLI } from 'tnp-cli';
// //#endregion
// //#region isomorphic
// import {
//   _,
//   //#region @backend
//   fse, os, path
//   //#endregion
// } from 'tnp-core';
// import { config, ConfigModels } from 'tnp-config';
// import { Models } from 'tnp-models';
// import { Helpers, BaseProject as Project } from 'tnp-helpers';
// import {
//   FiredevCrudDeamon,
//   DbUpdateProjectEntity
// } from 'firedev-crud-deamon';
// import { Morphi as Firedev } from 'morphi';
// import { FiredevCrud } from 'firedev-crud';
// //#endregion
// import { ProcessBoundAction } from './models';
// import { BuildOptions } from './build-options';
// import { PortsController } from 'firedev-ports';
// import { debounceTime, exhaustMap, tap } from 'rxjs';
// import {
//   DomainsController,
//   BuildsController,
//   CommandsController,
//   ProcessController,
// } from './controllers';
// import {
//   IProcessInstanceInfo,
//   BuildInstance,
//   CommandInstance,
//   ProcessInstance,
//   DomainInstance,
// } from './entites';
// import { ProjectsController, ProjectInstance } from 'firedev-crud';
// //#endregion

// const buildOptionsParams = ['watch', 'appBuild', 'prod'];
// declare const global: any;

// export class TnpDB {

//   //#region static fields & getters
//   private static _instance: TnpDB;
//   public static get InstanceSync() {
//     if (!TnpDB._instance) {
//       // @ts-ignore
//       Helpers.error(`Please use (await TnpDB.Instance) here`);
//     }
//     return TnpDB._instance;
//   }
//   //#endregion

//   //#region static methods
//   private static async instance(location: string) {
//     if (!TnpDB._instance) {

//       TnpDB._instance = new TnpDB(location);
//       await TnpDB._instance.init(
//         //#region @backend
//         !fse.existsSync(location)
//         //#endregion
//       );
//     }
//     return TnpDB._instance;
//   }

//   public static Instance(dbLocation?: string) {
//     return TnpDB.instance(
//       dbLocation
//         //#region @backend
//         ? dbLocation : config.dbLocation
//       //#endregion
//     );
//   }
//   //#endregion

//   //#region fields & getters
//   private fc: FiredevCrudDeamon | FiredevCrud;

//   private get processCtrl() {
//     return this.fc.getCtrlInstanceBy<ProcessController>(ProcessController as any);
//   }

//   private get buildsCtrl() {
//     return this.fc.getCtrlInstanceBy<BuildsController>(BuildsController as any);
//   }

//   private get commandsCtrl() {
//     return this.fc.getCtrlInstanceBy<CommandsController>(CommandsController as any);
//   }

//   private get projectsCtrl() {
//     return this.fc.getCtrlInstanceBy<ProjectsController>(ProjectsController as any);
//   }

//   private get portsCtrl() {
//     return this.fc.getCtrlInstanceBy<PortsController>(PortsController as any);
//   }

//   public get portsManaber() {
//     return this.portsCtrl.manager;
//   }

//   //#endregion

//   //#region constructor
//   constructor(public readonly location: string) {

//   }
//   //#endregion

//   //#region api

//   //#region api / init
//   private async init(forceRecreate = false) {
//     const initData = [
//       [DomainsController, DomainInstance],
//       [BuildsController, BuildInstance],
//       [CommandsController, CommandInstance],
//       [ProcessController, ProcessInstance],
//     ];
//     const entities = initData.map(f => f[1]) as any[];
//     const controllers = initData.map(f => f[0]) as any[];
//     if (process.platform === 'win32') {
//       this.fc = new FiredevCrud(controllers, entities);
//     } else {
//       this.fc = new FiredevCrudDeamon(controllers, entities);
//     }
//     await this.fc.init({
//       recreate: forceRecreate,
//       location: this.location,
//       recreateScopeFn: async (crud) => {
//         // @ts-ignore
//         const previousCommands = await crud.getAll<CommandInstance>(CommandInstance);
//         return { previousCommands };
//       },
//       callbackCreation: async () => {
//         // await this.initCoreProjects();
//       }
//     });
//   }
//   //#endregion

//   //#region api / listen to channel
//   listenToChannel(project: Project, channel: Models.realtime.UpdateType,
//     callback: () => void | Promise<void>) {
//     //#region @backend
//     if (process.platform === 'win32') { // TODO QUICK_FIX
//       return;
//     }
//     //#endregion

//     // @ts-ignore
//     const entity = DbUpdateProjectEntity.for(project);
//     // @ts-ignore
//     Firedev.Realtime.Browser.listenChangesEntityObj(entity, { // @ts-ignore
//       property: channel
//     }).pipe(
//       // @ts-ignore
//       debounceTime(1000),
//       // @ts-ignore
//       tap(() => {
//         // @ts-ignore
//         Helpers.log(`ext update. channel: "${channel}" `);
//         if (_.isFunction(callback)) {
//           // @ts-ignore
//           Helpers.runSyncOrAsync(callback);
//         } else {
//           // @ts-ignore
//           Helpers.log('Callback triggered but not funciton');
//         }
//       })
//       // @ts-ignore
//     ).subscribe()

//   }
//   //#endregion

//   //#region api / trigger change for projects
//   async triggerChangeForProject(project: Project, channel: Models.realtime.UpdateType) {
//     //#region @backend
//     if (process.platform === 'win32') { // TODO QUICK_FIX
//       return;
//     }
//     //#endregion
//     if (this.fc instanceof FiredevCrudDeamon) {
//       return await (this.fc as FiredevCrudDeamon).worker
//         .triggerChangeOfProject(project.location, channel).received as any; // TODO QUICK_FIX

//     } else {
//       // @ts-ignore
//       Helpers.log(`[tnp-db][triggerChangeForProject] Nothing to trigger...(worker is off)`);
//     }
//   }
//   //#endregion

//   //#region api / init core projects
//   // async initCoreProjects() {
//   //   //#region @backend
//   //   let allCoreProject: (Project & {
//   //     projectLinkedFiles: any; // TODO QUICKFIX,
//   //     filesStructure: any;
//   //   })[] = [];
//   //   Helpers.log(`INITING CORE PROJECTS START
//   //     Project.projects.length ${Project.projects.length}

//   //   `);

//   //   // TODO
//   //   Helpers.run(`${config.frameworkName} env:install`).sync();
//   //   (config.coreProjectVersions as ConfigModels.FrameworkVersion[]).forEach(v => {
//   //     let corePorjectsTypes: ConfigModels.LibType[] = ['angular-lib', 'isomorphic-lib'];
//   //     if ((['v3', 'v1'] as ConfigModels.FrameworkVersion[]).includes(v)) {
//   //       corePorjectsTypes = ['isomorphic-lib'];
//   //     }
//   //     const projects = corePorjectsTypes.map(t => Project.by(t, v));
//   //     allCoreProject = [
//   //       ...projects,
//   //       ...allCoreProject,
//   //     ] as any;
//   //   });

//   //   for (let index = 0; index < allCoreProject.length; index++) {
//   //     const projectToInit = allCoreProject[index];
//   //     Helpers.log(`${projectToInit.genericName} ${projectToInit.location}`);
//   //     const linkedFiles = projectToInit.projectLinkedFiles();
//   //     for (let index2 = 0; index2 < linkedFiles.length; index2++) {
//   //       const l = linkedFiles[index2];
//   //       const source = path.join(l.sourceProject.location, l.relativePath);
//   //       const dest = path.join(projectToInit.location, l.relativePath);
//   //       if (!Helpers.exists(source)) {
//   //         Helpers.error(`[config] Core source do not exists: ${source}`, false, true);
//   //       }
//   //       Helpers.info(`link from: ${source} to ${dest}`);
//   //       // Helpers.remove(dest)
//   //       Helpers.createSymLink(source, dest, { continueWhenExistedFolderDoesntExists: true });
//   //     }
//   //     await projectToInit.filesStructure.struct();
//   //   }
//   //   Helpers.log('INITING CORE PROJECTS DONE');
//   //   //#endregion
//   // }
//   //#endregion

//   //#region api / check if build allowed
//   public async checkBuildIfAllowed(
//     currentProject: Project,
//     buildOptions: BuildOptions,
//     pid: number,
//     ppid: number,
//     onlyUpdate: boolean
//   ) {
//     //#region @backend

//     // @ts-ignore
//     await this.projectsCtrl.addIfNotExists(ProjectInstance.from(currentProject));

//     const killAndRemove = async (existed: BuildInstance) => {
//       try {
//         Helpers.killProcess(existed.pid);
//       } catch (error) {
//       }
//       await this.fc.crud.remove(existed as any);
//     };

//     // TODO fix it when process exists with pid but is it is not process of TNP!
//     while (true) {
//       if (onlyUpdate) {
//         break;
//       }

//       const existed = await this.buildsCtrl.getExistedForOptions(currentProject, buildOptions, pid, ppid);
//       if (existed) {
//         if (global.tnpNonInteractive) {
//           Helpers.warn('automatic kill of active build instance in static build mode');
//           await killAndRemove(existed);
//           continue;
//         } else if (existed.pid !== process.pid && existed.pid !== ppid) {
//           Helpers.log(`

//           Current process pid: ${process.pid}, current ppid: ${process.ppid}

//           `);
//           const confirm = await Helpers.questionYesNo(`

//           There is active process on pid ${existed.pid}, do you wanna kill this process ?
//          build options: ${existed.buildOptions.toString()}`);
//           if (confirm) {
//             await killAndRemove(existed);
//             continue;
//           } else {
//             process.exit(0);
//           }
//         }
//       } else {
//         await this.buildsCtrl.add(currentProject, buildOptions, pid, ppid);
//       }
//       break;
//     }
//     //#endregion
//   }
//   //#endregion

//   //#region api / processes

//   //#region api / processes / bound actions
//   /**
//    * bounding of realtime BE/FE processes
//    */
//   public async boundActions(
//     action1: ProcessBoundAction,
//     action2: ProcessBoundAction) {


//     let d = await action1(void 0);
//     const proc = await this.boundProcess(d.metaInfo, d.relation1TO1entityId);
//     d = await action2(proc);
//     if (d) {
//       await this.boundProcess(d.metaInfo, d.relation1TO1entityId);
//     }

//   }
//   //#endregion

//   //#region api / processes / bound process
//   private boundProcess(metaInfo: IProcessInstanceInfo, relation1TO1entityId?: number): Promise<ProcessInstance> {
//     return new Promise<ProcessInstance>(async (resolve) => {
//       const proc = await this.processCtrl.boundProcess(metaInfo, relation1TO1entityId);
//       resolve(proc);
//     });
//   }
//   //#endregion

//   //#region api / processes / get processes
//   public async getProceses(): Promise<ProcessInstance[]> {
//     // @ts-ignore
//     return await this.fc.crud.getAll(ProcessInstance);
//   }
//   //#endregion

//   //#region api / processes / reset processes
//   async resetProcessess() {
//     await this.fc.crud.setBulk([], ProcessInstance);
//   }
//   //#endregion

//   //#region api / processes / update processes
//   public async updateProcesses() {
//     // @ts-ignore
//     Helpers.log(`[db] Updating buillds...`);
//     await this.buildsCtrl.update();
//   }
//   //#endregion

//   //#endregion

//   //#region api / commands

//   //#region api / commands / run command
//   public async runCommand(cmd: CommandInstance) {
//     //#region @backendFunc
//     // @ts-ignore
//     await this.commandsCtrl.runCommand(cmd);
//     //#endregion
//   }
//   //#endregion

//   //#region api / commands / get commands
//   public async getCommands(): Promise<CommandInstance[]> {
//     //#region @backendFunc
//     // @ts-ignore
//     return await this.fc.crud.getAll(CommandInstance);
//     //#endregion
//   }
//   //#endregion

//   //#region api / commands / last command from
//   public async lastCommandFrom(location: string, buildCommand = false) {
//     //#region @backendFunc
//     // @ts-ignore
//     return await this.commandsCtrl.lastCommandFrom(location, buildCommand);
//     //#endregion

//   }
//   //#endregion

//   //#region api / commands / set command
//   public async setCommand(command: string) {
//     //#region @backend
//     // console.log(`Set commadn: ${command}`)
//     const location: string = process.cwd();
//     if (!fse.existsSync(location)) {
//       Helpers.error(`Cannot set command - location doesn't exists: ${location}`);
//       return;
//     }

//     const cb = CommandInstance.from(command, location);
//     if (_.isString(cb.command) && cb.command.trim().startsWith(`${config.frameworkName} b`)) {
//       cb.isBuildCommand = true;
//       // @ts-ignore
//       await this.fc.crud.set(cb);
//     } else {
//       const c = CommandInstance.from(command, location);
//       if (c.command) {
//         // @ts-ignore
//         await this.fc.crud.set(c);
//       } else {
//         Helpers.info(`Trying to save command: '${command}'`)
//       }

//     }
//     //#endregion
//   }
//   //#endregion

//   //#endregion

//   //#region api / builds

//   //#region api / builds / get builds by
//   async getBuildsBy(options: {
//     location?: string;
//     watch?: boolean;
//     prod?: boolean;
//     appBuild?: boolean;
//     baseHref?: boolean;
//     pid?: number;
//     ppid?: number;
//   }) {
//     const buildsFromDB = await this.getBuilds();
//     if (_.isNil(options)) {
//       return buildsFromDB;
//     }
//     const paramsToCheck = Object.keys(options);
//     if (paramsToCheck.length === 0) {
//       return buildsFromDB;
//     }

//     return buildsFromDB.filter(build => {
//       return paramsToCheck.filter(p => {
//         if (buildOptionsParams.includes(p)) {
//           return build.buildOptions && build.buildOptions[p] === options[p];
//         } else {
//           return build[p] === options[p];
//         }
//       }).length === paramsToCheck.length;
//     });
//   }
//   //#endregion

//   //#region api / builds / app build founded for
//   public async appBuildFoundedFor(project: Project) {
//     // @ts-ignore
//     return await this.buildsCtrl.appBuildFoundedFor(project);
//   }
//   //#endregion

//   //#region api / builds / get builds
//   public async getBuilds(): Promise<BuildInstance[]> {
//     // @ts-ignore
//     await this.buildsCtrl.update();
//     // @ts-ignore
//     return await this.fc.crud.getAll(BuildInstance) as any;
//   }
//   //#endregion

//   //#region api / builds / update build options
//   public async updateBuildOptions(buildOptions: BuildOptions, pid: number) {
//     //#region @backend
//     // console.log('current build options', buildOptions)

//     const existed = await this.buildsCtrl.getExistedByPid(pid);
//     if (existed) {
//       await existed.updateCmdFrom(buildOptions);
//       // console.log(existed);
//       // @ts-ignore
//       await this.fc.crud.set(existed as any);
//       // process.exit(0)
//     }
//     //#endregion
//   }
//   //#endregion

//   //#endregion

//   //#region api / projects

//   //#region api / projects / get projects
//   public async getProjects(): Promise<ProjectInstance[]> {
//     //#region @backendFunc
//     // @ts-ignore
//     let projects = await this.fc.crud.getAll<ProjectInstance>(ProjectInstance);
//     projects = projects.filter(p => !!p.project);
//     // @ts-ignore
//     await this.fc.crud.setBulk(projects, ProjectInstance);
//     return projects;
//     //#endregion
//   }
//   //#endregion

//   //#region api / projects / add project if not exists
//   public async addProjectIfNotExist(project: Project) {
//     //#region @backend
//     // Helpers.log('[tnp-db] addProjectIfNotExist ')
//     // @ts-ignore
//     await this.projectsCtrl.addIfNotExists(ProjectInstance.from(project));
//     //#endregion
//   }
//   //#endregion

//   //#region api / projects / kill instances from
//   public async killInstancesFrom(projects: Project[]) {
//     await this.buildsCtrl.update();
//     await this.buildsCtrl.killInstancesFrom(projects);
//     await this.buildsCtrl.update();
//   }
//   //#endregion

//   //#endregion

//   //#region api / worker

//   //#region api / worker / kill worker
//   async killWorker() {
//     if (this.fc instanceof FiredevCrudDeamon) {
//       await this.fc.killWorker();
//     } else {
//       // @ts-ignore
//       Helpers.warn(`[tnp-db][kill owker] nothing to kill in workerless mode`);
//     }
//   }
//   //#endregion

//   //#region api / worker / get worker port
//   async getWokerPort(): Promise<number> {
//     if (this.fc instanceof FiredevCrudDeamon) {
//       return await this.fc.getWokerPort();
//     } else {
//       // @ts-ignore
//       Helpers.warn(`[tnp-db][kill owker] can't get port in workerless mode`);
//     }
//   }
//   //#endregion

//   //#region api / worker / raw set
//   public async rawSet<T = any>(keyOrEntityName: string, json: T) {
//     return await this.fc.rawSet<T>(keyOrEntityName, json);
//   }
//   //#endregion

//   //#region api / worker / raw get
//   public async rawGet<T = any>(keyOrEntityName: string) {
//     return await this.fc.rawGet<T>(keyOrEntityName);
//   }
//   //#endregion

//   //#endregion

//   //#endregion

// }
