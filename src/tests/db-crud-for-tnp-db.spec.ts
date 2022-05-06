import { Project } from 'tnp-helpers';
import * as low from 'lowdb';
import { crossPlatformPath, path, fse, _ } from 'tnp-core';
import FileSync = require('lowdb/adapters/FileSync');
import { CLASS } from 'typescript-class-helpers';

import { describe, it } from 'mocha';
import { expect, use } from 'chai';

import { Helpers } from 'tnp-helpers';
import { Models } from 'tnp-models';

import { BuildInstance, CommandInstance, DomainInstance } from '../entites';
import { PortInstance } from 'firedev-ports';
import { DbCrud, ProjectInstance } from 'firedev-crud';


function db() {
  const location = path.join(crossPlatformPath(__dirname), '../../tmp-test-db.json');
  if (fse.existsSync(location)) {
    fse.unlinkSync(location);
  }
  const adapter = new FileSync(location);
  const res = low(adapter);
  return res;
}

// @ts-ignore

class TestInstance extends DBBaseEntity {
  getRawData(): Promise<object> {
    throw new Error('Method not implemented.');
  }
  assignProps(): void {
    throw new Error('Method not implemented.');
  }

  async prepareInstance() {
    return void 0 as any;
  }


  constructor(public value: number) {
    super();
  }

  isEqual(anotherInstace: TestInstance): boolean {
    return this.value === anotherInstace.value;
  }

}


describe('Db crud for tnp-db', () => {

  Project.projects.length;

  it('should handle other types that (ports,domain,projects,commands,builds)', async function () {

    const crud = new DbCrud(db() as any, void 0);
    const entityName = Models.db.entityNameFromClassName(CLASS.getName(TestInstance));
    expect(entityName).to.be.eq('tests');

    const defaultValues = {};
    defaultValues[entityName] = [];
    await crud.clearDBandReinit(defaultValues);

    expect((await crud.getAll(TestInstance)).length).to.be.eq(0);

    await crud.addIfNotExist(new TestInstance(1));

    expect((await crud.getAll(TestInstance)).length).to.be.eq(1);

  });

  it('should handle ports', async function () {

    const crud = new DbCrud(db() as any, void 0);
    const entityName = Models.db.entityNameFromClassName(CLASS.getName(PortInstance));
    expect(entityName).to.be.eq('ports');

    const defaultValues = {};
    defaultValues[entityName] = [];
    await crud.clearDBandReinit(defaultValues);

    expect((await crud.getAll(PortInstance)).length).to.be.eq(0);

    await crud.addIfNotExist(PortInstance.from(5000));

    expect((await crud.getAll(PortInstance)).length).to.be.eq(1);

  });



  it('should handle domains', async function () {

    const crud = new DbCrud(db() as any, void 0);
    const entityName = Models.db.entityNameFromClassName(CLASS.getName(DomainInstance));
    expect(entityName).to.be.eq('domains');

    const defaultValues = {};
    defaultValues[entityName] = [];
    await crud.clearDBandReinit(defaultValues);

    expect((await crud.getAll(DomainInstance)).length).to.be.eq(0);

    await crud.addIfNotExist(DomainInstance.from('onet.pl'));

    expect((await crud.getAll(DomainInstance)).length).to.be.eq(1);

  });


  it('should handle builds', async function () {

    const crud = new DbCrud(db() as any, void 0);
    const entityName = Models.db.entityNameFromClassName(CLASS.getName(BuildInstance));
    expect(entityName).to.be.eq('builds');

    const defaultValues = {};
    defaultValues[entityName] = [];
    await crud.clearDBandReinit(defaultValues);

    expect((await crud.getAll(BuildInstance)).length).to.be.eq(0);

    await crud.addIfNotExist(BuildInstance.from());

    expect((await crud.getAll(BuildInstance)).length).to.be.eq(1);

  });


  it('should handle commands', async function () {

    const crud = new DbCrud(db() as any, void 0);
    const entityName = Models.db.entityNameFromClassName(CLASS.getName(CommandInstance));
    expect(entityName).to.be.eq('commands');

    const defaultValues = {};
    defaultValues[entityName] = [];
    await crud.clearDBandReinit(defaultValues);

    expect((await crud.getAll(CommandInstance)).length).to.be.eq(0);

    await crud.addIfNotExist(CommandInstance.from());

    expect((await crud.getAll(CommandInstance)).length).to.be.eq(1);

  });


  it('should handle projects', async function () {

    const crud = new DbCrud(db() as any, void 0);
    const entityName = Models.db.entityNameFromClassName(CLASS.getName(ProjectInstance));
    expect(entityName).to.be.eq('projects');

    const defaultValues = {};
    defaultValues[entityName] = [];
    await crud.clearDBandReinit(defaultValues);

    expect((await crud.getAll(ProjectInstance)).length).to.be.eq(0);

    await crud.addIfNotExist(ProjectInstance.from(void 0));

    expect((await crud.getAll(ProjectInstance)).length).to.be.eq(1);

    const loc = '/asdasd';

    await crud.addIfNotExist(ProjectInstance.from(loc));

    expect((await crud.getAll(ProjectInstance)).length).to.be.eq(2);

    await crud.remove(ProjectInstance.from(loc));

    expect((await crud.getAll(ProjectInstance)).length).to.be.eq(1);

    await crud.set(ProjectInstance.from('/asdasdaaaa'));

    expect((await crud.getAll(ProjectInstance)).length).to.be.eq(2);
    // QUICK_FIX
    // crud.setBulk([new ProjectInstance('/jhk'), new ProjectInstance('/asd'), new ProjectInstance('/aa')], PortInstance)

    // expect((await crud.getAll(ProjectInstance)).length).to.be.eq(3)

  });



});
