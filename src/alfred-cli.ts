#!/usr/bin/env node
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import fs from 'fs-extra';
import { join } from 'path';

import { Alfred } from './alfred';
import { header } from './assets/ansi-header';

const alfredDetails = fs.readJSONSync(join(__dirname, `../package.json`));

const optionDefinitions = [
  {
    name: 'username',
    alias: 'u',
    type: String,
    typeLabel: '{underline username}',
    description: 'The jenkins username to run the jobs with'
  },
  {
    name: 'password',
    alias: 'p',
    type: String,
    typeLabel: '{underline password}',
    description: 'The jenkins password for the given username'
  },
  {
    name: 'instance-url',
    alias: 'i',
    type: String,
    typeLabel: '{underline url}',
    description: 'Jenkins instance URL'
  },
  {
    name: 'job',
    alias: 'j',
    type: String,
    typeLabel: '{underline jobName}',
    description: 'The specific job to run'
  },
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Show help'
  }
];

const sections = [
  {
    content: header,
    raw: true
  },
  {
    header: `Alfred v${ alfredDetails.version }`,
    content: alfredDetails.description
  },
  {
    header: 'Options',
    optionList: optionDefinitions
  }
]

const options = commandLineArgs(optionDefinitions);
const usage = commandLineUsage(sections);

if (options.help) {
  console.log(usage);

  process.exit(0);
}

if (!options.username || !options.password || !options[ 'instance-url' ] || !options.job) {
  console.error('username, password, and instance-job are required');
  process.exit(1);
}

const alfred = new Alfred(options.username, options.password, options[ 'instance-url' ]);

alfred.runAndMonitorJob(options.job, {})
  .then(() => process.exit(0));
