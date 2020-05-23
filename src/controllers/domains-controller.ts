//#region @backend
import * as _ from 'lodash';

import { BaseController } from './base-controlller';
import { DomainInstance, ProjectInstance } from '../entites';
import { Models } from 'tnp-models';
import { CLASS } from 'typescript-class-helpers';

@CLASS.NAME('DomainsController')
export class DomainsController extends BaseController {

  async update() {

  }


  async addExisted() {
    const domains: DomainInstance[] = [];

    const Project = CLASS.getBy('Project');
    (await this.crud.getAll<ProjectInstance>(Project)).forEach((p) => {
      const project: Models.other.IProject = p.project;
      if (!project.isWorkspaceChildProject && project.env &&
        project.env.config && project.env.config.domain) {

        // console.log(`Domain detected: ${p.env.config.domain}, env:${p.env.config.name} `)
        const address = project.env.config.domain;
        const environment = project.env.config.name;
        this.addDomain(address, environment, domains, project);
      }

      if (project && project.env) {
        project.env.configsFromJs.forEach(c => {
          this.addDomain(c.domain, c.name, domains, project);
        })
      }


    })

    await this.crud.setBulk(domains, DomainInstance);
  }

  private addDomain(address: string, environment: Models.env.EnvironmentName,
    domains: DomainInstance[], project: Models.other.IProject) {

    if (!_.isString(address) || address.trim() === '') {
      return
    }

    const existed = domains.find(d => d.address === address);
    if (existed) {
      if (existed.declaredIn.filter(d => d.environment === environment
        && d.project === d.project).length === 0) {
        existed.declaredIn.push({ project, environment })
      }
    } else {
      const domain = new DomainInstance()
      domain.address = address;
      domain.declaredIn = [{ project, environment }]
      domains.push(domain)
    }
  }

}
//#endregion
