// src/ssr/registry.ts
import type { SsrRegistry } from './types';
import { scoopSSR }   from './projects/scoop.ssr';
import { rotarySSR }  from './projects/rotary.ssr';
import { datavizSSR } from './projects/dataviz.ssr';
import { dynamicSSR } from './projects/dynamic.ssr';
import { gameSSR } from './projects/game.ssr';

export const ssrRegistry: SsrRegistry = {
  scoop:   scoopSSR,
  rotary:  rotarySSR,
  dataviz: datavizSSR,
  dynamic: dynamicSSR,
  game: gameSSR,
};
