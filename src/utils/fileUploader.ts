
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

// Upload base64 image directly to database with enhanced error handling and retry mechanism
export const uploadBase64ToDatabase = async (
  base64Data: string, 
  position: 'primary' | 'secondary'
): Promise<string> => {
  let retries = 2; // Allow for retries
  let lastError = null;
  
  while (retries >= 0) {
    try {
      console.log(`FileUploader: Saving ${position} logo directly to database as base64 (attempts left: ${retries})`);
      console.log(`FileUploader: Base64 data length: ${base64Data.length}`);
      
      // Create payload with just the base64 data for this specific logo position
      const payload = {
        [position + 'Logo']: base64Data
      };
      
      // Add timestamp to prevent caching issues
      const timestamp = Date.now();
      const endpoint = `/api/logos/base64?t=${timestamp}`;
      console.log(`FileUploader: Sending ${position} logo to endpoint: ${endpoint}`);
      
      // Ensure we're using proper Content-Type and withCredentials
      const response = await axios.post(endpoint, payload, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
        // Track upload progress
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`FileUploader: Upload progress: ${percentCompleted}%`);
          }
        },
        // Set longer timeout to handle large base64 strings
        timeout: 30000
      });
      
      // Enhanced response validation with better error reporting
      console.log('FileUploader: Server response status:', response.status);
      
      if (!response || response.status !== 200) {
        console.error(`FileUploader: Bad status code: ${response?.status || 'unknown'}`);
        throw new Error(`Server returned status code ${response?.status || 'unknown'}`);
      }
      
      // Log the full response for debugging
      console.log('FileUploader: Full response:', response);
      
      // More tolerant response handling - check if we got ANY response data
      if (!response.data) {
        console.error('FileUploader: Empty response data from server');
        throw new Error('Empty response from server');
      }
      
      // Be more flexible with success response formats
      // Check multiple possible success indicators
      const isSuccessful = 
        response.data.success === true || 
        (response.data.uploads && Array.isArray(response.data.uploads)) ||
        response.data.message?.includes('success') ||
        response.data.id || 
        (typeof response.data === 'object' && Object.keys(response.data).length > 0);
      
      if (!isSuccessful) {
        console.error('FileUploader: Response indicates failure:', response.data);
        throw new Error(response.data.error || 'Operation failed');
      }
      
      console.log(`FileUploader: ${position} logo saved to database successfully`);
      return base64Data;
    } catch (error: any) {
      lastError = error;
      console.error(`FileUploader: Error saving ${position} logo to database (attempt ${2-retries}/2):`, error);
      
      // Log response details for debugging
      if (error.response) {
        console.error('FileUploader: Error response data:', error.response.data);
        console.error('FileUploader: Error status:', error.response.status);
        
        // If we received HTML instead of JSON, that's a server error
        if (typeof error.response.data === 'string' && 
            error.response.data.trim().startsWith('<!DOCTYPE html>')) {
          console.error('FileUploader: Received HTML instead of JSON, likely server error');
        }
      }
      
      retries--;
      
      if (retries >= 0) {
        console.log(`FileUploader: Retrying upload after delay... (${retries} attempts left)`);
        // Add increasing delay between retries
        await new Promise(resolve => setTimeout(resolve, (2-retries) * 2000));
      }
    }
  }
  
  // If we get here, all retries failed
  console.error('FileUploader: All upload attempts failed');
  throw lastError || new Error('Failed to upload logo after multiple attempts');
};
