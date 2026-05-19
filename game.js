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
  normal:  {name:'일반 원석',   color:'#9E9E9E',hp:18,  spd:44, reward:6,   dmg:2,  grade:1},
  fast:    {name:'고속 원석',   color:'#FF9800',hp:10,  spd:90, reward:8,   dmg:2,  grade:1},
  multi:   {name:'다중 원석',   color:'#29B6F6',hp:35,  spd:46, reward:15,  dmg:3,  grade:2,special:'split'},
  dense:   {name:'고밀도 원석', color:'#5C6BC0',hp:110, spd:26, reward:22,  dmg:5,  grade:3},
  pure:    {name:'고순도 원석', color:'#FFD700',hp:28,  spd:44, reward:35,  dmg:4,  grade:2},
  unstable:{name:'불안정 원석', color:'#4CAF50',hp:48,  spd:74, reward:26,  dmg:10, grade:2,special:'bigdmg'},
  compres: {name:'압축 원석',   color:'#CE93D8',hp:380, spd:20, reward:55,  dmg:8,  grade:3},
  core:    {name:'코어 원석',   color:'#E8F4FF',hp:1800,spd:12, reward:190, dmg:20, grade:4,special:'boss'},
};

const TWR_ORDER=['pixelArm','conveyor','coreShooter','scanner','refinery',
                 'magnetCannon','laserGrid','chainBolt','twinHub','plasmaCutter'];
const TWR={
  // 가격 ∝ DPS 순서로 정렬. DPS = dmg × spd (공격형 기준)
  // ◈80   DPS≈11  → 기본 진입
  pixelArm:    {name:'픽셀 로봇암',   price:80,   color:'#29B6F6',type:'single',   dmg:6,   spd:1.8,  range:2.4, desc:'기본 공격 장비. 로봇팔로 원석을 빠르게 타격.'},
  // ◈150  유틸 — 이동속도 30% 감소, 범위 소형
  conveyor:    {name:'컨베이어',       price:150,  color:'#78909C',type:'slowfield',dmg:0,   spd:0,    range:2.2, desc:'범위 내 원석 이동속도 30% 감소. 중첩 가능.'},
  // ◈320  DPS≈20
  coreShooter: {name:'코어 슈터',     price:320,  color:'#00E676',type:'single',   dmg:20,  spd:1.0,  range:3.0, desc:'가장 멀리 진행한 원석 우선 타겟. 안정적인 포탑.'},
  // ◈480  유틸 — 피해 증폭 +22%
  scanner:     {name:'비전 스캐너',   price:480,  color:'#FFEB3B',type:'scan',     dmg:0,   spd:0,    range:3.4, desc:'범위 내 원석 받는 피해 +22%. 중첩 가능.'},
  // ◈700  유틸 — 포트 수익 +30%
  refinery:    {name:'포트 정제소',   price:700,  color:'#FFD700',type:'buff',     dmg:0,   spd:0,    range:3.2, desc:'범위 내 처치 시 포트 +30%. 중첩 가능.'},
  // ◈1050 DPS≈22 + 35% 감속
  magnetCannon:{name:'마그넷 캐논',   price:1050, color:'#FF7043',type:'focus',    dmg:42,  spd:0,    range:3.2, desc:'단일 대상 집중 레이저 지속 피해. 범위 내 가장 앞 적을 계속 공략.'},
  // ◈1500 DPS≈35×범위(전체) — 코너 광역
  laserGrid:   {name:'레이저 그리드', price:1500, color:'#F50057',type:'aoe',      dmg:22,  spd:1.6,  range:2.4, desc:'범위 내 전체 원석 동시 지속 피해. 코너 최강.'},
  // ◈2100 DPS≈62×연쇄(최대 3타) — 단일 최강급 연쇄
  chainBolt:   {name:'체인 볼트',     price:2100, color:'#D500F9',type:'chain',    dmg:28,  spd:0.75, range:3.2, desc:'첫 타겟 후 2개 연쇄 번개 + 감전 지속 피해 2.5초.'},
  // ◈2800 유틸 — 인접 장비 전체 강화
  twinHub:     {name:'트윈 허브',     price:2800, color:'#1DE9B6',type:'twinhub',  dmg:0,   spd:0,    range:3.8, desc:'인접 장비 공정력+18% 속도+18%. 중첩 가능.'},
  // ◈3800 DPS≈100×관통(최대 6타) — 최고 단일 화력
  plasmaCutter:{name:'플라즈마 커터', price:3800, color:'#FF1744',type:'pierce',   dmg:100, spd:0.42, range:4.0, desc:'직선 관통 최대 6개. 타당 100 피해. 최강 포탑.'},
};
const LVL=[{mult:1},{mult:1.25,cm:.65},{mult:1.55,cm:1.1},{mult:1.9,cm:1.7},{mult:2.4,cm:2.6}];

// ═══════════════════════════════════════════════════════
// 맵
// ═══════════════════════════════════════════════════════
const COLS=14,ROWS2=13,TS=34;
// 캔버스: top=59, bottom=341 → 높이=500px
const CV_W=BASE_W,CV_H=500;
const MAP_W=COLS*TS;       // 476
const MAP_H2=ROWS2*TS;     // 442
const MAP_OX=Math.floor((CV_W-MAP_W)/2); // 2
const MAP_OY=Math.floor((CV_H-MAP_H2)/2); // 29

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
  // 웨이브별 등장 광물 풀 — 점진적 도입
  if(w<=3) return['normal'];
  if(w<=6) return['normal','normal','fast'];
  if(w<=10)return['normal','fast','multi'];
  if(w<=15)return['normal','fast','multi','dense'];
  if(w<=20)return['fast','multi','dense','pure'];
  if(w<=28)return['fast','multi','dense','pure','unstable'];
  if(w<=38)return['multi','dense','pure','unstable','compres'];
  if(w<=55)return['dense','pure','unstable','compres'];
  if(w<=70)return['pure','unstable','compres'];
  return['unstable','compres','dense'];
}
function hpS(w){
  // W1:×1 W10:×2.6 W25:×6.2 W50:×16 W75:×34 W100:×64
  if(w<=1) return 1.0;
  if(w<=10)return 1.0+(w-1)*0.18;
  if(w<=25)return hpS(10)+(w-10)*0.24;
  if(w<=50)return hpS(25)+(w-25)*0.39;
  if(w<=75)return hpS(50)+(w-50)*0.72;
  return hpS(75)+(w-75)*1.20;
}
function spdS(w){
  return 1+Math.min(w-1,99)*0.006;
}
function countS(w){
  if(w<=3)return 4+w;
  return Math.floor(6+w*0.88);
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
  autoWave:false,autoActive:false,autoTimer:0,
  hovR:null,hovC:null,eggActive:false,
};
let _uid=0;const uid=()=>++_uid;

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
  },
  // 경로 타일을 매 프레임 그림 (컨베이어 벨트 애니메이션)
  _drawPath(ctx,gt){
    const SPD=38; // px/s
    const GAP=TS/3.2;
    const RAIL=4;

    for(const{r,c2,dir,ie,ix}of this._pathCells){
      const px=MAP_OX+c2*TS, py=MAP_OY+r*TS;

      // 타일 배경
      ctx.fillStyle='#181818'; ctx.fillRect(px+1,py+1,TS-2,TS-2);
      ctx.strokeStyle='#272727'; ctx.lineWidth=.8; ctx.strokeRect(px+.5,py+.5,TS-1,TS-1);

      if(ie||ix){ continue; }
      if(!dir){ continue; }

      ctx.save();
      ctx.beginPath(); ctx.rect(px+1,py+1,TS-2,TS-2); ctx.clip();

      const isH=(dir==='R'||dir==='L');
      const fwd=(dir==='R'||dir==='D');

      // 레일 (가장자리 2줄)
      ctx.strokeStyle='#303030'; ctx.lineWidth=3;
      if(isH){
        ctx.beginPath();ctx.moveTo(px,py+RAIL);ctx.lineTo(px+TS,py+RAIL);ctx.stroke();
        ctx.beginPath();ctx.moveTo(px,py+TS-RAIL);ctx.lineTo(px+TS,py+TS-RAIL);ctx.stroke();
      }else{
        ctx.beginPath();ctx.moveTo(px+RAIL,py);ctx.lineTo(px+RAIL,py+TS);ctx.stroke();
        ctx.beginPath();ctx.moveTo(px+TS-RAIL,py);ctx.lineTo(px+TS-RAIL,py+TS);ctx.stroke();
      }

      // 움직이는 줄무늬 — 맵 전체 좌표 기준 offset으로 타일 간 이음새 없애기
      const globalOff=(gt*SPD)%GAP;
      ctx.strokeStyle='#3e3e3e'; ctx.lineWidth=1.8;

      if(isH){
        // 가로 이동: 세로 줄무늬, 맵 X 기준
        const origin=fwd? MAP_OX+c2*TS : MAP_OX+(c2+1)*TS;
        const startX=fwd
          ? origin - (( (origin - MAP_OX) % GAP ) - globalOff + GAP) % GAP
          : origin + (( (MAP_OX + MAP_W - origin) % GAP ) - globalOff + GAP) % GAP;
        const step=fwd? GAP : -GAP;
        for(let x=startX; fwd?(x<px+TS+GAP):(x>px-GAP); x+=step){
          ctx.beginPath(); ctx.moveTo(x, py+RAIL+1); ctx.lineTo(x, py+TS-RAIL-1); ctx.stroke();
        }
      }else{
        // 세로 이동: 가로 줄무늬, 맵 Y 기준
        const origin=fwd? MAP_OY+r*TS : MAP_OY+(r+1)*TS;
        const startY=fwd
          ? origin - (( (origin - MAP_OY) % GAP ) - globalOff + GAP) % GAP
          : origin + (( (MAP_OY + MAP_H2 - origin) % GAP ) - globalOff + GAP) % GAP;
        const step=fwd? GAP : -GAP;
        for(let y=startY; fwd?(y<py+TS+GAP):(y>py-GAP); y+=step){
          ctx.beginPath(); ctx.moveTo(px+RAIL+1, y); ctx.lineTo(px+TS-RAIL-1, y); ctx.stroke();
        }
      }

      // 중앙 화살표 (반투명)
      const mx=px+TS/2, my=py+TS/2, as=4;
      ctx.save(); ctx.translate(mx,my);
      if(dir==='R')ctx.rotate(0);
      else if(dir==='L')ctx.rotate(Math.PI);
      else if(dir==='D')ctx.rotate(Math.PI/2);
      else ctx.rotate(-Math.PI/2);
      ctx.fillStyle='#ffffff1a';
      ctx.beginPath();ctx.moveTo(as,0);ctx.lineTo(-as,as*.8);ctx.lineTo(-as,-as*.8);ctx.closePath();ctx.fill();
      ctx.restore();

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
        const ok=GRID[r][c2]===0&&!GS.towers.find(t=>t.row===r&&t.col===c2);
        const px=MAP_OX+c2*TS,py=MAP_OY+r*TS;
        ctx.fillStyle=ok?'rgba(255,255,255,.12)':'rgba(239,83,80,.12)';ctx.fillRect(px,py,TS,TS);
        ctx.strokeStyle=ok?'#ffffff':'#EF5350';ctx.lineWidth=2;ctx.strokeRect(px+1,py+1,TS-2,TS-2);
        if(ok&&TWR[UI.selCard])this.drawRange(ctx,this.tx(c2),this.ty(r),TWR[UI.selCard].range,TWR[UI.selCard].color);
      }
    }
    if(UI.selTwr)this.drawRange(ctx,UI.selTwr.cx,UI.selTwr.cy,UI.selTwr.getRange(),UI.selTwr.color);
    // 4. 게임 오브젝트
    for(const e of GS.effects)e.draw(ctx,gt);
    for(const t of GS.towers)t.draw(ctx,gt);
    for(const o of GS.ores)o.draw(ctx,gt);
    for(const p of GS.projs)p.draw(ctx);
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
    this.shockTimer=0;this.shockDps=0;
    this.flashT=0;this.spin=Math.random()*Math.PI*2;
    const sz=[0,TS*.21,TS*.26,TS*.32,TS*.40];this.radius=sz[this.grade]||TS*.21;
  }
  update(dt){
    if(!this.alive)return;
    if(this.slowTimer>0){this.slowTimer-=dt;if(this.slowTimer<=0){this.spd=this.baseSpd;this._sR=0;}}
    if(this.ampTimer>0)this.ampTimer-=dt;if(this.flashT>0)this.flashT-=dt;
    if(this.shockTimer>0){
      this.shockTimer-=dt;
      let sd=this.shockDps*dt;if(this.ampTimer>0)sd*=(1+this.ampRatio);
      this.hp-=sd;this.flashT=.04;
      if(this.hp<=0&&this.alive){this.alive=false;this._die();}
      if(this.shockTimer<=0)this.shockDps=0;
    }
    let mv=this.spd*dt;
    while(mv>0&&this.pathIdx<PATH.length-1){
      const fr=PATH[this.pathIdx],to=PATH[this.pathIdx+1];
      const fx=R.tx(fr.c),fy=R.ty(fr.r),tx2=R.tx(to.c),ty2=R.ty(to.r);
      const seg=Math.hypot(tx2-fx,ty2-fy),rem=seg*(1-this.progress);
      if(mv>=rem){mv-=rem;this.pathIdx++;this.progress=0;this.x=tx2;this.y=ty2;}
      else{this.progress+=mv/seg;this.x=fx+(tx2-fx)*this.progress;this.y=fy+(ty2-fy)*this.progress;mv=0;}
    }
    if(this.pathIdx>=PATH.length-1){this.escaped=true;this.alive=false;}
  }
  takeDmg(dmg){
    if(!this.alive)return;let d=dmg;if(this.ampTimer>0)d*=(1+this.ampRatio);
    this.hp-=d;this.flashT=.1;if(this.hp<=0){this.alive=false;this._die();}
  }
  _die(){
    SFX.hit(this.grade>=3);
    if(this.special==='split'){for(let i=0;i<3;i++){const o=new Ore('normal',this.wave);o.pathIdx=this.pathIdx;o.progress=this.progress;o.x=this.x;o.y=this.y;GS.ores.push(o);}}
    for(let i=0;i<12;i++)GS.particles.push(new Particle(this.x,this.y,this.color,i,12));
    let pm=1;
    for(const t of GS.towers){
      if(t.type==='buff'&&Math.hypot(t.cx-this.x,t.cy-this.y)<=t.getRange()*TS)pm+=.30*t._lm();
      if(t.type==='twinhub'&&Math.hypot(t.cx-this.x,t.cy-this.y)<=t.getRange()*TS)pm+=.05*t._lm();
    }
    const pr=Math.round(this.reward*pm);
    GS.port+=pr;GS.totalPort+=pr;GS.portHist.push({t:GS.time,v:pr});
    GS.popups.push(new Popup(this.x,this.y-this.radius-5,'+'+pr,'#FFD700'));UI.updHUD();
  }
  applySlow(ratio,dur){this._sR=Math.max(this._sR,ratio);this.spd=this.baseSpd*(1-this._sR);if(this.slowTimer<dur)this.slowTimer=dur;}
  applyAmp(ratio,dur){this.ampRatio=Math.max(this.ampRatio,ratio);if(this.ampTimer<dur)this.ampTimer=dur;}
  applyShock(dps,dur){this.shockDps=Math.max(this.shockDps,dps);if(this.shockTimer<dur)this.shockTimer=dur;}
  draw(ctx,gt){
    if(!this.alive)return;
    const r=this.radius,spRate=[0,.85,.62,.44,.28][this.grade]||.7,sp=this.spin+gt*spRate;
    ctx.save();ctx.translate(this.x,this.y);
    if(this.special==='boss'){ctx.shadowColor=this.color;ctx.shadowBlur=20+Math.sin(gt*2)*5;}
    if(this.flashT>0){ctx.shadowColor='#fff';ctx.shadowBlur=22;}
    ctx.beginPath();
    for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2+sp,dr=i%2===0?r:r*.76;if(i===0)ctx.moveTo(Math.cos(a)*dr,Math.sin(a)*dr);else ctx.lineTo(Math.cos(a)*dr,Math.sin(a)*dr);}
    ctx.closePath();
    const g=ctx.createRadialGradient(-r*.12,-r*.18,r*.04,0,0,r);
    g.addColorStop(0,'#fff');g.addColorStop(.18,this.color+'ff');g.addColorStop(.62,this.color+'cc');g.addColorStop(1,this.color+'33');
    ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=this.color;ctx.lineWidth=1.2;ctx.stroke();
    ctx.beginPath();
    for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2+sp,dr=i%2===0?r*.6:r*.46;if(i===0)ctx.moveTo(Math.cos(a)*dr,Math.sin(a)*dr);else ctx.lineTo(Math.cos(a)*dr,Math.sin(a)*dr);}
    ctx.closePath();
    const hi=ctx.createRadialGradient(-r*.18,-r*.22,0,0,0,r*.58);hi.addColorStop(0,'rgba(255,255,255,.42)');hi.addColorStop(.5,'rgba(255,255,255,.06)');hi.addColorStop(1,'transparent');ctx.fillStyle=hi;ctx.fill();
    if(this.special==='boss'){ctx.strokeStyle=this.color+'66';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(0,0,r*1.35,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
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
    this._tDmg=0;this._tSpd=0;this._armAngle=-Math.PI/2;this._focusTgt=null;this._soundT=0;
  }
  _lm(){return LVL[this.level-1].mult;}
  _calcTwin(){this._tDmg=0;this._tSpd=0;for(const t of GS.towers)if(t.type==='twinhub'&&t.uid!==this.uid&&Math.hypot(t.cx-this.cx,t.cy-this.cy)<=t.getRange()*TS){this._tDmg+=.18*t._lm();this._tSpd+=.18*t._lm();}}
  getDmg(){return TWR[this.tId].dmg*(1+this._tDmg)*this._lm();}
  getSpd(){return TWR[this.tId].spd*(1+this._tSpd)*this._lm();}
  getRange(){return TWR[this.tId].range;}
  update(dt,ores){
    this._animT+=dt;this._calcTwin();if(this._firingT>0)this._firingT-=dt;
    const tp=this.type;
    if(tp==='slowfield'){const rng=this.getRange()*TS;for(const o of ores)if(o.alive&&Math.hypot(o.x-this.cx,o.y-this.cy)<=rng)o.applySlow(.25*this._lm(),.22);return;}
    if(tp==='scan'){const rng=this.getRange()*TS;for(const o of ores)if(o.alive&&Math.hypot(o.x-this.cx,o.y-this.cy)<=rng)o.applyAmp(.22*this._lm(),3.2);return;}
    if(tp==='buff'||tp==='twinhub')return;
    if(tp==='focus'){
      if(this._focusTgt&&(!this._focusTgt.alive||Math.hypot(this._focusTgt.x-this.cx,this._focusTgt.y-this.cy)>this.getRange()*TS))this._focusTgt=null;
      if(!this._focusTgt)this._focusTgt=this._findTgt(ores);
      if(this._focusTgt){
        this._focusTgt.takeDmg(this.getDmg()*dt);
        this.angle=Math.atan2(this._focusTgt.y-this.cy,this._focusTgt.x-this.cx);
        this._firingT=.18;
        this._soundT-=dt;if(this._soundT<=0){SFX.shoot('magnetCannon');this._soundT=.38;}
      }
      return;
    }
    if(tp==='aoe'){
      this._aoeT+=dt;const iv=1/Math.max(.1,this.getSpd());
      if(this._aoeT>=iv){this._aoeT=0;const rng=this.getRange()*TS;let hit=false;for(const o of ores)if(o.alive&&Math.hypot(o.x-this.cx,o.y-this.cy)<=rng){o.takeDmg(this.getDmg()*iv);hit=true;}if(hit){this._firingT=.22;GS.effects.push(new RingEff(this.cx,this.cy,this.getRange()*TS,this.color));SFX.shoot('aoe');}}return;}
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
  _findTgt(ores){const rng=this.getRange()*TS;let best=null,bestP=-1;for(const o of ores){if(!o.alive||Math.hypot(o.x-this.cx,o.y-this.cy)>rng)continue;if(this.tId==='pixelArm'&&o.type==='fast'){best=o;break;}const p=o.pathIdx+o.progress;if(p>bestP){bestP=p;best=o;}}return best;}
  _fire(tgt){const sz=this.tId==='pixelArm'?.45:1;GS.projs.push(new Proj(this.cx,this.cy,tgt,this.getDmg(),{color:this.color,slow:null,size:sz}));}
  _firePierce(ores){const rng=this.getRange()*TS;let best=null,bestP=-1;for(const o of ores){if(!o.alive||Math.hypot(o.x-this.cx,o.y-this.cy)>rng)continue;const p=o.pathIdx+o.progress;if(p>bestP){bestP=p;best=o;}}if(!best)return;this.angle=Math.atan2(best.y-this.cy,best.x-this.cx);const dx=Math.cos(this.angle),dy=Math.sin(this.angle);let hit=0;for(const o of ores){if(!o.alive||hit>=6)continue;const ex=o.x-this.cx,ey=o.y-this.cy,dot=ex*dx+ey*dy;if(dot<0||dot>rng)continue;if(Math.abs(ex*dy-ey*dx)<TS*.5){o.takeDmg(this.getDmg());hit++;}}GS.effects.push(new LaserEff(this.cx,this.cy,this.angle,rng,this.color));}
  _fireChain(ores){const rng=this.getRange()*TS;const first=this._findTgt(ores);if(!first)return;this.angle=Math.atan2(first.y-this.cy,first.x-this.cx);const targets=[first];let last=first;for(let i=1;i<3;i++){let nx=null,bd=rng*1.6;for(const o of ores){if(!o.alive||targets.includes(o))continue;const d=Math.hypot(o.x-last.x,o.y-last.y);if(d<bd){bd=d;nx=o;}}if(!nx)break;targets.push(nx);last=nx;}const base=this.getDmg(),mults=[1,.80,.60];const shockDps=base*0.5,shockDur=2.5;for(let i=0;i<targets.length;i++){targets[i].takeDmg(base*mults[i]);targets[i].applyShock(shockDps*mults[i],shockDur);if(i>0)GS.effects.push(new BoltEff(targets[i-1].x,targets[i-1].y,targets[i].x,targets[i].y,this.color));}GS.effects.push(new BoltEff(this.cx,this.cy,targets[0].x,targets[0].y,this.color));}

  draw(ctx,gt){
    const r=TS*.44,t=this._animT,f=this._firingT>0;
    ctx.save();ctx.translate(this.cx,this.cy);
    if(this.tId==='coreShooter')this._dCS(ctx,r,t,f);
    else if(this.tId==='pixelArm')this._dPA(ctx,r,t,f);
    else switch(this.type){
      case'aoe':this._dAOE(ctx,r,t,f);break;case'focus':this._dSlow(ctx,r,t,f);break;case'slow':this._dSlow(ctx,r,t,f);break;
      case'pierce':this._dPierce(ctx,r,t,f);break;case'chain':this._dChain(ctx,r,t,f);break;
      case'slowfield':this._dSlowField(ctx,r,t);break;case'scan':this._dScan(ctx,r,t);break;
      case'buff':this._dRefinery(ctx,r,t);break;case'twinhub':this._dTwinHub(ctx,r,t);break;
    }
    ctx.restore();
    if(this.type==='focus'&&this._focusTgt&&this._focusTgt.alive&&this._firingT>0){
      ctx.save();
      const pulse=.6+Math.sin(Date.now()*.02)*.4;
      ctx.strokeStyle=this.color;ctx.lineWidth=2+pulse;
      ctx.shadowColor=this.color;ctx.shadowBlur=10+pulse*4;
      ctx.globalAlpha=.8;ctx.setLineDash([5,3]);
      ctx.beginPath();ctx.moveTo(this.cx,this.cy);ctx.lineTo(this._focusTgt.x,this._focusTgt.y);ctx.stroke();
      ctx.setLineDash([]);ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
    }
    if(this.level>1){ctx.fillStyle=this.color;ctx.font=`900 ${Math.floor(r*.3)}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText('★'.repeat(this.level-1),this.cx,this.cy+r*.56);}
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
  // 코어슈터: 포탑, 기본방향 위(↑)
  _dCS(ctx,r,t,f){
    const col=this.color;
    this._base(ctx,r,col,'circle');
    ctx.strokeStyle='#ffffff15';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r*.65,0,Math.PI*2);ctx.stroke();
    ctx.save();ctx.rotate(this.angle+Math.PI/2);
    // 포탑 몸체 (중앙 아래쪽)
    ctx.fillStyle='#2e2e2e';ctx.strokeStyle='#666';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.roundRect(-r*.22,-r*.18,r*.44,r*.36,r*.06);ctx.fill();ctx.stroke();
    // 포신 (위쪽 = 발사 방향)
    ctx.fillStyle='#777';
    ctx.beginPath();ctx.roundRect(-r*.1,-r*.85,r*.2,r*.7,r*.04);ctx.fill();
    ctx.strokeStyle='#999';ctx.lineWidth=1;ctx.strokeRect(-r*.1,-r*.85,r*.2,r*.7);
    // 포신 끝 강조
    ctx.fillStyle=f?col:'#444';
    ctx.beginPath();ctx.roundRect(-r*.12,-r*.88,r*.24,r*.08,r*.02);ctx.fill();
    // 포신 중앙 홈
    ctx.strokeStyle='#555';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,-r*.82);ctx.lineTo(0,-r*.2);ctx.stroke();
    ctx.restore();
    this._core(ctx,r,col);
  }
  // 픽셀 로봇암: 정교한 관절형 로봇팔, 기본방향 위(↑)
  _dPA(ctx,r,t,f){
    const col=this.color;
    const bs=r*.82;
    // 베이스 플레이트 — 외곽에 색상 테두리 포인트
    ctx.fillStyle='#1a1a1a';ctx.strokeStyle='#444';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(-bs,-bs,bs*2,bs*2,r*.1);ctx.fill();ctx.stroke();
    // 컬러 테두리 강조선
    ctx.strokeStyle=col+'44';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(-bs*.92,-bs*.92,bs*1.84,bs*1.84,r*.08);ctx.stroke();
    ctx.strokeStyle='#2e2e2e';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(-bs*.75,-bs*.75,bs*1.5,bs*1.5,r*.06);ctx.stroke();
    const bv=bs*.62;
    // 코너 볼트 — 컬러로 강조
    for(const[bx,by]of[[-bv,-bv],[bv,-bv],[-bv,bv],[bv,bv]]){
      ctx.fillStyle=col+'66';ctx.strokeStyle=col+'88';ctx.lineWidth=.8;
      ctx.beginPath();ctx.arc(bx,by,r*.055,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#111';ctx.lineWidth=.8;
      ctx.beginPath();ctx.moveTo(bx-r*.03,by);ctx.lineTo(bx+r*.03,by);ctx.moveTo(bx,by-r*.03);ctx.lineTo(bx,by+r*.03);ctx.stroke();
    }
    // 어깨 관절 — 컬러 링
    ctx.fillStyle='#2e2e2e';ctx.strokeStyle=col+'88';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(0,0,r*.28,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle=col+'44';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r*.2,0,Math.PI*2);ctx.stroke();
    const armDir=(this._armAngle||0)-Math.PI/2;
    const swing=f?Math.sin(t*20)*.25:0;
    ctx.save();ctx.rotate(armDir+swing);
    // 상완 — 컬러 측면 스트라이프
    ctx.fillStyle='#2a2a2a';ctx.strokeStyle='#555';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.roundRect(-r*.1,0,r*.2,r*.38,r*.04);ctx.fill();ctx.stroke();
    // 측면 색상 스트라이프
    ctx.fillStyle=col+'55';ctx.beginPath();ctx.roundRect(-r*.1,r*.04,r*.04,r*.3,r*.02);ctx.fill();
    ctx.strokeStyle='#3a3a3a';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-r*.06,r*.06);ctx.lineTo(-r*.06,r*.32);ctx.stroke();
    ctx.beginPath();ctx.moveTo(r*.06,r*.06);ctx.lineTo(r*.06,r*.32);ctx.stroke();
    ctx.strokeStyle=col+'66';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,r*.06);ctx.lineTo(0,r*.32);ctx.stroke();
    // 팔꿈치 — 컬러 링 강화
    const el={x:0,y:r*.42};
    ctx.fillStyle='#222';ctx.strokeStyle=col+'99';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(el.x,el.y,r*.14,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle=col+'88';ctx.beginPath();ctx.arc(el.x,el.y,r*.08,0,Math.PI*2);ctx.fill();
    // 전완
    const fa=f?.3:0;
    ctx.save();ctx.translate(el.x,el.y);ctx.rotate(fa);
    ctx.fillStyle='#252525';ctx.strokeStyle='#505050';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.roundRect(-r*.085,0,r*.17,r*.32,r*.04);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#333';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-r*.07,r*.1);ctx.lineTo(r*.07,r*.1);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-r*.07,r*.2);ctx.lineTo(r*.07,r*.2);ctx.stroke();
    // 손목
    ctx.fillStyle='#1e1e1e';ctx.strokeStyle='#555';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.arc(0,r*.34,r*.1,0,Math.PI*2);ctx.fill();ctx.stroke();
    // 집게 — 각진 기계식
    ctx.save();ctx.translate(0,r*.34);
    ctx.lineCap='square';ctx.lineJoin='miter';
    if(f){
      // 발사 상태: 집게 열림 + 색상 강조
      ctx.strokeStyle=col;ctx.lineWidth=r*.11;
      // 좌측 집게 — L자형
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-r*.2,r*.12);ctx.lineTo(-r*.24,r*.28);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-r*.24,r*.28);ctx.lineTo(-r*.3,r*.28);ctx.stroke();
      // 우측 집게 — L자형
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(r*.2,r*.12);ctx.lineTo(r*.24,r*.28);ctx.stroke();
      ctx.beginPath();ctx.moveTo(r*.24,r*.28);ctx.lineTo(r*.3,r*.28);ctx.stroke();
      // 중앙 샤프트
      ctx.strokeStyle=col+'cc';ctx.lineWidth=r*.07;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,r*.22);ctx.stroke();
      // 집게 끝 포인트 강조 (흰색)
      ctx.strokeStyle='#fff';ctx.lineWidth=r*.05;
      ctx.beginPath();ctx.moveTo(-r*.3,r*.28);ctx.lineTo(-r*.3,r*.34);ctx.stroke();
      ctx.beginPath();ctx.moveTo(r*.3,r*.28);ctx.lineTo(r*.3,r*.34);ctx.stroke();
    } else {
      // 대기 상태: 집게 닫힘
      ctx.strokeStyle='#666';ctx.lineWidth=r*.1;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-r*.13,r*.14);ctx.lineTo(-r*.16,r*.26);ctx.stroke();
      ctx.beginPath();ctx.moveTo(-r*.16,r*.26);ctx.lineTo(-r*.22,r*.26);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(r*.13,r*.14);ctx.lineTo(r*.16,r*.26);ctx.stroke();
      ctx.beginPath();ctx.moveTo(r*.16,r*.26);ctx.lineTo(r*.22,r*.26);ctx.stroke();
      ctx.strokeStyle='#555';ctx.lineWidth=r*.07;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,r*.2);ctx.stroke();
    }
    ctx.restore();ctx.restore();ctx.restore();
  }
  // AOE: 레이저 격자판
  _dAOE(ctx,r,t,f){
    const col=this.color;
    ctx.save();ctx.rotate(Math.PI/4+t*.25);const sq=r*.82;
    ctx.fillStyle='#1a1a1acc';ctx.beginPath();ctx.roundRect(-sq,-sq,sq*2,sq*2,sq*.14);ctx.fill();
    ctx.strokeStyle=f?'#999':'#444';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
    ctx.save();ctx.rotate(t*.35);ctx.globalAlpha=f?.85:.4;ctx.strokeStyle=col;ctx.lineWidth=1.2;
    for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*r*.28,-r*.72);ctx.lineTo(i*r*.28,r*.72);ctx.stroke();ctx.beginPath();ctx.moveTo(-r*.72,i*r*.28);ctx.lineTo(r*.72,i*r*.28);ctx.stroke();}
    ctx.globalAlpha=1;ctx.restore();this._core(ctx,r,col);
  }
  // 마그넷 캐논: 전자기포, 기본방향 위(↑)
  _dSlow(ctx,r,t,f){
    const col=this.color;
    this._base(ctx,r,col,'circle');
    // 전자기 링
    for(let i=0;i<3;i++){
      const rr=r*(.82-i*.14);
      ctx.strokeStyle=i===0?(f?col+'cc':'#555'):i===1?'#444':'#333';
      ctx.lineWidth=i===0?2.5:1.5;
      ctx.setLineDash(i%2===0?[]:[rr*.3,rr*.15]);
      ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.save();ctx.rotate(this.angle+Math.PI/2);
    // 포신 몸체
    ctx.fillStyle='#2a2a2a';ctx.strokeStyle='#666';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.roundRect(-r*.13,-r*.78,r*.26,r*.58,r*.06);ctx.fill();ctx.stroke();
    // 포신 내부 코일 줄
    ctx.strokeStyle=col+'55';ctx.lineWidth=1;
    for(let i=0;i<4;i++){const y=-r*.68+i*r*.12;ctx.beginPath();ctx.moveTo(-r*.1,y);ctx.lineTo(r*.1,y);ctx.stroke();}
    // 포구 (앞쪽 끝)
    ctx.fillStyle=f?col:'#EF5350';
    ctx.beginPath();ctx.arc(0,-r*.78,r*.09,0,Math.PI*2);ctx.fill();
    if(f){ctx.fillStyle='#ffffffcc';ctx.beginPath();ctx.arc(0,-r*.78,r*.12,0,Math.PI*2);ctx.fill();}
    ctx.restore();
    ctx.beginPath();ctx.arc(0,0,r*.18,0,Math.PI*2);ctx.fillStyle='#1a1a1a';ctx.fill();
    ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.stroke();
  }
  // 플라즈마 커터: 대형 레일건, 기본방향 위(↑)
  _dPierce(ctx,r,t,f){
    const col=this.color;
    // 사각 베이스 (45도 회전)
    ctx.save();ctx.rotate(Math.PI/4);
    ctx.fillStyle='#181818cc';ctx.beginPath();ctx.rect(-r*.84,-r*.84,r*1.68,r*1.68);ctx.fill();
    ctx.strokeStyle=f?'#888':'#444';ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle='#333';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-r*.84,0);ctx.lineTo(r*.84,0);ctx.moveTo(0,-r*.84);ctx.lineTo(0,r*.84);ctx.stroke();
    ctx.restore();
    // 에너지 링
    ctx.strokeStyle=col+(f?'88':'33');ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(0,0,r*.62,0,Math.PI*2);ctx.stroke();
    ctx.save();ctx.rotate(this.angle+Math.PI/2);
    // 레일건 포신 — 넓고 두꺼운 이중 레일
    ctx.fillStyle='#252525';ctx.strokeStyle='#555';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(-r*.22,-r*.9,r*.44,r*.7,r*.04);ctx.fill();ctx.stroke();
    // 레일 두 줄
    ctx.strokeStyle='#777';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(-r*.15,-r*.85);ctx.lineTo(-r*.15,-r*.24);ctx.stroke();
    ctx.beginPath();ctx.moveTo(r*.15,-r*.85);ctx.lineTo(r*.15,-r*.24);ctx.stroke();
    // 포신 내부 (발사 시 활성화)
    ctx.fillStyle=f?col:'#2a2a2a';ctx.fillRect(-r*.1,-r*.82,r*.2,r*.56);
    // 포구 플레어
    ctx.fillStyle=f?'#fff':col+'66';ctx.strokeStyle=col;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(-r*.24,-r*.94,r*.48,r*.1,r*.03);ctx.fill();ctx.stroke();
    ctx.restore();
    this._core(ctx,r,col);
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
  _dSlowField(ctx,r,t){const col=this.color;this._base(ctx,r,col,'circle');for(let i=0;i<3;i++){const ph=(t*1.5+i*1.1)%(Math.PI*2),rr=r*(.28+i*.24)+Math.sin(ph)*r*.04;ctx.globalAlpha=.18+i*.12;ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,rr,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;ctx.save();ctx.rotate(t*.8);ctx.strokeStyle=col+'88';ctx.lineWidth=1.2;ctx.beginPath();for(let a=0;a<Math.PI*3;a+=.15){const rr=r*.05+a*r*.038;if(a===0)ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);else ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.stroke();ctx.restore();ctx.beginPath();ctx.arc(0,0,r*.17,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();}
  _dScan(ctx,r,t){const col=this.color;this._base(ctx,r,col,'circle');ctx.setLineDash([3,4]);ctx.strokeStyle=col+'55';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,r*.7,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.44,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.save();ctx.rotate(t*1.8);ctx.fillStyle=col+'28';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r*.7,-Math.PI*.22,Math.PI*.22);ctx.closePath();ctx.fill();ctx.restore();ctx.strokeStyle=col+'88';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-r*.48,0);ctx.lineTo(r*.48,0);ctx.moveTo(0,-r*.48);ctx.lineTo(0,r*.48);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.15,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();}
  _dRefinery(ctx,r,t){
    const col=this.color;this._base(ctx,r,col,'oct');
    ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,r*.68,0,Math.PI*2);ctx.stroke();
    ctx.save();ctx.rotate(t*.5);ctx.strokeStyle=col+'88';ctx.lineWidth=1.5;
    const gr=r*.52,tooth=r*.12;
    for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*gr,Math.sin(a)*gr);ctx.lineTo(Math.cos(a)*(gr+tooth),Math.sin(a)*(gr+tooth));ctx.stroke();}
    ctx.beginPath();ctx.arc(0,0,gr,0,Math.PI*2);ctx.stroke();ctx.restore();
    const fly=Math.sin(t*2)*r*.06;ctx.fillStyle=col;
    ctx.beginPath();ctx.moveTo(0,-r*.38+fly);ctx.lineTo(-r*.22,-r*.08+fly);ctx.lineTo(-r*.1,-r*.08+fly);ctx.lineTo(-r*.1,r*.28+fly);ctx.lineTo(r*.1,r*.28+fly);ctx.lineTo(r*.1,-r*.08+fly);ctx.lineTo(r*.22,-r*.08+fly);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.roundRect(-r*.06,-r*.33+fly,r*.12,r*.16,r*.03);ctx.fill();
  }
  _dTwinHub(ctx,r,t){const col=this.color;this._base(ctx,r,col,'circle');ctx.save();ctx.rotate(t*.65);ctx.strokeStyle=col+'88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(-r*.28,0,r*.4,0,Math.PI*2);ctx.stroke();ctx.restore();ctx.save();ctx.rotate(-t*.65);ctx.strokeStyle=col+'88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(r*.28,0,r*.4,0,Math.PI*2);ctx.stroke();ctx.restore();ctx.fillStyle=col+'aa';ctx.beginPath();ctx.arc(-r*.28,0,r*.09,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(r*.28,0,r*.09,0,Math.PI*2);ctx.fill();ctx.strokeStyle=col+'cc';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-r*.17,0);ctx.lineTo(r*.17,0);ctx.stroke();this._core(ctx,r,col);}
}

// ═══════════════════════════════════════════════════════
// 이펙트
// ═══════════════════════════════════════════════════════
class Proj{constructor(x,y,tgt,dmg,opts){this.x=x;this.y=y;this.target=tgt;this.dmg=dmg;this.color=opts.color||'#00E5FF';this.slow=opts.slow||null;this.size=opts.size||1;this.spd=420;this.alive=true;this.trail=[];}update(dt){if(!this.alive)return;if(!this.target||!this.target.alive){this.alive=false;return;}const dx=this.target.x-this.x,dy=this.target.y-this.y,d=Math.hypot(dx,dy);if(d<this.spd*dt+6){this.target.takeDmg(this.dmg);if(this.slow)this.target.applySlow(this.slow.ratio,this.slow.dur);this.alive=false;return;}this.trail.unshift({x:this.x,y:this.y});if(this.trail.length>7)this.trail.pop();const sp=this.spd*dt/d;this.x+=dx*sp;this.y+=dy*sp;}draw(ctx){if(!this.alive)return;const sz=this.size;for(let i=0;i<this.trail.length;i++){ctx.globalAlpha=(1-i/this.trail.length)*.48;ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.trail[i].x,this.trail[i].y,(3.2-i*.3)*sz,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.shadowColor=this.color;ctx.shadowBlur=9;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(this.x,this.y,4.2*sz,0,Math.PI*2);ctx.fill();ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x,this.y,2.6*sz,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}}
class RingEff{constructor(x,y,r,col){this.x=x;this.y=y;this.r=r;this.col=col;this.life=this.max=.32;}update(dt){this.life-=dt;}draw(ctx){if(this.life<=0)return;const p=this.life/this.max;ctx.globalAlpha=p*.48;ctx.strokeStyle=this.col;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(this.x,this.y,this.r*(1.28-p*.28),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}}
class LaserEff{constructor(x,y,dir,len,col){this.x=x;this.y=y;this.dir=dir;this.len=len;this.col=col;this.life=this.max=.2;}update(dt){this.life-=dt;}draw(ctx){if(this.life<=0)return;const p=this.life/this.max;ctx.globalAlpha=p*.82;ctx.shadowColor=this.col;ctx.shadowBlur=11;ctx.strokeStyle=this.col;ctx.lineWidth=3.5+p*2;ctx.beginPath();ctx.moveTo(this.x,this.y);ctx.lineTo(this.x+Math.cos(this.dir)*this.len,this.y+Math.sin(this.dir)*this.len);ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=1;}}
class BoltEff{
  constructor(x1,y1,x2,y2,col){
    this.col=col;this.life=this.max=.22;
    const n=7;
    this.pts=[{x:x1,y:y1}];
    const dist=Math.hypot(x2-x1,y2-y1);
    for(let i=1;i<n;i++){
      const f=i/n,px=x1+(x2-x1)*f,py=y1+(y2-y1)*f;
      const jitter=dist*.14;
      this.pts.push({x:px+(Math.random()-.5)*jitter,y:py+(Math.random()-.5)*jitter});
    }
    this.pts.push({x:x2,y:y2});
  }
  update(dt){this.life-=dt;}
  draw(ctx){
    if(this.life<=0)return;
    const p=this.life/this.max;
    // 외곽 글로우
    ctx.globalAlpha=p*.5;ctx.shadowColor=this.col;ctx.shadowBlur=10;
    ctx.strokeStyle=this.col+'88';ctx.lineWidth=4;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(this.pts[0].x,this.pts[0].y);
    for(let i=1;i<this.pts.length;i++)ctx.lineTo(this.pts[i].x,this.pts[i].y);
    ctx.stroke();
    // 코어 라인
    ctx.globalAlpha=p*.95;ctx.shadowBlur=4;
    ctx.strokeStyle='#fff';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(this.pts[0].x,this.pts[0].y);
    for(let i=1;i<this.pts.length;i++)ctx.lineTo(this.pts[i].x,this.pts[i].y);
    ctx.stroke();
    ctx.shadowBlur=0;ctx.globalAlpha=1;
  }
}
class Particle{constructor(x,y,col,i,n){this.x=x;this.y=y;this.col=col;const a=(i/n)*Math.PI*2+Math.random()*.5,sp=48+Math.random()*88;this.vx=Math.cos(a)*sp;this.vy=Math.sin(a)*sp;this.life=this.max=.48+Math.random()*.32;this.r=2+Math.random()*3;}update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;this.vy+=80*dt;this.life-=dt;}draw(ctx){if(this.life<=0)return;const p=this.life/this.max;ctx.globalAlpha=p;ctx.fillStyle=this.col;ctx.beginPath();ctx.arc(this.x,this.y,this.r*p,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}}
class Popup{constructor(x,y,text,col){this.x=x;this.y=y;this.text=text;this.col=col;this.life=this.max=1.3;this.vy=-40;}update(dt){this.y+=this.vy*dt;this.life-=dt;}draw(ctx){if(this.life<=0)return;const p=Math.min(1,this.life/this.max*1.5);ctx.globalAlpha=p;ctx.font='bold 13px sans-serif';ctx.fillStyle=this.col;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(this.text,this.x,this.y);ctx.globalAlpha=1;}}

// ═══════════════════════════════════════════════════════
// 웨이브 생성
// ═══════════════════════════════════════════════════════
function makeWave(w){
  const pool=getPool(w),count=countS(w),q=[];
  for(let i=0;i<count;i++)q.push({type:pool[Math.floor(Math.random()*pool.length)],delay:i*.88});
  if(w%10===0&&w>0)q.push({type:'core',delay:q.length*.88});
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
      case'slowfield':dummy._dSlowField(ctx,r,0);break;case'scan':dummy._dScan(ctx,r,0);break;
      case'buff':dummy._dRefinery(ctx,r,0);break;case'twinhub':dummy._dTwinHub(ctx,r,0);break;
    }
    ctx.restore();
  },

  _selCard(id){
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
    if(d.type==='scan')tags+=`<span class="mc-tag">증폭 <b>+22%</b></span>`;
    if(d.type==='buff')tags+=`<span class="mc-tag">포트 <b>+30%</b></span>`;
    if(d.type==='chain')tags+=`<span class="mc-tag">연쇄 <b>3개</b></span>`;
    if(d.type==='pierce')tags+=`<span class="mc-tag">관통 <b>6개</b></span>`;
    if(d.type==='twinhub')tags+=`<span class="mc-tag">버프 <b>+18%/+18%</b></span>`;
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
    const found=GS.towers.find(t=>t.row===row&&t.col===col);
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
    document.getElementById('mi-lvl').textContent='★'.repeat(tower.level)+'☆'.repeat(5-tower.level)+' Lv.'+tower.level;
    let s='';
    if(d.dmg>0)s+=`<div class="tis">공정력<span>${tower.getDmg().toFixed(1)}</span></div>`;
    if(d.spd>0)s+=`<div class="tis">속도<span>${tower.getSpd().toFixed(1)}/초</span></div>`;
    s+=`<div class="tis">범위<span>${d.range}</span></div>`;
    if(tower.type==='focus')s+=`<div class="tis">집중 레이저<span>지속</span></div>`;
    if(tower.type==='scan')s+=`<div class="tis">증폭<span>+${(22*tower._lm()).toFixed(0)}%</span></div>`;
    if(tower.type==='buff')s+=`<div class="tis">포트<span>+${(30*tower._lm()).toFixed(0)}%</span></div>`;
    if(tower.type==='chain')s+=`<div class="tis">연쇄<span>3개</span></div>`;
    if(tower.type==='pierce')s+=`<div class="tis">관통<span>6개</span></div>`;
    if(tower.type==='twinhub'){s+=`<div class="tis">공정+<span>${(18*tower._lm()).toFixed(0)}%</span></div>`;s+=`<div class="tis">속도+<span>${(18*tower._lm()).toFixed(0)}%</span></div>`;}
    if(tower.level<5){const nc=Math.round(tower.basePrice*LVL[tower.level].cm);s+=`<div class="tis" style="color:#FFD700bb">다음강화<span style="color:#FFD700">◈${nc}</span></div>`;}
    document.getElementById('mi-stats').innerHTML=s;
    const bu=document.getElementById('bupg');
    if(tower.level>=5){bu.disabled=true;bu.textContent='최대';}
    else{const c=Math.round(tower.basePrice*LVL[tower.level].cm);bu.disabled=!GS.eggActive&&GS.port<c;bu.textContent=`강화 ◈${c}`;}
    document.getElementById('bsell').textContent=`매각 ◈${Math.round((tower.basePrice+tower.upgCost)*.6)}`;
  },

  desel(){
    this.selCard=null;this.selTwr=null;
    document.querySelectorAll('.tc').forEach(c=>c.classList.remove('sel'));
    this._showPromo();
  },

  upgrade(){
    const t=this.selTwr;if(!t||t.level>=5)return;
    const c=Math.round(t.basePrice*LVL[t.level].cm);
    if(!GS.eggActive&&GS.port<c){this.showBanner('포트가 부족합니다!','#EF5350');return;}
    if(!GS.eggActive)GS.port-=c;t.upgCost+=c;t.level++;
    SFX.upgrade();
    this._showTowerInfo(t);this.updHUD();this.showBanner(t.name+' Lv.'+t.level+' 강화!','#00BCD4');
  },

  sell(){
    const t=this.selTwr;if(!t)return;
    const ref=Math.round((t.basePrice+t.upgCost)*.6);
    GS.port+=ref;GS.towers=GS.towers.filter(x=>x!==t);
    this.desel();this.updHUD();this.showBanner('◈'+ref+' 환급','#FFD700');
  },

  updHUD(){
    document.getElementById('hport').textContent=GS.eggActive?'∞':Math.floor(GS.port).toLocaleString();
    const st=Math.floor(GS.stability);
    const stEl=document.getElementById('hstab');stEl.textContent=st;
    stEl.className='hv'+(st<=25?' d':st<=50?' w':' g');
    document.getElementById('sfill').style.width=st+'%';
    document.getElementById('sfill').style.background=st>50?'#6fcf7f':st>25?'#FFA726':'#EF5350';
    const tt=Math.floor(GS.time);
    document.getElementById('htime').textContent=`${Math.floor(tt/60)}:${String(tt%60).padStart(2,'0')}`;
    document.getElementById('hwave').textContent='W'+GS.wave;
    document.getElementById('wnum').textContent='→ W'+(GS.wave+1);
    for(const[id,el]of Object.entries(this._cards))
      el.classList.toggle('dis',!GS.eggActive&&GS.port<TWR[id].price);
    document.getElementById('wbtn').classList.toggle('dis',GS.waveActive);
    if(this.selTwr&&document.getElementById('mid-info').classList.contains('show'))
      this._showTowerInfo(this.selTwr);
  },

  showBanner(text,col){
    const el=document.getElementById('banner');
    el.textContent=text;el.style.color=col||'#00E5FF';el.classList.add('show');
    clearTimeout(this._bt);this._bt=setTimeout(()=>el.classList.remove('show'),2200);
  },

  showClear(){
    SFX.victory();
    const el=document.getElementById('clrovly');el.style.display='block';
    const t=Math.floor(GS.time);
    const eggRow=GS.eggActive
      ?`<div class="clr-row" style="border-color:#FF450033;"><span class="clr-lbl">포트 무한 사용 클리어</span></div>`
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
// 게임 루프
// ═══════════════════════════════════════════════════════
const G={
  _lastTs:0,_lhSec:-1,_eggWindow:false,

  init(){R.init();UI.init();},

  start(){
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
    GS.ores=GS.ores.filter(o=>o.alive);
    if(GS.waveActive&&GS.oreQ.length===0&&GS.ores.length===0){
      GS.waveActive=false;
      // 클리어 보상: 초반엔 넉넉히, 후반엔 크게
      const bonus=Math.floor(45+GS.wave*11+Math.pow(GS.wave,1.25)*1.0);
      GS.port+=bonus;GS.totalPort+=bonus;GS.portHist.push({t:GS.time,v:bonus});
      SFX.clear();
      if(GS.wave>=100){GS.running=false;UI.showClear();return;}
      UI.showBanner(`★ W${GS.wave} 클리어! +◈${bonus.toLocaleString()}`,'#00E5FF');UI.updHUD();
      if(GS.autoWave){GS.autoActive=true;GS.autoTimer=5;}
    }
    for(const t of GS.towers)t.update(dt,GS.ores);
    for(const p of GS.projs)p.update(dt);GS.projs=GS.projs.filter(p=>p.alive);
    for(const p of GS.particles)p.update(dt);GS.particles=GS.particles.filter(p=>p.life>0);
    for(const p of GS.popups)p.update(dt);GS.popups=GS.popups.filter(p=>p.life>0);
    for(const e of GS.effects)e.update(dt);GS.effects=GS.effects.filter(e=>e.life>0);
    const sec=Math.floor(GS.time);if(sec!==this._lhSec){this._lhSec=sec;UI.updHUD();}
  },

  nextWave(){
    if(!GS.running||GS.waveActive||GS.wave>=100)return;
    GS.autoActive=false;document.getElementById('acd').textContent='';
    GS.wave++;GS.oreQ=makeWave(GS.wave);GS.spawnT=0;GS.waveActive=true;
    SFX.waveStart();
    UI.updHUD();UI.showBanner(`웨이브 ${GS.wave} 시작!`,'#00E5FF');
  },

  place(row,col){
    if(!GS.running)return;const id=UI.selCard;if(!id)return;
    if(GRID[row][col]===1){UI.showBanner('경로 위에 설치 불가','#EF5350');return;}
    if(GS.towers.find(t=>t.row===row&&t.col===col)){UI.showBanner('이미 설치됨','#EF5350');return;}
    const cost=TWR[id].price;
    if(!GS.eggActive&&GS.port<cost){UI.showBanner('포트가 부족합니다!','#EF5350');return;}
    if(!GS.eggActive)GS.port-=cost;
    GS.towers.push(new Tower(id,row,col));SFX.place();UI.updHUD();UI.showBanner(TWR[id].name+' 설치','#00BCD4');
  },

  togglePause(){
    if(!GS.running)return;
    if(GS.paused){this.resume();}else{this._doPause();}
  },
  _doPause(){
    GS.paused=true;
    document.getElementById('pause-wnum').textContent=GS.wave;
    document.getElementById('pauseovly').classList.add('show');
    document.getElementById('bpause').textContent='▶';
    document.getElementById('bpause').classList.add('on');
    // 게임 조작 차단
    document.getElementById('gc').style.pointerEvents='none';
    document.getElementById('bot').style.pointerEvents='none';
  },
  resume(){
    GS.paused=false;
    document.getElementById('pauseovly').classList.remove('show');
    document.getElementById('bpause').textContent='⏸';
    document.getElementById('bpause').classList.remove('on');
    document.getElementById('gc').style.pointerEvents='';
    document.getElementById('bot').style.pointerEvents='';
  },
  toggleSpeed(){GS.speed=GS.speed===1?2:1;const b=document.getElementById('bspd');b.textContent='×'+GS.speed;b.classList.toggle('on',GS.speed===2);},
  toggleAuto(){
    GS.autoWave=!GS.autoWave;document.getElementById('abtn').classList.toggle('on',GS.autoWave);
    if(!GS.autoWave){GS.autoActive=false;document.getElementById('acd').textContent='';}
    UI.showBanner('자동 웨이브 '+(GS.autoWave?'켜짐 (5초)':'꺼짐'),GS.autoWave?'#00E5FF':'#5a7898');
  },

  tryEgg(){
    // 10초: 포트 무한 (게임 진행 중만)
    if(GS.running&&this._eggWindow10&&!GS.eggActive){
      GS.eggActive=true;GS.port=999999999;
      document.getElementById('htime').style.color='#FFD700';
      document.getElementById('htime').style.fontWeight='900';
      const tip=document.getElementById('eggtip');tip.classList.add('show');
      setTimeout(()=>tip.classList.remove('show'),3000);
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