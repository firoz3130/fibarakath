/* eslint-disable react/no-unescaped-entities */
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getCurrentCity, getPrayerTimes } from "../src/api/prayer";
import { getVerseForDate, getVerseOfTheDay } from "../src/api/quran";
import PrayerTracker from "../src/components/PrayerTracker";
import { formatGregorianDate, getHijriDate, getIslamicEventsOnDate } from "../src/utils/islamicCalendar";

export default function HomeScreen() {
  const [times, setTimes] = useState<any>(null);
  const [dailyVerse, setDailyVerse] = useState<any>(null);
  const [verseLanguage, setVerseLanguage] = useState('en.asad');
  const [showVerseLanguagePicker, setShowVerseLanguagePicker] = useState(false);
  const [verseTranslation, setVerseTranslation] = useState<string>('');
  const [today, setToday] = useState(() => new Date());
  const hijriDate = getHijriDate(today);
  const todaysEvents = getIslamicEventsOnDate(today);

  const verseLanguageOptions = [
    { label: 'English', value: 'en.asad' },
    { label: 'Malayalam', value: 'ml.abdulhameed' },
    { label: 'Hindi', value: 'hi.farooq' },
    { label: 'Urdu', value: 'ur.jalandhry' },
  ];

  const scheduleDailyVerseNotifications = async () => {
    try {
      const Notifications = await import("expo-notifications");
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") return;

      // Remove the old repeating notification and any previously scheduled batch.
      await Notifications.cancelAllScheduledNotificationsAsync();

      const now = new Date();
      const notifications = Array.from({ length: 14 }, async (_, index) => {
        const notificationDate = new Date(now);
        notificationDate.setDate(now.getDate() + index + 1);
        notificationDate.setHours(9, 0, 0, 0);

        const verse = await getVerseForDate(notificationDate);
        const verseText = verse?.text
          ? verse.text.substring(0, 100) + (verse.text.length > 100 ? "..." : "")
          : "Your daily Quran verse is ready.";

        return Notifications.scheduleNotificationAsync({
          content: {
            title: "📖 Daily Quran Verse",
            body: verseText,
            data: { type: "daily-quran-verse", ayahNumber: verse?.number },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: notificationDate,
          },
        });
      });

      await Promise.all(notifications);
    } catch (error) {
      console.log("Notification error:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const city = await getCurrentCity();
        const prayerTimes = await getPrayerTimes(city);
        setTimes(prayerTimes);

        const verse = await getVerseOfTheDay();
        setDailyVerse(verse);
        await scheduleDailyVerseNotifications();
      } catch (error) {
        console.log("Loading error:", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setToday(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const changeVerseLanguage = async (language: string) => {
    setVerseLanguage(language);
    setShowVerseLanguagePicker(false);

    if (dailyVerse) {
      try {
        // Fetch translation for the specific ayah
        const response = await fetch(
          `https://api.alquran.cloud/v1/ayah/${dailyVerse.number}/${language}`
        );
        const data = await response.json();
        if (data.data && data.data.text) {
          setVerseTranslation(data.data.text);
        }
      } catch (error) {
        console.log('Error fetching verse translation:', error);
        setVerseTranslation('');
      }
    }
  };

  const prayerData = times ? [
    { name: "Fajr", time: times.Fajr, arabicName: "الفجر", icon: "🌅" },
    { name: "Dhuhr", time: times.Dhuhr, arabicName: "الظهر", icon: "☀️" },
    { name: "Asr", time: times.Asr, arabicName: "العصر", icon: "🌤️" },
    { name: "Maghrib", time: times.Maghrib, arabicName: "المغرب", icon: "🌅" },
    { name: "Isha", time: times.Isha, arabicName: "العشاء", icon: "🌙" },
  ] : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#1a472a', '#2d5a3d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.mainTitle}>Fibarakath</Text>
        <Text style={styles.subtitle}>Daily Quran & Prayer Companion</Text>
      </LinearGradient>

      <Link href={"/calendar" as never} asChild>
        <TouchableOpacity style={styles.todayCard} activeOpacity={0.75} accessibilityRole="button">
          <View style={styles.todayContent}>
            <Text style={styles.todayLabel}>TODAY IN ISLAM</Text>
            <Text style={styles.todayHijri}>
              {hijriDate ? `${hijriDate.day} ${hijriDate.monthName} ${hijriDate.year} AH` : "Hijri date unavailable"}
            </Text>
            <Text style={styles.todayGregorian}>{formatGregorianDate(today)}</Text>
            {todaysEvents[0] && (
              <Text style={styles.todayEvent}>{todaysEvents[0].icon} {todaysEvents[0].title}</Text>
            )}
          </View>
          <Text style={styles.todayArrow}>›</Text>
        </TouchableOpacity>
      </Link>

      <PrayerTracker />

      {/* Prayer Times Section */}
      <Text style={styles.sectionTitle}>Prayer Times</Text>
      {prayerData.length > 0 && (
        <View style={styles.prayerGrid}>
          {prayerData.map((prayer, index) => (
            <View key={index} style={styles.prayerCard}>
              <Text style={styles.prayerIcon}>{prayer.icon}</Text>
              <Text style={styles.prayerNameAr}>{prayer.arabicName}</Text>
              <Text style={styles.prayerName}>{prayer.name}</Text>
              <Text style={styles.prayerTime}>{prayer.time}</Text>
            </View>
          ))}
        </View>
      )}

      {/* CTA Button */}
      <Link href="/quran" asChild>
        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.8}>
          <LinearGradient
            colors={['#d4af37', '#f4e4c1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Text style={styles.ctaButtonText}>✨ Read the Quran</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Link>

      <Link href={"/tasbih" as never} asChild>
        <TouchableOpacity style={styles.tasbihButton} activeOpacity={0.8}>
          <Text style={styles.tasbihButtonIcon}>۞</Text>
          <View>
            <Text style={styles.tasbihButtonTitle}>Tasbih Counter</Text>
            <Text style={styles.tasbihButtonText}>Keep your dhikr close</Text>
          </View>
          <Text style={styles.tasbihButtonArrow}>→</Text>
        </TouchableOpacity>
      </Link>

      <Link href={"/duas" as never} asChild>
        <TouchableOpacity style={styles.tasbihButton} activeOpacity={0.8}>
          <Text style={styles.tasbihButtonIcon}>🤲</Text>
          <View>
            <Text style={styles.tasbihButtonTitle}>Duas for daily life</Text>
            <Text style={styles.tasbihButtonText}>Travel, meals, home, sleep and more</Text>
          </View>
          <Text style={styles.tasbihButtonArrow}>→</Text>
        </TouchableOpacity>
      </Link>

      {/* Inspirational Quote */}
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>Verse of the Day</Text>
        <TouchableOpacity
          onPress={() => setShowVerseLanguagePicker(!showVerseLanguagePicker)}
          style={styles.verseLanguageSelector}
        >
          <Text style={styles.verseLanguageSelectorText}>
            {verseLanguageOptions.find(lang => lang.value === verseLanguage)?.label} ▼
          </Text>
        </TouchableOpacity>
      </View>
      {showVerseLanguagePicker && (
        <View style={styles.verseLanguagePicker}>
          {verseLanguageOptions.map((lang, index) => (
            <TouchableOpacity
              key={lang.value}
              onPress={() => changeVerseLanguage(lang.value)}
              style={[
                styles.verseLanguageOption,
                verseLanguage === lang.value && styles.verseLanguageOptionSelected,
                index < verseLanguageOptions.length - 1 && styles.verseLanguageOptionBorder
              ]}
            >
              <Text style={[
                styles.verseLanguageOptionText,
                verseLanguage === lang.value && styles.verseLanguageOptionTextSelected
              ]}>
                {lang.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {dailyVerse && (
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            "{dailyVerse.text}"
          </Text>

          {verseTranslation && verseLanguage !== 'en.asad' && (
            <Text style={styles.verseTranslationText}>
              "{verseTranslation}"
            </Text>
          )}

          <Text style={{
            marginTop: 10,
            fontWeight: "700",
            color: "#1a472a"
          }}>
            — Surah {dailyVerse.surah.englishName} ({dailyVerse.surah.number}:{dailyVerse.numberInSurah})
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={async () => {
              await Share.share({
                message: `"${dailyVerse.text}"\n\nSurah ${dailyVerse.surah.englishName} (${dailyVerse.surah.number}:${dailyVerse.numberInSurah})`,
              });
            }}
          >
            <LinearGradient
              colors={['#1a472a', '#2d5a3d']}
              style={styles.shareButton}
            >
              <Text style={styles.shareButtonText}>
                Share Verse
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f7f3",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#d4af37",
    fontWeight: "600",
    letterSpacing: 1,
  },
  todayCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 22,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e7e4dc",
    borderLeftWidth: 3,
    borderLeftColor: "#d4af37",
  },
  todayContent: { flex: 1 },
  todayLabel: { color: "#927328", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  todayHijri: { marginTop: 4, color: "#1a472a", fontSize: 16, fontWeight: "800" },
  todayGregorian: { marginTop: 2, color: "#77796f", fontSize: 12 },
  todayEvent: { marginTop: 6, color: "#805f13", fontSize: 12, fontWeight: "700" },
  todayArrow: { marginLeft: 8, color: "#927328", fontSize: 25, fontWeight: "700" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginHorizontal: 20,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  prayerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 30,
  },
  prayerCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  prayerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  prayerNameAr: {
    fontSize: 14,
    color: "#d4af37",
    fontWeight: "600",
    marginBottom: 4,
  },
  prayerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  prayerTime: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2d5a3d",
  },
  ctaButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  gradientButton: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a472a",
    letterSpacing: 0.5,
  },
  tasbihButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d4af37",
    shadowColor: "#1a472a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tasbihButtonIcon: {
    fontSize: 30,
    color: "#d4af37",
    marginRight: 14,
  },
  tasbihButtonTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a472a",
  },
  tasbihButtonText: {
    marginTop: 3,
    fontSize: 12,
    color: "#777",
  },
  tasbihButtonArrow: {
    marginLeft: "auto",
    fontSize: 22,
    color: "#d4af37",
    fontWeight: "700",
  },
  quoteText: {
    fontSize: 14,
    color: "#2d5a3d",
    fontStyle: "italic",
    fontWeight: "500",
    lineHeight: 22,
  },
  verseTranslationText: {
    fontSize: 14,
    color: "#1a472a",
    fontWeight: "500",
    lineHeight: 22,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#d4af37",
  },
  shareButtonIcon: {
    fontSize: 18,
    fontWeight: "700",
  },
  shareButton: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  shareButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  quoteContainer: {
    marginHorizontal: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "#f1f8e9",
    borderLeftWidth: 4,
    borderLeftColor: "#d4af37",
    borderRadius: 12,
    marginBottom: 10,   // add this
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  verseLanguageSelector: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  verseLanguageSelectorText: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: '600',
  },
  verseLanguagePicker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d4af37',
    overflow: 'hidden',
  },
  verseLanguageOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  verseLanguageOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  verseLanguageOptionSelected: {
    backgroundColor: '#d4af37',
  },
  verseLanguageOptionText: {
    fontSize: 14,
    color: '#1a472a',
  },
  verseLanguageOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});