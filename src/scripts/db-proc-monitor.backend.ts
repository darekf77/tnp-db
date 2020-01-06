import { Helpers } from 'tnp-helpers';
import { TnpDB } from '../wrapper-db';
import { CLASS } from 'typescript-class-helpers';

export class DBProcMonitor {

  constructor(private db: TnpDB) {

  }

  async start() {
    this.repeat();
  }

  private repeat(n = 0) {
    const Project = CLASS.getBy('Project') as any;
    this.db.transaction.updateProcesses();
    const builds = this.db.getBuilds();
    Helpers.clearConsole();
    Helpers.log(`\n===== Check counter: ${n}, projects: ${Project.projects.length} === `)
    builds.forEach(b => {
      Helpers.log(`${b.pid}\t${b.location}\t${b.cmd}\t${b.buildOptions && b.buildOptions.watch}\n`);
    });
    // console.log('waiting')
    setTimeout(() => {
      this.repeat(n + 1);
    }, 1000)
  }

}
