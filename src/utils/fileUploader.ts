import axios from 'axios';

// Function to generate a unique filename
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const ext = originalName.split('.').pop() || 'png';
  return `logo-${timestamp}-${random}.${ext}`;
};

// Convert file to base64 (keeping this method for preview functionality)
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Upload file and return the file path (new simplified approach)
export const saveFileToPublic = async (file: File): Promise<string> => {
  try {
    console.log('FileUploader: Processing file for upload', file.name, file.type, file.size);
    
    // Create a FormData object for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Use a simple POST to upload the file
    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('FileUploader: File upload response:', response.data);
    
    if (response.data && response.data.filePath) {
      return response.data.filePath;
    } else {
      throw new Error('Invalid server response');
    }
  } catch (error) {
    console.error('FileUploader: Error uploading file:', error);
    throw error;
  }
};

// Upload logo to the server with file path approach
export const uploadBase64ToDatabase = async (
  base64Data: string, 
  position: 'primary' | 'secondary'
): Promise<string> => {
  try {
    console.log(`FileUploader: Uploading ${position} logo to server`);
    
    // Create payload with the file path for this specific logo position
    const payload = {
      [position + 'Logo']: base64Data
    };
    
    // Use relative paths for API endpoints
    const endpoint = '/api/logos/base64';
    console.log(`FileUploader: Sending ${position} logo to endpoint: ${endpoint}`);
    
    const response = await axios.post(endpoint, payload, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('FileUploader: Server response:', response.data);
    
    if (!response.data || response.data.error) {
      throw new Error(response.data?.error || 'Failed to upload logo');
    }
    
    return base64Data;
  } catch (error: any) {
    console.error(`FileUploader: Error uploading ${position} logo:`, error);
    throw error;
  }
};
