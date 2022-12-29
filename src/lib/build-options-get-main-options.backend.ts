import { CLI } from 'tnp-cli';
import { config } from 'tnp-config';
import { path, _ } from 'tnp-core';
import { Helpers, Project } from "tnp-helpers";
export function getMainOptionsFun(args: string[]) {
  const ars = (config.argsReplacementsBuild as { [shortBuildName in string]: string } || {});
  const shortValuesArgs = Object.keys(ars);
  const toCheckArgs = Object.values(ars);
  const toCheckArgsSimplfied = Object.values(ars).map(c => Helpers.cliTool.simplifiedCmd(c));

  const ind = args.findIndex((p, i) => {
    const ends = ((config.coreBuildFrameworkNames as string[] || []).filter(c => {
      return p.endsWith(`/${c}`) || p === c;
    }).length > 0);

    const nextArgExisted = !!args[i + 1];
    if (nextArgExisted && shortValuesArgs.includes(args[i + 1])) {
      args[i + 1] = ars[args[i + 1]];
    }
    if (nextArgExisted && toCheckArgsSimplfied.includes(Helpers.cliTool.simplifiedCmd(args[i + 1]))) {
      // @ts-ignore
      args[i + 1] = toCheckArgs.find(c => {
        return Helpers.cliTool.simplifiedCmd(c) === Helpers.cliTool.simplifiedCmd(args[i + 1]);
      });
    }

    return ends &&
      nextArgExisted &&
      (toCheckArgs
        .map(c => Helpers.cliTool.simplifiedCmd(c))
        .includes(Helpers.cliTool.simplifiedCmd(args[i + 1]))
      );
  });

  let prod = false,
    watch = false,
    uglify = false,
    obscure = false,
    nodts = false,
    outDir = 'dist',
    appBuild = false;

  if (ind >= 0) {
    const cmd = _.kebabCase(args[ind + 1]).split('-').slice(1);
    for (let index = 0; index < cmd.length; index++) {
      const cmdPart = cmd[index];
      if (cmdPart === 'lib') {
        outDir = 'dist';
      }
      if (cmdPart === 'dist' || cmdPart === 'bundle') {
        outDir = cmdPart;
      }
      if (cmdPart === 'app') {
        appBuild = true;
      }
      if (cmdPart === 'prod') {
        prod = true;
      }
      if (cmdPart === 'watch') {
        watch = true;
      }
      if (cmdPart === 'uglify') {
        uglify = true;
      }
      if (cmdPart === 'obscure') {
        obscure = true;
      }
      if (cmdPart === 'nodts') {
        nodts = true;
      }
    }
    return { prod, watch, outDir, appBuild, uglify, obscure };
  }
}
