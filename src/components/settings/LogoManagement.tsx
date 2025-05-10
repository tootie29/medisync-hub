
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';
import { Upload, RefreshCw, AlertCircle, Info, FileWarning, Server, HardDrive, Terminal, Bug } from 'lucide-react';
import { CLIENT_FALLBACK_LOGO_PATH } from './SiteSettingsModel';
import { saveFileToPublic, fileToBase64 } from '@/utils/fileUploader';

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
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [primaryClientPath, setPrimaryClientPath] = useState<string | null>(null);
  const [secondaryClientPath, setSecondaryClientPath] = useState<string | null>(null);

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
      const timestamp = Date.now();
      
      const primaryResponse = await axios.get(`/api/logos/primary?t=${timestamp}`);
      console.log('LogoManagement: Primary logo response:', primaryResponse.data);
      
      if (primaryResponse.data && primaryResponse.data.url) {
        console.log('LogoManagement: Primary logo URL:', primaryResponse.data.url);
        setPrimaryLogoUrl(primaryResponse.data.url);
      } else {
        setPrimaryLogoUrl(`${CLIENT_FALLBACK_LOGO_PATH}?t=${timestamp}`);
      }
      
      const secondaryResponse = await axios.get(`/api/logos/secondary?t=${timestamp}`);
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
      setDiagnosticInfo(response.data);
      console.log('Diagnostics info:', response.data);
      toast.success('Diagnostics information loaded');
    } catch (error) {
      console.error('Failed to fetch diagnostics:', error);
      toast.error('Failed to load diagnostics information');
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
      setPrimaryClientPath(null); // Clear any previous client path
      
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
      setSecondaryClientPath(null); // Clear any previous client path
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setServerInfo(null);
    setUploadProgress(0);
    setUploadSuccess(false);
    
    try {
      // First, save the files to the client-side public folder
      const logoData: { primaryLogo?: string; secondaryLogo?: string } = {};
      
      if (primaryLogo) {
        try {
          console.log('Saving primary logo to client...');
          toast.loading('Uploading primary logo...');
          const primaryPath = await saveFileToPublic(primaryLogo);
          setPrimaryClientPath(primaryPath);
          logoData.primaryLogo = primaryPath;
          console.log('LogoManagement: Saved primary logo to client:', primaryPath);
          toast.dismiss();
          toast.success('Primary logo uploaded successfully');
        } catch (error) {
          console.error('Error saving primary logo to client:', error);
          toast.dismiss();
          toast.error('Failed to save primary logo. Using base64 fallback.');
          
          // Fallback to base64 if client-side save fails
          try {
            const base64Data = await fileToBase64(primaryLogo);
            logoData.primaryLogo = base64Data;
            console.log('Using base64 fallback for primary logo');
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            setIsLoading(false);
            setError('Failed to save logo in any format. Please try again.');
            return;
          }
        }
      }
      
      if (secondaryLogo) {
        try {
          console.log('Saving secondary logo to client...');
          toast.loading('Uploading secondary logo...');
          const secondaryPath = await saveFileToPublic(secondaryLogo);
          setSecondaryClientPath(secondaryPath);
          logoData.secondaryLogo = secondaryPath;
          console.log('LogoManagement: Saved secondary logo to client:', secondaryPath);
          toast.dismiss();
          toast.success('Secondary logo uploaded successfully');
        } catch (error) {
          console.error('Error saving secondary logo to client:', error);
          toast.dismiss();
          toast.error('Failed to save secondary logo. Using base64 fallback.');
          
          // Fallback to base64 if client-side save fails
          try {
            const base64Data = await fileToBase64(secondaryLogo);
            logoData.secondaryLogo = base64Data;
            console.log('Using base64 fallback for secondary logo');
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            setIsLoading(false);
            setError('Failed to save logo in any format. Please try again.');
            return;
          }
        }
      }
      
      // Only proceed if at least one file is saved
      if (Object.keys(logoData).length > 0) {
        console.log('LogoManagement: Uploading logo data to database...');
        toast.loading('Updating database...');
        
        // Determine which endpoint to use based on whether we're using base64 or file paths
        const isPrimaryBase64 = logoData.primaryLogo?.startsWith('data:');
        const isSecondaryBase64 = logoData.secondaryLogo?.startsWith('data:');
        
        let endpoint = '/api/logos/client';
        if (isPrimaryBase64 || isSecondaryBase64) {
          console.log('Using base64 endpoint for at least one logo');
          endpoint = '/api/logos/base64';
        }
        
        // Send the paths or base64 data to the server to save in the database
        const response = await axios.post(endpoint, logoData, {
          timeout: 60000, // 60 seconds timeout
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`Upload progress: ${percentCompleted}%`);
              setUploadProgress(percentCompleted);
            }
          }
        });
        
        console.log('LogoManagement: Upload response:', response.data);
        toast.dismiss();
        
        if (response.data.success) {
          setUploadSuccess(true);
          toast.success('Logos updated successfully');
          
          // Reset state
          setPrimaryLogo(null);
          setSecondaryLogo(null);
          
          // Clear file input fields by resetting the form
          const fileInputs = document.querySelectorAll('input[type="file"]');
          fileInputs.forEach((input: any) => {
            input.value = '';
          });
          
          // Force refresh the logos
          setLastRefresh(Date.now());
          
          // Verify database update by checking the server again
          setTimeout(() => {
            fetchLogos();
          }, 1000);
          
          // Trigger a refresh of the authentication layout
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('refreshLogos'));
            console.log('LogoManagement: Dispatched refreshLogos event');
          }, 500);
        } else {
          console.error('Upload failed:', response.data);
          setError('Failed to update logos: ' + (response.data.error || 'Unknown error'));
          toast.error('Failed to update logos in database');
          await fetchDiagnostics();
        }
      } else {
        toast.error('Please select at least one logo to update');
      }
    } catch (error: any) {
      console.error('LogoManagement: Error updating logos:', error);
      toast.dismiss();
      
      let errorMessage = 'Failed to upload logos. Please try again.';
      if (error.response) {
        errorMessage = `Error: ${error.response.data.error || error.response.statusText}`;
        console.error('Server response:', error.response.data);
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Automatically fetch diagnostics if there's an error
      await fetchDiagnostics();
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
              {(!serverDetails.database?.connected) && (
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
              This may be caused by file permission issues on the server. 
              Please check that the server has write permissions to /uploads/assets/logos directory.
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
            <div>Timestamp: {diagnosticInfo.timestamp}</div>
            <div className="mt-1">Base Directory: {diagnosticInfo.baseDir}</div>
            
            <div className="mt-2 font-semibold">Directory Status:</div>
            {Object.entries(diagnosticInfo.directories).map(([name, info]: [string, any]) => (
              <div key={name} className="ml-2">
                <div>{name}: {info.exists ? '✅ Exists' : '❌ Missing'}</div>
                {info.exists && (
                  <>
                    <div className="ml-2">Permissions: {info.permissions}</div>
                    <div className="ml-2">Owner: {info.owner}</div>
                    <div className="ml-2">
                      {info.isWritable 
                        ? '✅ Directory is writable' 
                        : '❌ Directory is NOT writable'}
                    </div>
                  </>
                )}
              </div>
            ))}
            
            <div className="mt-2 font-semibold">Write Test:</div>
            {diagnosticInfo.writeTest ? (
              <div className="ml-2">
                {diagnosticInfo.writeTest.success 
                  ? `✅ Successfully wrote test file to ${diagnosticInfo.writeTest.path}` 
                  : `❌ Failed to write test file: ${diagnosticInfo.writeTest.error}`}
              </div>
            ) : (
              <div className="ml-2">No write test performed</div>
            )}
            
            <div className="mt-2 font-semibold">Process Info:</div>
            {diagnosticInfo.process ? (
              <div className="ml-2">
                <div>PID: {diagnosticInfo.process.pid}</div>
                <div>UID: {diagnosticInfo.process.uid}</div>
                <div>GID: {diagnosticInfo.process.gid}</div>
              </div>
            ) : (
              <div className="ml-2">No process info available</div>
            )}
            
            <div className="mt-3 text-yellow-300">
              If directories show as not writable, contact your server administrator to set proper permissions. 
              Command to fix: <span className="bg-gray-800 px-1">chmod -R 755 {diagnosticInfo.baseDir}/uploads</span>
            </div>
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
