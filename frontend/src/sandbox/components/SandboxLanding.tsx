import { modalityRegistry } from '../../modalityRegistry';
import type { ModalityKey } from '../api/sandboxClient';
import { useSandboxNav } from '../sandboxStore';

export function SandboxLanding() {
  const goToTab = useSandboxNav((s) => s.goToTab);
  const plugins = Object.values(modalityRegistry);

  return (
    <div className="sbx-landing">
      <header className="sbx-landing-header">
        <h1 className="sbx-landing-title">Symbolic Breeder Sandbox</h1>
        <p className="sbx-landing-subtitle">
          Author and benchmark contexts, run quick comparisons, and grow massive
          sample caches per modality.
        </p>
      </header>

      <section className="sbx-landing-section">
        <h2>Pick a modality to enter the workbench</h2>
        <div className="modality-selector">
          <div className="modality-tiles">
            {plugins.map((plugin) => (
              <button
                key={plugin.key}
                className="modality-tile"
                onClick={() => goToTab(plugin.key as ModalityKey, 'contexts')}
              >
                <div className="modality-tile-icon">{plugin.icon}</div>
                <div className="modality-tile-label">{plugin.label}</div>
                <div className="modality-tile-desc">{plugin.description}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="sbx-landing-section sbx-landing-features">
        <FeatureCard
          title="View & modify contexts"
          desc="Browse every version under context_lib/, duplicate, edit, or delete with confidence — soft-delete keeps copies recoverable."
        />
        <FeatureCard
          title="Quick test"
          desc="Multi-select contexts, toggle guidance and parents, and see comparable samples side-by-side in seconds."
        />
        <FeatureCard
          title="Massive data caches"
          desc="Launch background jobs that grow a queryable cache of fully-annotated samples. Track progress, cancel, and retry."
        />
        <FeatureCard
          title="Massive comparison"
          desc="Filter by model, version, date, prompt, parent — and compare two filtered slices visually."
        />
      </section>
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="sbx-feature-card">
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}
