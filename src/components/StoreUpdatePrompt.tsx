import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Updates from "expo-updates";
import { useEffect } from "react";
import { Alert, Linking, Platform } from "react-native";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.anonymous.fibarakath";
const DISMISSED_KEY_PREFIX = "store-update-dismissed-";

function compareVersions(left: string, right: string) {
    const leftParts = left.split(".").map(Number);
    const rightParts = right.split(".").map(Number);

    for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
        const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
        if (difference !== 0) return difference;
    }

    return 0;
}

export default function StoreUpdatePrompt() {
    const minimumRuntimeVersion = Constants.expoConfig?.extra?.updatePrompt?.minimumRuntimeVersion;

    useEffect(() => {
        if (
            Platform.OS !== "android" ||
            typeof minimumRuntimeVersion !== "string" ||
            !/^\d+(\.\d+)*$/.test(minimumRuntimeVersion) ||
            !Updates.runtimeVersion ||
            compareVersions(Updates.runtimeVersion, minimumRuntimeVersion) >= 0
        ) {
            return;
        }

        let cancelled = false;
        const dismissedKey = `${DISMISSED_KEY_PREFIX}${minimumRuntimeVersion}`;

        AsyncStorage.getItem(dismissedKey)
            .then((dismissed) => {
                if (cancelled || dismissed) return;

                Alert.alert(
                    "New features are available",
                    "Update Fibarakath from the Play Store to get the latest features.",
                    [
                        {
                            text: "Later",
                            style: "cancel",
                            onPress: () => {
                                AsyncStorage.setItem(dismissedKey, "true").catch((error) => {
                                    console.log("Could not save update prompt dismissal:", error);
                                });
                            },
                        },
                        {
                            text: "Update",
                            onPress: () => {
                                Linking.openURL(PLAY_STORE_URL).catch((error) => {
                                    console.log("Could not open Play Store:", error);
                                });
                            },
                        },
                    ],
                    { cancelable: false }
                );
            })
            .catch((error) => {
                console.log("Could not check update prompt dismissal:", error);
            });

        return () => {
            cancelled = true;
        };
    }, [minimumRuntimeVersion]);

    return null;
}