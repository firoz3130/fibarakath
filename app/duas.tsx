import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const categories = ["All", "Travel", "Eating", "Home", "Sleep & waking", "Distress"];

const duas = [
    {
        category: "Travel",
        title: "When setting out",
        arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ ۝ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ",
        transliteration: "Subḥāna alladhī sakhkhara lanā hādhā wa mā kunnā lahu muqrinīn. Wa innā ilā rabbinā lamunqalibūn.",
        meaning: "Glory be to the One Who has subjected this to us; we could not have done so on our own. And surely to our Lord we will return.",
        source: "Qur'an 43:13–14",
        url: "https://quran.com/43/13-14",
    },
    {
        category: "Eating",
        title: "Before eating",
        arabic: "بِسْمِ اللَّهِ",
        transliteration: "Bismillah.",
        meaning: "In the name of Allah.",
        source: "Sunan Abi Dawud 3767",
        url: "https://sunnah.com/abudawud:3767",
    },
    {
        category: "Eating",
        title: "If you forgot to begin with Bismillah",
        arabic: "بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ",
        transliteration: "Bismillahi awwalahu wa akhirahu.",
        meaning: "In the name of Allah at its beginning and its end.",
        source: "Sunan Abi Dawud 3767",
        url: "https://sunnah.com/abudawud:3767",
    },
    {
        category: "Eating",
        title: "After eating",
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا الطَّعَامَ وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ",
        transliteration: "Alhamdu lillahil-ladhī atʿamanī hādhā aṭ-ṭaʿāma wa razaqanīhi min ghayri ḥawlin minnī wa lā quwwah.",
        meaning: "Praise be to Allah, Who has fed me this food and provided it for me without any might or power on my part.",
        source: "Sunan Abi Dawud 4023",
        url: "https://sunnah.com/abudawud:4023",
    },
    {
        category: "Home",
        title: "When leaving home",
        arabic: "بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
        transliteration: "Bismillāh, tawakkaltu ʿalallāh, lā ḥawla wa lā quwwata illā billāh.",
        meaning: "In the name of Allah; I place my trust in Allah. There is no might or power except through Allah.",
        source: "Sunan Abi Dawud 5095",
        url: "https://sunnah.com/abudawud:5095",
    },
    {
        category: "Sleep & waking",
        title: "Before sleep",
        arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
        transliteration: "Bismika Allāhumma amūtu wa aḥyā.",
        meaning: "In Your name, O Allah, I die and I live.",
        source: "Sahih al-Bukhari 6324",
        url: "https://sunnah.com/bukhari:6324",
    },
    {
        category: "Sleep & waking",
        title: "Upon waking",
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
        transliteration: "Alhamdu lillāhil-ladhī aḥyānā baʿda mā amātanā wa ilayhin-nushūr.",
        meaning: "Praise be to Allah, Who gave us life after causing us to die, and to Him is the resurrection.",
        source: "Sahih al-Bukhari 6324",
        url: "https://sunnah.com/bukhari:6324",
    },
    {
        category: "Distress",
        title: "The supplication of Yunus",
        arabic: "لَا إِلَٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ",
        transliteration: "Lā ilāha illā anta, subḥānaka innī kuntu minaẓ-ẓālimīn.",
        meaning: "There is no god worthy of worship except You. Glory be to You! I have certainly done wrong.",
        source: "Qur'an 21:87",
        url: "https://quran.com/21/87",
    },
];

export default function DuasScreen() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const visibleDuas = selectedCategory === "All"
        ? duas
        : duas.filter((dua) => dua.category === selectedCategory);

    const openSource = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch (error) {
            console.log("Could not open dua source:", error);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#1a472a", "#2d5a3d"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.title}>Everyday Duas</Text>
                <Text style={styles.subtitle}>Supplications for life’s moments</Text>
            </LinearGradient>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
            >
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category}
                        onPress={() => setSelectedCategory(category)}
                        style={[styles.categoryButton, selectedCategory === category && styles.categoryButtonActive]}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: selectedCategory === category }}
                    >
                        <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView contentContainerStyle={styles.duaList}>
                {visibleDuas.map((dua) => (
                    <View key={`${dua.category}-${dua.title}`} style={styles.duaEntry}>
                        <View style={styles.entryHeading}>
                            <Text style={styles.categoryLabel}>{dua.category}</Text>
                            <Text style={styles.entryTitle}>{dua.title}</Text>
                        </View>
                        <Text selectable style={styles.arabic}>{dua.arabic}</Text>
                        <Text style={styles.transliteration}>{dua.transliteration}</Text>
                        <Text style={styles.meaning}>{dua.meaning}</Text>
                        <TouchableOpacity onPress={() => openSource(dua.url)} style={styles.sourceButton}>
                            <Text style={styles.sourceText}>{dua.source}  ↗</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f7f3" },
    header: { paddingTop: 42, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    title: { color: "#fff", fontSize: 30, fontWeight: "800" },
    subtitle: { marginTop: 5, color: "#e4cf8e", fontSize: 14, fontWeight: "600" },
    categoryList: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
    categoryButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, backgroundColor: "#e9e7df" },
    categoryButtonActive: { backgroundColor: "#1a472a" },
    categoryText: { color: "#555", fontSize: 13, fontWeight: "700" },
    categoryTextActive: { color: "#fff" },
    duaList: { paddingHorizontal: 16, paddingBottom: 32 },
    duaEntry: { marginBottom: 12, padding: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e7e4dc", borderRadius: 10 },
    entryHeading: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 },
    categoryLabel: { color: "#805f13", backgroundColor: "#f6efd9", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 11, fontWeight: "800" },
    entryTitle: { color: "#1a472a", fontSize: 16, fontWeight: "800" },
    arabic: { color: "#1b3528", fontFamily: "AmiriQuran", fontSize: 25, lineHeight: 46, textAlign: "right" },
    transliteration: { marginTop: 12, color: "#486052", fontSize: 14, lineHeight: 21, fontStyle: "italic" },
    meaning: { marginTop: 8, color: "#333", fontSize: 14, lineHeight: 21 },
    sourceButton: { alignSelf: "flex-start", marginTop: 12, paddingVertical: 6 },
    sourceText: { color: "#805f13", fontSize: 12, fontWeight: "700" },
});