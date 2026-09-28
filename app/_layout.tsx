import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import StoreUpdatePrompt from "../src/components/StoreUpdatePrompt";

export default function Layout() {

  const [loaded] = useFonts({
    AmiriQuran: require("../assets/fonts/AmiriQuran-Regular.ttf"),
  });

  if (!loaded) return null;
  return (
    <>
      <StoreUpdatePrompt />
      <Stack>
        <Stack.Screen name="index" options={{ title: "Today" }} />
        <Stack.Screen name="quran" options={{ title: "Quran" }} />
        <Stack.Screen name="tasbih" options={{ title: "Tasbih" }} />
        <Stack.Screen name="duas" options={{ title: "Daily Duas" }} />
        <Stack.Screen name="calendar" options={{ title: "Hijri Calendar" }} />
        <Stack.Screen name="surah/[id]" options={{ title: "Surah" }} />
      </Stack>
    </>
  );
}