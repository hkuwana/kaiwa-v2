import type { RequestHandler } from '@sveltejs/kit';

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function toICSDate(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function addDays(d: Date, days: number) {
  const nd = new Date(d);
  nd.setDate(d.getDate() + days);
  return nd;
}

export const GET: RequestHandler = async () => {
  const now = new Date();
  const events: { uid: string; start: Date; end: Date; summary: string; desc?: string }[] = [];

  // Content cadence: 4 weeks
  for (let w = 0; w < 4; w++) {
    const base = addDays(now, w * 7);
    const monday = new Date(base);
    monday.setDate(base.getDate() + ((1 - base.getDay() + 7) % 7)); // next Monday
    monday.setHours(16, 0, 0, 0); // 4pm local
    const wed = addDays(monday, 2);
    wed.setHours(16, 0, 0, 0);
    const fri = addDays(monday, 4);
    fri.setHours(16, 0, 0, 0);

    events.push({
      uid: `blog-${w}@kaiwa`,
      start: monday,
      end: addDays(monday, 0),
      summary: `Ship blog + LP (JP/ES scenario)`
    });
    events.push({
      uid: `shorts-${w}@kaiwa`,
      start: wed,
      end: addDays(wed, 0),
      summary: `Publish 3 Shorts (scenario demo)`
    });
    events.push({
      uid: `newsletter-${w}@kaiwa`,
      start: fri,
      end: addDays(fri, 0),
      summary: `Send weekly newsletter`,
      desc: 'Include latest blog + video + reply/contact block'
    });
  }

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kaiwa//Marketing Cadence//EN'
  ];
  for (const ev of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.uid}`);
    lines.push(`DTSTAMP:${toICSDate(now)}`);
    lines.push(`DTSTART:${toICSDate(ev.start)}`);
    lines.push(`DTEND:${toICSDate(new Date(ev.start.getTime() + 60*60*1000))}`); // 1 hour
    lines.push(`SUMMARY:${ev.summary}`);
    if (ev.desc) lines.push(`DESCRIPTION:${ev.desc}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="kaiwa-marketing.ics"'
    }
  });
};

