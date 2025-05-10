import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { Upload, RefreshCw, AlertCircle, Info, FileWarning, Server, HardDrive, Terminal, Bug } from 'lucide-react';
import { CLIENT_FALLBACK_LOGO_PATH } from './SiteSettingsModel';
import { fileToBase64, uploadBase64ToDatabase } from '@/utils/fileUploader';

const LogoManagement = () => {
  const [primaryLogo, setPrimaryLogo] = useState<File | null>(null);
  const [secondaryLogo, setSecondaryLogo] = useState<File | null>(null);
  const [primaryLogoUrl, setPrimaryLogoUrl] = useState<string>('');
  const [secondaryLogoUrl, setSecondaryLogoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLogos, setIsLoadingLogos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [serverInfo, setServerInfo] = useState<string | null>(null);
  const [serverDetails, setServerDetails] = useState<any>(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState<Record<string, any>>({});  // Initialize as empty object
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetchLogos();
    // Get server health information for diagnostics
    axios.get('/api/health')
      .then(response => {
        setServerDetails(response.data);
        console.log('Server health info:', response.data);
      })
      .catch(error => {
        console.error('Failed to fetch server health info:', error);
      });
  }, [lastRefresh]);

  const fetchLogos = async () => {
    setIsLoadingLogos(true);
    setError(null);
    try {
      console.log('LogoManagement: Fetching logos...');
      setIsLoadingLogos(true);
      setError(null);
      
      // Add stronger cache busting to force refresh
      const timestamp = Date.now();
      const cacheBuster = `?t=${timestamp}&nocache=${Math.random()}`;
      
      // FIX: Use withCredentials for authentication
      const primaryResponse = await axios.get(`/api/logos/primary${cacheBuster}`, {
        withCredentials: true
      });
      console.log('LogoManagement: Primary logo response:', primaryResponse.data);
      
      if (primaryResponse.data && primaryResponse.data.url) {
        console.log('LogoManagement: Primary logo URL:', primaryResponse.data.url);
        setPrimaryLogoUrl(primaryResponse.data.url);
      } else {
        setPrimaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
      }
      
      // FIX: Use withCredentials for authentication
      const secondaryResponse = await axios.get(`/api/logos/secondary${cacheBuster}`, {
        withCredentials: true
      });
      console.log('LogoManagement: Secondary logo response:', secondaryResponse.data);
      
      if (secondaryResponse.data && secondaryResponse.data.url) {
        console.log('LogoManagement: Secondary logo URL:', secondaryResponse.data.url);
        setSecondaryLogoUrl(secondaryResponse.data.url);
      } else {
        setSecondaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
      }
      
      setUploadSuccess(false);
    } catch (error) {
      console.error('LogoManagement: Error fetching logos:', error);
      setError('Failed to load logos. Please try again.');
      toast.error('Failed to load logos');
      
      const timestamp = Date.now();
      setPrimaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
      setSecondaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
    } finally {
      setIsLoadingLogos(false);
    }
  };

  const fetchDiagnostics = async () => {
    try {
      setShowDiagnostics(true);
      const response = await axios.get('/api/logos/diagnostics');
      setDiagnosticInfo(response.data || {});  // Always ensure we set an object even if response is null
      console.log('Diagnostics info:', response.data);
      toast.success('Diagnostics information loaded');
    } catch (error) {
      console.error('Failed to fetch diagnostics:', error);
      toast.error('Failed to load diagnostics information');
      setDiagnosticInfo({});  // Set empty object on error
    }
  };

  const handlePrimaryLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1 * 1024 * 1024) { // 1MB max
        toast.error('Logo file is too large. Maximum size is 1MB.');
        e.target.value = ''; // Reset input
        return;
      }
      console.log('Selected primary logo file:', file.name, file.type, file.size);
      setPrimaryLogo(file);
      
      // Preview the image immediately
      try {
        const base64Preview = await fileToBase64(file);
        console.log('Generated preview for primary logo');
        setPrimaryLogoUrl(base64Preview);
      } catch (error) {
        console.error('Error generating preview:', error);
      }
    }
  };

  const handleSecondaryLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1 * 1024 * 1024) { // 1MB max
        toast.error('Logo file is too large. Maximum size is 1MB.');
        e.target.value = ''; // Reset input
        return;
      }
      console.log('Selected secondary logo file:', file.name, file.type, file.size);
      setSecondaryLogo(file);
      
      // Preview the image immediately
      try {
        const base64Preview = await fileToBase64(file);
        console.log('Generated preview for secondary logo');
        setSecondaryLogoUrl(base64Preview);
      } catch (error) {
        console.error('Error generating preview:', error);
      }
    }
  };

  // CRITICAL FIX: Enhance the submit handler to process logos individually
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setServerInfo(null);
    setUploadProgress(0);
    setUploadSuccess(false);
    
    try {
      console.log('LogoManagement: Starting logo upload process');
      let uploadedLogos = 0;
      let totalLogos = 0;
      
      // Count how many logos we need to upload
      if (primaryLogo) totalLogos++;
      if (secondaryLogo) totalLogos++;
      
      if (totalLogos === 0) {
        toast.error('Please select at least one logo to upload');
        setIsLoading(false);
        return;
      }
      
      // CRITICAL FIX: Process each logo separately for more reliable uploads
      // Process primary logo if selected
      if (primaryLogo) {
        try {
          console.log('Processing primary logo...', primaryLogo.name, primaryLogo.size, 'bytes');
          toast.loading('Processing primary logo...');
          
          const primaryBase64 = await fileToBase64(primaryLogo);
          console.log('Primary logo converted to base64, length:', primaryBase64.length);
          
          // CRITICAL FIX: Send to server with better error handling
          console.log('Uploading primary logo to database...');
          await uploadBase64ToDatabase(primaryBase64, 'primary');
          console.log('Primary logo uploaded successfully');
          uploadedLogos++;
          toast.dismiss();
          toast.success('Primary logo uploaded successfully');
        } catch (error: any) {
          console.error('Error processing primary logo:', error);
          toast.dismiss();
          toast.error('Failed to upload primary logo: ' + (error.message || 'Unknown error'));
        }
      }
      
      // Process secondary logo if selected
      if (secondaryLogo) {
        try {
          console.log('Processing secondary logo...', secondaryLogo.name, secondaryLogo.size, 'bytes');
          toast.loading('Processing secondary logo...');
          
          const secondaryBase64 = await fileToBase64(secondaryLogo);
          console.log('Secondary logo converted to base64, length:', secondaryBase64.length);
          
          // CRITICAL FIX: Send to server with better error handling
          console.log('Uploading secondary logo to database...');
          await uploadBase64ToDatabase(secondaryBase64, 'secondary');
          console.log('Secondary logo uploaded successfully');
          uploadedLogos++;
          toast.dismiss();
          toast.success('Secondary logo uploaded successfully');
        } catch (error: any) {
          console.error('Error processing secondary logo:', error);
          toast.dismiss();
          toast.error('Failed to upload secondary logo: ' + (error.message || 'Unknown error'));
        }
      }
      
      // Check if any logos were successfully uploaded
      if (uploadedLogos > 0) {
        setUploadSuccess(true);
        toast.success(`${uploadedLogos} logo(s) updated successfully`);
        
        // Reset state
        setPrimaryLogo(null);
        setSecondaryLogo(null);
        
        // Clear file input fields
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach((input: any) => {
          input.value = '';
        });
        
        // CRITICAL FIX: Add longer delay to ensure database update completes
        console.log('Dispatching refreshLogos event with delay for database propagation');
        setTimeout(() => {
          setLastRefresh(Date.now());
          window.dispatchEvent(new CustomEvent('refreshLogos'));
          // Force a hard refresh after a delay
          setTimeout(() => {
            fetchLogos(); 
          }, 1000); // Additional delay for UI update
        }, 5000); // CRITICAL FIX: Increased delay for database update from 3000 to 5000
      } else {
        setError('Failed to update any logos');
        toast.error('Failed to update logos');
      }
    } catch (error: any) {
      console.error('Error updating logos:', error);
      toast.dismiss();
      
      let errorMessage = 'Failed to upload logos. Please try again.';
      if (error.response) {
        errorMessage = `Error: ${error.response.data?.error || error.response.statusText}`;
        console.error('Server response:', error.response.data);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleManualRefresh = () => {
    setLastRefresh(Date.now());
    fetchLogos();
    toast.info('Refreshing logos...');
    
    // Also refresh in the auth layout
    window.dispatchEvent(new CustomEvent('refreshLogos'));
  };

  const formatServerEnvironment = (details: any) => {
    if (!details || !details.server) return "Unknown";
    
    const environment = details.server.environment || "unknown";
    const dbStatus = details.database && details.database.connected ? "connected" : "not connected";
    
    return `${environment} mode with database ${dbStatus}`;
  };

  // Safe rendering helper for diagnostics
  const renderDiagnosticSection = (title: string, data: any) => {
    if (!data) return null;
    
    return (
      <div className="mt-2 font-semibold">
        {title}:
        {Object.entries(data || {}).map(([key, value]: [string, any]) => (
          <div key={key} className="ml-2">
            <div>{key}: {String(value)}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {uploadSuccess && (
        <div className="bg-green-100 p-4 rounded-md mb-4 flex items-start gap-3">
          <div className="h-5 w-5 text-green-600 mt-0.5">✓</div>
          <div>
            <p className="text-green-600 font-medium">Logo upload successful!</p>
            <p className="text-green-600/80 text-sm mt-1">
              The logos have been successfully uploaded and saved to the database.
            </p>
          </div>
        </div>
      )}
      
      {serverDetails && (
        <div className="bg-blue-100 p-4 rounded-md mb-4 flex items-start gap-3">
          <Server className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-blue-600 font-medium">Server Environment</p>
            <p className="text-blue-600/80 text-sm mt-1">
              Running in {formatServerEnvironment(serverDetails)}
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setServerDetails(null)}
                className="text-xs"
              >
                Hide Details
              </Button>
              {(serverDetails.database && !serverDetails.database.connected) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Connection
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-destructive/15 p-4 rounded-md mb-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-destructive/80 text-sm mt-1">
              There was an error processing your request. Please try again.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDiagnostics}
              >
                <Bug className="h-4 w-4 mr-2" />
                Run Diagnostics
              </Button>
              
              {!serverDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    axios.get('/api/health')
                      .then(response => {
                        setServerDetails(response.data);
                        console.log('Server health info:', response.data);
                      })
                      .catch(error => {
                        console.error('Failed to fetch server health info:', error);
                        toast.error('Failed to get server information');
                      });
                  }}
                >
                  <HardDrive className="h-4 w-4 mr-2" />
                  Check Server Status
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {serverInfo && (
        <div className="bg-blue-100 p-4 rounded-md mb-4 flex items-start gap-3">
          <FileWarning className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-blue-600 font-medium">Server Information</p>
            <p className="text-blue-600/80 text-sm mt-1">{serverInfo}</p>
          </div>
        </div>
      )}
      
      {showDiagnostics && diagnosticInfo && (
        <div className="bg-gray-100 p-4 rounded-md mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <Terminal className="h-5 w-5 text-gray-600 mr-2" />
              <p className="font-medium">Server Diagnostics</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowDiagnostics(false)}
            >
              Hide
            </Button>
          </div>
          
          <div className="text-xs font-mono bg-black text-green-400 p-3 rounded overflow-auto max-h-60">
            <div>Timestamp: {diagnosticInfo.timestamp || 'N/A'}</div>
            <div className="mt-1">Base Directory: {diagnosticInfo.baseDir || 'N/A'}</div>
            
            {diagnosticInfo.directories && (
              <div className="mt-2 font-semibold">Directory Status:
                {Object.entries(diagnosticInfo.directories || {}).map(([name, info]: [string, any]) => (
                  <div key={name} className="ml-2">
                    <div>{name}: {info && info.exists ? '✅ Exists' : '❌ Missing'}</div>
                    {info && info.exists && (
                      <>
                        <div className="ml-2">Permissions: {info.permissions || 'N/A'}</div>
                        <div className="ml-2">Owner: {info.owner || 'N/A'}</div>
                        <div className="ml-2">
                          {info.isWritable 
                            ? '✅ Directory is writable' 
                            : '❌ Directory is NOT writable'}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {diagnosticInfo.writeTest && (
              <div className="mt-2 font-semibold">Write Test:
                <div className="ml-2">
                  {diagnosticInfo.writeTest.success 
                    ? `✅ Successfully wrote test file to ${diagnosticInfo.writeTest.path}` 
                    : `❌ Failed to write test file: ${diagnosticInfo.writeTest.error || 'Unknown error'}`}
                </div>
              </div>
            )}
            
            {diagnosticInfo.process && (
              <div className="mt-2 font-semibold">Process Info:
                <div className="ml-2">
                  <div>PID: {diagnosticInfo.process.pid || 'N/A'}</div>
                  <div>UID: {diagnosticInfo.process.uid || 'N/A'}</div>
                  <div>GID: {diagnosticInfo.process.gid || 'N/A'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="font-medium">Primary Logo</div>
          {isLoadingLogos ? (
            <div className="h-40 bg-gray-100 rounded-md flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            primaryLogoUrl ? (
              <div className="h-40 flex items-center justify-center border rounded-md p-4">
                <img 
                  src={primaryLogoUrl} 
                  alt="Primary Logo" 
                  className="max-h-full object-contain"
                  onError={(e) => {
                    console.error('Failed to load primary logo:', primaryLogoUrl);
                    e.currentTarget.src = CLIENT_FALLBACK_LOGO_PATH;
                  }}
                />
              </div>
            ) : (
              <div className="h-40 bg-gray-100 rounded-md flex items-center justify-center">
                <p className="text-gray-500">No logo uploaded</p>
              </div>
            )
          )}
          <div className="pt-2">
            <Label htmlFor="primaryLogo" className="block mb-2">Upload new primary logo</Label>
            <Input 
              id="primaryLogo" 
              type="file" 
              accept="image/*"
              onChange={handlePrimaryLogoChange}
              className="cursor-pointer"
            />
            {primaryLogo && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {primaryLogo.name} ({Math.round(primaryLogo.size / 1024)} KB)
              </p>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="font-medium">Secondary Logo</div>
          {isLoadingLogos ? (
            <div className="h-40 bg-gray-100 rounded-md flex items-center justify-center">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
            </div>
          ) : (
            secondaryLogoUrl ? (
              <div className="h-40 flex items-center justify-center border rounded-md p-4">
                <img 
                  src={secondaryLogoUrl} 
                  alt="Secondary Logo" 
                  className="max-h-full object-contain"
                  onError={(e) => {
                    console.error('Failed to load secondary logo:', secondaryLogoUrl);
                    e.currentTarget.src = CLIENT_FALLBACK_LOGO_PATH;
                  }}
                />
              </div>
            ) : (
              <div className="h-40 bg-gray-100 rounded-md flex items-center justify-center">
                <p className="text-gray-500">No logo uploaded</p>
              </div>
            )
          )}
          <div className="pt-2">
            <Label htmlFor="secondaryLogo" className="block mb-2">Upload new secondary logo</Label>
            <Input 
              id="secondaryLogo" 
              type="file" 
              accept="image/*"
              onChange={handleSecondaryLogoChange}
              className="cursor-pointer"
            />
            {secondaryLogo && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {secondaryLogo.name} ({Math.round(secondaryLogo.size / 1024)} KB)
              </p>
            )}
          </div>
        </div>
      </div>
      
      {isLoading && uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
          <div 
            className="bg-medical-primary h-2.5 rounded-full" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
          <p className="text-xs text-gray-500 mt-1">Upload progress: {uploadProgress}%</p>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button
          onClick={handleSubmit}
          disabled={isLoading || (!primaryLogo && !secondaryLogo)}
          className="bg-medical-primary hover:bg-medical-secondary text-white w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Update Logos
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleManualRefresh}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingLogos ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        
        <Button
          variant="outline"
          onClick={fetchDiagnostics}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <Bug className="mr-2 h-4 w-4" />
          Diagnostics
        </Button>
        
        <div className="flex items-center mt-2 sm:mt-0 text-xs text-gray-500">
          <Info className="h-3 w-3 mr-1" />
          Recommended size: 500KB or less
        </div>
      </div>
    </div>
  );
};

export default LogoManagement;
