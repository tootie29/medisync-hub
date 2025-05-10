
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

// Upload base64 image directly to database - FIX: add proper headers and credentials
export const uploadBase64ToDatabase = async (
  base64Data: string, 
  position: 'primary' | 'secondary'
): Promise<string> => {
  try {
    console.log(`FileUploader: Saving ${position} logo directly to database as base64`);
    console.log(`FileUploader: Base64 data length: ${base64Data.length}`);
    
    // Create payload with just the base64 data
    const payload: Record<string, string> = {};
    payload[`${position}Logo`] = base64Data;
    
    // Debug the request
    console.log(`FileUploader: Sending ${position} logo to endpoint: /api/logos/base64`);
    console.log(`FileUploader: Payload size: ${JSON.stringify(payload).length} bytes`);
    
    // FIX: Ensure proper Content-Type and withCredentials for authentication
    const response = await axios.post('/api/logos/base64', payload, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
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
    
    if (!response || !response.data) {
      console.error('FileUploader: Received invalid response from server');
      throw new Error('Invalid response from server: empty response');
    }
    
    console.log(`FileUploader: ${position} logo saved to database, response:`, response.data);
    return base64Data;
  } catch (error) {
    console.error('FileUploader: Error saving to database:', error);
    console.error('FileUploader: Error details:', JSON.stringify(error));
    throw error;
  }
};
