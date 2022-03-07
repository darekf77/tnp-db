//#region imports

//#region isomorphic
import { _ } from 'tnp-core';
import { Project, Helpers } from 'tnp-helpers';
import { CLASS } from 'typescript-class-helpers';
import { ConfigModels } from 'tnp-config';
import { Models, BaseController } from 'tnp-models';
import { DbCrud, ProjectInstance } from 'firedev-crud';
//#endregion
import { DomainInstance } from '../entites';

//#endregion

@CLASS.NAME('DomainsController')
export class DomainsController extends BaseController<DbCrud> {
  //#region api

  //#region api / update
  async update() {

  }
  //#endregion

  //#region api / add existed
  async addExisted() {
    //#region @backend
    Helpers.log(`[db][reinit] adding existed domains`);
    const domains: DomainInstance[] = [];


    (await this.crud.getAll<ProjectInstance>(Project)).forEach((p) => {
      const project: Project = p.project;
      if (project && !project.isWorkspaceChildProject && project.env &&
        project.env.config && project.env.config.domain) {

        // console.log(`Domain detected: ${p.env.config.domain}, env:${p.env.config.name} `)
        const address = project.env.config.domain;
        const environment = project.env.config.name;
        this.addDomain(address, environment, domains, project as any);
      }

      if (project && project.env) {
        project.env.configsFromJs.forEach(c => {
          this.addDomain(c.domain, c.name, domains, project as any);
        });
      }
    });

    await this.crud.setBulk(domains, DomainInstance);
    //#endregion
  }
  //#endregion

  //#region api / add domain
  private addDomain(
    address: string,
    environment: ConfigModels.EnvironmentName,
    domains: DomainInstance[],
    project: Project
  ) {
    //#region @backend
    if (!_.isString(address) || address.trim() === '') {
      return;
    }

    const existed = domains.find(d => d.address === address);
    if (existed) {
      if (existed.declaredIn.filter(d => d.environment === environment
        && d.project === d.project).length === 0) {
        existed.declaredIn.push({ project, environment });
      }
    } else {
      const domain = DomainInstance.from(address);
      domain.declaredIn = [{ project, environment }];
      domains.push(domain);
    }
    //#endregion
  }
  //#endregion

  //#endregion
}

