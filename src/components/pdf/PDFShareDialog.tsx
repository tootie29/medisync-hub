import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';

interface PDFShareDialogProps {
  onGeneratePDF: () => Promise<Blob>;
  patientName: string;
}

const PDFShareDialog: React.FC<PDFShareDialogProps> = ({ onGeneratePDF, patientName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
      setIsOpen(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Orange Card
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Orange Card
          </DialogTitle>
          <DialogDescription>
            Generate and download the Orange Card PDF for {patientName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Button 
            onClick={handleDownload} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFShareDialog;