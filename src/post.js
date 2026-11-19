// ===================== POST-PROCESSING: the film look on top of the 3D scenes =====================
// The scene is drawn into an off-screen image (with 4x multisampling where WebGL2 allows), then:
//  - bloom: bright pixels (lamps, tail lights, neon) bleed light, using a dual-filter blur chain at 1/2 … 1/32 size
//  - a soft shoulder so whites roll off instead of clipping, a gentle night grade (cool shadows, warm highlights)
//  - vignette, fine film grain, a hint of lens fringing at the edges and, in the race, a radial speed blur
// Off on the Retró setting, lighter on Közepes, full on Éles and Ultra.
const Post = {
  // what each graphics setting gets
  cfg(gfx) {
    return {
      low: null,
      mid: { levels: 4, msaa: true, hdr: false, ca: 0, grain: 0.022, vig: 0.32, speed: false },
      high: { levels: 5, msaa: true, hdr: false, ca: 0.0026, grain: 0.028, vig: 0.38, speed: true },
      ultra: { levels: 6, msaa: true, hdr: true, ca: 0.003, grain: 0.03, vig: 0.4, speed: true }
    }[gfx] || null;
  },
  make(renderer, gfx, look) {
    const c = this.cfg(gfx); if (!c) return null;
    try { return new PostFX(renderer, Object.assign({}, c, look || {})); } catch (e) { console.warn('post off', e); return null; }
  }
};

const POST_VS = 'varying vec2 vUv;\nvoid main() { vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }';

class PostFX {
  constructor(r, o) {
    this.r = r; this.o = o; this.t = 0; this.speed = 0;
    r.info.autoReset = false; // count the whole frame (scene + passes), not just the last pass
    const gl2 = !!(r.capabilities && r.capabilities.isWebGL2), ext = r.extensions;
    const canHalf = gl2 && ext && (ext.has ? (ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float')) : !!ext.get('EXT_color_buffer_float'));
    this.type = o.hdr && canHalf ? THREE.HalfFloatType : THREE.UnsignedByteType;
    this.hdr = this.type === THREE.HalfFloatType;
    const base = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, type: this.type, stencilBuffer: false };
    if (o.msaa && gl2 && THREE.WebGLMultisampleRenderTarget) { this.rt = new THREE.WebGLMultisampleRenderTarget(4, 4, Object.assign({ depthBuffer: true }, base)); this.rt.samples = 4; }
    else this.rt = new THREE.WebGLRenderTarget(4, 4, Object.assign({ depthBuffer: true }, base));
    this.down = []; this.up = [];
    for (let i = 0; i < o.levels; i++) { this.down.push(new THREE.WebGLRenderTarget(2, 2, Object.assign({ depthBuffer: false }, base))); if (i < o.levels - 1) this.up.push(new THREE.WebGLRenderTarget(2, 2, Object.assign({ depthBuffer: false }, base))); }
    // one triangle that covers the screen
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.geo = g; this.quad = new THREE.Mesh(g, null); this.quad.frustumCulled = false;
    this.qs = new THREE.Scene(); this.qs.add(this.quad); this.qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mat = (fs, u) => new THREE.ShaderMaterial({ vertexShader: POST_VS, fragmentShader: fs, uniforms: u, depthTest: false, depthWrite: false });
    this.mPre = mat([
      'uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThr; uniform float uKnee; varying vec2 vUv;',
      'void main() {',
      '  vec3 s = texture2D(tSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture2D(tSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb + texture2D(tSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture2D(tSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb;',
      '  s *= 0.25; float br = max(s.r, max(s.g, s.b));',
      '  float soft = clamp(br - uThr + uKnee, 0.0, 2.0 * uKnee); soft = soft * soft / (4.0 * uKnee + 1e-4);',
      '  float w = max(soft, br - uThr) / max(br, 1e-4);',
      '  gl_FragColor = vec4(min(s * w, vec3(12.0)), 1.0); }'].join('\n'), { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThr: { value: 0.8 }, uKnee: { value: 0.3 } });
    this.mDown = mat([
      'uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;',
      'void main() { vec3 s = texture2D(tSrc, vUv).rgb * 4.0;',
      '  s += texture2D(tSrc, vUv - uTexel).rgb + texture2D(tSrc, vUv + uTexel).rgb + texture2D(tSrc, vUv + vec2(uTexel.x, -uTexel.y)).rgb + texture2D(tSrc, vUv - vec2(uTexel.x, -uTexel.y)).rgb;',
      '  gl_FragColor = vec4(s * 0.125, 1.0); }'].join('\n'), { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.mUp = mat([
      'uniform sampler2D tLow; uniform sampler2D tCur; uniform vec2 uTexel; uniform float uScatter; varying vec2 vUv;',
      'void main() { vec2 t = uTexel;',
      '  vec3 s = texture2D(tLow, vUv + vec2(-2.0 * t.x, 0.0)).rgb + texture2D(tLow, vUv + vec2(2.0 * t.x, 0.0)).rgb + texture2D(tLow, vUv + vec2(0.0, -2.0 * t.y)).rgb + texture2D(tLow, vUv + vec2(0.0, 2.0 * t.y)).rgb;',
      '  s += 2.0 * (texture2D(tLow, vUv + vec2(-t.x, t.y)).rgb + texture2D(tLow, vUv + vec2(t.x, t.y)).rgb + texture2D(tLow, vUv + vec2(-t.x, -t.y)).rgb + texture2D(tLow, vUv + vec2(t.x, -t.y)).rgb);',
      '  gl_FragColor = vec4(texture2D(tCur, vUv).rgb + s / 12.0 * uScatter, 1.0); }'].join('\n'), { tLow: { value: null }, tCur: { value: null }, uTexel: { value: new THREE.Vector2() }, uScatter: { value: 0.85 } });
    this.mComp = mat([
      'uniform sampler2D tScene; uniform sampler2D tBloom; uniform float uBloom; uniform float uExpo; uniform float uVig; uniform float uGrain; uniform float uCA; uniform float uRad; uniform float uTime;',
      'uniform float uSat; uniform float uCon; uniform vec3 uLift; uniform vec3 uGain; uniform vec2 uRes; varying vec2 vUv;',
      'vec3 shoulder(vec3 x) { vec3 t = max(x - 0.72, 0.0); return min(x, vec3(0.72)) + 0.28 * (1.0 - exp(-t / 0.28)); }',
      'void main() {',
      '  vec2 uv = vUv, d = uv - 0.5; float r2 = dot(d, d); vec3 c;',
      '  if (uCA > 0.0) { vec2 o = d * uCA * (0.4 + r2 * 4.0); c = vec3(texture2D(tScene, uv + o).r, texture2D(tScene, uv).g, texture2D(tScene, uv - o).b); }',
      '  else c = texture2D(tScene, uv).rgb;',
      '  if (uRad > 0.001) { vec3 a = c; float k = uRad * smoothstep(0.02, 0.35, r2);',
      '    for (int i = 1; i <= 5; i++) a += texture2D(tScene, uv - d * k * float(i) * 0.018).rgb;',
      '    c = a / 6.0; }',
      '  c = c * uExpo + texture2D(tBloom, uv).rgb * uBloom;',
      '  c = shoulder(c);',
      '  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));',
      '  c = mix(vec3(l), c, uSat);',
      '  c = c * mix(vec3(1.0), uGain, smoothstep(0.15, 0.9, l)) + uLift * (1.0 - smoothstep(0.0, 0.35, l));',
      '  c = mix(c, c * c * (3.0 - 2.0 * c), uCon);',
      '  vec2 vd = d * vec2(1.0, 0.82); c *= 1.0 - uVig * smoothstep(0.08, 0.62, dot(vd, vd) * 2.4);',
      '  float n = fract(sin(dot(floor(uv * uRes) + fract(uTime * 7.31) * 113.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;',
      '  c += n * uGrain * (1.0 - l * 0.6);',
      '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0); }'].join('\n'), {
      tScene: { value: null }, tBloom: { value: null }, uBloom: { value: 0.9 }, uExpo: { value: 1 }, uVig: { value: o.vig }, uGrain: { value: o.grain }, uCA: { value: o.ca }, uRad: { value: 0 }, uTime: { value: 0 },
      uSat: { value: o.sat == null ? 1.08 : o.sat }, uCon: { value: o.con == null ? 0.12 : o.con }, uLift: { value: new THREE.Vector3().fromArray(o.lift || [0.006, 0.012, 0.03]) }, uGain: { value: new THREE.Vector3().fromArray(o.gain || [1.04, 1.0, 0.94]) }, uRes: { value: new THREE.Vector2(1, 1) } });
    this.look(o);
    this.w = 0; this.h = 0; this._v = new THREE.Vector2();
  }
  // per-scene tuning: threshold, strength, exposure
  look(o) {
    const thr = this.hdr ? (o.thrH != null ? o.thrH : 1.0) : o.thr; if (thr != null) this.mPre.uniforms.uThr.value = thr;
    if (o.knee != null) this.mPre.uniforms.uKnee.value = o.knee;
    if (o.bloom != null) this.mComp.uniforms.uBloom.value = o.bloom;
    if (o.expo != null) this.mComp.uniforms.uExpo.value = o.expo;
    if (o.vig != null) this.mComp.uniforms.uVig.value = o.vig;
  }
  sync() {
    const s = this.r.getDrawingBufferSize(this._v), w = Math.max(4, s.x | 0), h = Math.max(4, s.y | 0);
    if (w === this.w && h === this.h) return;
    this.w = w; this.h = h; this.rt.setSize(w, h);
    let bw = w, bh = h;
    for (let i = 0; i < this.down.length; i++) { bw = Math.max(2, Math.round(bw / 2)); bh = Math.max(2, Math.round(bh / 2)); this.down[i].setSize(bw, bh); if (this.up[i]) this.up[i].setSize(bw, bh); }
    this.mComp.uniforms.uRes.value.set(w, h);
  }
  pass(m, target) { this.quad.material = m; this.r.setRenderTarget(target); this.r.render(this.qs, this.qc); }
  render(scene, cam, dt) {
    const r = this.r; r.info.reset(); this.sync(); this.t += dt || 0.016;
    r.setRenderTarget(this.rt); r.clear(); r.render(scene, cam);
    // bloom chain
    const D = this.down, U = this.up, n = D.length;
    this.mPre.uniforms.tSrc.value = this.rt.texture; this.mPre.uniforms.uTexel.value.set(1 / this.w, 1 / this.h); this.pass(this.mPre, D[0]);
    for (let i = 1; i < n; i++) { this.mDown.uniforms.tSrc.value = D[i - 1].texture; this.mDown.uniforms.uTexel.value.set(1 / D[i - 1].width, 1 / D[i - 1].height); this.pass(this.mDown, D[i]); }
    let low = D[n - 1];
    for (let i = n - 2; i >= 0; i--) { const u = this.mUp.uniforms; u.tLow.value = low.texture; u.tCur.value = D[i].texture; u.uTexel.value.set(1 / low.width, 1 / low.height); this.pass(this.mUp, U[i]); low = U[i]; }
    const c = this.mComp.uniforms;
    c.tScene.value = this.rt.texture; c.tBloom.value = low.texture; c.uTime.value = this.t;
    c.uRad.value = this.o.speed ? this.speed : 0;
    this.pass(this.mComp, null);
  }
  dispose() {
    for (const t of [this.rt, ...this.down, ...this.up]) t.dispose();
    for (const m of [this.mPre, this.mDown, this.mUp, this.mComp]) m.dispose();
    this.geo.dispose();
  }
}
