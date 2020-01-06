//#region @backend
export * from './wrapper-db';
import * as _DB from './scripts/DB.backend';


export const DB = _DB.default;
export const $LAST = _DB.$LAST;
//#endregion
