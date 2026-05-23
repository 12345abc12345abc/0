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
  _ctx:null,_on:true,_master:null,
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
    }
  },

  // ── 원석 처치음 ─────────────────────────────────
  hit(isBig=false){
    if(!this._on)return;
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
  normal:  {name:'일반 원석',   color:'#78909C',hp:18,  spd:44, reward:8,   dmg:2,  grade:1},
  fast:    {name:'고속 원석',   color:'#FFB300',hp:10,  spd:90, reward:11,  dmg:2,  grade:1},
  multi:   {name:'다중 원석',   color:'#00E5FF',hp:35,  spd:46, reward:20,  dmg:3,  grade:2,special:'split'},
  dense:   {name:'고밀도 원석', color:'#7E57C2',hp:110, spd:26, reward:28,  dmg:5,  grade:3},
  pure:    {name:'고순도 원석', color:'#FFD54F',hp:28,  spd:44, reward:45,  dmg:4,  grade:2},
  unstable:{name:'불안정 원석', color:'#76FF03',hp:48,  spd:74, reward:34,  dmg:10, grade:2,special:'bigdmg'},
  compres: {name:'압축 원석',   color:'#E040FB',hp:380, spd:20, reward:70,  dmg:8,  grade:3},
  core:    {name:'코어 원석',   color:'#B3E5FC',hp:1800,spd:12, reward:250, dmg:20, grade:4,special:'boss'},
};

const TWR_ORDER=['pixelArm','coreShooter','twinHub','scanner','magnetCannon','refinery','laserGrid','chainBolt','drone','plasmaCutter'];
const UNLOCK_ORDER=['coreShooter','twinHub','scanner','magnetCannon','refinery','laserGrid','chainBolt','drone','plasmaCutter'];
const TWR={
  pixelArm:    {name:'픽셀 로봇암',   price:100,  color:'#2196F3',type:'single',   dmg:40,  spd:1.1,  range:2.0, upgMult:20.0, desc:'단관절 산업용 로봇암. 컨베이어 선두 원석을 그리퍼로 직접 포착해 고출력 단발 공정을 수행한다. 처리 간격은 길지만 단발 공정력이 최고 수준이다.'},
  coreShooter: {name:'코어 슈터',     price:260,  color:'#E53935',type:'single',   dmg:28,  spd:2.2,  range:3.0, upgMult:7.5,  desc:'단열 중구경 공정포. 라인 선두 원석을 빠른 주기로 연속 타격한다. 안정적인 처리 속도와 넓은 사거리로 초반 라인을 지탱한다.'},
  twinHub:     {name:'트윈 컨트롤러', price:380,  color:'#9C27B0',type:'twinhub',  dmg:8,   spd:0,    range:1.0, upgMult:5.1,  desc:'궤도 제어 구체 2개가 반경 내를 선회하며 원석과 물리 접촉한다. 접촉된 원석은 1초간 이송 속도 50% 감소. 강화 시 감속 지속 시간 증가.'},
  scanner:     {name:'비전 스캐너',   price:560,  color:'#00C853',type:'scan',     dmg:220, spd:0.25, range:5.0, upgMult:3.4,  desc:'전방위 광학 스캐너. 광역 범위를 분석해 체류 질량이 가장 높은 원석을 선별 정밀 타격한다. 4초 주기의 고출력 단발 공정 설비.'},
  magnetCannon:{name:'포인트 버스터', price:850,  color:'#FF6D00',type:'focus',    dmg:32,  spd:0,    range:5.0, upgMult:2.2,  desc:'입자 가속 빔을 라인 최후방 원석에 지속 조사한다. 탈출 직전 원석을 철저히 제거해 공장 유출을 차단하는 후방 방어 설비.'},
  refinery:    {name:'포트 허브',     price:1150, color:'#FFD700',type:'refinery', dmg:35,  spd:1.2,  range:2.0, upgMult:1.55, desc:'전자기 펄스로 원석을 직접 처리한다. 공정 완료 시 일반 유닛 대비 20% 추가 포트를 회수하는 수익형 설비.'},
  laserGrid:   {name:'레이저 그리드', price:1700, color:'#F44336',type:'aoe',      dmg:30,  spd:1.0,  range:3.0, upgMult:1.0,  desc:'구역 내 격자 레이저망을 1초 주기로 전개해 범위 내 모든 원석을 동시 처리한다. 원석 밀집 구간에서 처리 효율이 극대화된다.'},
  chainBolt:   {name:'체인 볼트',     price:2500, color:'#03A9F4',type:'chain',    dmg:38,  spd:1.0,  range:3.0, upgMult:0.62, desc:'연쇄 방전으로 원석 3개를 순차 타격하고 3초간 지속 분해 반응을 유발한다. 다수 원석이 밀집한 구간에서 폭발적인 처리 효율을 낸다.'},
  drone:       {name:'레이스 드론',   price:3400, color:'#00E5CC',type:'drone',    dmg:110, spd:0.6,  range:3.0, upgMult:0.40, desc:'무인 공정 드론이 설비 반경 내를 자율 선회하며 원석을 탐지해 정밀 레이저로 처리한다. 고정 설비의 사각지대를 실시간으로 커버한다.'},
  plasmaCutter:{name:'플라즈마 커터', price:4500, color:'#EEEEEE',type:'pierce',   dmg:14,  spd:6.0,  range:5.0, upgMult:0.26, desc:'극고속 플라즈마 빔을 1초에 6회 연속 발사해 일직선상의 원석을 최대 8개까지 관통 처리한다. 라인 밀집 시 처리 효율이 폭증한다.'},
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

// S자 경로 — 시작: 좌상단(0,0), 종료: 우하단(12,13)
// 위아래 설치영역 2줄, 중앙 설치영역 3줄씩
for(let r=0;r<=2;r++){mk(r,0);ap(r,0);}         // 아래로
for(let c=0;c<=13;c++){mk(2,c);ap(2,c);}         // 오른쪽으로
for(let r=2;r<=6;r++){mk(r,13);ap(r,13);}        // 아래로
for(let c=13;c>=0;c--){mk(6,c);ap(6,c);}        // 왼쪽으로
for(let r=6;r<=10;r++){mk(r,0);ap(r,0);}         // 아래로
for(let c=0;c<=13;c++){mk(10,c);ap(10,c);}       // 오른쪽으로
for(let r=10;r<=12;r++){mk(r,13);ap(r,13);}      // 아래로

const ENTRY={r:0,c:0},EXIT={r:12,c:13};

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
  // W10:≈1.36 W20:≈2.06 W30:≈4.86 W40:≈11.36 W50:≈26.36 W60:≈61 W70:≈141 W80:≈261 W90:≈441 W100:≈661
  if(w<=1) return 1.0;
  if(w<=10)return 1.0+(w-1)*0.04;
  if(w<=20)return hpS(10)+(w-10)*0.07;
  if(w<=30)return hpS(20)+(w-20)*0.28;
  if(w<=40)return hpS(30)+(w-30)*0.65;
  if(w<=50)return hpS(40)+(w-40)*1.50;
  if(w<=60)return hpS(50)+(w-50)*3.5;
  if(w<=70)return hpS(60)+(w-60)*8.0;
  if(w<=80)return hpS(70)+(w-70)*12.0;
  if(w<=90)return hpS(80)+(w-80)*18.0;
  return hpS(90)+(w-90)*22.0;
}
function spdS(w){
  if(w<=20)return 1+Math.min(w-1,19)*0.008;
  if(w<=50)return spdS(20)+(w-20)*0.018;
  if(w<=80)return spdS(50)+(w-50)*0.04;
  return spdS(80)+(w-80)*0.08;
}
function countS(w){
  if(w<=3) return 6+w*2;
  if(w<=20)return Math.floor(14+w*2.2);
  if(w<=50)return Math.floor(58+(w-20)*3.8);
  if(w<=75)return Math.floor(172+(w-50)*5.5);
  return Math.floor(309+(w-75)*9.5);
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
  hovR:null,hovC:null,eggActive:false,
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
    if(GS.hovR!==null&&UI.selCard!==null){
      const r=GS.hovR,c2=GS.hovC;
      if(r>=0&&r<ROWS2&&c2>=0&&c2<COLS){
        const ok=GRID[r][c2]===0&&!towerAt(r,c2);
        const px=MAP_OX+c2*TS,py=MAP_OY+r*TS;
        ctx.fillStyle=ok?'rgba(255,255,255,.12)':'rgba(239,83,80,.12)';ctx.fillRect(px,py,TS,TS);
        ctx.strokeStyle=ok?'#ffffff':'#EF5350';ctx.lineWidth=2;ctx.strokeRect(px+1,py+1,TS-2,TS-2);
        if(ok&&TWR[UI.selCard]){const _d=TWR[UI.selCard];this.drawRange(ctx,this.tx(c2),this.ty(r),_d.range,_d.color);}
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
    this._twinSlowT=0;this._twinImmuneT=0;this._lastDmgType=null;
    this.flashT=0;this.spin=Math.random()*Math.PI*2;
    const sz=[0,TS*.21,TS*.26,TS*.32,TS*.40];this.radius=sz[this.grade]||TS*.21;
  }
  update(dt){
    if(!this.alive)return;
    if(this.freezeTimer>0){this.freezeTimer-=dt;if(this.freezeTimer<=0)this.freezeImmune=1.0;this.flashT=.08;return;}
    if(this.freezeImmune>0)this.freezeImmune-=dt;
    if(this.slowTimer>0){this.slowTimer-=dt;if(this.slowTimer<=0){this.spd=this.baseSpd;this._sR=0;this.freezeImmune=3.0;}}
    if(this._twinSlowT>0){this._twinSlowT-=dt;if(this._twinSlowT<=0)this._twinImmuneT=1.0;}
    if(this._twinImmuneT>0)this._twinImmuneT-=dt;
    if(this.ampTimer>0)this.ampTimer-=dt;if(this.flashT>0)this.flashT-=dt;
    if(this.shockTimer>0){
      this.shockTimer-=dt;
      let sd=this.shockDps*dt;if(this.ampTimer>0)sd*=(1+this.ampRatio);
      this.hp-=sd;this.flashT=.04;
      if(this.hp<=0&&this.alive){this.alive=false;this._die();}
      if(this.shockTimer<=0)this.shockDps=0;
    }
    let mv=this.spd*dt*(this._twinSlowT>0?0.5:1);
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
    const pr=this._lastDmgType==='refinery'?Math.round(this.reward*1.2):this.reward;
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
    if(this._twinSlowT>0){ctx.globalAlpha=.55;ctx.strokeStyle='#CE93D8';ctx.lineWidth=1.8;ctx.shadowColor='#9C27B0';ctx.shadowBlur=7;ctx.setLineDash([3,4]);ctx.beginPath();ctx.arc(0,0,r*1.22,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;}
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
    this._twinAngles=[0,Math.PI,Math.PI*2/5,Math.PI*4/5,Math.PI*6/5];this._twin_hcd=[0,0,0,0,0];this._lastNOrbs=0;
    this.isMega=false;this.megaCells=[];
  }
  _lm(){return LVL[this.level-1].mult;}
  _megaMult(){return this.isMega?5:1;}
  _eff(e){e.z=this.basePrice*(this.isMega?4:1);const z=e.z,arr=GS.effects;let i=arr.length;while(i>0&&(arr[i-1].z||0)>z)i--;arr.splice(i,0,e);return e;}
  _calcTwin(){this._tDmg=0;this._tSpd=0;}
  getDmg(){return TWR[this.tId].dmg*(1+this._tDmg)*this._lm()*this._megaMult();}
  getSpd(){return TWR[this.tId].spd*(1+this._tSpd)*this._lm();}
  getRange(){return TWR[this.tId].range;}
  update(dt,ores){
    this._animT+=dt;this._calcTwin();if(this._firingT>0)this._firingT-=dt;
    const tp=this.type;
    if(tp==='pulseslow'){
      const rng=this.getRange()*TS;const rng2=rng*rng;const cx0=this.cx,cy0=this.cy;
      const hasOre=ores.some(o=>{if(!o.alive)return false;const _x=o.x-cx0,_y=o.y-cy0;return _x*_x+_y*_y<=rng2;});
      if(hasOre){
        this._pulseT=(this._pulseT||0)+dt;
        const iv=2.2/Math.max(.5,this._lm());
        if(this._pulseT>=iv){
          this._pulseT=0;
          const sr=Math.min(.45*this._lm()*this._megaMult(),.92);
          for(const o of ores){if(!o.alive)continue;const _x=o.x-cx0,_y=o.y-cy0;if(_x*_x+_y*_y>rng2)continue;if(Math.random()<.55)o.applySlow(sr,2.2);}
          this._eff(new RingEff(this.cx,this.cy,rng,this.color));
        }
      }
      return;
    }
    if(tp==='scan'){if(this.cooldown>0){this.cooldown-=dt*this.getSpd();return;}const rng=this.getRange()*TS;const rng2=rng*rng;const cx0=this.cx,cy0=this.cy;let best=null,bestHp=-1;for(const o of ores){if(!o.alive)continue;const _x=o.x-cx0,_y=o.y-cy0;if(_x*_x+_y*_y>rng2)continue;if(o.hp>bestHp){bestHp=o.hp;best=o;}}if(!best)return;this.angle=Math.atan2(best.y-this.cy,best.x-this.cx);best.takeDmg(this.getDmg(),'scan');this._eff(new ExplodeEff(best.x,best.y,this.color));for(let i=0;i<8;i++)GS.particles.push(new Particle(best.x,best.y,this.color,i,8));this.cooldown=1;this._firingT=.45;SFX.shoot('aoe');return;}
    if(tp==='twinhub'){
      const orbSpd=Math.PI*2/5,dr=this.getRange()*TS,hitR=TS*.36;
      const baseDur=[1.0,1.33,1.67,2.0][this.level-1]||1.0;
      const slowDur=this.isMega?baseDur*2.5:baseDur;
      const nOrbs=2;
      // both orbs rotate same direction (CCW)
      this._twinAngles[0]+=dt*orbSpd;
      this._twinAngles[1]+=dt*orbSpd;
      for(let i=0;i<nOrbs;i++){
        if(this._twin_hcd[i]>0){this._twin_hcd[i]-=dt;continue;}
        const ox=this.cx+Math.cos(this._twinAngles[i])*dr,oy=this.cy+Math.sin(this._twinAngles[i])*dr;
        for(const o of ores){
          if(!o.alive)continue;
          if(o._twinImmuneT>0||o._twinSlowT>0)continue;
          const _hr=hitR+o.radius;if((o.x-ox)*(o.x-ox)+(o.y-oy)*(o.y-oy)<_hr*_hr){
            o.takeDmg(this.getDmg(),'twinhub');
            o._twinSlowT=slowDur;
            this._twin_hcd[i]=0.35;this._firingT=.22;
            this._eff(new RingEff(ox,oy,hitR*2.5,this.color));
            break;
          }
        }
      }
      return;
    }
    if(tp==='refinery'){if(this.cooldown>0){this.cooldown-=dt*this.getSpd();return;}const tgt=this._findTgt(ores);if(!tgt)return;this.angle=Math.atan2(tgt.y-this.cy,tgt.x-this.cx);tgt.takeDmg(this.getDmg(),'refinery');this._eff(new ZapEff(this.cx,this.cy,tgt.x,tgt.y,this.color));this.cooldown=1;this._firingT=.22;SFX.shoot('refinery');return;}
    if(tp==='drone'){
      this._droneAngle+=dt*(0.55+this._lm()*.08);
      const rng=this.getRange()*TS;const rng2=rng*rng;const cx0=this.cx,cy0=this.cy;
      const orbitR=rng*0.62;
      const drX=cx0+Math.cos(this._droneAngle)*orbitR,drY=cy0+Math.sin(this._droneAngle)*orbitR;
      if(this._hitCooldown>0){this._hitCooldown-=dt;}
      else{
        let bestO=null,bestD=Infinity;
        for(const o of ores){
          if(!o.alive)continue;
          const _x=o.x-cx0,_y=o.y-cy0;if(_x*_x+_y*_y>rng2)continue;
          const d=Math.hypot(o.x-drX,o.y-drY);
          if(d<bestD){bestD=d;bestO=o;}
        }
        if(bestO){
          const dir=Math.atan2(bestO.y-drY,bestO.x-drX);
          bestO.takeDmg(this.getDmg(),'single');
          this._eff(new LaserEff(drX,drY,dir,bestD,this.color));
          this._firingT=.18;
          this._hitCooldown=1/Math.max(0.1,this.getSpd());
        }
      }
      return;
    }
    if(tp==='focus'){
      if(this._focusTgt){const _rng=this.getRange()*TS;const _dx=this._focusTgt.x-this.cx,_dy=this._focusTgt.y-this.cy;if(!this._focusTgt.alive||_dx*_dx+_dy*_dy>_rng*_rng)this._focusTgt=null;}
      if(!this._focusTgt)this._focusTgt=this._findTgt(ores);
      if(this._focusTgt){
        this._focusTgt.takeDmg(this.getDmg()*dt,'focus');
        this.angle=Math.atan2(this._focusTgt.y-this.cy,this._focusTgt.x-this.cx);
        this._firingT=.18;
        this._soundT-=dt;if(this._soundT<=0){SFX.shoot('magnetCannon');this._soundT=.38;}
      }
      return;
    }
    if(tp==='aoe'){
      this._aoeT+=dt;const iv=1/Math.max(.1,this.getSpd());
      if(this._aoeT>=iv){this._aoeT=0;const rng=this.getRange()*TS;const rng2=rng*rng;const cx0=this.cx,cy0=this.cy;let hit=false;for(const o of ores){const _x=o.x-cx0,_y=o.y-cy0;if(o.alive&&_x*_x+_y*_y<=rng2){o.takeDmg(this.getDmg()*iv,'aoe');hit=true;}}if(hit){this._firingT=.28;this._eff(new GridFlashEff(cx0,cy0,rng,this.color));SFX.shoot('aoe');}}return;}
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
  _findTgt(ores){const rng=this.getRange()*TS;const rng2=rng*rng;const cx0=this.cx,cy0=this.cy;const isLast=this.tId==='magnetCannon';let best=null,bestP=isLast?Infinity:-1;for(const o of ores){if(!o.alive)continue;const _x=o.x-cx0,_y=o.y-cy0;if(_x*_x+_y*_y>rng2)continue;const p=o.pathIdx+o.progress;if(isLast?p<bestP:p>bestP){bestP=p;best=o;}}return best;}
  _fire(tgt){
    if(this.tId==='pixelArm'){
      const dir=Math.atan2(tgt.y-this.cy,tgt.x-this.cx);
      tgt.takeDmg(this.getDmg(),'single');
      this._eff(new LaserEff(this.cx,this.cy,dir,Math.hypot(tgt.x-this.cx,tgt.y-this.cy)+8,this.color));
    }else{
      GS.projs.push(new Proj(this.cx,this.cy,tgt,this.getDmg(),{color:this.color,slow:null,size:1}));
    }
  }
  _firePierce(ores){const rng=this.getRange()*TS;const rng2=rng*rng;const cx0=this.cx,cy0=this.cy;let best=null,bestP=-1;for(const o of ores){if(!o.alive)continue;const _x=o.x-cx0,_y=o.y-cy0;if(_x*_x+_y*_y>rng2)continue;const p=o.pathIdx+o.progress;if(p>bestP){bestP=p;best=o;}}if(!best)return;this.angle=Math.atan2(best.y-this.cy,best.x-this.cx);const dx=Math.cos(this.angle),dy=Math.sin(this.angle);let hit=0;for(const o of ores){if(!o.alive||hit>=8)continue;const ex=o.x-this.cx,ey=o.y-this.cy,dot=ex*dx+ey*dy;if(dot<0||dot>rng)continue;if(Math.abs(ex*dy-ey*dx)<TS*.5){o.takeDmg(this.getDmg(),'pierce');hit++;}}this._eff(new LaserEff(this.cx,this.cy,this.angle,rng,this.color));}
  _fireChain(ores){const rng=this.getRange()*TS;const first=this._findTgt(ores);if(!first)return;this.angle=Math.atan2(first.y-this.cy,first.x-this.cx);const targets=[first];let last=first;for(let i=1;i<3;i++){let nx=null,bd=(rng*1.6)*(rng*1.6);for(const o of ores){if(!o.alive||targets.includes(o))continue;const _cx=o.x-last.x,_cy=o.y-last.y,d2=_cx*_cx+_cy*_cy;if(d2<bd){bd=d2;nx=o;}}if(!nx)break;targets.push(nx);last=nx;}const base=this.getDmg(),mults=[1,.80,.60];const shockDps=base*0.5,shockDur=3.0;for(let i=0;i<targets.length;i++){targets[i].takeDmg(base*mults[i],'chain');targets[i].applyShock(shockDps*mults[i],shockDur);if(i>0)this._eff(new BoltEff(targets[i-1].x,targets[i-1].y,targets[i].x,targets[i].y,this.color));}this._eff(new BoltEff(this.cx,this.cy,targets[0].x,targets[0].y,this.color));}

  draw(ctx,gt){
    const r=TS*.44,t=this._animT,f=this._firingT>0;
    if(this.isMega){
      if(this.level>1){const bc=['','#EF5350','#FFD700','#00E5FF'][this.level-1]||'#EF5350';const p=4;ctx.save();ctx.strokeStyle=bc;ctx.lineWidth=2.5;ctx.shadowColor=bc;ctx.shadowBlur=12;ctx.strokeRect(this.cx-TS+p,this.cy-TS+p,TS*2-p*2,TS*2-p*2);ctx.shadowBlur=0;ctx.restore();}
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
    if(this.type==='twinhub')this._drawTwinOrbit(ctx);
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
  // 코어슈터: 십자 포가 + 단열 중포, 기본방향 위(↑)
  _dCS(ctx,r,t,f){
    const col=this.color;
    // cross-frame base: 4 structural arms forming X/+ shape
    for(const rot of[0,Math.PI/2]){
      ctx.save();ctx.rotate(rot);
      ctx.fillStyle='#0e0818';ctx.strokeStyle=f?col+'44':'#2a1840';ctx.lineWidth=1.6;
      ctx.beginPath();ctx.rect(-r*.88,-r*.28,r*1.76,r*.56);ctx.fill();ctx.stroke();
      // arm vent grooves
      for(const sx of[-1,1]){
        for(let v=0;v<3;v++){
          ctx.strokeStyle=col+(f?'2a':'0e');ctx.lineWidth=.8;
          ctx.beginPath();ctx.moveTo(sx*(r*.42+v*r*.14),-r*.2);ctx.lineTo(sx*(r*.42+v*r*.14),r*.2);ctx.stroke();
        }
      }
      ctx.restore();
    }
    // 4 corner junction pods
    for(const a of[Math.PI/4,Math.PI*3/4,Math.PI*5/4,Math.PI*7/4]){
      ctx.fillStyle='#160d24';ctx.strokeStyle=f?col+'55':col+'22';ctx.lineWidth=1.2;
      ctx.shadowColor=col;ctx.shadowBlur=f?6:1;
      ctx.beginPath();ctx.arc(Math.cos(a)*r*.64,Math.sin(a)*r*.64,r*.15,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.shadowBlur=0;
      ctx.fillStyle=f?col+'44':col+'18';
      ctx.beginPath();ctx.arc(Math.cos(a)*r*.64,Math.sin(a)*r*.64,r*.07,0,Math.PI*2);ctx.fill();
    }
    // rotating charge accumulator ring
    ctx.save();ctx.rotate(t*2.2);
    ctx.strokeStyle=f?col+'77':col+'2a';ctx.lineWidth=1.6;ctx.setLineDash([r*.26,r*.1]);
    ctx.beginPath();ctx.arc(0,0,r*.46,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    // second counter-rotating ring
    ctx.save();ctx.rotate(-t*1.4);
    ctx.strokeStyle=f?col+'44':col+'18';ctx.lineWidth=1;ctx.setLineDash([r*.14,r*.16]);
    ctx.beginPath();ctx.arc(0,0,r*.62,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    // turret with angled mantlet shield + single wide barrel
    ctx.save();ctx.rotate(this.angle+Math.PI/2);
    // mantlet shield (angled armor plate, wide trapezoidal)
    ctx.fillStyle='#0e0818';ctx.strokeStyle=f?col+'88':col+'33';ctx.lineWidth=1.8;
    ctx.beginPath();
    ctx.moveTo(-r*.46,-r*.16);ctx.lineTo(r*.46,-r*.16);ctx.lineTo(r*.34,-r*.5);ctx.lineTo(-r*.34,-r*.5);
    ctx.closePath();ctx.fill();ctx.stroke();
    // mantlet armor bolts
    for(const bx of[-r*.28,r*.28]){
      ctx.fillStyle='#1a1030';ctx.strokeStyle=col+(f?'44':'18');ctx.lineWidth=.7;
      ctx.beginPath();ctx.arc(bx,-r*.32,r*.05,0,Math.PI*2);ctx.fill();ctx.stroke();
    }
    // mantlet center sight reticle
    ctx.strokeStyle=f?col+'88':col+'33';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-r*.1,-r*.33);ctx.lineTo(r*.1,-r*.33);ctx.stroke();
    ctx.beginPath();ctx.moveTo(0,-r*.28);ctx.lineTo(0,-r*.38);ctx.stroke();
    // single wide barrel
    ctx.fillStyle='#0a0614';ctx.strokeStyle=f?col+'aa':col+'44';ctx.lineWidth=1.8;
    ctx.beginPath();ctx.rect(-r*.18,-r*.98,r*.36,r*.5);ctx.fill();ctx.stroke();
    // barrel cooling rings
    for(let v=0;v<5;v++){
      const vy=-r*.92+v*r*.1;
      ctx.strokeStyle=col+(f?'66':'28');ctx.lineWidth=2;ctx.lineCap='square';
      ctx.beginPath();ctx.moveTo(-r*.21,vy);ctx.lineTo(r*.21,vy);ctx.stroke();
      ctx.lineCap='butt';
    }
    // barrel inner channel glow
    ctx.fillStyle=f?col+'33':'#080410';
    ctx.beginPath();ctx.rect(-r*.1,-r*.94,r*.2,r*.42);ctx.fill();
    // 3-slot muzzle brake
    ctx.fillStyle='#0a0614';ctx.strokeStyle=f?col+'cc':col+'66';ctx.lineWidth=1.8;
    ctx.shadowColor=col;ctx.shadowBlur=f?20:4;
    ctx.beginPath();ctx.rect(-r*.24,-r*1.02,r*.48,r*.1);ctx.fill();ctx.stroke();
    ctx.shadowBlur=0;
    // muzzle vent slots
    for(const bx of[-r*.12,0,r*.12]){
      ctx.fillStyle=f?col+'55':'#0a0614';
      ctx.beginPath();ctx.rect(bx-r*.04,-r*1.02,r*.08,r*.08);ctx.fill();
    }
    if(f){
      const mg=ctx.createRadialGradient(0,-r*.97,0,0,-r*.97,r*.24);
      mg.addColorStop(0,'#fff');mg.addColorStop(.28,col);mg.addColorStop(1,col+'00');
      ctx.globalAlpha=.65;ctx.fillStyle=mg;ctx.beginPath();ctx.arc(0,-r*.97,r*.24,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    }
    // side stabilizer fins
    for(const sx of[-1,1]){
      ctx.fillStyle='#0e0818';ctx.strokeStyle=f?col+'55':col+'22';ctx.lineWidth=1.1;
      ctx.beginPath();
      ctx.moveTo(sx*r*.18,-r*.56);ctx.lineTo(sx*r*.44,-r*.68);ctx.lineTo(sx*r*.44,-r*.44);ctx.lineTo(sx*r*.18,-r*.44);
      ctx.closePath();ctx.fill();ctx.stroke();
    }
    ctx.restore();
    // central energy core
    ctx.shadowColor=col;ctx.shadowBlur=f?28:10;
    const cg=ctx.createRadialGradient(0,0,0,0,0,r*.22);
    cg.addColorStop(0,'#fff');cg.addColorStop(.25,col);cg.addColorStop(.6,col+'55');cg.addColorStop(1,col+'00');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,r*.22,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=col+(f?'cc':'44');ctx.lineWidth=1.4;
    ctx.beginPath();ctx.arc(0,0,r*.28,0,Math.PI*2);ctx.stroke();
    ctx.shadowBlur=0;
  }
  // 픽셀 로봇암: 단관절 산업용 로봇팔 (탑뷰, 정면 단일암, 그리퍼 타격 시 벌림)
  _dPA(ctx,r,t,f){
    const col=this.color;
    // ── HEXAGONAL MOUNT BASE
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6;i===0?ctx.moveTo(Math.cos(a)*r*.83,Math.sin(a)*r*.83):ctx.lineTo(Math.cos(a)*r*.83,Math.sin(a)*r*.83);}
    ctx.closePath();ctx.fillStyle='#161616';ctx.fill();ctx.strokeStyle='#3c3c3c';ctx.lineWidth=1.8;ctx.stroke();
    // inner hex ring
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6;i===0?ctx.moveTo(Math.cos(a)*r*.56,Math.sin(a)*r*.56):ctx.lineTo(Math.cos(a)*r*.56,Math.sin(a)*r*.56);}
    ctx.closePath();ctx.strokeStyle=col+(f?'28':'10');ctx.lineWidth=.9;ctx.stroke();
    // hex corner bolts (square)
    for(let i=0;i<6;i++){
      const a=i*Math.PI/3-Math.PI/6;const bs=r*.042;
      ctx.save();ctx.translate(Math.cos(a)*r*.72,Math.sin(a)*r*.72);ctx.rotate(a);
      ctx.fillStyle='#2b2b2b';ctx.strokeStyle=col+(f?'33':'14');ctx.lineWidth=.7;
      ctx.fillRect(-bs,-bs,bs*2,bs*2);ctx.strokeRect(-bs,-bs,bs*2,bs*2);
      ctx.restore();
    }
    // ── ANGULAR ARM (rotates toward target)
    ctx.save();ctx.rotate(this.angle+Math.PI/2);
    const shY=-r*.08,elbY=-r*.46,wristY=-r*.78,tipY=-r*.96;
    const uaw=r*.13,faw=r*.10;
    // UPPER ARM — tapered angular rect
    ctx.fillStyle='#1d1d1d';ctx.strokeStyle=f?col+'44':col+'1a';ctx.lineWidth=1.3;
    ctx.beginPath();ctx.moveTo(-uaw,shY);ctx.lineTo(uaw,shY);ctx.lineTo(uaw-r*.03,elbY);ctx.lineTo(-uaw+r*.03,elbY);ctx.closePath();ctx.fill();ctx.stroke();
    // upper arm groove bands
    ctx.strokeStyle=col+(f?'30':'0f');ctx.lineWidth=.9;
    for(let v=0;v<3;v++){const vy=shY+(elbY-shY)*(0.24+v*.24);const lw=uaw*(0.82-v*.04);ctx.beginPath();ctx.moveTo(-lw,vy);ctx.lineTo(lw,vy);ctx.stroke();}
    // FOREARM — tapered angular rect
    ctx.fillStyle='#181818';ctx.strokeStyle=f?col+'60':col+'26';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(-faw,elbY);ctx.lineTo(faw,elbY);ctx.lineTo(faw-r*.02,wristY);ctx.lineTo(-faw+r*.02,wristY);ctx.closePath();ctx.fill();ctx.stroke();
    // forearm hydraulic bands
    ctx.strokeStyle=col+(f?'40':'15');ctx.lineWidth=1;
    for(let v=0;v<3;v++){const vy=elbY+(wristY-elbY)*(0.26+v*.24);const lw=(faw-r*.015)*(1-v*.03);ctx.beginPath();ctx.moveTo(-lw,vy);ctx.lineTo(lw,vy);ctx.stroke();}
    // SHOULDER JOINT — diamond (square rotated 45°)
    ctx.save();ctx.translate(0,shY);ctx.rotate(Math.PI/4);
    const sj=r*.14;
    ctx.fillStyle='#252525';ctx.strokeStyle=f?col:col+'55';ctx.lineWidth=1.6;
    ctx.shadowColor=col;ctx.shadowBlur=f?14:3;
    ctx.fillRect(-sj,-sj,sj*2,sj*2);ctx.strokeRect(-sj,-sj,sj*2,sj*2);
    ctx.shadowBlur=0;ctx.fillStyle=f?col:col+'88';ctx.fillRect(-sj*.38,-sj*.38,sj*.76,sj*.76);
    ctx.restore();
    // ELBOW JOINT — smaller diamond
    ctx.save();ctx.translate(0,elbY);ctx.rotate(Math.PI/4);
    const ej=r*.11;
    ctx.fillStyle='#202020';ctx.strokeStyle=f?col+'cc':col+'44';ctx.lineWidth=1.3;
    ctx.shadowColor=col;ctx.shadowBlur=f?9:2;
    ctx.fillRect(-ej,-ej,ej*2,ej*2);ctx.strokeRect(-ej,-ej,ej*2,ej*2);
    ctx.shadowBlur=0;ctx.fillStyle=f?col+'88':col+'40';ctx.fillRect(-ej*.4,-ej*.4,ej*.8,ej*.8);
    ctx.restore();
    // WRIST PLATE — angular bar + center bolt
    ctx.fillStyle='#1d1d1d';ctx.strokeStyle=f?col+'88':col+'30';ctx.lineWidth=1.2;
    ctx.fillRect(-r*.17,wristY-r*.048,r*.34,r*.096);ctx.strokeRect(-r*.17,wristY-r*.048,r*.34,r*.096);
    ctx.fillStyle=f?col+'55':col+'22';ctx.fillRect(-r*.04,wristY-r*.028,r*.08,r*.056);ctx.strokeStyle=f?col+'66':col+'22';ctx.lineWidth=.8;ctx.strokeRect(-r*.04,wristY-r*.028,r*.08,r*.056);
    // GRIPPER JAWS — L-shaped angular brackets (open on fire)
    const spread=f?r*.27:r*.09,fw=r*.10,ph=r*.09,pl=r*.13;
    for(const sx of[-1,1]){
      const s=sx*spread,ow=sx*fw;
      ctx.fillStyle='#1a1a1a';ctx.strokeStyle=f?col:col+'55';ctx.lineWidth=1.3;
      ctx.shadowColor=col;ctx.shadowBlur=f?14:2;
      // L-bracket: shaft + inward prong at tip
      ctx.beginPath();
      ctx.moveTo(s,wristY);ctx.lineTo(s+ow,wristY);
      ctx.lineTo(s+ow,tipY);ctx.lineTo(s-sx*pl,tipY);
      ctx.lineTo(s-sx*pl,tipY+ph);ctx.lineTo(s,tipY+ph);
      ctx.closePath();ctx.fill();ctx.stroke();
      ctx.shadowBlur=0;
      // shaft midline groove
      ctx.strokeStyle=col+(f?'40':'18');ctx.lineWidth=.8;
      ctx.beginPath();ctx.moveTo(s,( wristY+tipY)*.5);ctx.lineTo(s+ow,(wristY+tipY)*.5);ctx.stroke();
    }
    // grip-point glow when firing
    if(f){
      const mg=ctx.createRadialGradient(0,tipY+ph*.5,0,0,tipY+ph*.5,r*.3);
      mg.addColorStop(0,'#fff');mg.addColorStop(.28,col);mg.addColorStop(1,col+'00');
      ctx.globalAlpha=.60;ctx.fillStyle=mg;ctx.beginPath();ctx.arc(0,tipY+ph*.5,r*.3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    }
    ctx.restore();
    // center hub core
    ctx.shadowColor=col;ctx.shadowBlur=f?20:7;
    const cg=ctx.createRadialGradient(0,0,0,0,0,r*.18);
    cg.addColorStop(0,'#fff');cg.addColorStop(.35,col);cg.addColorStop(1,col+'00');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,r*.18,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=col+(f?'aa':'33');ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,r*.25,0,Math.PI*2);ctx.stroke();
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
    ctx.closePath();ctx.fillStyle='#100a00';ctx.fill();
    ctx.strokeStyle=f?col+'aa':'#302000';ctx.lineWidth=2.2;ctx.stroke();
    // 8 panel inlays
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4-Math.PI/8,a2=a+Math.PI/4;
      ctx.fillStyle=f&&i%2===0?col+'0e':'#140d00';
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
      ctx.fillStyle='#1a1000';ctx.strokeStyle=f?col+'99':col+'33';ctx.lineWidth=1.2;
      ctx.shadowColor=col;ctx.shadowBlur=f?10:2;
      ctx.beginPath();ctx.arc(Math.cos(a)*r*.68,Math.sin(a)*r*.68,r*.09,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle=f?col:'#302800';ctx.beginPath();ctx.arc(Math.cos(a)*r*.68,Math.sin(a)*r*.68,r*.05,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    }
    // TURRET
    ctx.save();ctx.rotate(this.angle+Math.PI/2);
    // charging capacitor wings (large, dramatic)
    for(const sx of[-1,1]){
      ctx.fillStyle='#180c00';ctx.strokeStyle=f?col+'88':col+'33';ctx.lineWidth=1.4;
      ctx.beginPath();ctx.rect(sx*r*.38,-r*.38,sx*r*.3,r*.62);ctx.fill();ctx.stroke();
      for(let v=0;v<4;v++){
        const vy=-r*.3+v*r*.14;
        ctx.strokeStyle=col+(f?'44':'18');ctx.lineWidth=.8;
        ctx.beginPath();ctx.moveTo(sx*r*.4,vy);ctx.lineTo(sx*r*.66,vy);ctx.stroke();
      }
      // lit charge cells when firing
      for(let v=0;v<3;v++){
        const vy=-r*.28+v*r*.16;
        ctx.fillStyle=f?(v===1?col+'cc':col+'55'):'#1e1200';
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
    ctx.fillStyle='#120900';ctx.strokeStyle=f?col+'66':col+'2a';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.rect(-r*.36,-r*.28,r*.72,r*.52);ctx.fill();ctx.stroke();
    // accelerator barrel
    ctx.fillStyle='#0e0800';ctx.strokeStyle=f?col+'99':col+'3a';ctx.lineWidth=1.6;
    ctx.beginPath();ctx.rect(-r*.14,-r*1.04,r*.28,r*.78);ctx.fill();ctx.stroke();
    // accelerator coil segments (5 rings, alternating glow)
    for(let i=0;i<5;i++){
      const ry=-r*.96+i*r*.17,lit=f&&(i===1||i===3);
      ctx.fillStyle='#0e0800';ctx.strokeStyle=lit?col:col+(i%2===0?'55':'28');
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
    ctx.closePath();ctx.fillStyle='#050510';ctx.fill();
    ctx.strokeStyle=f?col+'cc':'#2a2a4a';ctx.lineWidth=2.6;ctx.stroke();
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
      ctx.fillStyle='#0a0a1e';ctx.strokeStyle=f?col+'99':col+'33';ctx.lineWidth=1.2;
      ctx.shadowColor=col;ctx.shadowBlur=f?12:3;
      ctx.beginPath();ctx.arc(nx,ny,r*.09,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.fillStyle=f?col:'#282850';ctx.beginPath();ctx.arc(nx,ny,r*.05,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    }
    // === TURRET ASSEMBLY (facing target) ===
    ctx.save();ctx.rotate(this.angle+Math.PI/2);
    // swept energy wings (angled back fins, symmetric)
    for(const sx of[-1,1]){
      ctx.fillStyle='#0a0a1e';ctx.strokeStyle=f?col+'66':col+'22';ctx.lineWidth=1.3;
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
    ctx.fillStyle='#080818';ctx.strokeStyle=f?col+'77':col+'2e';ctx.lineWidth=1.7;
    ctx.beginPath();ctx.rect(-r*.46,-r*.28,r*.92,r*.52);ctx.fill();ctx.stroke();
    // twin symmetric plasma barrels
    for(const bx of[-r*.24,r*.04]){
      ctx.fillStyle='#0c0c22';ctx.strokeStyle=f?col+'99':col+'3a';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.rect(bx,-r*1.01,r*.2,r*.75);ctx.fill();ctx.stroke();
      for(let ri=0;ri<4;ri++){
        const ry=-r*.94+ri*r*.2,lit=f&&ri===2;
        ctx.fillStyle='#08081a';ctx.strokeStyle=lit?col:col+(ri%2===0?'55':'28');
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
    ctx.fillStyle='#061412';ctx.strokeStyle=f?col+'77':'#1a3028';ctx.lineWidth=1.8;
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
      ctx.fillStyle='#0a1e1a';ctx.strokeStyle=f?col+'77':col+'33';ctx.lineWidth=1.2;
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
    ctx.fillStyle='#091c18';ctx.strokeStyle=f?col+'88':'#1a3028';ctx.lineWidth=1.5;
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
    const orbitR=rng*0.62;
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
    ctx.fillStyle='#110e00';ctx.fill();
    ctx.strokeStyle=f?col+'99':'#2a2200';ctx.lineWidth=2.2;ctx.stroke();
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
      ctx.fillStyle='#1a1400';ctx.strokeStyle=f?col:col+'66';ctx.lineWidth=1.3;
      ctx.shadowColor=col;ctx.shadowBlur=f?16:4;
      ctx.beginPath();ctx.roundRect(-r*.13,-r*.065,r*.26,r*.13,r*.03);ctx.fill();ctx.stroke();
      ctx.shadowBlur=0;
      // side collector fins (perpendicular)
      for(const sx of[-1,1]){
        ctx.fillStyle='#140f00';ctx.strokeStyle=f?col+'88':col+'44';ctx.lineWidth=1;
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
    this._base(ctx,r,col,'circle');
    // outer rotating marker ring
    ctx.save();ctx.rotate(t*.8);
    ctx.strokeStyle=col+'44';ctx.lineWidth=1.2;ctx.setLineDash([r*.24,r*.08]);
    ctx.beginPath();ctx.arc(0,0,r*.78,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    // horizontal arm struts (left/right)
    ctx.strokeStyle=col+(f?'88':'44');ctx.lineWidth=2;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(-r*.2,0);ctx.lineTo(-r*.6,0);ctx.stroke();
    ctx.beginPath();ctx.moveTo(r*.2,0);ctx.lineTo(r*.6,0);ctx.stroke();
    // twin left/right hub nodes
    for(const sx of[-1,1]){
      const nx=sx*r*.6;
      ctx.fillStyle='#0b0b1e';ctx.strokeStyle=col;ctx.lineWidth=1.6;
      ctx.shadowColor=col;ctx.shadowBlur=f?18:7;
      ctx.beginPath();ctx.arc(nx,0,r*.2,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.shadowBlur=0;
      const ng=ctx.createRadialGradient(nx,0,0,nx,0,r*.2);
      ng.addColorStop(0,f?'#fff':col+'cc');ng.addColorStop(.5,col+'66');ng.addColorStop(1,col+'00');
      ctx.fillStyle=ng;ctx.beginPath();ctx.arc(nx,0,r*.2,0,Math.PI*2);ctx.fill();
      // orbit indicator ring around node
      ctx.strokeStyle=col+'33';ctx.lineWidth=.8;ctx.setLineDash([2,3]);
      ctx.beginPath();ctx.arc(nx,0,r*.27,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    }
    // central counter-rotating hex coil
    ctx.save();ctx.rotate(-t*2.0);
    ctx.strokeStyle=f?col:col+'77';ctx.lineWidth=1.5;ctx.shadowColor=col;ctx.shadowBlur=f?8:2;
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i/6*Math.PI*2;i===0?ctx.moveTo(Math.cos(a)*r*.3,Math.sin(a)*r*.3):ctx.lineTo(Math.cos(a)*r*.3,Math.sin(a)*r*.3);}
    ctx.closePath();ctx.stroke();ctx.shadowBlur=0;ctx.restore();
    // core
    ctx.shadowColor=col;ctx.shadowBlur=f?22:9;
    const cg=ctx.createRadialGradient(0,0,0,0,0,r*.17);
    cg.addColorStop(0,'#fff');cg.addColorStop(.45,col);cg.addColorStop(1,col+'11');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(0,0,r*.17,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
  }
  _drawTwinOrbit(ctx){
    const dr=this.getRange()*TS,col=this.color;
    const orbR=this.isMega?5.5:3.5;
    ctx.save();ctx.strokeStyle=col+'18';ctx.lineWidth=.8;ctx.setLineDash([3,8]);
    ctx.beginPath();ctx.arc(this.cx,this.cy,dr,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.restore();
    for(let i=0;i<2;i++){
      const da=this._twinAngles[i],active=this._twin_hcd[i]>0;
      // trail — behind orb (both go CCW so trail at smaller angle)
      for(let t=1;t<=10;t++){
        const ta=da-t*0.11;
        const tx=this.cx+Math.cos(ta)*dr,ty=this.cy+Math.sin(ta)*dr;
        ctx.globalAlpha=(1-t/10)*.28;ctx.fillStyle=col;
        ctx.beginPath();ctx.arc(tx,ty,orbR*(1-t/10)*.7,0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
      const ox=this.cx+Math.cos(da)*dr,oy=this.cy+Math.sin(da)*dr;
      ctx.save();ctx.translate(ox,oy);ctx.rotate(da*4); // spin the orb
      // outer ring
      ctx.strokeStyle=active?col:col+'88';ctx.lineWidth=1.5;ctx.shadowColor=col;ctx.shadowBlur=active?14:5;
      ctx.beginPath();ctx.arc(0,0,orbR,0,Math.PI*2);ctx.stroke();
      // inner diamond
      ctx.strokeStyle=active?'#fff':col+'cc';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,-orbR*.62);ctx.lineTo(orbR*.62,0);ctx.lineTo(0,orbR*.62);ctx.lineTo(-orbR*.62,0);ctx.closePath();ctx.stroke();
      // center dot
      ctx.fillStyle=active?'#fff':col;
      ctx.beginPath();ctx.arc(0,0,orbR*.28,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
      if(active){
        const p=this._twin_hcd[i]/0.35;
        ctx.globalAlpha=p*.45;ctx.strokeStyle='#CE93D8';ctx.lineWidth=1.2;
        ctx.beginPath();ctx.arc(0,0,orbR+p*4,0,Math.PI*2);ctx.stroke();
        ctx.globalAlpha=1;
      }
      ctx.restore();
    }
  }
}

// ═══════════════════════════════════════════════════════
// 이펙트
// ═══════════════════════════════════════════════════════
class Proj{constructor(x,y,tgt,dmg,opts){this.x=x;this.y=y;this.target=tgt;this.dmg=dmg;this.color=opts.color||'#00E5FF';this.slow=opts.slow||null;this.size=opts.size||1;this.spd=420;this.alive=true;this.trail=[];}update(dt){if(!this.alive)return;if(!this.target||!this.target.alive){this.alive=false;return;}const dx=this.target.x-this.x,dy=this.target.y-this.y,d=Math.hypot(dx,dy);if(d<this.spd*dt+6){this.target.takeDmg(this.dmg);if(this.slow)this.target.applySlow(this.slow.ratio,this.slow.dur);this.alive=false;return;}this.trail.unshift({x:this.x,y:this.y});if(this.trail.length>7)this.trail.pop();const sp=this.spd*dt/d;this.x+=dx*sp;this.y+=dy*sp;}draw(ctx){if(!this.alive)return;const sz=this.size;for(let i=0;i<this.trail.length;i++){ctx.globalAlpha=(1-i/this.trail.length)*.48;ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.trail[i].x,this.trail[i].y,(3.2-i*.3)*sz,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.shadowColor=this.color;ctx.shadowBlur=9;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(this.x,this.y,4.2*sz,0,Math.PI*2);ctx.fill();ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x,this.y,2.6*sz,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}}
class RingEff{constructor(x,y,r,col){this.x=x;this.y=y;this.r=r;this.col=col;this.life=this.max=.32;}update(dt){this.life-=dt;}draw(ctx){if(this.life<=0)return;const p=this.life/this.max;ctx.globalAlpha=p*.55;ctx.strokeStyle=this.col;ctx.lineWidth=2.5;ctx.shadowColor=this.col;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(this.x,this.y,this.r*(1.3-p*.3),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=p*.25;ctx.lineWidth=6;ctx.beginPath();ctx.arc(this.x,this.y,this.r*(1.3-p*.3),0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;}}
class GridFlashEff{constructor(x,y,r,col){this.x=x;this.y=y;this.r=r;this.col=col;this.life=this.max=.5;}update(dt){this.life-=dt;}draw(ctx){if(this.life<=0)return;const p=this.life/this.max;ctx.save();ctx.shadowColor=this.col;
  ctx.globalAlpha=p*.6;ctx.strokeStyle=this.col;ctx.lineWidth=3;ctx.shadowBlur=18;ctx.beginPath();ctx.arc(this.x,this.y,this.r*(0.95+(1-p)*.05),0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=p*.35;ctx.lineWidth=1.5;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(this.x,this.y,this.r*(0.88+(1-p)*.08),0,Math.PI*2);ctx.stroke();
  ctx.globalAlpha=p*.7;ctx.lineWidth=2;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(this.x,this.y,this.r*p*.5,0,Math.PI*2);ctx.stroke();
  const hl=this.r*(0.92+(1-p)*.08);ctx.globalAlpha=p*.45;ctx.lineWidth=1.5;ctx.shadowBlur=10;ctx.beginPath();ctx.moveTo(this.x-hl,this.y);ctx.lineTo(this.x+hl,this.y);ctx.moveTo(this.x,this.y-hl);ctx.lineTo(this.x,this.y+hl);ctx.stroke();
  ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();}}
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
class Popup{constructor(x,y,text,col){this.x=x;this.y=y;this.text=text;this.col=col;this.life=this.max=1.3;this.vy=-40;}update(dt){this.y+=this.vy*dt;this.life-=dt;}draw(ctx){if(this.life<=0)return;const p=Math.min(1,this.life/this.max*1.5);ctx.globalAlpha=p;ctx.font='bold 13px sans-serif';ctx.fillStyle=this.col;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(this.text,this.x,this.y);ctx.globalAlpha=1;}}

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
        UI.showBanner('합체! '+mega.name+' 가동!','#FFD700');
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
  const rushes=w<=20?2:w<=50?3:4;
  const perRush=Math.ceil(totalCount/rushes);
  const rushGap=w<=20?8:w<=50?6:5;
  let t=0;
  for(let ri=0;ri<rushes;ri++){
    const n=ri<rushes-1?perRush:totalCount-perRush*(rushes-1);
    for(let i=0;i<n;i++)q.push({type:pool[Math.floor(Math.random()*pool.length)],delay:t+i*.5});
    t+=n*.5+rushGap;
  }
  if(w%10===0&&w>0)q.push({type:'core',delay:t});
  return q;
}

// ═══════════════════════════════════════════════════════
// UI
// ═══════════════════════════════════════════════════════
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
    document.getElementById('mc-name').textContent=d.name;
    document.getElementById('mc-name').style.color=d.color;
    document.getElementById('mc-desc').textContent=d.desc;
    let tags=`<span class="mc-tag">◈ <b>${d.price}</b></span>`;
    if(d.dmg>0)tags+=`<span class="mc-tag">공정력 <b>${d.dmg}</b></span>`;
    if(d.spd>0)tags+=`<span class="mc-tag">속도 <b>${d.spd}/초</b></span>`;
    tags+=`<span class="mc-tag">범위 <b>${d.range}</b></span>`;
    if(d.type==='focus')tags+=`<span class="mc-tag">집중 레이저</span>`;
    if(d.type==='scan')tags+=`<span class="mc-tag">광역</span>`;
    if(d.type==='refinery')tags+=`<span class="mc-tag">전격·포트 획득</span>`;
    if(d.type==='chain')tags+=`<span class="mc-tag">연쇄 <b>3개</b></span>`;
    if(d.type==='pierce')tags+=`<span class="mc-tag">관통 <b>8개</b></span>`;
    if(d.type==='twinhub')tags+=`<span class="mc-tag">궤도 감속</span>`;
    if(d.type==='drone')tags+=`<span class="mc-tag">선회공격</span>`;
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
    cv.addEventListener('click',e=>{if(!GS.running)return;const p=getP(e);this._tap(p.row,p.col);});
    cv.addEventListener('touchstart',e=>{if(!GS.running)return;e.preventDefault();const p=getP(e);this._tap(p.row,p.col);},{passive:false});
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
    if(this.selCard!==null){if(row>=0&&row<ROWS2&&col>=0&&col<COLS)G.place(row,col);return;}
    this.desel();
  },

  _showTowerInfo(tower){
    document.getElementById('mid-promo').style.display='none';
    document.getElementById('mid-card').classList.remove('show');
    document.getElementById('mid-info').classList.add('show');
    const d=TWR[tower.tId];
    document.getElementById('mi-name').textContent=tower.name;
    document.getElementById('mi-name').style.color=tower.color;
    const upgDone=tower.level-1;
    const gradeLabel=`강화 ${upgDone} / 3`;
    const gradeCol=['#888','#EF5350','#FFD700','#00E5FF'][upgDone]||'#00E5FF';
    const lvEl=document.getElementById('mi-lvl');
    lvEl.textContent=gradeLabel;
    lvEl.style.color=gradeCol;
    let s='';
    if(d.dmg>0)s+=`<div class="tis">공정력<span>${tower.getDmg().toFixed(1)}</span></div>`;
    if(d.spd>0)s+=`<div class="tis">속도<span>${tower.getSpd().toFixed(1)}/초</span></div>`;
    s+=`<div class="tis">범위<span>${d.range}</span></div>`;
    if(tower.type==='focus')s+=`<div class="tis">집중 레이저<span>지속</span></div>`;
    if(tower.type==='refinery'){const pg=Math.max(1,Math.round(tower.getDmg()*1.5));s+=`<div class="tis">포트/발사<span>+◈${pg}</span></div>`;}
    if(tower.type==='chain'){const sd=Math.round(tower.getDmg()*0.5);s+=`<div class="tis">연쇄<span>3개</span></div>`;s+=`<div class="tis">감전<span>DPS ${sd} / 3초</span></div>`;}
    if(tower.type==='pierce')s+=`<div class="tis">관통<span>8개</span></div>`;
    if(tower.type==='twinhub'){const bd=[1.0,1.33,1.67,2.0][tower.level-1]||1.0;const dur=tower.isMega?bd*5:bd;s+=`<div class="tis">감속<span>50% / ${dur.toFixed(1)}초</span></div>`;s+=`<div class="tis">면역<span>접촉 후 1초</span></div>`;}
    document.getElementById('mi-stats').innerHTML=s;
    const bu=document.getElementById('bupg');
    if(tower.isMega||tower.level>=4){bu.disabled=true;bu.textContent='최대';}
    else{const c=Math.round(tower.basePrice*(TWR[tower.tId].upgMult||1)*LVL[tower.level].cm);bu.disabled=!GS.eggActive&&GS.port<c;bu.textContent=`업그레이드 ◈${c}`;}
    document.getElementById('bsell').textContent=`매각 ◈${Math.round((tower.basePrice+tower.upgCost)*.6)}`;
  },

  desel(){
    this.selCard=null;this.selTwr=null;
    document.querySelectorAll('.tc').forEach(c=>c.classList.remove('sel'));
    this._showPromo();
  },

  upgrade(){
    const t=this.selTwr;if(!t||t.level>=4)return;
    const c=Math.round(t.basePrice*(TWR[t.tId].upgMult||1)*LVL[t.level].cm);
    if(!GS.eggActive&&GS.port<c){this.showBanner('포트가 부족합니다!','#EF5350');return;}
    if(!GS.eggActive)GS.port-=c;t.upgCost+=c;t.level++;
    SFX.upgrade();
    checkMerge();
    if(!GS.towers.includes(t)){this.updHUD();return;}
    this._showTowerInfo(t);this.updHUD();this.showBanner(t.name+' 업그레이드!','#00BCD4');
  },

  sell(){
    const t=this.selTwr;if(!t)return;
    const ref=Math.round((t.basePrice+t.upgCost)*.6);
    GS.port+=ref;GS.towers=GS.towers.filter(x=>x!==t);
    this.desel();this.updHUD();this.showBanner('◈'+ref+' 환급','#FFD700');
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
    let elapsed=0;const total=30;
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
    const c=col||'#00E5FF';
    el.textContent=text;el.style.color=c;el.style.setProperty('--bc',c);
    el.classList.remove('show');
    requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('show')));
    clearTimeout(this._bt);this._bt=setTimeout(()=>el.classList.remove('show'),2400);
  },

  showClear(){
    SFX.victory();
    const el=document.getElementById('clrovly');el.style.display='block';
    const t=Math.floor(GS.time);
    const eggRow=GS.eggActive
      ?`<div style="text-align:center;padding:11px 0 13px;margin-bottom:6px;background:#FF450018;border:1.5px solid #FF4500;border-radius:6px;"><span style="color:#FF4500;font-size:14px;font-weight:900;letter-spacing:1px;text-shadow:0 0 12px #FF450099;">포트 무한 사용 클리어</span></div>`
      :``;
    document.getElementById('clr-stats').innerHTML=`
      ${eggRow}
      <div class="clr-row"><span class="clr-lbl">총 운영 시간</span><span class="clr-val">${Math.floor(t/60)}분 ${t%60}초</span></div>
      <div class="clr-row"><span class="clr-lbl">총 생산 포트</span><span class="clr-val">◈ ${GS.totalPort.toLocaleString()}</span></div>
      <div class="clr-row"><span class="clr-lbl">설치한 장비</span><span class="clr-val">${GS.towers.length}기</span></div>
    `;
    // 클리어 파티클 캔버스
    const cv=document.getElementById('clr-canvas');
    cv.width=480;cv.height=900;
    const cx=cv.getContext('2d');
    // 배경 그라데이션
    const bg=cx.createRadialGradient(240,380,20,240,380,420);
    bg.addColorStop(0,'#1a1200');bg.addColorStop(.6,'#0a0800');bg.addColorStop(1,'#000');
    cx.fillStyle=bg;cx.fillRect(0,0,480,900);
    // 황금 격자
    cx.strokeStyle='#FFD70010';cx.lineWidth=1;
    for(let x=0;x<480;x+=32){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,900);cx.stroke();}
    for(let y=0;y<900;y+=32){cx.beginPath();cx.moveTo(0,y);cx.lineTo(480,y);cx.stroke();}
    // 파티클 애니메이션
    const pts=Array.from({length:80},()=>({
      x:Math.random()*480,y:Math.random()*900+200,
      vx:(Math.random()-.5)*1.2,vy:-(Math.random()*1.5+.5),
      r:Math.random()*2.5+.5,life:Math.random(),
      col:Math.random()<.5?'#FFD700':Math.random()<.5?'#FF8C00':'#ffffff'
    }));
    const tick=()=>{
      if(document.getElementById('clrovly').style.display==='none')return;
      cx.fillStyle='#00000018';cx.fillRect(0,0,480,900);
      for(const p of pts){
        p.x+=p.vx;p.y+=p.vy;p.life-=.005;
        if(p.life<=0||p.y<-10){p.x=Math.random()*480;p.y=910;p.life=.5+Math.random()*.5;}
        cx.globalAlpha=p.life*.7;cx.fillStyle=p.col;
        cx.beginPath();cx.arc(p.x,p.y,p.r,0,Math.PI*2);cx.fill();
      }
      cx.globalAlpha=1;requestAnimationFrame(tick);
    };tick();
  },

  showGO(){
    document.getElementById('govly').style.display='flex';
    const bw=+localStorage.getItem('ieg_bw')||0,bp=+localStorage.getItem('ieg_bp')||0;
    if(GS.wave>bw)localStorage.setItem('ieg_bw',GS.wave);
    if(GS.totalPort>bp)localStorage.setItem('ieg_bp',GS.totalPort);
    const t=Math.floor(GS.time);
    document.getElementById('gostats').innerHTML=`
      <div class="gost"><span class="gogl">최종 웨이브</span><span class="gogv">${GS.wave}/100</span></div>
      <div class="gost"><span class="gogl">운영 시간</span><span class="gogv">${Math.floor(t/60)}분 ${t%60}초</span></div>
      <div class="gost"><span class="gogl">총 생산 포트</span><span class="gogv">◈ ${GS.totalPort.toLocaleString()}</span></div>
      <div class="gost"><span class="gogl">최고 웨이브</span><span class="gogv">${Math.max(GS.wave,bw)}</span></div>
      <div class="gost"><span class="gogl">최고 포트</span><span class="gogv">◈ ${Math.max(GS.totalPort,bp).toLocaleString()}</span></div>
    `;
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
  _lastTs:0,_lhSec:-1,_eggWindow:false,

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
      if(o.escaped){GS.stability-=o.escapeDmg;GS.popups.push(new Popup(R.tx(EXIT.c),R.ty(EXIT.r),'-'+o.escapeDmg,'#EF5350'));GS.ores.splice(i,1);UI.updHUD();if(GS.stability<=0){GS.stability=0;GS.running=false;SFX.gameOver();UI.showGO();return;}}
    }
    sweepArr(GS.ores,o=>o.alive);
    if(GS.waveActive&&GS.oreQ.length===0&&GS.ores.length===0){
      GS.waveActive=false;
      // 클리어 보상: 초반엔 넉넉히, 후반엔 크게
      const bonus=Math.floor(80+GS.wave*18+Math.pow(GS.wave,1.3)*1.5);
      GS.port+=bonus;GS.totalPort+=bonus;GS.portHist.push({t:GS.time,v:bonus});
      SFX.clear();
      if(GS.wave>=100){GS.running=false;UI.showClear();return;}
      UI.showBanner(`W${GS.wave} 클리어! +◈${bonus.toLocaleString()}`,'#FF4500');UI.updHUD();
      checkUnlocks(GS.wave,()=>{if(GS.autoWave){GS.autoActive=true;GS.autoTimer=5;}});
    }
    for(const t of GS.towers)t.update(dt,GS.ores);
    for(const p of GS.projs)p.update(dt);sweepArr(GS.projs,p=>p.alive);
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
    UI.updHUD();UI.showBanner(`웨이브 ${GS.wave} 시작!`,'#FF4500');
  },

  place(row,col){
    if(!GS.running)return;const id=UI.selCard;if(!id)return;
    if(GRID[row][col]===1){UI.showBanner('경로 위에 설치 불가','#EF5350');return;}
    if(towerAt(row,col)){UI.showBanner('이미 설치됨','#EF5350');return;}
    const cost=TWR[id].price;
    if(!GS.eggActive&&GS.port<cost){UI.showBanner('포트가 부족합니다!','#EF5350');return;}
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
    // 10초: 포트 무한 (게임 진행 중만)
    if(GS.running&&this._eggWindow10&&!GS.eggActive){
      GS.eggActive=true;GS.port=999999999;
      for(const id of TWR_ORDER)GS.unlocked.add(id);
      const ico=document.getElementById('hport-ico');
      if(ico){ico.style.color='#FFD700';ico.style.textShadow='0 0 12px #FFD700';}
      UI.showBanner('∞ 포트 무한 활성화!','#FFD700');
      UI.updHUD();return;
    }
    // 20초: 100웨이브 즉시 클리어 (시간만 맞으면 항상)
    if(this._eggWindow20){
      GS.wave=100;GS.waveActive=false;GS.oreQ=[];GS.ores=[];
      GS.running=false;GS.paused=false;
      document.getElementById('pauseovly').classList.remove('show');
      SFX.victory();UI.showClear();
    }
  },
};

window.addEventListener('load',()=>{G.init();UI._showPromo();UI.updHUD();});