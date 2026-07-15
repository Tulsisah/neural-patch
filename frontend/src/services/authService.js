const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function loginUser(email, password) {

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        return { success: false, error: errorJson.error || 'Login failed' };
      } catch (e) {
        return { success: false, error: `Server error: ${response.status} ${response.statusText}` };
      }
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: 'Network error or server unreachable' };
  }
}
