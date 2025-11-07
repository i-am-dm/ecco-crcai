import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

interface PlaybookFormProps {
  initial?: any;
  id?: string;
  onSaved?: (id: string) => void;
}

export function PlaybookForm({ initial, id, onSaved }: PlaybookFormProps) {
  const [values, setValues] = useState<any>(() => initial || { stage: 'Idea', function: 'GTM', status: 'Draft', version: '1.0.0' });
  useEffect(() => { if (initial) setValues(initial); }, [initial]);

  const set = (k: string, v: any) => setValues((s: any) => ({ ...s, [k]: v }));

  const roles = useAuthStore((s) => s.roles || []);
  const canPublish = roles.includes('Admin') || roles.includes('Leadership');

  const save = async (publish: boolean) => {
    const now = new Date().toISOString();
    const payload = {
      id: id || values.id || `PB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      entity: 'playbook',
      env: 'dev',
      schema_version: '1.0.0',
      updated_at: now,
      created_at: values.created_at || now,
      ...values,
      status: publish ? 'Published' : (values.status || 'Draft'),
      // normalize tags from comma-separated input
      tags: Array.isArray(values.tags) ? values.tags : String(values.tags || '').split(',').map((s) => s.trim()).filter(Boolean),
    };
    await api.POST('/v1/internal/history', { body: payload });
    onSaved?.(payload.id);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium mb-1">Name</div>
            <Input value={values.name || values.title || ''} onChange={(e) => set('name', e.target.value)} placeholder="e.g., GTM Launch – MVP" />
          </div>
          <div>
            <div className="text-xs font-medium mb-1">Owner</div>
            <Input value={values.owner || ''} onChange={(e) => set('owner', e.target.value)} placeholder="owner@example.com" />
          </div>
          <div>
            <div className="text-xs font-medium mb-1">Stage</div>
            <Select value={values.stage || 'Idea'} onValueChange={(v) => set('stage', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Idea','Validation','Build','Pilot','Scale'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs font-medium mb-1">Function</div>
            <Select value={values.function || 'GTM'} onValueChange={(v) => set('function', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['GTM','Design','Legal','Data','Ops','Finance','Product','Engineering'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs font-medium mb-1">Version</div>
            <Input value={values.version || ''} onChange={(e) => set('version', e.target.value)} placeholder="1.0.0" />
          </div>
          <div>
            <div className="text-xs font-medium mb-1">Tags (comma-separated)</div>
            <Input value={Array.isArray(values.tags) ? values.tags.join(', ') : (values.tags || '')} onChange={(e) => set('tags', e.target.value)} placeholder="pricing, website, email" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => save(false)}>Save Draft</Button>
          <Button variant="secondary" onClick={() => save(true)} disabled={!canPublish} title={!canPublish ? 'Publish requires Admin or Leadership' : undefined}>Publish</Button>
        </div>
      </CardContent>
    </Card>
  );
}
