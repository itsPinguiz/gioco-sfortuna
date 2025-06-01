import axios from 'axios';

// Create API client
const API = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true,
});

// Authentication API calls
export const login = async (username, password) => {
  try {
    const response = await API.post('/sessions', { username, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await API.delete('/sessions/current');
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await API.get('/sessions/current');
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      return null; // Not authenticated
    }
    throw error;
  }
};

// Game API calls
export const createGame = async () => {
  try {
    const response = await API.post('/games');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getGameById = async (gameId) => {
  try {
    const response = await API.get(`/games/${gameId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserGames = async () => {
  try {
    const response = await API.get('/games');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getNextRoundCard = async (gameId) => {
  try {
    const response = await API.get(`/games/${gameId}/round`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const submitCardPlacement = async (gameId, cardId, position) => {
  try {
    const response = await API.post(`/games/${gameId}/round`, { cardId, position });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const endGame = async (gameId, result) => {
  try {
    const response = await API.post(`/games/${gameId}/end`, { result });
    return response.data;
  } catch (error) {
    throw error;
  }
};
