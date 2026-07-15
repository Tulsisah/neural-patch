const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function fetchRepos(token) {
  const response = await fetch(`${API_URL}/api/repos`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch repos');
  }
  return response.json();
}
