import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const STORAGE_KEY = "tasbih_state_v2";
const LEGACY_COUNT_KEY = "tasbih_count";
const ROUTINE_TARGET = 33;

const dhikrOptions = [
    { id: "subhanallah", name: "Subhanallah", arabic: "سُبْحَانَ اللّٰهِ" },
    { id: "alhamdulillah", name: "Alhamdulillah", arabic: "الْحَمْدُ لِلّٰهِ" },
    { id: "allahu-akbar", name: "Allahu Akbar", arabic: "اللّٰهُ أَكْبَرُ" },
    { id: "astaghfirullah", name: "Astaghfirullah", arabic: "أَسْتَغْفِرُ اللّٰهَ" },
    { id: "tahlil", name: "La ilaha illallah", arabic: "لَا إِلٰهَ إِلَّا اللّٰهُ" },
];

const routineIds = ["subhanallah", "alhamdulillah", "allahu-akbar"];
const routineDhikr = routineIds.map((id) => dhikrOptions.find((dhikr) => dhikr.id === id)!);

type CounterMode = "free" | "routine";

type SavedTasbihState = {
    mode: CounterMode;
    selectedDhikrId: string;
    freeCounts: Record<string, number>;
    routineCounts: number[];
};

export default function TasbihScreen() {
    const [mode, setMode] = useState<CounterMode>("free");
    const [selectedDhikrId, setSelectedDhikrId] = useState(dhikrOptions[0].id);
    const [freeCounts, setFreeCounts] = useState<Record<string, number>>({});
    const [routineCounts, setRoutineCounts] = useState([0, 0, 0]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const loadTasbih = async () => {
            try {
                const savedState = await AsyncStorage.getItem(STORAGE_KEY);
                if (savedState) {
                    const saved = JSON.parse(savedState) as Partial<SavedTasbihState>;
                    if (saved.mode === "free" || saved.mode === "routine") setMode(saved.mode);
                    if (dhikrOptions.some((dhikr) => dhikr.id === saved.selectedDhikrId)) {
                        setSelectedDhikrId(saved.selectedDhikrId!);
                    }
                    if (saved.freeCounts) setFreeCounts(saved.freeCounts);
                    if (Array.isArray(saved.routineCounts)) {
                        setRoutineCounts(routineIds.map((_, index) =>
                            Math.min(ROUTINE_TARGET, Math.max(0, Number(saved.routineCounts?.[index]) || 0))
                        ));
                    }
                } else {
                    const legacyCount = await AsyncStorage.getItem(LEGACY_COUNT_KEY);
                    if (legacyCount !== null) {
                        setFreeCounts({ [dhikrOptions[0].id]: Math.max(0, Number(legacyCount) || 0) });
                    }
                }
            } catch (error) {
                console.log("Tasbih data could not be loaded:", error);
            } finally {
                setLoaded(true);
            }
        };

        loadTasbih();
    }, []);

    useEffect(() => {
        if (!loaded) return;
        const saved: SavedTasbihState = { mode, selectedDhikrId, freeCounts, routineCounts };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saved)).catch((error) => {
            console.log("Tasbih data could not be saved:", error);
        });
    }, [loaded, mode, selectedDhikrId, freeCounts, routineCounts]);

    const selectedDhikr = dhikrOptions.find((dhikr) => dhikr.id === selectedDhikrId) ?? dhikrOptions[0];
    const activeRoutineIndex = routineCounts.findIndex((count) => count < ROUTINE_TARGET);
    const activeRoutineDhikr = routineDhikr[Math.max(activeRoutineIndex, 0)];
    const currentDhikr = mode === "free" ? selectedDhikr : activeRoutineDhikr;
    const currentCount = mode === "free"
        ? (freeCounts[selectedDhikrId] ?? 0)
        : (routineCounts[Math.max(activeRoutineIndex, 0)] ?? ROUTINE_TARGET);
    const routineComplete = activeRoutineIndex === -1;
    const progress = Math.min(currentCount / ROUTINE_TARGET, 1);

    const increment = () => {
        if (!loaded) return;
        if (mode === "free") {
            setFreeCounts((counts) => ({ ...counts, [selectedDhikrId]: (counts[selectedDhikrId] ?? 0) + 1 }));
            return;
        }

        if (routineComplete) return;
        setRoutineCounts((counts) => counts.map((count, index) =>
            index === activeRoutineIndex ? Math.min(ROUTINE_TARGET, count + 1) : count
        ));
    };

    const resetCurrent = () => {
        if (mode === "free") {
            Alert.alert("Reset this counter?", `Reset ${selectedDhikr.name} to zero?`, [
                { text: "Cancel", style: "cancel" },
                { text: "Reset", style: "destructive", onPress: () => setFreeCounts((counts) => ({ ...counts, [selectedDhikrId]: 0 })) },
            ]);
            return;
        }

        Alert.alert("Restart the routine?", "This will reset all three dhikr counts.", [
            { text: "Cancel", style: "cancel" },
            { text: "Restart", style: "destructive", onPress: () => setRoutineCounts([0, 0, 0]) },
        ]);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#1a472a", "#2d5a3d"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.title}>Tasbih</Text>
                <Text style={styles.subtitle}>Pause, remember, repeat</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.modeSwitch} accessibilityRole="tablist">
                    <TouchableOpacity
                        onPress={() => setMode("free")}
                        style={[styles.modeButton, mode === "free" && styles.modeButtonActive]}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: mode === "free" }}
                    >
                        <Text style={[styles.modeButtonText, mode === "free" && styles.modeButtonTextActive]}>Free count</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setMode("routine")}
                        style={[styles.modeButton, mode === "routine" && styles.modeButtonActive]}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: mode === "routine" }}
                    >
                        <Text style={[styles.modeButtonText, mode === "routine" && styles.modeButtonTextActive]}>33 each</Text>
                    </TouchableOpacity>
                </View>

                {mode === "free" ? (
                    <>
                        <Text style={styles.sectionLabel}>Choose dhikr</Text>
                        <View style={styles.dhikrGrid}>
                            {dhikrOptions.map((dhikr) => (
                                <TouchableOpacity
                                    key={dhikr.id}
                                    onPress={() => setSelectedDhikrId(dhikr.id)}
                                    style={[styles.dhikrOption, selectedDhikrId === dhikr.id && styles.dhikrOptionActive]}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: selectedDhikrId === dhikr.id }}
                                >
                                    <Text style={[styles.dhikrOptionArabic, selectedDhikrId === dhikr.id && styles.dhikrOptionTextActive]}>{dhikr.arabic}</Text>
                                    <Text style={[styles.dhikrOptionName, selectedDhikrId === dhikr.id && styles.dhikrOptionTextActive]}>{dhikr.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                ) : (
                    <View style={styles.routineList}>
                        <Text style={styles.sectionLabel}>33 repetitions each</Text>
                        {routineDhikr.map((dhikr, index) => {
                            const done = routineCounts[index] >= ROUTINE_TARGET;
                            const active = index === activeRoutineIndex;
                            return (
                                <View key={dhikr.id} style={[styles.routineRow, active && styles.routineRowActive]}>
                                    <View style={styles.routineName}>
                                        <Text style={styles.routineArabic}>{dhikr.arabic}</Text>
                                        <Text style={styles.routineEnglish}>{dhikr.name}</Text>
                                    </View>
                                    <Text style={[styles.routineCount, done && styles.routineDone]}>
                                        {done ? "Done" : `${routineCounts[index]} / ${ROUTINE_TARGET}`}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                )}

                <View style={styles.counterSummary}>
                    <Text style={styles.label}>{mode === "free" ? "CURRENT COUNT" : routineComplete ? "ROUTINE COMPLETE" : `DHIKR ${activeRoutineIndex + 1} OF 3`}</Text>
                    <Text style={styles.count}>{currentCount}</Text>
                    {mode === "routine" && <Text style={styles.targetText}>of {ROUTINE_TARGET} repetitions</Text>}
                    {mode === "routine" && (
                        <View style={styles.progressTrack}>
                            <View style={[styles.progress, { width: `${progress * 100}%` }]} />
                        </View>
                    )}
                </View>

                <TouchableOpacity
                    onPress={increment}
                    activeOpacity={0.85}
                    disabled={!loaded || (mode === "routine" && routineComplete)}
                    style={[styles.counterButton, (mode === "routine" && routineComplete) && styles.counterButtonComplete]}
                    accessibilityLabel={mode === "routine" && routineComplete ? "Routine complete" : `Count ${currentDhikr.name}`}
                >
                    <Text style={styles.counterButtonArabic}>{currentDhikr.arabic}</Text>
                    <Text style={styles.counterButtonText}>
                        {mode === "routine" && routineComplete ? "Alhamdulillah, complete" : `Tap to count · ${currentDhikr.name}`}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={resetCurrent} style={styles.resetButton} accessibilityLabel={mode === "free" ? "Reset current counter" : "Restart 33 each routine"}>
                    <Text style={styles.resetText}>{mode === "free" ? "↺  Reset this counter" : "↺  Restart routine"}</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f7f3" },
    header: {
        paddingTop: 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    title: { fontSize: 34, fontWeight: "800", color: "#fff" },
    subtitle: { marginTop: 6, fontSize: 15, color: "#d4af37", fontWeight: "600" },
    content: { padding: 20, paddingBottom: 40 },
    modeSwitch: { flexDirection: "row", padding: 4, backgroundColor: "#e9e7df", borderRadius: 10 },
    modeButton: { flex: 1, paddingVertical: 11, alignItems: "center", borderRadius: 7 },
    modeButtonActive: { backgroundColor: "#1a472a" },
    modeButtonText: { color: "#555", fontSize: 14, fontWeight: "700" },
    modeButtonTextActive: { color: "#fff" },
    sectionLabel: { marginTop: 22, marginBottom: 12, color: "#1a1a1a", fontSize: 14, fontWeight: "800" },
    dhikrGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    dhikrOption: { width: "48%", minHeight: 74, padding: 10, justifyContent: "center", backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#e0e0e0" },
    dhikrOptionActive: { backgroundColor: "#1a472a", borderColor: "#1a472a" },
    dhikrOptionArabic: { color: "#1a472a", fontSize: 18, textAlign: "center", fontWeight: "700" },
    dhikrOptionName: { marginTop: 3, color: "#666", fontSize: 12, textAlign: "center", fontWeight: "600" },
    dhikrOptionTextActive: { color: "#fff" },
    routineList: { marginTop: 2 },
    routineRow: { minHeight: 66, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#ece9df" },
    routineRowActive: { borderLeftWidth: 3, borderLeftColor: "#d4af37" },
    routineName: { flex: 1 },
    routineArabic: { color: "#1a472a", fontSize: 18, fontWeight: "700" },
    routineEnglish: { marginTop: 2, color: "#777", fontSize: 12 },
    routineCount: { marginLeft: 8, color: "#555", fontSize: 13, fontWeight: "700" },
    routineDone: { color: "#2d5a3d" },
    counterSummary: { alignItems: "center", marginTop: 20 },
    label: { fontSize: 12, color: "#888", fontWeight: "800", letterSpacing: 2 },
    count: { marginTop: 4, fontSize: 64, color: "#1a472a", fontWeight: "900" },
    targetText: { color: "#777", fontSize: 14 },
    progressTrack: { width: "100%", height: 8, marginTop: 14, backgroundColor: "#e4e0d5", borderRadius: 4, overflow: "hidden" },
    progress: { height: "100%", backgroundColor: "#d4af37", borderRadius: 4 },
    counterButton: { width: "100%", minHeight: 160, marginTop: 22, borderRadius: 18, alignItems: "center", justifyContent: "center", paddingHorizontal: 14, backgroundColor: "#1a472a", shadowColor: "#1a472a", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
    counterButtonComplete: { backgroundColor: "#2d5a3d" },
    counterButtonArabic: { color: "#fff", fontSize: 28, fontWeight: "700", textAlign: "center" },
    counterButtonText: { marginTop: 12, color: "#d4af37", fontSize: 14, fontWeight: "700", textAlign: "center" },
    resetButton: { alignSelf: "center", marginTop: 16, padding: 10 },
    resetText: { color: "#a04b3b", fontWeight: "700" },
});