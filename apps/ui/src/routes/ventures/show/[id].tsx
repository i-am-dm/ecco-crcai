import { useParams, Link } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useShowPage } from '@/hooks/useShowPages';

export function VentureShowPagePublic() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useShowPage(id!);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-500">
        <p>Showcase not found.</p>
        <Link to="/" className="mt-4 inline-flex items-center text-brand-600">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back home
        </Link>
      </div>
    );
  }

  const { title, tagline, metrics = [], highlights = [], team = [], hero_image: heroImage, cta } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <header className="text-center space-y-4">
          {heroImage && (
            <img src={heroImage} alt={title} className="mx-auto max-h-60 rounded-2xl object-cover" />
          )}
          <h1 className="text-4xl font-bold text-slate-900">{title}</h1>
          {tagline && <p className="text-lg text-slate-600">{tagline}</p>}
          {cta?.url && (
            <a
              href={cta.url}
              className="inline-flex items-center px-4 py-2 rounded-full bg-brand-600 text-white font-medium"
            >
              {cta.label || 'Get in touch'}
            </a>
          )}
        </header>

        {metrics.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metrics.map((metric, idx) => (
              <div key={idx} className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500 uppercase">{metric.label}</p>
                <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
                {metric.trend && <p className="text-xs text-slate-500">{metric.trend}</p>}
              </div>
            ))}
          </section>
        )}

        {highlights.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">Highlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {highlights.map((highlight, idx) => (
                <div key={idx} className="rounded-2xl bg-white p-4 border border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-900">{highlight.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{highlight.description}</p>
                  {highlight.date && (
                    <p className="text-xs text-slate-400 mt-2">{format(new Date(highlight.date), 'MMM d, yyyy')}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {team.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">Team</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {team.map((member, idx) => (
                <div key={idx} className="rounded-2xl bg-white p-5 flex gap-4 border border-slate-100">
                  {member.avatar && (
                    <img src={member.avatar} alt={member.name} className="w-16 h-16 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{member.name}</p>
                    <p className="text-sm text-slate-500">{member.role}</p>
                    {member.bio && <p className="text-sm text-slate-600 mt-2">{member.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
