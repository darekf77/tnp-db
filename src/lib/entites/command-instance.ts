//#region imports
//#region isomorphic
import { config } from 'tnp-config';
import { _ } from 'tnp-core';
import { CLASS } from 'typescript-class-helpers';
import { Models, DBBaseEntity } from 'tnp-models';
//#endregion
//#endregion

@CLASS.NAME('CommandInstance') // @ts-ignore
export class CommandInstance extends DBBaseEntity<CommandInstance>{

  //#region static methods

  //#region static methods / from
  public static from(
    command?: string,
    location?: string,
    isBuildCommand: boolean = false,
  ) {
    const ins = new CommandInstance({ command, location, isBuildCommand });
    ins.assignProps();
    return ins;
  }
  //#endregion

  //#region static methods / fixed command
  public static fixedCommand(command: string) {
    //#region @backendFunc
    // console.log(`command to fix: ${command}`)
    if (!command) {
      return command;
    }
    const args = command.split(' ');
    const shortCoreToolsNames = (config.coreBuildFrameworkNames as string[]);
    const i = args.findIndex(arg => {
      const ends = (shortCoreToolsNames.filter(s => arg.endsWith(`/bin/${s}`)).length > 0);
      return ends;
    });
    if (i === -1) {
      return command;
    }
    // console.log('founded index', i)
    const res = `${config.frameworkName} ${args.slice(i + 1, args.length).join(' ')}`;
    // console.log('res', res)
    return res;
    //#endregion
  }
  //#endregion

  //#endregion

  //#region fields & getters
  public command?: string;
  public location?: string;
  public isBuildCommand = false;

  //#region fields & getters / short command for last command
  get shortCommandForLastCommand() {
    if (!this.command) {
      return '';
    }
    const args = this.command.split(' ');
    if (_.first(args) === 'tnp') {
      return `tnp ${args[1]}`;
    }

    const tnpArg = args.find(arg => arg.endsWith(`/bin/tnp`));

    const i = args.indexOf(tnpArg);
    if (i < args.length - 1) {
      return `tnp ${args[i + 1]}`;
    }
    return '';
  }
  //#endregion

  //#endregion

  //#region api

  //#region api / prepare instance
  async prepareInstance(reason?: string): Promise<DBBaseEntity<any>> {
    return this;
  }
  //#endregion

  //#region api / get raw data
  async getRawData(): Promise<object> {
    const { command, location, isBuildCommand } = this;
    return {
      command,
      location,
      isBuildCommand
    };
  }
  //#endregion

  //#region api / assign props
  assignProps(): void {
    this.location = this.data.location;
    this.isBuildCommand = !!this.data.isBuildCommand;
    this.command = CommandInstance.fixedCommand(this.data.command);
  }
  //#endregion

  //#region api / is equal
  isEqual(anotherInstace: CommandInstance): boolean {
    return (this.location === anotherInstace.location && this.isBuildCommand === anotherInstace.isBuildCommand);
  }
  //#endregion

  //#endregion
}
