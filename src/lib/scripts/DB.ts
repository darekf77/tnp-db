// import { config } from 'tnp-config';
// //#region @backend
// import { psList } from 'tnp-core';
// import { DBProcMonitor } from './db-proc-monitor.backend';
// import { DBMonitTop } from './monit-top.backend';
// import { DBMonitCommands } from './monit-commands.backend';
// //#endregion
// import { TnpDB } from '../index';
// import { Models } from 'tnp-models';
// import { Helpers } from 'tnp-helpers';
// import { CommandInstance } from '../entites/command-instance';
// declare const global: any;

// export async function $LAST(args: string) {
//   //#region @backend
//   const db = await TnpDB.Instance();
//   const last = await db.lastCommandFrom(process.cwd(), false);
//   // console.log('last commadn to run', last)
//   await db.runCommand(!!last ? last : CommandInstance.from(undefined, process.cwd()));
//   // process.exit(0)
//   //#endregion
// }

// export async function $LAST_BUILD(args: string) {
//   //#region @backend
//   const db = await TnpDB.Instance();
//   const last = await db.lastCommandFrom(process.cwd(), true);
//   // console.log('last commadn to run', last)
//   await db.runCommand(!!last ? last : CommandInstance.from(undefined, process.cwd(), true));
//   // process.exit(0)
//   //#endregion
// }

// export async function $SHOW_LAST(args: string) {
//   //#region @backend
//   // console.log(args)
//   global.muteMessages = true;
//   const db = await TnpDB.Instance();
//   const last = await db.lastCommandFrom(process.cwd(), true);
//   global.muteMessages = false;
//   process.stdout.write(last.command);
//   // console.log('last commadn to run', last)
//   // await db.runCommand(!!last ? last : new CommandInstance(undefined, process.cwd(), true));
//   process.exit(0);
//   //#endregion
// }

// const $DB = async (args: string) => {
//   //#region @backend
//   if (args.trim() === 'reinit') {
//     global.reinitDb = true;
//     const db = await TnpDB.Instance();
//     await db.setCommand(`${config.frameworkName} db reinit`);
//   } else {
//     const db = await TnpDB.Instance();
//     await db.setCommand(`${config.frameworkName} db`);
//   }
//   process.exit(0);
//   //#endregion
// };


// async function $MONIT_TOP() {
//   //#region @backend
//   const db = await TnpDB.Instance();
//   await (new DBMonitTop(db)).start();
//   //#endregion
// }

// async function $MONIT_COMMANDS() {
//   //#region @backend
//   const db = await TnpDB.Instance();
//   await (new DBMonitCommands(db)).start();
//   //#endregion
// }

// async function $EXISTS(args: string) {
//   //#region @backend
//   const pid = Number(args.trim());
//   const ps: Models.system.PsListInfo[] = await psList();
//   Helpers.log(`process.pid: ${process.pid}`);
//   Helpers.log(`pid to check: ${pid}`);
//   // console.log(!!ps.find(p => p.pid === pid))
//   process.exit(0);
//   //#endregion
// }

// async function $PROC_MONITOR() {
//   //#region @backend
//   const db = await TnpDB.Instance();
//   await (new DBProcMonitor(db)).start();
//   //#endregion
// }

// const $DB_REINIT = () => {
//   //#region @backend
//   return $DB('reinit');
//   //#endregion
// };


// export default {
//   //#region @backend
//   $PROC_MONITOR: Helpers.CLIWRAP($PROC_MONITOR, '$PROC_MONITOR'),
//   $MONIT_TOP: Helpers.CLIWRAP($MONIT_TOP, '$MONIT_TOP'),
//   $MONIT_COMMANDS: Helpers.CLIWRAP($MONIT_COMMANDS, '$MONIT_COMMANDS'),
//   $DB: Helpers.CLIWRAP($DB, '$DB'),
//   $DB_REINIT: Helpers.CLIWRAP($DB_REINIT, '$DB_REINIT'),
//   $LAST: Helpers.CLIWRAP($LAST, '$LAST'),
//   $LAST_BUILD: Helpers.CLIWRAP($LAST_BUILD, '$LAST_BUILD'),
//   $SHOW_LAST: Helpers.CLIWRAP($SHOW_LAST, '$SHOW_LAST'),
//   $EXISTS: Helpers.CLIWRAP($EXISTS, '$EXISTS'),
//   //#endregion
// };


