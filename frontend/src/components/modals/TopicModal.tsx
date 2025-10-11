import { useState } from 'react';
import { X } from 'lucide-react';
import { topicService, CreateTopicData } from '@/services/topics';
import { useToast } from '@/components/ui/use-toast';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTopicCreated: () => void;
}

export function TopicModal({ isOpen, onClose, onTopicCreated }: TopicModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await topicService.createTopic({ title, description });
      toast({
        title: 'Success',
        description: 'Topic created successfully!',
      });
      setTitle('');
      setDescription('');
      onTopicCreated();
      onClose();
    } catch (error) {
      // Error is already handled by the interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          disabled={isLoading}
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Create New Topic</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                placeholder="Enter topic title"
                disabled={isLoading}
                autoFocus
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground min-h-[100px]"
                placeholder="Enter topic description"
                disabled={isLoading}
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !title.trim()}
              >
                {isLoading ? 'Creating...' : 'Create Topic'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
