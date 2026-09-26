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

	const data = await getVerseForDate(new Date());

	await AsyncStorage.setItem("verse_date", today);
	await AsyncStorage.setItem("verse_data", JSON.stringify(data));

	return data;
};

export const getVerseForDate = async (date: Date) => {
	// Quran has 6236 ayahs. A date-based index keeps each scheduled day stable.
	const calendarDay = Date.UTC(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
	);
	const ayahNumber =
		(Math.floor(calendarDay / (1000 * 60 * 60 * 24)) % 6236) + 1;
	const response = await fetch(
		`https://api.alquran.cloud/v1/ayah/${ayahNumber}/en.asad`,
	);

	const data = await response.json();
	return data.data;
};

export const fetchSurahWithTranslation = async (
	id: number,
	translationLang: string = "en.asad",
) => {
	const res = await fetch(
		`https://api.alquran.cloud/v1/surah/${id}/editions/quran-simple,${translationLang}`,
	);

	const data = await res.json();

	return {
		arabic: data.data[0],
		english: data.data[1].ayahs,
	};
};
