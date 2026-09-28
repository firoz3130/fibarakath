import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getPrayerTimesForDate } from "../api/prayer";

const PRAYER_NUDGE_TYPE = "prayer-nudge";
const SCHEDULE_DAYS = 9;

const reminderMessages: Record<
	string,
	{ title: string; bodies: string[]; delayMinutes: number }
> = {
	Fajr: {
		title: "🌤️ Fajr has passed",
		delayMinutes: 45,
		bodies: [
			"A new day has begun. Begin it with Allah.",
			"Before the world wakes up, let your heart wake up.",
			"The night is leaving. Take one last moment with Allah.",
			"A quiet morning. A quiet heart. A moment with Allah.",
			"The first moments of your day are precious. Give one to Allah.",
			"Before the notifications begin, listen to the call of your heart.",
			"You were given another morning. Begin it with gratitude.",
			"Let your first steps today be towards Allah.",
			"The world can wait a moment. Your soul has been waiting.",
			"In the stillness of morning, remember the One who gave you this morning.",
		],
	},
	Dhuhr: {
		title: "☀️ Dhuhr is behind you",
		delayMinutes: 45,
		bodies: [
			"The day is moving quickly. Take a moment to slow down with Allah.",
			"In the middle of everything, don't forget the One who gave you everything.",
			"Pause the rush. Give your heart a moment.",
			"Your day needs a pause. Your heart does too.",
			"Between the tasks and the deadlines, leave a moment for Allah.",
			"You've been taking care of everything. Take care of your soul too.",
			"A busy day is no reason for a forgotten heart.",
			"Step away from the noise. Return to Allah.",
			"Just a little pause in a very busy day.",
			"The world asks for your attention. Allah asks you to remember Him.",
		],
	},
	Asr: {
		title: "🌿 A little reminder for your heart",
		delayMinutes: 45,
		bodies: [
			"The afternoon is passing. Take a moment before it does.",
			"Another part of your day has passed. How is your heart?",
			"You've made it this far today. Take a moment with Allah.",
			"Before the evening arrives, return your heart to Allah.",
			"The day is getting shorter. Don't let your remembrance become shorter too.",
			"A little pause. A little prayer. A little peace.",
			"Whatever today has brought you, bring your heart back to Allah.",
			"Somewhere between busy and tired, there's still a moment for Allah.",
			"The afternoon breeze passes quietly. Let your heart pause with it.",
			"You've spent hours chasing the day. Take a moment to remember why you're here.",
		],
	},
	Maghrib: {
		title: "🌅 Maghrib has arrived and passed",
		delayMinutes: 15,
		bodies: [
			"The sun has set. Take a moment with Allah.",
			"Maghrib has passed. Don't let the moment pass unnoticed.",
			"The day is turning into night. Turn your heart towards Allah.",
			"The evening has arrived. Have you paused for Allah?",
			"The sky has changed. Take a moment to change your pace too.",
			"Another day is nearing its end. Say Alhamdulillah.",
			"The sunset has passed. A beautiful moment still remains.",
			"Before the evening carries you away, take a moment with Allah.",
			"The day is fading. Keep Allah close.",
			"The sun has left the sky. Let your heart remember its Creator.",
		],
	},
	Isha: {
		title: "🌙 The day is coming to an end",
		delayMinutes: 45,
		bodies: [
			"The day is almost over. Leave a little space for Allah.",
			"Before you sleep, give your heart a moment of peace.",
			"The world can wait until tomorrow. Your soul needs this moment.",
			"Another day has been written. End it with Allah.",
			"Before you close your eyes, remember the One who watched over you today.",
			"Let your last thoughts tonight be closer to Allah.",
			"Whatever today was, end it with gratitude.",
			"The night is quiet. Let your heart be quiet with Allah.",
			"Tomorrow isn't promised. End today with remembrance.",
			"Put the day down for a moment. Give your heart to Allah.",
		],
	},
};

function getPrayerDate(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function getNotificationDate(
	date: Date,
	time: string,
	delayMinutes: number,
): Date | null {
	const match = /^(\d{1,2}):(\d{2})/.exec(time);
	if (!match) return null;

	const notificationDate = getPrayerDate(date);
	notificationDate.setHours(Number(match[1]), Number(match[2]), 0, 0);
	notificationDate.setMinutes(notificationDate.getMinutes() + delayMinutes);
	return notificationDate;
}

function chooseMessage(messages: string[]): string {
	return messages[Math.floor(Math.random() * messages.length)];
}

export async function cancelPrayerNudges(): Promise<void> {
	if (Platform.OS === "web") return;

	const scheduled = await Notifications.getAllScheduledNotificationsAsync();
	await Promise.all(
		scheduled
			.filter(
				(notification) =>
					notification.content.data?.type === PRAYER_NUDGE_TYPE,
			)
			.map((notification) =>
				Notifications.cancelScheduledNotificationAsync(
					notification.identifier,
				),
			),
	);
}

export async function schedulePrayerNudges(city: string): Promise<void> {
	if (Platform.OS === "web") return;

	try {
		const permission = await Notifications.getPermissionsAsync();
		if (permission.status !== "granted") return;

		await Notifications.setNotificationChannelAsync("gentle-reminders", {
			name: "Gentle prayer reminders",
			importance: Notifications.AndroidImportance.DEFAULT,
			sound: null,
			vibrationPattern: [],
		});

		const today = new Date();
		const prayerDays = await Promise.all(
			Array.from({ length: SCHEDULE_DAYS }, async (_, index) => {
				const date = getPrayerDate(today);
				date.setDate(date.getDate() + index);
				return { date, times: await getPrayerTimesForDate(city, date) };
			}),
		);

		const notifications = prayerDays.flatMap(({ date, times }) =>
			Object.entries(reminderMessages).flatMap(([prayer, reminder]) => {
				const prayerTime = times[prayer];
				if (typeof prayerTime !== "string") return [];

				const notificationDate = getNotificationDate(
					date,
					prayerTime,
					reminder.delayMinutes,
				);
				if (!notificationDate || notificationDate <= new Date())
					return [];

				return [{ prayer, reminder, notificationDate }];
			}),
		);

		await cancelPrayerNudges();
		await Promise.all(
			notifications.map(({ prayer, reminder, notificationDate }) =>
				Notifications.scheduleNotificationAsync({
					content: {
						title: reminder.title,
						body: chooseMessage(reminder.bodies),
						data: { type: PRAYER_NUDGE_TYPE, prayer },
						sound: false,
					},
					trigger: {
						type: Notifications.SchedulableTriggerInputTypes.DATE,
						date: notificationDate,
						channelId: "gentle-reminders",
					},
				}),
			),
		);
	} catch (error) {
		console.log("Prayer reminder scheduling error:", error);
	}
}
