//#region @backend
import * as  psList from 'ps-list';
import { TnpDB } from '../index';
import { CommandInstance } from '../index';
import { Models } from 'tnp-models';
import { Helpers } from 'tnp-helpers';
import { DBProcMonitor } from './db-proc-monitor.backend';
import { DBMonitTop } from './monit-top.backend';
import { DBMonitCommands } from './monit-commands.backend';
declare const global: any;
declare const ENV: any;
const config = ENV.config as any;

export async function $LAST(args: string) {
  const db = await TnpDB.Instance(config.dbLocation);
  const last = db.lastCommandFrom(process.cwd());
  // console.log('last commadn to run', last)
  await db.runCommand(!!last ? last : new CommandInstance(undefined, process.cwd()));
  // process.exit(0)
}

const $DB = async (args: string) => {
  const db = await TnpDB.Instance(config.dbLocation);

  if (args.trim() === 'reinit') {
    await db.init()
    db.transaction.setCommand('tnp db reinit')
  } else {
    db.transaction.setCommand('tnp db')
  }

  process.exit(0)
}


async function $MONIT_TOP() {
  const db = await TnpDB.Instance(config.dbLocation);
  (new DBMonitTop(db)).start();

}

async function $MONIT_COMMANDS() {
  const db = await TnpDB.Instance(config.dbLocation);
  (new DBMonitCommands(db)).start();

}

async function $EXISTS(args: string) {
  const pid = Number(args.trim())
  const ps: Models.system.PsListInfo[] = await psList();
  console.log(`process.pid: ${process.pid}`)
  console.log(`pid to check: ${pid}`)
  console.log(!!ps.find(p => p.pid === pid))
  process.exit(0)
}

async function $PROC_MONITOR() {
  const db = await TnpDB.Instance(config.dbLocation);
  (new DBProcMonitor(db)).start();

}

const $DB_REINIT = () => {
  return $DB('reinit')
};


export default {
  $PROC_MONITOR: Helpers.CLIWRAP($PROC_MONITOR, '$PROC_MONITOR'),
  $MONIT_TOP: Helpers.CLIWRAP($MONIT_TOP, '$MONIT_TOP'),
  $MONIT_COMMANDS: Helpers.CLIWRAP($MONIT_COMMANDS, '$MONIT_COMMANDS'),
  $DB: Helpers.CLIWRAP($DB, '$DB'),
  $DB_REINIT: Helpers.CLIWRAP($DB_REINIT, '$DB_REINIT'),
  $LAST: Helpers.CLIWRAP($LAST, '$LAST'),
  $EXISTS: Helpers.CLIWRAP($EXISTS, '$EXISTS')
}

//#endregion
