import "react-native-url-polyfill/auto";

// AsyncStorage mock
jest.mock("@react-native-async-storage/async-storage", () =>
	require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// NetInfo mock
jest.mock("@react-native-community/netinfo", () => {
	let listener: ((state: any) => void) | null = null;
	return {
		addEventListener: (cb: (state: any) => void) => {
			listener = cb;
			return () => {
				listener = null;
			};
		},
		__emit: (state: any) => listener && listener(state),
		fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
	};
});

// SecureStore mock (useful for docs/examples)
jest.mock("expo-secure-store", () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn(),
}));

// Default fetch mock; individual tests can override
// @ts-ignore
global.fetch = jest.fn();

