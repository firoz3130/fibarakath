import { useEffect, useState } from "react";
import { AppState, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
    getCompletedPrayerCount,
    getPrayerDay,
    getPrayerStorageData,
    getPrayerStreak,
    isPrayerDayComplete,
    PRAYER_BADGES,
    PRAYER_IDS,
    PrayerId,
    PrayerStorageData,
    togglePrayerCompletion,
} from "../storage/prayerStorage";
import { addLocalDays, getLocalDateKey } from "../utils/localDate";

const prayerLabels: Record<PrayerId, string> = {
    fajr: "Fajr - الفجر 🌅",
    dhuhr: "Dhuhr - الظهر ☀️",
    asr: "Asr - العصر 🌤️",
    maghrib: "Maghrib - المغرب 🌇",
    isha: "Isha - العشاء 🌙",

};

const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(2024, 0, index + 1)),
);

export default function PrayerTracker() {
    const [today, setToday] = useState(() => new Date());
    const [data, setData] = useState<PrayerStorageData | null>(null);
    const [loadedDateKey, setLoadedDateKey] = useState<string | null>(null);
    const [storageWarning, setStorageWarning] = useState(false);
    const todayKey = getLocalDateKey(today);

    useEffect(() => {
        let active = true;
        getPrayerStorageData().then((saved) => {
            if (active) {
                setData(saved);
                setLoadedDateKey(todayKey);
            }
        });
        return () => { active = false; };
    }, [todayKey]);

    useEffect(() => {
        const refreshDate = () => {
            const next = new Date();
            setToday((current) => getLocalDateKey(current) === getLocalDateKey(next) ? current : next);
        };
        const interval = setInterval(refreshDate, 60_000);
        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active") refreshDate();
        });
        return () => {
            clearInterval(interval);
            subscription.remove();
        };
    }, []);

    const loaded = loadedDateKey === todayKey;
    if (!data || !loaded) {
        return <View style={styles.loading}><Text style={styles.muted}>Loading today&apos;s prayers…</Text></View>;
    }

    const day = getPrayerDay(data, todayKey);
    const completedCount = getCompletedPrayerCount(day);
    const complete = isPrayerDayComplete(day);
    const streak = getPrayerStreak(data, todayKey);
    const rewardedToday = data.rewardedDates.includes(todayKey);
    const weekStart = addLocalDays(today, -((today.getDay() + 6) % 7));
    const weekDates = Array.from({ length: 7 }, (_, index) => addLocalDays(weekStart, index));
    const unlockedBadges = PRAYER_BADGES.filter((badge) => data.unlockedBadges.includes(badge.id));

    const togglePrayer = async (prayerId: PrayerId) => {
        const result = await togglePrayerCompletion(todayKey, prayerId);
        setData(result.data);
        setStorageWarning(!result.persisted);
    };

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeading}>
                <View>
                    <Text style={styles.eyebrow}>DAILY PRACTICE</Text>
                    <Text style={styles.title}>Today&apos;s Prayers</Text>
                </View>
                <Text style={styles.count}>{completedCount} / 5</Text>
            </View>

            <View style={styles.progressTrack} accessibilityLabel={`${completedCount} of 5 prayers completed`}>
                <View style={[styles.progressFill, { width: `${completedCount * 20}%` }]} />
            </View>

            <View style={styles.prayerList}>
                {PRAYER_IDS.map((prayerId, index) => {
                    const checked = day[prayerId];
                    return (
                        <TouchableOpacity
                            key={prayerId}
                            onPress={() => togglePrayer(prayerId)}
                            disabled={!loaded}
                            activeOpacity={0.7}
                            style={[styles.prayerRow, index < PRAYER_IDS.length - 1 && styles.prayerDivider]}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked, disabled: !loaded }}
                            accessibilityLabel={`${prayerLabels[prayerId]}, ${checked ? "completed" : "not completed"}`}
                        >
                            <Text style={[styles.prayerName, checked && styles.prayerNameComplete]}>{prayerLabels[prayerId]}</Text>
                            <View style={[styles.check, checked && styles.checkComplete]}>
                                <Text style={[styles.checkmark, checked && styles.checkmarkComplete]}>{checked ? "✓" : ""}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {complete && (
                <View style={styles.completionMessage}>
                    <Text style={styles.completionTitle}>Alhamdulillah!</Text>
                    <Text style={styles.completionText}>All 5 prayers completed today.</Text>
                    {rewardedToday && <Text style={styles.rewardText}>+50 Barakah points earned today ✨</Text>}
                </View>
            )}

            {storageWarning && <Text style={styles.storageWarning}>This update could not be saved on this device.</Text>}

            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>🔥 {streak.currentStreak}</Text>
                    <Text style={styles.statLabel}>Day streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>✨ {data.totalBarakahPoints}</Text>
                    <Text style={styles.statLabel}>Barakah points</Text>
                </View>
            </View>
            <Text style={styles.pointsNote}>Points are for in-app milestones only.</Text>
            {streak.currentStreak === 0 && <Text style={styles.encouragement}>Continue your journey today 🌱</Text>}
            <Text style={styles.longestStreak}>
                Longest streak: {streak.longestStreak} day{streak.longestStreak === 1 ? "" : "s"}
            </Text>

            {unlockedBadges.length > 0 && (
                <View style={styles.badges}>
                    <Text style={styles.badgesTitle}>MILESTONES</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeList}>
                        {unlockedBadges.map((badge) => (
                            <View key={badge.id} style={styles.badge}>
                                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                                <Text style={styles.badgeLabel}>{badge.title}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            <View style={styles.weekSection}>
                <Text style={styles.weekTitle}>THIS WEEK</Text>
                {weekDates.map((date, index) => {
                    const weeklyDay = getPrayerDay(data, getLocalDateKey(date));
                    return (
                        <View key={getLocalDateKey(date)} style={styles.weekRow}>
                            <Text style={[styles.weekday, getLocalDateKey(date) === todayKey && styles.weekdayToday]}>{weekdays[index]}</Text>
                            <View style={styles.weekDots}>
                                {PRAYER_IDS.map((prayerId) => (
                                    <View key={prayerId} style={[styles.weekDot, weeklyDay[prayerId] && styles.weekDotDone]} />
                                ))}
                            </View>
                            <Text style={styles.weekCount}>{getCompletedPrayerCount(weeklyDay)}/5</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: { marginHorizontal: 20, marginBottom: 28, padding: 16, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e7e4dc" },
    sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 },
    eyebrow: { color: "#927328", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
    title: { marginTop: 3, color: "#1a472a", fontSize: 20, fontWeight: "800" },
    count: { color: "#1a472a", fontSize: 15, fontWeight: "800" },
    progressTrack: { height: 6, overflow: "hidden", backgroundColor: "#ece9df", borderRadius: 3, marginBottom: 12 },
    progressFill: { height: "100%", backgroundColor: "#d4af37", borderRadius: 3 },
    prayerList: { borderTopWidth: 1, borderTopColor: "#eeeae0" },
    prayerRow: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 2 },
    prayerDivider: { borderBottomWidth: 1, borderBottomColor: "#f0eee8" },
    prayerName: { color: "#343b35", fontSize: 15, fontWeight: "600" },
    prayerNameComplete: { color: "#1a472a" },
    check: { width: 23, height: 23, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#c9c8bd", borderRadius: 12 },
    checkComplete: { backgroundColor: "#1a472a", borderColor: "#1a472a" },
    checkmark: { color: "transparent", fontSize: 15, fontWeight: "800", lineHeight: 18 },
    checkmarkComplete: { color: "#fff" },
    completionMessage: { marginTop: 12, padding: 12, backgroundColor: "#f1f8e9", borderLeftWidth: 3, borderLeftColor: "#d4af37", borderRadius: 6 },
    completionTitle: { color: "#1a472a", fontSize: 15, fontWeight: "800" },
    completionText: { marginTop: 2, color: "#486052", fontSize: 13 },
    rewardText: { marginTop: 5, color: "#805f13", fontSize: 13, fontWeight: "800" },
    storageWarning: { marginTop: 10, color: "#9a4d38", fontSize: 12 },
    statsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginTop: 16, paddingVertical: 8 },
    statItem: { flex: 1, alignItems: "center" },
    statValue: { color: "#1a472a", fontSize: 16, fontWeight: "800" },
    statLabel: { marginTop: 2, color: "#77796f", fontSize: 11 },
    statDivider: { height: 32, width: 1, backgroundColor: "#e7e4dc" },
    pointsNote: { textAlign: "center", color: "#88877f", fontSize: 10 },
    encouragement: { marginTop: 10, textAlign: "center", color: "#486052", fontSize: 13, fontWeight: "600" },
    longestStreak: { marginTop: 8, textAlign: "center", color: "#77796f", fontSize: 12 },
    badges: { marginTop: 18 },
    badgesTitle: { marginBottom: 8, color: "#927328", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
    badgeList: { gap: 8 },
    badge: { minHeight: 64, minWidth: 94, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, backgroundColor: "#fbf8ee", borderRadius: 8, borderWidth: 1, borderColor: "#eee3c2" },
    badgeIcon: { fontSize: 18 },
    badgeLabel: { marginTop: 3, color: "#586252", fontSize: 10, fontWeight: "700", textAlign: "center" },
    weekSection: { marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#eeeae0" },
    weekTitle: { marginBottom: 8, color: "#927328", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
    weekRow: { height: 25, flexDirection: "row", alignItems: "center" },
    weekday: { width: 40, color: "#77796f", fontSize: 11, fontWeight: "600" },
    weekdayToday: { color: "#1a472a", fontWeight: "800" },
    weekDots: { flex: 1, flexDirection: "row", justifyContent: "space-evenly" },
    weekDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#e6e4dc" },
    weekDotDone: { backgroundColor: "#43805a" },
    weekCount: { width: 32, textAlign: "right", color: "#77796f", fontSize: 10, fontWeight: "600" },
    loading: { minHeight: 100, justifyContent: "center", marginHorizontal: 20 },
    muted: { color: "#77796f", fontSize: 13 },
});