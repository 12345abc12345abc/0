// ═══════════════════════════════════════════════════════
// 타이틀 파티클
// ═══════════════════════════════════════════════════════
(function(){
  const cv=document.getElementById('title-canvas');
  if(!cv)return;
  const W=480,H=900;cv.width=W;cv.height=H;
  const cx=cv.getContext('2d');
  const PTS=[];
  for(let i=0;i<55;i++)PTS.push({
    x:Math.random()*W,y:Math.random()*H,
    vx:(Math.random()-.5)*.3,vy:-Math.random()*.5-.1,
    r:Math.random()*1.8+.4,
    a:Math.random(),life:Math.random(),
    col:Math.random()<.6?'#FF4500':'#ffffff'
  });
  function tick(){
    cx.clearRect(0,0,W,H);
    for(const p of PTS){
      p.x+=p.vx;p.y+=p.vy;p.life-=.004;
      if(p.life<=0||p.y<-10){
        p.x=Math.random()*W;p.y=H+5;p.life=.6+Math.random()*.4;
      }
      cx.globalAlpha=p.life*.55;
      cx.fillStyle=p.col;
      cx.beginPath();cx.arc(p.x,p.y,p.r,0,Math.PI*2);cx.fill();
    }
    cx.globalAlpha=1;
    if(document.getElementById('sovly').style.display!=='none')
      requestAnimationFrame(tick);
  }
  tick();
})();

// ═══════════════════════════════════════════════════════
// 🔊 효과음 엔진 (Web Audio API — 파일 없음)
// ═══════════════════════════════════════════════════════
const SFX={
  _ctx:null,_on:true,_master:null,_shootCd:{},_hitCd:{},
  _init(){
    if(this._ctx)return;
    this._ctx=new(window.AudioContext||window.webkitAudioContext)();
    this._master=this._ctx.createGain();
    this._master.gain.value=.38;
    this._master.connect(this._ctx.destination);
  },
  _resume(){if(this._ctx?.state==='suspended')this._ctx.resume();},

  // 기본 빌딩 블록
  _osc(type,freq,dur,gain=.5,detune=0){
    this._init();this._resume();
    const ctx=this._ctx,now=ctx.currentTime;
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type;o.frequency.value=freq;o.detune.value=detune;
    g.gain.setValueAtTime(gain,now);
    g.gain.exponentialRampToValueAtTime(.0001,now+dur);
    o.connect(g);g.connect(this._master);
    o.start(now);o.stop(now+dur);
  },
  _noise(dur,gain=.3,bandFreq=0){
    this._init();this._resume();
    const ctx=this._ctx,now=ctx.currentTime;
    const buf=ctx.createBuffer(1,ctx.sampleRate*dur,ctx.sampleRate);
    const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const src=ctx.createBufferSource();src.buffer=buf;
    const g=ctx.createGain();g.gain.setValueAtTime(gain,now);g.gain.exponentialRampToValueAtTime(.0001,now+dur);
    if(bandFreq){const f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=bandFreq;f.Q.value=2;src.connect(f);f.connect(g);}
    else src.connect(g);
    g.connect(this._master);src.start(now);
  },

  // ── 유닛 발사음 ──────────────────────────────────
  shoot(type){
    if(!this._on)return;
    const _now=performance.now();
    const _minMs=type==='aoe'||type==='twinhub'?160:type==='chain'?120:90;
    if(_now-(this._shootCd[type]||0)<_minMs)return;
    this._shootCd[type]=_now;
    if(type==='single'||type==='pixelArm'){
      // 픽셀 로봇암: 짧은 기계 클릭
      this._osc('square',320,.06,.18);
      this._osc('sawtooth',180,.08,.10);
    } else if(type==='coreShooter'){
      // 코어 슈터: 둔탁한 포탄음
      this._osc('sawtooth',260,.04,.22);
      this._osc('sine',90,.14,.28);
      this._noise(.08,.12,180);
    } else if(type==='magnetCannon'||type==='slow'){
      // 마그넷 캐논: 전자기 윙~
      this._osc('sine',440,.03,.15);
      this._osc('sine',220,.18,.20);
      this._osc('square',55,.12,.10);
    } else if(type==='plasmaCutter'||type==='pierce'){
      // 플라즈마 커터: 강렬한 레이저 포
      this._osc('sawtooth',600,.02,.25);
      this._osc('sawtooth',300,.12,.22);
      this._osc('sine',80,.2,.28);
      this._noise(.1,.14,400);
    } else if(type==='refinery'){
      // 정제소: 짧은 전격 지직
      this._noise(.04,.28,2400);
      this._osc('sawtooth',880,.02,.14);
      this._osc('square',180,.05,.08);
    } else if(type==='drone'){
      // 레이스 드론: 고주파 윙 + 전자 버즈
      this._osc('sawtooth',1800,.03,.09,300);
      this._osc('sine',600,.06,.11);
      this._noise(.04,.10,4500);
    } else if(type==='aoe'){
      // 레이저 그리드: 강렬한 전기 방전
      this._osc('sawtooth',100,.12,.20);
      this._osc('square',200,.07,.16);
      this._noise(.14,.18,700);
    } else if(type==='twinhub'){
      // 트윈 컨트롤러: 부드러운 에너지 필드 파동
      this._osc('sine',160,.12,.32);
      this._osc('sine',80,.16,.26);
      this._osc('triangle',320,.04,.18);
    } else if(type==='scanner'){
      // 비전 스캐너: 고주파 타겟팅 스캔
      this._osc('sine',1400,.02,.18,700);
      this._osc('sawtooth',480,.06,.22);
      this._noise(.03,.12,3000);
    }
  },

  // ── 원석 처치음 ─────────────────────────────────
  hit(isBig=false){
    if(!this._on)return;
    const _hk=isBig?'b':'s';const _hn=performance.now();
    if(_hn-(this._hitCd[_hk]||0)<70)return;
    this._hitCd[_hk]=_hn;
    if(isBig){
      // 큰 원석: 금속 충격 + 잔향
      this._noise(.06,.28,900);
      this._osc('sine',140,.18,.22);
      this._osc('triangle',280,.08,.14);
    } else {
      // 일반: 작고 또렷한 틱
      this._noise(.04,.18,1200);
      this._osc('sine',200,.06,.12);
    }
  },

  // ── 체인볼트 번개음 ──────────────────────────────
  chain(){
    if(!this._on)return;
    // 지직지직 전기음
    this._noise(.07,.32,2200);
    this._noise(.05,.22,800);
    this._osc('sawtooth',880,.03,.14);
    this._osc('square',110,.1,.10);
  },

  // ── 웨이브 시작음 ────────────────────────────────
  waveStart(){
    if(!this._on)return;
    this._init();this._resume();
    const ctx=this._ctx,now=ctx.currentTime;
    // 킥 드럼 — 주파수 하강 타격음
    const buf=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.18),ctx.sampleRate);
    const bd=buf.getChannelData(0);
    for(let i=0;i<bd.length;i++){const t=i/ctx.sampleRate;bd[i]=Math.sin(2*Math.PI*160*Math.exp(-t*20)*t*6)*Math.exp(-t*9);}
    const ks=ctx.createBufferSource();ks.buffer=buf;
    const kg=ctx.createGain();kg.gain.value=.6;
    ks.connect(kg);kg.connect(this._master);ks.start(now);
    // 상승 신스
    const o1=ctx.createOscillator(),g1=ctx.createGain();
    o1.type='sawtooth';
    o1.frequency.setValueAtTime(60,now+.04);
    o1.frequency.exponentialRampToValueAtTime(720,now+.28);
    g1.gain.setValueAtTime(.28,now+.04);
    g1.gain.exponentialRampToValueAtTime(.0001,now+.42);
    o1.connect(g1);g1.connect(this._master);o1.start(now+.04);o1.stop(now+.45);
    // 금속 노이즈 burst
    this._noise(.05,.25,3800);
    // 경고 비프 ×2
    for(let i=0;i<2;i++){
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type='square';o.frequency.value=330;
      const t=now+.12+i*.17;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+.02);
      g.gain.setValueAtTime(.16,t+.07);g.gain.linearRampToValueAtTime(.0001,t+.12);
      o.connect(g);g.connect(this._master);o.start(t);o.stop(t+.16);
    }
  },

  // ── 클리어음 ─────────────────────────────────────
  clear(){
    if(!this._on)return;
    // 경쾌한 상승 3화음
    const ctx=this._ctx;this._resume();
    const notes=[440,554,659,880];
    notes.forEach((f,i)=>{
      const now=ctx.currentTime+i*.09;
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type='triangle';o.frequency.value=f;
      g.gain.setValueAtTime(.22,now);g.gain.exponentialRampToValueAtTime(.0001,now+.38);
      o.connect(g);g.connect(this._master);o.start(now);o.stop(now+.4);
    });
    this._noise(.06,.1,600);
  },

  // ── 게임오버음 ───────────────────────────────────
  gameOver(){
    if(!this._on)return;this._resume();
    const ctx=this._ctx,now=ctx.currentTime;
    // 내려가는 음 + 저음 폭발
    [440,330,220,110].forEach((f,i)=>{
      const t=now+i*.18;
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type='sawtooth';o.frequency.value=f;
      g.gain.setValueAtTime(.3,t);g.gain.exponentialRampToValueAtTime(.0001,t+.35);
      o.connect(g);g.connect(this._master);o.start(t);o.stop(t+.4);
    });
    this._noise(.5,.22,60);
  },

  // ── 설치음 ───────────────────────────────────────
  place(){
    if(!this._on)return;
    this._osc('sine',440,.04,.15);
    this._osc('sine',660,.07,.12);
    this._noise(.04,.08,800);
  },

  // ── 강화음 ───────────────────────────────────────
  upgrade(){
    if(!this._on)return;this._resume();
    const ctx=this._ctx,now=ctx.currentTime;
    [330,440,550,660].forEach((f,i)=>{
      const t=now+i*.055;
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type='triangle';o.frequency.value=f;
      g.gain.setValueAtTime(.18,t);g.gain.exponentialRampToValueAtTime(.0001,t+.22);
      o.connect(g);g.connect(this._master);o.start(t);o.stop(t+.25);
    });
  },

  // ── 클리어 빅토리음 ──────────────────────────────────
  victory(){
    if(!this._on)return;this._init();this._resume();
    const ctx=this._ctx,now=ctx.currentTime;
    // 웅장한 팡파레
    const melody=[523,659,784,1047,784,1047,1319];
    melody.forEach((f,i)=>{
      const t=now+i*.13;
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type='triangle';o.frequency.value=f;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.28,t+.04);
      g.gain.exponentialRampToValueAtTime(.0001,t+.55);
      o.connect(g);g.connect(this._master);o.start(t);o.stop(t+.6);
    });
    // 베이스 화음
    [261,329,392].forEach((f,i)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type='sine';o.frequency.value=f;
      g.gain.setValueAtTime(.18,now);g.gain.exponentialRampToValueAtTime(.0001,now+1.2);
      o.connect(g);g.connect(this._master);o.start(now);o.stop(now+1.3);
    });
    this._noise(.08,.18,600);
  },

  toggle(){
    this._on=!this._on;
    if(this._master)this._master.gain.value=this._on?.38:0;
    return this._on;
  },
};

// ═══════════════════════════════════════════════════════
const BASE_W=480,BASE_H=900;
const scaler=document.getElementById('scaler');
function applyScale(){
  const sc=Math.min(window.innerWidth/BASE_W,window.innerHeight/BASE_H);
  scaler.style.transform=`scale(${sc})`;
  scaler.style.left=`${(window.innerWidth-BASE_W*sc)/2}px`;
  scaler.style.top=`${(window.innerHeight-BASE_H*sc)/2}px`;
}
applyScale();window.addEventListener('resize',applyScale);

// ═══════════════════════════════════════════════════════
// 데이터
// ═══════════════════════════════════════════════════════
const ORE={
  normal:  {name:'일반 원석',   color:'#78909C',hp:18,  spd:44, reward:15,  dmg:2,  grade:1},
  fast:    {name:'고속 원석',   color:'#FFB300',hp:10,  spd:90, reward:22,  dmg:2,  grade:1},
  multi:   {name:'다중 원석',   color:'#00E5FF',hp:35,  spd:46, reward:40,  dmg:3,  grade:2,special:'split'},
  dense:   {name:'고밀도 원석', color:'#7E57C2',hp:75,  spd:26, reward:55,  dmg:5,  grade:3},
  pure:    {name:'고순도 원석', color:'#FFD54F',hp:28,  spd:44, reward:90,  dmg:4,  grade:2},
  unstable:{name:'불안정 원석', color:'#76FF03',hp:48,  spd:74, reward:70,  dmg:10, grade:2,special:'bigdmg'},
  compres: {name:'압축 원석',   color:'#E040FB',hp:200, spd:20, reward:140, dmg:8,  grade:3},
  core:    {name:'코어 원석',   color:'#B3E5FC',hp:1800,spd:12, reward:500, dmg:20, grade:4,special:'boss'},
};

const TWR_ORDER=['pixelArm','coreShooter','twinHub','scanner','magnetCannon','refinery','laserGrid','chainBolt','drone','plasmaCutter'];
const UNLOCK_ORDER=['coreShooter','twinHub','scanner','magnetCannon','refinery','laserGrid','chainBolt','drone','plasmaCutter'];
const TWR={
  pixelArm:    {name:'픽셀 로봇암',   nameEn:'Pixel Arm',       price:100,   color:'#2196F3',type:'single',   dmg:150,  spd:1.0,  range:2.0, lvM:[1,11.78,22.55,33.33], upgCosts:[19980,29970,49950],  desc:'컨베이어 최선두 원석을 포착해 파쇄 처리한다.', descEn:'Captures and crushes the leading ore on the conveyor line.'},
  coreShooter: {name:'코어 슈터',     nameEn:'Core Shooter',    price:200,   color:'#E91E63',type:'single',   dmg:55,   spd:2.0,  range:3.0, lvM:[1,8.58,16.17,23.75],  upgCosts:[19960,29940,49900],  desc:'단일 원석을 집중 추적해 처리한다. 공정 1초 후 동일한 재공정이 자동 가동된다.', descEn:'Tracks and processes a single ore. One second after each cycle, the same process automatically re-engages.'},
  twinHub:     {name:'트윈 컨트롤러', nameEn:'Twin Controller', price:300,   color:'#9C27B0',type:'twinhub',  dmg:250,  spd:0.5,  range:2.0, lvM:[1,7.33,13.67,20.0],   upgCosts:[19940,29910,49850],  desc:'범위 내 원석 전체를 광역 공정한다. 확률로 원석 이송을 일시 정지시킨다.', descEn:'Processes all ores in range at once. Has a chance to pause ore transport temporarily.'},
  scanner:     {name:'비전 스캐너',   nameEn:'Vision Scanner',  price:500,   color:'#00C853',type:'scan',     dmg:1400, spd:0.25, range:5.0, lvM:[1,5.39,9.78,14.17],   upgCosts:[19900,29850,49750],  desc:'라인 이탈 위험이 가장 높은 원석을 자동 선별해 집중 처리한다.', descEn:'Automatically selects the highest-risk ore and delivers concentrated processing.'},
  magnetCannon:{name:'포인트 버스터', nameEn:'Point Buster',    price:1000,  color:'#FF6D00',type:'focus',    dmg:49,   spd:10.0, range:5.0, lvM:[1,4.05,7.07,10.12],   upgCosts:[19800,29700,49500],  desc:'라인 이탈 직전의 원석에 고속 연속 공정을 집중한다.', descEn:'Concentrates rapid continuous processing on ores at the final stage before line exit.'},
  refinery:    {name:'포트 허브',     nameEn:'Port Hub',        price:1500,  color:'#FFD700',type:'refinery', dmg:520,  spd:1.0,  range:2.0, lvM:[1,3.38,5.76,8.14],    upgCosts:[19700,29550,49250],  desc:'원석 처리 시마다 포트 자원을 추가 수확한다.', descEn:'Harvests additional port resources with every ore processed.'},
  laserGrid:   {name:'레이저 그리드', nameEn:'Laser Grid',      price:2000,  color:'#F44336',type:'aoe',      dmg:900,  spd:1.0,  range:2.0, lvM:[1,2.99,4.98,6.98],    upgCosts:[19600,29400,49000],  desc:'범위 내 원석 전체를 동시에 처리한다. 원석이 밀집할수록 효율이 극대화된다.', descEn:'Processes all ores in range simultaneously. Efficiency peaks when ores are clustered.'},
  chainBolt:   {name:'체인 볼트',     nameEn:'Chain Bolt',      price:3000,  color:'#03A9F4',type:'chain',    dmg:480,  spd:1.0,  range:3.0, lvM:[1,2.33,3.67,5.0],     upgCosts:[19400,29100,48500],  desc:'원석 하나를 공정하면 방전이 인접 원석으로 연쇄 확산된다.', descEn:'Processing one ore discharges a chain reaction that spreads to adjacent ores.'},
  drone:       {name:'레이스 드론',   nameEn:'Race Drone',      price:5000,  color:'#7DDFFF',type:'drone',    dmg:520,  spd:2.0,  range:3.0, lvM:[1,2.19,3.38,4.57],    upgCosts:[19000,28500,47500],  desc:'자율 드론이 순찰 궤도를 비행하며 범위 내 원석을 처리한다.', descEn:'An autonomous drone patrols its orbit, processing ores within its flight range.'},
  plasmaCutter:{name:'플라즈마 커터', nameEn:'Plasma Cutter',   price:10000, color:'#EEEEEE',type:'pierce',   dmg:160,  spd:3.0,  range:5.0, lvM:[1,1.71,2.42,3.13],    upgCosts:[18000,27000,45000],  desc:'플라즈마 절단선이 일렬로 늘어선 원석 여럿을 동시에 관통 처리한다.', descEn:'A plasma cutting beam simultaneously pierces and processes multiple ores lined up in a row.'},
};
// 레벨: 1=기본, 2=1강(은), 3=2강(금), 4=3강(흑) ← 최대
const LVL=[{mult:1},{mult:1.33,cm:.9},{mult:1.67,cm:1.8},{mult:2.0,cm:2.8}];
// 원석 피해 저항 (1.0=기본, 낮을수록 저항)
const ORE_RESIST={
  dense:   {single:.55},       // 고밀도: 단일공격에 강함 → 광역/관통 사용 필요
  core:    {chain:.55,slow:.2},// 보스: 연쇄·감속 저항
  compres: {aoe:.45,chain:.5}, // 압축: 광역·연쇄에 강함 → 관통·집중 레이저 추천
  unstable:{slow:0},            // 불안정: 감속 완전 무효
  fast:    {pierce:.65},       // 고속: 관통 명중률 낮음
};

// ═══════════════════════════════════════════════════════
// 맵
// ═══════════════════════════════════════════════════════
const COLS=14,ROWS2=13,TS=34;
// 캔버스: top=59, bottom=381 → 높이=460px
const CV_W=BASE_W,CV_H=460;
const MAP_W=COLS*TS;       // 476
const MAP_H2=ROWS2*TS;     // 442
const MAP_OX=Math.floor((CV_W-MAP_W)/2); // 2
const MAP_OY=Math.floor((CV_H-MAP_H2)/2); // 9

const GRID=[];
for(let r=0;r<ROWS2;r++)GRID.push(new Array(COLS).fill(0));
const PATH=[];
function mk(r,c){if(r>=0&&r<ROWS2&&c>=0&&c<COLS)GRID[r][c]=1;}
function ap(r,c){if(!PATH.length||(PATH[PATH.length-1].r!==r||PATH[PATH.length-1].c!==c))PATH.push({r,c});}

// S자 경로 — 시작: (0,1), 종료: (12,12) — 양쪽 1칸씩 설치영역 확보
for(let r=0;r<=2;r++){mk(r,1);ap(r,1);}          // 아래로
for(let c=1;c<=12;c++){mk(2,c);ap(2,c);}         // 오른쪽으로
for(let r=2;r<=6;r++){mk(r,12);ap(r,12);}        // 아래로
for(let c=12;c>=1;c--){mk(6,c);ap(6,c);}        // 왼쪽으로
for(let r=6;r<=10;r++){mk(r,1);ap(r,1);}         // 아래로
for(let c=1;c<=12;c++){mk(10,c);ap(10,c);}       // 오른쪽으로
for(let r=10;r<=12;r++){mk(r,12);ap(r,12);}      // 아래로

const ENTRY={r:0,c:1},EXIT={r:12,c:12};

function getDir(r,c){
  const i=PATH.findIndex(p=>p.r===r&&p.c===c);
  if(i<0||i>=PATH.length-1)return null;
  const n=PATH[i+1];
  if(n.c>c)return'R';if(n.c<c)return'L';if(n.r>r)return'D';return'U';
}

// 밸런스
function getPool(w){
  if(w<=5) return['normal'];
  if(w<=9) return['normal','normal','fast'];
  if(w<=14)return['normal','fast','multi'];
  if(w<=20)return['normal','fast','multi','dense'];
  if(w<=28)return['fast','multi','dense','pure'];
  if(w<=38)return['fast','multi','dense','pure','unstable'];
  if(w<=50)return['multi','dense','pure','unstable','compres'];
  if(w<=70)return['dense','pure','unstable','compres'];
  return['unstable','compres','dense'];
}
function hpS(w){
  // W20≈9 → W50≈244 → W70≈1394 → W90≈17994 → W100≈49994
  if(w<=1) return 1.0;
  if(w<=10)return 1.0+(w-1)*0.167;
  if(w<=20)return hpS(10)+(w-10)*0.65;
  if(w<=30)return hpS(20)+(w-20)*2.0;
  if(w<=40)return hpS(30)+(w-30)*6.5;
  if(w<=50)return hpS(40)+(w-40)*15.0;
  if(w<=60)return hpS(50)+(w-50)*45.0;
  if(w<=70)return hpS(60)+(w-60)*70.0;
  if(w<=80)return hpS(70)+(w-70)*360.0;
  if(w<=90)return hpS(80)+(w-80)*1300.0;
  return hpS(90)+(w-90)*3200.0;       // W100≈49994
}
function spdS(w){
  if(w<=10)return 1+Math.min(w-1,9)*0.006;
  if(w<=20)return spdS(10)+(w-10)*0.010;
  if(w<=50)return spdS(20)+(w-20)*0.016;
  if(w<=70)return spdS(50)+(w-50)*0.040;
  if(w<=90)return spdS(70)+(w-70)*0.080;
  return spdS(90)+(w-90)*0.150;        // W100≈5.4x
}
function countS(w){
  if(w<=1) return 12;
  if(w<=3) return Math.floor(12+(w-1)*10);   // W2:22, W3:32
  if(w<=5) return Math.floor(32+(w-3)*12);   // W4:44, W5:56
  if(w<=10)return Math.floor(56+(w-5)*8);    // W6:64→W10:96
  if(w<=20)return Math.floor(96+(w-10)*9);   // W20:186
  if(w<=50)return Math.floor(186+(w-20)*8);  // W50:426
  if(w<=75)return Math.floor(426+(w-50)*11); // W75:701
  return Math.floor(701+(w-75)*17);          // W100≈1126
}

// ═══════════════════════════════════════════════════════
// 게임 상태
// ═══════════════════════════════════════════════════════
const GS={
  port:100,stability:100,wave:0,time:0,totalPort:0,
  portHist:[],towers:[],ores:[],projs:[],
  particles:[],popups:[],effects:[],
  running:false,waveActive:false,oreQ:[],spawnT:0,
  paused:false,speed:1,
  unlocked:new Set(['pixelArm']),
  autoWave:false,autoActive:false,autoTimer:0,
  hovR:null,hovC:null,eggActive:false,echoQ:[],
};
let _uid=0;const uid=()=>++_uid;
function sweepArr(a,fn){let j=0;for(let i=0;i<a.length;i++)if(fn(a[i]))a[j++]=a[i];a.length=j;}

// ═══════════════════════════════════════════════════════
// 렌더러
// ═══════════════════════════════════════════════════════
const R={
  cv:null,ctx:null,mapImg:null,
  init(){
    this.cv=document.getElementById('gc');
    this.cv.width=CV_W;this.cv.height=CV_H;
    this.ctx=this.cv.getContext('2d');
    this._bake();
  },
  tx(c){return MAP_OX+c*TS+TS/2;},
  ty(r){return MAP_OY+r*TS+TS/2;},
  _bake(){
    // ── 정적 배경 (벽 타일 + 외곽) — 한 번만 그림
    const bg=document.createElement('canvas');bg.width=CV_W;bg.height=CV_H;
    const bx=bg.getContext('2d');
    bx.fillStyle='#111';bx.fillRect(0,0,CV_W,CV_H);
    bx.fillStyle='#a8a8a8';bx.beginPath();bx.roundRect(MAP_OX-2,MAP_OY-2,MAP_W+4,MAP_H2+4,6);bx.fill();
    for(let r=0;r<ROWS2;r++)for(let c2=0;c2<COLS;c2++){
      if(GRID[r][c2]===0)this._buildTile(bx,MAP_OX+c2*TS,MAP_OY+r*TS);
    }
    this.bgImg=bg;

    // ── 경로 타일 정보 캐시 (방향만 저장)
    this._pathCells=[];
    for(let r=0;r<ROWS2;r++)for(let c2=0;c2<COLS;c2++){
      if(GRID[r][c2]===1){
        const ie=(r===ENTRY.r&&c2===ENTRY.c),ix=(r===EXIT.r&&c2===EXIT.c);
        this._pathCells.push({r,c2,dir:getDir(r,c2),ie,ix});
      }
    }
    // 경로 정적 레이어를 bgImg에 합성 (타일배경·레일·화살표) — 매 프레임 재드로우 불필요
    const BR=4;
    for(const{r,c2,dir,ie,ix}of this._pathCells){
      const px=MAP_OX+c2*TS,py=MAP_OY+r*TS;
      bx.fillStyle='#181818';bx.fillRect(px+1,py+1,TS-2,TS-2);
      bx.strokeStyle='#272727';bx.lineWidth=.8;bx.strokeRect(px+.5,py+.5,TS-1,TS-1);
      if(ie||ix||!dir)continue;
      const isH=(dir==='R'||dir==='L');
      bx.strokeStyle='#303030';bx.lineWidth=3;
      if(isH){bx.beginPath();bx.moveTo(px,py+BR);bx.lineTo(px+TS,py+BR);bx.stroke();bx.beginPath();bx.moveTo(px,py+TS-BR);bx.lineTo(px+TS,py+TS-BR);bx.stroke();}
      else{bx.beginPath();bx.moveTo(px+BR,py);bx.lineTo(px+BR,py+TS);bx.stroke();bx.beginPath();bx.moveTo(px+TS-BR,py);bx.lineTo(px+TS-BR,py+TS);bx.stroke();}
      const mx=px+TS/2,my=py+TS/2,as=4;
      bx.save();bx.translate(mx,my);
      if(dir==='L')bx.rotate(Math.PI);else if(dir==='D')bx.rotate(Math.PI/2);else if(dir==='U')bx.rotate(-Math.PI/2);
      bx.fillStyle='#ffffff1a';bx.beginPath();bx.moveTo(as,0);bx.lineTo(-as,as*.8);bx.lineTo(-as,-as*.8);bx.closePath();bx.fill();
      bx.restore();
    }
  },
  // 경로 타일을 매 프레임 그림 (컨베이어 벨트 애니메이션)
  _drawPath(ctx,gt){
    const SPD=38; // px/s
    const GAP=TS/3.2;
    const RAIL=4;

    for(const{r,c2,dir,ie,ix}of this._pathCells){
      if(ie||ix||!dir)continue;
      const px=MAP_OX+c2*TS,py=MAP_OY+r*TS;
      ctx.save();
      ctx.beginPath();ctx.rect(px+1,py+1,TS-2,TS-2);ctx.clip();
      const isH=(dir==='R'||dir==='L');
      const fwd=(dir==='R'||dir==='D');
      // 움직이는 줄무늬 — 맵 전체 좌표 기준 offset으로 타일 간 이음새 없애기
      const globalOff=(gt*SPD)%GAP;
      ctx.strokeStyle='#3e3e3e';ctx.lineWidth=1.8;
      if(isH){
        const origin=fwd?MAP_OX+c2*TS:MAP_OX+(c2+1)*TS;
        const startX=fwd?origin-(((origin-MAP_OX)%GAP)-globalOff+GAP)%GAP:origin+(((MAP_OX+MAP_W-origin)%GAP)-globalOff+GAP)%GAP;
        const step=fwd?GAP:-GAP;
        for(let x=startX;fwd?(x<px+TS+GAP):(x>px-GAP);x+=step){ctx.beginPath();ctx.moveTo(x,py+RAIL+1);ctx.lineTo(x,py+TS-RAIL-1);ctx.stroke();}
      }else{
        const origin=fwd?MAP_OY+r*TS:MAP_OY+(r+1)*TS;
        const startY=fwd?origin-(((origin-MAP_OY)%GAP)-globalOff+GAP)%GAP:origin+(((MAP_OY+MAP_H2-origin)%GAP)-globalOff+GAP)%GAP;
        const step=fwd?GAP:-GAP;
        for(let y=startY;fwd?(y<py+TS+GAP):(y>py-GAP);y+=step){ctx.beginPath();ctx.moveTo(px+RAIL+1,y);ctx.lineTo(px+TS-RAIL-1,y);ctx.stroke();}
      }
      ctx.restore();
    }

    // 포털 (애니메이션 글로우)
    this._drawPortalAnim(ctx,MAP_OX+ENTRY.c*TS,MAP_OY+ENTRY.r*TS,'#FF4500',gt);
    this._drawPortalAnim(ctx,MAP_OX+EXIT.c*TS,MAP_OY+EXIT.r*TS,'#00E5FF',gt);
  },
  _drawPortalAnim(ctx,px,py,color,gt){
    const pulse=.55+Math.sin(gt*3)*.2;
    const g=ctx.createRadialGradient(px+TS/2,py+TS/2,1,px+TS/2,py+TS/2,TS*.52);
    g.addColorStop(0,color+'66');g.addColorStop(1,'transparent');
    ctx.fillStyle=g;ctx.fillRect(px,py,TS,TS);
    ctx.strokeStyle=color;ctx.lineWidth=2+pulse;
    ctx.globalAlpha=.6+pulse*.5;
    ctx.beginPath();ctx.roundRect(px+2,py+2,TS-4,TS-4,3);ctx.stroke();
    ctx.globalAlpha=1;
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(px+TS/2,py+TS/2,3.5+pulse,0,Math.PI*2);ctx.fill();
  },
  _buildTile(cx,px,py){
    cx.fillStyle='#b0b0b0';cx.fillRect(px+1,py+1,TS-2,TS-2);
    cx.strokeStyle='#999';cx.lineWidth=1;
    const m=4,l=5;
    cx.beginPath();cx.moveTo(px+m,py+m+l);cx.lineTo(px+m,py+m);cx.lineTo(px+m+l,py+m);
    cx.moveTo(px+TS-m-l,py+TS-m);cx.lineTo(px+TS-m,py+TS-m);cx.lineTo(px+TS-m,py+TS-m-l);cx.stroke();
  },
  drawRange(ctx,cx,cy,range,col){
    const rp=range*TS;
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,rp,0,Math.PI*2);
    const g=ctx.createRadialGradient(cx,cy,rp*.4,cx,cy,rp);
    g.addColorStop(0,'transparent');g.addColorStop(1,col+'18');
    ctx.fillStyle=g;ctx.fill();
    ctx.strokeStyle=col+'55';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
  },
  render(gt){
    const ctx=this.ctx;ctx.clearRect(0,0,CV_W,CV_H);
    // 1. 정적 배경 (벽 타일)
    if(this.bgImg)ctx.drawImage(this.bgImg,0,0);
    // 2. 애니메이션 경로 (컨베이어 벨트)
    this._drawPath(ctx,gt);
    // 3. 호버/선택 오버레이
    const _hR=UI._pendAction!=null&&UI._pendRow!=null?UI._pendRow:GS.hovR;
    const _hC=UI._pendAction!=null&&UI._pendCol!=null?UI._pendCol:GS.hovC;
    if(_hR!==null&&UI.selCard!==null){
      const r=_hR,c2=_hC;
      if(r>=0&&r<ROWS2&&c2>=0&&c2<COLS){
        const ok=GRID[r][c2]===0&&!towerAt(r,c2);
        const px=MAP_OX+c2*TS,py=MAP_OY+r*TS;
        const isPend=UI._pendAction!=null&&UI._pendRow!=null;
        ctx.fillStyle=ok?`rgba(255,255,255,${isPend?.18:.08})`:'rgba(239,83,80,.12)';ctx.fillRect(px,py,TS,TS);
        ctx.strokeStyle=ok?'#ffffff':'#EF5350';ctx.lineWidth=isPend?2.5:1.5;ctx.strokeRect(px+1,py+1,TS-2,TS-2);
        if(ok&&TWR[UI.selCard]){
          const _d=TWR[UI.selCard];
          this.drawRange(ctx,this.tx(c2),this.ty(r),_d.range,_d.color);
          // 흑백 유닛 미리보기
          const id=UI.selCard;
          if(!this._pvDummy||this._pvDummyId!==id){
            const dw=new Tower(id,0,0);
            dw._animT=0;dw._firingT=0;dw._tDmg=0;dw._tSpd=0;dw._armAngle=-Math.PI/2;
            this._pvDummy=dw;this._pvDummyId=id;
          }
          const dw=this._pvDummy,rr=TS*.44;
          ctx.save();
          ctx.filter='grayscale(1) brightness(0.7)';
          ctx.globalAlpha=isPend?.80:.50;
          ctx.translate(this.tx(c2),this.ty(r));
          if(id==='coreShooter')dw._dCS(ctx,rr,0,false);
          else if(id==='pixelArm')dw._dPA(ctx,rr,0,false);
          else switch(_d.type){
            case'aoe':dw._dAOE(ctx,rr,0,false);break;case'focus':case'slow':dw._dSlow(ctx,rr,0,false);break;
            case'pierce':dw._dPierce(ctx,rr,0,false);break;case'chain':dw._dChain(ctx,rr,0,false);break;
            case'pulseslow':dw._dSlowField(ctx,rr,0);break;case'scan':dw._dScan(ctx,rr,0);break;
            case'refinery':dw._dRefinery(ctx,rr,0);break;case'twinhub':dw._dTwinHub(ctx,rr,0);break;
            case'drone':dw._dDrone(ctx,rr,0);break;
          }
          ctx.restore();
        }
      }
    }
    if(UI.selTwr){this.drawRange(ctx,UI.selTwr.cx,UI.selTwr.cy,UI.selTwr.getRange(),UI.selTwr.color);}
    // 4. 게임 오브젝트 — 레이어 순서: 타워기본 → 광물 → 발사체 → 타워오버레이(빔/궤도) → 이펙트 → 파티클 → 팝업
    for(const t of GS.towers)t.draw(ctx,gt);
    for(const o of GS.ores)o.draw(ctx,gt);
    for(const p of GS.projs)p.draw(ctx);
    for(const e of GS.effects)e.draw(ctx,gt);
    for(const t of GS.towers)t.drawFX(ctx);
    // drone aircraft on absolute top layer (physically airborne)
    for(const t of GS.towers)if(t.type==='drone')t._drawDroneOrbit(ctx);
    for(const p of GS.particles)p.draw(ctx);
    for(const p of GS.popups)p.draw(ctx);
  }
};

// ═══════════════════════════════════════════════════════
// Ore
// ═══════════════════════════════════════════════════════
class Ore{
  constructor(type,wave){
    this.id=uid();this.type=type;this.wave=wave;
    const d=ORE[type];
    this.maxHp=d.hp*hpS(wave);this.hp=this.maxHp;
    this.baseSpd=d.spd*spdS(wave);this.spd=this.baseSpd;
    this.reward=d.reward;this.escapeDmg=d.dmg;
    this.color=d.color;this.name=d.name;this.special=d.special||null;this.grade=d.grade;
    this.pathIdx=0;this.progress=0;
    this.x=R.tx(PATH[0].c);this.y=R.ty(PATH[0].r);
    this.alive=true;this.escaped=false;
    this.slowTimer=0;this._sR=0;this.ampRatio=0;this.ampTimer=0;
    this.shockTimer=0;this.shockDps=0;this.freezeTimer=0;this.freezeImmune=0;
    this._twinFreezeT=0;this._twinImmuneT=0;this._lastDmgType=null;
    this.flashT=0;this.spin=Math.random()*Math.PI*2;
    const sz=[0,TS*.21,TS*.26,TS*.32,TS*.40];this.radius=sz[this.grade]||TS*.21;
  }
  update(dt){
    if(!this.alive)return;
    if(this.freezeTimer>0){this.freezeTimer-=dt;if(this.freezeTimer<=0)this.freezeImmune=1.0;this.flashT=.08;return;}
    if(this.freezeImmune>0)this.freezeImmune-=dt;
    if(this.slowTimer>0){this.slowTimer-=dt;if(this.slowTimer<=0){this.spd=this.baseSpd;this._sR=0;this.freezeImmune=3.0;}}
    if(this._twinFreezeT>0){this._twinFreezeT-=dt;if(this._twinFreezeT<=0)this._twinImmuneT=1.0;this.flashT=.06;}
    if(this._twinImmuneT>0)this._twinImmuneT-=dt;
    if(this.ampTimer>0)this.ampTimer-=dt;if(this.flashT>0)this.flashT-=dt;
    if(this.shockTimer>0){
      this.shockTimer-=dt;
      let sd=this.shockDps*dt;if(this.ampTimer>0)sd*=(1+this.ampRatio);
      this.hp-=sd;this.flashT=.04;
      if(this.hp<=0&&this.alive){this.alive=false;this._die();}
      if(this.shockTimer<=0)this.shockDps=0;
    }
    let mv=this._twinFreezeT>0?0:this.spd*dt;
    while(mv>0&&this.pathIdx<PATH.length-1){
      const fr=PATH[this.pathIdx],to=PATH[this.pathIdx+1];
      const fx=R.tx(fr.c),fy=R.ty(fr.r),tx2=R.tx(to.c),ty2=R.ty(to.r);
      const seg=Math.hypot(tx2-fx,ty2-fy),rem=seg*(1-this.progress);
      if(mv>=rem){mv-=rem;this.pathIdx++;this.progress=0;this.x=tx2;this.y=ty2;}
      else{this.progress+=mv/seg;this.x=fx+(tx2-fx)*this.progress;this.y=fy+(ty2-fy)*this.progress;mv=0;}
    }
    if(this.pathIdx>=PATH.length-1){this.escaped=true;this.alive=false;}
  }
  takeDmg(dmg,dmgType='normal'){
    if(!this.alive)return;
    let d=dmg;
    const res=ORE_RESIST[this.type];
    if(res&&res[dmgType]!==undefined)d*=res[dmgType];
    if(this.ampTimer>0)d*=(1+this.ampRatio);
    this._lastDmgType=dmgType;
    this.hp-=d;this.flashT=.1;if(this.hp<=0){this.alive=false;this._die();}
  }
  _die(){
    SFX.hit(this.grade>=3);
    if(this.special==='split'){for(let i=0;i<3;i++){const o=new Ore('normal',this.wave);o.pathIdx=this.pathIdx;o.progress=this.progress;o.x=this.x;o.y=this.y;GS.ores.push(o);}}
    for(let i=0;i<12;i++)GS.particles.push(new Particle(this.x,this.y,this.color,i,12));
    const pr=this.reward;
    GS.port+=pr;GS.totalPort+=pr;GS.portHist.push({t:GS.time,v:pr});
    GS.popups.push(new Popup(this.x,this.y-this.radius-5,'+'+pr,'#FFD700'));UI.updHUD();
  }
  applySlow(ratio,dur){if(this.freezeImmune>0)return;const res=ORE_RESIST[this.type];const eff=res&&res.slow!==undefined?ratio*res.slow:ratio;this._sR=Math.max(this._sR,eff);this.spd=this.baseSpd*(1-this._sR);if(this.slowTimer<dur)this.slowTimer=dur;}
  applyFreeze(dur){if(this.freezeImmune>0)return;if(this.freezeTimer<dur)this.freezeTimer=dur;}
  applyAmp(ratio,dur){this.ampRatio=Math.max(this.ampRatio,ratio);if(this.ampTimer<dur)this.ampTimer=dur;}
  applyShock(dps,dur){this.shockDps=Math.max(this.shockDps,dps);if(this.shockTimer<dur)this.shockTimer=dur;}
  draw(ctx,gt){
    if(!this.alive)return;
    const r=this.radius,spRate=[0,.85,.62,.44,.28][this.grade]||.7,sp=this.spin+gt*spRate;
    ctx.save();ctx.translate(this.x,this.y);
    if(this.special==='boss'){ctx.shadowColor=this.color;ctx.shadowBlur=22+Math.sin(gt*2)*6;}
    if(this.flashT>0){ctx.shadowColor='#fff';ctx.shadowBlur=24;}
    ctx.save();ctx.rotate(sp);
    const c=this.color;
    // hexagonal mineral crystal — 6-facet prism with directional lighting
    const N6=6,vs=[];
    for(let i=0;i<N6;i++){const a=(i/N6)*Math.PI*2-Math.PI/2;const ir=[1.0,.96,1.0,.95,1.0,.97][i];vs.push([Math.cos(a)*r*ir,Math.sin(a)*r*ir]);}
    // outer glow ring (grade-based)
    if(this.grade>=2){ctx.shadowColor=c;ctx.shadowBlur=this.grade>=4?14:7;ctx.strokeStyle=c+(this.grade>=4?'66':'40');ctx.lineWidth=this.grade>=4?2.2:1.4;ctx.beginPath();vs.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));ctx.closePath();ctx.stroke();ctx.shadowBlur=0;}
    // base body gradient
    ctx.beginPath();vs.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));ctx.closePath();
    const g=ctx.createRadialGradient(-r*.16,-r*.22,r*.04,0,0,r);
    g.addColorStop(0,'#fff');g.addColorStop(.13,c);g.addColorStop(.54,c+'cc');g.addColorStop(1,c+'30');
    ctx.fillStyle=g;ctx.fill();
    // per-facet directional lighting (upper-left light source)
    const ft=['rgba(255,255,255,.22)','rgba(0,0,0,.07)','rgba(0,0,0,.18)','rgba(0,0,0,.26)','rgba(0,0,0,.12)','rgba(255,255,255,.30)'];
    for(let i=0;i<N6;i++){const[x1,y1]=vs[i],[x2,y2]=vs[(i+1)%N6];ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(x1,y1);ctx.lineTo(x2,y2);ctx.closePath();ctx.fillStyle=ft[i];ctx.fill();}
    // crystal edge
    ctx.beginPath();vs.forEach(([x,y],i)=>i===0?ctx.moveTo(x,y):ctx.lineTo(x,y));ctx.closePath();
    ctx.strokeStyle=c;ctx.lineWidth=this.grade>=3?2.0:1.4;ctx.stroke();
    // bright lit-edge highlight (upper-left edges, simulates surface plane angle)
    ctx.strokeStyle='rgba(255,255,255,.50)';ctx.lineWidth=1.4;
    ctx.beginPath();ctx.moveTo(vs[5][0],vs[5][1]);ctx.lineTo(vs[0][0],vs[0][1]);ctx.lineTo(vs[1][0],vs[1][1]);ctx.stroke();
    // facet division spokes
    for(let i=0;i<N6;i++){const[x,y]=vs[i];ctx.strokeStyle=c+'28';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(x,y);ctx.stroke();}
    // inner hexagonal table (depth indicator — gemstone "girdle")
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2-Math.PI/2;i===0?ctx.moveTo(Math.cos(a)*r*.42,Math.sin(a)*r*.42):ctx.lineTo(Math.cos(a)*r*.42,Math.sin(a)*r*.42);}
    ctx.closePath();
    const hi=ctx.createRadialGradient(-r*.11,-r*.16,0,0,0,r*.46);
    hi.addColorStop(0,'rgba(255,255,255,.60)');hi.addColorStop(.48,'rgba(255,255,255,.12)');hi.addColorStop(1,'transparent');
    ctx.fillStyle=hi;ctx.fill();ctx.strokeStyle=c+'38';ctx.lineWidth=.75;ctx.stroke();
    // culet inner glow (deep core light)
    const cg=ctx.createRadialGradient(0,0,0,0,0,r*.26);
    cg.addColorStop(0,'rgba(255,255,255,.58)');cg.addColorStop(.42,c+'77');cg.addColorStop(1,'transparent');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,r*.26,0,Math.PI*2);ctx.fill();
    // specular bright spot (sharp surface reflection)
    const sg=ctx.createRadialGradient(-r*.22,-r*.3,0,-r*.22,-r*.3,r*.28);
    sg.addColorStop(0,'rgba(255,255,255,.86)');sg.addColorStop(.36,'rgba(255,255,255,.16)');sg.addColorStop(1,'transparent');
    ctx.fillStyle=sg;ctx.beginPath();ctx.arc(-r*.22,-r*.3,r*.28,0,Math.PI*2);ctx.fill();
    ctx.restore();
    // boss extras: orbit ring + inner glow cross
    if(this.special==='boss'){
      ctx.strokeStyle=c+'66';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.arc(0,0,r*1.38,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      ctx.save();ctx.rotate(-sp*.4);
      ctx.strokeStyle=c+'33';ctx.lineWidth=1;
      for(let i=0;i<4;i++){
        const a=i*Math.PI/2;
        ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.55,Math.sin(a)*r*.55);ctx.lineTo(Math.cos(a+Math.PI/2)*r*.55,Math.sin(a+Math.PI/2)*r*.55);ctx.stroke();
      }
      ctx.restore();
    }
    if(this._twinFreezeT>0){ctx.globalAlpha=.65;ctx.strokeStyle='#CE93D8';ctx.lineWidth=2.2;ctx.shadowColor='#9C27B0';ctx.shadowBlur=10;ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(0,0,r*1.22,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
    ctx.shadowBlur=0;ctx.restore();
    const bw=r*2.4,bh=3.5,bx=this.x-bw/2,by=this.y-r-7;
    ctx.fillStyle='#05101a';ctx.beginPath();ctx.roundRect(bx-1,by-1,bw+2,bh+2,2);ctx.fill();
    const hp=Math.max(0,this.hp/this.maxHp);ctx.fillStyle=hp>.6?'#6fcf7f':hp>.3?'#FFA726':'#EF5350';ctx.beginPath();ctx.roundRect(bx,by,bw*hp,bh,1);ctx.fill();
  }
}

// ═══════════════════════════════════════════════════════
// Tower
// ═══════════════════════════════════════════════════════
class Tower{
  constructor(id,row,col){
    this.uid=uid();this.tId=id;this.row=row;this.col=col;
    const d=TWR[id];this.name=d.name;this.color=d.color;this.type=d.type;
    this.basePrice=d.price;this.level=1;this.upgCost=0;
    this.cx=R.tx(col);this.cy=R.ty(row);
    this.angle=-Math.PI/2;this.cooldown=0;this._aoeT=0;this._animT=0;this._firingT=0;
    this._tDmg=0;this._tSpd=0;this._armAngle=-Math.PI/2;this._focusTgt=null;this._soundT=0;this._droneAngle=0;this._hitCooldown=0;
    this.isMega=false;this.megaCells=[];
  }
  _lm(){const m=TWR[this.tId]?.lvM;return m?m[this.level-1]:LVL[this.level-1].mult;}
  _megaMult(){return this.isMega?5:1;}
  _eff(e){e.z=this.basePrice*(this.isMega?4:1);const z=e.z,arr=GS.effects;let i=arr.length;while(i>0&&(arr[i-1].z||0)>z)i--;arr.splice(i,0,e);return e;}
  _calcTwin(){this._tDmg=0;this._tSpd=0;}
  getDmg(){return TWR[this.tId].dmg*(1+this._tDmg)*this._lm()*this._megaMult();}
  getSpd(){return TWR[this.tId].spd*(1+this._tSpd)*LVL[this.level-1].mult;}
  getRange(){return TWR[this.tId].range+(this.isMega?1:0);}
  update(dt,ores){
    this._animT+=dt;this._calcTwin();if(this._firingT>0)this._firingT-=dt;
    const tp=this.type;
    if(tp==='pulseslow'){
      const rng=this.getRange()*TS;const rng2=rng*rng;const rngH=rng+8,rngH2=rngH*rngH;const cx0=this.cx,cy0=this.cy;
      const hasOre=ores.some(o=>{if(!o.alive)return false;const _x=o.x-cx0,_y=o.y-cy0;return _x*_x+_y*_y<=rngH2;});
      if(hasOre){
        this._pulseT=(this._pulseT||0)+dt;
        const iv=2.2/Math.max(.5,this._lm());
        if(this._pulseT>=iv){
          this._pulseT=0;
          const sr=Math.min(.45*this._lm()*this._megaMult(),.92);
          for(const o of ores){if(!o.alive)continue;const _x=o.x-cx0,_y=o.y-cy0;if(_x*_x+_y*_y>rngH2)continue;if(Math.random()<.55)o.applySlow(sr,2.2);}
          this._eff(new RingEff(this.cx,this.cy,rng,this.color));
        }
      }
      return;
    }
    if(tp==='scan'){if(this.cooldown>0){this.cooldown-=dt*this.getSpd();return;}const rng=this.getRange()*TS;const rng2=rng*rng;const rngH=rng+8,rngH2=rngH*rngH;const cx0=this.cx,cy0=this.cy;let best=null,bestHp=-1;for(const o of ores){if(!o.alive)continue;const _x=o.x-cx0,_y=o.y-cy0;if(_x*_x+_y*_y>rngH2)continue;if(o.hp>bestHp){bestHp=o.hp;best=o;}}if(!best)return;this.angle=Math.atan2(best.y-this.cy,best.x-this.cx);best.takeDmg(this.getDmg(),'scan');this._eff(new ExplodeEff(best.x,best.y,this.color));for(let i=0;i<8;i++)GS.particles.push(new Particle(best.x,best.y,this.color,i,8));this.cooldown=1;this._firingT=.45;SFX.shoot('aoe');return;}
    if(tp==='twinhub'){
      this._aoeT+=dt;const iv=1/Math.max(.1,this.getSpd());
      if(this._aoeT>=iv){
        this._aoeT=0;
        const rng=this.getRange()*TS,rng2=rng*rng,rngH=rng+8,rngH2=rngH*rngH,cx0=this.cx,cy0=this.cy;
        const freezeChances=[0.05,0.10,0.15,0.20];
        const chance=this.isMega?1.0:freezeChances[this.level-1]||0.05;
        let hit=false;
        for(const o of ores){
          const _x=o.x-cx0,_y=o.y-cy0;
          if(!o.alive||_x*_x+_y*_y>rngH2)continue;
          o.takeDmg(this.getDmg(),'twinhub');
          if(o._twinImmuneT<=0&&Math.random()<chance){o._twinFreezeT=1.0;}
          hit=true;
        }
        if(hit){this._firingT=.28;this._eff(new TwinFieldEff(cx0,cy0,rng,this.color));SFX.shoot('twinhub');}
      }
      return;
    }
    if(tp==='refinery'){if(this.cooldown>0){this.cooldown-=dt*this.getSpd();return;}const tgt=this._findTgt(ores);if(!tgt)return;this.angle=Math.atan2(tgt.y-this.cy,tgt.x-this.cx);tgt.takeDmg(this.getDmg(),'refinery');const _hp=[0.02,0.03,0.04,0.05];const _pp=this.isMega?0.25:_hp[this.level-1]||0.02;const _pg=Math.max(1,Math.floor(tgt.reward*_pp));GS.port+=_pg;GS.totalPort+=_pg;GS.popups.push(new Popup(this.cx,this.cy-14,'+◈'+_pg,'#FFD700'));UI.updHUD();this._eff(new ZapEff(this.cx,this.cy,tgt.x,tgt.y,this.color));this.cooldown=1;this._firingT=.22;SFX.shoot('refinery');return;}
    if(tp==='drone'){
      this._droneAngle+=dt*(0.55+this._lm()*.08);
      const rng=this.getRange()*TS;const rng2=rng*rng;const rngH=rng+8,rngH2=rngH*rngH;const cx0=this.cx,cy0=this.cy;
      const orbitR=this.isMega?TS*2.5:TS*1.75;
      const drX=cx0+Math.cos(this._droneAngle)*orbitR,drY=cy0+Math.sin(this._droneAngle)*orbitR;
      if(this._hitCooldown>0){this._hitCooldown-=dt;}
      else{
        let bestO=null,bestD=Infinity;
        for(const o of ores){
          if(!o.alive)continue;
          const _x=o.x-cx0,_y=o.y-cy0;if(_x*_x+_y*_y>rngH2)continue;
          const d=Math.hypot(o.x-drX,o.y-drY);
          if(d<bestD){bestD=d;bestO=o;}
        }
        if(bestO){
          const dir=Math.atan2(bestO.y-drY,bestO.x-drX);
          bestO.takeDmg(this.getDmg(),'single');
          this._eff(new LaserEff(drX,drY,dir,bestD,this.color));
          this._firingT=.18;this._hitCooldown=1/Math.max(0.1,this.getSpd());
          SFX.shoot('drone');
        }
      }
      return;
    }
    if(tp==='focus'){
      if(this._focusTgt){const _rng=this.getRange()*TS;const _dx=this._focusTgt.x-this.cx,_dy=this._focusTgt.y-this.cy;if(!this._focusTgt.alive||_dx*_dx+_dy*_dy>_rng*_rng)this._focusTgt=null;}
      if(!this._focusTgt)this._focusTgt=this._findTgt(ores);
      if(this._focusTgt){
        this._focusTgt.takeDmg(this.getDmg()*this.getSpd()*dt,'focus');
        this.angle=Math.atan2(this._focusTgt.y-this.cy,this._focusTgt.x-this.cx);
        this._firingT=.18;
        this._soundT-=dt;if(this._soundT<=0){SFX.shoot('magnetCannon');this._soundT=.38;}
      }
      return;
    }
    if(tp==='aoe'){
      this._aoeT+=dt;const iv=1/Math.max(.1,this.getSpd());
      if(this._aoeT>=iv){this._aoeT=0;const rng=this.getRange()*TS;const rngH=rng+8,rngH2=rngH*rngH;const cx0=this.cx,cy0=this.cy;let hit=false;for(const o of ores){const _x=o.x-cx0,_y=o.y-cy0;if(o.alive&&_x*_x+_y*_y<=rngH2){o.takeDmg(this.getDmg(),'aoe');hit=true;}}if(hit){this._firingT=.28;this._eff(new GridFlashEff(cx0,cy0,rng,this.color));SFX.shoot('aoe');}}return;}
    if(this.cooldown>0){this.cooldown-=dt*this.getSpd();return;}
    if(tp==='pierce'){
      const hasTgt=this._findTgt(ores);if(!hasTgt)return;
      this._firePierce(ores);this.cooldown=1;this._firingT=.25;SFX.shoot('plasmaCutter');return;
    }
    if(tp==='chain'){
      const hasTgt=this._findTgt(ores);if(!hasTgt)return;
      this._fireChain(ores);this.cooldown=1;this._firingT=.22;SFX.chain();return;
    }
    const tgt=this._findTgt(ores);if(!tgt)return;
    this.angle=Math.atan2(tgt.y-this.cy,tgt.x-this.cx);
    if(this.tId==='pixelArm')this._armAngle=this.angle;
    this._fire(tgt);this.cooldown=1;this._firingT=.15;SFX.shoot(this.tId);
  }
  _findTgt(ores){const rng=this.getRange()*TS;const rngH=rng+8,rngH2=rngH*rngH;const cx0=this.cx,cy0=this.cy;const isLast=this.tId==='magnetCannon';let best=null,bestP=isLast?Infinity:-1;for(const o of ores){if(!o.alive)continue;const _x=o.x-cx0,_y=o.y-cy0;if(_x*_x+_y*_y>rngH2)continue;const p=o.pathIdx+o.progress;if(isLast?p<bestP:p>bestP){bestP=p;best=o;}}return best;}
  _fire(tgt){
    if(this.tId==='pixelArm'){
      const dir=Math.atan2(tgt.y-this.cy,tgt.x-this.cx);
      tgt.takeDmg(this.getDmg(),'single');
      this._eff(new LaserEff(this.cx,this.cy,dir,Math.hypot(tgt.x-this.cx,tgt.y-this.cy)+8,this.color));
    }else{
      const opts={color:this.color,slow:null,size:1,type:this.tId};
      GS.projs.push(new Proj(this.cx,this.cy,tgt,this.getDmg(),opts));
    }
  }
  _firePierce(ores){const rng=this.getRange()*TS;const rng2=rng*rng;const cx0=this.cx,cy0=this.cy;let best=null,bestP=-1;for(const o of ores){if(!o.alive)continue;const _x=o.x-cx0,_y=o.y-cy0;if(_x*_x+_y*_y>rng2)continue;const p=o.pathIdx+o.progress;if(p>bestP){bestP=p;best=o;}}if(!best)return;this.angle=Math.atan2(best.y-this.cy,best.x-this.cx);const dx=Math.cos(this.angle),dy=Math.sin(this.angle);let hit=0;for(const o of ores){if(!o.alive||hit>=8)continue;const ex=o.x-this.cx,ey=o.y-this.cy,dot=ex*dx+ey*dy;if(dot<0||dot>rng)continue;if(Math.abs(ex*dy-ey*dx)<TS*.5){o.takeDmg(this.getDmg(),'pierce');hit++;}}this._eff(new LaserEff(this.cx,this.cy,this.angle,rng,this.color));}
  _fireChain(ores){const rng=this.getRange()*TS;const first=this._findTgt(ores);if(!first)return;this.angle=Math.atan2(first.y-this.cy,first.x-this.cx);const targets=[first];let last=first;for(let i=1;i<3;i++){let nx=null,bd=(rng*1.6)*(rng*1.6);for(const o of ores){if(!o.alive||targets.includes(o))continue;const _cx=o.x-last.x,_cy=o.y-last.y,d2=_cx*_cx+_cy*_cy;if(d2<bd){bd=d2;nx=o;}}if(!nx)break;targets.push(nx);last=nx;}const base=this.getDmg(),mults=[1,.80,.60];const shockDps=base*0.5,shockDur=3.0;for(let i=0;i<targets.length;i++){targets[i].takeDmg(base*mults[i],'chain');targets[i].applyShock(shockDps*mults[i],shockDur);if(i>0)this._eff(new BoltEff(targets[i-1].x,targets[i-1].y,targets[i].x,targets[i].y,this.color));}this._eff(new BoltEff(this.cx,this.cy,targets[0].x,targets[0].y,this.color));}

  draw(ctx,gt){
    const r=TS*.44,t=this._animT,f=this._firingT>0;
    if(this.isMega){
      ctx.save();ctx.translate(this.cx,this.cy);ctx.scale(2,2);
      if(this.tId==='coreShooter')this._dCS(ctx,r,t,f);
      else if(this.tId==='pixelArm')this._dPA(ctx,r,t,f);
      else switch(this.type){
        case'aoe':this._dAOE(ctx,r,t,f);break;case'focus':this._dSlow(ctx,r,t,f);break;case'slow':this._dSlow(ctx,r,t,f);break;
        case'pierce':this._dPierce(ctx,r,t,f);break;case'chain':this._dChain(ctx,r,t,f);break;
        case'pulseslow':this._dSlowField(ctx,r,t);break;case'scan':this._dScan(ctx,r,t);break;
        case'refinery':this._dRefinery(ctx,r,t);break;case'twinhub':this._dTwinHub(ctx,r,t);break;
        case'drone':this._dDrone(ctx,r,t);break;
      }
      ctx.restore();
      return;
    }
    if(this.level>1){const bc=['','#EF5350','#FFD700','#00E5FF'][this.level-1]||'#EF5350';const p=3;ctx.save();ctx.strokeStyle=bc;ctx.lineWidth=2;ctx.shadowColor=bc;ctx.shadowBlur=8;ctx.strokeRect(this.cx-TS*.5+p,this.cy-TS*.5+p,TS-p*2,TS-p*2);ctx.shadowBlur=0;ctx.restore();}
    ctx.save();ctx.translate(this.cx,this.cy);
    if(this.tId==='coreShooter')this._dCS(ctx,r,t,f);
    else if(this.tId==='pixelArm')this._dPA(ctx,r,t,f);
    else switch(this.type){
      case'aoe':this._dAOE(ctx,r,t,f);break;case'focus':this._dSlow(ctx,r,t,f);break;case'slow':this._dSlow(ctx,r,t,f);break;
      case'pierce':this._dPierce(ctx,r,t,f);break;case'chain':this._dChain(ctx,r,t,f);break;
      case'pulseslow':this._dSlowField(ctx,r,t);break;case'scan':this._dScan(ctx,r,t);break;
      case'refinery':this._dRefinery(ctx,r,t);break;case'twinhub':this._dTwinHub(ctx,r,t);break;
      case'drone':this._dDrone(ctx,r,t);break;
    }
    ctx.restore();
  }
  drawFX(ctx){
    if(this.type==='focus'&&this._focusTgt&&this._focusTgt.alive&&this._firingT>0){
      const p=.6+Math.sin(Date.now()*.022)*.4;
      ctx.save();ctx.strokeStyle=this.color;ctx.shadowColor=this.color;
      ctx.globalAlpha=.25;ctx.lineWidth=9+p*3;ctx.shadowBlur=0;ctx.beginPath();ctx.moveTo(this.cx,this.cy);ctx.lineTo(this._focusTgt.x,this._focusTgt.y);ctx.stroke();
      ctx.globalAlpha=.88;ctx.lineWidth=2.5+p*.5;ctx.shadowBlur=20+p*7;ctx.beginPath();ctx.moveTo(this.cx,this.cy);ctx.lineTo(this._focusTgt.x,this._focusTgt.y);ctx.stroke();
      ctx.strokeStyle='#fff';ctx.lineWidth=.9;ctx.globalAlpha=.65*p;ctx.shadowBlur=4;ctx.beginPath();ctx.moveTo(this.cx,this.cy);ctx.lineTo(this._focusTgt.x,this._focusTgt.y);ctx.stroke();
      ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
    }
    if(this.type==='twinhub'&&this._firingT>0){const rng=this.getRange()*TS;ctx.save();ctx.strokeStyle=this.color+'22';ctx.lineWidth=1.5;ctx.setLineDash([4,8]);ctx.beginPath();ctx.arc(this.cx,this.cy,rng,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();}
  }
  _base(ctx,r,col,sh='circle'){
    if(sh==='circle'){ctx.beginPath();ctx.arc(0,0,r*.88,0,Math.PI*2);}
    else if(sh==='oct'){ctx.beginPath();for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;if(i===0)ctx.moveTo(Math.cos(a)*r*.88,Math.sin(a)*r*.88);else ctx.lineTo(Math.cos(a)*r*.88,Math.sin(a)*r*.88);}ctx.closePath();}
    else if(sh==='hex'){ctx.beginPath();for(let i=0;i<6;i++){const a=(i/6)*Math.PI*2-Math.PI/6;if(i===0)ctx.moveTo(Math.cos(a)*r*.88,Math.sin(a)*r*.88);else ctx.lineTo(Math.cos(a)*r*.88,Math.sin(a)*r*.88);}ctx.closePath();}
    ctx.fillStyle='#1c1c1ccc';ctx.fill();ctx.strokeStyle='#555';ctx.lineWidth=1.5;ctx.stroke();
  }
  _core(ctx,r,col){
    const g=ctx.createRadialGradient(0,0,r*.04,0,0,r*.26);
    g.addColorStop(0,'#fff');g.addColorStop(.4,col);g.addColorStop(1,col+'88');
    ctx.beginPath();ctx.arc(0,0,r*.26,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
  }
  // 코어슈터: 헥사곤 장갑 배틀 캐논
  _dCS(ctx,r,t,f){
    const col=this.color;
    // hex base — HO=0: flat top/bottom edges, 상하좌우 대칭
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3;if(i===0)ctx.moveTo(Math.cos(a)*r*.92,Math.sin(a)*r*.92);else ctx.lineTo(Math.cos(a)*r*.92,Math.sin(a)*r*.92);}
    ctx.closePath();ctx.fillStyle='#131313';ctx.fill();
    ctx.strokeStyle=f?col+'bb':'#383838';ctx.lineWidth=2.4;ctx.stroke();
    // 6 alternating armor panels
    for(let i=0;i<6;i++){
      const a0=i*Math.PI/3,a1=(i+1)*Math.PI/3;
      ctx.fillStyle=i%2===0?(f?col+'0e':'#1d1d1d'):'#181818';
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a0)*r*.90,Math.sin(a0)*r*.90);ctx.lineTo(Math.cos(a1)*r*.90,Math.sin(a1)*r*.90);ctx.closePath();ctx.fill();
    }
    // 6 corner bolt nodes
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3,bx=Math.cos(a)*r*.86,by=Math.sin(a)*r*.86;
      ctx.fillStyle='#212121';ctx.strokeStyle=f?col+'66':col+'22';ctx.lineWidth=1.0;
      ctx.shadowColor=col;ctx.shadowBlur=f?8:1;
      ctx.beginPath();ctx.arc(bx,by,r*.07,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
      ctx.fillStyle=f?col+'99':'#3a3a3a';ctx.beginPath();ctx.arc(bx,by,r*.035,0,Math.PI*2);ctx.fill();
    }
    // inner hex ring
    ctx.strokeStyle=f?col+'44':col+'16';ctx.lineWidth=1.0;
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3;if(i===0)ctx.moveTo(Math.cos(a)*r*.62,Math.sin(a)*r*.62);else ctx.lineTo(Math.cos(a)*r*.62,Math.sin(a)*r*.62);}
    ctx.closePath();ctx.stroke();
    // TURRET
    ctx.save();ctx.rotate(this.angle+Math.PI/2);
    const bW=r*.38,bH=r*.24,brlL=r*.56,brlW=r*.14;
    // breach block
    ctx.fillStyle='#1c1c1c';ctx.strokeStyle=f?col+'88':col+'30';ctx.lineWidth=1.8;
    ctx.shadowColor=col;ctx.shadowBlur=f?14:2;
    ctx.beginPath();ctx.rect(-bW,-bH*.5,bW*2,bH);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.strokeStyle=f?col+'44':'#303030';ctx.lineWidth=1.0;
    ctx.beginPath();ctx.moveTo(-bW*.5,-bH*.4);ctx.lineTo(-bW*.5,bH*.4);ctx.stroke();
    ctx.beginPath();ctx.moveTo(bW*.5,-bH*.4);ctx.lineTo(bW*.5,bH*.4);ctx.stroke();
    // barrel
    ctx.fillStyle='#181818';ctx.strokeStyle=f?col+'99':col+'38';ctx.lineWidth=1.6;
    ctx.shadowColor=col;ctx.shadowBlur=f?16:3;
    ctx.beginPath();ctx.rect(-brlW,-bH*.5-brlL,brlW*2,brlL);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    // 3 band rings along barrel
    for(let i=0;i<3;i++){
      const by=-bH*.5-brlL*(i===0?.25:i===1?.53:.81);
      ctx.fillStyle=f?col+'22':'#252525';ctx.strokeStyle=f?col+(i===1?'99':'55'):col+'20';ctx.lineWidth=f&&i===1?2.0:1.2;
      ctx.shadowColor=col;ctx.shadowBlur=f&&i===1?18:0;
      ctx.beginPath();ctx.rect(-brlW*1.4,by-r*.038,brlW*2.8,r*.076);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    }
    // energy channel along barrel
    ctx.strokeStyle=f?col+'cc':col+'28';ctx.lineWidth=1.2;ctx.shadowColor=col;ctx.shadowBlur=f?18:0;
    ctx.beginPath();ctx.moveTo(0,-bH*.4);ctx.lineTo(0,-bH*.5-brlL+r*.06);ctx.stroke();ctx.shadowBlur=0;
    // muzzle brake disc
    const mY=-bH*.5-brlL;
    ctx.fillStyle='#161616';ctx.strokeStyle=f?col+'cc':col+'44';ctx.lineWidth=2.0;
    ctx.shadowColor=col;ctx.shadowBlur=f?28:6;
    ctx.beginPath();ctx.arc(0,mY,brlW*1.7,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    const mg=ctx.createRadialGradient(0,mY,0,0,mY,brlW*1.7);
    mg.addColorStop(0,f?'#ffffff':col+'aa');mg.addColorStop(.4,f?col:col+'33');mg.addColorStop(1,col+'00');
    ctx.fillStyle=mg;ctx.beginPath();ctx.arc(0,mY,brlW*1.7,0,Math.PI*2);ctx.fill();
    // muzzle cross flash when firing
    if(f){
      ctx.shadowColor=col;ctx.shadowBlur=22;ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;ctx.lineCap='round';
      const fl=brlW*3.2;
      ctx.beginPath();ctx.moveTo(0,mY-fl);ctx.lineTo(0,mY+fl);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-fl,mY);ctx.lineTo(fl,mY);ctx.stroke();
      const fd=fl*.7;
      ctx.globalAlpha=.6;ctx.lineWidth=1.0;
      ctx.beginPath();ctx.moveTo(-fd,mY-fd);ctx.lineTo(fd,mY+fd);ctx.stroke();
      ctx.beginPath();ctx.moveTo(fd,mY-fd);ctx.lineTo(-fd,mY+fd);ctx.stroke();
      ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.lineCap='butt';
      ctx.globalAlpha=.75;
      const og=ctx.createRadialGradient(0,mY,0,0,mY,brlW*3.5);
      og.addColorStop(0,'#fff');og.addColorStop(.25,col);og.addColorStop(1,col+'00');
      ctx.fillStyle=og;ctx.beginPath();ctx.arc(0,mY,brlW*3.5,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    }
    ctx.restore();
    // CENTER CORE
    ctx.shadowColor=col;ctx.shadowBlur=f?20:7;
    const cg=ctx.createRadialGradient(0,0,0,0,0,r*.18);
    cg.addColorStop(0,'#fff');cg.addColorStop(.35,col);cg.addColorStop(1,col+'00');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,r*.18,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=col+(f?'dd':'55');ctx.lineWidth=1.4;ctx.shadowBlur=f?12:3;
    ctx.beginPath();ctx.arc(0,0,r*.28,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;
  }
  // 픽셀 로봇암: 직선 대칭 산업 로봇팔 — 헥사곤 베이스
  _dPA(ctx,r,t,f){
    const col=this.color;
    // BASE: cross-anchor industrial mounting platform (4-way symmetric)
    const bs=r*.80;
    // Background plate
    ctx.fillStyle='#111111';ctx.beginPath();ctx.rect(-bs,-bs,bs*2,bs*2);ctx.fill();
    // Cross arms (H + V bars)
    const aw=bs*.56;
    ctx.fillStyle='#1a1a1a';
    ctx.beginPath();ctx.rect(-bs,-aw*.5,bs*2,aw);ctx.fill();
    ctx.beginPath();ctx.rect(-aw*.5,-bs,aw,bs*2);ctx.fill();
    // Outer border
    ctx.strokeStyle='#2c2c2c';ctx.lineWidth=1.8;ctx.beginPath();ctx.rect(-bs,-bs,bs*2,bs*2);ctx.stroke();
    // Center octagon hub
    const ch=bs*.42;
    ctx.fillStyle='#202020';ctx.strokeStyle='#2e2e2e';ctx.lineWidth=1.5;
    ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/8;i===0?ctx.moveTo(Math.cos(a)*ch,Math.sin(a)*ch):ctx.lineTo(Math.cos(a)*ch,Math.sin(a)*ch);}ctx.closePath();ctx.fill();ctx.stroke();
    // 4 corner square pads
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2+Math.PI/4,px=Math.cos(a)*bs*.70,py=Math.sin(a)*bs*.70,ps=bs*.24;
      ctx.fillStyle='#1c1c1c';ctx.strokeStyle='#2a2a2a';ctx.lineWidth=1.0;
      ctx.beginPath();ctx.rect(px-ps*.5,py-ps*.5,ps,ps);ctx.fill();ctx.stroke();
      ctx.fillStyle='#212121';ctx.strokeStyle=col+(f?'40':'14');ctx.lineWidth=0.8;
      ctx.beginPath();ctx.arc(px,py,r*.040,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#383838';ctx.lineWidth=0.6;
      ctx.beginPath();ctx.moveTo(px-r*.016,py);ctx.lineTo(px+r*.016,py);ctx.stroke();
      ctx.beginPath();ctx.moveTo(px,py-r*.016);ctx.lineTo(px,py+r*.016);ctx.stroke();
    }
    // 4 cardinal arm bolts
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2,bx=Math.cos(a)*bs*.62,by=Math.sin(a)*bs*.62;
      ctx.fillStyle='#1e1e1e';ctx.strokeStyle=col+(f?'36':'10');ctx.lineWidth=0.7;
      ctx.beginPath();ctx.arc(bx,by,r*.030,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#333';ctx.lineWidth=0.5;
      ctx.beginPath();ctx.moveTo(bx-r*.012,by);ctx.lineTo(bx+r*.012,by);ctx.stroke();
      ctx.beginPath();ctx.moveTo(bx,by-r*.012);ctx.lineTo(bx,by+r*.012);ctx.stroke();
    }
    // Glow accents
    ctx.shadowColor=col;ctx.shadowBlur=f?10:2;
    ctx.strokeStyle=col+(f?'44':'12');ctx.lineWidth=1.3;ctx.beginPath();ctx.rect(-bs,-bs,bs*2,bs*2);ctx.stroke();
    for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.strokeStyle=col+(f?'28':'0a');ctx.lineWidth=0.9;ctx.beginPath();ctx.moveTo(Math.cos(a)*ch,Math.sin(a)*ch);ctx.lineTo(Math.cos(a)*(bs-r*.05),Math.sin(a)*(bs-r*.05));ctx.stroke();}
    ctx.shadowBlur=0;
    ctx.save();ctx.rotate(t*.45);ctx.strokeStyle=col+(f?'50':'18');ctx.lineWidth=1.1;ctx.setLineDash([r*.14,r*.09]);
    ctx.beginPath();ctx.arc(0,0,ch*.85,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    // ── ARM: straight & perfectly symmetric (no lateral offset)
    ctx.save();ctx.rotate(this.angle+Math.PI/2);
    const j0y=-r*.05,j1y=-r*.40,j2y=-r*.60;
    const uw=r*.076,fw=r*.052,ww=r*.034;
    // Upper arm (symmetric trapezoid centered at x=0)
    ctx.fillStyle='#2d2d2d';ctx.strokeStyle=f?col+'40':'#484848';ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(-uw,j0y);ctx.lineTo(uw,j0y);ctx.lineTo(fw,j1y);ctx.lineTo(-fw,j1y);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#3c3c3c';ctx.lineWidth=0.7;
    ctx.beginPath();ctx.moveTo(0,j0y+r*.04);ctx.lineTo(0,j1y-r*.02);ctx.stroke();
    // Edge highlights (symmetric, 3D relief)
    ctx.strokeStyle='#484848';ctx.lineWidth=0.65;
    ctx.beginPath();ctx.moveTo(-uw+r*.008,j0y+r*.01);ctx.lineTo(-fw+r*.007,j1y-r*.01);ctx.stroke();
    ctx.beginPath();ctx.moveTo(uw-r*.008,j0y+r*.01);ctx.lineTo(fw-r*.007,j1y-r*.01);ctx.stroke();
    // Forearm (symmetric, narrower)
    ctx.fillStyle='#272727';ctx.strokeStyle=f?col+'38':'#424242';ctx.lineWidth=1.0;
    ctx.beginPath();ctx.moveTo(-fw,j1y);ctx.lineTo(fw,j1y);ctx.lineTo(ww,j2y);ctx.lineTo(-ww,j2y);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='#363636';ctx.lineWidth=0.7;
    ctx.beginPath();ctx.moveTo(0,j1y+r*.02);ctx.lineTo(0,j2y-r*.02);ctx.stroke();
    ctx.strokeStyle='#424242';ctx.lineWidth=0.6;
    ctx.beginPath();ctx.moveTo(-fw+r*.007,j1y+r*.01);ctx.lineTo(-ww+r*.005,j2y-r*.01);ctx.stroke();
    ctx.beginPath();ctx.moveTo(fw-r*.007,j1y+r*.01);ctx.lineTo(ww-r*.005,j2y-r*.01);ctx.stroke();
    // Shoulder joint (large servo disk)
    ctx.save();ctx.translate(0,j0y);
    ctx.strokeStyle='#383838';ctx.lineWidth=1.8;ctx.beginPath();ctx.arc(0,0,r*.188,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#2e2e2e';ctx.strokeStyle=f?col:'#545454';ctx.lineWidth=1.5;
    ctx.shadowColor=col;ctx.shadowBlur=f?22:7;
    ctx.beginPath();ctx.arc(0,0,r*.130,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.strokeStyle=f?col+'66':'#515151';ctx.lineWidth=0.8;
    for(let i=0;i<6;i++){const a=t*.8+i*Math.PI/3;ctx.beginPath();ctx.arc(Math.cos(a)*r*.092,Math.sin(a)*r*.092,r*.017,0,Math.PI*2);ctx.stroke();}
    ctx.strokeStyle='#494949';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r*.158,0,Math.PI*2);ctx.stroke();
    ctx.shadowColor=col;ctx.shadowBlur=f?26:9;
    ctx.fillStyle=f?'#ffffff':col;ctx.beginPath();ctx.arc(0,0,r*.044,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.restore();
    // Elbow joint (medium disk)
    ctx.save();ctx.translate(0,j1y);
    ctx.strokeStyle='#3a3a3a';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,r*.128,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#282828';ctx.strokeStyle=f?col+'cc':'#4c4c4c';ctx.lineWidth=1.1;
    ctx.shadowColor=col;ctx.shadowBlur=f?14:3;
    ctx.beginPath();ctx.arc(0,0,r*.082,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.strokeStyle=f?col+'55':'#4a4a4a';ctx.lineWidth=0.75;
    for(let i=0;i<3;i++){const a=t*(-1.3)+i*Math.PI*2/3;ctx.beginPath();ctx.arc(Math.cos(a)*r*.050,Math.sin(a)*r*.050,r*.013,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle=f?col+'aa':'#444444';ctx.beginPath();ctx.arc(0,0,r*.026,0,Math.PI*2);ctx.fill();
    ctx.restore();
    // Wrist joint (small disk)
    ctx.save();ctx.translate(0,j2y);
    ctx.strokeStyle='#383838';ctx.lineWidth=1.0;ctx.beginPath();ctx.arc(0,0,r*.108,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#242424';ctx.strokeStyle=f?col+'aa':'#4a4a4a';ctx.lineWidth=1.0;
    ctx.shadowColor=col;ctx.shadowBlur=f?12:2;
    ctx.beginPath();ctx.arc(0,0,r*.062,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.fillStyle=f?'#ffffff':col;ctx.beginPath();ctx.arc(0,0,r*.022,0,Math.PI*2);ctx.fill();
    ctx.restore();
    // ── GRIPPER: symmetric parallel jaw clamps
    const shankL=r*.10,gBarY=j2y-shankL;
    const gBarHH=r*.042,gBarHW=r*.22;
    const gJawL=r*.17,gJawHW=r*.065;
    const jOff=f?r*.130:r*.175;
    // Center shank
    ctx.fillStyle='#2a2a2a';ctx.strokeStyle=f?col+'32':'#3e3e3e';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.rect(-r*.032,gBarY,r*.064,shankL);ctx.fill();ctx.stroke();
    // Crossbeam
    ctx.fillStyle='#2e2e2e';ctx.strokeStyle=f?col+'44':'#464646';ctx.lineWidth=1.4;
    ctx.beginPath();ctx.rect(-gBarHW,gBarY-gBarHH,gBarHW*2,gBarHH*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle=f?col+'38':'#3e3e3e';ctx.lineWidth=0.9;
    ctx.beginPath();ctx.arc(0,gBarY,r*.026,0,Math.PI*2);ctx.stroke();
    for(const sx of[-1,1]){ctx.fillStyle='#242424';ctx.strokeStyle=col+(f?'35':'12');ctx.lineWidth=0.8;ctx.beginPath();ctx.arc(sx*gBarHW,gBarY,r*.030,0,Math.PI*2);ctx.fill();ctx.stroke();}
    // Symmetric jaw plates
    for(const sx of[-1,1]){
      const jx=sx*jOff,jtopY=gBarY-gBarHH;
      ctx.shadowColor=col;ctx.shadowBlur=f?18:3;
      ctx.fillStyle='#2c2c2c';ctx.strokeStyle=f?col:'#4c4c4c';ctx.lineWidth=1.35;
      ctx.beginPath();ctx.rect(jx-gJawHW,jtopY-gJawL,gJawHW*2,gJawL);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
      ctx.strokeStyle=f?col+'55':'#525252';ctx.lineWidth=0.72;
      for(let g=0;g<3;g++){const gy=jtopY-gJawL*.15-g*gJawL*.27;ctx.beginPath();ctx.moveTo(jx-gJawHW*.8,gy);ctx.lineTo(jx+gJawHW*.8,gy);ctx.stroke();}
      // Inner edge highlight (3D quality)
      ctx.strokeStyle='#464646';ctx.lineWidth=0.7;
      ctx.beginPath();ctx.moveTo(jx-gJawHW+r*.010,jtopY-r*.006);ctx.lineTo(jx-gJawHW+r*.010,jtopY-gJawL+r*.008);ctx.stroke();
      ctx.beginPath();ctx.moveTo(jx+gJawHW-r*.010,jtopY-r*.006);ctx.lineTo(jx+gJawHW-r*.010,jtopY-gJawL+r*.008);ctx.stroke();
    }
    if(f){
      const glowCy=gBarY-gBarHH-gJawL*.5;
      const mg=ctx.createRadialGradient(0,glowCy,0,0,glowCy,jOff+gJawHW);
      mg.addColorStop(0,'#ffffff');mg.addColorStop(.28,col);mg.addColorStop(1,col+'00');
      ctx.globalAlpha=.55;ctx.fillStyle=mg;ctx.beginPath();ctx.arc(0,glowCy,jOff+gJawHW,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    }
    ctx.restore();
    // Center hub
    ctx.shadowColor=col;ctx.shadowBlur=f?18:6;
    const cg=ctx.createRadialGradient(0,0,0,0,0,r*.13);
    cg.addColorStop(0,'#ffffff');cg.addColorStop(.24,col);cg.addColorStop(1,col+'00');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,r*.13,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=col+(f?'dd':'60');ctx.lineWidth=1.4;ctx.shadowBlur=f?12:3;
    ctx.beginPath();ctx.arc(0,0,r*.21,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;ctx.strokeStyle=col+(f?'55':'1e');ctx.lineWidth=1.0;
    for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.15,Math.sin(a)*r*.15);ctx.lineTo(Math.cos(a)*r*.21,Math.sin(a)*r*.21);ctx.stroke();}
    ctx.shadowBlur=0;
  }
  // AOE: 레이저 그리드 — 원형 베이스 + 격자선
  _dAOE(ctx,r,t,f){
    const col=this.color;
    // 원형 베이스
    ctx.beginPath();ctx.arc(0,0,r*.88,0,Math.PI*2);
    ctx.fillStyle='#181818cc';ctx.fill();
    ctx.strokeStyle=f?col+'88':'#444';ctx.lineWidth=1.8;ctx.stroke();
    // 회전하는 격자선
    ctx.save();ctx.rotate(t*.4);ctx.globalAlpha=f?.88:.42;ctx.strokeStyle=col;ctx.lineWidth=1.3;
    const g=r*.72;
    for(let i=-1;i<=1;i++){
      ctx.beginPath();ctx.moveTo(i*r*.26,-g);ctx.lineTo(i*r*.26,g);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-g,i*r*.26);ctx.lineTo(g,i*r*.26);ctx.stroke();
    }
    ctx.globalAlpha=1;ctx.restore();
    // 외곽 링 펄스
    const pulse=.5+Math.sin(t*3)*.5;
    ctx.globalAlpha=f?pulse*.7:.2;ctx.strokeStyle=col;ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,0,r*.68,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;
    this._core(ctx,r,col);
  }
  // 포인트 버스터: 중입자 가속 저격포
  _dSlow(ctx,r,t,f){
    const col=this.color;
    // octagonal heavy base
    ctx.beginPath();
    for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/8;if(i===0)ctx.moveTo(Math.cos(a)*r*.9,Math.sin(a)*r*.9);else ctx.lineTo(Math.cos(a)*r*.9,Math.sin(a)*r*.9);}
    ctx.closePath();ctx.fillStyle='#181818';ctx.fill();
    ctx.strokeStyle=f?col+'aa':'#484848';ctx.lineWidth=2.2;ctx.stroke();
    // 8 panel inlays
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4-Math.PI/8,a2=a+Math.PI/4;
      ctx.fillStyle=f&&i%2===0?col+'0e':'#1e1e1e';
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*r*.88,Math.sin(a)*r*.88);ctx.lineTo(Math.cos(a2)*r*.88,Math.sin(a2)*r*.88);ctx.closePath();ctx.fill();
    }
    // inner oct ring
    ctx.save();ctx.rotate(Math.PI/8);ctx.strokeStyle=f?col+'44':col+'18';ctx.lineWidth=1;
    ctx.beginPath();
    for(let i=0;i<8;i++){const a=i*Math.PI/4;if(i===0)ctx.moveTo(Math.cos(a)*r*.62,Math.sin(a)*r*.62);else ctx.lineTo(Math.cos(a)*r*.62,Math.sin(a)*r*.62);}
    ctx.closePath();ctx.stroke();ctx.restore();
    // counter-rotating EM ring
    ctx.save();ctx.rotate(-t*1.1);
    ctx.strokeStyle=f?col+'66':col+'22';ctx.lineWidth=1.3;ctx.setLineDash([r*.22,r*.1]);
    ctx.beginPath();ctx.arc(0,0,r*.78,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    // 4 pole charge nodes
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2;
      ctx.fillStyle='#222';ctx.strokeStyle=f?col+'99':col+'33';ctx.lineWidth=1.2;
      ctx.shadowColor=col;ctx.shadowBlur=f?10:2;
      ctx.beginPath();ctx.arc(Math.cos(a)*r*.68,Math.sin(a)*r*.68,r*.09,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle=f?col:'#444';ctx.beginPath();ctx.arc(Math.cos(a)*r*.68,Math.sin(a)*r*.68,r*.05,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    }
    // TURRET
    ctx.save();ctx.rotate(this.angle+Math.PI/2);
    // charging capacitor wings (large, dramatic)
    for(const sx of[-1,1]){
      ctx.fillStyle='#242424';ctx.strokeStyle=f?col+'88':col+'33';ctx.lineWidth=1.4;
      ctx.beginPath();ctx.rect(sx*r*.38,-r*.38,sx*r*.3,r*.62);ctx.fill();ctx.stroke();
      for(let v=0;v<4;v++){
        const vy=-r*.3+v*r*.14;
        ctx.strokeStyle=col+(f?'44':'18');ctx.lineWidth=.8;
        ctx.beginPath();ctx.moveTo(sx*r*.4,vy);ctx.lineTo(sx*r*.66,vy);ctx.stroke();
      }
      // lit charge cells when firing
      for(let v=0;v<3;v++){
        const vy=-r*.28+v*r*.16;
        ctx.fillStyle=f?(v===1?col+'cc':col+'55'):'#2e2e2e';
        ctx.shadowColor=col;ctx.shadowBlur=f&&v===1?18:0;
        ctx.beginPath();ctx.rect(sx*r*.42,vy,sx*r*.2,r*.1);ctx.fill();
        ctx.shadowBlur=0;
      }
      // wing edge bracket
      ctx.strokeStyle=f?col+'77':col+'33';ctx.lineWidth=1.5;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(sx*r*.68,-r*.36);ctx.lineTo(sx*r*.7,-r*.14);ctx.lineTo(sx*r*.68,r*.22);ctx.stroke();
      ctx.lineCap='butt';
    }
    // turret mount base
    ctx.fillStyle='#1e1e1e';ctx.strokeStyle=f?col+'66':col+'2a';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.rect(-r*.36,-r*.28,r*.72,r*.52);ctx.fill();ctx.stroke();
    // accelerator barrel
    ctx.fillStyle='#181818';ctx.strokeStyle=f?col+'99':col+'3a';ctx.lineWidth=1.6;
    ctx.beginPath();ctx.rect(-r*.14,-r*1.04,r*.28,r*.78);ctx.fill();ctx.stroke();
    // accelerator coil segments (5 rings, alternating glow)
    for(let i=0;i<5;i++){
      const ry=-r*.96+i*r*.17,lit=f&&(i===1||i===3);
      ctx.fillStyle='#181818';ctx.strokeStyle=lit?col:col+(i%2===0?'55':'28');
      ctx.lineWidth=lit?2.4:1.2;ctx.shadowColor=col;ctx.shadowBlur=lit?22:0;
      ctx.beginPath();ctx.rect(-r*.17,ry,r*.34,r*.1);ctx.fill();ctx.stroke();
      ctx.shadowBlur=0;
      if(lit){ctx.globalAlpha=.4;ctx.fillStyle=col;ctx.beginPath();ctx.rect(-r*.1,ry+r*.02,r*.2,r*.06);ctx.fill();ctx.globalAlpha=1;}
    }
    // barrel particle channel
    ctx.fillStyle=f?col+'44':'#080500';ctx.beginPath();ctx.rect(-r*.07,-r*1.02,r*.14,r*.74);ctx.fill();
    if(f){ctx.strokeStyle=col+'66';ctx.lineWidth=1;ctx.shadowColor=col;ctx.shadowBlur=18;ctx.beginPath();ctx.rect(-r*.07,-r*1.02,r*.14,r*.74);ctx.stroke();ctx.shadowBlur=0;}
    // muzzle convergence
    ctx.fillStyle='#0e0800';ctx.strokeStyle=f?col+'cc':col+'55';ctx.lineWidth=1.6;
    ctx.beginPath();ctx.rect(-r*.2,-r*1.1,r*.4,r*.1);ctx.fill();ctx.stroke();
    ctx.shadowColor=col;ctx.shadowBlur=f?28:4;
    ctx.fillStyle=f?col:'#1e1200';ctx.beginPath();ctx.rect(-r*.1,-r*1.09,r*.2,r*.07);ctx.fill();
    if(f){
      ctx.globalAlpha=.75;
      const mg=ctx.createRadialGradient(0,-r*1.08,0,0,-r*1.08,r*.26);
      mg.addColorStop(0,'#fff');mg.addColorStop(.3,col);mg.addColorStop(1,col+'00');
      ctx.fillStyle=mg;ctx.beginPath();ctx.arc(0,-r*1.08,r*.26,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    }
    ctx.shadowBlur=0;
    ctx.restore();
    // POWER CORE
    ctx.shadowColor=col;ctx.shadowBlur=f?22:8;
    const cg=ctx.createRadialGradient(0,0,0,0,0,r*.22);
    cg.addColorStop(0,'#fff');cg.addColorStop(.35,col);cg.addColorStop(1,col+'00');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,r*.22,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  }
  // 플라즈마 커터: 중입자 관통포
  _dPierce(ctx,r,t,f){
    const col=this.color;
    // === HEXAGONAL ARMOR BASE ===
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;if(i===0)ctx.moveTo(Math.cos(a)*r*.94,Math.sin(a)*r*.94);else ctx.lineTo(Math.cos(a)*r*.94,Math.sin(a)*r*.94);}
    ctx.closePath();ctx.fillStyle='#141414';ctx.fill();
    ctx.strokeStyle=f?col+'cc':'#484848';ctx.lineWidth=2.6;ctx.stroke();
    // inner hex (rotated 30°)
    ctx.save();ctx.rotate(Math.PI/6);ctx.strokeStyle=f?col+'44':col+'18';ctx.lineWidth=1.1;
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;if(i===0)ctx.moveTo(Math.cos(a)*r*.68,Math.sin(a)*r*.68);else ctx.lineTo(Math.cos(a)*r*.68,Math.sin(a)*r*.68);}
    ctx.closePath();ctx.stroke();ctx.restore();
    // 6 energy conduit spokes
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3+Math.PI/6;
      ctx.strokeStyle=f?col+'3a':col+'14';ctx.lineWidth=.9;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.22,Math.sin(a)*r*.22);ctx.lineTo(Math.cos(a)*r*.7,Math.sin(a)*r*.7);ctx.stroke();
    }
    // rotating outer energy ring
    ctx.save();ctx.rotate(t*.55);
    ctx.strokeStyle=f?col+'77':col+'28';ctx.lineWidth=f?2.2:1.5;ctx.setLineDash([r*.22,r*.09]);
    ctx.beginPath();ctx.arc(0,0,r*.84,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    // counter-rotating mid ring
    ctx.save();ctx.rotate(-t*1.1);
    ctx.strokeStyle=f?col+'55':col+'1c';ctx.lineWidth=1.1;ctx.setLineDash([r*.13,r*.14]);
    ctx.beginPath();ctx.arc(0,0,r*.6,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    // 6 pole nodes at hex vertices
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3+Math.PI/6;
      const nx=Math.cos(a)*r*.7,ny=Math.sin(a)*r*.7;
      ctx.fillStyle='#181818';ctx.strokeStyle=f?col+'99':col+'33';ctx.lineWidth=1.2;
      ctx.shadowColor=col;ctx.shadowBlur=f?12:3;
      ctx.beginPath();ctx.arc(nx,ny,r*.09,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle=f?col:'#444';ctx.beginPath();ctx.arc(nx,ny,r*.05,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    }
    // === TURRET ASSEMBLY (facing target) ===
    ctx.save();ctx.rotate(this.angle+Math.PI/2);
    // swept energy wings (angled back fins, symmetric)
    for(const sx of[-1,1]){
      ctx.fillStyle='#181818';ctx.strokeStyle=f?col+'66':col+'22';ctx.lineWidth=1.3;
      ctx.beginPath();
      ctx.moveTo(sx*r*.2,-r*.44);ctx.lineTo(sx*r*.66,-r*.62);ctx.lineTo(sx*r*.7,-r*.18);ctx.lineTo(sx*r*.32,-r*.16);
      ctx.closePath();ctx.fill();ctx.stroke();
      for(let fi=0;fi<3;fi++){
        const fy=-r*.28+fi*r*.1;
        ctx.strokeStyle=col+(f?'44':'16');ctx.lineWidth=.7;
        ctx.beginPath();ctx.moveTo(sx*r*.3,fy);ctx.lineTo(sx*r*.6,fy-r*.08);ctx.stroke();
      }
    }
    // turret base block
    ctx.fillStyle='#181818';ctx.strokeStyle=f?col+'77':col+'2e';ctx.lineWidth=1.7;
    ctx.beginPath();ctx.rect(-r*.46,-r*.28,r*.92,r*.52);ctx.fill();ctx.stroke();
    // twin symmetric plasma barrels
    for(const bx of[-r*.24,r*.04]){
      ctx.fillStyle='#1c1c1c';ctx.strokeStyle=f?col+'99':col+'3a';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.rect(bx,-r*1.01,r*.2,r*.75);ctx.fill();ctx.stroke();
      for(let ri=0;ri<4;ri++){
        const ry=-r*.94+ri*r*.2,lit=f&&ri===2;
        ctx.fillStyle='#181818';ctx.strokeStyle=lit?col:col+(ri%2===0?'55':'28');
        ctx.lineWidth=lit?2:1.1;ctx.shadowColor=col;ctx.shadowBlur=lit?18:0;
        ctx.beginPath();ctx.rect(bx-r*.03,ry,r*.26,r*.1);ctx.fill();ctx.stroke();
        ctx.shadowBlur=0;
      }
      ctx.fillStyle=f?col+'55':'#06061a';ctx.beginPath();ctx.rect(bx+r*.04,-r*.98,r*.12,r*.7);ctx.fill();
      if(f){ctx.strokeStyle=col+'aa';ctx.lineWidth=1;ctx.shadowColor=col;ctx.shadowBlur=18;ctx.beginPath();ctx.rect(bx+r*.04,-r*.98,r*.12,r*.7);ctx.stroke();ctx.shadowBlur=0;}
    }
    // cross bridge
    ctx.fillStyle='#0e0e24';ctx.strokeStyle=f?col+'66':col+'22';ctx.lineWidth=1;
    ctx.beginPath();ctx.rect(-r*.4,-r*.08,r*.8,r*.14);ctx.fill();ctx.stroke();
    // plasma arc between muzzles when firing
    if(f){
      ctx.strokeStyle=col+'88';ctx.lineWidth=1.4;ctx.shadowColor=col;ctx.shadowBlur=16;
      ctx.beginPath();ctx.moveTo(-r*.14,-r*1.02);ctx.quadraticCurveTo(0,-r*.86,r*.14,-r*1.02);ctx.stroke();
      ctx.shadowBlur=0;
    }
    // muzzle blasts
    if(f){
      ctx.shadowColor=col;ctx.shadowBlur=38;
      for(const bx of[-r*.14,r*.14]){
        ctx.fillStyle=col+'dd';ctx.beginPath();ctx.arc(bx,-r*1.02,r*.14,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#fff';ctx.shadowBlur=14;ctx.globalAlpha=.95;
        ctx.beginPath();ctx.arc(bx,-r*1.02,r*.08,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
      }
      ctx.shadowBlur=0;
    }
    ctx.restore();
    // === SINGULARITY CORE ===
    ctx.shadowColor=col;ctx.shadowBlur=f?46:20;
    const cg=ctx.createRadialGradient(0,0,0,0,0,r*.28);
    cg.addColorStop(0,'#fff');cg.addColorStop(.2,'#f0f0ff');cg.addColorStop(.5,col);
    cg.addColorStop(.78,col+'55');cg.addColorStop(1,col+'00');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,r*.28,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=col+(f?'cc':'55');ctx.lineWidth=1.6;
    ctx.beginPath();ctx.arc(0,0,r*.36,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;
  }
  // 체인 볼트: 코일 전극탑, 기본방향 위(↑)
  _dChain(ctx,r,t,f){
    const col=this.color;
    this._base(ctx,r,col,'hex');
    ctx.strokeStyle='#444';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r*.72,0,Math.PI*2);ctx.stroke();
    // 3개 전극 — 모두 균등하게 활성화
    const baseAngle=-Math.PI/2;
    for(let i=0;i<3;i++){
      const a=baseAngle+i*(Math.PI*2/3),er=r*.58;
      const ex=Math.cos(a)*er,ey=Math.sin(a)*er;
      // 전극 암 — 발사 시 모두 컬러
      ctx.strokeStyle=f?col:'#555';ctx.lineWidth=r*.12;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.22,Math.sin(a)*r*.22);ctx.lineTo(ex,ey);ctx.stroke();
      // 전극 끝 노드
      ctx.fillStyle=f?col:'#444';ctx.strokeStyle='#777';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(ex,ey,r*.1,0,Math.PI*2);ctx.fill();ctx.stroke();
      // 발사 시 모든 전극 빛남
      if(f){ctx.fillStyle=col+'cc';ctx.beginPath();ctx.arc(ex,ey,r*.14,0,Math.PI*2);ctx.fill();}
    }
    const cg2=ctx.createRadialGradient(0,0,r*.04,0,0,r*.22);
    cg2.addColorStop(0,'#fff');cg2.addColorStop(.5,col);cg2.addColorStop(1,col+'44');
    ctx.beginPath();ctx.arc(0,0,r*.22,0,Math.PI*2);ctx.fillStyle=cg2;ctx.fill();
  }
  _dSlowField(ctx,r,t){
    const col=this.color;
    const hw=r*.84;
    // 정사각형 베이스
    ctx.fillStyle='#1a1a1acc';ctx.strokeStyle='#444';ctx.lineWidth=1.5;
    ctx.fillRect(-hw,-hw,hw*2,hw*2);ctx.strokeRect(-hw,-hw,hw*2,hw*2);
    // 이동하는 대각선 스트라이프 (클립 적용)
    ctx.save();ctx.beginPath();ctx.rect(-hw,-hw,hw*2,hw*2);ctx.clip();
    const offset=(t*r*.9)%(r*.38);
    ctx.globalAlpha=.35;
    for(let x=-hw*3+offset;x<hw*3;x+=r*.38){
      ctx.fillStyle=col;
      ctx.beginPath();ctx.moveTo(x,-hw);ctx.lineTo(x+r*.2,-hw);ctx.lineTo(x+r*.2-hw*1.6,hw);ctx.lineTo(x-hw*1.6,hw);ctx.closePath();ctx.fill();
    }
    ctx.globalAlpha=1;ctx.restore();
    // 테두리 강조
    ctx.strokeStyle=col+'66';ctx.lineWidth=1.5;ctx.strokeRect(-hw,-hw,hw*2,hw*2);
    // 중앙 코어
    ctx.fillStyle=col;ctx.beginPath();ctx.arc(0,0,r*.14,0,Math.PI*2);ctx.fill();
    // 모서리 핀
    for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
      ctx.fillStyle='#333';ctx.strokeStyle=col+'88';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.arc(sx*hw*.7,sy*hw*.7,r*.13,0,Math.PI*2);ctx.fill();ctx.stroke();
    }
  }
  _dDrone(ctx,r,t){
    const col=this.color,f=this._firingT>0;
    const hw=r*.82;
    // square armored dispatch platform
    ctx.fillStyle='#141414';ctx.strokeStyle=f?col+'77':'#3a3a3a';ctx.lineWidth=1.8;
    ctx.beginPath();ctx.rect(-hw,-hw,hw*2,hw*2);ctx.fill();ctx.stroke();
    // inner square frame
    ctx.strokeStyle=col+(f?'28':'12');ctx.lineWidth=1;
    ctx.beginPath();ctx.rect(-hw*.76,-hw*.76,hw*1.52,hw*1.52);ctx.stroke();
    // diagonal X crossbeams
    ctx.strokeStyle=col+(f?'33':'16');ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(-hw*.7,-hw*.7);ctx.lineTo(hw*.7,hw*.7);ctx.stroke();
    ctx.beginPath();ctx.moveTo(hw*.7,-hw*.7);ctx.lineTo(-hw*.7,hw*.7);ctx.stroke();
    // 4 corner drone launch pillars
    for(const[sx,sy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){
      const px=sx*hw*.64,py=sy*hw*.64;
      ctx.fillStyle='#1c1c1c';ctx.strokeStyle=f?col+'77':col+'33';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.rect(px-r*.13,py-r*.13,r*.26,r*.26);ctx.fill();ctx.stroke();
      // launch indicator (lit when active)
      ctx.fillStyle=f?col+'cc':col+'44';ctx.shadowColor=col;ctx.shadowBlur=f?14:4;
      ctx.beginPath();ctx.rect(px-r*.06,py-r*.06,r*.12,r*.12);ctx.fill();
      ctx.shadowBlur=0;
    }
    // axis tick marks at edge midpoints
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2;
      ctx.strokeStyle=col+(f?'44':'1c');ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*hw*.76,Math.sin(a)*hw*.76);ctx.lineTo(Math.cos(a)*hw*.88,Math.sin(a)*hw*.88);ctx.stroke();
    }
    // central control console (square)
    ctx.fillStyle='#1a1a1a';ctx.strokeStyle=f?col+'88':'#3a3a3a';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.rect(-r*.26,-r*.26,r*.52,r*.52);ctx.fill();ctx.stroke();
    ctx.strokeStyle=col+(f?'44':'1a');ctx.lineWidth=.9;
    ctx.beginPath();ctx.rect(-r*.15,-r*.15,r*.3,r*.3);ctx.stroke();
    // slowly rotating dispatch pointer (4-way cross)
    ctx.save();ctx.rotate(t*.5);
    ctx.strokeStyle=f?col+'88':col+'2a';ctx.lineWidth=1.2;
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2+Math.PI/4;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*r*.2,Math.sin(a)*r*.2);ctx.stroke();
    }
    ctx.restore();
    // core glow
    ctx.shadowColor=col;ctx.shadowBlur=f?26:9;
    const cg=ctx.createRadialGradient(0,0,0,0,0,r*.16);
    cg.addColorStop(0,'#fff');cg.addColorStop(.35,col);cg.addColorStop(.7,col+'44');cg.addColorStop(1,col+'00');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,r*.16,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  }
  _drawDroneOrbit(ctx){
    const rng=this.getRange()*TS,da=this._droneAngle,col=this.color,f=this._firingT>0;
    const orbitR=this.isMega?TS*2.5:TS*1.75;
    const sc=this.isMega?1:0.5;
    ctx.save();
    ctx.strokeStyle=col+'14';ctx.lineWidth=.8;ctx.setLineDash([3,9]);
    ctx.beginPath();ctx.arc(this.cx,this.cy,rng,0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([]);
    const drX=this.cx+Math.cos(da)*orbitR,drY=this.cy+Math.sin(da)*orbitR;
    ctx.save();ctx.translate(drX,drY);ctx.rotate(da+Math.PI);ctx.scale(sc,sc);
    ctx.shadowColor=col;ctx.shadowBlur=f?18:6;
    // === STEALTH DELTA DRONE (nose=-y) ===
    // central fuselage spine
    ctx.fillStyle='#071412';ctx.strokeStyle=f?col:col+'77';ctx.lineWidth=1.3;
    ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(3.5,-5);ctx.lineTo(3.5,12);ctx.lineTo(-3.5,12);ctx.lineTo(-3.5,-5);ctx.closePath();ctx.fill();ctx.stroke();
    // left delta wing
    ctx.fillStyle='#081614';ctx.strokeStyle=f?col:col+'55';ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(-22,5);ctx.lineTo(-21,10);ctx.lineTo(-5,10);ctx.lineTo(-3.5,-3);ctx.closePath();ctx.fill();ctx.stroke();
    // right delta wing
    ctx.beginPath();ctx.moveTo(0,-14);ctx.lineTo(22,5);ctx.lineTo(21,10);ctx.lineTo(5,10);ctx.lineTo(3.5,-3);ctx.closePath();ctx.fill();ctx.stroke();
    // leading edge highlight lines
    ctx.strokeStyle=col+(f?'77':'2a');ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(-22,5);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-15);ctx.lineTo(22,5);ctx.stroke();
    // wing panel detail lines
    ctx.strokeStyle=col+(f?'3a':'14');ctx.lineWidth=.7;
    ctx.beginPath();ctx.moveTo(-1,-12);ctx.lineTo(-14,4);ctx.stroke();
    ctx.beginPath();ctx.moveTo(1,-12);ctx.lineTo(14,4);ctx.stroke();
    // twin engine pods at rear
    for(const ex of[-5.5,5.5]){
      ctx.fillStyle='#0c2018';ctx.strokeStyle=col+(f?'aa':'44');ctx.lineWidth=1.2;
      ctx.beginPath();ctx.rect(ex-3,9,6,5);ctx.fill();ctx.stroke();
      ctx.fillStyle=f?col+'aa':'#172e24';ctx.shadowColor=col;ctx.shadowBlur=f?12:2;
      ctx.beginPath();ctx.rect(ex-2,11,4,2.5);ctx.fill();ctx.shadowBlur=0;
      if(f){
        const pg=ctx.createLinearGradient(0,14,0,21);
        pg.addColorStop(0,col+'cc');pg.addColorStop(1,col+'00');
        ctx.fillStyle=pg;ctx.globalAlpha=.55;
        ctx.beginPath();ctx.rect(ex-2,14,4,7);ctx.fill();
        ctx.globalAlpha=1;
      }
    }
    // nose targeting aperture
    ctx.fillStyle='#0d2820';ctx.strokeStyle=f?col:col+'88';ctx.lineWidth=1.1;
    ctx.beginPath();ctx.moveTo(-2,-18);ctx.lineTo(0,-21);ctx.lineTo(2,-18);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=f?'#fff':col;ctx.shadowColor=col;ctx.shadowBlur=f?16:6;
    ctx.beginPath();ctx.arc(0,-18.5,1.4,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    // targeting laser beam
    if(f){
      ctx.strokeStyle=col+'cc';ctx.lineWidth=1;ctx.shadowColor=col;ctx.shadowBlur=14;
      ctx.beginPath();ctx.moveTo(0,-21);ctx.lineTo(0,-28);ctx.stroke();
      ctx.shadowBlur=0;
    }
    // cockpit visor
    ctx.fillStyle=f?col+'66':col+'22';ctx.strokeStyle=col+(f?'77':'2a');ctx.lineWidth=.8;
    ctx.beginPath();ctx.rect(-2.2,-12,4.4,7);ctx.fill();ctx.stroke();
    // core energy glow
    ctx.shadowColor=col;ctx.shadowBlur=f?22:8;
    const cg=ctx.createRadialGradient(0,2,0,0,2,4.5);
    cg.addColorStop(0,'#fff');cg.addColorStop(.3,col);cg.addColorStop(1,col+'00');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,2,4.5,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.restore();ctx.restore();
  }
  _dScan(ctx,r,t){
    const col=this.color,f=this._firingT>0;
    this._base(ctx,r,col,'circle');
    // outer bezel ring
    ctx.strokeStyle=col+'70';ctx.lineWidth=1.4;
    ctx.beginPath();ctx.arc(0,0,r*.84,0,Math.PI*2);ctx.stroke();
    // 12 bezel ticks — 4-fold symmetric (major at 90°, minor at 30°)
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,major=i%3===0;
      ctx.strokeStyle=col+(major?'99':'44');ctx.lineWidth=major?1.2:.7;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.84,Math.sin(a)*r*.84);
      ctx.lineTo(Math.cos(a)*r*(major?.73:.79),Math.sin(a)*r*(major?.73:.79));ctx.stroke();
    }
    // 3 range rings
    for(let i=1;i<=3;i++){
      ctx.strokeStyle=col+(i===3?'55':i===2?'30':'1a');ctx.lineWidth=i===3?1:.5;
      ctx.beginPath();ctx.arc(0,0,r*.28*i,0,Math.PI*2);ctx.stroke();
    }
    // 4 rotating scan arms (90° apart) — 4-fold symmetric
    ctx.save();ctx.rotate(t*1.2);
    const trailArc=Math.PI*.38;
    for(let i=0;i<4;i++){
      const base=i*Math.PI/2;
      // phosphor trail behind each arm
      for(let j=0;j<16;j++){
        const frac=j/16;
        const a0=base-trailArc+frac*trailArc;
        const a1=base-trailArc+(j+1)/16*trailArc;
        ctx.globalAlpha=frac*(f?.52:.28);
        ctx.fillStyle=col;
        ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r*.76,a0,a1);ctx.closePath();ctx.fill();
      }
      ctx.globalAlpha=1;
      // arm
      ctx.strokeStyle=f?col+'ee':col+'99';ctx.lineWidth=f?1.8:1.2;ctx.lineCap='round';
      ctx.shadowColor=col;ctx.shadowBlur=f?18:7;
      const ax=Math.cos(base),ay=Math.sin(base);
      ctx.beginPath();ctx.moveTo(ax*r*.15,ay*r*.15);ctx.lineTo(ax*r*.74,ay*r*.74);ctx.stroke();
      ctx.fillStyle=f?'#fff':col;ctx.shadowBlur=f?12:5;
      ctx.beginPath();ctx.arc(ax*r*.74,ay*r*.74,r*.05,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    }
    ctx.restore();
    // central hub
    ctx.shadowColor=col;ctx.shadowBlur=f?22:10;
    ctx.fillStyle='#091510';ctx.strokeStyle=col;ctx.lineWidth=1.4;
    ctx.beginPath();ctx.arc(0,0,r*.16,0,Math.PI*2);ctx.fill();ctx.stroke();
    const cg=ctx.createRadialGradient(0,0,0,0,0,r*.16);
    cg.addColorStop(0,'#fff');cg.addColorStop(.38,col);cg.addColorStop(1,col+'00');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,r*.16,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  }
  _dRefinery(ctx,r,t){
    const col=this.color,f=this._firingT>0;
    // square chamfered base (상하좌우 대칭)
    const sq=r*.84,ch=r*.22;
    ctx.beginPath();
    ctx.moveTo(-sq+ch,-sq);ctx.lineTo(sq-ch,-sq);ctx.lineTo(sq,-sq+ch);
    ctx.lineTo(sq,sq-ch);ctx.lineTo(sq-ch,sq);ctx.lineTo(-sq+ch,sq);
    ctx.lineTo(-sq,sq-ch);ctx.lineTo(-sq,-sq+ch);ctx.closePath();
    ctx.fillStyle='#181818';ctx.fill();
    ctx.strokeStyle=f?col+'99':'#3a3a3a';ctx.lineWidth=2.2;ctx.stroke();
    // inner square ring
    const sq2=r*.56,ch2=r*.14;
    ctx.beginPath();
    ctx.moveTo(-sq2+ch2,-sq2);ctx.lineTo(sq2-ch2,-sq2);ctx.lineTo(sq2,-sq2+ch2);
    ctx.lineTo(sq2,sq2-ch2);ctx.lineTo(sq2-ch2,sq2);ctx.lineTo(-sq2+ch2,sq2);
    ctx.lineTo(-sq2,sq2-ch2);ctx.lineTo(-sq2,-sq2+ch2);ctx.closePath();
    ctx.strokeStyle=f?col+'33':col+'14';ctx.lineWidth=1;ctx.stroke();
    // 4 cross spokes (NSEW)
    for(const a of[0,Math.PI/2,Math.PI,Math.PI*3/2]){
      ctx.strokeStyle=f?col+'44':col+'18';ctx.lineWidth=1.1;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.22,Math.sin(a)*r*.22);ctx.lineTo(Math.cos(a)*r*.56,Math.sin(a)*r*.56);ctx.stroke();
    }
    // 4 diagonal corner accent lines
    for(const a of[Math.PI/4,Math.PI*3/4,Math.PI*5/4,Math.PI*7/4]){
      ctx.strokeStyle=f?col+'28':col+'10';ctx.lineWidth=.8;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.3,Math.sin(a)*r*.3);ctx.lineTo(Math.cos(a)*r*.58,Math.sin(a)*r*.58);ctx.stroke();
    }
    // rotating outer dashed ring
    ctx.save();ctx.rotate(t*.6);
    ctx.strokeStyle=f?col+'55':col+'1a';ctx.lineWidth=1.4;ctx.setLineDash([r*.2,r*.1]);
    ctx.beginPath();ctx.arc(0,0,r*.76,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    // 4 orbiting collector assemblies (NSEW, 상하좌우 대칭)
    ctx.save();ctx.rotate(t*0.65);
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2;
      const nx=Math.cos(a)*r*.58,ny=Math.sin(a)*r*.58;
      // radial arm
      ctx.strokeStyle=f?col+'66':col+'2a';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.24,Math.sin(a)*r*.24);ctx.lineTo(nx,ny);ctx.stroke();
      // collector pod — rectangular, aligned radially
      ctx.save();ctx.translate(nx,ny);ctx.rotate(a);
      ctx.fillStyle='#222';ctx.strokeStyle=f?col:col+'66';ctx.lineWidth=1.3;
      ctx.shadowColor=col;ctx.shadowBlur=f?16:4;
      ctx.beginPath();ctx.roundRect(-r*.13,-r*.065,r*.26,r*.13,r*.03);ctx.fill();ctx.stroke();
      ctx.shadowBlur=0;
      // side collector fins (perpendicular)
      for(const sx of[-1,1]){
        ctx.fillStyle='#1e1e1e';ctx.strokeStyle=f?col+'88':col+'44';ctx.lineWidth=1;
        ctx.beginPath();ctx.rect(sx*r*.13,-r*.1,sx*r*.07,r*.2);ctx.fill();ctx.stroke();
        ctx.strokeStyle=col+(f?'44':'18');ctx.lineWidth=.7;
        ctx.beginPath();ctx.moveTo(sx*r*.14,-r*.05);ctx.lineTo(sx*r*.18,-r*.05);ctx.stroke();
        ctx.beginPath();ctx.moveTo(sx*r*.14,r*.03);ctx.lineTo(sx*r*.18,r*.03);ctx.stroke();
      }
      // emitter core
      ctx.fillStyle=f?col:'#2a2000';ctx.shadowColor=col;ctx.shadowBlur=f?14:3;
      ctx.beginPath();ctx.arc(0,0,r*.06,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
      ctx.restore();
    }
    ctx.restore();
    // inner counter-rotating square cross
    ctx.save();ctx.rotate(-t*1.5+Math.PI/4);
    ctx.strokeStyle=f?col+'66':col+'28';ctx.lineWidth=1.3;
    for(const a of[0,Math.PI/2,Math.PI,Math.PI*3/2]){
      ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.18,Math.sin(a)*r*.18);ctx.lineTo(Math.cos(a)*r*.36,Math.sin(a)*r*.36);ctx.stroke();
    }
    ctx.strokeStyle=f?col+'44':col+'1a';ctx.lineWidth=1;ctx.setLineDash([r*.1,r*.1]);
    ctx.beginPath();ctx.arc(0,0,r*.38,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
    // central hub core
    ctx.shadowColor=col;ctx.shadowBlur=f?30:12;
    const cg=ctx.createRadialGradient(0,0,0,0,0,r*.26);
    cg.addColorStop(0,'#fff');cg.addColorStop(.28,col);cg.addColorStop(.6,col+'88');cg.addColorStop(1,col+'00');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,r*.26,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=f?col+'cc':col+'44';ctx.lineWidth=1.4;
    ctx.beginPath();ctx.arc(0,0,r*.33,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;
  }
  _dTwinHub(ctx,r,t){
    const col=this.color,f=this._firingT>0;
    const pulse=.5+.5*Math.sin(t*6);
    // === DARK BASE ===
    ctx.beginPath();ctx.arc(0,0,r*.93,0,Math.PI*2);ctx.fillStyle='#07070f';ctx.fill();
    // === 4-SEGMENT OUTER ARMOR RING ===
    for(let i=0;i<4;i++){
      const a0=i*Math.PI/2+.18,a1=(i+1)*Math.PI/2-.18;
      ctx.beginPath();ctx.arc(0,0,r*.93,a0,a1);ctx.arc(0,0,r*.77,a1,a0,true);ctx.closePath();
      ctx.fillStyle=f?'#1a1a2a':'#111120';ctx.fill();
      ctx.strokeStyle=f?col+'66':'#252530';ctx.lineWidth=1.2;ctx.stroke();
    }
    // Outer rim glow
    ctx.beginPath();ctx.arc(0,0,r*.93,0,Math.PI*2);
    ctx.strokeStyle=f?col+'cc':col+'28';ctx.lineWidth=2;
    ctx.shadowColor=col;ctx.shadowBlur=f?22:3;ctx.stroke();ctx.shadowBlur=0;
    // === 4 ROTATING VORTEX BLADES (cyclone) ===
    ctx.save();ctx.rotate(t*(f?1.4:.45));
    ctx.fillStyle=f?'#181828':'#0e0e1e';
    for(let i=0;i<4;i++){
      ctx.save();ctx.rotate(i*Math.PI/2);
      ctx.beginPath();
      ctx.arc(0,0,r*.58,-.05,Math.PI*.42);
      ctx.arc(0,0,r*.32,Math.PI*.42,-.05,true);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle=f?col+'55':col+'1e';ctx.lineWidth=1.1;ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
    // === COUNTER-ROTATING DASHED RING ===
    ctx.save();ctx.rotate(-t*1.8);
    ctx.strokeStyle=f?col+'66':col+'22';ctx.lineWidth=1.4;ctx.setLineDash([r*.12,r*.08]);
    ctx.beginPath();ctx.arc(0,0,r*.60,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
    // === 4 SENSOR PODS (rotate slowly) ===
    ctx.save();ctx.rotate(t*.38+Math.PI/4);
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2;
      const px=Math.cos(a)*r*.74,py=Math.sin(a)*r*.74;
      ctx.save();ctx.translate(px,py);
      ctx.beginPath();ctx.arc(0,0,r*.088,0,Math.PI*2);
      ctx.fillStyle='#0c0c18';ctx.fill();
      ctx.strokeStyle=f?col:'#303038';ctx.lineWidth=1.4;
      ctx.shadowColor=col;ctx.shadowBlur=f?14:2;ctx.stroke();ctx.shadowBlur=0;
      const sg=ctx.createRadialGradient(0,0,0,0,0,r*.088);
      sg.addColorStop(0,f?col+'ff':col+'55');sg.addColorStop(1,col+'00');
      ctx.fillStyle=sg;ctx.beginPath();ctx.arc(0,0,r*.088,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // === INNER VORTEX RING ===
    ctx.save();ctx.rotate(t*2.4);
    ctx.strokeStyle=f?col+'88':col+'28';ctx.lineWidth=1.6;ctx.setLineDash([r*.11,r*.07]);
    ctx.beginPath();ctx.arc(0,0,r*.40,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.restore();
    // === CENTER ENERGY CORE ===
    ctx.shadowColor=col;ctx.shadowBlur=f?48:16;
    const cg=ctx.createRadialGradient(0,0,0,0,0,r*.30);
    cg.addColorStop(0,'#fff');
    cg.addColorStop(.22,f?'#fff':col);
    cg.addColorStop(.5,col+'77');
    cg.addColorStop(1,col+'00');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,r*.30,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=f?col+'ff':col+'55';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(0,0,r*.23,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;
    // === PULSING RIM WHEN FIRING ===
    if(f){
      ctx.globalAlpha=pulse*.42;
      ctx.strokeStyle=col;ctx.lineWidth=3.5;
      ctx.shadowColor=col;ctx.shadowBlur=22;
      ctx.beginPath();ctx.arc(0,0,r*.93,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=1;ctx.shadowBlur=0;
    }
  }
}


// ═══════════════════════════════════════════════════════
// 이펙트
// ═══════════════════════════════════════════════════════
class Proj{constructor(x,y,tgt,dmg,opts){this.x=x;this.y=y;this.target=tgt;this.dmg=dmg;this.color=opts.color||'#00E5FF';this.slow=opts.slow||null;this.size=opts.size||1;this.type=opts.type||null;this.spd=420;this.alive=true;this.trail=[];}update(dt){if(!this.alive)return;if(!this.target||!this.target.alive){this.alive=false;return;}const dx=this.target.x-this.x,dy=this.target.y-this.y,d=Math.hypot(dx,dy);if(d<this.spd*dt+6){this.target.takeDmg(this.dmg);if(this.slow)this.target.applySlow(this.slow.ratio,this.slow.dur);if(this.type==='coreShooter')GS.echoQ.push({t:1.0,ore:this.target,dmg:this.dmg,col:this.color});this.alive=false;return;}this.trail.unshift({x:this.x,y:this.y});if(this.trail.length>(this.type==='coreShooter'?10:7))this.trail.pop();const sp=this.spd*dt/d;this.x+=dx*sp;this.y+=dy*sp;}draw(ctx){if(!this.alive)return;const sz=this.size,isCS=this.type==='coreShooter';const trailLen=isCS?10:7;for(let i=0;i<this.trail.length;i++){ctx.globalAlpha=(1-i/this.trail.length)*(isCS?.65:.48);ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.trail[i].x,this.trail[i].y,(isCS?5.5-i*.42:3.2-i*.3)*sz,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;if(isCS){ctx.shadowColor=this.color;ctx.shadowBlur=28;ctx.strokeStyle=this.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(this.x,this.y,8*sz,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=40;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(this.x,this.y,5.5*sz,0,Math.PI*2);ctx.fill();ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x,this.y,3.2*sz,0,Math.PI*2);ctx.fill();const fl=9*sz;ctx.strokeStyle='#fff';ctx.lineWidth=1.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(this.x-fl,this.y);ctx.lineTo(this.x+fl,this.y);ctx.stroke();ctx.beginPath();ctx.moveTo(this.x,this.y-fl);ctx.lineTo(this.x,this.y+fl);ctx.stroke();ctx.lineCap='butt';ctx.shadowBlur=0;}else{ctx.shadowColor=this.color;ctx.shadowBlur=9;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(this.x,this.y,4.2*sz,0,Math.PI*2);ctx.fill();ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x,this.y,2.6*sz,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}}}
class RingEff{constructor(x,y,r,col){this.x=x;this.y=y;this.r=r;this.col=col;this.life=this.max=.32;}update(dt){this.life-=dt;}draw(ctx){if(this.life<=0)return;const p=this.life/this.max;ctx.globalAlpha=p*.55;ctx.strokeStyle=this.col;ctx.lineWidth=2.5;ctx.shadowColor=this.col;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(this.x,this.y,this.r*(1.3-p*.3),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=p*.25;ctx.lineWidth=6;ctx.beginPath();ctx.arc(this.x,this.y,this.r*(1.3-p*.3),0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;}}
class GridFlashEff{constructor(x,y,r,col){this.x=x;this.y=y;this.r=r;this.col=col;this.life=this.max=.5;}update(dt){this.life-=dt;}draw(ctx){if(this.life<=0)return;const p=this.life/this.max;ctx.save();ctx.shadowColor=this.col;
  ctx.globalAlpha=p*.6;ctx.strokeStyle=this.col;ctx.lineWidth=3;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(this.x,this.y,this.r*(0.95+(1-p)*.05),0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=p*.35;ctx.lineWidth=1.5;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(this.x,this.y,this.r*(0.88+(1-p)*.08),0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=p*.7;ctx.lineWidth=2;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(this.x,this.y,this.r*p*.5,0,Math.PI*2);ctx.stroke();
  const hl=this.r*(0.92+(1-p)*.08);ctx.globalAlpha=p*.45;ctx.lineWidth=1.5;ctx.shadowBlur=10;ctx.beginPath();ctx.moveTo(this.x-hl,this.y);ctx.lineTo(this.x+hl,this.y);ctx.moveTo(this.x,this.y-hl);ctx.lineTo(this.x,this.y+hl);ctx.stroke();
  ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();}}
class TwinFieldEff{
  constructor(x,y,r,col){
    this.x=x;this.y=y;this.r=r;this.col=col;this.life=this.max=.55;
    this.sparks=Array.from({length:12},()=>{
      const a=Math.random()*Math.PI*2,sp=r*(.8+Math.random()*.6);
      return{a,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,s:2+Math.random()*2.5};
    });
  }
  update(dt){this.life-=dt;for(const s of this.sparks){s.life-=dt*2.2;s.vx*=.88;s.vy*=.88;}}
  draw(ctx){
    if(this.life<=0)return;
    const p=this.life/this.max;
    ctx.save();ctx.shadowColor=this.col;
    // outer expanding ring
    ctx.globalAlpha=p*.7;ctx.strokeStyle=this.col;ctx.lineWidth=3;ctx.shadowBlur=20;
    ctx.beginPath();ctx.arc(this.x,this.y,this.r*(1-p*.7),0,Math.PI*2);ctx.stroke();
    // inner expanding ring
    ctx.globalAlpha=p*.5;ctx.lineWidth=1.5;ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc(this.x,this.y,this.r*(.5+(1-p)*.35),0,Math.PI*2);ctx.stroke();
    // 8 radial beams (4 cardinal + 4 diagonal)
    ctx.globalAlpha=p*.55;ctx.lineWidth=1.5;ctx.shadowBlur=14;
    for(let i=0;i<8;i++){const a=i*Math.PI/4,rl=this.r*(1-p*.6)*(i%2===0?1:.72);ctx.beginPath();ctx.moveTo(this.x,this.y);ctx.lineTo(this.x+Math.cos(a)*rl,this.y+Math.sin(a)*rl);ctx.stroke();}
    // expanding diamond (square rotated 45°) outline
    ctx.globalAlpha=p*.45;ctx.lineWidth=1.2;ctx.shadowBlur=8;
    ctx.beginPath();
    for(let i=0;i<4;i++){const a=i*Math.PI/2-Math.PI/4,tl=this.r*(.85-p*.4);if(i===0)ctx.moveTo(this.x+Math.cos(a)*tl,this.y+Math.sin(a)*tl);else ctx.lineTo(this.x+Math.cos(a)*tl,this.y+Math.sin(a)*tl);}
    ctx.closePath();ctx.stroke();
    // outward particle sparks
    ctx.shadowBlur=12;
    for(const s of this.sparks){
      if(s.life<=0)continue;
      const sx=this.x+s.vx*(1-s.life),sy=this.y+s.vy*(1-s.life);
      ctx.globalAlpha=s.life*.8;ctx.fillStyle=s.life>.5?'#fff':this.col;
      ctx.beginPath();ctx.arc(sx,sy,s.s*s.life,0,Math.PI*2);ctx.fill();
    }
    // center flash
    ctx.globalAlpha=p*.9;ctx.shadowBlur=30;ctx.lineWidth=4;ctx.strokeStyle=this.col;
    ctx.beginPath();ctx.arc(this.x,this.y,this.r*p*.18,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.restore();
  }
}
class ZapEff{
  constructor(x1,y1,x2,y2,col){
    this.x1=x1;this.y1=y1;this.x2=x2;this.y2=y2;this.col=col;this.life=this.max=.17;this.z=0;
    const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1;
    const nx=-dy/len,ny=dx/len,sway=(Math.random()-.5)*Math.min(len*.1,12);
    this.cpx=(x1+x2)/2+nx*sway;this.cpy=(y1+y2)/2+ny*sway;
  }
  update(dt){this.life-=dt;}
  draw(ctx){
    if(this.life<=0)return;
    const p=this.life/this.max;
    ctx.save();ctx.lineCap='round';
    const arc=()=>{ctx.beginPath();ctx.moveTo(this.x1,this.y1);ctx.quadraticCurveTo(this.cpx,this.cpy,this.x2,this.y2);ctx.stroke();};
    ctx.globalAlpha=p*.5;ctx.shadowColor=this.col;ctx.shadowBlur=22;ctx.strokeStyle=this.col;ctx.lineWidth=8;arc();
    ctx.globalAlpha=p*.95;ctx.shadowBlur=10;ctx.lineWidth=2.5;arc();
    ctx.strokeStyle='#fff';ctx.shadowBlur=3;ctx.lineWidth=.85;ctx.globalAlpha=p*.8;arc();
    ctx.globalAlpha=p*.85;ctx.shadowColor=this.col;ctx.shadowBlur=18;ctx.fillStyle=this.col;ctx.beginPath();ctx.arc(this.x2,this.y2,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.shadowBlur=4;ctx.globalAlpha=p*.9;ctx.beginPath();ctx.arc(this.x2,this.y2,1.6,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=p*.65;ctx.shadowBlur=10;ctx.fillStyle=this.col;ctx.beginPath();ctx.arc(this.x1,this.y1,3,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
  }
}
class LightningEff{
  constructor(x1,y1,x2,y2,col){
    this.col=col;this.life=this.max=.26;this.z=0;
    const mk=(ax,ay,bx,by,d)=>{
      if(d===0||Math.hypot(bx-ax,by-ay)<7)return[[ax,ay],[bx,by]];
      const len=Math.hypot(bx-ax,by-ay),jit=len*.36;
      const mx=(ax+bx)/2+(Math.random()-.5)*jit,my=(ay+by)/2+(Math.random()-.5)*jit;
      return[...mk(ax,ay,mx,my,d-1),...mk(mx,my,bx,by,d-1).slice(1)];
    };
    this.branches=[{pts:mk(x1,y1,x2,y2,3),w:2.8,a:1.0}];
    const mainAng=Math.atan2(y2-y1,x2-x1),dist=Math.hypot(x2-x1,y2-y1);
    for(let i=0;i<3;i++){
      const t=.25+Math.random()*.5,bx=x1+(x2-x1)*t,by=y1+(y2-y1)*t;
      const sa=mainAng+Math.PI/2*(Math.random()>.5?1:-1)+(Math.random()-.5)*.8;
      const bl=dist*.22+Math.random()*dist*.12;
      this.branches.push({pts:mk(bx,by,bx+Math.cos(sa)*bl,by+Math.sin(sa)*bl,2),w:1.3,a:.55});
    }
  }
  update(dt){this.life-=dt;}
  draw(ctx){
    if(this.life<=0)return;
    const p=this.life/this.max;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    for(const br of this.branches){
      // outer glow
      ctx.globalAlpha=p*br.a*.45;ctx.shadowColor=this.col;ctx.shadowBlur=22;
      ctx.strokeStyle=this.col;ctx.lineWidth=br.w*2;
      ctx.beginPath();ctx.moveTo(br.pts[0][0],br.pts[0][1]);
      for(let i=1;i<br.pts.length;i++)ctx.lineTo(br.pts[i][0],br.pts[i][1]);
      ctx.stroke();
      // main bolt
      ctx.globalAlpha=p*br.a*.9;ctx.shadowBlur=10;
      ctx.strokeStyle=this.col;ctx.lineWidth=br.w;
      ctx.beginPath();ctx.moveTo(br.pts[0][0],br.pts[0][1]);
      for(let i=1;i<br.pts.length;i++)ctx.lineTo(br.pts[i][0],br.pts[i][1]);
      ctx.stroke();
      // white core
      ctx.globalAlpha=p*br.a*.7;ctx.shadowBlur=3;
      ctx.strokeStyle='#fff';ctx.lineWidth=br.w*.35;
      ctx.beginPath();ctx.moveTo(br.pts[0][0],br.pts[0][1]);
      for(let i=1;i<br.pts.length;i++)ctx.lineTo(br.pts[i][0],br.pts[i][1]);
      ctx.stroke();
    }
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
  }
}
class ExplodeEff{constructor(x,y,col){this.x=x;this.y=y;this.col=col;this.life=this.max=.55;}update(dt){this.life-=dt;}draw(ctx){if(this.life<=0)return;const p=this.life/this.max,rp=1-p;ctx.save();ctx.shadowColor=this.col;ctx.globalAlpha=p*.5;ctx.strokeStyle=this.col;ctx.lineWidth=4+rp*3;ctx.shadowBlur=24;ctx.beginPath();ctx.arc(this.x,this.y,28*rp+4,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=p*.7;ctx.lineWidth=2.5;ctx.shadowBlur=16;ctx.beginPath();ctx.arc(this.x,this.y,18*rp+2,0,Math.PI*2);ctx.stroke();const cr=7*Math.max(0,p-.35)*2.8;if(cr>0){ctx.globalAlpha=p*.9;ctx.fillStyle='#fff';ctx.shadowBlur=20;ctx.beginPath();ctx.arc(this.x,this.y,cr,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=p*.38;ctx.strokeStyle=this.col;ctx.lineWidth=1.5;ctx.shadowBlur=6;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(this.x+Math.cos(a)*(10+rp*6),this.y+Math.sin(a)*(10+rp*6));ctx.lineTo(this.x+Math.cos(a)*(24*rp+10),this.y+Math.sin(a)*(24*rp+10));ctx.stroke();}ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();}}
class LaserEff{constructor(x,y,dir,len,col){this.x=x;this.y=y;this.dir=dir;this.len=len;this.col=col;this.life=this.max=.2;}update(dt){this.life-=dt;}draw(ctx){if(this.life<=0)return;const p=this.life/this.max;ctx.globalAlpha=p*.82;ctx.shadowColor=this.col;ctx.shadowBlur=6;ctx.strokeStyle=this.col;ctx.lineWidth=1.5+p*1.5;ctx.beginPath();ctx.moveTo(this.x,this.y);ctx.lineTo(this.x+Math.cos(this.dir)*this.len,this.y+Math.sin(this.dir)*this.len);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;}}
class CoreEchoEff{
  constructor(x,y,col){
    this.x=x;this.y=y;this.col=col;this.life=this.max=.62;this.z=0;
    this.rot=Math.random()*Math.PI*2;
  }
  update(dt){this.life-=dt;}
  draw(ctx){
    if(this.life<=0)return;
    const p=this.life/this.max,e=1-p,x=this.x,y=this.y,c=this.col;
    ctx.save();ctx.shadowColor=c;
    // === PRIMARY SHOCKWAVE — thick, quadratic fade, fastest ring ===
    ctx.globalAlpha=p*p;ctx.strokeStyle=c;ctx.lineWidth=6;ctx.shadowBlur=52;
    ctx.beginPath();ctx.arc(x,y,40*e+2,0,Math.PI*2);ctx.stroke();
    // === SECONDARY RING ===
    ctx.globalAlpha=p*.82;ctx.lineWidth=3;ctx.shadowBlur=30;
    ctx.beginPath();ctx.arc(x,y,28*e+1,0,Math.PI*2);ctx.stroke();
    // === INNER RING ===
    ctx.globalAlpha=p*.62;ctx.lineWidth=2;ctx.shadowBlur=18;
    ctx.beginPath();ctx.arc(x,y,17*e,0,Math.PI*2);ctx.stroke();
    // === CORE FLASH — white→color gradient, only first 30% ===
    const fp=Math.max(0,1-e/0.3);
    if(fp>0){
      ctx.globalAlpha=fp*fp;ctx.shadowBlur=62;
      const cg=ctx.createRadialGradient(x,y,0,x,y,17);
      cg.addColorStop(0,'#fff');cg.addColorStop(.3,'#fff');cg.addColorStop(.65,c);cg.addColorStop(1,c+'00');
      ctx.fillStyle=cg;ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*2);ctx.fill();
    }
    // === 6 FAT ENERGY BOLTS — 60° spacing, offset by rot ===
    ctx.lineCap='round';ctx.strokeStyle=c;ctx.lineWidth=2.8;ctx.shadowBlur=26;
    for(let i=0;i<6;i++){
      const a=this.rot+i*Math.PI/3;
      ctx.globalAlpha=p*.92;
      const r0=7*e,r1=r0+22*e;
      ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r0,y+Math.sin(a)*r0);
      ctx.lineTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);ctx.stroke();
    }
    // === 12 THIN BEAMS — 30° spacing, alternating length ===
    ctx.lineWidth=1.4;ctx.shadowBlur=16;
    for(let i=0;i<12;i++){
      const a=this.rot+i*Math.PI/6+Math.PI/12;
      ctx.globalAlpha=p*.75;
      const r0=9*e,r1=r0+(i%2===0?14:9)*e;
      ctx.beginPath();ctx.moveTo(x+Math.cos(a)*r0,y+Math.sin(a)*r0);
      ctx.lineTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);ctx.stroke();
    }
    // === 6 SPARK DOTS — fly outward along bolt angles ===
    ctx.shadowBlur=14;
    for(let i=0;i<6;i++){
      const a=this.rot+i*Math.PI/3+Math.PI/6;
      const dist=30*e;
      ctx.globalAlpha=p*.95;
      ctx.fillStyle=e<0.3?'#fff':c;
      ctx.beginPath();ctx.arc(x+Math.cos(a)*dist,y+Math.sin(a)*dist,2.2*p+.5,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.lineCap='butt';ctx.restore();
  }
}
class BoltEff{
  constructor(x1,y1,x2,y2,col){
    this.col=col;this.life=this.max=.32;this.z=0;this.x2=x2;this.y2=y2;
    const dist=Math.hypot(x2-x1,y2-y1)||1;
    const px=-(y2-y1)/dist,py=(x2-x1)/dist;
    const n=10,pts=[{x:x1,y:y1}];
    for(let i=1;i<n;i++){const f=i/n,jit=dist*.22*Math.sin(f*Math.PI);pts.push({x:x1+(x2-x1)*f+px*(Math.random()-.5)*jit*2,y:y1+(y2-y1)*f+py*(Math.random()-.5)*jit*2});}
    pts.push({x:x2,y:y2});this.pts=pts;
    const bi=Math.floor(n*.38)+1,bp=pts[bi];
    const bAng=Math.atan2(y2-y1,x2-x1)+Math.PI/2*(Math.random()>.5?1:-1),bLen=dist*.22+Math.random()*dist*.1;
    this.branch=[{x:bp.x,y:bp.y},{x:bp.x+Math.cos(bAng)*bLen*.55+(Math.random()-.5)*dist*.05,y:bp.y+Math.sin(bAng)*bLen*.55+(Math.random()-.5)*dist*.05},{x:bp.x+Math.cos(bAng)*bLen,y:bp.y+Math.sin(bAng)*bLen}];
    this.sparks=Array.from({length:6},()=>({a:Math.random()*Math.PI*2,l:5+Math.random()*9}));
  }
  update(dt){this.life-=dt;}
  _s(ctx,pts){ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.stroke();}
  draw(ctx){
    if(this.life<=0)return;
    const p=this.life/this.max;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    ctx.shadowColor=this.col;ctx.shadowBlur=26;ctx.strokeStyle=this.col;
    ctx.globalAlpha=p*.45;ctx.lineWidth=7;this._s(ctx,this.pts);
    ctx.globalAlpha=p*.22;ctx.lineWidth=3.5;this._s(ctx,this.branch);
    ctx.shadowBlur=9;
    ctx.globalAlpha=p*.98;ctx.lineWidth=2.5;this._s(ctx,this.pts);
    ctx.globalAlpha=p*.65;ctx.lineWidth=1.4;this._s(ctx,this.branch);
    ctx.strokeStyle='#fff';ctx.shadowBlur=3;
    ctx.globalAlpha=p*.88;ctx.lineWidth=.9;this._s(ctx,this.pts);
    ctx.globalAlpha=p*.4;ctx.lineWidth=.5;this._s(ctx,this.branch);
    ctx.shadowColor=this.col;ctx.shadowBlur=22;ctx.fillStyle=this.col;
    ctx.globalAlpha=p*.9;ctx.beginPath();ctx.arc(this.x2,this.y2,4.5+p*3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.shadowBlur=5;ctx.globalAlpha=p*.95;ctx.beginPath();ctx.arc(this.x2,this.y2,2,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=this.col;ctx.lineWidth=1.1;ctx.shadowBlur=10;
    for(const s of this.sparks){ctx.globalAlpha=p*.48;ctx.beginPath();ctx.moveTo(this.x2,this.y2);ctx.lineTo(this.x2+Math.cos(s.a)*s.l*p,this.y2+Math.sin(s.a)*s.l*p);ctx.stroke();}
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
  }
}
class Particle{constructor(x,y,col,i,n){this.x=x;this.y=y;this.col=col;const a=(i/n)*Math.PI*2+Math.random()*.5,sp=48+Math.random()*88;this.vx=Math.cos(a)*sp;this.vy=Math.sin(a)*sp;this.life=this.max=.48+Math.random()*.32;this.r=2+Math.random()*3;}update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;this.vy+=80*dt;this.life-=dt;}draw(ctx){if(this.life<=0)return;const p=this.life/this.max;ctx.globalAlpha=p;ctx.fillStyle=this.col;ctx.beginPath();ctx.arc(this.x,this.y,this.r*p,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}}
class Popup{constructor(x,y,text,col,scale=1){this.x=x;this.y=y;this.text=text;this.col=col;this.life=this.max=1.6;this.vy=-36;this.scale=scale;}update(dt){this.y+=this.vy*dt;this.life-=dt;}draw(ctx){if(this.life<=0)return;const p=Math.min(1,this.life/this.max*1.5);ctx.globalAlpha=p;const fs=Math.round(13*this.scale);ctx.font=`900 ${fs}px sans-serif`;ctx.fillStyle=this.col;ctx.textAlign='center';ctx.textBaseline='middle';if(this.scale>1){ctx.shadowColor=this.col;ctx.shadowBlur=8;}ctx.fillText(this.text,this.x,this.y);ctx.shadowBlur=0;ctx.globalAlpha=1;}}

// ═══════════════════════════════════════════════════════
// 합체 시스템
// ═══════════════════════════════════════════════════════
function towerAt(r,c){return GS.towers.find(t=>t.isMega?t.megaCells.some(([tr,tc])=>tr===r&&tc===c):t.row===r&&t.col===c)||null;}
function checkMerge(){
  let found=true;
  while(found){
    found=false;
    outer:for(let r=0;r<ROWS2-1;r++){
      for(let c=0;c<COLS-1;c++){
        const tA=towerAt(r,c),tB=towerAt(r,c+1),tC=towerAt(r+1,c),tD=towerAt(r+1,c+1);
        if(!tA||!tB||!tC||!tD)continue;
        if(tA===tB||tA===tC||tA===tD||tB===tC||tB===tD||tC===tD)continue;
        if(tA.isMega||tB.isMega||tC.isMega||tD.isMega)continue;
        if(tA.tId!==tB.tId||tB.tId!==tC.tId||tC.tId!==tD.tId)continue;
        if(tA.level<4||tB.level<4||tC.level<4||tD.level<4)continue;
        if(UI.selTwr===tA||UI.selTwr===tB||UI.selTwr===tC||UI.selTwr===tD)UI.desel();
        GS.towers=GS.towers.filter(t=>t!==tA&&t!==tB&&t!==tC&&t!==tD);
        const mega=new Tower(tA.tId,r,c);
        mega.isMega=true;
        mega.megaCells=[[r,c],[r,c+1],[r+1,c],[r+1,c+1]];
        mega.level=4;
        mega.name='메가 '+TWR[tA.tId].name;
        mega.cx=R.tx(c)+TS/2;mega.cy=R.ty(r)+TS/2;
        mega.basePrice=tA.basePrice*5;
        mega.upgCost=tA.upgCost+tB.upgCost+tC.upgCost+tD.upgCost;
        GS.towers.push(mega);
        SFX.upgrade();
        UI.showBanner('합체 '+mega.name+' 가동','#FFD700');
        found=true;break outer;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
// 웨이브 생성
// ═══════════════════════════════════════════════════════
function makeWave(w){
  const pool=getPool(w),totalCount=countS(w),q=[];
  const rushes=w<=3?1:w<=20?3:w<=50?4:5;
  const perRush=Math.ceil(totalCount/rushes);
  const interval=w<=1?1.2:w<=3?0.80:w<=20?0.40:w<=50?0.32:0.25;
  const rushGap=w<=20?7:w<=50?5:4;
  let t=0;
  for(let ri=0;ri<rushes;ri++){
    const n=ri<rushes-1?perRush:totalCount-perRush*(rushes-1);
    for(let i=0;i<n;i++)q.push({type:pool[Math.floor(Math.random()*pool.length)],delay:t+i*interval});
    t+=n*interval+rushGap;
  }
  if(w%5===0&&w>0)q.push({type:'core',delay:t});
  if(w%20===0&&w>0){q.push({type:'core',delay:t+2});q.push({type:'core',delay:t+4});}
  return q;
}

// ═══════════════════════════════════════════════════════
// UI
// ═══════════════════════════════════════════════════════
window.LANG=localStorage.getItem('lang')||'ko';
function L(ko,en){return LANG==='en'?en:ko;}
const UI={
  selCard:null,selTwr:null,_cards:{},_bt:null,

  init(){this._buildGrid();this._bindEv();},

  _buildGrid(){
    const grid=document.getElementById('tgrid');grid.innerHTML='';
    for(const id of TWR_ORDER){
      const d=TWR[id];
      const card=document.createElement('div');card.className='tc';card.dataset.id=id;
      card.style.setProperty('--tc-col',d.color);
      const ic=document.createElement('canvas');ic.width=52;ic.height=52;
      this._drawIcon(ic,id);card.appendChild(ic);
      const nm=document.createElement('div');nm.className='tn';nm.textContent=d.name;
      const pr=document.createElement('div');pr.className='tp';pr.textContent='◈'+d.price;
      card.appendChild(nm);card.appendChild(pr);
      const h=()=>this._selCard(id);
      card.addEventListener('click',h);
      card.addEventListener('touchstart',e=>{e.preventDefault();h();},{passive:false});
      grid.appendChild(card);this._cards[id]=card;
    }
  },

  _drawIcon(canvas,id){
    const ctx=canvas.getContext('2d'),w=52,h=52;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='#1a1a1a';ctx.fillRect(0,0,w,h);
    const dummy=new Tower(id,0,0);
    dummy.cx=w/2;dummy.cy=h/2;dummy.angle=-Math.PI/2;dummy._animT=0;dummy._firingT=0;dummy._tDmg=0;dummy._tSpd=0;dummy._armAngle=-Math.PI/2;
    ctx.save();ctx.translate(w/2,h/2);
    const r=w*.42;
    if(id==='coreShooter')dummy._dCS(ctx,r,0,false);
    else if(id==='pixelArm')dummy._dPA(ctx,r,0,false);
    else switch(TWR[id].type){
      case'aoe':dummy._dAOE(ctx,r,0,false);break;case'focus':dummy._dSlow(ctx,r,0,false);break;case'slow':dummy._dSlow(ctx,r,0,false);break;
      case'pierce':dummy._dPierce(ctx,r,0,false);break;case'chain':dummy._dChain(ctx,r,0,false);break;
      case'pulseslow':dummy._dSlowField(ctx,r,0);break;case'scan':dummy._dScan(ctx,r,0);break;
      case'refinery':dummy._dRefinery(ctx,r,0);break;case'twinhub':dummy._dTwinHub(ctx,r,0);break;
      case'drone':dummy._dDrone(ctx,r,0);break;
    }
    ctx.restore();
  },

  _selCard(id){
    if(!GS.unlocked.has(id))return;
    if(this.selCard===id){this.selCard=null;document.querySelectorAll('.tc').forEach(c=>c.classList.remove('sel'));this._showPromo();return;}
    if(this.selTwr){this.selTwr=null;this._hideMidInfo();}
    this.selCard=id;
    document.querySelectorAll('.tc').forEach(c=>c.classList.remove('sel'));
    this._cards[id]?.classList.add('sel');
    this._showCardInfo(id);
  },

  _showPromo(){
    document.getElementById('mid-promo').style.display='flex';
    document.getElementById('mid-info').classList.remove('show');
    document.getElementById('mid-card').classList.remove('show');
    document.getElementById('mid-confirm').classList.remove('show');
  },
  _hideMidInfo(){
    document.getElementById('mid-info').classList.remove('show');
    document.getElementById('mid-promo').style.display='flex';
  },

  _showCardInfo(id){
    const d=TWR[id];
    document.getElementById('mid-promo').style.display='none';
    document.getElementById('mid-info').classList.remove('show');
    document.getElementById('mid-card').classList.add('show');
    document.getElementById('mc-name').textContent=L(d.name,d.nameEn||d.name);
    document.getElementById('mc-name').style.color=d.color;
    document.getElementById('mc-desc').textContent=L(d.desc,d.descEn||d.desc);
    let tags=`<span class="mc-tag">◈ <b>${d.price}</b></span>`;
    if(d.dmg>0)tags+=`<span class="mc-tag">${L('공정력','Power')} <b>${d.dmg}</b></span>`;
    if(d.spd>0)tags+=`<span class="mc-tag">${L('속도','Rate')} <b>${d.spd}/${L('초','s')}</b></span>`;
    tags+=`<span class="mc-tag">${L('범위','Range')} <b>${d.range}</b></span>`;
    if(d.type==='focus')tags+=`<span class="mc-tag">${L('집중 레이저','Focus Laser')}</span>`;
    if(d.type==='scan')tags+=`<span class="mc-tag">${L('광역','AoE')}</span>`;
    if(d.type==='refinery')tags+=`<span class="mc-tag">${L('수확률 보너스','Harvest Rate')}</span>`;
    if(d.type==='chain')tags+=`<span class="mc-tag">${L('연쇄','Chain')} <b>3${L('개','×')}</b></span>`;
    if(d.type==='pierce')tags+=`<span class="mc-tag">${L('관통','Pierce')} <b>8${L('개','×')}</b></span>`;
    if(d.type==='twinhub')tags+=`<span class="mc-tag">${L('광역+정지','AoE+Freeze')}</span>`;
    if(d.type==='drone')tags+=`<span class="mc-tag">${L('자율 궤도','Auto Orbit')}</span>`;
    if(id==='coreShooter')tags+=`<span class="mc-tag">${L('재공정','Echo')}</span>`;
    document.getElementById('mc-tags').innerHTML=tags;
  },

  _bindEv(){
    const cv=document.getElementById('gc');
    const getP=e=>{
      const sc=parseFloat(scaler.style.transform.replace(/[^0-9.]/g,'')||1);
      const sl=parseFloat(scaler.style.left||0),st=parseFloat(scaler.style.top||0);
      const cl=e.touches?e.touches[0]:e;
      const gx=(cl.clientX-sl)/sc,gy=(cl.clientY-st)/sc;
      // 캔버스 top=59px
      return{row:Math.floor((gy-59-MAP_OY)/TS),col:Math.floor((gx-MAP_OX)/TS)};
    };
    this._lastTapT=0;this._lastTapR=null;this._lastTapC=null;
    cv.addEventListener('click',e=>{if(!GS.running)return;const p=getP(e);this._tap(p.row,p.col);});
    cv.addEventListener('dblclick',e=>{if(!GS.running)return;const p=getP(e);this._doubleTap(p.row,p.col);});
    cv.addEventListener('touchstart',e=>{
      if(!GS.running)return;e.preventDefault();
      const p=getP(e);const now=Date.now();
      if(now-this._lastTapT<350&&this._lastTapR===p.row&&this._lastTapC===p.col){
        this._lastTapT=0;this._doubleTap(p.row,p.col);return;
      }
      this._lastTapT=now;this._lastTapR=p.row;this._lastTapC=p.col;
      this._tap(p.row,p.col);
    },{passive:false});
    cv.addEventListener('mousemove',e=>{if(!GS.running)return;const p=getP(e);GS.hovR=p.row;GS.hovC=p.col;});
    cv.addEventListener('mouseleave',()=>{GS.hovR=null;GS.hovC=null;});
  },

  _tap(row,col){
    // 설치된 유닛 클릭 시 — 새 유닛 선택 중이어도 바로 정보창 표시
    const found=towerAt(row,col);
    if(found){
      if(this.selTwr===found){this.desel();return;}
      this.selCard=null;
      document.querySelectorAll('.tc').forEach(c=>c.classList.remove('sel'));
      document.getElementById('mid-card').classList.remove('show');
      this.selTwr=found;this._showTowerInfo(found);
      return;
    }
    if(this.selCard!==null){
      if(row>=0&&row<ROWS2&&col>=0&&col<COLS){
        if(GRID[row][col]===1){this.showBanner(L('경로 위에 설치 불가','Cannot place on path'),'#EF5350');return;}
        if(towerAt(row,col)){this.showBanner(L('이미 설치됨','Already placed'),'#EF5350');return;}
        const cost=TWR[this.selCard].price;
        if(!GS.eggActive&&GS.port<cost){this.showBanner(L('포트가 부족합니다','Not enough ports'),'#EF5350');return;}
        const _r=row,_c=col;
        this._pendRow=_r;this._pendCol=_c;
        this._pendAction=()=>G.place(_r,_c);
        this._showConfirm('place',this.selCard);
      }else{
        this.desel();
      }
      return;
    }
    this.desel();
  },

  _showTowerInfo(tower){
    document.getElementById('mid-promo').style.display='none';
    document.getElementById('mid-card').classList.remove('show');
    document.getElementById('mid-info').classList.add('show');
    const d=TWR[tower.tId];
    document.getElementById('mi-name').textContent=L(d.name,d.nameEn||d.name);
    document.getElementById('mi-name').style.color=tower.color;
    const upgDone=tower.level-1;
    const gradeLabel=L(`업그레이드 ${upgDone} / 3`,`Upgrade ${upgDone} / 3`);
    const gradeCol=['#888','#EF5350','#FFD700','#00E5FF'][upgDone]||'#00E5FF';
    const lvEl=document.getElementById('mi-lvl');
    lvEl.textContent=gradeLabel;
    lvEl.style.color=gradeCol;
    let s='';
    if(d.dmg>0)s+=`<div class="tis">${L('공정력','Power')}<span>${tower.getDmg().toFixed(1)}</span></div>`;
    if(d.spd>0)s+=`<div class="tis">${L('속도','Rate')}<span>${tower.getSpd().toFixed(1)}/${L('초','s')}</span></div>`;
    s+=`<div class="tis">${L('범위','Range')}<span>${tower.getRange()}</span></div>`;
    if(tower.type==='focus')s+=`<div class="tis">${L('집중 레이저','Focus Laser')}<span>${L('지속','Active')}</span></div>`;
    if(tower.type==='refinery'){const _rhp=[2,3,4,5];const _rp=tower.isMega?25:_rhp[tower.level-1]||2;s+=`<div class="tis">${L('수확률','Harvest Rate')}<span>${_rp}% / ${L('처리','process')}</span></div>`;}
    if(tower.type==='chain'){const sd=Math.round(tower.getDmg()*0.5);s+=`<div class="tis">${L('연쇄','Chain')}<span>${L('3개','×3')}</span></div>`;s+=`<div class="tis">${L('감전','Shock')}<span>DPS ${sd} / ${L('3초','3s')}</span></div>`;}
    if(tower.type==='pierce')s+=`<div class="tis">${L('관통','Pierce')}<span>${L('8개','×8')}</span></div>`;
    if(tower.type==='twinhub'){const _tsp=[5,10,15,20];const _sp=tower.isMega?100:_tsp[tower.level-1]||5;s+=`<div class="tis">${L('정지 확률','Freeze Chance')}<span>${_sp}% / 1${L('초','s')}</span></div>`;}
    if(tower.tId==='coreShooter')s+=`<div class="tis">${L('재공정','Echo')}<span>1${L('초','s')}</span></div>`;
    document.getElementById('mi-stats').innerHTML=s;
    const bu=document.getElementById('bupg');
    if(tower.isMega||tower.level>=4){bu.disabled=true;bu.textContent=L('최대','MAX');}
    else{const c=TWR[tower.tId].upgCosts[tower.level-1];bu.disabled=!GS.eggActive&&GS.port<c;bu.textContent=`${L('업그레이드','Upgrade')} ◈${c}`;}
    document.getElementById('bsell').textContent=`${L('매각','Sell')} ◈${Math.round((tower.basePrice+tower.upgCost)*.6)}`;
  },

  desel(){
    this.selCard=null;this.selTwr=null;
    document.querySelectorAll('.tc').forEach(c=>c.classList.remove('sel'));
    this._showPromo();
  },

  upgrade(){
    const t=this.selTwr;if(!t||t.level>=4)return;
    const c=TWR[t.tId].upgCosts[t.level-1];
    if(!GS.eggActive&&GS.port<c){this.showBanner(L('포트가 부족합니다','Not enough ports'),'#EF5350');return;}
    if(!GS.eggActive)GS.port-=c;t.upgCost+=c;t.level++;
    SFX.upgrade();
    checkMerge();
    if(!GS.towers.includes(t)){this.updHUD();return;}
    this._showTowerInfo(t);this.updHUD();this.showBanner(t.name+' '+L('업그레이드','Upgraded'),'#00BCD4');
  },

  sell(){
    const t=this.selTwr;if(!t)return;
    const ref=Math.round((t.basePrice+t.upgCost)*.6);
    const tcx=t.cx,tcy=t.cy;
    this._pendAction=()=>{
      GS.port+=ref;GS.towers=GS.towers.filter(x=>x!==t);
      GS.popups.push(new Popup(tcx,tcy-18,'+◈'+ref.toLocaleString(),'#FFD700',1.4));
      this.desel();this.updHUD();this.showBanner('◈'+ref.toLocaleString()+' '+L('환급','refunded'),'#FFD700');
    };
    this._showConfirm('sell',t);
  },

  _doubleTap(row,col){
    if(this.selCard===null)return;
    if(row<0||row>=ROWS2||col<0||col>=COLS)return;
    if(GRID[row][col]===1){this.showBanner(L('경로 위에 설치 불가','Cannot place on path'),'#EF5350');return;}
    if(towerAt(row,col)){this.showBanner(L('이미 설치됨','Already placed'),'#EF5350');return;}
    const cost=TWR[this.selCard].price;
    if(!GS.eggActive&&GS.port<cost){this.showBanner(L('포트가 부족합니다','Not enough ports'),'#EF5350');return;}
    this._pendAction=null;this._pendRow=null;this._pendCol=null;this._hideConfirm();
    G.place(row,col);
    this.desel();
  },
  _pendAction:null,_pendRow:null,_pendCol:null,
  _showConfirm(type,data){
    document.getElementById('mid-info').classList.remove('show');
    document.getElementById('mid-card').classList.remove('show');
    document.getElementById('mid-promo').style.display='none';
    document.getElementById('mid-confirm').classList.add('show');
    const iconEl=document.getElementById('mconf-icon');
    if(type==='place'){
      const id=data,d=TWR[id];
      document.getElementById('mconf-name').textContent=L(d.name,d.nameEn||d.name);
      document.getElementById('mconf-name').style.color=d.color;
      document.getElementById('mconf-cost').textContent='◈ '+d.price;
      document.getElementById('mconf-msg').textContent=L('설치하시겠습니까?','Install this unit?');
      if(iconEl){
        iconEl.style.display='block';
        const ctx2=iconEl.getContext('2d');
        ctx2.clearRect(0,0,56,56);ctx2.fillStyle='#1a1a1a';ctx2.fillRect(0,0,56,56);
        const dummy=new Tower(id,0,0);
        dummy.cx=28;dummy.cy=28;dummy.angle=-Math.PI/2;dummy._animT=0;dummy._firingT=0;dummy._tDmg=0;dummy._tSpd=0;dummy._armAngle=-Math.PI/2;
        ctx2.save();ctx2.translate(28,28);
        const rr=56*.42;
        if(id==='coreShooter')dummy._dCS(ctx2,rr,0,false);
        else if(id==='pixelArm')dummy._dPA(ctx2,rr,0,false);
        else switch(d.type){
          case'aoe':dummy._dAOE(ctx2,rr,0,false);break;case'focus':case'slow':dummy._dSlow(ctx2,rr,0,false);break;
          case'pierce':dummy._dPierce(ctx2,rr,0,false);break;case'chain':dummy._dChain(ctx2,rr,0,false);break;
          case'pulseslow':dummy._dSlowField(ctx2,rr,0);break;case'scan':dummy._dScan(ctx2,rr,0);break;
          case'refinery':dummy._dRefinery(ctx2,rr,0);break;case'twinhub':dummy._dTwinHub(ctx2,rr,0);break;
          case'drone':dummy._dDrone(ctx2,rr,0);break;
        }
        ctx2.restore();
      }
    }else if(type==='sell'){
      const d=TWR[data.tId];
      const ref=Math.round((data.basePrice+data.upgCost)*.6);
      document.getElementById('mconf-name').textContent=L(d.name,d.nameEn||d.name);
      document.getElementById('mconf-name').style.color=data.color;
      document.getElementById('mconf-cost').textContent='◈ '+ref+' '+L('환급','refund');
      document.getElementById('mconf-msg').textContent=L('매각하시겠습니까?','Sell this unit?');
      if(iconEl)iconEl.style.display='none';
    }
  },
  _hideConfirm(){document.getElementById('mid-confirm').classList.remove('show');},
  _confirmAction(){
    if(!this._pendAction)return;
    const wasPlace=this._pendRow!=null;
    this._pendAction();this._pendAction=null;this._pendRow=null;this._pendCol=null;this._hideConfirm();
    if(wasPlace){this.desel();}
    else if(this.selTwr){this._showTowerInfo(this.selTwr);}
    else{this._showPromo();}
  },
  _cancelAction(){
    this._pendAction=null;this._pendRow=null;this._pendCol=null;this._hideConfirm();
    if(this.selCard!==null){this._showCardInfo(this.selCard);}
    else if(this.selTwr){this._showTowerInfo(this.selTwr);}
    else{this._showPromo();}
  },

  toggleSettings(){
    const p=document.getElementById('setpanel'),bg=document.getElementById('setbg'),btn=document.getElementById('bset');
    const show=!p.classList.contains('show');
    p.classList.toggle('show',show);bg.style.display=show?'block':'none';btn.classList.toggle('on',show);
  },
  closeSettings(){
    document.getElementById('setpanel').classList.remove('show');
    document.getElementById('setbg').style.display='none';
    document.getElementById('bset').classList.remove('on');
  },
  toggleSFX(){
    const on=SFX.toggle();
    const icon=document.getElementById('si-sfx-icon');if(icon)icon.textContent=on?'ON':'OFF';
    const el=document.getElementById('si-sfx');if(el)el.classList.toggle('active',!on);
  },
  toggleLang(){
    LANG=LANG==='ko'?'en':'ko';
    localStorage.setItem('lang',LANG);
    this.applyLang();
  },
  toggleTitleSFX(){
    const on=SFX.toggle();
    const icon=document.getElementById('si-sfx-icon');if(icon)icon.textContent=on?'ON':'OFF';
    const el=document.getElementById('si-sfx');if(el)el.classList.toggle('active',!on);
    const btn=document.getElementById('title-sfx-btn');if(btn)btn.textContent=(L('효과음','SFX'))+' '+(on?'ON':'OFF');
  },
  applyLang(){
    const ko=LANG==='ko';
    const ts=document.getElementById('title-start');if(ts)ts.innerHTML=ko?'▶ &nbsp;공장 가동 시작':'▶ &nbsp;Start Game';
    const th=document.getElementById('title-help');if(th)th.textContent=ko?'게임 방법':'How To Play';
    const tlb=document.getElementById('title-lang-btn');if(tlb)tlb.textContent=ko?'English':'한국어';
    const tsb=document.getElementById('title-sfx-btn');if(tsb)tsb.textContent=(ko?'효과음':'SFX')+' '+(SFX._on!==false?'ON':'OFF');
    const hmt=document.getElementById('help-main-title');if(hmt)hmt.textContent=ko?'게임 방법':'How To Play';
    const hc=document.getElementById('help-close');if(hc)hc.textContent=ko?'확인':'OK';
    this._buildHelpItems();
    const sip=document.getElementById('si-pause-text');if(sip)sip.textContent=ko?'일시정지':'Pause';
    const sis=document.getElementById('si-sfx-text');if(sis)sis.textContent=ko?'효과음':'SFX';
    const sih=document.getElementById('si-help-text');if(sih)sih.textContent=ko?'게임 방법':'How To Play';
    const sil=document.getElementById('si-lang-text');if(sil)sil.textContent=ko?'언어 변경':'Change Language';
    const sili=document.getElementById('si-lang-icon');if(sili)sili.textContent=ko?'KO':'EN';
    const hp=document.getElementById('hlb-port');if(hp)hp.textContent=ko?'포트':'Port';
    const hs=document.getElementById('hlb-stab');if(hs)hs.textContent=ko?'안정성':'Stability';
    const wbl=document.getElementById('wbtn-lbl');if(wbl)wbl.textContent=ko?'웨이브':'Wave';
    const abl=document.getElementById('abtn-lbl');if(abl)abl.innerHTML=ko?'자동<br>웨이브':'Auto<br>Wave';
    const pr=document.getElementById('pbtn-resume');if(pr)pr.innerHTML=ko?'▶ &nbsp;계속하기':'▶ &nbsp;Resume';
    const prs=document.getElementById('pbtn-restart');if(prs)prs.innerHTML=ko?'↩ &nbsp;다시 시작':'↩ &nbsp;Restart';
    const us=document.getElementById('unlk-sub');if(us)us.textContent=ko?'새로운 장비':'New Equipment';
    const ub=document.getElementById('unlk-btn');if(ub)ub.textContent=ko?'확인':'OK';
    if(this.selTwr)this._showTowerInfo(this.selTwr);
  },
  _buildHelpItems(){
    const ko=LANG==='ko';
    const items=ko?[
      ['설비 배치','하단에서 설비를 선택한 뒤 빈 칸을 탭해 배치한다. 웨이브를 클리어할수록 새 설비를 사용할 수 있다.'],
      ['업그레이드 · 매각','배치된 설비를 탭하면 정보창이 열린다. 최대 3회 업그레이드 가능하며 포트를 돌려받고 매각할 수 있다.'],
      ['메가 합체','같은 설비 4개를 최대 업그레이드 후 2×2로 배치하면 메가 유닛으로 합체된다.'],
      ['안정성','원석이 탈출하면 안정성이 감소한다. 0이 되면 게임 종료.'],
      ['웨이브','우측 웨이브 버튼으로 다음 파도를 시작한다. 자동 웨이브를 켜면 5초 후 자동 진행된다.'],
    ]:[
      ['Place Equipment','Select equipment from the bottom and tap an empty tile to place it. New equipment unlocks as you clear waves.'],
      ['Upgrade & Sell','Tap placed equipment to open its info panel. Upgrade up to 3 times or sell to recover ports.'],
      ['Mega Fusion','Fully upgrade 4 identical equipment and place in a 2×2 grid to fuse into a Mega Unit.'],
      ['Stability','Stability decreases when an ore escapes. Game over when it reaches 0.'],
      ['Wave','Press the wave button to start the next wave. Enable Auto Wave to start automatically after 5 seconds.'],
    ];
    const container=document.getElementById('help-items');if(!container)return;
    container.innerHTML=items.map(([name,desc],i)=>`<div class="hi"><div class="hi-num">${String(i+1).padStart(2,'0')}</div><div class="hi-body"><div class="hi-name">${name}</div><div class="hi-desc">${desc}</div></div></div>`).join('');
  },
  showHelp(){
    this.closeSettings();
    document.getElementById('helpovly').classList.add('show');
  },
  closeHelp(){
    document.getElementById('helpovly').classList.remove('show');
  },

  updHUD(){
    document.getElementById('hport').textContent=GS.eggActive?'∞':Math.floor(GS.port).toLocaleString();
    const st=Math.floor(GS.stability);
    const stEl=document.getElementById('hstab');stEl.textContent=st;
    stEl.className='hv'+(st<=25?' d':st<=50?' w':' g');
    document.getElementById('sfill').style.width=st+'%';
    document.getElementById('sfill').style.background=st>50?'#FF4500':st>25?'#FF5722':'#BF360C';
    const tt=Math.floor(GS.time);
    document.getElementById('htime').textContent=`${Math.floor(tt/60)}:${String(tt%60).padStart(2,'0')}`;
    document.getElementById('hwave').textContent='W'+GS.wave;
    document.getElementById('wnum').textContent='→ W'+(GS.wave+1);
    for(const[id,el]of Object.entries(this._cards)){
      const locked=!GS.unlocked.has(id);
      el.classList.toggle('locked-card',locked);
      el.classList.toggle('dis',!locked&&!GS.eggActive&&GS.port<TWR[id].price);
      let li=el.querySelector('.lock-ico');
      if(locked&&!li){li=document.createElement('div');li.className='lock-ico';el.appendChild(li);}
      else if(!locked&&li){li.remove();}
    }
    document.getElementById('wbtn').classList.toggle('dis',GS.waveActive);
    if(this.selTwr&&document.getElementById('mid-info').classList.contains('show'))
      this._showTowerInfo(this.selTwr);
  },

  showUnlock(id,onDone){
    const d=TWR[id];
    const ovly=document.getElementById('unlkovly');
    document.getElementById('unlk-name').textContent=d.name;
    document.getElementById('unlk-name').style.color='#ffffff';
    document.getElementById('unlk-price').textContent='◈ '+d.price;
    document.getElementById('unlk-desc').textContent=d.desc;
    const ic=document.getElementById('unlk-icon');
    const ctx=ic.getContext('2d');
    ctx.clearRect(0,0,96,96);ctx.fillStyle='#1a1a1a';ctx.fillRect(0,0,96,96);
    const dummy=new Tower(id,0,0);
    dummy.cx=48;dummy.cy=48;dummy.angle=-Math.PI/2;dummy._animT=0;dummy._firingT=0;dummy._tDmg=0;dummy._tSpd=0;dummy._armAngle=-Math.PI/2;
    ctx.save();ctx.translate(48,48);
    const r=96*.42;
    if(id==='coreShooter')dummy._dCS(ctx,r,0,false);
    else if(id==='pixelArm')dummy._dPA(ctx,r,0,false);
    else switch(d.type){
      case'aoe':dummy._dAOE(ctx,r,0,false);break;case'focus':dummy._dSlow(ctx,r,0,false);break;
      case'pierce':dummy._dPierce(ctx,r,0,false);break;case'chain':dummy._dChain(ctx,r,0,false);break;
      case'pulseslow':dummy._dSlowField(ctx,r,0);break;case'scan':dummy._dScan(ctx,r,0);break;
      case'refinery':dummy._dRefinery(ctx,r,0);break;case'twinhub':dummy._dTwinHub(ctx,r,0);break;
      case'drone':dummy._dDrone(ctx,r,0);break;
    }
    ctx.restore();
    ovly.classList.add('show');
    const gf=document.getElementById('unlk-gauge-fill');
    gf.style.background='#ffffff';
    gf.style.width='100%';
    if(this._unlkIv)clearInterval(this._unlkIv);
    let elapsed=0;const total=20;
    this._unlkIv=setInterval(()=>{
      elapsed+=0.1;const pct=Math.max(0,(1-elapsed/total)*100);
      gf.style.width=pct+'%';
      if(elapsed>=total){clearInterval(this._unlkIv);dismiss();}
    },100);
    const dismiss=()=>{clearInterval(this._unlkIv);ovly.classList.remove('show');UI.updHUD();onDone&&onDone();};
    const btn=document.getElementById('unlk-btn');
    btn.onclick=e=>{e.stopPropagation();dismiss();};
  },

  showBanner(text,col){
    const el=document.getElementById('banner');
    const c=col||'#ffffff';
    el.textContent=text;el.style.color='#fff';el.style.setProperty('--bc',c);
    el.classList.remove('show');
    requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('show')));
    clearTimeout(this._bt);this._bt=setTimeout(()=>el.classList.remove('show'),2400);
  },

  showResult(){
    const ko=LANG==='ko';
    const isWin=GS.wave>=100;
    const el=document.getElementById('clrovly');el.style.display='block';
    // Best record tracking
    const bw=+localStorage.getItem('ieg_bw')||0,bp=+localStorage.getItem('ieg_bp')||0;
    if(GS.wave>bw)localStorage.setItem('ieg_bw',GS.wave);
    if(GS.totalPort>bp)localStorage.setItem('ieg_bp',GS.totalPort);
    // Score = tower assets + current port
    const towerScore=GS.towers.reduce((s,tw)=>s+tw.basePrice+tw.upgCost,0);
    const score=towerScore+Math.max(0,Math.floor(GS.port));
    document.getElementById('clr-eyebrow').textContent='';
    if(GS.eggActive){
      document.getElementById('clr-score-lbl').textContent=ko?'포트 무한 사용':'INFINITE PORT';
      document.getElementById('clr-score').textContent='∞';
    }else{
      document.getElementById('clr-score-lbl').textContent='SCORE';
      document.getElementById('clr-score').textContent=score.toLocaleString();
    }
    document.getElementById('clr-wave').textContent=`W${GS.wave}`;
    // Badges
    let badges='';
    if(isWin)badges+=`<div class="clr-badge clear">CLEAR</div>`;
    document.getElementById('clr-badges').innerHTML=badges;
    // Stats
    const t=Math.floor(GS.time);
    const timeStr=ko?`${Math.floor(t/60)}분 ${t%60}초`:`${Math.floor(t/60)}m ${t%60}s`;
    document.getElementById('clr-stats').innerHTML=`
      <div class="clr-row"><span class="clr-lbl">${ko?'운영 시간':'Operation Time'}</span><span class="clr-val">${timeStr}</span></div>
      <div class="clr-row"><span class="clr-lbl">${ko?'장비 자산':'Tower Assets'}</span><span class="clr-val">◈ ${towerScore.toLocaleString()}</span></div>
      <div class="clr-row"><span class="clr-lbl">${ko?'포트 잔액':'Port Balance'}</span><span class="clr-val">${GS.eggActive?'∞':'◈ '+Math.floor(GS.port).toLocaleString()}</span></div>
    `;
    document.getElementById('clr-btn').innerHTML=ko?'↩ &nbsp;재가동':'↩ &nbsp;Restart';
    // Background canvas
    const cv=document.getElementById('clr-canvas');cv.width=480;cv.height=900;
    const cx=cv.getContext('2d');
    const bg=cx.createRadialGradient(240,380,20,240,380,440);
    bg.addColorStop(0,'#111118');bg.addColorStop(.6,'#08080e');bg.addColorStop(1,'#000');
    cx.fillStyle=bg;cx.fillRect(0,0,480,900);
    cx.strokeStyle='#ffffff07';cx.lineWidth=1;
    for(let x=0;x<480;x+=32){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,900);cx.stroke();}
    for(let y=0;y<900;y+=32){cx.beginPath();cx.moveTo(0,y);cx.lineTo(480,y);cx.stroke();}
    const pts=Array.from({length:60},()=>({
      x:Math.random()*480,y:Math.random()*900,
      vx:(Math.random()-.5)*.8,vy:-(Math.random()*1.0+.3),
      r:Math.random()*2+.4,life:.3+Math.random()*.7,
      col:Math.random()<.6?'#ffffff':Math.random()<.5?'#aaaaaa':'#555'
    }));
    const tick=()=>{
      if(document.getElementById('clrovly').style.display==='none')return;
      cx.fillStyle='#00000018';cx.fillRect(0,0,480,900);
      for(const p of pts){
        p.x+=p.vx;p.y+=p.vy;p.life-=.004;
        if(p.life<=0||p.y<-10){p.x=Math.random()*480;p.y=910;p.life=.4+Math.random()*.6;}
        cx.globalAlpha=p.life*.65;cx.fillStyle=p.col;
        cx.beginPath();cx.arc(p.x,p.y,p.r,0,Math.PI*2);cx.fill();
      }
      cx.globalAlpha=1;requestAnimationFrame(tick);
    };tick();
  },
};

// ═══════════════════════════════════════════════════════
// 잠금 해제
// ═══════════════════════════════════════════════════════
function checkUnlocks(w,onDone){
  const idx=Math.floor(w/2)-1;
  if(idx>=0&&idx<UNLOCK_ORDER.length){
    const id=UNLOCK_ORDER[idx];
    if(!GS.unlocked.has(id)){
      GS.unlocked.add(id);
      UI.showUnlock(id,onDone);
      return;
    }
  }
  onDone&&onDone();
}

// ═══════════════════════════════════════════════════════
// 게임 루프
// ═══════════════════════════════════════════════════════
const G={
  _lastTs:0,_lhSec:-1,_eggWindow:false,_realTime:0,

  init(){R.init();UI.init();},

  start(){
    G._doStart();
  },
  _doStart(){
    document.getElementById('sovly').style.display='none';
    GS.running=true;UI.updHUD();
    this._lastTs=performance.now();
    requestAnimationFrame(ts=>this._loop(ts));
  },

  _loop(ts){
    requestAnimationFrame(t=>this._loop(t));
    const raw=Math.min((ts-this._lastTs)/1000,.05);this._lastTs=ts;
    if(!GS.running)return;
    this._realTime=(this._realTime||0)+raw;
    this._eggWindow10=(this._realTime>=9.7&&this._realTime<=10.3);
    this._eggWindow20=(this._realTime>=19.7&&this._realTime<=20.3);
    this._eggWindow30=(this._realTime>=29.7&&this._realTime<=30.3);
    const dt=GS.paused?0:raw*GS.speed;
    this._upd(dt);R.render(ts/1000);
  },

  _upd(dt){
    if(dt<=0)return;GS.time+=dt;    if(GS.waveActive&&GS.oreQ.length>0){
      GS.spawnT+=dt;
      while(GS.oreQ.length>0&&GS.spawnT>=GS.oreQ[0].delay)GS.ores.push(new Ore(GS.oreQ.shift().type,GS.wave));
    }
    if(GS.autoActive){
      GS.autoTimer-=dt;const cd=document.getElementById('acd');
      if(GS.autoTimer>0)cd.textContent=`다음까지 ${Math.ceil(GS.autoTimer)}초`;
      else{cd.textContent='';GS.autoActive=false;this.nextWave();}
    }
    for(const o of GS.ores)o.update(dt);
    for(let i=GS.ores.length-1;i>=0;i--){
      const o=GS.ores[i];
      if(o.escaped){GS.stability-=o.escapeDmg;GS.popups.push(new Popup(R.tx(EXIT.c),R.ty(EXIT.r),'-'+o.escapeDmg,'#EF5350'));GS.ores.splice(i,1);UI.updHUD();if(GS.stability<=0){GS.stability=0;GS.running=false;SFX.gameOver();UI.showResult();return;}}
    }
    sweepArr(GS.ores,o=>o.alive);
    if(GS.waveActive&&GS.oreQ.length===0&&GS.ores.length===0){
      GS.waveActive=false;
      // 클리어 보상: 초반엔 넉넉히, 후반엔 크게
      const bonus=Math.floor(100+GS.wave*55+Math.pow(GS.wave,1.5)*2.0);
      GS.port+=bonus;GS.totalPort+=bonus;GS.portHist.push({t:GS.time,v:bonus});
      SFX.clear();
      if(GS.wave>=100){GS.running=false;SFX.victory();UI.showResult();return;}
      UI.showBanner(`W${GS.wave} 클리어 +◈${bonus.toLocaleString()}`,'#FF4500');UI.updHUD();
      checkUnlocks(GS.wave,()=>{if(GS.autoWave){GS.autoActive=true;GS.autoTimer=5;}});
    }
    for(const t of GS.towers)t.update(dt,GS.ores);
    for(const p of GS.projs)p.update(dt);sweepArr(GS.projs,p=>p.alive);
    for(let i=GS.echoQ.length-1;i>=0;i--){const e=GS.echoQ[i];e.t-=dt;if(e.t<=0){if(e.ore.alive){e.ore.takeDmg(e.dmg,'single');GS.effects.push(new CoreEchoEff(e.ore.x,e.ore.y,e.col));SFX.shoot('coreShooter');}GS.echoQ.splice(i,1);}}
    for(const p of GS.particles)p.update(dt);sweepArr(GS.particles,p=>p.life>0);
    for(const p of GS.popups)p.update(dt);sweepArr(GS.popups,p=>p.life>0);
    for(const e of GS.effects)e.update(dt);sweepArr(GS.effects,e=>e.life>0);
    const sec=Math.floor(GS.time);if(sec!==this._lhSec){this._lhSec=sec;UI.updHUD();}
  },

  nextWave(){
    if(!GS.running||GS.waveActive||GS.wave>=100)return;
    GS.autoActive=false;document.getElementById('acd').textContent='';
    GS.wave++;GS.oreQ=makeWave(GS.wave);GS.spawnT=0;GS.waveActive=true;
    SFX.waveStart();
    UI.updHUD();UI.showBanner(`웨이브 ${GS.wave} 시작`,'#FF4500');
  },

  place(row,col){
    if(!GS.running)return;const id=UI.selCard;if(!id)return;
    if(GRID[row][col]===1){UI.showBanner('경로 위에 설치 불가','#EF5350');return;}
    if(towerAt(row,col)){UI.showBanner('이미 설치됨','#EF5350');return;}
    const cost=TWR[id].price;
    if(!GS.eggActive&&GS.port<cost){UI.showBanner('포트가 부족합니다','#EF5350');return;}
    if(!GS.eggActive)GS.port-=cost;
    GS.towers.push(new Tower(id,row,col));SFX.place();UI.updHUD();UI.showBanner(TWR[id].name+' 설치','#00BCD4');
    checkMerge();
  },

  togglePause(){
    if(!GS.running)return;
    if(GS.paused){this.resume();}else{this._doPause();}
  },
  _doPause(){
    GS.paused=true;
    document.getElementById('pause-wnum').textContent=GS.wave;
    document.getElementById('pauseovly').classList.add('show');
    UI.closeSettings();
    // 게임 조작 차단
    document.getElementById('gc').style.pointerEvents='none';
    document.getElementById('bot').style.pointerEvents='none';
  },
  resume(){
    GS.paused=false;
    document.getElementById('pauseovly').classList.remove('show');
    document.getElementById('gc').style.pointerEvents='';
    document.getElementById('bot').style.pointerEvents='';
  },
  toggleSpeed(){GS.speed=GS.speed===1?2:1;const btn=document.getElementById('bspd');if(btn){btn.textContent='×'+GS.speed;btn.classList.toggle('on',GS.speed===2);}},
  toggleAuto(){
    GS.autoWave=!GS.autoWave;document.getElementById('abtn').classList.toggle('on',GS.autoWave);
    if(!GS.autoWave){GS.autoActive=false;document.getElementById('acd').textContent='';}
    UI.showBanner('자동 웨이브 '+(GS.autoWave?'켜짐 (5초)':'꺼짐'),GS.autoWave?'#00E5FF':'#5a7898');
  },

  tryEgg(){
    const _unlock=()=>{
      GS.eggActive=true;GS.port=999999999;
      for(const id of TWR_ORDER)GS.unlocked.add(id);
      const ico=document.getElementById('hport-ico');
      if(ico){ico.style.color='#FFD700';ico.style.textShadow='0 0 12px #FFD700';}
      UI.updHUD();
    };
    // 10초: 포트 무한 + 전 유닛 해금
    if(GS.running&&this._eggWindow10){
      _unlock();UI.showBanner('∞ 포트 무한 활성화','#FFD700');return;
    }
    // 20초: 100웨이브 즉시 클리어
    if(this._eggWindow20){
      GS.wave=100;GS.waveActive=false;GS.oreQ=[];GS.ores=[];
      GS.running=false;GS.paused=false;
      document.getElementById('pauseovly').classList.remove('show');
      SFX.victory();UI.showResult();return;
    }
    // 30초: 포트 무한 + 전 유닛 해금 + W49 완료 (다음 웨이브 W50)
    if(GS.running&&this._eggWindow30){
      _unlock();
      GS.ores=[];GS.projs=[];GS.oreQ=[];GS.echoQ=[];GS.waveActive=false;
      GS.wave=49;
      UI.showBanner('W50 도전 준비 — 설비 배치 후 웨이브 시작','#FF4500');return;
    }
  },
};

window.addEventListener('load',()=>{G.init();UI._showPromo();UI.updHUD();UI.applyLang();});