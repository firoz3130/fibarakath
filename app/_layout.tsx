import { Stack } from "expo-router";
import { useFonts } from "expo-font";

export default function Layout() {

    const [loaded] = useFonts({
    AmiriQuran: require("../assets/fonts/AmiriQuran-Regular.ttf"),
  });

  if (!loaded) return null;
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Today" }} />
      <Stack.Screen name="quran" options={{ title: "Quran" }} />
      <Stack.Screen name="surah/[id]" options={{ title: "Surah" }} />
    </Stack>
  );
}