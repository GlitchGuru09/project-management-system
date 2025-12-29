import axios from 'axios'; 

// Provide a sensible default for local development if VITE_BASEURL is not set
const baseURL = import.meta.env.VITE_BASEURL;

const api = axios.create({
    baseURL,
}); 

export default api;