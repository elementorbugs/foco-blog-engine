// FOCO focus-timer widget builder.
// Emits the full <!-- wp:html --> block (markup + scoped CSS + JS) for a
// {minutes}-minute timer.
//
// Why it is self-contained and heavy on !important:
//   Blog POSTS render light now (light-articles.css, injected per post AFTER
//   this block), and the theme ships `.foco-app button{background:0 0;color:inherit}`
//   which out-specifies a single-class button rule. Every selector here is
//   `.foco-timer-wrap .foco-timer-*` (0,2,0+) so the widget survives both.
//
// Output is a SINGLE line - wpautop() injects <br/> into multiline <style>.

function css() {
  return `
.foco-timer-wrap{margin:36px 0;display:flex;justify-content:center}
.foco-timer-wrap .foco-timer-card{position:relative;box-sizing:border-box;width:100%;max-width:520px;padding:28px 28px 24px;border-radius:26px !important;background:radial-gradient(130% 120% at 50% -10%,#2A1350 0%,#180C2C 52%,#0C0716 100%) !important;border:1px solid rgba(167,139,250,.24) !important;box-shadow:0 34px 64px -32px rgba(45,18,87,.75),inset 0 1px 0 rgba(255,255,255,.06) !important;text-align:center;font-family:inherit;color:#EDE7FA !important}
.foco-timer-wrap .foco-timer-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}
.foco-timer-wrap .foco-timer-eyebrow{font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:#A78BFA !important}
.foco-timer-wrap .foco-timer-preset{font-size:12px;font-weight:700;letter-spacing:.3px;color:#EDE7FA !important;background:rgba(167,139,250,.14);border:1px solid rgba(167,139,250,.28);border-radius:999px;padding:5px 12px;transition:color .25s ease,border-color .25s ease,background .25s ease}
.foco-timer-wrap .foco-timer-display{position:relative;width:252px;height:252px;margin:0 auto 22px}
.foco-timer-wrap .foco-timer-ring{display:block;width:100%;height:100%;transform:rotate(-90deg)}
.foco-timer-wrap .foco-timer-track{fill:none;stroke:rgba(167,139,250,.16);stroke-width:10}
.foco-timer-wrap .foco-timer-progress{fill:none;stroke:url(#focoTimerGrad);stroke-width:10;stroke-linecap:round;transition:stroke-dashoffset .3s linear;filter:drop-shadow(0 0 10px rgba(124,58,237,.5))}
.foco-timer-wrap .foco-timer-readout{position:absolute;top:0;right:0;bottom:0;left:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;pointer-events:none}
.foco-timer-wrap .foco-timer-digits{font-size:60px;line-height:1;font-weight:800;letter-spacing:-2.5px;color:#FFFFFF !important;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1}
.foco-timer-wrap .foco-timer-state{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#A99CC4 !important}
.foco-timer-wrap .foco-timer-controls{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-bottom:16px}
.foco-timer-wrap .foco-timer-btn{-webkit-appearance:none;appearance:none;font-family:inherit;font-size:15px;font-weight:700 !important;line-height:1;padding:13px 26px;min-width:106px;border-radius:14px !important;cursor:pointer;transition:transform .12s ease,background .18s ease,box-shadow .18s ease,opacity .18s ease}
.foco-timer-wrap .foco-timer-btn:focus-visible{outline:2px solid #C4B5FD;outline-offset:3px}
.foco-timer-wrap .foco-timer-btn-primary{background:linear-gradient(135deg,#7C3AED,#5B21B6) !important;color:#FFFFFF !important;border:1px solid rgba(255,255,255,.14) !important;box-shadow:0 12px 26px -12px rgba(124,58,237,.95) !important}
.foco-timer-wrap .foco-timer-btn-primary:hover:not(:disabled){background:linear-gradient(135deg,#8A4DF5,#6D28D9) !important;transform:translateY(-1px)}
.foco-timer-wrap .foco-timer-btn-ghost{background:rgba(255,255,255,.06) !important;color:#EDE7FA !important;border:1px solid rgba(167,139,250,.3) !important;box-shadow:none !important}
.foco-timer-wrap .foco-timer-btn-ghost:hover:not(:disabled){background:rgba(255,255,255,.13) !important}
.foco-timer-wrap .foco-timer-btn:disabled{opacity:.35;cursor:not-allowed;transform:none;box-shadow:none !important}
.foco-timer-wrap .foco-timer-sound{display:inline-flex;align-items:center;justify-content:center;gap:9px;font-size:13px;color:#A99CC4 !important;cursor:pointer;-webkit-user-select:none;user-select:none}
.foco-timer-wrap .foco-timer-sound input{accent-color:#8B5CF6;width:16px;height:16px;margin:0;cursor:pointer}
.foco-timer-wrap .foco-timer-card.is-finished{border-color:rgba(251,146,60,.45) !important;box-shadow:0 34px 64px -32px rgba(120,53,15,.8),inset 0 0 0 1px rgba(251,146,60,.16) !important}
.foco-timer-wrap .is-finished .foco-timer-progress{stroke:#FB923C !important;filter:drop-shadow(0 0 12px rgba(251,146,60,.55))}
.foco-timer-wrap .is-finished .foco-timer-digits{color:#FFD9B0 !important}
.foco-timer-wrap .is-finished .foco-timer-state{color:#FB923C !important}
.foco-timer-wrap .is-finished .foco-timer-preset{color:#FB923C !important;background:rgba(251,146,60,.14);border-color:rgba(251,146,60,.4)}
@media (max-width:520px){.foco-timer-wrap{margin:28px 0}.foco-timer-wrap .foco-timer-card{padding:22px 16px 20px;border-radius:22px}.foco-timer-wrap .foco-timer-display{width:212px;height:212px;margin-bottom:20px}.foco-timer-wrap .foco-timer-digits{font-size:50px;letter-spacing:-2px}.foco-timer-wrap .foco-timer-btn{flex:1 1 30%;min-width:0;padding:13px 10px;font-size:14px}}
@media (prefers-reduced-motion:reduce){.foco-timer-wrap .foco-timer-progress,.foco-timer-wrap .foco-timer-btn,.foco-timer-wrap .foco-timer-preset{transition:none}}
`;
}

function js() {
  return `
(function(){
var wrap=document.querySelector('.foco-timer-wrap');if(!wrap)return;
var card=wrap.querySelector('.foco-timer-card');if(!card)return;
var DUR=parseInt(card.getAttribute('data-foco-duration'),10);if(!DUR||DUR<1)return;
var digits=card.querySelector('[data-foco-digits]');
var state=card.querySelector('[data-foco-state]');
var progress=card.querySelector('[data-foco-progress]');
var soundEl=card.querySelector('[data-foco-sound]');
var startBtn=card.querySelector('[data-foco-action="start"]');
var pauseBtn=card.querySelector('[data-foco-action="pause"]');
var resetBtn=card.querySelector('[data-foco-action="reset"]');
var R=106;try{R=progress.r.baseVal.value}catch(err){R=106}
var DASH=2*Math.PI*R;
progress.style.strokeDasharray=DASH.toFixed(2);
var remaining=DUR,running=false,endAt=null,iv=null,ac=null;
var baseTitle=document.title;
function fmt(s){var m=Math.floor(s/60),ss=Math.floor(s%60);return (m<10?'0':'')+m+':'+(ss<10?'0':'')+ss}
function render(){var left=Math.max(0,remaining);var t=fmt(left);digits.textContent=t;var done=card.classList.contains('is-finished');progress.style.strokeDashoffset=done?'0':(DASH*(1-left/DUR)).toFixed(2);document.title=running?(t+' - Focus'):baseTitle}
function wake(){if(!ac)return;if(!ac.resume)return;if(ac.state!=='suspended')return;try{ac.resume()}catch(e){}}
function primeAudio(){if(ac)return;try{var AC=window.AudioContext||window.webkitAudioContext;if(AC)ac=new AC()}catch(e){ac=null}wake()}
function chime(){if(!soundEl)return;if(!soundEl.checked)return;if(!ac)return;try{wake();[660,880,990].forEach(function(f,i){var o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(ac.destination);var t=ac.currentTime+i*0.18;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.2,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+0.45);o.start(t);o.stop(t+0.55)})}catch(e){}}
function vibrate(){if(navigator.vibrate){try{navigator.vibrate([200,100,200])}catch(e){}}}
function tick(){if(!running)return;remaining=(endAt-Date.now())/1000;if(remaining<=0){finish();return}render()}
function start(){if(running)return;primeAudio();running=true;endAt=Date.now()+remaining*1000;card.classList.remove('is-finished');state.textContent='Running';startBtn.disabled=true;pauseBtn.disabled=false;clearInterval(iv);iv=setInterval(tick,250);render()}
function pause(){if(!running)return;running=false;clearInterval(iv);remaining=Math.max(0,(endAt-Date.now())/1000);state.textContent='Paused';startBtn.disabled=false;startBtn.textContent='Resume';pauseBtn.disabled=true;render()}
function reset(){running=false;clearInterval(iv);remaining=DUR;state.textContent='Ready';startBtn.disabled=false;startBtn.textContent='Start';pauseBtn.disabled=true;card.classList.remove('is-finished');render()}
function finish(){running=false;clearInterval(iv);remaining=0;state.textContent='Time is up';startBtn.disabled=false;startBtn.textContent='Start again';pauseBtn.disabled=true;card.classList.add('is-finished');render();chime();vibrate()}
startBtn.addEventListener('click',start);
pauseBtn.addEventListener('click',pause);
resetBtn.addEventListener('click',reset);
document.addEventListener('visibilitychange',function(){if(running)tick()});
window.addEventListener('beforeunload',function(){document.title=baseTitle});
reset();
})();
`;
}

// wpautop() turns newlines inside <style>/<script> into <br/>, so flatten.
function oneLine(s) {
  return s.replace(/\s*\n\s*/g, '').trim();
}

function buildTimer(minutes) {
  const dur = minutes * 60;
  const label = `${minutes}-minute focus timer for ADHD`;
  const initial = (minutes < 10 ? '0' : '') + minutes + ':00';

  const markup =
    // `foco-dark` is the light-articles.css opt-out hook: it stops the
    // element-level ink rules (`article strong{color:#160F22!important}` etc.)
    // from painting near-black text onto this near-black card.
    `<div class="foco-timer-wrap foco-dark" role="region" aria-label="${label}">` +
      `<div class="foco-timer-card" data-foco-duration="${dur}">` +
        `<div class="foco-timer-head">` +
          `<span class="foco-timer-eyebrow">Focus timer</span>` +
          `<span class="foco-timer-preset">${minutes} min</span>` +
        `</div>` +
        `<div class="foco-timer-display">` +
          `<svg class="foco-timer-ring" viewBox="0 0 240 240" aria-hidden="true" focusable="false">` +
            `<defs><linearGradient id="focoTimerGrad" x1="0" y1="0" x2="1" y2="1">` +
              `<stop offset="0%" stop-color="#A78BFA"></stop>` +
              `<stop offset="100%" stop-color="#7C3AED"></stop>` +
            `</linearGradient></defs>` +
            `<circle class="foco-timer-track" cx="120" cy="120" r="106"></circle>` +
            `<circle class="foco-timer-progress" cx="120" cy="120" r="106" data-foco-progress></circle>` +
          `</svg>` +
          `<div class="foco-timer-readout">` +
            `<div class="foco-timer-digits" data-foco-digits role="timer" aria-live="off">${initial}</div>` +
            `<div class="foco-timer-state" data-foco-state aria-live="polite">Ready</div>` +
          `</div>` +
        `</div>` +
        `<div class="foco-timer-controls">` +
          `<button type="button" class="foco-timer-btn foco-timer-btn-primary" data-foco-action="start">Start</button>` +
          `<button type="button" class="foco-timer-btn foco-timer-btn-ghost" data-foco-action="pause" disabled>Pause</button>` +
          `<button type="button" class="foco-timer-btn foco-timer-btn-ghost" data-foco-action="reset">Reset</button>` +
        `</div>` +
        `<label class="foco-timer-sound"><input type="checkbox" data-foco-sound checked><span>Play a chime when time is up</span></label>` +
      `</div>` +
    `</div>`;

  const script = oneLine(js());
  const style = oneLine(css());

  // WordPress rewrites a bare `&` inside post content to `&#038;`, which turns
  // `a&&b` into a syntax error once the page renders. Keep the script ampersand
  // free (use early returns / try-catch instead of `&&`) and fail loud if not.
  if (/&/.test(script) || /&/.test(style)) {
    throw new Error('timer-widget: bare "&" in style/script - WP will encode it and break the widget');
  }

  return '<!-- wp:html -->' + markup +
    '<style>' + style + '</style>' +
    '<script>' + script + '</script>' +
    '<!-- /wp:html -->';
}

module.exports = { buildTimer };
