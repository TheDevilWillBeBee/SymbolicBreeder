import { LineageProgram } from '../../types';
import { LayeredDAG } from '../../utils/buildLayeredDAG';
import { LineageCard } from './LineageCard';
import { TransitionCard } from './TransitionCard';

interface Props {
  dag: LayeredDAG;
  isShader: boolean;
  isVisual: boolean;
  showDetails: boolean;
  onShowCode: (p: LineageProgram) => void;
  onPlayStrudel?: (code: string) => void;
  playingCode?: string | null;
  onStopStrudel?: () => void;
  playingVisualId?: string | null;
  onPlayVisual?: (id: string) => void;
  onStopVisual?: () => void;
}

/** Renders the full layered DAG with generation rows, fan lines, and transition metadata. */
export function LayeredTreeView({
  dag,
  isShader,
  isVisual,
  showDetails,
  onShowCode,
  onPlayStrudel,
  playingCode,
  onStopStrudel,
  playingVisualId,
  onPlayVisual,
  onStopVisual,
}: Props) {
  return (
    <div className="layered-tree">
      {dag.layers.map((layer, i) => (
        <div key={layer.generation} className="layered-tree-section">
          {/* Generation row of cards */}
          <div className="generation-row">
            {layer.programs.map((p) => (
              <LineageCard
                key={p.id}
                program={p}
                isShader={isShader}
                isVisual={isVisual}
                onShowCode={onShowCode}
                onPlayStrudel={onPlayStrudel}
                isPlayingStrudel={playingCode === p.code}
                onStopStrudel={onStopStrudel}
                isPlayingVisual={playingVisualId === p.id}
                onPlayVisual={onPlayVisual}
                onStopVisual={onStopVisual}
              />
            ))}
          </div>

          {/* Edge lines + transition metadata between this layer and the next */}
          {dag.transitions[i] && (
            <div className="generation-edge">
              <div className="edge-fan">
                {layer.programs.length > 1 && (
                  <div className="edge-stubs">
                    {layer.programs.map((p) => (
                      <div key={p.id} className="edge-stub">
                        <div className="edge-stub-line" />
                      </div>
                    ))}
                  </div>
                )}
                {layer.programs.length > 1 && <div className="edge-bar" />}
                <div className="edge-trunk" />
              </div>

              {showDetails && <TransitionCard transition={dag.transitions[i]!} />}

              {dag.layers[i + 1] && (
                <div className="edge-fan">
                  <div className="edge-trunk" />
                  {dag.layers[i + 1].programs.length > 1 && (
                    <>
                      <div className="edge-bar" />
                      <div className="edge-stubs">
                        {dag.layers[i + 1].programs.map((p) => (
                          <div key={p.id} className="edge-stub">
                            <div className="edge-stub-line" />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
