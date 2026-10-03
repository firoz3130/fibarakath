import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer } from "expo-audio";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { fetchSurahWithTranslation } from "../../src/api/quran";

const AYAH_VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 50 };

function toArabicNumber(num: number) {
  return num.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

function removeLeadingBismillah(text: string) {
  const bismillah = "بسم الله الرحمن الرحيم".replace(/\s/g, "");
  text = text.replace(/^\uFEFF/, "");
  let normalized = "";
  let endIndex = 0;

  for (let index = 0; index < text.length && normalized.length < bismillah.length; index += 1) {
    const character = text[index];
    if (/\s/.test(character) || /[\u064B-\u065F\u0670\u0640]/.test(character)) {
      continue;
    }

    normalized += character.replace(/[ٱإأآ]/g, "ا");
    endIndex = index + 1;
  }

  if (normalized !== bismillah) {
    return text;
  }

  return text.slice(endIndex).replace(/^[\s\u064B-\u065F\u0670\u0640]+/, "").trim();
}

export default function SurahDetail() {
  const { id } = useLocalSearchParams();
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [totalAyahs, setTotalAyahs] = useState(0);
  const [surahName, setSurahName] = useState("");
  const BISMILLAH =
    "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
  const router = useRouter();
  const showBismillah = id !== "9"; // Surah At-Tawbah has no Bismillah


  const [currentAyah, setCurrentAyah] = useState(1);
  const surahIdRef = useRef(id);
  const flatListRef = useRef<FlatList>(null);
  const audioPlayer = useAudioPlayer(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isFullSurahMode, setIsFullSurahMode] = useState(false);
  const ayahsRef = useRef<any[]>([]);
  const fullSurahModeRef = useRef(false);
  const fullSurahIndexRef = useRef(0);
  const isUserScrollingRef = useRef(false);
  const scrollResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (audioPlayer.playing && playingAyah === ayahNumber) {
        audioPlayer.pause();
        fullSurahModeRef.current = false;
        setIsFullSurahMode(false);
        setIsAudioPlaying(false);
        setPlayingAyah(null);
        return;
      }

      fullSurahModeRef.current = false;
      setIsFullSurahMode(false);
      const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyahNumber}.mp3`;

      audioPlayer.replace(audioUrl);
      audioPlayer.play();
      setIsAudioPlaying(true);
      setPlayingAyah(ayahNumber);
    } catch {
    }
  };

  const scrollToAyah = useCallback((index: number) => {
    if (isUserScrollingRef.current) return;
    flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.25 });
  }, []);

  const toggleFullSurahPlayback = () => {
    if (!ayahsRef.current.length) return;

    if (fullSurahModeRef.current) {
      if (isAudioPlaying) {
        audioPlayer.pause();
        setIsAudioPlaying(false);
      } else {
        audioPlayer.play();
        setIsAudioPlaying(true);
      }
      return;
    }

    const startIndex = Math.max(
      0,
      ayahsRef.current.findIndex((ayah) => ayah.numberInSurah === currentAyah),
    );
    const ayah = ayahsRef.current[startIndex];
    fullSurahIndexRef.current = startIndex;
    fullSurahModeRef.current = true;
    setIsFullSurahMode(true);
    setPlayingAyah(ayah.numberInSurah);
    setIsAudioPlaying(true);
    scrollToAyah(startIndex);
    audioPlayer.replace(
      `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`,
    );
    audioPlayer.play();
  };

  useEffect(() => {
    const tag = `surah-recitation-${id}`;
    let cancelled = false;
    let activated = false;

    if (isFullSurahMode && isAudioPlaying) {
      void activateKeepAwakeAsync(tag)
        .then(() => {
          if (cancelled) {
            void deactivateKeepAwake(tag).catch(() => { });
          } else {
            activated = true;
          }
        })
        .catch(() => { });
    }

    return () => {
      cancelled = true;
      if (activated) void deactivateKeepAwake(tag).catch(() => { });
    };
  }, [id, isAudioPlaying, isFullSurahMode]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    let bookmarkTimer: ReturnType<typeof setTimeout> | null = null;

    const loadSurah = async () => {
      const { arabic, english } = await fetchSurahWithTranslation(Number(id), selectedLanguage);
      if (cancelled) return;

      let ayahList = arabic.ayahs.map((a: any) => ({ ...a }));
      let translationList = english;

      if (arabic.number !== 9) {
        if (ayahList.length > 0) {
          const firstAyahText = removeLeadingBismillah(ayahList[0].text);
          if (firstAyahText) {
            ayahList[0].text = firstAyahText;
          } else {
            ayahList = ayahList.slice(1);
            translationList = english.slice(1);
          }
        }
      }

      ayahsRef.current = ayahList;
      setAyahs(ayahList);
      setTranslations(translationList);
      setTotalAyahs(arabic.numberOfAyahs);
      setCurrentAyah(ayahList[0]?.numberInSurah ?? 1);

      setSurahName(
        `Surah ${arabic.number} – ${arabic.englishName} (${arabic.name})`
      );

      //Restore bookmark AFTER ayahs set
      const saved = await AsyncStorage.getItem(
        `last_read_surah_${id}`
      );
      if (cancelled) return;

      if (saved) {
        const savedAyah = Number(saved);

        bookmarkTimer = setTimeout(() => {
          if (cancelled) return;
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

    void loadSurah().catch((error) => {
      if (!cancelled) console.log("Surah loading error:", error);
    });

    return () => {
      cancelled = true;
      if (bookmarkTimer) clearTimeout(bookmarkTimer);
    };
  }, [id, selectedLanguage]);

  useFocusEffect(useCallback(() => {
    let disposed = false;
    const subscription = audioPlayer.addListener("playbackStatusUpdate", (status) => {
      if (!disposed && status.didJustFinish) {
        if (fullSurahModeRef.current) {
          const nextIndex = fullSurahIndexRef.current + 1;
          const nextAyah = ayahsRef.current[nextIndex];
          if (!nextAyah) {
            fullSurahModeRef.current = false;
            setIsFullSurahMode(false);
            setIsAudioPlaying(false);
            setPlayingAyah(null);
            return;
          }

          fullSurahIndexRef.current = nextIndex;
          setPlayingAyah(nextAyah.numberInSurah);
          setCurrentAyah(nextAyah.numberInSurah);
          scrollToAyah(nextIndex);
          audioPlayer.replace(
            `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${nextAyah.number}.mp3`,
          );
          audioPlayer.play();
        } else {
          setIsAudioPlaying(false);
          setPlayingAyah(null);
        }
      }
    });

    return () => {
      disposed = true;
      fullSurahModeRef.current = false;
      if (scrollResumeTimerRef.current) {
        clearTimeout(scrollResumeTimerRef.current);
        scrollResumeTimerRef.current = null;
      }
      subscription.remove();
      try {
        audioPlayer.pause();
      } catch {
        // The native player may already be released during route teardown.
      }
    };
  }, [audioPlayer, scrollToAyah]));

  const onViewableItemsChanged = useCallback(
    async ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        const visibleItem = viewableItems[0].item;
        const ayahNum = visibleItem.numberInSurah;

        setCurrentAyah(ayahNum);

        await AsyncStorage.setItem(
          `last_read_surah_${surahIdRef.current}`,
          ayahNum.toString()
        );
      }
    },
    []
  );

  useEffect(() => {
    surahIdRef.current = id;
  }, [id]);


  const toggleTranslation = (ayahNumber: number) => {
    setExpandedAyahs(prev =>
      prev.includes(ayahNumber)
        ? prev.filter(n => n !== ayahNumber)
        : [...prev, ayahNumber]
    );
  };

  const changeLanguage = (language: string) => {
    setSelectedLanguage(language);
    setShowLanguagePicker(false);
  };

  const progress: `${number}%` = totalAyahs > 0
    ? `${(currentAyah / totalAyahs) * 100}%`
    : "0%";

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
        <TouchableOpacity
          onPress={toggleFullSurahPlayback}
          style={styles.fullSurahButton}
          accessibilityRole="button"
          accessibilityLabel="Listen to the full surah"
        >
          <Text style={styles.fullSurahButtonText}>
            {isFullSurahMode
              ? `${isAudioPlaying ? "⏸" : "▶"}  ${isAudioPlaying ? "Pause" : "Resume"} full surah`
              : "▶  Listen full surah"}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.progressText}>
            Ayah {currentAyah} of {totalAyahs}
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
          <View
            style={[styles.progressBar, { width: progress }]}
          />
        </View>
      </LinearGradient>

      <FlatList
        ref={flatListRef}
        data={ayahs}
        keyExtractor={(item) => item.number.toString()}
        onViewableItemsChanged={onViewableItemsChanged}
        onScrollBeginDrag={() => {
          isUserScrollingRef.current = true;
          if (scrollResumeTimerRef.current) clearTimeout(scrollResumeTimerRef.current);
        }}
        onScrollEndDrag={() => {
          if (scrollResumeTimerRef.current) clearTimeout(scrollResumeTimerRef.current);
          scrollResumeTimerRef.current = setTimeout(() => {
            isUserScrollingRef.current = false;
            if (fullSurahModeRef.current) scrollToAyah(fullSurahIndexRef.current);
          }, 150);
        }}
        onMomentumScrollEnd={() => {
          if (scrollResumeTimerRef.current) clearTimeout(scrollResumeTimerRef.current);
          isUserScrollingRef.current = false;
          if (fullSurahModeRef.current) scrollToAyah(fullSurahIndexRef.current);
        }}
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          flatListRef.current?.scrollToOffset({ offset: averageItemLength * index, animated: true });
          setTimeout(() => scrollToAyah(index), 250);
        }}
        contentContainerStyle={{ paddingBottom: 120 }}
        viewabilityConfig={AYAH_VIEWABILITY_CONFIG}
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
      {isFullSurahMode && (
        <TouchableOpacity
          onPress={toggleFullSurahPlayback}
          style={styles.floatingPlaybackButton}
          accessibilityRole="button"
          accessibilityLabel={isAudioPlaying ? "Pause full surah" : "Resume full surah"}
        >
          <Text style={styles.floatingPlaybackIcon}>{isAudioPlaying ? "⏸" : "▶"}</Text>
          <Text style={styles.floatingPlaybackText}>
            {isAudioPlaying ? "Pause recitation" : "Resume recitation"}
          </Text>
        </TouchableOpacity>
      )}
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
  fullSurahButton: {
    alignSelf: "flex-start",
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: "#d4af37",
  },
  fullSurahButtonText: {
    color: "#1a472a",
    fontSize: 14,
    fontWeight: "800",
  },
  floatingPlaybackButton: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: "#1a472a",
    borderWidth: 2,
    borderColor: "#d4af37",
    ...Platform.select({
      web: { boxShadow: "0px 3px 6px rgba(0, 0, 0, 0.24)" },
      default: {
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.24,
        shadowRadius: 6,
      },
    }),
  },
  floatingPlaybackIcon: {
    color: "#d4af37",
    fontSize: 17,
    fontWeight: "800",
  },
  floatingPlaybackText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
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
    ...Platform.select({
      web: { boxShadow: "0px 3px 6px rgba(212, 175, 55, 0.2)" },
      default: {
        shadowColor: "#d4af37",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
      },
    }),
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
    ...Platform.select({
      web: { boxShadow: "0px 3px 6px rgba(212, 175, 55, 0.2)" },
      default: {
        shadowColor: "#d4af37",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
      },
    }),
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