//#region @backend
import * as _ from 'lodash';
declare const global: any;
// const start = global.start as any;
import { Helpers } from 'tnp-helpers';

import { BaseController } from './base-controlller';
import { CommandInstance } from '../entites/command-instance';
import { CLASS } from 'typescript-class-helpers';
import { Models } from 'tnp-models';


@CLASS.NAME('CommandsController')
export class CommandsController extends BaseController {
  async addExisted() {

  }

  async update() {

  }


  lastCommandFrom(location: string, buildCommand = false): CommandInstance {
    const commands = this.crud.getAll<CommandInstance>(CommandInstance) as CommandInstance[];
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
  }

  async runCommand(cmd: CommandInstance) {
    // console.log('global', global.start)

    if (cmd && _.isString(cmd.command) && cmd.command.trim() !== '') {
      await global.start(cmd.command.split(' '), void 0);
    } else {
      Helpers.error(`Last ${cmd.isBuildCommand ? 'build' : ''} command for location: ${cmd.location} doen't exists`, false, true);
    }

  }
  async runLastCommandIn(location: string) {
    const commands = this.crud.getAll<CommandInstance>(CommandInstance) as CommandInstance[];
    const cmd = commands.find(c => c.location === location)
    if (cmd) {
      await global.start(cmd.command.split(' '), void 0);
    } else {
      Helpers.error(`Last command for location: ${cmd.location} doen't exists`, false, true);
    }
  }

  updateCommandBuildOptions(location: string, buildOptions: Models.dev.IBuildOptions) {
    const cmd = this.lastCommandFrom(location, true);
    if (cmd) {
      const clients = _.isArray(buildOptions.forClient) ? (buildOptions.forClient as any[])
        .map((c: Models.other.IProject) => {
          return `--forClient ${c.name}`
        }).join(' ') : '';

      const copyto = _.isArray(buildOptions.copyto) ? (buildOptions.copyto as any[])
        .map((c: Models.other.IProject) => {
          return `--copyto ${c.location}`
        }).join(' ') : '';

      cmd.command = cmd.command + ' ' + clients + ' ' + copyto;
      this.crud.set(cmd)
    }
    // else {
    //   Helpers.warn(`Cannot update unexisted last commadn in location: ${location}`)
    // }
  }


}
//#endregion
