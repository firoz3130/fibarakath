import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fetchSurahWithTranslation } from "../../src/api/quran";




function toArabicNumber(num: number) {
  return num.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export default function SurahDetail() {
  const { id } = useLocalSearchParams();
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [surahName, setSurahName] = useState("");
  const BISMILLAH =
    "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
  const router = useRouter();
  const showBismillah = id !== "9"; // Surah At-Tawbah has no Bismillah


  const [currentAyah, setCurrentAyah] = useState(1);
  const flatListRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);

  const [showAll, setShowAll] = useState(false);
  const [expandedAyahs, setExpandedAyahs] = useState<number[]>([]);
  const [translations, setTranslations] = useState<any[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en.asad');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const languageOptions = [
    { label: "English (English)", value: "en.asad" },
    { label: "Malayalam (മലയാളം)", value: "ml.abdulhameed" },
    { label: "Hindi (हिन्दी)", value: "hi.farooq" },
    { label: "Urdu (اردو)", value: "ur.jalandhry" },
  ];

  const playAyahAudio = async (globalAyahNumber: number, ayahNumber: number) => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          // If this same ayah is playing, pause it
          if (playingAyah === ayahNumber) {
            await soundRef.current.pauseAsync();
            setPlayingAyah(null);
            return;
          }
          // stop and play new one
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      }

      const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setPlayingAyah(ayahNumber);

      sound.setOnPlaybackStatusUpdate((status) => {
        if ((status as any).didJustFinish) {
          setPlayingAyah(null);
        }
      });
    } catch (error) {
    }
  };
  useEffect(() => {
    if (!id) return;

    const loadSurah = async () => {
      const { arabic, english } = await fetchSurahWithTranslation(Number(id), selectedLanguage);

      let ayahList = arabic.ayahs.map((a: any) => ({ ...a }));

      const BISMILLAH_TEXT =
        "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ";

      if (arabic.number !== 9) {
        if (
          ayahList.length > 0 &&
          ayahList[0].text.includes(BISMILLAH_TEXT)
        ) {
          ayahList[0].text = ayahList[0].text
            .replace(BISMILLAH_TEXT, "")
            .trim();
        }
      }

      setAyahs(ayahList);
      setTranslations(english);

      setSurahName(
        `Surah ${arabic.number} – ${arabic.englishName} (${arabic.name})`
      );

      //Restore bookmark AFTER ayahs set
      const saved = await AsyncStorage.getItem(
        `last_read_surah_${id}`
      );

      if (saved) {
        const savedAyah = Number(saved);

        setTimeout(() => {
          const index = ayahList.findIndex(
            (a: any) => a.numberInSurah === savedAyah
          );
          if (index !== -1 && flatListRef.current) {
            flatListRef.current.scrollToIndex({
              index,
              animated: false,
              viewPosition: 0.2,
            });
          }
          setCurrentAyah(savedAyah);
        }, 300);
      }
    };

    loadSurah();
  }, [id]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const onViewableItemsChanged = useRef(
    async ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        const visibleItem = viewableItems[0].item;
        const ayahNum = visibleItem.numberInSurah;

        setCurrentAyah(ayahNum);

        await AsyncStorage.setItem(
          `last_read_surah_${id}`,
          ayahNum.toString()
        );
      }
    }
  ).current;


  const toggleTranslation = (ayahNumber: number) => {
    setExpandedAyahs(prev =>
      prev.includes(ayahNumber)
        ? prev.filter(n => n !== ayahNumber)
        : [...prev, ayahNumber]
    );
  };

  const changeLanguage = async (language: string) => {
    setSelectedLanguage(language);
    setShowLanguagePicker(false);
    // Reload translations with new language
    const { english } = await fetchSurahWithTranslation(Number(id), language);
    setTranslations(english);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#1a472a", "#2d5a3d"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            await AsyncStorage.setItem(
              `last_read_surah_${id}`,
              currentAyah.toString()
            );
            alert("Bookmark Saved!");
          }}
        >
          {/* <Text style={{ color: "white", marginTop: 10 }}>
            🔖 Bookmark
          </Text> */}
        </TouchableOpacity>
        <Text style={styles.title}>{surahName}</Text>
        <View style={styles.headerRow}>
          <Text style={styles.progressText}>
            Ayah {currentAyah} of {ayahs.length}
          </Text>
          <TouchableOpacity
            onPress={() => setShowLanguagePicker(!showLanguagePicker)}
            style={styles.languageSelector}
          >
            <Text style={styles.languageSelectorText}>
              {languageOptions.find(lang => lang.value === selectedLanguage)?.label} ▼
            </Text>
          </TouchableOpacity>
        </View>
        {showLanguagePicker && (
          <View style={styles.languagePicker}>
            {languageOptions.map((lang, index) => (
              <TouchableOpacity
                key={lang.value}
                onPress={() => changeLanguage(lang.value)}
                style={[
                  styles.languageOption,
                  selectedLanguage === lang.value && styles.languageOptionSelected,
                  index < languageOptions.length - 1 && styles.languageOptionBorder
                ]}
              >
                <Text style={[
                  styles.languageOptionText,
                  selectedLanguage === lang.value && styles.languageOptionTextSelected
                ]}>
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={ayahs}
        keyExtractor={(item) => item.number.toString()}
        onViewableItemsChanged={onViewableItemsChanged}
        contentContainerStyle={{ paddingBottom: 120 }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        renderItem={({ item, index }) => (
          <View style={{ padding: 20 }}>
            {index === 0 && showBismillah && (
              <Text style={styles.bismillah}>{BISMILLAH}</Text>
            )}

            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => playAyahAudio(item.number, item.numberInSurah)}
                  style={[
                    styles.playButton,
                    playingAyah === item.numberInSurah && styles.playButtonActive,
                  ]}
                >
                  <Text style={styles.playButtonIcon}>
                    {playingAyah === item.numberInSurah ? "⏸" : "▶"}
                  </Text>
                  <Text style={styles.playButtonText}>
                    {playingAyah === item.numberInSurah ? "Pause" : "Listen"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => toggleTranslation(item.numberInSurah)}
                  style={[
                    styles.translateButton,
                    expandedAyahs.includes(item.numberInSurah) && styles.translateButtonActive,
                  ]}
                >
                  <Text style={styles.translateButtonIcon}>📖</Text>
                  <Text style={styles.translateButtonText}>
                    {expandedAyahs.includes(item.numberInSurah) ? "Hide" : "Translate"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text selectable style={styles.mushafText}>
                {item.text} ﴿{toArabicNumber(item.numberInSurah)}﴾
              </Text>

              {expandedAyahs.includes(item.numberInSurah) && (
                <Text style={styles.translationText}>
                  {translations[index]?.text}
                </Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f7f3" },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  back: { color: "#d4af37", fontWeight: "700" },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginTop: 10,
  },
  page: {
    padding: 20,
  },
  mushafText: {
    fontFamily: "AmiriQuran",
    fontSize: 26,
    lineHeight: 48,
    color: "#1a1a1a",
    textAlign: "right",
  },
  bismillah: {
    fontFamily: "AmiriQuran",
    fontSize: 28,
    textAlign: "center",
    marginVertical: 20,
    color: "#1a1a1a",
  },
  progressText: {
    color: "#d4af37",
    marginTop: 6,
    fontWeight: "600",
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginTop: 8,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#d4af37",
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#d4af37",
    gap: 6,
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  playButtonActive: {
    backgroundColor: "#d4af37",
  },
  playButtonIcon: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a472a",
  },
  playButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a472a",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  translateButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#d4af37",
    gap: 6,
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  translateButtonActive: {
    backgroundColor: "#d4af37",
  },
  translateButtonIcon: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1a472a",
  },
  translateButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1a472a",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  translationText: {
    fontSize: 18,
    lineHeight: 28,
    color: "#333",
    textAlign: "left",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#d4af37",
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  languageSelector: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  languageSelectorText: {
    color: '#d4af37',
    fontSize: 14,
    fontWeight: '600',
  },
  languagePicker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d4af37',
    overflow: 'hidden',
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  languageOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageOptionSelected: {
    backgroundColor: '#d4af37',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#1a472a',
  },
  languageOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});