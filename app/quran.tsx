import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getSurahs } from "../src/api/quran";

export default function QuranScreen() {
  const [surahs, setSurahs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    getSurahs().then(setSurahs);
  }, []);

  const filteredSurahs = useMemo(() => {
    return surahs.filter(surah =>
      surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.name.includes(searchQuery)
    );
  }, [surahs, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#1a472a', '#2d5a3d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>The Holy Quran</Text>
        <Text style={styles.headerSubtitle}>📖 114 Surahs 🤍</Text>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Surah..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Surahs List */}
      <FlatList
        data={filteredSurahs}
        keyExtractor={(item) => item.number.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => router.push(`/surah/${item.number}`)}
            activeOpacity={0.7}
            style={styles.surahCardWrapper}
          >
            <LinearGradient
              colors={["#fff", "#f9f9f9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.surahCard}
            >
              {/* Number Indicator */}
              <View style={styles.numberBadge}>
                <Text style={styles.numberText}>{item.number}</Text>
              </View>

              {/* Content */}
              <View style={styles.contentWrapper}>
                <Text style={styles.surahName}>{item.englishName}</Text>
                <Text style={styles.surahNameAr}>{item.name}</Text>
                <Text style={styles.surahInfo}>
                  {item.numberOfAyahs} Ayahs • {item.revelationType}
                </Text>
              </View>

              {/* Arrow Indicator */}
              <Text style={styles.arrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: -8,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  surahCardWrapper: {
    marginBottom: 12,
  },
  surahCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8e8e8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  numberBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1a472a",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#1a472a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  numberText: {
    color: "#d4af37",
    fontWeight: "800",
    fontSize: 18,
  },
  contentWrapper: {
    flex: 1,
  },
  surahName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  surahNameAr: {
    fontSize: 14,
    color: "#d4af37",
    fontWeight: "600",
    marginBottom: 6,
  },
  surahInfo: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  arrow: {
    fontSize: 20,
    color: "#d4af37",
    fontWeight: "700",
    marginLeft: 12,
  },
});