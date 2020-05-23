declare const ENV;
import { Project } from 'tnp-bundle';
import * as _ from 'lodash';
import * as low from 'lowdb';
import * as path from 'path';
import * as fse from 'fs-extra';
import FileSync = require('lowdb/adapters/FileSync');
import { CLASS } from 'typescript-class-helpers';

import { describe } from 'mocha';
import { expect, use } from 'chai';

// import { Helpers } from 'tnp-helpers';
// import { Models } from 'tnp-models';
import { BuildInstance, CommandInstance, ProjectInstance } from '../index';

import { DBBaseEntity } from '../entites/base-entity';
import { DbCrud } from '../db-crud';
import { PortInstance, DomainInstance } from '../entites';


function db() {
  let location = path.join(__dirname, '..', 'tmp-test-db.json');
  if(fse.existsSync(location)) {
    fse.unlinkSync(location);
  }
  let adapter = new FileSync(location)
  let db = low(adapter)
  return db;
}


class TestInstance extends DBBaseEntity {


  constructor(public value: number) {
    super()
  }

  isEqual(anotherInstace: TestInstance): boolean {
    return this.value === anotherInstace.value;
  }

}


describe('Db crud', () => {

  Project.projects.length;

  it('should handle other types that (ports,domain,projects,commands,builds)', async function () {

    let crud = new DbCrud(db())
    const entityName = DBBaseEntity.entityNameFromClassName(CLASS.getName(TestInstance));
    expect(entityName).to.be.eq('tests');

    let defaultValues = {};
    defaultValues[entityName] = []
    await crud.clearDBandReinit(defaultValues)

    expect((await crud.getAll(TestInstance)).length).to.be.eq(0)

    await crud.addIfNotExist(new TestInstance(1))

    expect((await crud.getAll(TestInstance)).length).to.be.eq(1)

  });

  it('should handle ports', async function () {

    let crud = new DbCrud(db())
    const entityName = DBBaseEntity.entityNameFromClassName(CLASS.getName(PortInstance));
    expect(entityName).to.be.eq('ports');

    let defaultValues = {};
    defaultValues[entityName] = []
    await crud.clearDBandReinit(defaultValues)

    expect((await crud.getAll(PortInstance)).length).to.be.eq(0)

    await crud.addIfNotExist(new PortInstance(5000))

    expect((await crud.getAll(PortInstance)).length).to.be.eq(1)

  });



  it('should handle domains', async function () {

    let crud = new DbCrud(db())
    const entityName = DBBaseEntity.entityNameFromClassName(CLASS.getName(DomainInstance));
    expect(entityName).to.be.eq('domains');

    let defaultValues = {};
    defaultValues[entityName] = []
    await crud.clearDBandReinit(defaultValues)

    expect((await crud.getAll(DomainInstance)).length).to.be.eq(0)

    await crud.addIfNotExist(new DomainInstance('onet.pl'))

    expect((await crud.getAll(DomainInstance)).length).to.be.eq(1)

  });


  it('should handle builds', async function () {

    let crud = new DbCrud(db())
    const entityName = DBBaseEntity.entityNameFromClassName(CLASS.getName(BuildInstance));
    expect(entityName).to.be.eq('builds');

    let defaultValues = {};
    defaultValues[entityName] = []
    await crud.clearDBandReinit(defaultValues)

    expect((await crud.getAll(BuildInstance)).length).to.be.eq(0)

    await crud.addIfNotExist(new BuildInstance())

    expect((await crud.getAll(BuildInstance)).length).to.be.eq(1)

  });


  it('should handle commands', async function () {

    let crud = new DbCrud(db())
    const entityName = DBBaseEntity.entityNameFromClassName(CLASS.getName(CommandInstance));
    expect(entityName).to.be.eq('commands');

    let defaultValues = {};
    defaultValues[entityName] = []
    await crud.clearDBandReinit(defaultValues)

    expect((await crud.getAll(CommandInstance)).length).to.be.eq(0)

    await crud.addIfNotExist(new CommandInstance())

    expect((await crud.getAll(CommandInstance)).length).to.be.eq(1)

  });


  it('should handle projects', async function () {

    let crud = new DbCrud(db())
    const entityName = DBBaseEntity.entityNameFromClassName(CLASS.getName(ProjectInstance));
    expect(entityName).to.be.eq('projects');

    let defaultValues = {};
    defaultValues[entityName] = []
    await crud.clearDBandReinit(defaultValues)

    expect((await crud.getAll(ProjectInstance)).length).to.be.eq(0)

    await crud.addIfNotExist(new ProjectInstance())

    expect((await crud.getAll(ProjectInstance)).length).to.be.eq(1)

    const loc = '/asdasd';

    await crud.addIfNotExist(new ProjectInstance(loc))

    expect((await crud.getAll(ProjectInstance)).length).to.be.eq(2)

    await crud.remove(new ProjectInstance(loc))

    expect((await crud.getAll(ProjectInstance)).length).to.be.eq(1)

    await crud.set(new ProjectInstance('/asdasdaaaa'))

    expect((await crud.getAll(ProjectInstance)).length).to.be.eq(2)
    // QUICK_FIX
    // crud.setBulk([new ProjectInstance('/jhk'), new ProjectInstance('/asd'), new ProjectInstance('/aa')], PortInstance)

    // expect((await crud.getAll(ProjectInstance)).length).to.be.eq(3)

  });



});
