export async function getSurahs() {
  const res = await fetch("https://api.alquran.cloud/v1/surah");
  const data = await res.json();
  return data.data;
}

export async function getAyahs(surahId: string) {
  const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahId}`);
  const data = await res.json();
  return data.data.ayahs;
}