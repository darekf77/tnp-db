//#region @backend
import * as _ from 'lodash'
import { CLASS } from 'typescript-class-helpers'

export abstract class DBBaseEntity<T=any> {
  abstract isEqual(anotherInstace: DBBaseEntity<any>): boolean;


  entityName() {
    return DBBaseEntity.entityNameFromClassName(CLASS.getNameFromObject(this) as string)
  }

  public static entityNameFromClassName(className: string) {
    className = className.replace('Instance', 's')
    if (className.endsWith('sss')) { // ex. processes
      className = className.replace('sss', 'sses')
    }
    return _.lowerCase(className)
  }

}
//#endregion
