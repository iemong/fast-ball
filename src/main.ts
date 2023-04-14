import { serve } from 'https://deno.land/std@0.140.0/http/server.ts';
import { DOMParser } from 'https://deno.land/x/deno_dom/deno-dom-wasm.ts';

type Status = 'beforeMatch' | 'afterMatch' | 'duringMatch';

type Match = {
  teams: string[];
  score: string[];
  status: Status;
};

const statusMap = new Map([['見どころ', 'beforeMatch'], ['試合終了', 'afterMatch'], ['試合中', 'duringMatch']]);

const url = 'https://baseball.yahoo.co.jp/npb/schedule';

// const url = 'https://baseball.yahoo.co.jp/npb/schedule/?date=2023-04-11'

serve(async (_req) => {
  const res = await fetch(url);
  const html = await res.text();

  const document = new DOMParser().parseFromString(
    html,
    'text/html',
  );

  const $gameCard = document.querySelector('#gm_card');

  const teams = $gameCard.querySelectorAll('.bb-score__team');
  const scores = $gameCard.querySelectorAll('.bb-score__status');
  const links = $gameCard.querySelectorAll('.bb-score__link');

  const result = Array.from(teams).reduce<Match[]>((acc, team, index) => {
    const teams = team.textContent.trim().split('\n').map((t: string) => t.trim());
    const score = scores[index].textContent.trim().split('-');
    const link = links[index].textContent.trim();
    acc.push({
      teams,
      score,
      status: statusMap.get(link) || 'beforeMatch',
    });
    return acc;
  }, []);

  return new Response(JSON.stringify({ data: result }), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
});
