import { Helpers } from 'tnp-helpers';
import { TnpDB } from '../wrapper-db.backend';
import { CLASS } from 'typescript-class-helpers';
import { Project } from 'tnp-helpers';

export class DBProcMonitor {

  constructor(private db: TnpDB) {

  }

  async start() {
    await this.repeat();
  }

  private async repeat(n = 0) {

    await this.db.updateProcesses();
    const builds = await this.db.getBuilds();
    Helpers.clearConsole();
    Helpers.log(`\n===== Check counter: ${n}, projects: ${Project.projects.length} === `)
    builds.forEach(b => {
      Helpers.log(`${b.pid}\t${b.location}\t${b.cmd}\t${b.buildOptions && b.buildOptions.watch}\n`);
    });
    // console.log('waiting')
    setTimeout(async () => {
      await this.repeat(n + 1);
    }, 1000)
  }

}
