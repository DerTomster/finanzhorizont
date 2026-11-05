'use strict';
/* FINANZHORIZONT 2.2 — vollständig lokal, ohne Drittanbieter-Bibliotheken.
 * Zwei Entnahmephasen, gemeinsame Monte-Carlo-Pfade, konditionale und gemeinsame
 * Tragfähigkeitsberechnung. ETF- und Inflationsdaten sind statische Beispiele.
 */
const ETF=Object.freeze({
  'IE00BK5BQT80':{name:'Vanguard FTSE All-World UCITS ETF (Acc)',total5:72.05,vol:13.68,source:'https://www.justetf.com/de/etf-profile.html?isin=IE00BK5BQT80'},
  'IE00B4L5Y983':{name:'iShares Core MSCI World UCITS ETF (Acc)',total5:73.67,vol:14.69,source:'https://www.justetf.com/de/etf-profile.html?isin=IE00B4L5Y983'},
  'IE00B5BMR087':{name:'iShares Core S&P 500 UCITS ETF (Acc)',total5:87.53,vol:17.50,source:'https://www.justetf.com/de/etf-profile.html?isin=IE00B5BMR087'}
});
const INFLATION=Object.freeze({
  DE2025:{name:'Deutschland 2025 · VPI, Jahresmittel',v:2.2,source:'https://www.destatis.de/'},
  DE2026:{name:'Deutschland Oktober 2026 · VPI ggü. Vorjahresmonat (vorläufig)',v:2.8,source:'https://www.destatis.de/'},
  AT2025:{name:'Österreich 2025 · VPI, Jahresmittel',v:3.6,source:'https://www.statistik.at/'},
  CH2025:{name:'Schweiz 2025 · LIK, Jahresmittel',v:0.2,source:'https://www.bfs.admin.ch/'},
  FR2025:{name:'Frankreich 2025 · VPI, Jahresmittel',v:0.9,source:'https://www.insee.fr/'},
  NL2025:{name:'Niederlande 2025 · VPI, Jahresmittel',v:3.3,source:'https://www.cbs.nl/'}
});
const DEFAULTS=Object.freeze({capital:25000,saving:350,years:25,returnMode:'etf',isin:'IE00BK5BQT80',discount:3,manualRate:6,manualVol:15,inflationMode:'country',country:'DE2025',manualInfl:2,withdrawOn:true,withdrawYear:12,postSaving:100,withdrawal:300,secondOn:true,secondYear:18,secondSaving:0,secondWithdrawal:900,indexWithdrawal:false,preserve:'real',testPeriod:'end',confidence:80,display:'real'});
const $=id=>document.getElementById(id);
const euro=n=>Number.isFinite(n)?new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n):'–';
const perc=n=>Number.isFinite(n)?new Intl.NumberFormat('de-DE',{minimumFractionDigits:1,maximumFractionDigits:1}).format(n)+' %':'–';
const euroSafe=n=>Number.isFinite(n)?euro(Math.floor(Math.max(0,n))):'–';
const numeric=(id,min,max)=>Math.min(max,Math.max(min,Number($(id).value)||0));
const state={returnMode:'etf',inflationMode:'country',display:'real'};
const safeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const quant=(a,p)=>{if(!a.length)return NaN;const k=(a.length-1)*p,j=Math.floor(k);return a[j]+(a[Math.min(j+1,a.length-1)]-a[j])*(k-j)};
function readSettings(){
  const isin=$('isin').value.trim().toUpperCase(),fund=ETF[isin];
  const etfMode=state.returnMode==='etf'&&!!fund;
  const histReturn=fund?(Math.pow(1+fund.total5/100,.2)-1)*100:null;
  const years=numeric('years',5,45);
  const secondOn=$('secondOn').checked;
  const firstYear=Math.min(years-(secondOn?2:1),numeric('withdrawYear',1,years-1));
  const secondYear=Math.min(years-1,Math.max(firstYear+1,numeric('secondYear',firstYear+1,years-1)));
  return {capital:numeric('capital',0,1e8),saving:numeric('saving',0,2000),years,
    returnMode:state.returnMode,isin,discount:numeric('discount',0,8),manualRate:numeric('manualRate',-4,14),manualVol:numeric('manualVol',0,35),
    annualReturn:etfMode?Math.max(-9.9,histReturn-numeric('discount',0,8)):numeric('manualRate',-4,14),volatility:etfMode?fund.vol:numeric('manualVol',0,35),histReturn,
    inflation:state.inflationMode==='country'?(INFLATION[$('country').value]?.v??2):numeric('manualInfl',0,10),inflationMode:state.inflationMode,country:$('country').value,manualInfl:numeric('manualInfl',0,10),
    withdrawOn:$('withdrawOn').checked,withdrawYear:firstYear,postSaving:numeric('postSaving',0,2000),withdrawal:numeric('withdrawal',0,100000),
    secondOn,secondYear,secondSaving:numeric('secondSaving',0,2000),secondWithdrawal:numeric('secondWithdrawal',0,100000),
    indexWithdrawal:$('indexWithdrawal').checked,preserve:$('preserve').value,testPeriod:$('testPeriod').value,confidence:Number($('confidence').value),display:state.display};
}
/* Core simulation and analytic solvency/capital-preservation constraints.
 * A: portfolio with phase-appropriate contributions but no withdrawals.
 * B1/B2: future values of withdrawing 1 EUR monthly during each phase.
 * Because A - w1*B1 - w2*B2 is affine, exact withdrawal limits per path
 * can be derived without rerunning/approximating the return sequence.
 */
function computeSimulation(s, N=1200){
  const months=s.years*12,c1=s.withdrawYear*12,c2=s.secondOn?s.secondYear*12:months;
  const noDrawYears=Array.from({length:s.years+1},()=>[]),drawYears=Array.from({length:s.years+1},()=>[]),starts1=[],starts2=[],jointCaps=[],firstCaps=[],secondCaps=[];
  let paymentsOk=0,capitalOk=0,zeroPreservedCount=0,seed=91438529;
  const solvencyCaps=[];
  const rnd=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return ((seed>>>0)+.5)/4294967296};
  const normal=()=>Math.sqrt(-2*Math.log(rnd()))*Math.cos(2*Math.PI*rnd());
  const sigma=s.volatility/100,mu=(Math.log1p(s.annualReturn/100)-sigma*sigma/2)/12,noise=sigma/Math.sqrt(12);
  const inflation=1+s.inflation/100;
  const w1=s.withdrawal,w2=s.secondOn?s.secondWithdrawal:0;
  const index=(m,phaseStart)=>s.indexWithdrawal?Math.pow(inflation,Math.floor((m-phaseStart-1)/12)):1;
  const preservationTarget=(original,m)=>original*(s.preserve==='real'?Math.pow(inflation,(m-c1)/12):1);
  for(let p=0;p<N;p++){
    let balance=s.capital,A=s.capital,B1=0,B2=0,begin1=s.capital,begin2=s.capital;
    let noMiss=true,preserved=true,baselinePreserved=true,capJoint=Infinity,cap1=Infinity,cap2=Infinity,capSolvency=Infinity;
    noDrawYears[0].push(A);drawYears[0].push(balance);
    const constraint=(threshold,isCash)=>{
      // For the joint limit, both withdrawals are varied in the given ratio.
      const den=w1*B1+w2*B2,rem=A-threshold;
      if(isCash&&den>1e-12)capSolvency=Math.min(capSolvency,A/den);
      if(den>1e-12)capJoint=Math.min(capJoint,rem/den);
      else if(rem < -1e-7)capJoint=-1e12;
      // Conditional maxima change just one phase, holding the other fixed.
      const rem1=rem-w2*B2,rem2=rem-w1*B1;
      if(B1>1e-12)cap1=Math.min(cap1,rem1/B1);
      else if(rem1 < -1e-7)cap1=-1e12;
      if(s.secondOn){
        if(B2>1e-12)cap2=Math.min(cap2,rem2/B2);
        else if(rem2 < -1e-7)cap2=-1e12;
      }
    };
    for(let m=1;m<=months;m++){
      const g=Math.exp(mu+noise*normal());
      if(!s.withdrawOn || m<=c1){
        A=A*g+s.saving;
        balance=balance*g+s.saving;
        if(s.withdrawOn && m===c1){begin1=balance;begin2=balance;A=balance;B1=0;B2=0;}
      }else{
        const phase2=s.secondOn&&m>c2;
        const deposit=phase2?s.secondSaving:s.postSaving;
        const f=phase2?index(m,c2):index(m,c1);
        const requested=(phase2?w2:w1)*f;
        const available=balance*g+deposit;
        if(available+1e-7 < requested)noMiss=false;
        balance=Math.max(0,available-requested);
        A=A*g+deposit;
        B1=B1*g+(phase2?0:f);
        B2=B2*g+(phase2?f:0);
        // Affordability must hold EVERY month, not only at year ends.
        constraint(0,true);
        if(s.testPeriod==='annual'&&m%12===0){
          const target=preservationTarget(begin1,m);
          constraint(target,false);
          if(A+1e-7<target)baselinePreserved=false;
        }
        if(s.secondOn&&m===c2)begin2=balance;
        if(s.testPeriod==='annual'&&m%12===0&&balance+1e-7<preservationTarget(begin1,m))preserved=false;
      }
      if(m%12===0){noDrawYears[m/12].push(A);drawYears[m/12].push(balance)}
    }
    if(s.withdrawOn){
      const endTarget=preservationTarget(begin1,months);
      constraint(endTarget,false);
      if(A+1e-7<endTarget)baselinePreserved=false;
      if(balance+1e-7<endTarget)preserved=false;
      if(baselinePreserved)zeroPreservedCount++;
      solvencyCaps.push(capSolvency);
      if(noMiss)paymentsOk++;
      if(noMiss&&preserved)capitalOk++;
      jointCaps.push(capJoint);
      firstCaps.push(cap1);
      if(s.secondOn)secondCaps.push(cap2);
    }
    starts1.push(begin1);starts2.push(begin2);
  }
  const sort=a=>a.sort((a,b)=>a-b);
  [...noDrawYears,...drawYears].forEach(sort);
  sort(starts1);sort(starts2);sort(jointCaps);sort(firstCaps);sort(secondCaps);sort(solvencyCaps);
  const div=y=>s.display==='real'?Math.pow(inflation,y):1;
  const series=(a,y)=>({year:y,p10:quant(a,.1)/div(y),p50:quant(a,.5)/div(y),p90:quant(a,.9)/div(y)});
  const build=noDrawYears.map(series);
  const startMedian=quant(starts1,.5),start2Median=quant(starts2,.5);
  const draw=drawYears.map((a,y)=>({...series(a,y),without:quant(noDrawYears[y],.5)/div(y),reference:s.withdrawOn&&y>=s.withdrawYear?preservationTarget(startMedian,y*12)/div(y):null}));
  const endings=drawYears[s.years].map(x=>x/div(s.years));
  const mn=Math.max(0,quant(endings,.002)),mx=Math.max(mn+1,quant(endings,.998));
  const bins=12,counts=Array(bins).fill(0);
  for(const value of endings)counts[Math.min(bins-1,Math.max(0,Math.floor((value-mn)/(mx-mn)*bins)))]++;
  const distribution=counts.map((count,i)=>({center:mn+(i+.5)*(mx-mn)/bins,percent:100*count/N}));
  const qpos=1-s.confidence/100;
  // No chosen withdrawals => a simultaneous scale has no meaning.
  const hasPlan=s.withdrawOn&&(w1>0||w2>0);
  const rawJoint=hasPlan?quant(jointCaps,qpos):NaN;
  const jointOK=hasPlan && Number.isFinite(rawJoint)&&rawJoint>=0;
  const scale=jointOK?rawJoint:0;
  const rawFirst=s.withdrawOn?quant(firstCaps,qpos):NaN;
  const rawSecond=s.withdrawOn&&s.secondOn?quant(secondCaps,qpos):NaN;
  const jointSuccess=jointOK?100*jointCaps.filter(cap=>cap+1e-9>=scale).length/N:0;
  const zeroSuccess=s.withdrawOn?100*zeroPreservedCount/N:NaN;
  const bestMedianScale=hasPlan?quant(jointCaps,.5):NaN;
  const solventScale=hasPlan?Math.max(0,quant(solvencyCaps,qpos)):NaN;
  const contributions=s.capital+s.saving*Math.min(s.years,s.withdrawOn?s.withdrawYear:s.years)*12+(s.withdrawOn?s.postSaving*(s.secondOn?s.secondYear-s.withdrawYear:s.years-s.withdrawYear)*12:0)+(s.withdrawOn&&s.secondOn?s.secondSaving*(s.years-s.secondYear)*12:0);
  return {build,draw,distribution,startMedian,start2Median,median:quant(endings,.5),p10:quant(endings,.1),p90:quant(endings,.9),jointOK,hasPlan,scale,rawJoint,joint1:jointOK?w1*scale:0,joint2:jointOK?w2*scale:0,jointSuccess,zeroSuccess,bestMedianScale,solventScale,solvent1:hasPlan?w1*solventScale:NaN,solvent2:hasPlan?w2*solventScale:NaN,rawFirst,rawSecond,firstCap:Number.isFinite(rawFirst)&&rawFirst>=0?rawFirst:0,secondCap:Number.isFinite(rawSecond)&&rawSecond>=0?rawSecond:0,paymentsOk:100*paymentsOk/N,capitalOk:100*capitalOk/N,contributions};
}
function showControls(s){
  $('etfGroup').hidden=state.returnMode!=='etf';
  $('manualReturnGroup').hidden=state.returnMode==='etf'&&!!ETF[s.isin];
  $('countryGroup').hidden=state.inflationMode!=='country';$('manualInflGroup').hidden=state.inflationMode==='country';
  $('withdrawControls').hidden=!s.withdrawOn;$('secondControls').hidden=!s.withdrawOn||!s.secondOn;
  $('secondToggleRow').hidden=!s.withdrawOn;
  $('withdrawChartCard').hidden=!s.withdrawOn;
  $('smoothPanel').hidden=!s.withdrawOn;$('safePanel').hidden=!s.withdrawOn;$('supportGrid').hidden=!s.withdrawOn;$('conditionalPanel').hidden=!s.withdrawOn;$('feasibilityPanel').hidden=!s.withdrawOn;$('solventOnlyPanel').hidden=!s.withdrawOn;
  $('withdrawYear').max=s.years-(s.secondOn?2:1);$('secondYear').min=Math.min(s.years-1,s.withdrawYear+1);$('secondYear').max=s.years-1;
  if(Number($('withdrawYear').value)>s.years-(s.secondOn?2:1))$('withdrawYear').value=s.years-(s.secondOn?2:1);
  if(Number($('secondYear').value)<s.withdrawYear+1)$('secondYear').value=Math.min(s.years-1,s.withdrawYear+1);
  if(Number($('secondYear').value)>s.years-1)$('secondYear').value=s.years-1;
  const fund=ETF[s.isin];
  if(fund){$('etfInfo').textContent=`5 Jahre: +${fund.total5.toLocaleString('de-DE')} % gesamt · ${perc(s.histReturn)} annualisiert · ${perc(fund.vol)} Volatilität. Historischer Beispiel-Datensatz (Stand 05.11.2026).`;$('etfSource').href=fund.source;$('etfSource').hidden=false;}
  else{$('etfInfo').textContent='ISIN nicht im lokalen Datenbestand: Die manuelle Rendite und Volatilität gelten. Keine automatische ISIN-Abfrage.';$('etfSource').hidden=true;}
  $('etfPreset').value=ETF[s.isin]?s.isin:'other';
  const info=INFLATION[s.country]||INFLATION.DE2025;
  $('inflSource').innerHTML=`Historische Referenz (keine Prognose): <a href="${info.source}" target="_blank" rel="noopener noreferrer">${safeHTML(info.name)} ↗</a>`;
  [['savingValue',euro(s.saving)+'/Monat'],['yearsValue',s.years+' Jahre'],['discountValue',s.discount.toLocaleString('de-DE')+' PP'],['manualRateValue',perc(s.manualRate)],['manualVolValue',perc(s.manualVol)],['manualInflValue',perc(s.manualInfl)],['withdrawYearValue',s.withdrawYear+' Jahre'],['postSavingValue',euro(s.postSaving)+'/Monat'],['secondYearValue',s.secondYear+' Jahre'],['secondSavingValue',euro(s.secondSaving)+'/Monat'],['activeRate',perc(s.annualReturn)+' Rendite'],['activeVol',perc(s.volatility)+' Volatilität'],['inflValue',perc(s.inflation)+' p. a.']].forEach(([id,v])=>$(id).textContent=v);
  for(const group of ['returnMode','inflationMode','display'])document.querySelectorAll(`[data-group="${group}"]`).forEach(b=>{const active=b.dataset.value===state[group];b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
}
function showResults(s,r){
  [['endMedian',euro(r.median)],['startAtWithdraw',s.withdrawOn?euro(r.startMedian):'–'],['startAtSecond',s.withdrawOn&&s.secondOn?euro(r.start2Median):'–'],['endLow',euro(r.p10)],['endHigh',euro(r.p90)],['preservation',perc(r.capitalOk)],['solvency',perc(r.paymentsOk)]].forEach(([id,v])=>$(id).textContent=v);
  $('safe1').textContent=!r.hasPlan?'–':r.jointOK?euroSafe(r.joint1):'Ziel verfehlt';
  $('safe2').textContent=!s.secondOn?'Nicht aktiv':!r.hasPlan?'–':r.jointOK?euroSafe(r.joint2):'Ziel verfehlt';
  $('safeConfidence').textContent=s.confidence+' % angestrebte Erfolgswahrscheinlichkeit';
  $('safeDescription').textContent=`Gemeinsam berechnete Brutto-Monatsbeträge im Verhältnis deiner Eingaben. Kapitalerhalt ${s.preserve==='real'?'in heutiger Kaufkraft':'in Euro'} ${s.testPeriod==='annual'?'an jedem Jahresende':'am Laufzeitende'}; Bezugspunkt ist das Depotvermögen bei Beginn der ersten Entnahmephase.`;
  $('safeSuccess').textContent=r.hasPlan&&r.jointOK?perc(r.jointSuccess):'–';
  // Erwartungswert-Szenario: gleiche Spar- und Entnahmelogik, aber keine Marktschwankungen.
  // Deshalb streng von der Monte-Carlo-Perzentilrechnung zu unterscheiden.
  const smooth=computeSimulation({...s,volatility:0},1);
  const theoreticalReal=((1+s.annualReturn/100)/(1+s.inflation/100)-1);
  $('roughRealReturn').textContent=perc(theoreticalReal*100);
  $('roughMonthly').textContent=euro(Math.max(0,r.startMedian*theoreticalReal/12));
  $('smooth1').textContent=!r.hasPlan?'–':smooth.jointOK?euroSafe(smooth.joint1):'Ziel verfehlt';
  $('smooth2').textContent=!s.secondOn?'Nicht aktiv':!r.hasPlan?'–':smooth.jointOK?euroSafe(smooth.joint2):'Ziel verfehlt';
  $('smoothNote').textContent=!r.hasPlan?'Gib Entnahmebeträge als Verhältnisvorgabe für die beiden Phasen ein.':smooth.jointOK?'Beide Beträge wurden gemeinsam berechnet und erfüllen das gewählte nominale bzw. reale Kapitalerhaltsziel bei konstantem Renditepfad.':'Auch ohne schwankende Renditen ist das Ziel unter diesen Eingaben nicht erreichbar.';
  $('baselineChance').textContent=Number.isFinite(r.zeroSuccess)?perc(r.zeroSuccess):'–';
  $('targetChance').textContent=perc(s.confidence);
  $('feasibilityMessage').textContent=!r.hasPlan?'Bitte gib einen positiven Entnahmebetrag in mindestens einer Phase ein, damit ein gemeinsames Verhältnis bestimmt werden kann.':r.jointOK?`Kapitalerhalt bei null Entnahme: ${perc(r.zeroSuccess)}. Der modellierte gemeinsame Entnahmebetrag erfüllt unter den Annahmen das Ziel von ${perc(s.confidence)}.`:`Das Kapitalerhaltungsziel wird bei 0 € Entnahme nur in ${perc(r.zeroSuccess)} der simulierten Marktverläufe erreicht. Gefordert sind ${perc(s.confidence)}. Daher gibt es bei diesen Annahmen keinen als tragfähig ausweisbaren positiven Entnahmebetrag. Auch 0 € Entnahme erfüllen das Ziel nicht.`;
  $('baselineBadge').textContent=!r.hasPlan?'Prüfung ohne Eingabeverhältnis':r.jointOK?'Ziel im Modell erreichbar':'Ziel schon ohne Entnahmen verfehlt';
  $('baselineBadge').className=r.jointOK?'feasibility-badge good':'feasibility-badge caution';
  $('solventOnlyFirst').textContent=r.hasPlan?euroSafe(r.solvent1):'–';
  $('solventOnlySecond').textContent=!s.secondOn?'Nicht aktiv':r.hasPlan?euroSafe(r.solvent2):'–';
  $('alternativeMedian').textContent=!r.hasPlan?'–':Number.isFinite(r.bestMedianScale)&&r.bestMedianScale>=0?`${euroSafe(s.withdrawal*r.bestMedianScale)} / ${s.secondOn?euroSafe(s.secondWithdrawal*r.bestMedianScale):'—'}`:'Auch bei 50 % nicht erreichbar';
  $('safeFirstFixed').textContent=Number.isFinite(r.rawFirst)&&r.rawFirst>=0?euroSafe(r.firstCap):'Ziel verfehlt';
  $('firstFixedNote').textContent=Number.isFinite(r.rawFirst)&&r.rawFirst>=0?'Bei unveränderter Entnahme in Phase 2':'Auch 0 € in Phase 1 erfüllt bei der festen Phase-2-Entnahme das gewählte Ziel nicht.';
  $('safeSecondFixed').textContent=!s.secondOn?'Nicht aktiv':Number.isFinite(r.rawSecond)&&r.rawSecond>=0?euroSafe(r.secondCap):'Ziel verfehlt';
  $('secondFixedNote').textContent=!s.secondOn?'Zweite Entnahmephase ausgeschaltet':Number.isFinite(r.rawSecond)&&r.rawSecond>=0?'Bei unveränderter Entnahme in Phase 1':'Auch 0 € in Phase 2 erfüllt bei der festen Phase-1-Entnahme das gewählte Ziel nicht.';
  $('netFlow1').textContent=euro(s.postSaving-s.withdrawal)+'/Monat';
  $('netFlow2').textContent=s.secondOn?euro(s.secondSaving-s.secondWithdrawal)+'/Monat':'Unverändert';
  $('warning').hidden=true;
  if(!s.withdrawOn)return;
  const issues=[];
  if(!r.hasPlan)issues.push('Bitte gib mindestens einen positiven Entnahmebetrag ein, damit die gemeinsam tragfähigen Entnahmen berechnet werden können.');
  else if(!r.jointOK)issues.push(`Die Anforderung von ${perc(s.confidence)} Kapitalerhalt wird schon ohne Entnahmen verfehlt (${perc(r.zeroSuccess)}). Senke gegebenenfalls das Sicherheitsniveau, wähle nominalen statt realen Kapitalerhalt oder überprüfe Sparrate, Anlagehorizont und Renditeannahme. Die solvenzorientierten Alternativbeträge weiter unten sind KEINE Kapitalerhaltungsbeträge.`);
  else if(r.scale<1-1e-8)issues.push(`Deine eingestellten Entnahmen liegen über der gemeinsam modellierten Grenze für ${s.confidence} % Erfolgswahrscheinlichkeit. Erfolgsquote der derzeitigen Eingaben: ${perc(r.capitalOk)}.`);
  if(issues.length){$('warning').hidden=false;$('warning').textContent=issues.join(' ')}
}
function setCanvasSize(canvas){const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1),w=Math.max(10,Math.round(rect.width)),h=Math.max(10,Math.round(rect.height));canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);return {ctx,w,h}}
function compact(v){const a=Math.abs(v);if(a>=1e6)return (v/1e6).toLocaleString('de-DE',{maximumFractionDigits:1})+' Mio.';if(a>=1e3)return (v/1000).toLocaleString('de-DE',{maximumFractionDigits:0})+'k';return Math.round(v).toLocaleString('de-DE')}
function renderLine(id,data,mode='build',marks=[]){if(!data?.length)return;const canvas=$(id);if(canvas.closest('[hidden]'))return;const {ctx,w,h}=setCanvasSize(canvas);ctx.clearRect(0,0,w,h);const L=w<480?54:69,R=21,T=22,B=35,pw=w-L-R,ph=h-T-B,first=data[0].year,last=data[data.length-1].year;
  const vals=data.flatMap(d=>[d.p10,d.p90,d.without??0,d.reference??0]).filter(Number.isFinite),hi=Math.max(1,Math.max(...vals)*1.12);const x=t=>L+(t-first)/Math.max(1,last-first)*pw,y=v=>T+ph-v/hi*ph;
  ctx.font='11px system-ui,-apple-system,sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';for(let i=0;i<=4;i++){const Y=y(hi*i/4);ctx.strokeStyle='#e8edf2';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(L,Y);ctx.lineTo(w-R,Y);ctx.stroke();ctx.fillStyle='#8b98a8';ctx.fillText(compact(hi*i/4),L-8,Y)}
  ctx.textAlign='center';ctx.textBaseline='top';for(let i=0;i<=5;i++){const t=first+(last-first)*i/5;ctx.fillStyle='#8796a7';ctx.fillText(String(Math.round(t)),x(t),h-B+9)}
  for(const mark of marks){if(mark.year<first||mark.year>last)continue;const X=x(mark.year);ctx.strokeStyle=mark.color;ctx.setLineDash([4,5]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X,T);ctx.lineTo(X,h-B);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=mark.color;ctx.font='10px system-ui';ctx.textAlign='center';ctx.textBaseline='top';ctx.fillText(mark.label,X,T+2)}
  ctx.beginPath();data.forEach((d,i)=>i?ctx.lineTo(x(d.year),y(d.p90)):ctx.moveTo(x(d.year),y(d.p90)));for(let i=data.length-1;i>=0;i--)ctx.lineTo(x(data[i].year),y(data[i].p10));ctx.closePath();ctx.fillStyle='rgba(32,169,157,.16)';ctx.fill();
  const line=(fn,color,width,dash=[])=>{ctx.beginPath();let started=false;for(const d of data){const value=fn(d);if(value===null||value===undefined||!Number.isFinite(value))continue;if(!started){ctx.moveTo(x(d.year),y(value));started=true}else ctx.lineTo(x(d.year),y(value))}if(started){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([])}};
  if(mode==='draw'){line(d=>d.without,'#d29d55',2,[7,5]);line(d=>d.reference,'#9caab7',1.5,[4,6])}line(d=>d.p50,'#087f87',2.9);
}
function renderHist(data){const canvas=$('histChart'),{ctx,w,h}=setCanvasSize(canvas);ctx.clearRect(0,0,w,h);const L=w<480?54:69,R=16,T=12,B=43,pw=w-L-R,ph=h-T-B,top=Math.max(10,Math.ceil(Math.max(...data.map(d=>d.percent))/5)*5);ctx.font='11px system-ui,-apple-system,sans-serif';for(let i=0;i<=4;i++){const Y=T+ph-ph*i/4;ctx.strokeStyle='#e9eff3';ctx.beginPath();ctx.moveTo(L,Y);ctx.lineTo(w-R,Y);ctx.stroke();ctx.textAlign='right';ctx.fillStyle='#8494a4';ctx.fillText((top*i/4).toFixed(0)+'%',L-8,Y+3)}const step=pw/data.length;data.forEach((d,i)=>{const ht=d.percent/top*ph,xx=L+i*step+2;ctx.fillStyle=i>=data.length/2?'#0c8e90':'#6bb6b9';ctx.fillRect(xx,T+ph-ht,Math.max(2,step-4),ht)});ctx.fillStyle='#8292a3';ctx.textAlign='center';[0,Math.floor((data.length-1)/2),data.length-1].forEach(i=>ctx.fillText(compact(data[i].center)+' €',L+(i+.5)*step,h-B+16))}
let lastSettings=null,lastResult=null,timer=null;
function run(){try{const s=readSettings();showControls(s);const r=computeSimulation(s);lastSettings=s;lastResult=r;showResults(s,r);const marks=s.withdrawOn?[{year:s.withdrawYear,label:'Rente 1',color:'#2c8190'},...(s.secondOn?[{year:s.secondYear,label:'Rente 2',color:'#b68136'}]:[])]:[];renderLine('buildChart',r.build,'build',marks);if(s.withdrawOn)renderLine('withdrawChart',r.draw,'draw',marks);renderHist(r.distribution);try{localStorage.setItem('fh_settings_v22',JSON.stringify(s))}catch(_){}}catch(err){$('warning').hidden=false;$('warning').textContent='Die Berechnung ist fehlgeschlagen: '+String(err.message||err);console.error(err)}}
function schedule(){clearTimeout(timer);timer=setTimeout(run,75)}
function restore(values){const o={...DEFAULTS,...values};for(const [k,id] of Object.entries({capital:'capital',saving:'saving',years:'years',isin:'isin',discount:'discount',manualRate:'manualRate',manualVol:'manualVol',country:'country',manualInfl:'manualInfl',withdrawYear:'withdrawYear',postSaving:'postSaving',withdrawal:'withdrawal',secondYear:'secondYear',secondSaving:'secondSaving',secondWithdrawal:'secondWithdrawal',preserve:'preserve',testPeriod:'testPeriod',confidence:'confidence'}))if(o[k]!==undefined)$(id).value=o[k];$('withdrawOn').checked=!!o.withdrawOn;$('secondOn').checked=!!o.secondOn;$('indexWithdrawal').checked=!!o.indexWithdrawal;state.returnMode=['manual','etf'].includes(o.returnMode)?o.returnMode:'etf';state.inflationMode=['country','manual'].includes(o.inflationMode)?o.inflationMode:'country';state.display=['nominal','real'].includes(o.display)?o.display:'real'}
function csv(){if(!lastSettings||!lastResult)return;const s=lastSettings,r=lastResult;const meta=[`# FINANZHORIZONT V2.2;Entnahme 1 nach ${s.withdrawYear} Jahren;Entnahme 2 ${s.secondOn?'nach '+s.secondYear+' Jahren':'nicht aktiv'}`,`# Startkapital ${s.capital};Sparrate ${s.saving};Rente1 Sparrate ${s.postSaving};Entnahme1 ${s.withdrawal};Rente2 Sparrate ${s.secondSaving};Entnahme2 ${s.secondWithdrawal}`,`# Rendite ${s.annualReturn}%;Volatilität ${s.volatility}%;Inflation ${s.inflation}%;Werte ${s.display}`];const head='Jahr;Ohne_Entnahme_Median_EUR;Mit_Entnahme_P10_EUR;Mit_Entnahme_Median_EUR;Mit_Entnahme_P90_EUR;Kapitalerhalt_Referenz_EUR';const rows=r.draw.map((x,i)=>[i,r.build[i].p50,x.p10,x.p50,x.p90,x.reference??''].map(v=>typeof v==='number'?v.toFixed(2).replace('.',','):v).join(';'));const blob=new Blob(['\ufeff'+[...meta,head,...rows].join('\r\n')],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='finanzhorizont_2_phasen.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function attach(){try{const newData=localStorage.getItem('fh_settings_v22');const v21Data=localStorage.getItem('fh_settings_v21');const v2Data=localStorage.getItem('fh_settings_v2');const oldData=localStorage.getItem('fh_settings_v1');restore(newData?JSON.parse(newData):v21Data?JSON.parse(v21Data):v2Data?JSON.parse(v2Data):oldData?JSON.parse(oldData):DEFAULTS)}catch(_){restore(DEFAULTS)}
  document.querySelectorAll('[data-group]').forEach(b=>b.addEventListener('click',()=>{state[b.dataset.group]=b.dataset.value;schedule()}));
  document.querySelectorAll('input,select').forEach(el=>{el.addEventListener('input',schedule);el.addEventListener('change',schedule)});
  $('etfPreset').addEventListener('change',()=>{if($('etfPreset').value!=='other')$('isin').value=$('etfPreset').value;else $('isin').value='';schedule()});
  $('isin').addEventListener('input',()=>{$('isin').value=$('isin').value.toUpperCase().replace(/\s/g,'');schedule()});
  $('reset').addEventListener('click',()=>{try{localStorage.removeItem('fh_settings_v22');localStorage.removeItem('fh_settings_v21');localStorage.removeItem('fh_settings_v2');localStorage.removeItem('fh_settings_v1')}catch(_){}restore(DEFAULTS);run()});
  $('export').addEventListener('click',csv);
  window.addEventListener('resize',()=>{if(lastResult&&lastSettings){const s=lastSettings,marks=s.withdrawOn?[{year:s.withdrawYear,label:'Rente 1',color:'#2c8190'},...(s.secondOn?[{year:s.secondYear,label:'Rente 2',color:'#b68136'}]:[])]:[];renderLine('buildChart',lastResult.build,'build',marks);if(s.withdrawOn)renderLine('withdrawChart',lastResult.draw,'draw',marks);renderHist(lastResult.distribution)}});
  run();
}
window.Finanzhorizont={computeSimulation,ETF,INFLATION,DEFAULTS,readSettings};
document.addEventListener('DOMContentLoaded',attach);
