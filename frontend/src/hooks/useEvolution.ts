import { useCallback } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { useLogStore } from '../store/logStore';
import { api, setApiLLMConfig, streamPost } from '../api/client';
import { Program } from '../types';

// ── Mock pools (per modality) ──

const MOCK_STRUDEL_SEEDS = [
  'setcpm(120/4)\nvar scale = "D:minor"\n$: s("bd*4, [~ sd]*2, hh*8").bank("RolandTR909")._scope()\n$: note("<d2 a2 bb2 g2>").s("sawtooth").lpf(600).gain(0.6).scale(scale)._pianoroll()',
  'setcpm(130/4)\nvar scale = "C:minor"\n$: s("bd [~ bd] sd [~ sd:2], hh*8").bank("RolandTR808")._scope()\n$: note("<c2 eb2 f2 g2>*2").s("sawtooth").lpf(500).gain(0.5)._pianoroll()\n$: n("0 2 4 <[6,8] [7,9]>").scale("C4:minor").s("gm_epiano1").room(0.5)._pianoroll()',
  'setcpm(90/4)\nvar scale = "A:minor"\n$: s("bd sd:1 [bd bd] sd:2, hh*8").gain(0.8)._scope()\n$: note("<a1 e2 f2 g2>").s("triangle").lpf(400).gain(0.7)._pianoroll()\n$: n("0 [2 4] <3 5> [~ <4 1>]").scale("A4:minor").s("gm_xylophone").room(0.4).delay(0.125)._pianoroll()',
  'setcpm(100/4)\n$: s("bd*4").duck("2:3").duckdepth(0.8).duckattack(0.2)._scope()\n$: s("[~ <~ cp:1>]*2")._scope()\n$: s("hh*8").gain("[0.5 0.3]*4")._scope()\n$: note("<c2 c2 eb2 f2>").s("sawtooth").lpf(400).gain(0.6)._pianoroll()',
  'setcpm(140/4)\nvar scale = "E:minor"\n$: n("<4 0 <5 9> 0>*8").scale(scale).s("sawtooth").o(2)._pianoroll()\n$: s("bd:1!4")._scope()\n$: s("[~ <~ cp:1>]*2")._scope()\n$: note("<e1 b1 c2 d2>").s("triangle").lpf(300).gain(0.7)._pianoroll()',
  'setcpm(85/4)\nvar scale = "F:major"\n$: s("bd ~ sd ~, hh*4").bank("RolandTR707")._scope()\n$: note("<f2 c2 bb1 c2>").s("gm_acoustic_bass").gain(0.8)._pianoroll()\n$: chord("<Fmaj7 Am7 Bbmaj7 C7>").voicing().s("gm_epiano1").room(0.5)._pianoroll()',
];

const MOCK_SHADER_SEEDS = [
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec2 center = vec2(0.5);\n    float d = length(uv - center);\n    float r = 0.25 + 0.1 * sin(iTime);\n    float glow = smoothstep(r, r - 0.05, d);\n    vec3 col = glow * vec3(0.2, 0.6, 1.0);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float t = uv.x + iTime * 0.3;\n    vec3 col = 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67)));\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = length(uv);\n    float wave = sin(d * 30.0 - iTime * 4.0);\n    vec3 col = vec3(wave * 0.5 + 0.5) * vec3(0.9, 0.3, 0.6);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float a = atan(uv.y, uv.x) + iTime * 0.5;\n    float r = length(uv);\n    float pat = sin(a * 6.0) * cos(r * 20.0 + iTime * 2.0);\n    vec3 col = vec3(pat * 0.5 + 0.5, r, 0.8 - r);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy * 4.0;\n    float v = sin(uv.x * 3.0 + iTime * 2.0);\n    v += sin(uv.y * 3.0 + iTime * 1.5);\n    v += sin((uv.x + uv.y) * 2.0 + iTime);\n    v += sin(length(uv) * 3.0);\n    vec3 col = 0.5 + 0.5 * cos(v + iTime + vec3(0.0, 2.0, 4.0));\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    uv *= 5.0 + sin(iTime) * 2.0;\n    float c = mod(floor(uv.x) + floor(uv.y), 2.0);\n    vec3 col = mix(vec3(0.1, 0.1, 0.2), vec3(1.0, 0.8, 0.3), c);\n    fragColor = vec4(col, 1.0);\n}',
];

const MOCK_STRUDEL_POOL = [
  'setcpm(150/4)\nvar scale = "D:dorian"\n$: s("bd*4, [~ sd]*2, hh*8").bank("RolandTR909").gain(0.7)._scope()\n$: note("<d2 d2 c2 a1>*2").s("sawtooth").lpf(500)._pianoroll()\n$: n("0 3 5 <7 [5 3]>").scale("D4:dorian").s("triangle").delay(0.3).room(0.4)._pianoroll()',
  'setcpm(110/4)\nvar scale = "G:mixolydian"\n$: s("bd [~ bd] sd ~, hh*8").bank("RolandTR808")._scope()\n$: note("<g1 f1 c2 d2>").s("sawtooth").lpf(600).gain(0.6)._pianoroll()\n$: n("[0,2,4] [1,3,5]").scale("G3:mixolydian").s("gm_epiano1").room(0.5)._pianoroll()',
  'setcpm(70/4)\nvar scale = "C:minor"\n$: note("c3 [eb3 g3] bb2 [f3 ab3]").s("triangle").room(0.8).delay(0.5).delayfeedback(0.6)._pianoroll()\n$: s("bd ~ sd ~").room(0.3)._scope()\n$: s("hh*4").gain(perlin.range(0.2, 0.6)).pan(rand)._scope()',
  'setcpm(95/4)\nvar scale = "Bb:major"\n$: s("bd sd bd sd, hh*8").bank("RolandTR909").gain(0.6)._scope()\n$: note("<bb1 f2 eb2 f2>*2").s("gm_synth_bass_1").lpf(500)._pianoroll()\n$: chord("<Bb F Gm Eb>").voicing().s("gm_epiano1").room(0.4).delay(0.25)._pianoroll()\n$: n("0 2 4 <6 [4 2]>").scale("Bb4:major").s("sine").fm(2).delay(0.3)._pianoroll()',
  'setcpm(128/4)\nvar scale = "A:minor"\n$: stack(\n  s("bd:4").struct("x <x -> - <- x> - - - - x - x <- x> -"),\n  s("sd:5").struct("- - - - x - - x").gain(0.5),\n  s("hh:4").struct("x x x - x - x x").gain(0.75)\n).room(".4:.5")._scope()\n$: s("supersaw, sine").n("<<0!3 [-2 -1]> <3!3 [3 4]>>").scale("A2:minor").seg(16).clip(0.9).cutoff(perlin.range(1000,4000).slow(2))._pianoroll()',
  'setcpm(120/4)\nvar scale = "C:major"\nlet BASS = note("<[c2 c3]*4 [g1 g2]*4 [a1 a2]*4 [f1 f2]*4>").sound("gm_synth_bass_1").lpf(800)\nlet PIANO = chord("<C G Am F>").voicing().s("gm_epiano1").room(0.5)\nlet DRUMS = s("bd*4, [~ sd]*2, hh*8").bank("RolandTR909")\narrange(\n  [4, stack(BASS, PIANO)],\n  [4, stack(BASS, PIANO, DRUMS)],\n  [2, stack(BASS, PIANO)],\n  [9999, silence]\n)',
  'setcpm(135/4)\nvar scale = "E:minor"\n$: s("bd*4")._scope()\n$: s("[~ hh]*4").gain("[0.05 0.2]*4")._scope()\n$: s("[~ sd]*2").gain(0.75)._scope()\n$: note("<e1 e2 g1 g2 a1 a2 b1 b2>").s("wt_digital").lpf("200 400").gain(0.8)._pianoroll()\n$: note("[~ [<[e3,g3,b3]!2 [e3,g3,a3]!2> ~]]*2").s("gm_electric_guitar_muted").delay("0.8:0.6:0.5").gain(0.5)._pianoroll()',
  'setcpm(60/4)\nvar scale = "D:minor"\n$: note("d3 [f3 a3] c3 [e3 g3]").s("triangle").room(0.8).delay(0.5).delayfeedback(0.6)._pianoroll()\n$: s("bd ~ sd ~").room(0.3).delay(0.5)._scope()\n$: s("hh*4").gain(perlin.range(0.2, 0.6)).pan(rand)._scope()\n$: n("0 [2 4] <3 5> [~ <4 1>]").scale("D5:minor").s("gm_music_box").room(0.6).gain(0.4)._pianoroll()',
  'setcpm(100/4)\nvar scale = "G:minor"\n$: s("bd:4(<3 5>,8)").bank("Linn9000").gain(0.8)._scope()\n$: s("sd:3").struct("<[~ x]!8 [~ x ~ [x x]]>").gain(0.7)._scope()\n$: s("hh*8").gain("[0.4 0.6]*4")._scope()\n$: n(irand(10).seg(0.5).add("[0 3]/4").add("0, 2, 4")).scale("G3:minor").sound("gm_synth_strings_1").attack(0.4).sustain(3).gain(0.4)._pianoroll()',
  'setcpm(91/4)\nvar scale = "F:minor"\n$: s("bd [~ bd] sd [~ sd], hh*4").bank("RolandTR707").gain(0.8)._scope()\n$: n("2").set(chord("<Fm Cm Db Gb>")).anchor(chord("<Fm Cm Db Gb>").rootNotes(1)).voicing().s("gm_acoustic_bass").gain(0.8).lpf(900)._pianoroll()\n$: chord("<Fm Cm Db Gb>").voicing().s("sawtooth").lpf(perlin.range(900,4000)).struct("[~ x]*2").clip(0.5).delay(".5:.125:.8").room(1).gain(0.3)._pianoroll()',
  'setcpm(120/4)\n$: s("bd!4")._scope()\n$: s("[~ hh]*4").gain(0.5)._scope()\n$: s("[~ sd]*2")._scope()\n$: note("<[a1,a2] [e1,e2] [f1,f2] [g1,g2]>").s("sawtooth").lpf(400).gain(0.7)._pianoroll()\n$: chord("<Am Em F G>").voicing().s("gm_epiano1").room(0.5).delay(0.3)._pianoroll()',
  'setcpm(140/4)\nvar scale = "C:minor"\nlet SYNTH = n(irand(10).seg(0.5).add("[0 3]/4").add("0, 2, 4")).scale("C3:minor")\n  .sound("gm_synth_strings_1").attack(0.4).sustain(3).distort("2:.4").gain(0.4)\nlet KICK = s("bd:4(<3 5>,8)").bank("Linn9000").gain(0.8)\nlet SNARE = s("sd:3").struct("<[~ x]!8 [~ x ~ [x x]]>").gain(0.7)\nlet HH = s("hh*8").gain("[0.4 0.6]*4")\n$: arrange(\n  [4, stack(SYNTH)],\n  [4, stack(SYNTH, KICK, HH)],\n  [4, stack(SYNTH, KICK, HH, SNARE)],\n  [9999, silence]\n)',

];

const MOCK_SHADER_POOL = [
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float a = atan(uv.y, uv.x);\n    float r = length(uv);\n    float spiral = sin(a * 3.0 + r * 20.0 - iTime * 3.0);\n    float brightness = 0.03 / (r + 0.03);\n    vec3 col = (spiral * 0.5 + 0.5) * vec3(0.4, 0.6, 1.0) * brightness;\n    col += 0.01 / (r + 0.01) * vec3(1.0, 0.9, 0.7);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float bx = floor(uv.x * 4.0);\n    float by = floor(uv.y * 4.0);\n    float id = bx + by * 4.0;\n    vec3 col = 0.5 + 0.5 * cos(id * 0.7 + iTime * 1.5 + vec3(0.0, 2.0, 4.0));\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = abs(uv.x) + abs(uv.y);\n    float wave = sin(d * 15.0 - iTime * 3.0) * 0.5 + 0.5;\n    vec3 col = mix(vec3(0.1, 0.0, 0.3), vec3(1.0, 0.5, 0.0), wave);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = length(uv);\n    float breath = 0.7 + 0.3 * sin(iTime * 1.5);\n    float core = 0.05 / (d + 0.05) * breath;\n    vec3 col = core * vec3(1.0, 0.3, 0.1);\n    float rays = sin(atan(uv.y, uv.x) * 8.0 + iTime * 2.0) * 0.5 + 0.5;\n    col += rays * 0.02 / (d + 0.1) * vec3(1.0, 0.8, 0.3);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    uv += 0.1 * vec2(sin(uv.y * 10.0 + iTime), cos(uv.x * 10.0 + iTime * 0.7));\n    float stripe = sin(uv.y * 40.0 + iTime * 2.0) * 0.5 + 0.5;\n    vec3 col = mix(vec3(0.0, 0.1, 0.3), vec3(0.0, 0.9, 0.7), stripe);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    vec3 col = vec3(0.0);\n    for (int i = 0; i < 6; i++) {\n        float fi = float(i);\n        vec2 p = vec2(sin(iTime * 0.7 + fi * 1.3), cos(iTime * 0.5 + fi * 1.7)) * 0.4;\n        col += 0.02 / length(uv - p) * (0.5 + 0.5 * cos(fi * 0.8 + iTime + vec3(0.0, 2.0, 4.0)));\n    }\n    fragColor = vec4(col, 1.0);\n}',
  // Buffer shader: smooth trails
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec3 prev = texture(iChannel0, uv).rgb * 0.97;\n    float t = iTime * 0.8;\n    vec2 center = 0.5 + 0.3 * vec2(cos(t), sin(t * 1.3));\n    float d = length(uv - center);\n    float spot = smoothstep(0.04, 0.0, d);\n    vec3 spotCol = 0.5 + 0.5 * cos(iTime + vec3(0.0, 2.0, 4.0));\n    vec3 col = max(prev, spot * spotCol);\n    fragColor = vec4(col, 1.0);\n}',
  // ES 3.0: tanh bloom
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    vec3 col = vec3(0.0);\n    for (int i = 0; i < 8; i++) {\n        float fi = float(i);\n        float t = iTime * (0.3 + fi * 0.07);\n        vec2 p = 0.35 * vec2(cos(t + fi), sin(t * 1.4 + fi * 0.8));\n        col += (0.5 + 0.5 * cos(fi + iTime * 0.4 + vec3(0.0, 2.0, 4.0))) * 0.03 / (length(uv - p) + 0.005);\n    }\n    col = tanh(col * 0.7);\n    fragColor = vec4(col, 1.0);\n}',
  // ES 3.0: round mosaic
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    float sz = 8.0 + 4.0 * sin(iTime * 0.3);\n    vec2 qc = round(fragCoord / sz) * sz;\n    vec2 uv = qc / iResolution.xy;\n    float id = dot(floor(qc / sz), vec2(1.0, 37.0));\n    vec3 col = 0.5 + 0.5 * cos(id * 0.1 + iTime + vec3(0.0, 2.0, 4.0));\n    float d = length(fract(fragCoord / sz) - 0.5);\n    col *= smoothstep(0.5, 0.3, d);\n    fragColor = vec4(col, 1.0);\n}',
  // Buffer shader: Game of Life with trail
  'float hash(vec2 p) {\n    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    if (iFrame == 0) {\n        float r = hash(fragCoord + vec2(42.0, 17.0));\n        float alive = step(0.62, r);\n        fragColor = vec4(alive, alive, alive, 1.0);\n        return;\n    }\n    vec2 px = 1.0 / iResolution.xy;\n    float sum = 0.0;\n    for (int x = -1; x <= 1; x++) {\n        for (int y = -1; y <= 1; y++) {\n            if (x == 0 && y == 0) continue;\n            sum += texture(iChannel0, uv + vec2(float(x), float(y)) * px).r;\n        }\n    }\n    vec2 prev = texture(iChannel0, uv).rg;\n    float self = prev.r;\n    float trail = prev.g;\n    float alive = 0.0;\n    if (self > 0.5) {\n        alive = (sum > 1.5 && sum < 3.5) ? 1.0 : 0.0;\n    } else {\n        alive = (sum > 2.5 && sum < 3.5) ? 1.0 : 0.0;\n    }\n    trail = max(trail * 0.95, alive);\n    vec3 col = mix(vec3(0.0, 0.02, 0.1) * trail, vec3(0.1, 0.8, 0.4), alive);\n    fragColor = vec4(alive, trail, 0.0, 1.0);\n}',
];

const MOCK_OPENSCAD_SEEDS = [
  '// Layered Tower\n$fn = 48;\nfor (i = [0:6]) {\n    translate([0, 0, i * 5])\n      color([i/7, 0.4, 1 - i/7])\n        cube([18 - i*2, 18 - i*2, 4], center=true);\n}',
  '// Radial Spokes\n$fn = 48;\ncolor("DarkSlateGray") cylinder(h=3, r=20, center=true);\nfor (i = [0:7]) {\n    rotate([0, 0, i * 45])\n      color("Coral")\n        translate([10, 0, 3])\n          cube([12, 2, 6], center=true);\n}\ncolor("Gold") translate([0, 0, 6]) sphere(r=5);',
  '// Hollow Sphere\n$fn = 64;\ndifference() {\n    sphere(r=15);\n    sphere(r=13);\n    translate([0, 0, 10]) cube([40, 40, 10], center=true);\n    for (i = [0:5]) {\n        rotate([0, 0, i * 60])\n          rotate([90, 0, 0])\n            cylinder(h=40, r=2, center=true);\n    }\n}',
  '// Twisted Star\n$fn = 48;\nlinear_extrude(height=30, twist=90, slices=60, scale=0.5) {\n    difference() {\n        circle(r=12);\n        for (i = [0:4])\n            rotate([0, 0, i * 72])\n              translate([7, 0, 0])\n                circle(r=4);\n    }\n}',
  '// Crystal Cluster\n$fn = 6;\nfor (i = [0:8]) {\n    a = i * 137.508;\n    r = 3 + i * 1.2;\n    h = 8 + (i % 4) * 5;\n    translate([r * cos(a), r * sin(a), 0])\n      color([0.6 + i*0.04, 0.8, 1])\n        cylinder(h=h, r1=2.5, r2=0.5);\n}',
  '// Toroidal Ring\n$fn = 64;\nrotate_extrude()\n    translate([15, 0, 0])\n      difference() {\n          circle(r=5);\n          circle(r=3);\n      }',
];

const MOCK_OPENSCAD_POOL = [
  '// Gear\n$fn = 48;\nn_teeth = 16;\nouter_r = 20;\ninner_r = 16;\ntooth_w = 3;\n\ncolor("SteelBlue")\nlinear_extrude(height=5)\n    difference() {\n        union() {\n            circle(r=inner_r);\n            for (i = [0:n_teeth-1])\n                rotate([0, 0, i * 360/n_teeth])\n                  translate([0, -tooth_w/2, 0])\n                    square([outer_r, tooth_w]);\n        }\n        circle(r=5);\n    }',
  '// Tree\n$fn = 16;\nmodule branch(len, thick, depth) {\n    if (depth > 0) {\n        color([0.4, 0.2 + depth*0.1, 0.1])\n          cylinder(h=len, r1=thick, r2=thick*0.65);\n        translate([0, 0, len]) {\n            rotate([0, 25, 0]) branch(len*0.7, thick*0.6, depth-1);\n            rotate([0, -25, 120]) branch(len*0.7, thick*0.6, depth-1);\n            rotate([0, -25, 240]) branch(len*0.7, thick*0.6, depth-1);\n        }\n    } else {\n        color("LimeGreen") sphere(r=thick*3);\n    }\n}\nbranch(15, 2, 4);',
  '// Spiral Staircase\n$fn = 32;\nsteps = 20;\nfor (i = [0:steps-1]) {\n    rotate([0, 0, i * 18])\n      translate([8, -3, i * 2])\n        color([i/steps, 0.5, 1 - i/steps])\n          cube([10, 6, 1.5]);\n}\ncolor("Gray") cylinder(h=steps * 2 + 2, r=2);',
  '// Architectural Arch\n$fn = 48;\ncolor("Chocolate") {\n    translate([-12, 0, 0]) cube([4, 4, 25]);\n    translate([8, 0, 0]) cube([4, 4, 25]);\n}\ncolor("Gold")\n  translate([0, 2, 25])\n    rotate([90, 0, 0])\n      difference() {\n          cylinder(h=4, r=12);\n          cylinder(h=6, r=9, center=true);\n          translate([0, -15, 0]) cube([30, 30, 6], center=true);\n      }',
  '// Vase\n$fn = 64;\ncolor("Teal")\ndifference() {\n    rotate_extrude()\n        polygon([for (i = [0:40])\n            let(t = i/40,\n                r = 8 + 4*sin(t*360) + 2*sin(t*720),\n                z = t * 30)\n            [r, z]\n        ]);\n    translate([0, 0, 2])\n      rotate_extrude()\n        polygon([for (i = [0:40])\n            let(t = i/40,\n                r = 7 + 4*sin(t*360) + 2*sin(t*720),\n                z = t * 30)\n            [r, z]\n        ]);\n}',
  '// Interlocking Rings\n$fn = 64;\ncolor("Gold")\nrotate_extrude()\n    translate([12, 0, 0]) circle(r=2);\ncolor("Silver")\nrotate([90, 0, 0])\n  rotate_extrude()\n    translate([12, 0, 0]) circle(r=2);',
  '// Parametric Shell\n$fn = 48;\nfor (i = [0:60]) {\n    a = i * 20;\n    r = 1 + i * 0.25;\n    z = i * 0.4;\n    translate([r*cos(a), r*sin(a), z])\n      color([0.9, 0.7 - i*0.01, 0.5])\n        sphere(r = 0.5 + i*0.04, $fn=12);\n}',
  '// Sierpinski Tetrahedron\n$fn = 16;\nmodule sierp(size, depth) {\n    if (depth == 0) {\n        polyhedron(\n            points=[[0,0,0],[size,0,0],[size/2,size*0.866,0],[size/2,size*0.289,size*0.816]],\n            faces=[[0,2,1],[0,1,3],[1,2,3],[0,3,2]]\n        );\n    } else {\n        s2 = size/2;\n        sierp(s2, depth-1);\n        translate([s2,0,0]) sierp(s2, depth-1);\n        translate([s2/2,s2*0.866,0]) sierp(s2, depth-1);\n        translate([s2/2,s2*0.289,s2*0.816]) sierp(s2, depth-1);\n    }\n}\ncolor("MediumPurple") sierp(30, 3);',
  '// Honeycomb Plate\n$fn = 6;\ncell = 5;\nwall = 1;\nh = 4;\n\ndifference() {\n    color("Gold")\n      cylinder(h=h, r=30, $fn=64);\n    for (y = [-4:4])\n      for (x = [-4:4]) {\n          ox = (y % 2 == 0) ? 0 : cell * 0.866;\n          translate([x * cell * 1.732 + ox, y * cell * 1.5, -1])\n            cylinder(h=h+2, r=cell - wall, $fn=6);\n      }\n}',
  '// Abstract Sculpture\n$fn = 32;\nhull() {\n    color("Coral") sphere(r=5);\n    color("SteelBlue") translate([15, 5, 20]) sphere(r=3);\n}\nhull() {\n    color("SteelBlue") translate([15, 5, 20]) sphere(r=3);\n    color("Gold") translate([-5, 15, 35]) sphere(r=4);\n}\nhull() {\n    color("Gold") translate([-5, 15, 35]) sphere(r=4);\n    color("Teal") translate([10, -10, 45]) sphere(r=2);\n}\ncolor("DarkSlateGray") cube([30, 30, 2], center=true);',
];

const MOCK_SVG_SEEDS = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ff6b35"/><stop offset="100%" stop-color="#f7c948"/></linearGradient></defs><circle cx="100" cy="100" r="70" fill="url(#g1)"/><polygon points="100,45 120,85 165,85 130,110 145,155 100,128 55,155 70,110 35,85 80,85" fill="#fff" opacity="0.9"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1a1a2e"/><g transform="translate(100,100)"><g><rect x="-50" y="-50" width="100" height="100" rx="8" fill="none" stroke="#e94560" stroke-width="3"/><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="12s" repeatCount="indefinite"/></g><g><rect x="-40" y="-40" width="80" height="80" rx="6" fill="none" stroke="#0f3460" stroke-width="3"/><animateTransform attributeName="transform" type="rotate" from="0" to="-360" dur="8s" repeatCount="indefinite"/></g><g><rect x="-30" y="-30" width="60" height="60" rx="4" fill="none" stroke="#16213e" stroke-width="3"/><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite"/></g><circle cx="0" cy="0" r="12" fill="#e94560"><animate attributeName="r" values="12;16;12" dur="2s" repeatCount="indefinite"/></circle></g></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#ecf0f1"/><g transform="translate(100,100)"><circle cx="-25" cy="-15" r="30" fill="#e74c3c" opacity="0.8"><animate attributeName="cx" values="-25;-20;-25" dur="3s" repeatCount="indefinite"/></circle><circle cx="25" cy="-15" r="30" fill="#3498db" opacity="0.8"><animate attributeName="cx" values="25;20;25" dur="3s" repeatCount="indefinite"/></circle><circle cx="0" cy="20" r="30" fill="#f1c40f" opacity="0.8"><animate attributeName="cy" values="20;15;20" dur="3s" repeatCount="indefinite"/></circle></g></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#2d3436"/><g transform="translate(100,100)"><path d="M0,-70 L20,-25 70,-25 30,5 45,55 0,30 -45,55 -30,5 -70,-25 -20,-25Z" fill="#fdcb6e"/><path d="M0,-45 L12,-15 45,-15 20,5 28,35 0,18 -28,35 -20,5 -45,-15 -12,-15Z" fill="#2d3436"/></g></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="lg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6c5ce7"/><stop offset="100%" stop-color="#a29bfe"/></linearGradient></defs><rect width="200" height="200" fill="#0a0a0a"/><text x="100" y="115" text-anchor="middle" font-family="sans-serif" font-size="72" font-weight="bold" fill="url(#lg2)">AB</text><line x1="40" y1="140" x2="160" y2="140" stroke="#6c5ce7" stroke-width="2"/><text x="100" y="160" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#a29bfe" letter-spacing="6">STUDIO</text></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1e272e"/><g transform="translate(100,100)"><polygon points="0,-65 56,-32 56,32 0,65 -56,32 -56,-32" fill="none" stroke="#0be881" stroke-width="3"/><polygon points="0,-40 35,-20 35,20 0,40 -35,20 -35,-20" fill="none" stroke="#0be881" stroke-width="2" opacity="0.6"/><circle cx="0" cy="0" r="12" fill="#0be881"/></g></svg>',
];

const MOCK_SVG_POOL = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><radialGradient id="rg1" cx="50%" cy="40%"><stop offset="0%" stop-color="#667eea"/><stop offset="100%" stop-color="#764ba2"/></radialGradient></defs><rect width="200" height="200" fill="#0f0c29"/><circle cx="100" cy="85" r="45" fill="url(#rg1)"/><path d="M55 130 Q100 170 145 130" fill="none" stroke="#667eea" stroke-width="3" stroke-linecap="round"/><circle cx="82" cy="78" r="5" fill="#fff"/><circle cx="118" cy="78" r="5" fill="#fff"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fdf6e3"/><g transform="translate(100,100)"><path d="M0,-60 L15,-20 60,-20 25,5 38,50 0,25 -38,50 -25,5 -60,-20 -15,-20Z" fill="none" stroke="#b58900" stroke-width="2.5"/><circle cx="0" cy="0" r="25" fill="#268bd2" opacity="0.8"/><text x="0" y="7" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#fdf6e3">S</text></g></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2c3e50"/><stop offset="100%" stop-color="#3498db"/></linearGradient></defs><rect width="200" height="200" fill="url(#sky)"/><g transform="translate(100,110)"><path d="M-50,0 C-50,-55 50,-55 50,0" fill="#2ecc71"/><path d="M-30,0 C-30,-40 30,-40 30,0" fill="#27ae60"/><rect x="-5" y="0" width="10" height="30" fill="#8b6914"/></g><circle cx="155" cy="40" r="20" fill="#f1c40f" opacity="0.9"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="wave" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#ee5a24"/><stop offset="50%" stop-color="#f0932b"/><stop offset="100%" stop-color="#f6e58d"/></linearGradient></defs><rect width="200" height="200" fill="#130f40"/><path d="M20,120 Q50,80 80,120 T140,120 T200,120" fill="none" stroke="url(#wave)" stroke-width="4" stroke-linecap="round"/><path d="M0,140 Q40,100 80,140 T160,140 T220,140" fill="none" stroke="url(#wave)" stroke-width="3" opacity="0.6" stroke-linecap="round"/><circle cx="160" cy="50" r="25" fill="#f6e58d" opacity="0.8"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff"/><g transform="translate(100,100)"><circle cx="0" cy="0" r="70" fill="none" stroke="#333" stroke-width="4"/><line x1="0" y1="-70" x2="0" y2="-55" stroke="#333" stroke-width="4"/><line x1="0" y1="55" x2="0" y2="70" stroke="#333" stroke-width="4"/><line x1="-70" y1="0" x2="-55" y2="0" stroke="#333" stroke-width="4"/><line x1="55" y1="0" x2="70" y2="0" stroke="#333" stroke-width="4"/><circle cx="0" cy="0" r="5" fill="#e74c3c"/><line x1="0" y1="0" x2="0" y2="-40" stroke="#333" stroke-width="3" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="60s" repeatCount="indefinite"/></line><line x1="0" y1="0" x2="25" y2="15" stroke="#333" stroke-width="2" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="3600s" repeatCount="indefinite"/></line></g></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><clipPath id="cp1"><circle cx="100" cy="100" r="80"/></clipPath></defs><rect width="200" height="200" fill="#2c3e50"/><g clip-path="url(#cp1)"><rect x="0" y="0" width="100" height="200" fill="#e74c3c"/><rect x="100" y="0" width="100" height="200" fill="#3498db"/><rect x="50" y="50" width="100" height="100" fill="#f39c12" opacity="0.8"/></g><circle cx="100" cy="100" r="80" fill="none" stroke="#ecf0f1" stroke-width="3"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><style>@keyframes orbit{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes glow{0%,100%{opacity:0.4}50%{opacity:1}}.orb1{animation:orbit 4s linear infinite;transform-origin:100px 100px}.orb2{animation:orbit 6s linear infinite reverse;transform-origin:100px 100px}.orb3{animation:orbit 8s linear infinite;transform-origin:100px 100px}.center{animation:glow 2s ease-in-out infinite}</style><rect width="200" height="200" fill="#0d1117"/><circle cx="100" cy="100" r="60" fill="none" stroke="#1a2332" stroke-width="1"/><circle cx="100" cy="100" r="40" fill="none" stroke="#1a2332" stroke-width="1"/><circle cx="100" cy="100" r="20" fill="none" stroke="#1a2332" stroke-width="1"/><circle class="orb1" cx="160" cy="100" r="6" fill="#58a6ff"/><circle class="orb2" cx="140" cy="100" r="4" fill="#f778ba"/><circle class="orb3" cx="120" cy="100" r="3" fill="#7ee787"/><circle class="center" cx="100" cy="100" r="10" fill="#58a6ff"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#ffeaa7"/><g transform="translate(100,95)"><ellipse cx="0" cy="15" rx="45" ry="35" fill="#fdcb6e"/><circle cx="0" cy="-15" r="30" fill="#fdcb6e"/><circle cx="-10" cy="-20" r="4" fill="#2d3436"/><circle cx="10" cy="-20" r="4" fill="#2d3436"/><path d="M-8,-8 Q0,2 8,-8" fill="none" stroke="#2d3436" stroke-width="2" stroke-linecap="round"/><ellipse cx="-30" cy="10" rx="15" ry="8" fill="#fdcb6e" transform="rotate(-20,-30,10)"/><ellipse cx="30" cy="10" rx="15" ry="8" fill="#fdcb6e" transform="rotate(20,30,10)"/></g></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="#e17055" opacity="0.3"/></pattern></defs><rect width="200" height="200" fill="#dfe6e9"/><rect width="200" height="200" fill="url(#dots)"/><g transform="translate(100,100)"><path d="M0,-50 Q50,0 0,50 Q-50,0 0,-50Z" fill="#d63031"/><path d="M0,-30 Q30,0 0,30 Q-30,0 0,-30Z" fill="#dfe6e9"/></g></svg>',
];

const MOCK_SEEDS: Record<string, string[]> = {
  strudel: MOCK_STRUDEL_SEEDS,
  shader: MOCK_SHADER_SEEDS,
  openscad: MOCK_OPENSCAD_SEEDS,
  svg: MOCK_SVG_SEEDS,
};

const MOCK_POOLS: Record<string, string[]> = {
  strudel: MOCK_STRUDEL_POOL,
  shader: MOCK_SHADER_POOL,
  openscad: MOCK_OPENSCAD_POOL,
  svg: MOCK_SVG_POOL,
};

// ── Helpers ──

function makeProgram(
  code: string,
  modality: string,
  generation: number,
  sessionId: string,
  parentIds: string[] = [],
): Program {
  return {
    id: crypto.randomUUID(),
    code,
    modality,
    generation,
    parentIds,
    sessionId,
    createdAt: new Date().toISOString(),
  };
}

function mockEvolve(
  modality: string,
  parents: Program[],
  count: number,
): string[] {
  const pool = MOCK_POOLS[modality] ?? MOCK_POOLS.strudel;
  const parentCodes = new Set(parents.map((p) => p.code));
  const available = pool.filter((p) => !parentCodes.has(p));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── Hook ──

export function useEvolution() {
  const startNewSession = useCallback(
    async (modality: string, initialPrompt?: string) => {
      // Capture config before reset so it is never lost
      const llmConfig = useSessionStore.getState().llmConfig;
      setApiLLMConfig(llmConfig);

      const store = useSessionStore.getState();
      store.reset();
      store.setModality(modality);
      store.setIsLoading(true);

      try {
        const { provider, model, baseUrl, contextProfile, streamOutput } = llmConfig;
        const requestBody = {
          modality,
          prompt: initialPrompt || undefined,
          provider,
          model,
          ...(baseUrl ? { base_url: baseUrl } : {}),
          context_profile: contextProfile || 'intermediate',
        };

        type SeedResult = {
          programs: Array<{
            id: string;
            code: string;
            modality: string;
            generation: number;
            parent_ids: string[];
            session_id: string;
            created_at: string;
          }>;
          generation: number;
          source: string;
          message: string | null;
        };

        if (streamOutput) {
          // Streaming path
          store.setStreamingText('');
          const result = await new Promise<SeedResult>((resolve, reject) => {
            streamPost<SeedResult>('/api/sessions/stream', requestBody, {
              onSession: (sessionData) => {
                store.setSession({
                  id: sessionData.id,
                  name: sessionData.name,
                  modality: sessionData.modality,
                  createdAt: sessionData.created_at,
                });
              },
              onToken: (text) => {
                useSessionStore.getState().appendStreamingText(text);
              },
              onDone: (data) => resolve(data),
              onError: (msg) => {
                useLogStore.getState().addLog('warning', msg);
              },
              onStatus: (phase) => {
                useSessionStore.getState().setStreamingPhase(phase);
              },
            }).catch(reject);
          });

          store.addGeneration(
            result.programs.map((p) => ({
              id: p.id,
              code: p.code,
              modality: p.modality,
              generation: p.generation,
              parentIds: p.parent_ids ?? [],
              sessionId: p.session_id ?? store.session?.id ?? '',
              createdAt: p.created_at ?? new Date().toISOString(),
            })),
          );

          const addLog = useLogStore.getState().addLog;
          const isMock = result.source === 'mock';
          store.addGenerationMeta({
            guidance: initialPrompt || '',
            llmModel: isMock ? 'Mock' : `${provider}/${model}`,
            contextProfile: contextProfile || 'intermediate',
          });
          if (isMock) {
            store.setLastEvolveSource('mock');
            addLog('warning', result.message ?? 'Backend used mock examples');
          } else {
            store.setLastEvolveSource('llm');
            addLog('success', `Generation seeded via ${provider}/${model}`);
          }
        } else {
          // Non-streaming path
          const res = await api.post<{
            id: string;
            name: string;
            modality: string;
            created_at: string;
            source: string;
            message: string | null;
            programs: Array<{
              id: string;
              code: string;
              modality: string;
              generation: number;
              parent_ids: string[];
              session_id: string;
              created_at: string;
            }>;
          }>('/api/sessions', requestBody);

          store.setSession({
            id: res.id,
            name: res.name,
            modality: res.modality,
            createdAt: res.created_at,
          });
          store.addGeneration(
            res.programs.map((p) => ({
              id: p.id,
              code: p.code,
              modality: p.modality,
              generation: p.generation,
              parentIds: p.parent_ids,
              sessionId: p.session_id,
              createdAt: p.created_at,
            })),
          );

          const addLog = useLogStore.getState().addLog;
          const isMock = res.source === 'mock';
          store.addGenerationMeta({
            guidance: initialPrompt || '',
            llmModel: isMock ? 'Mock' : `${provider}/${model}`,
            contextProfile: contextProfile || 'intermediate',
          });
          if (isMock) {
            store.setLastEvolveSource('mock');
            addLog('warning', res.message ?? 'Backend used mock examples');
          } else {
            store.setLastEvolveSource('llm');
            addLog('success', `Generation seeded via ${provider}/${model}`);
          }
        }
      } catch (err) {
        // Mock mode — no backend available
        const sessionId = crypto.randomUUID();
        store.setSession({
          id: sessionId,
          name: 'Untitled Session',
          modality,
          createdAt: new Date().toISOString(),
        });
        const seeds = MOCK_SEEDS[modality] ?? MOCK_SEEDS.strudel;
        store.addGeneration(
          seeds.map((code) => makeProgram(code, modality, 0, sessionId)),
        );
        store.addGenerationMeta({
          guidance: initialPrompt || '',
          llmModel: 'Mock',
          contextProfile: llmConfig.contextProfile || 'intermediate',
        });
        const addLog = useLogStore.getState().addLog;
        store.setLastEvolveSource('mock');
        addLog('error', `Backend unavailable — using mock examples. ${err instanceof Error ? err.message : ''}`);
      } finally {
        store.setIsLoading(false);
        store.setStreamingText('');
        store.setStreamingPhase('');
      }
    },
    [],
  );

  const evolve = useCallback(
    async (parents: Program[], guidance?: string) => {
      const store = useSessionStore.getState();
      const modality = store.modality ?? 'strudel';
      const customized = store.customizedPrograms;
      store.setIsEvolving(true);

      // Sync LLM config to API client for header injection
      setApiLLMConfig(store.llmConfig);

      // Use customized code when available
      const parentPayload = parents.map((p) => ({
        id: p.id,
        code: customized[p.id] ?? p.code,
      }));

      try {
        const { provider, model, baseUrl, contextProfile, streamOutput } = store.llmConfig;
        const requestBody = {
          modality,
          parents: parentPayload,
          guidance,
          population_size: 6,
          session_id: store.session?.id,
          provider,
          model,
          ...(baseUrl ? { base_url: baseUrl } : {}),
          context_profile: contextProfile || 'intermediate',
        };

        type EvolveResult = {
          programs: Array<{
            id: string;
            code: string;
            modality: string;
            generation: number;
            parent_ids: string[];
            session_id: string;
            created_at: string;
          }>;
          generation: number;
          source: string;
          message: string | null;
        };

        let res: EvolveResult;

        if (streamOutput) {
          // Streaming path via SSE
          store.setStreamingText('');
          res = await new Promise<EvolveResult>((resolve, reject) => {
            streamPost<EvolveResult>('/api/evolve/stream', requestBody, {
              onToken: (text) => {
                useSessionStore.getState().appendStreamingText(text);
              },
              onDone: (data) => resolve(data),
              onError: (msg) => {
                useLogStore.getState().addLog('warning', msg);
              },
              onStatus: (phase) => {
                useSessionStore.getState().setStreamingPhase(phase);
              },
            }).catch(reject);
          });
        } else {
          // Regular non-streaming path
          res = await api.post<EvolveResult>('/api/evolve', requestBody);
        }

        // If no session existed locally, capture the backend-created one
        if (!store.session && res.programs.length > 0) {
          const sid = res.programs[0].session_id;
          if (sid) {
            store.setSession({
              id: sid,
              name: 'Untitled Session',
              modality,
              createdAt: new Date().toISOString(),
            });
          }
        }

        store.addGeneration(
          res.programs.map((p) => ({
            id: p.id,
            code: p.code,
            modality: p.modality,
            generation: p.generation,
            parentIds: p.parent_ids ?? [],
            sessionId: p.session_id ?? store.session?.id ?? '',
            createdAt: p.created_at ?? new Date().toISOString(),
          })),
        );

        const addLog = useLogStore.getState().addLog;
        const isMockEvolve = res.source === 'mock';
        store.addGenerationMeta({
          guidance: guidance || '',
          llmModel: isMockEvolve ? 'Mock' : `${provider}/${model}`,
          contextProfile: contextProfile || 'intermediate',
        });
        if (isMockEvolve) {
          store.setLastEvolveSource('mock');
          addLog('warning', res.message ?? 'Backend used mock examples');
        } else {
          store.setLastEvolveSource('llm');
          addLog('success', `Generation ${res.generation} evolved via ${provider}/${model}`);
        }
      } catch (err) {
        // Mock evolution
        store.setLastEvolveSource('mock');
        const gen = store.generations.length;
        const sessionId = store.session?.id ?? '';
        const codes = mockEvolve(modality, parents, 6);
        store.addGeneration(
          codes.map((code) =>
            makeProgram(
              code,
              modality,
              gen,
              sessionId,
              parents.map((p) => p.id),
            ),
          ),
        );
        store.addGenerationMeta({
          guidance: guidance || '',
          llmModel: 'Mock',
          contextProfile: store.llmConfig.contextProfile || 'intermediate',
        });
        const addLog = useLogStore.getState().addLog;
        addLog('error', `Backend unavailable — using mock evolution. ${err instanceof Error ? err.message : ''}`);
      } finally {
        store.setGuidance('');
        store.setIsEvolving(false);
        store.setStreamingText('');
        store.setStreamingPhase('');
      }
    },
    [],
  );

  return { startNewSession, evolve };
}
