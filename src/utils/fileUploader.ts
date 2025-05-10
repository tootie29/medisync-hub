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

// Upload file and return the file path
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

// Simplified approach to upload logo files directly
export const uploadLogo = async (
  file: File,
  position: 'primary' | 'secondary'
): Promise<string> => {
  try {
    console.log(`FileUploader: Uploading ${position} logo file "${file.name}"`);
    
    // Create FormData object with the file
    const formData = new FormData();
    formData.append(position + 'Logo', file);
    
    console.log(`FileUploader: Sending ${position} logo to endpoint: /api/logos`);
    
    const response = await axios.post('/api/logos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('FileUploader: Server response:', response);
    
    if (!response.data) {
      console.error('FileUploader: Empty response from server');
      throw new Error('Empty server response');
    }
    
    if (response.data.error) {
      console.error('FileUploader: Server returned error:', response.data.error);
      throw new Error(response.data.error || 'Server error');
    }
    
    const uploadResults = response.data.uploads || [];
    const thisUpload = uploadResults.find((u: any) => u.position === position);
    
    if (!thisUpload || !thisUpload.path) {
      console.error(`FileUploader: No path returned for ${position} logo`);
      throw new Error('No logo path returned from server');
    }
    
    return thisUpload.path;
  } catch (error: any) {
    console.error(`FileUploader: Error uploading ${position} logo:`, error);
    
    // Include response data in error for better debugging
    if (error.response) {
      console.error('FileUploader: Response status:', error.response.status);
      console.error('FileUploader: Response data:', error.response.data);
      console.error('FileUploader: Response headers:', error.response.headers);
    }
    
    throw error;
  }
};

// Keep this for backward compatibility but make it call the direct upload method
export const uploadBase64ToDatabase = async (
  base64Data: string, 
  position: 'primary' | 'secondary'
): Promise<string> => {
  try {
    console.log(`FileUploader: Uploading ${position} logo using base64`);
    
    // Create payload with the file path for this specific logo position
    const payload = {
      [position + 'Logo']: base64Data
    };
    
    // Use relative paths for API endpoints
    const endpoint = '/api/logos/base64';
    console.log(`FileUploader: Sending ${position} logo to endpoint: ${endpoint}`);
    
    const response = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('FileUploader: Server response:', response);
    
    if (!response.data) {
      throw new Error('Empty server response');
    }
    
    if (response.data.error) {
      throw new Error(response.data.error || 'Server error');
    }
    
    return base64Data;
  } catch (error: any) {
    console.error(`FileUploader: Error uploading ${position} logo:`, error);
    throw error;
  }
};
