import { defineLexiconConfig } from '@atcute/lex-cli'

export default defineLexiconConfig({
  files: ['lexicons/**/*.json'],
  outdir: 'src/lib/services/atlex/',
  imports: ['@atcute/lexicon-community', '@atcute/bluesky', '@atcute/atproto'],
  pull: {
    outdir: 'lexicons/',
    clean: true,
    sources: [
      {
        type: 'git',
        remote: 'https://tangled.org/cosmik.network/semble/',
        ref: 'main',
        pattern: ['src/modules/atproto/infrastructure/lexicons/*.json']
      },
    ]
  }
});
