import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'user_jwt';

/**
 * Stores the JWT token securely.
 * @param {string} token 
 */
export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error("Failed to save the token to storage", e);
  }
};

/**
 * Retrieves the JWT token.
 * @returns {Promise<string | null>}
 */
export const getToken = async () => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch (e) {
    console.error("Failed to fetch the token from storage", e);
    return null;
  }
};

/**
 * Removes the JWT token, effectively logging the user out.
 */
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error("Failed to remove the token from storage", e);
  }
};