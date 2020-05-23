//#region @backend
import * as _ from 'lodash';
import { Models } from 'tnp-models';
import { DBBaseEntity } from './base-entity';
import { CLASS } from 'typescript-class-helpers';

export type PortIdType = number | number[] | Models.other.Range;

@CLASS.NAME('PortInstance')
export class PortInstance extends DBBaseEntity {

  constructor(
    public id?: PortIdType,
    public reservedFor?: Models.other.IProject | Models.system.SystemService) {
    super()
    if (_.isArray(id)) {
      this.id = _.sortBy(id);
    }
  }

  addIdIfPossible(id: PortIdType): boolean {
    if (_.isNumber(this.id) && _.isNumber(id)) {
      this.id = [this.id, id];
      return true;
    }
    if (_.isArray(this.id) && _.isNumber(id)) {
      if (!this.id.includes(id)) {
        this.id.push(id);
        this.makeSmaller()
        return true;
      }
    }
    if (_.isObject(this.id) && _.isNumber(id)) {
      const idRange = this.id as Models.other.Range;
      if (idRange.to + 1 === id) {
        idRange.to = id;
        return true;
      }
    }


    return false;
  }

  get isFree() {
    return !this.reservedFor;
  }

  get size() {
    if (_.isUndefined(this.id)) {
      console.log(this)
      throw `Undefined id for instace above`
    }

    if (_.isNumber(this.id)) {
      return 1;
    }
    if (_.isArray(this.id)) {
      return this.id.length;
    }
    // console.log('THIS ID',this.id)
    return (this.id as Models.other.Range).length;
  }

  isEqual(port: PortInstance) {
    if (!port) {
      return false;
    }
    return _.isEqual(this.id, port.id);
  }

  get sortIndex() {
    if (_.isNumber(this.id)) {
      return this.id;
    }
    if (_.isArray(this.id)) {
      return _.first(this.id);
    }
    return (this.id as Models.other.Range).from;
  }


  /**
   * [1] => 1
   * [1,2,3,4,5] => Range(0 to 5)
   * Range(1 to 1) => 1
   */
  makeSmaller() {
    if (_.isArray(this.id)) {
      if (this.id.length === 0) {
        this.id = _.first(this.id);
        return;
      }
      if (_.first(this.id) + (this.id.length - 1) === _.last(this.id)) {
        this.id = Models.other.Range.from(_.first(this.id)).to(_.last(this.id))
        return
      }
    }
    if (_.isObject(this.id)) {
      const rangeId = this.id as Models.other.Range;
      if (rangeId.from === rangeId.to) {
        this.id = rangeId.from;
        return;
      }
    }
  }

  includes(anotherInstance: PortInstance) {
    const anotherId = anotherInstance.id;

    // simple types
    if (_.isNumber(this.id) && _.isNumber(anotherId)) {
      return this.id === anotherId;
    }

    if (_.isArray(this.id) && _.isArray(anotherId)) {
      return anotherId.filter(another => {
        return (this.id as number[]).includes(another);
      }).length > 0;
    }

    if (_.isObject(this.id) && !_.isArray(this.id) &&
      _.isObject(anotherId) && !_.isArray(anotherId)) {
      const idRange = this.id as Models.other.Range;
      const anotherIdRange = anotherId as Models.other.Range;
      return idRange.contains(anotherIdRange);
    }

    // mixed types
    if (_.isNumber(this.id) && _.isArray(anotherId)) {
      return anotherId.includes(this.id);
    }

    if (_.isNumber(this.id) && _.isObject(anotherId)) {
      return (anotherId as Models.other.Range).contains(this.id);
    }

    if (_.isArray(this.id) && _.isNumber(anotherId)) {
      return this.id.includes(anotherId)
    }

    if (_.isArray(this.id) && _.isObject(anotherId) && !_.isArray(anotherId)) {
      return this.id.filter(num => (anotherId as Models.other.Range).contains(num))
        .length === this.id.length;
    }

    if (_.isObject(this.id) && !_.isArray(this.id) && _.isNumber(anotherId)) {
      return (this.id as Models.other.Range).contains(anotherId)
    }

    if (_.isObject(this.id) && !_.isArray(this.id) && _.isArray(anotherId)) {
      return (anotherId as number[]).filter(num => (this.id as Models.other.Range).contains(num))
        .length === (anotherId as number[]).length;
    }
    // console.warn('Port instacne unknow types')
    return false;
  }


}
//#endregion
