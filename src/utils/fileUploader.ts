
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
      
      // Create payload with just the base64 data for this specific logo
      const payload: Record<string, string> = {};
      payload[`${position}Logo`] = base64Data;
      
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
      console.log('FileUploader: Server response:', response.status, response.statusText);
      console.log('FileUploader: Response data:', response.data);
      
      if (!response || response.status !== 200) {
        throw new Error(`Server returned status code ${response?.status || 'unknown'}`);
      }
      
      if (!response.data) {
        throw new Error('Empty response from server');
      }
      
      // Check for success field in the response
      if (response.data.success === false) {
        throw new Error(response.data.error || 'Operation failed');
      }
      
      // Check for uploads array in successful responses
      if (!response.data.uploads && !response.data.message) {
        throw new Error('Invalid response format from server');
      }
      
      console.log(`FileUploader: ${position} logo saved to database successfully`);
      return base64Data;
    } catch (error: any) {
      lastError = error;
      console.error(`FileUploader: Error saving ${position} logo to database (attempt ${2-retries}/2):`, error);
      
      // Log response details for debugging
      if (error.response) {
        console.error('FileUploader: Error status:', error.response.status);
        console.error('FileUploader: Error details:', error.response.data);
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
