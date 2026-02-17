/* eslint-disable react/no-unescaped-entities */
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getPrayerTimes } from "../src/api/prayer";
import { getVerseOfTheDay } from "../src/api/quran";
import { getCurrentCity } from "../src/api/prayer";

export default function HomeScreen() {
  const [times, setTimes] = useState<any>(null);
  const [dailyVerse, setDailyVerse] = useState<any>(null);

useEffect(() => {
  const loadData = async () => {
    try {
      const city = await getCurrentCity();
      const prayerTimes = await getPrayerTimes(city);
      setTimes(prayerTimes);

      const verse = await getVerseOfTheDay();
      setDailyVerse(verse);
    } catch (error) {
      console.log("Loading error:", error);
    }
  };

  loadData();
}, []);

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
        <Text style={styles.mainTitle}>Ramadan Companion</Text>
        <Text style={styles.subtitle}>🌙 Blessed Month 🌙</Text>
      </LinearGradient>

      {/* Sehri & Iftar Highlight */}
      {times && (
        <View style={styles.highlightContainer}>
          <View style={[styles.highlightCard, styles.sehriCard]}>
            <Text style={styles.highlightLabel}>SEHRI</Text>
            <Text style={styles.highlightTime}>{times.Fajr}</Text>
            <Text style={styles.highlightSubtext}>Wake-up Time</Text>
          </View>

          <View style={[styles.highlightCard, styles.iftarCard]}>
            <Text style={styles.highlightLabel}>IFTAR</Text>
            <Text style={styles.highlightTime}>{times.Maghrib}</Text>
            <Text style={styles.highlightSubtext}>Breaking Fast</Text>
          </View>
        </View>
      )}

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

      {/* Inspirational Quote */}
      <Text style={styles.sectionTitle}>Verse of the Day</Text>
      {dailyVerse && (
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteText}>
            "{dailyVerse.text}"
          </Text>

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
  highlightContainer: {
    flexDirection: "row",
    gap: 15,
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 40,
  },
  highlightCard: {
    flex: 1,
    borderRadius: 20,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sehriCard: {
    backgroundColor: "#fff3e0",
    borderLeftWidth: 6,
    borderLeftColor: "#ff9800",
  },
  iftarCard: {
    backgroundColor: "#e8f5e9",
    borderLeftWidth: 6,
    borderLeftColor: "#4caf50",
  },
  highlightLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    letterSpacing: 2,
    marginBottom: 8,
  },
  highlightTime: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  highlightSubtext: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
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
  quoteText: {
    fontSize: 14,
    color: "#2d5a3d",
    fontStyle: "italic",
    fontWeight: "500",
    lineHeight: 22,
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
});