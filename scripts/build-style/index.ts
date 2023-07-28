import { runCopy } from './copy';
import { buildAllStyles } from './buildAllStyles';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function build({
  allStylesOutputFile,
  ...opts
}: { watch: boolean; allStylesOutputFile: string }) {
  if (opts.watch) {
    return runCopy(opts);
  }
  return Promise.all([buildAllStyles(allStylesOutputFile), runCopy(opts)]);
}

export { runCopy };
