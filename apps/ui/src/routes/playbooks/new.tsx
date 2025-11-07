import { PlaybookForm } from '@/components/playbooks/PlaybookForm';
import { useNavigate } from 'react-router-dom';

export function NewPlaybookPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">New Playbook</h1>
      <PlaybookForm onSaved={(id) => navigate(`/playbooks/${encodeURIComponent(id)}`)} />
    </div>
  );
}

