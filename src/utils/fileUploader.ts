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

// Completely rewritten uploadLogo function with robust error handling and ability to handle HTML responses
export const uploadLogo = async (
  file: File,
  position: 'primary' | 'secondary'
): Promise<string> => {
  try {
    console.log(`FileUploader: Uploading ${position} logo file "${file.name}"`);
    
    // Create FormData object with the file
    const formData = new FormData();
    formData.append('file', file);
    
    // CRITICAL FIX: Use absolute path to explicitly hit the API server
    const endpoint = `/api/logos/upload-logo/${position}`;
    console.log(`FileUploader: Sending ${position} logo to endpoint: ${endpoint}`);
    
    // Add debug info for this request
    console.log(`File size: ${file.size} bytes, type: ${file.type}`);
    
    // Set explicit content type header and timeout
    const response = await axios.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'X-Requested-With': 'XMLHttpRequest' // Help server distinguish AJAX requests
      },
      timeout: 30000, // 30 seconds timeout
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
        console.log(`FileUploader: Upload progress: ${percentCompleted}%`);
      },
      // Critical: Do not transform the response data
      transformResponse: [(data) => data]
    });
    
    console.log('FileUploader: Response status:', response.status);
    console.log('FileUploader: Response content-type:', response.headers['content-type']);
    
    // Check if we got HTML instead of JSON
    if (typeof response.data === 'string') {
      console.log('FileUploader: Raw response:', response.data.substring(0, 200) + '...');
      
      if (response.data.includes('<!DOCTYPE html>')) {
        console.error('FileUploader: Received HTML instead of JSON - API routing issue');
        throw new Error('API routing issue - received HTML instead of JSON response. Check server configuration.');
      }
      
      // Try to parse JSON response
      try {
        const parsedData = JSON.parse(response.data);
        console.log('FileUploader: Parsed JSON response:', parsedData);
        
        // Check for success and file path in the parsed response
        if (parsedData.success && parsedData.filePath) {
          console.log(`FileUploader: Upload successful, file path: ${parsedData.filePath}`);
          return parsedData.filePath;
        } else if (parsedData.error) {
          console.error(`FileUploader: Server returned error:`, parsedData.error);
          throw new Error(parsedData.error);
        } else {
          console.error('FileUploader: No file path in response:', parsedData);
          throw new Error('No file path returned from server');
        }
      } catch (parseError) {
        console.error('FileUploader: Failed to parse response as JSON:', parseError);
        throw new Error('Invalid JSON response from server');
      }
    } else {
      // Response was already parsed as JSON
      const responseData = response.data;
      console.log('FileUploader: Response data (already parsed):', responseData);
      
      // Check for success and file path in the response
      if (responseData.success && responseData.filePath) {
        console.log(`FileUploader: Upload successful, file path: ${responseData.filePath}`);
        return responseData.filePath;
      } else if (responseData.error) {
        console.error(`FileUploader: Server returned error:`, responseData.error);
        throw new Error(responseData.error);
      } else {
        console.error('FileUploader: No file path in response:', responseData);
        throw new Error('No file path returned from server');
      }
    }
  } catch (error: any) {
    // Enhanced error logging
    console.error(`FileUploader: Error uploading ${position} logo:`, error);
    
    // Check if it's an Axios error with response
    if (error.response) {
      console.error('FileUploader: Server response status:', error.response.status);
      console.error('FileUploader: Server response data:', error.response.data);
      console.error('FileUploader: Server response headers:', error.response.headers);
      
      // If we got HTML instead of JSON, this is a clear indication something's wrong
      if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
        console.error('FileUploader: Received HTML instead of JSON - API endpoint issue');
        throw new Error('API routing issue - received HTML instead of JSON. The server is not properly configured for API requests.');
      }
    }
    
    throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
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
    
    // Use simpler endpoint
    const endpoint = `/api/logos/upload-base64-logo/${position}`;
    console.log(`FileUploader: Sending ${position} logo to endpoint: ${endpoint}`);
    
    const response = await axios.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    console.log('FileUploader: Server response:', response.status, response.data);
    
    if (!response.data || typeof response.data !== 'object') {
      throw new Error('Invalid response format from server');
    }
    
    if (response.data.error) {
      throw new Error(response.data.error);
    }
    
    if (!response.data.success) {
      throw new Error('Upload failed without specific error message');
    }
    
    return base64Data;
  } catch (error: any) {
    console.error(`FileUploader: Error uploading ${position} logo:`, error);
    throw error;
  }
};
