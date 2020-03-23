//#region @backend
export * from './wrapper-db.backend';
import * as _DB from './scripts/DB.backend';

// console.log('asd')
export const DB = _DB.default;

export const CLI_FUNCTIONS = [
  _DB.$LAST,
  _DB.$LAST_BUILD,
  _DB.$SHOW_LAST,
]

//#endregion
export function asdas() {

}
