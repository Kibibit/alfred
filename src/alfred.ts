import Jenkins = require('jenkins');
import { isNumber, get } from 'lodash';

export interface IParameters {
  [ key: string ]: any;
}

export interface IResult {
  result: string;
}

export class Alfred {
  private jenkins: Jenkins.JenkinsAPI;

  constructor(username: string, password: string, instanceUrl: string) {
    this.jenkins = Jenkins({
      baseUrl: `https://${ username }:${ password }@${ instanceUrl }`,
      crumbIssuer: true
    });
  }

  runJob(name: string, parameters: IParameters): Promise<number> {
    return new Promise((resolve, reject) => {
      // start building a job
      this.jenkins.job.build({ name, parameters }, function (err, data) {
        if (err) { return reject(err); }

        resolve(data);
      });
    });
  }

  async runAndMonitorJob(name: string, parameters: IParameters, interval?: number): Promise<String> {
    const queueId = await this.runJob(name, parameters);
    const buildId = await this.waitJobToExistQueue(name, queueId, interval);
    return await this.waitForJobToFinish(name, buildId);
  }

  private async waitJobToExistQueue(name: string, queueId: number, interval: number = 5000): Promise<number> {
    const data = await this.convertQueueIdToBuildId(queueId);

    if (isNumber(data)) {
      return data;
    }

    await this.waitFor(interval);
    return await this.waitJobToExistQueue(name, queueId, interval);
  }

  private convertQueueIdToBuildId(queueId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.jenkins.queue.item(queueId, (err, data) => {
        if (err) {
          return reject(err);
        }

        resolve(get(data, 'executable.number'));
      });
    });
  }

  private async waitForJobToFinish(jobName: string, buildId: number, interval: number = 5000): Promise<string> {
    const data = await this.getJobStatus(jobName, buildId);

    if ('SUCCESS' === data) {
      return data;
    }

    if ([ 'ABORTED', 'FAILURE' ].indexOf(data) > -1) {
      const errorMessage = `JENKINS[${ jobName }:${ buildId }] job ${ data }`;
      throw new Error(errorMessage);
    }

    await this.waitFor(interval);
    return await this.waitForJobToFinish(jobName, buildId, interval);
  }

  private getJobStatus(jobName: string, buildId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      this.jenkins.build.get(jobName, buildId, function (err, data) {
        if (err) {
          return reject(err);
        }

        resolve(get(data, 'result'));
      });
    });
  }

  private waitFor(interval: number): Promise<void> {
    return new Promise((resolve) => setTimeout(() => resolve(), interval));
  }

}
