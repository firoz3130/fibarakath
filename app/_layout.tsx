import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Today" }} />
      <Stack.Screen name="quran" options={{ title: "Quran" }} />
      <Stack.Screen name="surah/[id]" options={{ title: "Surah" }} />
    </Stack>
  );
}