// //#region imports
// //#region isomorphic
// import { _ } from 'tnp-core';
// import { Helpers } from 'tnp-helpers';
// import { CLASS } from 'typescript-class-helpers';
// import { Models, DBBaseEntity } from 'tnp-models';
// import { BaseProject as Project } from 'tnp-helpers';
// import { CommandInstance } from './command-instance';
// //#endregion
// import { BuildOptions } from '../build-options';
// //#endregion

// export interface IBuildInstance {
//   //#region interface body
//   buildOptions?: BuildOptions;
//   cmd?: string;
//   pid: number;
//   ppid: number;
//   location?: string;
//   //#endregion
// }

// @CLASS.NAME('BuildInstance') // @ts-ignore
// export class BuildInstance extends DBBaseEntity<BuildInstance> implements IBuildInstance {

//   //#region static methods / from
//   static from(data?: IBuildInstance) {
//     //#region @backendFunc
//     const ins = new BuildInstance(data);
//     ins.assignProps();
//     return ins;
//     //#endregion
//   }
//   //#endregion

//   //#region fields & getters
//   pid: number;
//   ppid: number;
//   location?: string;
//   private _buildOptions: BuildOptions;
//   cmd?: string;
//   //#region fields & getters / project
//   get project() {
//     return Project.ins.From(this.location) as Project;
//   }
//   //#endregion

//   //#region fields & getters / is tnp project build
//   get isTnpProjectBuild() {
//     const res = (_.isString(this.cmd) && this.cmd.trim() !== '' && _.isObject(this.buildOptions));
//     // if (!res) {
//     // console.log('it is not a build', this.cmd)
//     // }
//     return res;
//   }
//   //#endregion

//   //#region fields & getters / build options
//   get buildOptions() {
//     return this._buildOptions;
//   }
//   //#endregion

//   //#region fields & getters / brief
//   public get brief() {
//     //#region @backendFunc
//     const brief = this.buildOptions ? (
//       '(' +
//       (this.buildOptions.staticBuild ? 'static' : '') + ',' +
//       (this.buildOptions.prod ? 'prod' : '') + ',' +
//       (this.buildOptions.watch ? 'watch' : 'normal') + ',' +
//       (this.buildOptions.appBuild ? 'app' : 'lib') + ',' +
//       (this.buildOptions.outDir) +
//       ')'
//     ) : '';
//     return brief + `build instace for project: ${this.project.name} on pid: ${this.pid}`;
//     //#endregion
//   }
//   //#endregion

//   //#endregion

//   //#region api

//   //#region api / get raw data
//   async getRawData(): Promise<object> {
//     const { pid, ppid, project, location, cmd } = this as BuildInstance;
//     return ({
//       pid,
//       ppid,
//       cmd,
//       location: _.isString(location) ? location : (!!project && project.location)
//     });
//   }
//   //#endregion

//   //#region assign props
//   assignProps() {
//     this.pid = this.data.pid;
//     this.ppid = this.data.ppid;
//     this.location = this.data.location;
//     this.cmd = CommandInstance.fixedCommand(this.data.cmd);
//   }
//   //#endregion

//   //#region api / prepare instance
//   async prepareInstance(reason = 'prepare instance for builds') {
//     //#region @backend
//     const data = this.data;

//     // console.log('PROJECT', !!Project)
//     // console.log('BuildOptions', !!BuildOptions)
//     this.assignProps();
//     if (this.cmd) {
//       // this._buildOptions = await BuildOptions.from(this.cmd, Project.ins.From(this.location), void 0, reason);
//       // this.cmd = await BuildOptions.exportToCMD(this._buildOptions);
//     } else {
//       if (_.isObject(data.buildOptions)) {
//         // this.cmd = await BuildOptions.exportToCMD(data.buildOptions);
//         // this._buildOptions = await BuildOptions.from(this.cmd, Project.ins.From(this.location), void 0, reason);
//         // this.cmd = await BuildOptions.exportToCMD(this._buildOptions);
//       } else {
//         this.cmd = '';
//         // this._buildOptions = await BuildOptions.from(this.cmd, Project.ins.From(this.location), void 0, reason);
//       }
//     }
//     //#endregion
//     return this;
//   }
//   //#endregion

//   //#region api / update cmd from
//   async updateCmdFrom(buildOptions: BuildOptions) {
//     // this.cmd = await BuildOptions.exportToCMD(buildOptions);
//     // this._buildOptions = await BuildOptions.from(this.cmd, Project.ins.From(this.location), void 0, 'update from cmd');
//   }
//   //#endregion

//   //#region api / is equal
//   isEqual(anotherInstace: BuildInstance) {
//     return false; // TODO DELETE @LAST
//     if (!anotherInstace) {
//       return false;
//     }
//     return (this.pid === anotherInstace.pid ||
//       (this.location === anotherInstace.location &&
//         this.buildOptions.watch === anotherInstace.buildOptions.watch &&
//         this.buildOptions.appBuild === anotherInstace.buildOptions.appBuild &&
//         this.buildOptions.outDir === anotherInstace.buildOptions.outDir
//       ));
//   }
//   //#endregion

//   //#region api / kill
//   kill() {
//     //#region @backend
//     Helpers.log(`Killing ${this.brief}`);
//     Helpers.killProcess(this.pid);
//     //#endregion
//   }
//   //#endregion

//   //#endregion
// }

