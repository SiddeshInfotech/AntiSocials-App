import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getDevHost = (): string | null => {
	const hostUri = (Constants.expoConfig as { hostUri?: string } | null)?.hostUri;
	if (!hostUri) {
		return null;
	}

	const [host] = hostUri.split(':');
	return host || null;
};

const envBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const fallbackHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const resolvedHost = getDevHost() ?? fallbackHost;

// Use EXPO_PUBLIC_API_BASE_URL when set, otherwise derive from Expo dev host.
export const API_BASE_URL = envBaseUrl || `http://${resolvedHost}:5000`;
