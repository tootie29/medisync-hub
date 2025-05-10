
import axios from 'axios';

// Function to generate a unique filename (for reference only)
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const ext = originalName.split('.').pop() || 'png';
  return `logo-${timestamp}-${random}.${ext}`;
};

// Convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Process file entirely client-side and return base64 data
export const saveFileToPublic = async (file: File): Promise<string> => {
  try {
    console.log('FileUploader: Processing file client-side only', file.name, file.type, file.size);
    
    // Convert the file to base64 directly - no server storage
    const base64Data = await fileToBase64(file);
    console.log('FileUploader: Converted file to base64, ready for database storage');
    
    return base64Data;
  } catch (error) {
    console.error('FileUploader: Error processing file:', error);
    throw error;
  }
};

// Upload base64 image directly to database - FIXED: separate uploads and better error handling
export const uploadBase64ToDatabase = async (
  base64Data: string, 
  position: 'primary' | 'secondary'
): Promise<string> => {
  try {
    console.log(`FileUploader: Saving ${position} logo directly to database as base64`);
    console.log(`FileUploader: Base64 data length: ${base64Data.length}`);
    
    // CRITICAL FIX: Send each logo in a separate request with proper Content-Type
    // Create payload with just the base64 data for this specific logo
    const payload: Record<string, string> = {};
    payload[`${position}Logo`] = base64Data;
    
    console.log(`FileUploader: Sending ${position} logo to endpoint: /api/logos/base64`);
    console.log(`FileUploader: Payload size: ${JSON.stringify(payload).length} bytes`);
    
    // CRITICAL FIX: Ensure we're using proper Content-Type and withCredentials for session cookies
    const response = await axios.post('/api/logos/base64', payload, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // Add this to ensure proper CORS handling
        'Cache-Control': 'no-cache' // Prevent caching
      },
      // Track upload progress for debugging
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`FileUploader: Upload progress: ${percentCompleted}%`);
        }
      }
    });
    
    console.log('FileUploader: Server response:', response.data);
    
    if (!response || !response.data || !response.data.uploads || !response.data.uploads[0]?.success) {
      console.error('FileUploader: Received invalid or error response from server', response?.data);
      throw new Error(response?.data?.error || 'Invalid response from server');
    }
    
    console.log(`FileUploader: ${position} logo saved to database, response:`, response.data);
    return base64Data;
  } catch (error: any) {
    console.error('FileUploader: Error saving to database:', error);
    console.error('FileUploader: Error details:', error.response?.data || error.message || 'Unknown error');
    throw error;
  }
};
