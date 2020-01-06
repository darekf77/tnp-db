//#region @backend
import * as path from 'path';
import * as fse from 'fs-extra';
import * as rimraf from 'rimraf';
import { CLASS } from 'typescript-class-helpers';
import { mocks } from './mocks';
import { Helpers } from 'tnp-helpers'

const dbPath = path.join(process.cwd(), 'tmp-db.json');

const config = {
  dbLocation: dbPath,
  pathes: {
    tmp_transaction_pid_txt: path.join(process.cwd(), 'tmp-transaciton-pid.txt')
  }
}


if (!global['ENV']) {
  global['ENV'] = {};
}
global['ENV']['config'] = config;

import { TnpDB } from './wrapper-db';

import { DB } from './index';

export default async function () {
  mocks();
  rimraf.sync(dbPath);
  const db = await TnpDB.Instance(dbPath);

  const param = process.argv[2];
  const keysparams = Object.keys(DB);
  let fromParam = false;
  for (let index = 0; index < keysparams.length; index++) {
    const key = keysparams[index];
    const isMatch = Helpers.cliTool.match(key, process.argv.slice(2));
    if (isMatch) {
      console.log('adsasda!!', key)
      fromParam = true;
      DB[key]();
      process.stdin.resume();
      break;
    }
  }
  if (!fromParam) {

    const projects = db.getProjects();
    console.log(projects.map(p => path.basename(p.project.location)))
    console.log('done!')
  }

}
//#endregion
