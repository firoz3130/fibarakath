import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getSurahs() {
  const res = await fetch("https://api.alquran.cloud/v1/surah");
  const data = await res.json();
  return data.data;
}

export async function getAyahs(surahId: string) {
  const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}`);
  const data = await res.json();
  return data.dreadmeata;
}

export const getVerseOfTheDay = async () => {
  const today = new Date().toDateString();
  const savedDate = await AsyncStorage.getItem("verse_date");
  const savedVerse = await AsyncStorage.getItem("verse_data");

  if (savedDate === today && savedVerse) {
    return JSON.parse(savedVerse);
  }

  // Quran has 6236 ayahs
  const randomAyahNumber = Math.floor(
    (new Date().getTime() / (1000 * 60 * 60 * 24)) % 6236
  ) + 1;

  const response = await fetch(
    `https://api.alquran.cloud/v1/ayah/${randomAyahNumber}/en.asad`
  );

  const data = await response.json();

  await AsyncStorage.setItem("verse_date", today);
  await AsyncStorage.setItem("verse_data", JSON.stringify(data.data));

  return data.data;
};