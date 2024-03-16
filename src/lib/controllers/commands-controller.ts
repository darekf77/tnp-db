// //#region imports
// //#region isomorphic
// import { _ } from 'tnp-core';
// import { Helpers } from 'tnp-helpers';
// import { CLASS } from 'typescript-class-helpers';
// import { Models, BaseController } from 'tnp-models';
// import { config } from 'tnp-config';
// import { DbCrud } from 'firedev-crud';
// //#endregion
// import { CommandInstance } from '../entites/command-instance';
// import { BuildOptions } from '../build-options';
// import { ProjectInstance } from 'firedev-crud';
// //#endregion

// declare const global: any;
// @CLASS.NAME('CommandsController')
// export class CommandsController extends BaseController<DbCrud> {
//   //#region api

//   //#region api / add existed
//   async addExisted(scope: { previousCommands?: CommandInstance[] }) {
//     return;
//     //#region @backendFunc
//     const previousCommands = scope?.previousCommands || [];
//     Helpers.log(`[db][reinit] adding existed commands`);
//     const projecsLocaitons = (await this.crud.getAll<ProjectInstance>(ProjectInstance)).map(p => p.locationOfProject);
//     return previousCommands.filter(c => projecsLocaitons.includes(c.location));
//     //#endregion
//   }
//   //#endregion

//   //#region api / update
//   async update() {

//   }
//   //#endregion

//   //#region api / last command from
//   async lastCommandFrom(location: string, buildCommand = false): Promise<CommandInstance> {
//     //#region @backendFunc
//     const commands = await this.crud.getAll<CommandInstance>(CommandInstance) as CommandInstance[];
//     let cmd;
//     if (buildCommand) {
//       cmd = commands.find(c => {
//         return (c.location === location && c.isBuildCommand)
//       });
//     } else {
//       cmd = commands.find(c => {
//         return (c.location === location && !c.isBuildCommand)
//       });
//       if (!cmd) {
//         cmd = commands.find(c => {
//           return (c.location === location && c.isBuildCommand)
//         });
//       }
//     }
//     return cmd;
//     //#endregion
//   }
//   //#endregion

//   //#region api / run command
//   async runCommand(cmd: CommandInstance) {
//     //#region @backend
//     // console.log('global', global.start)
//     if (cmd && _.isString(cmd.command) && cmd.command.trim() !== '') {
//       await global.start(cmd.command.split(' '), config['frameworkName'], global['frameworkMode']);
//     } else {
//       Helpers.error(`Last ${cmd.isBuildCommand ? 'build' : ''} command for location: ${cmd.location} doen't exists`, false, true);
//     }
//     //#endregion
//   }
//   //#endregion

//   //#region api / run last command
//   async runLastCommandIn(location: string) {
//     //#region @backend
//     const commands = await this.crud.getAll<CommandInstance>(CommandInstance) as CommandInstance[];
//     const cmd = commands.find(c => c.location === location)
//     if (cmd && _.isString(cmd.command) && cmd.command.trim() !== '') {
//       await global.start(cmd.command.split(' '), config['frameworkName'], global['frameworkMode']);
//     } else {
//       Helpers.error(`Last command for location: ${cmd.location} doen't exists`, false, true);
//     }
//     //#endregion
//   }
//   //#endregion

//   //#endregion
// }
