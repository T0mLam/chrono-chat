import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8001',
    headers: {
        'Content-Type': 'application/json',
    },
    });

export default axiosClient;