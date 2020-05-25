import * as _ from 'lodash';
import * as path from 'path';
import { describe } from 'mocha'
import { expect, use } from 'chai'
import { Project } from 'tnp-bundle';
import { Models } from 'tnp-models';
import { PortInstance } from '../entites/port-instance';
import { PortsSet } from '../controllers/ports-set.backend';


describe('Ports set tests', () => {


  const baseline = Project.From(path.join(Project.Tnp.location, '../firedev-projects', 'container', 'baseline'));
  const tnp = Project.Tnp;


  it('should call save after each add', async function () {

    let saveCallCounter = 0;
    let s = new PortsSet([], () => {
      saveCallCounter++;
    })

    await s.add(new PortInstance(Models.other.Range.from(3000).to(4000)))
    await s.add(new PortInstance(80, new Models.system.SystemService('http')))
    await s.add(new PortInstance([21, 22], new Models.system.SystemService('System communication')))
    await s.add(new PortInstance(Models.other.Range.from(4100).to(4110), baseline))

    expect(saveCallCounter).to.be.eq(4);


  });

  it('should calculate,remove,add,update correcly', async function () {

    let s = new PortsSet([
      new PortInstance([2000, 2001])
    ])

    expect(s.numOfFreePortsAvailable).to.be.eq(2)
    await s.update(new PortInstance([2000, 2001], new Models.system.SystemService('test')))
    expect(s.numOfFreePortsAvailable).to.be.eq(0)

    const twoThousandsFreePors = new PortInstance(Models.other.Range.from(3000).to(5000))
    await s.add(twoThousandsFreePors)
    expect(s.numOfFreePortsAvailable).to.be.eq(2000)
    expect(s.numOfAllPortsAvailable).to.be.eq(2002)
    await s.remove(twoThousandsFreePors)
    expect(s.numOfFreePortsAvailable).to.be.eq(0)
    expect(s.numOfAllPortsAvailable).to.be.eq(2)



  });

  it('should return project ports', async function () {

    let baselinePorts = [
      new PortInstance(3000, baseline),
      new PortInstance(4000, baseline)
    ]

    let s = new PortsSet([
      new PortInstance([2000, 2001]),
      ...baselinePorts
    ])

    expect(_.isEqual(s.getReserverFor(baseline), baselinePorts)).to.be.true;

    baselinePorts = []

    expect(_.isEqual(s.getReserverFor(baseline), baselinePorts)).to.be.false;

  });


  it('should reserve correcly ports for standalone porject', async function () {

    let s = new PortsSet([
      new PortInstance(4000, baseline),
      new PortInstance(6000),
      new PortInstance(Models.other.Range.from(7000).to(7005))
    ])

    expect(await s.reserveFreePortsFor(tnp)).to.be.true;

  });

  it('should reserve correcly ports for workspace porject', async function () {

    let s = new PortsSet([
      new PortInstance(4000),
      new PortInstance(6000),
      new PortInstance(Models.other.Range.from(7000).to(7010))
    ])

    expect(await s.reserveFreePortsFor(baseline)).to.be.true;
    expect(s.numOfTakenPortsAvailable).to.be.eq(baseline.children.length + 1)

  });

  it('should not reserve ports if is not a space', async function () {

    let s = new PortsSet([
      new PortInstance(Models.other.Range.from(7000).to(baseline.children.length))
    ])

    expect(await s.reserveFreePortsFor(baseline)).to.be.false;

  });


});
