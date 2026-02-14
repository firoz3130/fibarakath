import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAyahs } from "../../src/api/quran";

export default function SurahDetail() {
  const { id } = useLocalSearchParams();
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [surahName, setSurahName] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (id) {
      getAyahs(String(id)).then((data) => {
        setAyahs(data);
        if (data.length > 0) {
          setSurahName(data[0].surahNameEnglish || "Surah");
        }
      });
    }
  }, [id]);

  const renderHeader = () => (
    <LinearGradient
      colors={['#1a472a', '#2d5a3d']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backArrow}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{surahName}</Text>
        <Text style={styles.headerSubtitle}>📖 {ayahs.length} Verses 🤍</Text>
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={ayahs}
        keyExtractor={(item) => item.number.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={styles.ayahCardWrapper}>
            <View style={styles.ayahCard}>
              {/* Verse Number Badge */}
              <View style={styles.numberContainer}>
                <View style={styles.ayahNumber}>
                  <Text style={styles.ayahNumberText}>{item.numberInSurah}</Text>
                </View>
              </View>

              {/* Verse Content */}
              <View style={styles.ayahContent}>
                {/* Arabic Text */}
                <Text
                  style={styles.arabicText}
                  selectable
                >
                  {item.text}
                </Text>

                {/* English Translation */}
                {item.transliteration && (
                  <Text style={styles.transliteration}>
                    {item.transliteration}
                  </Text>
                )}

                {/* Divider */}
                <View style={styles.divider} />

                {/* Verse Info */}
                <View style={styles.verseInfo}>
                  <Text style={styles.verseNumberLabel}>
                    Verse {item.numberInSurah} • Juz {item.juz}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f7f3",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: 16,
  },
  backArrow: {
    fontSize: 16,
    fontWeight: "700",
    color: "#d4af37",
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#d4af37",
    fontWeight: "600",
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  ayahCardWrapper: {
    marginBottom: 16,
  },
  ayahCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  numberContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  ayahNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1a472a",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1a472a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  ayahNumberText: {
    color: "#d4af37",
    fontWeight: "800",
    fontSize: 18,
  },
  ayahContent: {
    padding: 20,
  },
  arabicText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a1a",
    textAlign: "right",
    lineHeight: 40,
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  transliteration: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    fontWeight: "400",
    marginBottom: 12,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "#e8e8e8",
    marginVertical: 12,
  },
  verseInfo: {
    flexDirection: "row",
    justifyContent: "center",
  },
  verseNumberLabel: {
    fontSize: 11,
    color: "#d4af37",
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});