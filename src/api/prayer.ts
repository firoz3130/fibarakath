export async function getPrayerTimes(city: string) {
  const res = await fetch(
    `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=India`
  );

  const data = await res.json();
  return data.data.timings;
}