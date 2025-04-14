
import React from 'react';
import { FileText, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data for documents - in a real app, this would come from Supabase
const mockDocuments = [
  {
    id: '1',
    title: 'Jahresbericht 2023.pdf',
    uploadedAt: '2023-12-15T10:30:00',
    size: 1240000, // in bytes
    pageCount: 24,
  },
  {
    id: '2',
    title: 'Vertrag ABC GmbH.pdf',
    uploadedAt: '2023-12-10T14:45:00',
    size: 560000,
    pageCount: 8,
  },
  {
    id: '3',
    title: 'Studienmaterial.txt',
    uploadedAt: '2023-12-05T09:15:00',
    size: 150000,
    pageCount: null, // text files don't have pages
  },
];

const DocumentList = () => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Meine Dokumente</h2>
      
      {mockDocuments.length === 0 ? (
        <div className="text-center py-10">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Keine Dokumente</h3>
          <p className="text-muted-foreground">
            Du hast noch keine Dokumente hochgeladen.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <ul className="divide-y">
            {mockDocuments.map((doc) => (
              <li key={doc.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-docuchat-primary mr-4" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{doc.title}</h3>
                    <div className="flex text-sm text-muted-foreground">
                      <span className="mr-4">Hochgeladen am {formatDate(doc.uploadedAt)}</span>
                      <span className="mr-4">{formatSize(doc.size)}</span>
                      {doc.pageCount && <span>{doc.pageCount} Seiten</span>}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button variant="outline" size="sm" className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
