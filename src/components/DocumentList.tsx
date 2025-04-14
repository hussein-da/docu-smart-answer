
import React, { useEffect, useState } from 'react';
import { FileText, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Document {
  id: string;
  title: string;
  created_at: string;
  file_size: number;
  page_count: number | null;
  file_type: string;
}

const DocumentList = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Fehler beim Laden der Dokumente",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleOpenChat = (documentId: string) => {
    navigate('/chat', { state: { selectedDocumentId: documentId } });
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', deletingId);
        
      if (deleteError) throw deleteError;
      
      // Remove from state
      setDocuments(documents.filter(doc => doc.id !== deletingId));
      
      toast({
        title: "Dokument gelöscht",
        description: "Das Dokument wurde erfolgreich gelöscht.",
      });
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Fehler beim Löschen",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
      setShowDeleteDialog(false);
    }
  };

  const cancelDelete = () => {
    setDeletingId(null);
    setShowDeleteDialog(false);
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Meine Dokumente</h2>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-docuchat-primary" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Keine Dokumente</h3>
          <p className="text-muted-foreground mb-4">
            Du hast noch keine Dokumente hochgeladen.
          </p>
          <Button onClick={() => navigate('/documents')}>
            Dokument hochladen
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <ul className="divide-y">
            {documents.map((doc) => (
              <li key={doc.id} className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-docuchat-primary mr-4" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{doc.title}</h3>
                    <div className="flex flex-wrap text-sm text-muted-foreground">
                      <span className="mr-4">Hochgeladen am {formatDate(doc.created_at)}</span>
                      <span className="mr-4">{formatSize(doc.file_size)}</span>
                      {doc.page_count && <span>{doc.page_count} Seiten</span>}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button variant="outline" size="sm" className="flex items-center" onClick={() => handleOpenChat(doc.id)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteClick(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dokument löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du dieses Dokument löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentList;
