import { useNavStore } from '../store/navStore';

export function AboutPage() {
  const goToLanding = useNavStore((s) => s.goToLanding);
  const goToGallery = useNavStore((s) => s.goToGallery);

  return (
    <div className="about-page">
      <article className="about-content">
        <h2>About Symbolic Breeder</h2>

        <p>
          Symbolic Breeder is an open-ended evolutionary tool for discovering music, visual
          patterns, 3D models, and vector graphics. You guide the evolution of programs through
          selection — pick what you find interesting, and a large language model produces the
          next generation of variations.
        </p>

        <h3>The Idea</h3>
        <p>
          This project is heavily inspired by{' '}
          <a href="https://picbreeder.org" target="_blank" rel="noopener noreferrer">PicBreeder</a>,
          the landmark experiment in collaborative open-ended evolution by Kenneth Stanley and
          colleagues. PicBreeder evolves{' '}
          <em>Compositional Pattern-Producing Networks</em> (CPPNs) — a family of neural networks
          that generate visual patterns — through user-driven selection.
        </p>
        <p>
          Our insight: instead of evolving neural networks with a hand-crafted mutation algorithm,
          we evolve <strong>programs</strong> using large language models as the variation engine.
          This opens the door to expressive programming paradigms that produce live output:
        </p>
        <ul>
          <li>
            <strong>Strudel ♪</strong> — a live-coding language for creating music, where a few lines
            of code can produce rich rhythmic and melodic patterns
          </li>
          <li>
            <strong>WebGL Shader ◆</strong> — fragment programs that generate dynamic visual
            patterns, from fractals and noise fields to complex animated scenes
          </li>
          <li>
            <strong>OpenSCAD ⬡</strong> — parametric 3D modelling language for sculptures,
            mechanisms, and mathematical forms rendered directly in the browser
          </li>
          <li>
            <strong>SVG ◇</strong> — scalable vector graphics with SMIL and CSS animation,
            from simple icons to intricate generative designs
          </li>
        </ul>

        <h3>How It Works</h3>
        <ol>
          <li>Choose a modality (Strudel, Shader, OpenSCAD, or SVG) and optionally describe a theme</li>
          <li>The LLM generates an initial population of programs</li>
          <li>Browse the live-rendered results — listen to music, watch shaders animate</li>
          <li>Select the programs you find most interesting</li>
          <li>Optionally add guidance ("more percussion", "warmer colors")</li>
          <li>Press <strong>Evolve</strong> — the LLM creates variations through mutation, crossover,
            and reinterpretation of your selections</li>
          <li>Repeat until something remarkable emerges</li>
        </ol>
        <p>
          The LLM applies a mix of strategies: small tweaks (adjusting parameters), substitutions
          (swapping elements), augmentations (adding new layers), crossovers (combining ideas from
          multiple parents), and bold reinterpretations that preserve the mood while exploring new
          territory.
        </p>

        <h3>Why Open-Ended Evolution?</h3>
        <p>
          As Kenneth Stanley argues, open-ended processes — those driven by novelty and curiosity
          rather than a fixed objective — are essential for genuine discovery. Objective-based search
          often converges on local optima, but open-ended exploration can find solutions and
          artifacts that no one would have thought to search for.
        </p>
        <p>
          Symbolic Breeder puts this principle into practice: there is no "goal" shader or "target"
          melody. You explore freely, and the most interesting discoveries are the ones nobody
          planned for.
        </p>

        <h3>LLM Providers</h3>
        <p>
          Symbolic Breeder supports multiple LLM providers — Anthropic Claude, OpenAI GPT, Google
          Gemini, and Qwen. You can select your preferred model in the UI and supply your own API
          key, or use a server-configured key if one is available on the deployment you are using.
        </p>

        <h3>The Gallery</h3>
        <p>
          When you discover something worth sharing, you can publish it to the{' '}
          <button className="about-inline-link" onClick={goToGallery}>Gallery</button>.
          Others can browse these shared creations and start new breeding sessions from any program
          that catches their eye. Over time, the gallery becomes a collective record of what
          open-ended evolution can produce.
        </p>

        <h3>People</h3>
        <p>
          Created by{' '}
          <a href="https://pajouheshgar.github.io" target="_blank" rel="noopener noreferrer">
            Ehsan Pajouheshgar
          </a>{' '}
          and Ali Golmakani.
        </p>
        <p>
          Built with the help of coding agents, primarily{' '}
          <a href="https://claude.ai" target="_blank" rel="noopener noreferrer">Claude Code</a>{' '}
          and <a href="https://openai.com/index/introducing-codex/" target="_blank" rel="noopener noreferrer">ChatGPT Codex</a>.
        </p>
        <p className="about-footnote">
          <em>
            After initial prototyping we discovered that Kamer Ali Yuksel and Hassan Sawaf
            independently explored similar ideas for evolving shaders through LLM-driven evolution
            in their paper{' '}
            <a href="https://arxiv.org/abs/2512.08951v1" target="_blank" rel="noopener noreferrer">
              &ldquo;Evolving Shaders with LLMs&rdquo; (arXiv:2512.08951)
            </a>.
          </em>
        </p>

        <h3>Open Source</h3>
        <p>
          Symbolic Breeder is open source and welcomes contributions. The codebase, documentation,
          and a list of planned features are available on{' '}
          <a href="https://github.com/TheDevilWillBeBee/SymbolicBreeder" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>.
        </p>

        <div className="about-cta">
          <button className="about-cta-btn" onClick={goToLanding}>
            Start Breeding
          </button>
          <button className="about-cta-btn about-cta-secondary" onClick={goToGallery}>
            Browse Gallery
          </button>
        </div>
      </article>
    </div>
  );
}
