import * as _ from 'lodash';
import { describe } from 'mocha'
import { expect, use } from 'chai'
import { Models } from 'tnp-models';
import { PortInstance } from '../entites/port-instance';

describe('Ports type spec', () => {



  it('should compare correcly simple number types', async function () {

    (() => {
      let t1 = new PortInstance(3000)
      let t2 = new PortInstance(3000)
      expect(t1.includes(t2)).to.be.true;
    })();

    (() => {
      let t1 = new PortInstance(3000)
      let t2 = new PortInstance(2000)
      expect(t1.includes(t2)).to.be.false;
    })();

  });


  it('it should compare correcly array types', async function () {

    (() => {
      let t1 = new PortInstance([2000, 3000, 4000])
      let t2 = new PortInstance([2000])
      expect(t1.includes(t2)).to.be.true;
    })();

    (() => {
      let t1 = new PortInstance([2000, 3000, 4000])
      let t2 = new PortInstance([5000])
      expect(t1.includes(t2)).to.be.false;
    })();

    (() => {
      let t1 = new PortInstance([])
      let t2 = new PortInstance([])
      expect(t1.includes(t2)).to.be.false;
    })();

    (() => {
      let t1 = new PortInstance([1, 2, 3])
      let t2 = new PortInstance([3, 2, 1])
      expect(t1.includes(t2)).to.be.true;
    })();

  });


  it('it should compare correcly range types', async function () {

    (() => {
      let t1 = new PortInstance(Models.other.Range.from(3000).to(5000))
      let t2 = new PortInstance(Models.other.Range.from(4000).to(4500))
      expect(t1.includes(t2)).to.be.true;
    })();

    (() => {
      let t1 = new PortInstance(Models.other.Range.from(3000).to(5000))
      let t2 = new PortInstance(Models.other.Range.from(3000).to(5000))
      expect(t1.includes(t2)).to.be.true;
    })();

    (() => {
      let t1 = new PortInstance(Models.other.Range.from(3000).to(5000))
      let t2 = new PortInstance(Models.other.Range.from(2000).to(4500))
      expect(t1.includes(t2)).to.be.false;
    })();

    (() => {
      let t1 = new PortInstance(Models.other.Range.from(3000).to(5000))
      let t2 = new PortInstance(Models.other.Range.from(4000).to(5500))
      expect(t1.includes(t2)).to.be.false;
    })();

    (() => {
      let t1 = new PortInstance(Models.other.Range.from(3000).to(5000))
      let t2 = new PortInstance(Models.other.Range.from(2000).to(5500))
      expect(t1.includes(t2)).to.be.false;
    })();


  });

  describe('it should compare correcly mixed types', function () {


    it('it should compare correcly number and range ', function () {
      (() => {
        let t1 = new PortInstance(3000)
        let t2 = new PortInstance(Models.other.Range.from(2000).to(5500))
        expect(t1.includes(t2)).to.be.true;
      })();

      (() => {
        let t1 = new PortInstance(Models.other.Range.from(2000).to(5500))
        let t2 = new PortInstance(3000)
        expect(t1.includes(t2)).to.be.true;
      })();
    });

    it('it should compare correcly array and range ', function () {

      (() => {
        let t1 = new PortInstance([3000])
        let t2 = new PortInstance(Models.other.Range.from(2000).to(5500))
        expect(t1.includes(t2)).to.be.true;
      })();

      (() => {
        let t1 = new PortInstance(Models.other.Range.from(2000).to(5500))
        let t2 = new PortInstance([3000])
        expect(t1.includes(t2)).to.be.true;
      })();

      (() => {
        let t1 = new PortInstance([3000])
        let t2 = new PortInstance(Models.other.Range.from(4000).to(5500))
        expect(t1.includes(t2)).to.be.false;
      })();

      (() => {
        let t1 = new PortInstance(Models.other.Range.from(4000).to(5500))
        let t2 = new PortInstance([3000])
        expect(t1.includes(t2)).to.be.false;
      })();

      (() => {
        let t1 = new PortInstance([3000])
        let t2 = new PortInstance(Models.other.Range.from(2000).to(2500))
        expect(t1.includes(t2)).to.be.false;
      })();

      (() => {
        let t1 = new PortInstance(Models.other.Range.from(2000).to(2500))
        let t2 = new PortInstance([3000])
        expect(t1.includes(t2)).to.be.false;
      })();

    });

    it('it should compare correcly array and number ', function () {
      (() => {
        let t1 = new PortInstance(3000)
        let t2 = new PortInstance([2000, 3000, 5000])
        expect(t1.includes(t2)).to.be.true;
      })();

      (() => {
        let t1 = new PortInstance([2000, 3000, 5000])
        let t2 = new PortInstance(3000)
        expect(t1.includes(t2)).to.be.true;
      })();

      (() => {
        let t1 = new PortInstance(4000)
        let t2 = new PortInstance([2000, 3000, 5000])
        expect(t1.includes(t2)).to.be.false;
      })();

      (() => {
        let t1 = new PortInstance([2000, 3000, 5000])
        let t2 = new PortInstance(4000)
        expect(t1.includes(t2)).to.be.false;
      })();

    });


  });



});
