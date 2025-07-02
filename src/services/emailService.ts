
import axios from 'axios';

// Use the correct API base URL for production
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api'
  : 'https://api.climasys.entrsolutions.com/api';

export interface SendPDFEmailRequest {
  email: string;
  subject?: string;
  message?: string;
  pdfData: string; // base64 encoded PDF
  fileName?: string;
}

export interface SendPDFEmailResponse {
  success: boolean;
  message: string;
  error?: string;
}

export const sendPDFEmail = async (data: SendPDFEmailRequest): Promise<SendPDFEmailResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/email/send-pdf`, data);
    return response.data;
  } catch (error) {
    console.error('Error sending PDF email:', error);
    throw error;
  }
};
