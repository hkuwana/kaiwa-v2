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

	// Simplified 2-week focused plan
	const getNextWeekday = (dayOfWeek: number, hour: number = 16) => {
		const date = new Date(now);
		const daysUntil = (dayOfWeek - date.getDay() + 7) % 7;
		if (daysUntil === 0 && date.getHours() >= hour) {
			date.setDate(date.getDate() + 7); // Next week if today already passed
		} else {
			date.setDate(date.getDate() + daysUntil);
		}
		date.setHours(hour, 0, 0, 0);
		return date;
	};

	// Week 1: Foundation
	events.push({
		uid: 'demo-video@kaiwa',
		start: getNextWeekday(1, 14), // Monday 2pm
		end: getNextWeekday(1, 15),
		summary: '🎥 Record 30-45s demo video',
		desc: 'Use existing Reddit script template. Keep it simple and authentic.'
	});

	events.push({
		uid: 'founder-email@kaiwa',
		start: getNextWeekday(3, 16), // Wednesday 4pm
		end: getNextWeekday(3, 17),
		summary: '📧 Send founder story email',
		desc: 'Use existing template. Include demo video link and gentle share ask.'
	});

	events.push({
		uid: 'reddit-founder@kaiwa',
		start: getNextWeekday(5, 18), // Friday 6pm
		end: getNextWeekday(5, 19),
		summary: '📝 Post Reddit founder story',
		desc: 'Use template with demo link in comments. Disclose self-promo.'
	});

	// Week 2: Activation
	const week2Start = addDays(getNextWeekday(1), 7);

	events.push({
		uid: 'personal-outreach@kaiwa',
		start: new Date(week2Start.getTime()),
		end: addDays(week2Start, 0),
		summary: '💬 Personal outreach (10 people)',
		desc: 'Message friends/family who know your ICP. Use personal template.'
	});

	events.push({
		uid: 'reddit-practical@kaiwa',
		start: addDays(week2Start, 2),
		end: addDays(week2Start, 2),
		summary: '📝 Post Reddit practical guide',
		desc: 'Use "emotional convos" template. Link in comments.'
	});

	events.push({
		uid: 'bts-email@kaiwa',
		start: addDays(week2Start, 4),
		end: addDays(week2Start, 4),
		summary: '📧 Send BTS email',
		desc: 'Behind-the-scenes story. Include demo. Invite replies.'
	});

	// Daily check-ins for first 5 days
	for (let i = 0; i < 5; i++) {
		const checkDate = addDays(now, i);
		checkDate.setHours(9, 0, 0, 0);
		events.push({
			uid: `check-${i}@kaiwa`,
			start: checkDate,
			end: addDays(checkDate, 0),
			summary: '✅ Quick progress check',
			desc: "Review yesterday's action. Plan today's priority."
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
		lines.push(`DTEND:${toICSDate(new Date(ev.start.getTime() + 60 * 60 * 1000))}`); // 1 hour
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
