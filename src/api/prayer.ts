import * as Location from "expo-location";

export async function getPrayerTimes(city: string) {
	const res = await fetch(
		`https://api.aladhan.com/v1/timingsByCity?city=${city}&country=India`,
	);

	const data = await res.json();
	return data.data.timings;
}

export async function getPrayerTimesForDate(city: string, date: Date) {
	const datePath = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
	const res = await fetch(
		`https://api.aladhan.com/v1/timingsByCity/${datePath}?city=${encodeURIComponent(city)}&country=India`,
	);

	if (!res.ok) throw new Error(`Prayer times request failed: ${res.status}`);

	const data = await res.json();
	if (!data.data?.timings)
		throw new Error("Prayer times were unavailable for the requested date");
	return data.data.timings;
}

export async function getCurrentCity() {
	try {
		const { status } = await Location.requestForegroundPermissionsAsync();

		if (status !== "granted") {
			return "Bangalore"; // fallback if denied
		}

		const location = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.Balanced,
		});

		const geocode = await Location.reverseGeocodeAsync(location.coords);

		if (geocode.length > 0 && geocode[0].city) {
			return geocode[0].city;
		}

		return "Bangalore";
	} catch (error) {
		// console.log("Location error:", error);
		return "Bangalore";
	}
}
