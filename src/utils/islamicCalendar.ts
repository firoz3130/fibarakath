import {
	addLocalDays,
	differenceInLocalDays,
	getLocalDateKey,
} from "./localDate";

export type HijriDate = {
	day: number;
	month: number;
	year: number;
	monthName: string;
	calendar: "Umm al-Qura" | "tabular";
};

export type IslamicEvent = {
	id: string;
	title: string;
	month: number;
	day: number;
	icon: string;
	note?: string;
};

export type UpcomingIslamicEvent = IslamicEvent & {
	date: Date;
	daysUntil: number;
};

export const ISLAMIC_EVENTS: IslamicEvent[] = [
	{
		id: "islamic-new-year",
		title: "Islamic New Year",
		month: 1,
		day: 1,
		icon: "🌙",
	},
	{ id: "ashura", title: "Ashura", month: 1, day: 10, icon: "🕯️" },
	{
		id: "mawlid",
		title: "Mawlid",
		month: 3,
		day: 12,
		icon: "✨",
		note: "Observed by many communities",
	},
	{ id: "ramadan", title: "Ramadan", month: 9, day: 1, icon: "🌙" },
	{
		id: "laylat-al-qadr",
		title: "Laylat al-Qadr (commonly observed)",
		month: 9,
		day: 27,
		icon: "⭐",
		note: "The Night of Decree is sought in the last ten nights",
	},
	{ id: "eid-al-fitr", title: "Eid al-Fitr", month: 10, day: 1, icon: "🎉" },
	{ id: "hajj", title: "Hajj begins", month: 12, day: 8, icon: "🕋" },
	{ id: "arafah", title: "Day of Arafah", month: 12, day: 9, icon: "🤲" },
	{ id: "eid-al-adha", title: "Eid al-Adha", month: 12, day: 10, icon: "🐑" },
];

const MONTH_FORMATTERS: Record<string, Intl.DateTimeFormat> = {};
const DATE_FORMATTERS: Record<string, Intl.DateTimeFormat> = {};

function getHijriParts(
	date: Date,
	calendar: "Umm al-Qura" | "tabular",
): HijriDate | null {
	const calendarId =
		calendar === "Umm al-Qura" ? "islamic-umalqura" : "islamic";
	try {
		const formatter = (DATE_FORMATTERS[calendarId] ??=
			new Intl.DateTimeFormat(`en-u-ca-${calendarId}-nu-latn`, {
				day: "numeric",
				month: "numeric",
				year: "numeric",
			}));
		const parts = formatter.formatToParts(date);
		const day = Number(parts.find((part) => part.type === "day")?.value);
		const month = Number(
			parts.find((part) => part.type === "month")?.value,
		);
		const year = Number(parts.find((part) => part.type === "year")?.value);
		if (
			![day, month, year].every(Number.isFinite) ||
			month < 1 ||
			month > 12
		)
			return null;

		const monthFormatter = (MONTH_FORMATTERS[calendarId] ??=
			new Intl.DateTimeFormat(`en-u-ca-${calendarId}-nu-latn`, {
				month: "long",
			}));
		return {
			day,
			month,
			year,
			monthName: monthFormatter.format(date),
			calendar,
		};
	} catch {
		return null;
	}
}

export function getHijriDate(date: Date): HijriDate | null {
	return getHijriParts(date, "Umm al-Qura") ?? getHijriParts(date, "tabular");
}

export function formatGregorianDate(date: Date): string {
	return new Intl.DateTimeFormat("en", {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date);
}

export function getHijriMonthDates(anchor: Date): Date[] {
	const anchorParts = getHijriDate(anchor);
	if (!anchorParts) return [];

	let first = new Date(anchor);
	first.setHours(12, 0, 0, 0);
	for (let count = 0; count < 30; count += 1) {
		const previous = addLocalDays(first, -1);
		const previousParts = getHijriDate(previous);
		if (
			previousParts?.month !== anchorParts.month ||
			previousParts.year !== anchorParts.year
		)
			break;
		first = previous;
	}

	const dates: Date[] = [];
	for (let count = 0; count < 31; count += 1) {
		const current = addLocalDays(first, count);
		const currentParts = getHijriDate(current);
		if (
			currentParts?.month !== anchorParts.month ||
			currentParts.year !== anchorParts.year
		)
			break;
		dates.push(current);
	}
	return dates;
}

export function shiftHijriMonth(anchor: Date, amount: number): Date {
	const dates = getHijriMonthDates(anchor);
	if (!dates.length) return new Date(anchor);
	return amount > 0
		? addLocalDays(dates[dates.length - 1], 1)
		: addLocalDays(dates[0], -1);
}

export function getIslamicEventsOnDate(date: Date): IslamicEvent[] {
	const hijriDate = getHijriDate(date);
	return hijriDate
		? ISLAMIC_EVENTS.filter(
				(event) =>
					event.month === hijriDate.month &&
					event.day === hijriDate.day,
			)
		: [];
}

export function getUpcomingIslamicEvents(
	fromDate: Date,
	limit = 4,
): UpcomingIslamicEvent[] {
	const today = new Date(fromDate);
	today.setHours(12, 0, 0, 0);
	const found: UpcomingIslamicEvent[] = [];

	for (let offset = 0; offset <= 370 && found.length < limit; offset += 1) {
		const date = addLocalDays(today, offset);
		for (const event of getIslamicEventsOnDate(date)) {
			found.push({
				...event,
				date,
				daysUntil: differenceInLocalDays(today, date),
			});
		}
	}
	return found;
}

export function isSameLocalDate(first: Date, second: Date): boolean {
	return getLocalDateKey(first) === getLocalDateKey(second);
}
