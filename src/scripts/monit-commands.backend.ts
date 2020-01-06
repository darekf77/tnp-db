import * as  psList from 'ps-list';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { TnpDB } from '../wrapper-db';


export class DBMonitCommands {

  constructor(private db: TnpDB) {

  }

  async start() {
    this.repeat();
  }

  counter = 0;
  private repeat(n = 0) {
    const cmds = this.db.getCommands();
    Helpers.clearConsole();
    Helpers.info(`COMMANDS ${++this.counter} :`)
    cmds.forEach(p => {
      Helpers.log(`\t${p.location}\t${p.command}\t${p.shortCommandForLastCommand}\n`);
    });

    setTimeout(() => {
      this.repeat(n + 1)
    }, 1000);
  }

}
