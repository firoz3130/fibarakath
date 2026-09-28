import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { AppState, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
    formatGregorianDate,
    getHijriDate,
    getHijriMonthDates,
    getIslamicEventsOnDate,
    getUpcomingIslamicEvents,
    shiftHijriMonth,
} from "../src/utils/islamicCalendar";
import { getLocalDateKey } from "../src/utils/localDate";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarScreen() {
    const [today, setToday] = useState(() => new Date());
    const [monthAnchor, setMonthAnchor] = useState(() => new Date());
    const monthDates = getHijriMonthDates(monthAnchor);
    const monthInfo = monthDates.length ? getHijriDate(monthDates[0]) : getHijriDate(monthAnchor);
    const leadingBlanks = monthDates[0]?.getDay() ?? 0;
    const upcomingEvents = getUpcomingIslamicEvents(today);
    const todaysEvents = getIslamicEventsOnDate(today);

    useEffect(() => {
        const refreshDate = () => setToday(new Date());
        const interval = setInterval(refreshDate, 60_000);
        const subscription = AppState.addEventListener("change", (state) => {
            if (state === "active") refreshDate();
        });
        return () => {
            clearInterval(interval);
            subscription.remove();
        };
    }, []);

    const monthCells: (Date | null)[] = [
        ...Array.from({ length: leadingBlanks }, () => null),
        ...monthDates,
    ];
    while (monthCells.length % 7 !== 0) monthCells.push(null);

    return (
        <View style={styles.container}>
            <LinearGradient colors={["#1a472a", "#2d5a3d"]} style={styles.header}>
                <Text style={styles.eyebrow}>TODAY IN ISLAM - التقويم الهجري</Text>
                {getHijriDate(today) ? (
                    <Text style={styles.hijriDate}>
                        {getHijriDate(today)!.day} {getHijriDate(today)!.monthName} {getHijriDate(today)!.year} AH
                    </Text>
                ) : (
                    <Text style={styles.hijriDate}>Hijri date unavailable</Text>
                )}
                <Text style={styles.gregorianDate}>{formatGregorianDate(today)}</Text>
                {todaysEvents.map((event) => (
                    <Text key={event.id} style={styles.todayEvent}>{event.icon} {event.title}</Text>
                ))}
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.monthHeading}>
                    <TouchableOpacity
                        onPress={() => setMonthAnchor((anchor) => shiftHijriMonth(anchor, -1))}
                        style={styles.monthButton}
                        accessibilityRole="button"
                        accessibilityLabel="Previous Hijri month"
                    >
                        <Text style={styles.monthArrow}>‹</Text>
                    </TouchableOpacity>
                    <View style={styles.monthTitleWrap}>
                        <Text style={styles.monthTitle}>{monthInfo?.monthName ?? "Hijri Calendar"}</Text>
                        {monthInfo && <Text style={styles.monthYear}>{monthInfo.year} AH</Text>}
                    </View>
                    <TouchableOpacity
                        onPress={() => setMonthAnchor((anchor) => shiftHijriMonth(anchor, 1))}
                        style={styles.monthButton}
                        accessibilityRole="button"
                        accessibilityLabel="Next Hijri month"
                    >
                        <Text style={styles.monthArrow}>›</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.calendar}>
                    <View style={styles.weekHeader}>
                        {weekdayLabels.map((label) => <Text key={label} style={styles.weekday}>{label}</Text>)}
                    </View>
                    {Array.from({ length: Math.ceil(monthCells.length / 7) }, (_, weekIndex) => (
                        <View key={weekIndex} style={styles.week}>
                            {monthCells.slice(weekIndex * 7, weekIndex * 7 + 7).map((date, dayIndex) => {
                                const hijriDay = date ? getHijriDate(date) : null;
                                const isToday = !!date && getLocalDateKey(date) === getLocalDateKey(today);
                                const hasEvent = !!date && getIslamicEventsOnDate(date).length > 0;
                                return (
                                    <View key={date ? getLocalDateKey(date) : `blank-${weekIndex}-${dayIndex}`} style={[styles.dayCell, isToday && styles.todayCell]}>
                                        {date && (
                                            <>
                                                <Text style={[styles.hijriDay, isToday && styles.todayDay]}>{hijriDay?.day}</Text>
                                                <Text style={[styles.gregorianDay, isToday && styles.todayGregorian]}>{date.getDate()}</Text>
                                                {hasEvent && <View style={[styles.eventMarker, isToday && styles.todayEventMarker]} />}
                                            </>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </View>

                <Text style={styles.calendarNote}>
                    Hijri dates use the device&apos;s Umm al-Qura calendar when available. Local moon sighting and regional calendars may differ by a day or more.
                </Text>

                <Text style={styles.sectionTitle}>UPCOMING</Text>
                {upcomingEvents.map((event) => {
                    const hijriDate = getHijriDate(event.date);
                    return (
                        <View key={`${event.id}-${getLocalDateKey(event.date)}`} style={styles.eventCard}>
                            <Text style={styles.eventIcon}>{event.icon}</Text>
                            <View style={styles.eventDetails}>
                                <Text style={styles.eventTitle}>{event.title}</Text>
                                <Text style={styles.eventDate}>
                                    {hijriDate ? `${hijriDate.day} ${hijriDate.monthName} ${hijriDate.year} AH` : formatGregorianDate(event.date)}
                                </Text>
                                {event.note && <Text style={styles.eventNote}>{event.note}</Text>}
                            </View>
                            <Text style={styles.countdown}>{event.daysUntil === 0 ? "Today" : `In ${event.daysUntil} days`}</Text>
                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f7f3" },
    header: { paddingTop: 30, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    eyebrow: { color: "#d4af37", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
    hijriDate: { marginTop: 7, color: "#fff", fontSize: 23, fontWeight: "800" },
    gregorianDate: { marginTop: 5, color: "#d9e3d8", fontSize: 14, fontWeight: "500" },
    todayEvent: { marginTop: 10, color: "#f4e4c1", fontSize: 14, fontWeight: "700" },
    content: { paddingHorizontal: 16, paddingBottom: 36 },
    monthHeading: { minHeight: 72, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    monthButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#e7e4dc" },
    monthArrow: { color: "#1a472a", fontSize: 28, lineHeight: 31 },
    monthTitleWrap: { alignItems: "center" },
    monthTitle: { color: "#1a472a", fontSize: 19, fontWeight: "800" },
    monthYear: { marginTop: 2, color: "#927328", fontSize: 12, fontWeight: "700" },
    calendar: { paddingHorizontal: 8, paddingVertical: 10, backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: "#e7e4dc" },
    weekHeader: { flexDirection: "row", marginBottom: 4 },
    weekday: { flex: 1, color: "#85867e", fontSize: 10, fontWeight: "700", textAlign: "center" },
    week: { flexDirection: "row" },
    dayCell: { flex: 1, height: 52, alignItems: "center", justifyContent: "center", margin: 1, borderRadius: 7 },
    todayCell: { backgroundColor: "#1a472a" },
    hijriDay: { color: "#253b2d", fontSize: 15, fontWeight: "700" },
    todayDay: { color: "#fff" },
    gregorianDay: { marginTop: 1, color: "#99998f", fontSize: 9 },
    todayGregorian: { color: "#d4af37" },
    eventMarker: { position: "absolute", bottom: 3, width: 4, height: 4, borderRadius: 2, backgroundColor: "#d4af37" },
    todayEventMarker: { backgroundColor: "#fff" },
    calendarNote: { marginTop: 10, color: "#77796f", fontSize: 11, lineHeight: 16 },
    sectionTitle: { marginTop: 24, marginBottom: 10, color: "#927328", fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
    eventCard: { minHeight: 76, flexDirection: "row", alignItems: "center", marginBottom: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff", borderRadius: 9, borderWidth: 1, borderColor: "#e7e4dc" },
    eventIcon: { width: 34, fontSize: 20, textAlign: "center" },
    eventDetails: { flex: 1, paddingHorizontal: 8 },
    eventTitle: { color: "#1a472a", fontSize: 14, fontWeight: "800" },
    eventDate: { marginTop: 3, color: "#72776f", fontSize: 12 },
    eventNote: { marginTop: 3, color: "#8a7a52", fontSize: 10, lineHeight: 14 },
    countdown: { color: "#927328", fontSize: 10, fontWeight: "700", textAlign: "right" },
});