/* Синтез звуковых событий — шов для тестов. Без DOM, без файлов, без сети.
 * soundFor(event) -> {freq, dur}: чисто, частоты в Гц, длительность в секундах.
 * play(spec): тонкий WebAudio-осциллятор; вне браузера или без AudioContext — no-op.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GEO_SOUND = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Верно — высокое короткое; неверно — низкое; финиш — самое высокое и
  // долгое; клик — нейтральное. Значения зафиксированы smoke-тестом.
  function soundFor(event) {
    if (event === 'correct') return { freq: 660, dur: 0.12 };
    if (event === 'wrong') return { freq: 180, dur: 0.25 };
    if (event === 'finish') return { freq: 880, dur: 0.4 };
    return { freq: 440, dur: 0.07 };
  }

  var ctx = null;
  function play(spec) {
    if (!spec || typeof spec.freq !== 'number' || typeof spec.dur !== 'number') return false;
    try {
      var AC = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) ||
        (typeof self !== 'undefined' && (self.AudioContext || self.webkitAudioContext));
      if (!AC) return false;
      ctx = ctx || new AC();
      if (ctx.state === 'suspended') ctx.resume();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = spec.freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + spec.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + spec.dur + 0.02);
      return true;
    } catch (e) { return false; }
  }

  return { soundFor: soundFor, play: play };
}));
