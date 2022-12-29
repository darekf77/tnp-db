//#region imports
//#region isomorphic
import { _ } from 'tnp-core';
import { Helpers, Project } from 'tnp-helpers';
import { CLASS } from 'typescript-class-helpers';
import { Models, BaseController } from 'tnp-models';
import { config } from 'tnp-config';
import { DbCrud } from 'firedev-crud';
//#endregion
import { CommandInstance } from '../entites/command-instance';
import { BuildOptions } from '../build-options';
import { ProjectInstance } from 'firedev-crud';
//#endregion

declare const global: any;
@CLASS.NAME('CommandsController')
export class CommandsController extends BaseController<DbCrud> {
  //#region api

  //#region api / add existed
  async addExisted(scope: { previousCommands?: CommandInstance[] }) {
    return;
    //#region @backendFunc
    const previousCommands = scope?.previousCommands || [];
    Helpers.log(`[db][reinit] adding existed commands`);
    const projecsLocaitons = (await this.crud.getAll<ProjectInstance>(ProjectInstance)).map(p => p.locationOfProject);
    return previousCommands.filter(c => projecsLocaitons.includes(c.location));
    //#endregion
  }
  //#endregion

  //#region api / update
  async update() {

  }
  //#endregion

  //#region api / last command from
  async lastCommandFrom(location: string, buildCommand = false): Promise<CommandInstance> {
    //#region @backendFunc
    // @ts-ignore
    const commands = await this.crud.getAll<CommandInstance>(CommandInstance) as CommandInstance[];
    let cmd;
    if (buildCommand) {
      cmd = commands.find(c => {
        return (c.location === location && c.isBuildCommand)
      });
    } else {
      cmd = commands.find(c => {
        return (c.location === location && !c.isBuildCommand)
      });
      if (!cmd) {
        cmd = commands.find(c => {
          return (c.location === location && c.isBuildCommand)
        });
      }
    }
    return cmd;
    //#endregion
  }
  //#endregion

  //#region api / run command
  async runCommand(cmd: CommandInstance) {
    //#region @backend
    // console.log('global', global.start)
    if (cmd && _.isString(cmd.command) && cmd.command.trim() !== '') {
      await global.start(cmd.command.split(' '), config['frameworkName'], global['frameworkMode']);
    } else {
      Helpers.error(`Last ${cmd.isBuildCommand ? 'build' : ''} command for location: ${cmd.location} doen't exists`, false, true);
    }
    //#endregion
  }
  //#endregion

  //#region api / run last command
  async runLastCommandIn(location: string) {
    //#region @backend
    // @ts-ignore
    const commands = await this.crud.getAll<CommandInstance>(CommandInstance) as CommandInstance[];
    const cmd = commands.find(c => c.location === location)
    if (cmd && _.isString(cmd.command) && cmd.command.trim() !== '') {
      await global.start(cmd.command.split(' '), config['frameworkName'], global['frameworkMode']);
    } else {
      Helpers.error(`Last command for location: ${cmd.location} doen't exists`, false, true);
    }
    //#endregion
  }
  //#endregion

  //#region api / update command build options
  async updateCommandBuildOptions(location: string, buildOptions: BuildOptions) {
    return;
    //#region @backend
    Helpers.log('getting last cmd')
    const cmd = await this.lastCommandFrom(location, true);
    if (cmd) {
      const clients = _.isArray(
        buildOptions.forClient) ? (
          Helpers.arrays.uniqArray<Project>(buildOptions.forClient, 'location') as any[]
        )
          .map((c: Project) => {
            return `--forClient ${c.name}`
          }).join(' ') : '';

      const copyto = _.isArray(buildOptions.copyto) ?
        (Helpers.arrays.uniqArray<Project>(buildOptions.copyto, 'location') as any[])
          .map((c: Project) => {
            return `--copyto ${c.location}`
          }).join(' ') : '';

      cmd.command = cmd.shortCommandForLastCommand + ' ' + clients + ' ' + copyto;
      // @ts-ignore
      await this.crud.set(cmd)
    }
    // else {
    //   Helpers.warn(`Cannot update unexisted last commadn in location: ${location}`)
    // }
    //#endregion
  }
  //#endregion

  //#endregion
}
