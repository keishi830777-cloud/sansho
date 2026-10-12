import { CONFIG } from './config';
import type { EventKind } from './config';
import { Game, type Signal } from './game';
import { INK, ellipse, ouo, bucket } from './art';
interface Creature { x:number; y:number; vx:number; vy:number; size:number; phase:number; color:string }
interface Particle { x:number; y:number; vx:number; vy:number; life:number; max:number; color:string; text?:string }
interface Lid { x:number; y:number; vx:number; vy:number; angle:number; life:number }
const colors=['#8b986c','#a7a474','#7e987b','#a29575','#939e75'];
export class Renderer {
  private c:CanvasRenderingContext2D;
  private clock=0;private creatures:Creature[]=[];private particles:Particle[]=[];private lids:Lid[]=[];
  private event?:EventKind;private eventUntil=0;private shake=0;private punch=0;private lastHit={x:210,y:210};private beat=0;
  constructor(readonly canvas:HTMLCanvasElement){this.c=canvas.getContext('2d')!;this.resize();this.reset();}
  resize(){const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=CONFIG.width*dpr;this.canvas.height=CONFIG.height*dpr;}
  reset(){this.creatures=[];this.particles=[];this.lids=[];this.event=undefined;this.eventUntil=0;this.shake=this.punch=0;for(let i=0;i<8;i++)this.add();}
  private add(){if(this.creatures.length>=CONFIG.maxCreatures)return;this.creatures.push({x:20+Math.random()*370,y:475+Math.random()*133,vx:(Math.random()-.5)*45,vy:(Math.random()-.5)*17,size:.6+Math.random()*.5,phase:Math.random()*Math.PI*2,color:colors[Math.floor(Math.random()*colors.length)]});}
  signal(s:Signal,reduced:boolean){
    if(s.kind==='hit'){
      this.lastHit={x:s.x,y:s.y};this.punch=.13;if(!reduced)this.shake=s.combo>=5?.09:.035;
      this.burst(s.x,s.y,s.combo>=5?'#ffdd47':'#fff8dc',s.combo>=5?20:11);
      this.particles.push({x:s.x,y:s.y-18,vx:0,vy:-75,life:.7,max:.7,color:s.combo>=10?'#ff547e':INK,text:`+${s.points}`});
      this.lids.push({x:s.x,y:s.y,vx:(Math.random()-.5)*150,vy:-350,angle:0,life:.5});
      if(s.combo%5===0){this.beat=1;this.burst(210,440,'#ff81b3',20);}
    }
    if(s.kind==='miss'){this.add();this.burst(s.x,s.y,'#74e4df',13);if(!reduced)this.shake=.17;}
    if(s.kind==='generation'){for(let i=0;i<15;i++)this.add();this.beat=1;}
    if(s.kind==='event'){this.event=s.event;this.eventUntil=this.clock+CONFIG.events.duration;if(s.event==='fever'){this.burst(210,120,'#ffdd47',45);this.beat=1;}}
    if(s.kind==='finish'){this.beat=1;this.burst(120,190,'#ff81b3',55);this.burst(300,180,'#ffdd47',55);}
    if(this.particles.length>CONFIG.maxParticles)this.particles.splice(0,this.particles.length-CONFIG.maxParticles);
    if(this.lids.length>10)this.lids.shift();
  }
  private burst(x:number,y:number,color:string,count:number){for(let i=0;i<count;i++)this.particles.push({x,y,vx:(Math.random()-.5)*310,vy:-80-Math.random()*240,life:.6+Math.random()*.4,max:1,color});}
  draw(dt:number,game:Game|undefined,reduced:boolean,title=false){
    this.clock+=dt;this.shake=Math.max(0,this.shake-dt);this.punch=Math.max(0,this.punch-dt);this.beat=Math.max(0,this.beat-dt*2);
    const c=this.c,dpr=this.canvas.width/420;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,420,640);c.save();
    if(!reduced&&this.shake)c.translate(Math.sin(this.clock*95)*Math.min(3,this.shake*22),Math.cos(this.clock*89)*this.shake*8);
    const party=(game?.combo??0)>=5||(game?.stage??0)>=2||(game?.elapsed??0)>=24;
    const finale=(game?.elapsed??0)>=24;
    this.background(game,reduced,finale);
    this.motion(reduced?dt*.15:dt,party);
    const look=party||Math.floor(this.clock)%9===0;
    const sorted=[...this.creatures].sort((a,b)=>a.y-b.y);
    for(let i=0;i<sorted.length;i++){const a=sorted[i];
      const dance=!reduced&&party?Math.sin(this.clock*9+a.phase):0;
      ouo(c,a.x,a.y+Math.abs(dance)*-7,a.size,a.color,reduced?0:Math.sin(this.clock*(party?5:1.6)+a.phase)*(party?.2:.05),dance,look,sorted.length>70&&i<sorted.length*.65);
    }
    if(title){ouo(c,127,540,2,'#8b986c',-.1);ouo(c,289,590,1.65,'#a7a474',.15);}
    this.eventArt(reduced);
    if(game&&game.combo>=10){c.save();c.globalAlpha=.1+this.beat*.08;c.textAlign='center';c.font='1000 94px sans-serif';c.fillStyle=finale?'#fff14c':'#ffffff';c.fillText(String(game.combo),210,346);c.restore();}
    // Action targets stay above the background, herd and event cut-ins.
    if(game)for(const b of game.buckets){
      if(b.y>15){c.strokeStyle='#ffffffaa';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.moveTo(b.x-17+i*17,b.y-68-i*8);c.lineTo(b.x-17+i*17,b.y-43-i*4);c.stroke();}}
      if(finale){c.save();c.globalAlpha=.18;c.shadowColor='#fff240';c.shadowBlur=16;ellipse(c,b.x,b.y,35,35,'#fff77a');c.restore();}
      bucket(c,b.x,b.y,b.rotation+(reduced?0:Math.sin(this.clock*6+b.id)*.1));
    }
    if(this.punch>0){c.save();c.globalAlpha=this.punch/.13;c.strokeStyle='#fff8de';c.lineWidth=4;c.beginPath();c.arc(this.lastHit.x,this.lastHit.y,25+(1-this.punch/.13)*45,0,Math.PI*2);c.stroke();c.restore();}
    for(const lid of this.lids){lid.life-=dt;lid.x+=lid.vx*dt*(reduced?.25:1);lid.y+=lid.vy*dt*(reduced?.25:1);lid.vy+=450*dt;lid.angle+=dt*(reduced?0:9);c.save();c.translate(lid.x,lid.y);c.rotate(lid.angle);c.globalAlpha=Math.max(0,lid.life*2);c.fillStyle='#ff8d55';c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.roundRect(-19,-14,38,29,5);c.fill();c.stroke();c.restore();}this.lids=this.lids.filter(a=>a.life>0);
    for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt*(reduced?.25:1);p.y+=p.vy*dt*(reduced?.25:1);if(!p.text)p.vy+=350*dt;c.globalAlpha=Math.min(1,Math.max(0,p.life*2));c.fillStyle=p.color;
      if(p.text){c.textAlign='center';c.font='1000 26px sans-serif';c.strokeStyle='#fff9e9';c.lineWidth=5;c.strokeText(p.text,p.x,p.y);c.fillText(p.text,p.x,p.y);}else{c.save();c.translate(p.x,p.y);c.rotate(p.life*7);c.fillRect(-3,-4,6,9);c.restore();}}
    c.globalAlpha=1;this.particles=this.particles.filter(p=>p.life>0);c.restore();
  }
  private background(game:Game|undefined,reduced:boolean,finale:boolean){
    const c=this.c,t=reduced?0:this.clock;c.fillStyle=finale?'#47377b':'#86deca';c.fillRect(0,0,420,640);
    c.fillStyle=finale?'#64499e':'#63cdbc';c.beginPath();c.moveTo(200,-50);c.bezierCurveTo(80,100,320,230,188,355);c.bezierCurveTo(62,480,180,580,85,690);c.lineTo(290,690);c.bezierCurveTo(400,500,250,430,343,270);c.bezierCurveTo(420,80,210,80,360,-50);c.fill();
    for(let i=0;i<23;i++){const y=((i*83+t*19)%700)-30,x=45+(i*73)%340;c.strokeStyle=finale?'#cc91ec50':'#efffea78';c.lineWidth=i%2?2:3;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+12,y+6,x+30,y);c.stroke();}
    for(const [x,y] of [[12,168],[408,286],[18,356],[406,426]]){ellipse(c,x,y+8,30,15,'#23594b20');ellipse(c,x,y,26,15,finale?'#aa83b0':'#b4ca8d');}
    if((game?.stage??0)>=3){
      c.save();c.globalAlpha=.13;
      for(let i=0;i<24;i++)ouo(c,20+i%5*96+(reduced?0:Math.sin(t*.7+i)*10),40+Math.floor(i/5)*82,.48,colors[i%colors.length],reduced?0:Math.sin(t+i)*.05,0,true,true);
      c.restore();
    }
    c.fillStyle=finale?'#785291':'#68b8a1';c.fillRect(0,453,420,187);
    c.strokeStyle='#eafec7a0';c.setLineDash([5,8]);c.lineWidth=2;c.beginPath();c.moveTo(8,CONFIG.riverY+5);c.lineTo(412,CONFIG.riverY+5);c.stroke();c.setLineDash([]);
    if((game?.combo??0)>=5||finale||(game?.stage??0)>=2){
      c.strokeStyle=finale?'#ffdb72':INK;c.lineWidth=1.5;c.beginPath();c.moveTo(0,17);c.quadraticCurveTo(210,62,420,17);c.stroke();
      for(let i=0;i<12;i++){const x=i*38,y=17+Math.sin(i/11*Math.PI)*24;c.fillStyle=['#ff81b3','#ffde63','#e5fb95'][i%3];c.beginPath();c.moveTo(x,y);c.lineTo(x+27,y+3);c.lineTo(x+12,y+27);c.fill();}
      if(!reduced)for(let i=0;i<(finale?30:14);i++){c.fillStyle=['#ffd34e','#ff93bb','#fff5c0'][i%3];c.save();c.translate((i*61+Math.sin(t+i)*15)%420,((i*59+t*27)%740)-20);c.rotate(t+i);c.fillRect(-2,-4,4,8);c.restore();}
    }
    if(finale){c.save();c.globalAlpha=.08;c.translate(210,300);c.rotate(reduced?0:t*.08);for(let i=0;i<12;i++){c.rotate(Math.PI/6);c.fillStyle='#fff5aa';c.beginPath();c.moveTo(0,0);c.lineTo(450,-60);c.lineTo(450,60);c.fill();}c.restore();}
  }
  private motion(dt:number,party:boolean){
    const cells=new Map<string,Creature[]>();
    const top=CONFIG.riverY+30-Math.min(25,Math.max(0,this.creatures.length-25));
    for(const a of this.creatures){const gx=Math.floor(a.x/55),gy=Math.floor(a.y/42);
      for(let x=gx-1;x<=gx+1;x++)for(let y=gy-1;y<=gy+1;y++)for(const b of cells.get(`${x},${y}`)??[]){const dx=a.x-b.x,dy=(a.y-b.y)*1.45,d=Math.hypot(dx,dy),min=34*(a.size+b.size);if(d>.01&&d<min){const push=(min-d)*dt*3;a.vx+=dx/d*push;b.vx-=dx/d*push;a.vy+=dy/d*push;b.vy-=dy/d*push;}}
      const k=`${gx},${gy}`;if(!cells.has(k))cells.set(k,[]);cells.get(k)!.push(a);
      a.vx+=Math.sin(this.clock*(party?3:1.3)+a.phase)*dt*(party?18:5);a.vy+=Math.cos(this.clock+a.phase)*dt*4;
      a.vx*=Math.exp(-dt*.7);a.vy*=Math.exp(-dt*.7);a.x+=a.vx*dt;a.y+=a.vy*dt;
      if(a.x<18){a.x=18;a.vx=Math.abs(a.vx);}if(a.x>388){a.x=388;a.vx=-Math.abs(a.vx);}if(a.y<top){a.y=top;a.vy=Math.abs(a.vy);}if(a.y>617){a.y=617;a.vy=-Math.abs(a.vy);}
    }
  }
  private eventArt(reduced:boolean){
    if(!this.event||this.clock>this.eventUntil)return;const c=this.c,p=1-(this.eventUntil-this.clock)/CONFIG.events.duration;
    if(this.event==='giant'){c.save();c.globalAlpha=.94;ouo(c,220,566,3.1,'#adb185',reduced?0:Math.sin(this.clock*3)*.08,0,true);c.restore();}
    if(this.event==='tour')for(let i=0;i<6;i++)ouo(c,reduced?30+i*75:-190+p*820-i*48,475+i%2*30,.68,colors[i%colors.length],.05,0,true);
    if(this.event==='researcher'){c.fillStyle='#fff7d7';c.font='900 17px sans-serif';c.textAlign='center';c.save();c.translate(215,550);c.rotate(-.08);c.fillText('待て待て待て！！',0,0);c.restore();}
    if(this.event==='uncle'){c.save();c.translate(378,503);ellipse(c,0,0,23,24,'#edc395',true);ellipse(c,0,-21,32,8,'#ffe16b',true);ellipse(c,-8,-3,2,2,INK);ellipse(c,8,-3,2,2,INK);c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(-6,7);c.quadraticCurveTo(0,12,6,7);c.stroke();c.fillStyle='#fff7d7';c.fillRect(-21,26,42,42);c.restore();}
  }
}
