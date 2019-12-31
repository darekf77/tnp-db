//#region @backend
import * as _ from 'lodash';
import { start } from '../../start.backend';
import { Helpers } from '../../helpers';

import { BaseController } from './base-controlller';
import { CommandInstance } from '../entites/command-instance';
import { Project } from '../../project';
import { BuildOptions } from '../../project/features';
import { CLASS } from 'typescript-class-helpers';


@CLASS.NAME('CommandsController')
export class CommandsController extends BaseController {
  async addExisted() {

  }

  async update() {

  }


  lastCommandFrom(location: string): CommandInstance {
    const commands = this.crud.getAll<CommandInstance>(CommandInstance) as CommandInstance[];
    const cmd = commands.find(c => c.location === location)
    return cmd;
  }

  async runCommand(cmd: CommandInstance) {

    if (cmd && _.isString(cmd.command) && cmd.command.trim() !== '') {
      await start(cmd.command.split(' '), void 0);
    } else {
      Helpers.error(`Last command for location: ${cmd.location} doen't exists`, false, true);
    }

  }
  async runLastCommandIn(location: string) {
    const commands = this.crud.getAll<CommandInstance>(CommandInstance) as CommandInstance[];
    const cmd = commands.find(c => c.location === location)
    if (cmd) {
      await start(cmd.command.split(' '), void 0);
    } else {
      Helpers.error(`Last command for location: ${cmd.location} doen't exists`, false, true);
    }
  }

  updateCommandBuildOptions(location: string, buildOptions: BuildOptions) {
    const cmd = this.lastCommandFrom(location);
    if (cmd) {
      const clients = _.isArray(buildOptions.forClient) ? (buildOptions.forClient as Project[]).map(c => {
        return `--forClient ${c.name}`
      }).join(' ') : '';

      const copyto = _.isArray(buildOptions.copyto) ? (buildOptions.copyto as Project[]).map(c => {
        return `--copyto ${c.location}`
      }).join(' ') : '';

      cmd.command = cmd.command + ' ' + clients + ' ' + copyto;
      this.crud.set(cmd)
    } else {
      Helpers.warn(`Cannot update unexisted last commadn in location: ${location}`)
    }
  }


}
//#endregion
