import * as  psList from 'ps-list';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { TnpDB } from '../wrapper-db.backend';


export class DBMonitCommands {

  constructor(private db: TnpDB) {

  }

  async start() {
    this.repeat();
  }

  counter = 0;
  private async repeat(n = 0) {
    const cmds = await this.db.getCommands();
    Helpers.clearConsole();
    Helpers.info(`COMMANDS ${++this.counter} :`)
    console.table(cmds)
    // cmds.forEach(p => {
    //   Helpers.log(`\t${p.location}\t${p.command}\t${p.shortCommandForLastCommand}\n`);
    // });

    setTimeout(async () => {
      await this.repeat(n + 1)
    }, 1000);
  }

}
