import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from "react-native";
import { getAyahs } from "../../src/api/quran";


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


        const PAGE_SIZE = 5;
        const { width } = Dimensions.get("window");

        const pages = useMemo(() => {
          const result = [];
          for (let i = 0; i < ayahs.length; i += PAGE_SIZE) {
            result.push(ayahs.slice(i, i + PAGE_SIZE));
          }
          return result;
        }, [ayahs]);

          useEffect(() => {
            if (!id) return;

            getAyahs(String(id)).then((data) => {
              let ayahList = data.ayahs.map((a: any) => ({ ...a }));

              const BISMILLAH_TEXT =
                "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ";

              // Surah 9 → no Bismillah anywhere
              if (data.number !== 9) {
                // Remove Bismillah text from first ayah if it exists
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
              setSurahName(
                `Surah ${data.number} – ${data.englishName} (${data.name})`
              );
            });
          }, [id]);

      const mushafText = useMemo(() => {
        return ayahs.map((a) => `${a.text} ﴿${a.numberInSurah}﴾`).join("  ");
      }, [ayahs]);

      return (
        <View style={styles.container}>
          <LinearGradient colors={["#1a472a", "#2d5a3d"]} style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{surahName}</Text>
          </LinearGradient>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {pages.map((page, index) => (
              <View key={index} style={styles.pageBlock}>
                
                {index === 0 && showBismillah && (
                  <Text style={styles.bismillah}>
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </Text>
                )}

                {page.map((a) => (
                  <Text key={a.number} selectable style={styles.mushafText}>
                    {a.text} ﴿{toArabicNumber(a.numberInSurah)}﴾
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>
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
       pageBlock: {
        width: Dimensions.get("window").width,
        padding: 20,
        justifyContent: "flex-start",
      },
      });