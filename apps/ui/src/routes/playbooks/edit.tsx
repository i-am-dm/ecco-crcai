import { useParams } from 'react-router-dom';
import { PlaybookForm } from '@/components/playbooks/PlaybookForm';
import { usePlaybook } from '@/hooks/usePlaybooks';

export function EditPlaybookPage() {
  const { id = '' } = useParams();
  const { data } = usePlaybook(id);
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Edit Playbook</h1>
      <PlaybookForm id={id} initial={data} onSaved={() => { /* stay on page */ }} />
    </div>
  );
}

