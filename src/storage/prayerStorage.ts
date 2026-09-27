import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	addLocalDays,
	getLocalDateKey,
	parseLocalDateKey,
} from "../utils/localDate";

const STORAGE_KEY = "prayer_tracker_v1";
export const DAILY_COMPLETION_POINTS = 50;

export const PRAYER_IDS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
export type PrayerId = (typeof PRAYER_IDS)[number];
export type PrayerDay = Record<PrayerId, boolean>;

export const PRAYER_BADGES = [
	{
		id: "first-complete-day",
		title: "First Complete Day",
		icon: "🌙",
		days: 1,
	},
	{
		id: "seven-complete-days",
		title: "7 Complete Days",
		icon: "⭐",
		days: 7,
	},
	{
		id: "thirty-complete-days",
		title: "30 Complete Days",
		icon: "🕌",
		days: 30,
	},
	{
		id: "hundred-complete-days",
		title: "100 Complete Days",
		icon: "✨",
		days: 100,
	},
] as const;

export type PrayerStorageData = {
	totalBarakahPoints: number;
	prayerHistory: Record<string, PrayerDay>;
	rewardedDates: string[];
	unlockedBadges: string[];
};

export type PrayerStreak = { currentStreak: number; longestStreak: number };

export type PrayerUpdateResult = {
	data: PrayerStorageData;
	rewardGranted: boolean;
	newlyUnlockedBadges: string[];
	persisted: boolean;
};

const emptyPrayerDay = (): PrayerDay => ({
	fajr: false,
	dhuhr: false,
	asr: false,
	maghrib: false,
	isha: false,
});

const emptyStorageData = (): PrayerStorageData => ({
	totalBarakahPoints: 0,
	prayerHistory: {},
	rewardedDates: [],
	unlockedBadges: [],
});

let cachedStorageData: PrayerStorageData | null = null;
let hasUnsavedChanges = false;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizePrayerDay(value: unknown): PrayerDay {
	const record = isRecord(value) ? value : {};
	return Object.fromEntries(
		PRAYER_IDS.map((id) => [id, record[id] === true]),
	) as PrayerDay;
}

function normalizeStorageData(value: unknown): PrayerStorageData {
	if (!isRecord(value)) return emptyStorageData();

	const prayerHistory: Record<string, PrayerDay> = {};
	if (isRecord(value.prayerHistory)) {
		for (const [dateKey, day] of Object.entries(value.prayerHistory)) {
			if (parseLocalDateKey(dateKey))
				prayerHistory[dateKey] = normalizePrayerDay(day);
		}
	}

	return {
		totalBarakahPoints: Math.max(0, Number(value.totalBarakahPoints) || 0),
		prayerHistory,
		rewardedDates: Array.isArray(value.rewardedDates)
			? value.rewardedDates.filter(
					(date): date is string =>
						typeof date === "string" && !!parseLocalDateKey(date),
				)
			: [],
		unlockedBadges: Array.isArray(value.unlockedBadges)
			? value.unlockedBadges.filter(
					(badge): badge is string => typeof badge === "string",
				)
			: [],
	};
}

async function readStorageData(): Promise<{
	data: PrayerStorageData;
	readable: boolean;
}> {
	try {
		const saved = await AsyncStorage.getItem(STORAGE_KEY);
		if (!hasUnsavedChanges) {
			cachedStorageData = saved
				? normalizeStorageData(JSON.parse(saved))
				: emptyStorageData();
		}
		return {
			data: cachedStorageData ?? emptyStorageData(),
			readable: true,
		};
	} catch (error) {
		console.warn("Prayer data could not be loaded:", error);
		return {
			data: cachedStorageData ?? emptyStorageData(),
			readable: false,
		};
	}
}

export async function getPrayerStorageData(): Promise<PrayerStorageData> {
	return (await readStorageData()).data;
}

export function getPrayerDay(
	data: PrayerStorageData,
	dateKey: string,
): PrayerDay {
	return { ...emptyPrayerDay(), ...(data.prayerHistory[dateKey] ?? {}) };
}

export function getCompletedPrayerCount(day: PrayerDay): number {
	return PRAYER_IDS.filter((id) => day[id]).length;
}

export function isPrayerDayComplete(day: PrayerDay): boolean {
	return PRAYER_IDS.every((id) => day[id]);
}

export function getPrayerStreak(
	data: PrayerStorageData,
	todayKey: string,
): PrayerStreak {
	const today = parseLocalDateKey(todayKey);
	if (!today) return { currentStreak: 0, longestStreak: 0 };

	const completedKeys = Object.entries(data.prayerHistory)
		.filter(([, day]) => isPrayerDayComplete(day))
		.map(([dateKey]) => dateKey)
		.sort();
	const completedDates = new Set(completedKeys);

	let currentStreak = 0;
	let cursor = isPrayerDayComplete(getPrayerDay(data, todayKey))
		? today
		: addLocalDays(today, -1);
	while (completedDates.has(getLocalDateKey(cursor))) {
		currentStreak += 1;
		cursor = addLocalDays(cursor, -1);
	}

	let longestStreak = 0;
	let runLength = 0;
	let previousDate: Date | null = null;
	for (const dateKey of completedKeys) {
		const date = parseLocalDateKey(dateKey);
		if (!date) continue;
		runLength =
			previousDate &&
			getLocalDateKey(addLocalDays(previousDate, 1)) === dateKey
				? runLength + 1
				: 1;
		longestStreak = Math.max(longestStreak, runLength);
		previousDate = date;
	}

	return { currentStreak, longestStreak };
}

let updateQueue: Promise<void> = Promise.resolve();

export function togglePrayerCompletion(
	dateKey: string,
	prayerId: PrayerId,
): Promise<PrayerUpdateResult> {
	const operation = updateQueue.then(async () => {
		const stored = await readStorageData();
		if (!stored.readable) {
			return {
				data: stored.data,
				rewardGranted: false,
				newlyUnlockedBadges: [],
				persisted: false,
			};
		}
		const data = stored.data;
		const day = getPrayerDay(data, dateKey);
		day[prayerId] = !day[prayerId];
		data.prayerHistory[dateKey] = day;

		const rewardGranted =
			isPrayerDayComplete(day) && !data.rewardedDates.includes(dateKey);
		if (rewardGranted) {
			data.totalBarakahPoints += DAILY_COMPLETION_POINTS;
			data.rewardedDates.push(dateKey);
		}

		const completedDays = Object.values(data.prayerHistory).filter(
			isPrayerDayComplete,
		).length;
		const newlyUnlockedBadges = PRAYER_BADGES.filter(
			(badge) =>
				completedDays >= badge.days &&
				!data.unlockedBadges.includes(badge.id),
		).map((badge) => badge.id);
		data.unlockedBadges.push(...newlyUnlockedBadges);

		let persisted = false;
		try {
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
			cachedStorageData = data;
			hasUnsavedChanges = false;
			persisted = true;
		} catch (error) {
			console.warn("Prayer data could not be saved:", error);
			cachedStorageData = data;
			hasUnsavedChanges = true;
		}

		return { data, rewardGranted, newlyUnlockedBadges, persisted };
	});

	updateQueue = operation.then(
		() => undefined,
		() => undefined,
	);
	return operation;
}
