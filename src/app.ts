//#region @backend
import * as path from 'path';
import * as rimraf from 'rimraf';
import { CLASS } from 'typescript-class-helpers';


// import program from 'commander'; TODO
// program.version('0.0.1');

const config = {
  pathes: {
    tmp_transaction_pid_txt: path.join(process.cwd(), 'tmp-transaciton-pid.txt')
  }
}

if (!global['ENV']) {
  global['ENV'] = {};
}
global['ENV']['config'] = config;

import { Project } from 'tnp-bundle';
import { TnpDB } from './wrapper-db';

export default async function () {

  CLASS.setName(Project, 'Project');

  const dbPath = path.join(process.cwd(), 'tmp-db.json');
  rimraf.sync(dbPath);
  const db = await TnpDB.Instance(dbPath);
  const projects = db.getProjects();
  console.log(projects.length)

}
//#endregion
