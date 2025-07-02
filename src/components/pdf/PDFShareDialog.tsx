
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Share, Mail, MessageSquare, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PDFShareDialogProps {
  onGeneratePDF: () => Promise<Blob>;
  patientName: string;
}

const PDFShareDialog: React.FC<PDFShareDialogProps> = ({ onGeneratePDF, patientName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState(`Please find attached the Orange Card for ${patientName}.`);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const pdfBlob = await onGeneratePDF();
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orange-card-${patientName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF downloaded successfully!",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const pdfBlob = await onGeneratePDF();
      
      // Convert blob to base64 for email
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        
        // Create mailto link with attachment info
        const subject = encodeURIComponent(`Orange Card - ${patientName}`);
        const body = encodeURIComponent(`${message}\n\nNote: PDF attachment may not be supported by all email clients. Please download the PDF separately if needed.`);
        const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
        
        window.open(mailtoLink, '_blank');
        
        toast({
          title: "Email Client Opened",
          description: "Your email client has been opened. Please attach the downloaded PDF manually if needed.",
        });
      };
      reader.readAsDataURL(pdfBlob);
    } catch (error) {
      console.error('Error preparing email:', error);
      toast({
        title: "Error",
        description: "Failed to prepare email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSMS = async () => {
    if (!mobile) {
      toast({
        title: "Error",
        description: "Please enter a mobile number.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create SMS link (PDF cannot be attached via SMS, so we'll send a message)
      const smsMessage = encodeURIComponent(`${message}\n\nNote: Orange Card PDF will be sent separately via email or download link.`);
      const smsLink = `sms:${mobile}?body=${smsMessage}`;
      
      window.open(smsLink, '_blank');
      
      toast({
        title: "SMS Client Opened",
        description: "Your SMS client has been opened. Note: PDF cannot be sent via SMS directly.",
      });
    } catch (error) {
      console.error('Error preparing SMS:', error);
      toast({
        title: "Error",
        description: "Failed to prepare SMS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Share className="h-4 w-4" />
          Share Orange Card
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share Orange Card
          </DialogTitle>
          <DialogDescription>
            Generate and share the Orange Card PDF for {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleDownload} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Generating...' : 'Download PDF'}
              </Button>
            </CardContent>
          </Card>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </TabsTrigger>
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                SMS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-message">Message</Label>
                <Textarea
                  id="email-message"
                  placeholder="Enter your message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <Button 
                onClick={handleSendEmail} 
                disabled={isLoading || !email}
                className="w-full"
              >
                {isLoading ? 'Preparing...' : 'Open Email Client'}
              </Button>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="Enter mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms-message">Message</Label>
                <Textarea
                  id="sms-message"
                  placeholder="Enter your message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md">
                <strong>Note:</strong> PDF files cannot be sent via SMS. The SMS will contain your message, and you'll need to send the PDF separately.
              </div>
              <Button 
                onClick={handleSendSMS} 
                disabled={isLoading || !mobile}
                className="w-full"
              >
                {isLoading ? 'Preparing...' : 'Open SMS Client'}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFShareDialog;
