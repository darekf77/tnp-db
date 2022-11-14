export { DbDaemonController } from 'firedev-crud-deamon';
export * from './build-options';
export * from './wrapper-db';

import * as _DB from './scripts/DB';

export const DB = _DB.default;


export const CLI_FUNCTIONS = [
  //#region @backend
  _DB.$LAST,
  _DB.$LAST_BUILD,
  _DB.$SHOW_LAST,
  DB.$DB,
  DB.$DB_REINIT,
  //#endregion
];

export function asdas() {

}
