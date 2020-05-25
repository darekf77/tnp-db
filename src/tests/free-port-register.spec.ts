import * as _ from 'lodash';
import { describe } from 'mocha'
import { expect, use } from 'chai'
import { Models } from 'tnp-models';
import { PortInstance } from '../entites/port-instance';
import { PortsSet } from '../controllers/ports-set.backend';

describe('Free port registration', () => {


  it('should compare correcly simple number types', async function () {

    (() => {
      let s = new PortsSet([
        new PortInstance(Models.other.Range.from(3000).to(5000))
      ])

      s.registerOnFreePort({
        name: 'test-service'
      })

      let t1 = new PortInstance(3000)
      let t2 = new PortInstance(3000)
      expect(t1.includes(t2)).to.be.true;
    })();

  })
});
