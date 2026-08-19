/* =====================================================================
   成人俄语 0→1 学习辅助系统 — 应用逻辑
   纯前端、零依赖、开箱即用。数据见 data.js（RU 对象）。
   ===================================================================== */
(function(){
"use strict";

/* ----------------------- 通用工具 ----------------------- */
const $ = (s, r) => (r||document).querySelector(s);
const view = () => document.getElementById('view');
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function dstr(d){ d=d||new Date(); const p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }
function norm(s){ return (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim().toLowerCase(); }
function lsGet(k, d){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):(d||null); }catch(e){ return d||null; } }
function lsSet(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

/* 语音合成 */
let _voices=[];
function loadVoices(){ if(window.speechSynthesis) _voices = speechSynthesis.getVoices()||[]; }
if(window.speechSynthesis){ speechSynthesis.onvoiceschanged = loadVoices; loadVoices(); }
function speak(text, lang){
  if(!window.speechSynthesis){ return; }
  lang = lang || 'ru-RU';
  try{
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = 0.82; u.pitch = 1;
    const v = _voices.find(x=>x.lang && x.lang.toLowerCase().indexOf(lang.toLowerCase().slice(0,2))===0);
    if(v) u.voice = v;
    speechSynthesis.speak(u);
  }catch(e){}
}
function spk(text, label){ label = label||'🔊'; return '<span class="speak" data-act="speak" data-t="'+encodeURIComponent(text)+'">'+label+'</span>'; }
function spkWord(text){ return '<span class="speak" data-act="speak" data-t="'+encodeURIComponent(text)+'">🔊</span>'; }

/* ----------------------- 导航配置 ----------------------- */
const NAV = [
  {group:"核心模块"},
  {id:"overview", ic:"🏠", name:"系统概览"},
  {id:"m1", ic:"📚", name:"M1 考点库", badge:String(RU.kp.length)},
  {id:"m2", ic:"🗓️", name:"M2 复习计划"},
  {id:"m3", ic:"🌲", name:"M3 思维导图"},
  {id:"m4", ic:"✅", name:"M4 背诵打卡"},
  {id:"m5", ic:"🎤", name:"M5 口语练习"},
  {id:"m6", ic:"🎧", name:"M6 听力训练"},
  {id:"m7", ic:"⌨️", name:"M7 字母与键盘"},
  {group:"学习新模块"},
  {id:"books", ic:"📖", name:"教材书目"},
  {id:"m8", ic:"🔤", name:"M8 单词学习"},
  {id:"m9", ic:"💬", name:"M9 句子学习"},
  {id:"m10", ic:"📖", name:"M10 文章阅读", badge:String(RU.articles&&RU.articles.length||80)},
  {id:"daily", ic:"📅", name:"每日一练"},
  {id:"selftest", ic:"🏆", name:"自测测评"},
  {group:"专项子场景"},
  {id:"s",  ic:"⭐", name:"S1–S3 专项"}
];
const META = {
  overview:["系统概览","成人零基础俄语 · A1→A2"],
  m1:["M1 考点库管理","提取 / 搜索 / 归类 / 导入"],
  m2:["M2 复习计划生成","总计划 / 周计划 / 进度 / 冲刺"],
  m3:["M3 知识点思维导图","语法体系 / 六格 / 变位 / 口诀"],
  m4:["M4 背诵打卡","必背清单 / 艾宾浩斯 / 检测 / 激励"],
  m5:["M5 口语练习","发音 / 跟读 / 情景 / 话题"],
  m6:["M6 日常听力训练","分级材料 / 精听 / 泛听 / 归因"],
  m7:["M7 字母与键盘","字母卡 / 键盘布局 / 手写体"],
  books:["教材书目","全部学习书目与内容映射"],
  m8:["M8 单词学习","12 情景 · 800+ 主题词汇"],
  m9:["M9 句子学习","12 情景 · 360+ 日常句型"],
  m10:["M10 文章阅读","80 篇分级文章 · 听 / 翻译 / 习题"],
  daily:["每日一练","每天 8–10 生词 + 3 句"],
  selftest:["自测测评","听 / 说 / 读 / 写 四维综合"],
  s:["S1–S3 专项子场景","发音专项 / 差异化计划 / 语音考点"]
};
const ROUTER = {
  overview:renderOverview, m1:renderM1, m2:renderM2, m3:renderM3,
  m4:renderM4, m5:renderM5, m6:renderM6, m7:renderM7,
  books:renderBooks, m8:renderM8, m9:renderM9, m10:renderM10, daily:renderDaily, selftest:renderSelfTest,
  s:renderS
};

/* ----------------------- 侧边栏 / 路由 ----------------------- */
function buildNav(){
  let html = '';
  NAV.forEach(n=>{
    if(n.group){ html += '<div class="nav-group">'+n.group+'</div>'; return; }
    html += '<div class="nav-item" data-act="go" data-arg="'+n.id+'"><span class="ic">'+n.ic+'</span><span>'+n.name+'</span>'+(n.badge?'<span class="badge">'+n.badge+'</span>':'')+'</div>';
  });
  document.getElementById('nav').innerHTML = html;
}
function go(id){
  const f = ROUTER[id] || renderOverview;
  document.querySelectorAll('.nav-item').forEach(e=>e.classList.toggle('active', e.getAttribute('data-arg')===id));
  const m = META[id]||["",""];
  document.getElementById('pageTitle').textContent = m[0];
  document.getElementById('pageCrumb').textContent = m[1];
  closeSidebar();
  view().innerHTML = '';
  f();
  window.scrollTo(0,0);
}
function closeSidebar(){ document.getElementById('sidebar').classList.remove('open'); document.getElementById('backdrop').classList.add('hidden'); }
function openSidebar(){ document.getElementById('sidebar').classList.add('open'); document.getElementById('backdrop').classList.remove('hidden'); }

/* 弹层 */
function modal(html){ document.getElementById('modalRoot').innerHTML = '<div class="modal-mask" onclick="if(event.target===this)App.closeModal()"><div class="modal">'+html+'</div></div>'; }
function closeModal(){ document.getElementById('modalRoot').innerHTML = ''; }

/* ----------------------- 概览 ----------------------- */
function renderOverview(){
  const wordTotal = RU.wordbank ? Object.keys(RU.wordbank).reduce((a,k)=>a+RU.wordbank[k].length,0) : RU.scenes.reduce((a,s)=>a+s.words.length,0);
  const sentTotal = RU.sentbank ? Object.keys(RU.sentbank).reduce((a,k)=>a+RU.sentbank[k].length,0) : RU.scenes.reduce((a,s)=>a+s.sentences.length,0);
  const artTotal = (RU.articles && RU.articles.length) || 0;
  const cols = [
    {t:"📚 语言基础核心", mods:[["M1 考点库","14考点·搜索·导入","m1"],["M3 思维导图","语法·六格·变位·口诀","m3"],["M7 字母与键盘","字母·键盘·手写","m7"],["教材书目","全部书目·内容映射","books"]]},
    {t:"🎯 能力训练板块", mods:[["M5 口语练习","发音·跟读·情景·话题","m5"],["M6 听力训练","分级·精听·泛听·归因","m6"],["M8 单词学习","12情景·800+词汇","m8"],["M9 句子学习","12情景·360+句型","m9"],["M10 文章阅读","80篇·听/译/习题","m10"]]},
    {t:"🛠 辅助板块", mods:[["M2 复习计划","总计划·周计划·冲刺","m2"],["M4 背诵打卡","清单·艾宾浩斯·激励","m4"],["每日一练","每天8-10词+3句","daily"],["自测测评","听/说/读/写四维","selftest"],["S 专项","发音·差异计划·语音","s"]]}
  ];
  let arch='';
  cols.forEach(c=>{
    arch += '<div class="col"><h4>'+c.t+'</h4>';
    c.mods.forEach(m=>{ arch += '<div class="mod" data-act="go" data-arg="'+m[2]+'"><b>'+m[0]+'</b><br><span>'+m[1]+'</span></div>'; });
    arch += '</div>';
  });
  view().innerHTML = `
  <div class="card pad-lg">
    <h2 style="margin-top:0">👋 欢迎使用「成人俄语 0→1 学习辅助系统」</h2>
    <p class="muted">面向<b>成人零基础</b>俄语学习者（A1→A2），整合 7 大核心模块 + 6 个学习新模块 + 3 组专项，覆盖：西里尔字母与语音 → 名词性数格 → 动词变位与体 → 基础句法 → 日常交际 → 分级阅读。内容严格按<b>教材书目</b>（《大学俄语》1-8册、《走遍俄罗斯》1-3册、《新编俄语教程》1-4册、《俄语入门》）分册组织。所有内容<b>离线可用、无需登录</b>，进度自动保存在本机浏览器。</p>
    <div class="note info">💡 本应用为纯静态单页，可直接双击 <code>index.html</code> 打开使用；点击左侧任意模块开始学习。新增 <b>M10 文章阅读（80 篇：听全文·译文·理解题·翻译练习）</b>，M8/M9 词句库已按教材扩充至 800+/360+。</div>
  </div>
  <div class="card pad-lg mt16">
    <div class="section-title"><h2>🧭 系统架构总览</h2><span class="sub">点击任意模块卡片进入</span></div>
    <div class="arch">${arch}</div>
  </div>
  <div class="grid c4 mt16">
    <div class="stat"><div class="n">${wordTotal}</div><div class="l">情景主题词汇</div></div>
    <div class="stat"><div class="n">${sentTotal}</div><div class="l">日常句型</div></div>
    <div class="stat"><div class="n">${artTotal}</div><div class="l">分级文章</div></div>
    <div class="stat"><div class="n">${RU.kp.length}</div><div class="l">结构化考点</div></div>
  </div>`;
}

/* ===================================================================
   M1 考点库
   =================================================================== */
let m1s = {q:"", cat:"全部", lv:"全部", types:[]};
function renderM1(){
  const cats = ["全部"].concat([...new Set(RU.kp.map(k=>k.cat))]);
  const lvs = ["全部","A1入门","A2初级"];
  const types = ["选择题","填空","翻译","口语"];
  view().innerHTML = `
  <div class="card pad-lg">
    <div class="section-title"><h2>📚 M1 考点库管理</h2><span class="sub">自然语言搜索 · 归类标签 · 批量导入</span></div>
    <div class="row">
      <input class="input" id="m1q" placeholder="试一试：『名词第二格怎么变』『хотеть 变位』『前置词 в』" oninput="App.m1Search(this.value)">
      <button class="btn gold" onclick="App.m1Search(document.getElementById('m1q').value)">🔍 搜索</button>
    </div>
    <div class="row mt12">
      <select id="m1cat" onchange="App.m1Apply()">${cats.map(c=>'<option'+(c==='全部'?' selected':'')+'>'+c+'</option>').join('')}</select>
      <select id="m1lv" onchange="App.m1Apply()">${lvs.map(c=>'<option'+(c==='全部'?' selected':'')+'>'+c+'</option>').join('')}</select>
      <div class="flex gap8 wrap" style="flex:3 1 auto;align-items:center">
        ${types.map(t=>'<label class="tag" style="cursor:pointer"><input type="checkbox" value="'+t+'" onchange="App.m1Apply()" style="margin-right:4px">'+t+'</label>').join('')}
      </div>
    </div>
    <div class="note info mt12">📌 <b>自然语言搜索</b>：输入问题即可定位规则；若命中动词（如 хоте́ть），直接返回完整变位表。命中结果均附<b>考点编号</b>便于追溯。</div>
  </div>
  <div id="m1res" class="mt16"></div>
  <div class="card pad-lg mt16">
    <div class="section-title"><h2>📥 批量导入词表</h2></div>
    <p class="muted tiny">支持 CSV（<code>俄语,词性,释义</code>）或 JSON 数组，粘贴后追加到「我的词库」。名词须标重音，动词须标体。</p>
    <textarea id="m1import" class="input" rows="3" placeholder='стол,阳名,桌子\nсестра́,阴名,姐妹'></textarea>
    <div class="row mt12">
      <button class="btn" onclick="App.m1Import()">导入</button>
      <button class="btn ghost" onclick="App.m1ShowUserVocab()">查看我的词库</button>
    </div>
    <div id="m1imp" class="mt12"></div>
  </div>
  <div class="card pad-lg mt16">
    <div class="section-title"><h2>📖 教材版本匹配核查</h2></div>
    <p class="muted">${esc(RU.versionNote)}</p>
    <div class="note warn">⚠️ 东方《大学俄语》称「第六格」，走遍俄罗斯称 <i>предло́жный паде́ж</i>，二者<b>同义</b>。重音拼写以您所用教材为准。</div>
  </div>`;
  m1Refresh();
}
function m1Search(v){ m1s.q=v; m1Refresh(); }
function m1Apply(){
  m1s.cat = $('#m1cat').value;
  m1s.lv = $('#m1lv').value;
  m1s.types = [...document.querySelectorAll('#view input[type=checkbox]:checked')].map(c=>c.value);
  m1Refresh();
}
function m1Refresh(){
  const q = norm(m1s.q);
  // 动词变位命中
  if(q){
    const v = RU.verbs.find(x=>norm(x.inf)===q || norm(x.inf).indexOf(q)>=0 || q.indexOf(norm(x.inf))>=0);
    if(v){
      $('#m1res').innerHTML = verbCardHTML(v, true);
      return;
    }
  }
  let list = RU.kp.filter(k=>{
    if(m1s.cat!=="全部" && k.cat!==m1s.cat) return false;
    if(m1s.lv!=="全部" && k.level!==m1s.lv) return false;
    if(m1s.types.length && !m1s.types.some(t=>k.types.includes(t))) return false;
    if(q){
      const hay = norm([k.point,k.rule,k.examples.join(' '),k.tags.join(' '),k.id,k.sentences.join(' ')].join(' '));
      if(hay.indexOf(q)<0) return false;
    }
    return true;
  });
  if(!list.length){ $('#m1res').innerHTML='<div class="note">未命中考点，可尝试更简短的关键词（如「第二格」「变位」「前置词」）。</div>'; return; }
  let html = '<div class="grid c2">';
  list.forEach(k=>{
    html += '<div class="card" data-act="m1detail" data-arg="'+k.id+'">'
      + '<div class="flex between"><b>'+esc(k.point)+'</b><span class="tag sm">'+esc(k.level)+'</span></div>'
      + '<div class="tiny muted">'+esc(k.id)+' · '+esc(k.book)+'</div>'
      + '<div class="mt8">'+esc(k.rule)+'</div>'
      + '<div class="mt8">'+k.tags.map(t=>'<span class="tag gold sm">'+esc(t)+'</span>').join(' ')+'</div>'
      + '</div>';
  });
  html += '</div>';
  $('#m1res').innerHTML = html;
}
function verbCardHTML(v, big){
  const rows = Object.entries(v.forms).map(([p,f])=>'<tr><td>'+p+'</td><td class="cyr">'+f+' '+spkWord(f)+'</td></tr>').join('');
  return '<div class="card pad-lg"><h3 style="margin-top:0">🌿 '+esc(v.inf)+' — 完整变位表</h3>'
    + '<p class="tiny muted">体：'+(v.aspect==='完'?'完成体':'未完成体')+' · 变位法：'+(v.conj===0?'特殊变位':v.conj+' 类')+(v.irregular?' · ⚠ 特殊变化':'')+(v.motion?' · 运动动词':'')+' · 对应'+(v.aspect==='完'?'未':'完')+'成体：'+esc(v.pair)+'</p>'
    + '<table class="tbl"><tr><th>人称</th><th class="cyr">形式</th></tr>'+rows+'</table>'
    + (big?'<div class="note info mt12">'+esc(RU.conjTip)+'</div>':'')+'</div>';
}
function m1detail(id){
  const k = RU.kp.find(x=>x.id===id); if(!k) return;
  modal('<h3>'+esc(k.point)+' <span class="tag sm">'+esc(k.level)+'</span></h3>'
    + '<div class="tiny muted">'+esc(k.id)+' · '+esc(k.book)+' · 考试对接：'+esc(k.exam)+'</div>'
    + '<h4>📌 规则</h4><p>'+esc(k.rule)+'</p>'
    + '<h4>📝 例词</h4><p class="cyr">'+k.examples.map(e=>e+' '+spkWord(e.replace(/[̀-ͯ]/g,''))).join(' &nbsp; ')+'</p>'
    + '<h4>📖 例句</h4><p>'+k.sentences.map(s=>esc(s)+' '+spkWord(s.replace(/[一-龥]/g,'').replace(/[̀-ͯ]/g,''))).join('<br>')+'</p>'
    + '<h4>⚠️ 易错点</h4><div class="case-item">'+esc(k.errors)+'</div>'
    + '<h4>🏷 标签 / 维度</h4><p>'+k.tags.map(t=>'<span class="tag gold sm">'+esc(t)+'</span>').join(' ')
      + ' &nbsp; <span class="tag sm">语法大类：'+esc(k.cat)+'</span>'
      + ' &nbsp; <span class="tag info sm">题型：'+k.types.join('/')+'</span></p>'
    + (k.prereq&&k.prereq.length?'<p class="tiny muted">前置考点：'+esc(k.prereq.join('，'))+'</p>':'')
    + '<div class="row mt16"><button class="btn gold" onclick="App.closeModal()">关闭</button></div>');
}
function m1Import(){
  const raw = $('#m1import').value.trim(); if(!raw){ $('#m1imp').innerHTML='<div class="note warn">请先粘贴词表。</div>'; return; }
  let added=0, skipped=0; const store = lsGet('ru_uservocab', []);
  raw.split(/\n+/).forEach(line=>{
    line=line.trim(); if(!line) return;
    let ru,pos,zh;
    if(line.trim().startsWith('[') || line.trim().startsWith('{')){
      try{ const o=JSON.parse(line); ru=o.ru||o.俄语; pos=o.pos||o.词性; zh=o.zh||o.释义; }catch(e){ return; }
    } else {
      const p=line.split(/[,，\t]/); ru=p[0]; pos=p[1]||''; zh=p[2]||'';
    }
    if(!ru) return;
    if(store.some(s=>norm(s.ru)===norm(ru))){ skipped++; return; }
    store.push({ru,pos:pos||'—',zh:zh||'—',lv:'导入'}); added++;
  });
  lsSet('ru_uservocab', store);
  $('#m1imp').innerHTML = '<div class="note ok">✅ 导入完成：新增 '+added+' 条，重复跳过 '+skipped+' 条。</div>';
}
function m1ShowUserVocab(){
  const store = lsGet('ru_uservocab', []);
  if(!store.length){ modal('<h3>我的词库</h3><p class="muted">暂无导入词汇。在上方粘贴 CSV / JSON 后点击「导入」。</p><button class="btn gold" onclick="App.closeModal()">关闭</button>'); return; }
  let rows = store.map(s=>'<tr><td class="cyr">'+esc(s.ru)+' '+spkWord(s.ru)+'</td><td>'+esc(s.pos)+'</td><td>'+esc(s.zh)+'</td></tr>').join('');
  modal('<h3>我的词库（'+store.length+' 条）</h3><div class="scrolly"><table class="tbl"><tr><th class="cyr">俄语</th><th>词性</th><th>释义</th></tr>'+rows+'</table></div><button class="btn gold mt12" onclick="App.closeModal()">关闭</button>');
}

/* ===================================================================
   M2 复习计划
   =================================================================== */
function renderM2(){
  view().innerHTML = `
  <div class="card pad-lg">
    <div class="section-title"><h2>🗓️ M2 复习计划生成</h2><span class="sub">个性化总计划 · 周/日拆解 · 进度调整 · 考前冲刺</span></div>
    <div class="grid c2">
      <div>
        <label class="lbl">学习者基础</label>
        <select id="m2base" class="input"><option>零基础（未接触西里尔字母）</option><option>接触过西里尔字母</option><option>学过其他外语</option><option>略有俄语基础</option></select>
        <label class="lbl">每周可学天数</label>
        <select id="m2days" class="input"><option>3 天</option><option>4 天</option><option selected>5 天</option><option>6 天</option><option>7 天</option></select>
        <label class="lbl">每天时长（分钟）</label>
        <input id="m2min" class="input" type="number" value="50" min="20" max="120">
      </div>
      <div>
        <label class="lbl">学习目标</label>
        <select id="m2goal" class="input"><option>日常交流</option><option>ТРКИ A1</option><option selected>ТРКИ A2</option><option>大学俄语四级</option></select>
        <label class="lbl">计划周期（周）</label>
        <input id="m2weeks" class="input" type="number" value="24" min="8" max="52">
        <label class="lbl">开始日期</label>
        <input id="m2start" class="input" type="date" value="${dstr()}">
        <div class="note info mt12">成人单次 40–60 分钟，语法采用「规则→练习→纠错」循环；俄语语法递进，前格未掌握不推进新格。</div>
      </div>
    </div>
    <button class="btn gold block mt16" onclick="App.m2Gen()">⚙️ 生成我的 0→1 学习计划</button>
  </div>
  <div id="m2out" class="mt16"></div>
  <div class="card pad-lg mt16">
    <div class="section-title"><h2>📊 进度监控与动态调整</h2></div>
    <p class="muted tiny">输入本周计划 vs 实际完成情况，系统自动识别<b>卡点</b>并给出调整建议（俄语语法递进，前置未掌握不得跳级）。</p>
    <div class="row">
      <input class="input" id="m2p1" placeholder="计划新学语法点(个)" value="5">
      <input class="input" id="m2a1" placeholder="实际(个)" value="4">
      <input class="input" id="m2p2" placeholder="计划背词(个)" value="75">
      <input class="input" id="m2a2" placeholder="实际(个)" value="60">
    </div>
    <input class="input mt12" id="m2stuck" placeholder="本周卡点（如：名词第二格复数变格）">
    <button class="btn mt12" onclick="App.m2Progress()">生成进度报告</button>
    <div id="m2prog" class="mt12"></div>
  </div>
  <div class="card pad-lg mt16">
    <div class="section-title"><h2>🎯 考前冲刺复习计划</h2></div>
    <div class="row">
      <select id="m2exam" class="input"><option>ТРКИ A1</option><option selected>ТРКИ A2</option><option>大学俄语四级</option><option>大学俄语六级</option></select>
      <input id="m2ew" class="input" type="number" value="4" min="2" max="12">
      <button class="btn gold" onclick="App.m2Sprint()">生成冲刺计划</button>
    </div>
    <div id="m2sprint" class="mt12"></div>
  </div>`;
  const saved = lsGet('ru_plan', null);
  if(saved) $('#m2out').innerHTML = saved;
}
const M2_TOPICS = ["字母与语音","名词一/二格","名词三/四格","名词五/六格","形容词与代词","动词现在时(第一变位法)","动词现在时(第二变位法)","过去时与将来时","动词的体","运动动词","基数词与连用","基础前置词","句型与日常交际","阅读与综合"];
function m2Gen(){
  const base=$('#m2base').value, days=$('#m2days').value, min=+$('#m2min').value,
        goal=$('#m2goal').value, weeks=+$('#m2weeks').value, start=$('#m2start').value;
  const stages=[
    {n:"阶段1 · 字母与语音", wk:"第1–3周", items:["33 个字母 + 发音规则","重音与软硬辅音","元音弱化规则","每日：学字母15 + 拼读15 + 单词10 + 复习10"], ms:"能拼读任意俄语单词，掌握基本重音规则"},
    {n:"阶段2 · 基础语法", wk:"第4–12周", items:["名词六格、形容词、人称代词","动词现在时两大变位法","每日：语法20 + 变格练习15 + 词汇15"], ms:"掌握名词六格单数变格与基本变位"},
    {n:"阶段3 · 动词进阶", wk:"第13–20周", items:["过去时、将来时","动词的体、运动动词","每日：动词20 + 变位练习15 + 听力15"], ms:"区分完成体/未完成体，掌握基本变位"},
    {n:"阶段4 · 综合运用", wk:"第21–"+weeks+"周", items:["听说读写综合训练","模拟测评与查漏","每日：综合30 + 听说20"], ms:"通过 "+goal+" 模拟测试"}
  ];
  let html='<div class="card pad-lg"><h3 style="margin-top:0">📅 成人俄语 0→1 学习计划</h3>';
  html+='<p class="muted">👤 基础：'+esc(base)+' ｜ 每周 '+esc(days)+' ｜ 每天 '+min+' 分钟 ｜ 🎯 目标：'+weeks+' 周达到 '+esc(goal)+'（自 '+esc(start)+' 起）</p>';
  html+='<div class="note info">每周节奏：新授40% + 练习30% + 复习20% + 听说10%；俄语语法量大，进度须给足消化时间。</div>';
  stages.forEach(s=>{
    html+='<div class="card mt12" style="border-left:4px solid var(--gold)"><div class="flex between"><b>'+esc(s.n)+'</b><span class="tag">'+esc(s.wk)+'</span></div>'
      +'<ul style="margin:8px 0 4px;padding-left:20px">'+s.items.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul>'
      +'<div class="tiny"><b>🏁 里程碑：</b>'+esc(s.ms)+'</div></div>';
  });
  // 周计划拆解（前6周示例）
  html+='<h4 class="mt16">🗓️ 周计划拆解（前 6 周）</h4><div class="scrolly">';
  for(let w=1; w<=6; w++){
    const t=M2_TOPICS[(w-1)%M2_TOPICS.length];
    html+='<div class="case-item"><b>第'+w+'周</b>：'+esc(t)+' — 新授 + 变格/变位练习 + 复习（呼应艾宾浩斯）</div>';
  }
  html+='</div>';
  html+='<div class="row mt16"><button class="btn gold" onclick="App.m2Save()">💾 保存此计划</button></div></div>';
  $('#m2out').innerHTML=html;
  App._planHTML = html;
}
function m2Save(){
  if(!App._planHTML){ return; }
  lsSet('ru_plan', App._planHTML);
  toast('✅ 计划已保存到本机浏览器');
}
function m2Progress(){
  const p1=+$('#m2p1').value, a1=+$('#m2a1').value, p2=+$('#m2p2').value, a2=+$('#m2a2').value, stuck=$('#m2stuck').value.trim();
  const r1=Math.round(a1/p1*100), r2=Math.round(a2/p2*100);
  let rec='';
  if(r1<90||r2<90){
    rec='⚠️ <b>卡点：</b>'+(stuck||'部分语法点/词汇未达预期')+'<br>💡 <b>调整建议：</b>'
      +'<br>· 暂缓推进新格，集中强化薄弱点（六格总表对比记忆）'
      +'<br>· 制作变格速查卡，每日即时反馈不留隔夜错误'
      +'<br>· 下周减量，保证消化（俄语递进，前置未掌握不跳级）';
  } else {
    rec='✅ 完成率良好，可保持节奏并小幅增加新语法点。';
  }
  $('#m2prog').innerHTML='<div class="card"><table class="tbl"><tr><th>项目</th><th>计划</th><th>实际</th><th>完成率</th></tr>'
    +'<tr><td>新学语法点</td><td>'+p1+'</td><td>'+a1+'</td><td>'+r1+'%</td></tr>'
    +'<tr><td>背单词</td><td>'+p2+'</td><td>'+a2+'</td><td>'+r2+'%</td></tr></table>'
    +'<div class="note warn mt12">'+rec+'</div></div>';
}
function m2Sprint(){
  const ex=$('#m2exam').value, w=+$('#m2ew').value;
  const html='<div class="card"><h3 style="margin-top:0">🎯 '+esc(ex)+' 冲刺计划（距考试 '+w+' 周）</h3>'
    +'<div class="note info">冲刺三阶段：基础回炉 → 专项突破 → 模拟冲刺；每日 刷题50% + 错题复习30% + 词汇20%。</div>'
    +'<div class="card mt12" style="border-left:4px solid var(--gold)"><b>第1周：语法回炉</b><ul style="margin:6px 0;padding-left:20px"><li>六格变格、动词体、运动动词快速梳理</li><li>每日：语法速查30min + 高频词20min</li></ul></div>'
    +'<div class="card mt12" style="border-left:4px solid var(--gold)"><b>第2–'+(w-1)+'周：专项突破</b><ul style="margin:6px 0;padding-left:20px"><li>听力：每日 1 套精听</li><li>语法词汇：每日 30 题 + 错题归因</li><li>写作：每 2 天 1 篇短文</li></ul></div>'
    +'<div class="card mt12" style="border-left:4px solid var(--gold)"><b>第'+w+'周：模拟冲刺</b><ul style="margin:6px 0;padding-left:20px"><li>每周 2 套全真模拟，限时完成</li><li>错题集中复盘</li></ul></div>'
    +'<div class="tiny muted mt8">📊 每日时长建议 90 分钟；限时模拟是冲刺期必备环节，错题归因落实到具体语法点。</div></div>';
  $('#m2sprint').innerHTML=html;
}

/* ===================================================================
   M3 思维导图
   =================================================================== */
function renderM3(){
  const tree = `
  <div class="card pad-lg">
    <h3 style="margin-top:0">🌲 俄语语法体系导图（概要）</h3>
    <div style="font-family:'Noto Sans',Arial,sans-serif;line-height:1.9">
      <b>俄语语法</b><br>
      ├─ <b>词法 морфология</b><br>
      │&nbsp;&nbsp; ├─ 名词 ─ 性(阳/阴/中)·数·<b>格(六格)</b>·三变格法<br>
      │&nbsp;&nbsp; ├─ 形容词 ─ 性与格随名词（硬/软/混合变化）<br>
      │&nbsp;&nbsp; ├─ 代词 ─ 人称/物主/指示/疑问<br>
      │&nbsp;&nbsp; ├─ 数词 ─ 基数/序数（与名词连用规则）<br>
      │&nbsp;&nbsp; ├─ <b>动词</b> ─ 体(完成/未)·时·变位(第一/第二)·运动动词<br>
      │&nbsp;&nbsp; ├─ 副词 ─ 方式/程度/处所/时间<br>
      │&nbsp;&nbsp; └─ 前置词 ─ 支配格（в/на+6、с+5、о+6）<br>
      └─ <b>句法 синтаксис</b><br>
      &nbsp;&nbsp;&nbsp;&nbsp; ├─ 简单句 ─ 主谓一致、无动词句（У меня́ есть…）<br>
      &nbsp;&nbsp;&nbsp;&nbsp; └─ 复合句 ─ 并列/主从复合句<br>
      <div class="note ok mt8">⭐ <b>0→1 必学</b>：名词六格、动词变位、基础前置词、У меня́ есть 句型。</div>
    </div>
  </div>`;
  // 六格矩阵
  let rows = RU.declension.rows.map(r=>'<tr>'+r.map((c,i)=>'<td'+(i===0?'':' class="cyr"'+(i>1?'':''))+'>'+esc(c)+'</td>').join('')+'</tr>').join('');
  const decl = '<div class="card pad-lg mt16"><h3 style="margin-top:0">🗺️ '+esc(RU.declension.title)+'</h3>'
    +'<table class="tbl"><tr><th>'+RU.declension.header.map(esc).join('</th><th>')+'</th></tr>'+rows+'</table>'
    +'<div class="note gold mt12">🎵 口诀：'+esc(RU.declension.rhyme)+'</div>'
    +'<div class="case-item">⚠️ 重音移动：'+RU.declension.stressMove.join('；')+'</div>'
    +'<div class="case-item">📌 特殊变化：'+esc(RU.declension.special)+'</div></div>';
  // 动词变位
  let vhtml='<div class="card pad-lg mt16"><h3 style="margin-top:0">🌿 动词变位与体导图</h3><div class="grid c2">';
  RU.verbs.forEach(v=>{ vhtml+=verbCardHTML(v,false); });
  vhtml+='</div><div class="note info mt12">'+esc(RU.conjTip)+'</div></div>';
  // 口诀
  let rh='<div class="card pad-lg mt16"><h3 style="margin-top:0">🎵 语法口诀与记忆法集</h3><div class="grid c2">';
  RU.rhymes.forEach(r=>{
    rh+='<div class="card" style="border-left:4px solid var(--navy)"><b>'+esc(r.title)+'</b>'
      +'<blockquote style="margin:8px 0;padding:6px 12px;background:var(--gold-100);border-radius:8px;color:var(--navy-700)">'+esc(r.content)+'</blockquote>'
      +'<div class="tiny muted">规则：'+esc(r.rule)+'</div>'
      +'<div class="tiny">例：'+esc(r.ex)+' '+spkWord(r.ex.replace(/[̀-ͯ]/g,''))+'</div></div>';
  });
  rh+='</div></div>';
  view().innerHTML = tree + decl + vhtml + rh;
}

/* ===================================================================
   M4 背诵打卡
   =================================================================== */
function checklistState(){ return lsGet('ru_checklist', {}); }
function toggleCheck(id){
  const s=checklistState(); s[id]=!s[id]; lsSet('ru_checklist', s);
  const el=document.querySelector('[data-chk="'+id+'"]'); if(el) el.checked=s[id];
  m4Stats();
}
function renderM4(){
  const tabs = [["a","字母表(33)"],["v","核心词汇("+RU.vocab.length+")"],["d","名词变格"],["vb","动词变位"],["s","日常句型"]];
  view().innerHTML = `
  <div class="card pad-lg">
    <div class="section-title"><h2>✅ M4 背诵打卡</h2><span class="sub">必背清单 · 艾宾浩斯 · 成果检测 · 激励</span></div>
    <div class="row" id="m4tabs">${tabs.map((t,i)=>'<button class="btn '+(i===0?'gold':'ghost')+'" data-act="m4tab" data-arg="'+t[0]+'">'+t[1]+'</button>').join('')}</div>
    <div id="m4list" class="mt16"></div>
    <div id="m4stats" class="mt16"></div>
  </div>
  <div class="card pad-lg mt16">
    <div class="section-title"><h2>🧠 艾宾浩斯背诵计划（成人版）</h2></div>
    <p class="muted tiny">间隔：当天→第2天→第4天→第7天→第15天→第30天。变格/变位复习用「默写复现」，不用选择题。每日新背 15–20 词、复习≤40 词。</p>
    <div id="m4eb"></div>
  </div>
  <div class="card pad-lg mt16">
    <div class="section-title"><h2>🔍 背诵成果检测</h2></div>
    <div class="row">
      <button class="btn" data-act="m4flash" data-arg="flash">闪卡（看俄说中）</button>
      <button class="btn" data-act="m4flash" data-arg="reverse">反向（看中说俄）</button>
      <button class="btn" data-act="m4flash" data-arg="decl">默写变格表</button>
      <button class="btn gold" data-act="m4checkin">📅 今日打卡</button>
    </div>
    <div id="m4play" class="mt16"></div>
    <div id="m4checkin" class="mt16"></div>
  </div>`;
  m4Tab('a');
  m4Ebbinghaus();
  m4CheckinPanel();
}
function m4Tab(which){
  document.querySelectorAll('#m4tabs .btn').forEach(b=>b.classList.toggle('gold', b.getAttribute('data-arg')===which));
  const s=checklistState(); let html='';
  if(which==='a'){
    html='<div class="letter-grid">';
    RU.alphabet.forEach((l,i)=>{
      const id='a'+i;
      html+='<label class="letter-card '+(l.hard?'hard':'')+'"><input type="checkbox" data-chk="'+id+'" '+(s[id]?'checked':'')+' onchange="App.toggleCheck(\''+id+'\')">'
        +'<div class="big cyr">'+esc(l.l)+'</div><div class="ipa">'+esc(l.ipa)+'</div>'
        +'<div class="ex cyr">'+esc(l.ex)+' '+spkWord(l.ex.replace(/[̀-ͯ]/g,'').split(' ')[0])+'</div>'
        +'<div class="name">'+esc(l.look)+'</div>'+(l.hard?'<div class="flag">难音</div>':'')+'</label>';
    });
    html+='</div>';
  } else if(which==='v'){
    const themes=[...new Set(RU.vocab.map(v=>v.theme))];
    themes.forEach(th=>{
      html+='<h4 class="mt12">'+esc(th)+'</h4><table class="tbl"><tr><th class="cyr">俄语（重音）</th><th>词性</th><th>释义</th><th>级</th><th></th></tr>';
      RU.vocab.filter(v=>v.theme===th).forEach((v,i)=>{
        const id='v'+RU.vocab.indexOf(v);
        html+='<tr><td class="cyr">'+esc(v.ru)+' '+spkWord(v.ru)+'</td><td>'+esc(v.pos)+'</td><td>'+esc(v.zh)+'</td><td>'+esc(v.lv)+'</td>'
          +'<td><input type="checkbox" data-chk="'+id+'" '+(s[id]?'checked':'')+' onchange="App.toggleCheck(\''+id+'\')"></td></tr>';
      });
      html+='</table>';
    });
  } else if(which==='d'){
    html='<p class="muted tiny">勾选已掌握的名词（完整六格变格）。</p><table class="tbl"><tr><th>性/类型</th><th class="cyr">主</th><th class="cyr">生</th><th class="cyr">与</th><th class="cyr">宾</th><th class="cyr">工</th><th class="cyr">前</th><th></th></tr>';
    RU.declNouns.forEach((n,i)=>{
      const id='d'+i;
      html+='<tr><td>'+esc(n.g)+'</td>'+n.forms.map(f=>'<td class="cyr">'+esc(f)+'</td>').join('')+'<td><input type="checkbox" data-chk="'+id+'" '+(s[id]?'checked':'')+' onchange="App.toggleCheck(\''+id+'\')"></td></tr>';
    });
    html+='</table>';
  } else if(which==='vb'){
    html='<table class="tbl"><tr><th class="cyr">动词(未)</th><th class="cyr">я</th><th class="cyr">ты</th><th class="cyr">он</th><th class="cyr">мы</th><th class="cyr">вы</th><th class="cyr">они</th><th></th></tr>';
    RU.verbs.forEach((v,i)=>{
      const id='vb'+i; const f=v.forms;
      html+='<tr><td class="cyr">'+esc(v.inf)+'</td>'+[f.я,f.ты,f.он,f.мы,f.вы,f.они].map(x=>'<td class="cyr">'+esc(x)+'</td>').join('')+'<td><input type="checkbox" data-chk="'+id+'" '+(s[id]?'checked':'')+' onchange="App.toggleCheck(\''+id+'\')"></td></tr>';
    });
    html+='</table>';
  } else if(which==='s'){
    let n=0;
    RU.scenarios.forEach(sc=>{
      html+='<h4 class="mt12">'+esc(sc.title)+'</h4>';
      sc.key.forEach(k=>{ const id='s'+(n++); html+='<label class="case-item" style="display:block"><input type="checkbox" data-chk="'+id+'" '+(s[id]?'checked':'')+' onchange="App.toggleCheck(\''+id+'\')"> <span class="cyr">'+esc(k)+'</span> '+spkWord(k.replace(/[一-龥]/g,'').replace(/[̀-ͯ]/g,''))+'</label>'; });
    });
  }
  $('#m4list').innerHTML=html;
  m4Stats();
}
function m4Stats(){
  const s=checklistState();
  const total = RU.alphabet.length + RU.vocab.length + RU.declNouns.length + RU.verbs.length
    + RU.scenarios.reduce((a,b)=>a+b.key.length,0);
  const done = Object.values(s).filter(Boolean).length;
  const pct = Math.round(done/total*100);
  const vocabDone = RU.vocab.filter((v,i)=>s['v'+i]).length;
  const gramDone = RU.declNouns.filter((n,i)=>s['d'+i]).length + RU.verbs.filter((v,i)=>s['vb'+i]).length;
  $('#m4stats').innerHTML='<div class="grid c4">'
    +'<div class="stat"><div class="n">'+pct+'%</div><div class="l">总掌握度 '+done+'/'+total+'</div></div>'
    +'<div class="stat"><div class="n">'+vocabDone+'</div><div class="l">已背词汇</div></div>'
    +'<div class="stat"><div class="n">'+gramDone+'</div><div class="l">已掌握变格/变位</div></div>'
    +'<div class="stat"><div class="n">'+calcStreak(lsGet('ru_checkin',[]))+'</div><div class="l">连续打卡(天)</div></div></div>'
    +'<div class="bar mt12"><i style="width:'+pct+'%"></i></div>';
}
function m4Ebbinghaus(){
  const intervals=[0,2,4,7,15,30];
  let html='<div class="scrolly"><table class="tbl"><tr><th>周期</th><th>新背</th><th>复习内容</th><th>复习形式</th></tr>';
  const plan=[["Day1","字母 А-Ж + 家庭词10","—","听写/认读"],["Day2","字母 З-П + 数字词10","Day1","听写"],["Day4","字母 Р-Я + 时间词10","Day2","看中文说俄"],["Day7","主题词10 + 句型3","Day4,Day1","默写复现"],["Day15","新主题词 + 变格表","Day7,Day2","默写变格"],["Day30","总复习","Day15,Day4","综合默写"]];
  plan.forEach(p=>{ html+='<tr><td><b>'+p[0]+'</b></td><td>'+esc(p[1])+'</td><td>'+esc(p[2])+'</td><td>'+esc(p[3])+'</td></tr>'; });
  html+='</table></div>';
  $('#m4eb').innerHTML=html;
}
function m4Flash(mode){
  const deck = mode==='reverse'
    ? RU.vocab.map(v=>({front:v.zh, back:v.ru, hint:v.pos}))
    : mode==='decl'
      ? null
      : RU.vocab.map(v=>({front:v.ru, back:v.zh, hint:v.pos}));
  if(mode==='decl'){ return m4Decl(); }
  const state={deck, i:0, right:0, total:deck.length};
  function show(){
    const c=state.deck[state.i];
    $('#m4play').innerHTML='<div class="flash"><div class="progress-dots">'+state.deck.map((_,k)=>'<i class="'+(k<state.i?'done':k===state.i?'cur':'')+'"></i>').join('')+'</div>'
      +'<div class="hint">第 '+(state.i+1)+' / '+state.total+' 张 · '+(mode==='reverse'?'看中文，写出俄语（含重音）':'看俄语，说出中文')+'</div>'
      +'<div class="face cyr">'+esc(c.front)+'</div>'
      + (mode==='reverse'?'<input class="input" id="fcans" placeholder="输入俄语…" style="max-width:280px;margin:8px auto">':'')
      +'<div class="back" id="fcback"></div>'
      +'<div class="ans"><button class="btn soft" onclick="App._fcShow()">显示答案</button>'
      + (mode==='reverse'?'<button class="btn gold" onclick="App._fcCheck()">判对错</button>':'')
      +'<button class="btn ghost" onclick="App._fcNext()">下一张 →</button></div></div>';
    if(mode!=='reverse'){ const w=c.front.replace(/[̀-ͯ]/g,''); speak(w); }
    App._fcShow=()=>{ $('#fcback').innerHTML = '<span class="cyr">'+esc(c.back)+'</span> '+(mode==='reverse'?'<span class="tiny muted">'+esc(c.hint)+'</span>':spkWord(c.back)); if(mode!=='reverse') state.right++; };
    App._fcCheck=()=>{
      const ans=norm($('#fcans').value); const exp=norm(c.back);
      const ok = ans===exp || ans.indexOf(exp)>=0 || exp.indexOf(ans)>=0;
      $('#fcback').innerHTML = (ok?'✅ 正确！':'❌ 应为 <span class="cyr">'+esc(c.back)+'</span>')+' '+(ok?spkWord(c.back):'');
      if(ok) state.right++;
    };
    App._fcNext=()=>{ state.i++; if(state.i>=state.total){ $('#m4play').innerHTML='<div class="flash"><div class="face">🎉</div><div class="back">本轮正确 '+state.right+' / '+state.total+'</div><button class="btn gold" onclick="App.m4Flash(\''+mode+'\')">再来一轮</button></div>'; return; } show(); };
  }
  show();
}
function m4Decl(){
  const n = RU.declNouns[Math.floor(Math.random()*RU.declNouns.length)];
  const cases=["主格","生格","与格","宾格","工具格","前置格"];
  let html='<div class="flash" style="max-width:560px"><div class="hint">默写「<span class="cyr">'+esc(n.nom)+'</span>」的单数六格（'+esc(n.g)+'），重音错误单独计。</div>';
  html+='<table class="tbl"><tr><th>格</th><th class="cyr">你的答案</th></tr>';
  cases.forEach((c,i)=>{ html+='<tr><td>'+c+'</td><td><input class="input" id="dec'+i+'" placeholder="…"></td></tr>'; });
  html+='</table><div class="ans"><button class="btn gold" onclick="App._decCheck()">判分</button></div><div class="back" id="decres"></div></div>';
  $('#m4play').innerHTML=html;
  speak(n.nom.replace(/[̀-ͯ]/g,''));
  App._decCheck=()=>{
    let right=0, accentErr=0;
    cases.forEach((c,i)=>{
      const got=norm($('#dec'+i).value); const exp=norm(n.forms[i]);
      const expFull=n.forms[i];
      if(got===exp) right++;
      else if(got===norm(expFull.replace(/[̀-ͯ]/g,''))) accentErr++; // 字母对但重音错
    });
    const total=cases.length;
    $('#decres').innerHTML='成绩：'+right+'/'+total+' 正确'+(accentErr?'，其中重音错误 '+accentErr+' 处 ⚠️':'')
      +'<br><span class="tiny muted">正确答案：'+n.forms.map((f,i)=>cases[i]+' '+f).join(' ｜ ')+'</span>';
    if(right<total){
      const ms=lsGet('ru_mistakes',[]); ms.push({type:'默写变格', item:n.nom+'（'+n.g+'）', date:dstr()}); lsSet('ru_mistakes', ms.slice(-50));
    }
  };
}
function m4CheckinPanel(){
  const dates=lsGet('ru_checkin',[]);
  const streak=calcStreak(dates);
  const milestones=[[7,"一周坚持"],[21,"21天习惯养成"],[30,"月度达人"],[60,"两月通关"],[100,"百日俄语人"]];
  const nextM=milestones.find(m=>streak<m[0]) || [100,"已封神"];
  const left = nextM[0]-streak;
  $('#m4checkin').innerHTML='<div class="note ok">🔥 连续打卡 <b>'+streak+'</b> 天 ｜ 再坚持 <b>'+left+'</b> 天达成「'+nextM[1]+'」里程碑！'
    +'<br><span class="tiny">💡 习惯建议：固定每晚同一时间学习，减少决策损耗。中断不责备，恢复即可续算。</span></div>';
}
function m4Checkin(){
  const dates=lsGet('ru_checkin',[]); const t=dstr();
  if(!dates.includes(t)){ dates.push(t); lsSet('ru_checkin',dates); toast('✅ 今日打卡成功！'); }
  else toast('今天已经打卡啦~');
  m4Stats(); m4CheckinPanel();
}

/* ===================================================================
   M5 口语练习
   =================================================================== */
function renderM5(){
  view().innerHTML = `
  <div class="card pad-lg">
    <div class="section-title"><h2>🎤 M5 口语练习</h2><span class="sub">发音入门 · 跟读纠音 · 情景对话 · 话题表达</span></div>
    <div class="row">
      <button class="btn gold" data-act="m5sub" data-arg="pron">🗣 发音入门</button>
      <button class="btn" data-act="m5sub" data-arg="follow">🎧 跟读纠音</button>
      <button class="btn" data-act="m5sub" data-arg="scene">💬 情景对话</button>
      <button class="btn" data-act="m5sub" data-arg="topic">📝 话题表达</button>
    </div>
    <div id="m5box" class="mt16"></div>
  </div>`;
  m5sub('pron');
}
function m5sub(which){
  let html='';
  if(which==='pron'){
    html='<h3 style="margin-top:0">🗣 发音入门（中文母语者难点专项）</h3><div class="grid c2">';
    RU.pronunciation.forEach(p=>{
      html+='<div class="card" style="border-left:4px solid var(--gold)"><b class="cyr">'+esc(p.sound)+'</b> '+spkWord(p.sound.replace(/[\[\]\/]/g,'').split(' ')[0])+''
        +'<div class="mt8">'+esc(p.tip)+'</div>'
        +'<div class="tiny mt8">例：'+p.ex.map(e=>'<span class="cyr">'+esc(e)+'</span> '+spkWord(e.replace(/[̀-ͯ]/g,''))).join(' ｜ ')+'</div>'
        +'<div class="case-item">⚠️ '+esc(p.err)+'</div></div>';
    });
    html+='</div>';
  } else if(which==='follow'){
    const words=["студе́нт","спаси́бо","здра́вствуйте","ру́сский","хорошо́","Меня́ зову́т","Я живу́ в Кита́е","большо́й го́род"];
    html='<h3 style="margin-top:0">🎧 跟读评测与纠音</h3><div class="note info">点击 🔊 听标准发音后跟读；可用浏览器语音输入（Chrome 支持 ru-RU）或直接输入您听到的内容，系统比对并给出纠音提示。</div>';
    html+='<div id="followBox"></div><div class="row" id="followWords">'+words.map(w=>'<button class="btn soft" data-act="m5follow" data-arg="'+encodeURIComponent(w)+'">'+esc(w)+'</button>').join('')+'</div>';
  } else if(which==='scene'){
    html='<h3 style="margin-top:0">💬 情景对话练习（角色扮演）</h3><div class="row" id="scenePick">'+RU.scenarios.map(s=>'<button class="btn '+(s.id==='intro'?'gold':'ghost')+'" data-act="m5scene" data-arg="'+s.id+'">'+esc(s.title)+'（'+esc(s.level)+'）</button>').join('')+'</div><div id="sceneBox" class="mt16"></div>';
    m5scene('intro');
    return;
  } else if(which==='topic'){
    html='<h3 style="margin-top:0">📝 话题口语表达（自由表达与反馈）</h3><div class="row" id="topicPick">'+RU.topics.map(t=>'<button class="btn '+(t.id==='family'?'gold':'ghost')+'" data-act="m5topic" data-arg="'+t.id+'">'+esc(t.title)+'</button>').join('')+'</div><div id="topicBox" class="mt16"></div>';
    m5topic('family');
    return;
  }
  $('#m5box').innerHTML=html;
}
function m5follow(enc){
  const w=decodeURIComponent(enc);
  speak(w.replace(/[̀-ͯ]/g,''));
  $('#followBox').innerHTML='<div class="card" style="border-left:4px solid var(--navy)"><div class="face cyr" style="font-size:30px">'+esc(w)+' '+spkWord(w.replace(/[̀-ͯ]/g,''))+'</div>'
    +'<div class="row mt12"><button class="btn" onclick="App._rec(\''+encodeURIComponent(w)+'\')">🎙 语音输入跟读</button></div>'
    +'<div id="recOut" class="mt12"></div>'
    +'<div class="tiny muted mt8">💡 纠音提示：重点关注中文母语者难点（ы/р/软辅音/重音）。阳性咝音后变位、软硬辅音区分是关键。</div></div>';
}
function _rec(enc){
  const target=decodeURIComponent(enc).replace(/[̀-ͯ]/g,'');
  const out=$('#recOut');
  if(!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)){
    out.innerHTML='<div class="note warn">当前浏览器不支持语音识别。请直接输入您听到的内容：</div><input class="input mt8" id="recTxt" placeholder="输入您说的俄语…"><button class="btn gold mt8" onclick="App._recText(\''+encodeURIComponent(target)+'\')">提交比对</button>';
    return;
  }
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  const r=new SR(); r.lang='ru-RU'; r.interimResults=false;
  out.innerHTML='<div class="note info">🎙 正在聆听，请说：<span class="cyr">'+esc(target)+'</span></div>';
  r.onresult=e=>{ const txt=e.results[0][0].transcript; App._showRec(target, txt); };
  r.onerror=()=>{ out.innerHTML='<div class="note warn">识别失败，请直接输入：</div><input class="input mt8" id="recTxt" placeholder="输入您说的俄语…"><button class="btn gold mt8" onclick="App._recText(\''+encodeURIComponent(target)+'\')">提交比对</button>'; };
  try{ r.start(); }catch(e){ out.innerHTML='<div class="note warn">无法启动麦克风。</div>'; }
}
function _recText(enc){ const target=decodeURIComponent(enc); const txt=$('#recTxt').value; App._showRec(target, txt); }
function _showRec(target, txt){
  const ok = norm(txt)===norm(target) || norm(txt).indexOf(norm(target))>=0;
  let fb = ok?'✅ 准确！':'⚠️ 需改进：您说「<span class="cyr">'+esc(txt)+'</span>」，目标「<span class="cyr">'+esc(target)+'</span>」';
  fb += '<div class="tiny muted">纠音：逐音比对，注意 ы（舌后缩非衣）、р（舌尖颤）、软辅音（舌面抬）。</div>';
  $('#recOut').innerHTML='<div class="case-item">'+fb+'</div>';
}
function m5scene(id){
  document.querySelectorAll('#scenePick .btn').forEach(b=>b.classList.toggle('gold', b.getAttribute('data-arg')===id));
  const sc=RU.scenarios.find(s=>s.id===id); if(!sc) return;
  let chat='';
  sc.script.forEach((l,i)=>{
    const me=l.role==='你';
    chat+='<div class="bubble '+(me?'me':'ai')+'"><span class="who">'+(me?'我':sc.title)+'</span><span class="cyr">'+esc(l.ru)+'</span> '+spkWord(l.ru.replace(/[一-龥]/g,'').replace(/[̀-ͯ]/g,''))+'</div>';
  });
  $('#sceneBox').innerHTML='<div class="card"><div class="note info">先示范标准对话，再尝试角色扮演：AI 说一句，您用下方选项或自行输入回应。</div>'
    +'<div class="chat">'+chat+'</div>'
    +'<div class="mt12"><b>🎭 现在轮到你（第2句）：</b><div class="row"><button class="btn soft" onclick="App._sceneReply(\''+encodeURIComponent(sc.script[2].ru)+'\')">'+esc(sc.script[2].ru)+'</button></div>'
    +'<div id="sceneFB" class="mt8"></div></div>'
    +'<div class="mt16"><b>📋 本情景掌握要点</b><div class="tiny">'+esc(sc.points)+'</div>'
    +'<b>常用句清单</b><div class="cyr">'+sc.key.map(k=>k+' '+spkWord(k.replace(/[一-龥]/g,'').replace(/[̀-ͯ]/g,''))).join('<br>')+'</div></div></div>';
}
function _sceneReply(expected){
  $('#sceneFB').innerHTML='<div class="note ok">✅ 很好！标准表达：<span class="cyr">'+esc(decodeURIComponent(expected))+'</span>。继续往下完成整段对话即可。</div>';
}
function m5topic(id){
  document.querySelectorAll('#topicPick .btn').forEach(b=>b.classList.toggle('gold', b.getAttribute('data-arg')===id));
  const t=RU.topics.find(x=>x.id===id); if(!t) return;
  $('#topicBox').innerHTML='<div class="card"><div class="note info">用下列句型脚手架，用俄语写几句话（可点击 🔊 听示范词）：</div>'
    +'<div class="cyr" style="line-height:2">'+t.scaffold.map(s=>s+' '+spkWord(s.replace(/[一-龥]/g,'').replace(/[̀-ͯ]/g,''))).join('<br>')+'</div>'
    +'<textarea class="input mt12" id="topicIn" rows="4" placeholder="在此用俄语写几句关于『"+esc(t.title)+"』的表达…"></textarea>'
    +'<div class="row mt8"><button class="btn gold" onclick="App._topicCheck(\''+encodeURIComponent(t.id)+'\')">提交并获取反馈</button></div>'
    +'<div id="topicFB" class="mt12"></div>'
    +'<div class="mt12"><b>📝 参考：典型纠错示例</b><div class="case-item">❌ '+esc(t.sampleWrong)+'<br>✅ '+esc(t.fix)+'</div></div></div>';
}
function _topicCheck(idEnc){
  const t=RU.topics.find(x=>x.id===decodeURIComponent(idEnc));
  const txt=$('#topicIn').value;
  if(!txt.trim()){ $('#topicFB').innerHTML='<div class="note warn">请先写几句俄语表达。</div>'; return; }
  // 简单规则级纠错
  const fixes=[["работае","рабо́тает"],["читай","чита́ю"],["говоре","говори́т"],["живе","живёт"],["понимае","понима́ет"],["де́лае","де́лает"]];
  let corrected=txt, found=[];
  fixes.forEach(([bad,good])=>{ if(norm(corrected).indexOf(norm(bad))>=0){ corrected=corrected.replace(new RegExp(bad,'g'),good); found.push(bad+'→'+good); } });
  let fb='<div class="case-item">✅ 已收到您的表达，字数 '+txt.trim().split(/\s+/).length+' 词。'
    + (found.length?(' 检测到可优化处：<b>'+found.join('，')+'</b>；建议对照修正版。'):' 未发现明显高频错误，继续保持！')
    + ' 个性化高频错误已纳入复习计划。</div>';
  if(found.length) fb+='<div class="case-item">✅ 修正版：'+esc(corrected)+'</div>';
  $('#topicFB').innerHTML=fb;
}

/* ===================================================================
   M6 听力训练
   =================================================================== */
function renderM6(){
  view().innerHTML = `
  <div class="card pad-lg">
    <div class="section-title"><h2>🎧 M6 日常听力训练</h2><span class="sub">分级材料 · 精听 · 泛听 · 错题归因</span></div>
    <div class="row">
      <button class="btn gold" data-act="m6sub" data-arg="grade">📻 分级材料</button>
      <button class="btn" data-act="m6sub" data-arg="dict">✍️ 精听训练</button>
      <button class="btn" data-act="m6sub" data-arg="ext">🌊 泛听磨耳朵</button>
      <button class="btn" data-act="m6sub" data-arg="err">📂 错题归因</button>
    </div>
    <div id="m6box" class="mt16"></div>
  </div>`;
  m6sub('grade');
}
function m6sub(which){
  let html='';
  if(which==='grade'){
    html='<h3 style="margin-top:0">📻 分级听力材料（A1慢速 / A2常速）</h3><div class="row" id="lnPick">'+RU.listening.map((l,i)=>'<button class="btn '+(i===0?'gold':'ghost')+'" data-act="m6ln" data-arg="'+i+'">'+esc(l.topic)+'（'+esc(l.level)+'）</button>').join('')+'</div><div id="lnBox" class="mt16"></div>';
    $('#m6box').innerHTML=html;
    m6ln(0); return;
  } else if(which==='dict'){
    html='<h3 style="margin-top:0">✍️ 精听训练（逐句听写 / 挖空填空）</h3><div class="row" id="lnPick2">'+RU.listening.map((l,i)=>'<button class="btn '+(i===0?'gold':'ghost')+'" data-act="m6dict" data-arg="'+i+'">'+esc(l.topic)+'</button>').join('')+'</div><div id="dictBox" class="mt16"></div>';
    $('#m6box').innerHTML=html;
    m6dict(0); return;
  } else if(which==='ext'){
    html='<h3 style="margin-top:0">🌊 泛听磨耳朵</h3><p class="muted tiny">不追求逐句听懂，抓关键词、感受节奏重音。每日 10–20 分钟碎片时间完成。</p>';
    RU.listening.forEach((l,i)=>{
      const rec=lsGet('ru_ext_'+l.id,null);
      const words=l.script.map(s=>s.ru.split(' ')[0]).slice(0,4).join('、');
      html+='<div class="card mt12" style="border-left:4px solid var(--navy)"><b>'+esc(l.topic)+'（'+esc(l.level)+'）</b> '+spkWord(l.script.map(s=>s.ru).join('. ').replace(/[̀-ͯ]/g,''))
        +'<div class="tiny mt8">听前提示词：'+esc(words)+'</div>'
        +'<div class="row mt8"><input class="input" id="ext'+i+'" value="'+(rec?esc(rec):'')+'" placeholder="记录：抓住的关键词 / 大意…"></div>'
        +'<button class="btn soft sm mt8" onclick="App._extSave(\''+l.id+'\','+i+')">保存记录卡</button></div>';
    });
  } else if(which==='err'){
    const ms=lsGet('ru_listen_err',[]);
    const types=["音变没听出","词汇不会","语速跟不上","重音干扰","语法没懂"];
    html='<h3 style="margin-top:0">📂 听力错题归因与复训</h3><div class="row"><select id="errType" class="input">'+types.map(t=>'<option>'+t+'</option>').join('')+'</select><input id="errDesc" class="input" placeholder="具体描述（如：окно́ 听成 акно́）"><button class="btn gold" onclick="App._errAdd()">记录错题</button></div>';
    if(ms.length){
      const dist={}; ms.forEach(m=>dist[m.type]=(dist[m.type]||0)+1); const tot=ms.length;
      html+='<div class="card mt12"><h4>错误类型分布</h4><table class="tbl"><tr><th>类型</th><th>数量</th><th>占比</th></tr>'
        +Object.entries(dist).map(([k,v])=>'<tr><td>'+esc(k)+'</td><td>'+v+'</td><td>'+Math.round(v/tot*100)+'%</td></tr>').join('')+'</table>'
        +'<div class="case-item">🔥 高频错误点：'+ms.slice(-3).reverse().map(m=>esc(m.type)+'（'+esc(m.desc)+'）').join('；')+'</div>'
        +'<div class="note warn">🗓️ 复训方案：第1周专项练元音弱化听辨；第2周变速听（0.8×→1.0×→1.2×）。明确复训周期与检验标准。</div></div>';
    } else {
      html+='<div class="note info mt12">暂无错题记录。在精听/分级练习中遇到听不懂处，可在此归因。</div>';
    }
  }
  $('#m6box').innerHTML=html;
}
function m6ln(i){
  document.querySelectorAll('#lnPick .btn').forEach(b=>b.classList.toggle('gold', +b.getAttribute('data-arg')===i));
  const l=RU.listening[i];
  let scr='<div class="chat">'+l.script.map(s=>'<div class="bubble ai"><span class="who">'+esc(s.sp)+'</span><span class="cyr">'+esc(s.ru)+'</span> '+spkWord(s.ru.replace(/[̀-ͯ]/g,''))+'</div>').join('')+'</div>';
  let qs='<ol>'+l.questions.map(q=>'<li>'+esc(q.q)+' <span class="tag ok sm">'+esc(q.a)+'</span></li>').join('')+'</ol>';
  $('#lnBox').innerHTML='<div class="card" style="border-left:4px solid var(--gold)"><div class="flex between"><b>'+esc(l.topic)+'</b><span class="tag">'+esc(l.speed)+'</span></div>'+scr+'<h4>听力题</h4>'+qs+'<div class="tiny muted">听力题与内容直接对应，不设陷阱（A1/A2 阶段）。</div></div>';
}
function m6dict(i){
  document.querySelectorAll('#lnPick2 .btn').forEach(b=>b.classList.toggle('gold', +b.getAttribute('data-arg')===i));
  const l=RU.listening[i];
  let html='<div class="card" style="border-left:4px solid var(--navy)"><div class="flex between"><b>'+esc(l.topic)+'</b><span class="tag">'+esc(l.speed)+'</span></div>';
  l.script.forEach((s,idx)=>{
    html+='<div class="case-item"><b>'+esc(s.sp)+'：</b><button class="speak" data-act="speak" data-t="'+encodeURIComponent(s.ru.replace(/[̀-ͯ]/g,''))+'">🔊 听</button> '
      +'<input class="input mt8" id="dic'+idx+'" placeholder="听写所听内容…"></div>';
  });
  html+='<button class="btn gold mt8" onclick="App._dictCheck('+i+')">对答案</button><div id="dictRes" class="mt8"></div>'
    +'<div class="note warn mt8">💡 音变提示：非重读 о 常弱化≈[а]（окно́ 听感像 акно́）；清浊同化（во́дка→во́тка）。重听强化直到全对。</div></div>';
  $('#dictBox').innerHTML=html;
}
function _dictCheck(i){
  const l=RU.listening[i]; let right=0;
  let html='<div class="scrolly">';
  l.script.forEach((s,idx)=>{
    const got=norm($('#dic'+idx).value); const exp=norm(s.ru);
    const ok=got===exp;
    if(ok) right++;
    html+='<div class="case-item '+(ok?'':'')+'">'+(ok?'✅':'❌')+' <span class="cyr">'+esc(s.ru)+'</span> — 您：'+(got?esc($('#dic'+idx).value):'<i>空</i>')+'</div>';
  });
  html+='</div><div class="note '+(right===l.script.length?'ok':'warn')+'">正确 '+right+'/'+l.script.length+'</div>';
  $('#dictRes').innerHTML=html;
}
function _extSave(id,i){ const v=$('#ext'+i).value; lsSet('ru_ext_'+id, v); toast('已保存泛听记录卡'); }
function _errAdd(){
  const type=$('#errType').value, desc=$('#errDesc').value.trim();
  if(!desc){ return; }
  const ms=lsGet('ru_listen_err',[]); ms.push({type,desc,date:dstr()}); lsSet('ru_listen_err', ms.slice(-80));
  m6sub('err');
}

/* ===================================================================
   M7 字母与键盘
   =================================================================== */
function renderM7(){
  view().innerHTML = `
  <div class="card pad-lg">
    <div class="section-title"><h2>⌨️ M7 字母表与键盘布局</h2><span class="sub">字母发音卡 · 键盘打字 · 手写体</span></div>
    <div class="row">
      <button class="btn gold" data-act="m7sub" data-arg="alpha">🔤 字母表学习</button>
      <button class="btn" data-act="m7sub" data-arg="kbd">⌨️ 键盘布局</button>
      <button class="btn" data-act="m7sub" data-arg="hand">✍️ 手写体</button>
    </div>
    <div id="m7box" class="mt16"></div>
  </div>`;
  m7sub('alpha');
}
function m7sub(which){
  let html='';
  if(which==='alpha'){
    html='<h3 style="margin-top:0">🔤 俄语字母表（33个）</h3><div class="row" style="align-items:center"><label class="tag" style="cursor:pointer"><input type="checkbox" id="alphaHard" onchange="App.m7Alpha()"> 只看难音（ы/р/ш/щ/ь/ъ/ж/ч）</label></div><div id="alphaGrid" class="letter-grid mt12"></div>';
    $('#m7box').innerHTML=html;
    App._alphaHard=false; m7Alpha();
    return;
  } else if(which==='kbd'){
    const rows=RU.keyboard.rows.map(r=>'<div class="krow">'+r.map(k=>'<span class="key" data-act="m7key" data-arg="'+encodeURIComponent(k)+'">'+esc(k)+'</span>').join('')+'</div>').join('');
    html='<h3 style="margin-top:0">⌨️ 俄语键盘布局（ЙЦУКЕН）</h3><div class="kb">'+rows+'</div>'
      +'<div class="note info mt12">💡 '+esc(RU.keyboard.stressTip)+'</div>'
      +'<h4>添加俄语输入法</h4><div class="grid c3"><div class="card"><b>Windows</b><div class="tiny">'+esc(RU.keyboard.addMethod.win)+'</div></div><div class="card"><b>macOS</b><div class="tiny">'+esc(RU.keyboard.addMethod.mac)+'</div></div><div class="card"><b>手机</b><div class="tiny">'+esc(RU.keyboard.addMethod.mobile)+'</div></div></div>'
      +'<h4 class="mt16">打字练习（由易到难）</h4>'+RU.keyboard.typing.map((t,i)=>'<div class="case-item"><b>练习'+(i+1)+'：</b> <span class="cyr">'+esc(t)+'</span> '+spkWord(t.replace(/[̀-ͯ]/g,''))+'<div class="row mt8"><input class="input" id="kbd'+i+'" placeholder="在此输入…"><button class="btn soft sm" onclick="App._kbdCheck('+i+')">检查</button></div><div id="kbdres'+i+'"></div></div>').join('');
  } else if(which==='hand'){
    const diff=RU.handwriting.diff.map(d=>'<div class="card" style="border-left:4px solid var(--rust)"><b class="cyr">'+esc(d.lt)+'</b><div class="tiny">'+esc(d.note)+'</div></div>').join('');
    const conf=RU.handwriting.confusable.map(g=>'<div class="case-item"><b>易混对：</b> '+g.map(x=>'<span class="cyr">'+esc(x)+'</span>').join(' &nbsp;/&nbsp; ')+'</div>').join('');
    html='<h3 style="margin-top:0">✍️ 俄语手写体要点</h3><div class="note warn">⚠️ 手写与印刷差异大的字母（须逐个说明）：</div><div class="grid c4">'+diff+'</div>'
      +'<div class="note info mt12">🔗 '+esc(RU.handwriting.link)+'</div>'
      +'<h4>易混字母对</h4>'+conf
      +'<div class="note">📝 '+esc(RU.handwriting.order)+'</div>';
  }
  $('#m7box').innerHTML=html;
}
function m7Alpha(){
  const hard=App._alphaHard;
  const list=RU.alphabet.filter(l=>!hard||l.hard);
  let html='';
  list.forEach(l=>{
    html+='<div class="letter-card '+(l.hard?'hard':'')+'"><div class="big cyr">'+esc(l.l)+'</div>'
      +'<div class="name">字母名：'+esc(l.name)+' '+spkWord(l.name)+'</div>'
      +'<div class="ipa">读音 '+esc(l.ipa)+' '+spkWord(l.ex.split(' ')[0].replace(/[̀-ͯ]/g,''))+'</div>'
      +'<div class="ex cyr">'+esc(l.ex)+' '+spkWord(l.ex.split(' ')[0].replace(/[̀-ͯ]/g,''))+'</div>'
      +'<div class="name">英文形近：'+esc(l.look)+'</div>'
      +(l.hard?'<div class="flag">⚠ 难音</div>':'')
      +'<div class="name">手写：'+esc(l.hand)+'</div></div>';
  });
  $('#alphaGrid').innerHTML=html;
}
function m7key(enc){ const k=decodeURIComponent(enc); speak(k.replace(/[̀-ͯ]/g,''),'ru-RU'); document.querySelectorAll('.kb .key').forEach(e=>e.classList.toggle('act', e.getAttribute('data-arg')===enc)); }
function _kbdCheck(i){
  const exp=norm(RU.keyboard.typing[i]); const got=norm($('#kbd'+i).value);
  $('#kbdres'+i).innerHTML = (got===exp)?'<span class="tag ok sm">✅ 正确</span>':(got?'<span class="tag danger sm">❌ 应为 '+esc(RU.keyboard.typing[i])+'</span>':'');
}

/* ===================================================================
   S 专项子场景
   =================================================================== */
function renderS(){
  view().innerHTML = `
  <div class="card pad-lg">
    <div class="section-title"><h2>⭐ S1–S3 专项子场景</h2><span class="sub">发音专项 · 差异化计划 · 语音考点</span></div>
    <div class="row">
      <button class="btn gold" data-act="ssub" data-arg="s1">🎤 S1 发音专项（颤音/软辅音）</button>
      <button class="btn" data-act="ssub" data-arg="s2">📅 S2 差异化计划</button>
      <button class="btn" data-act="ssub" data-arg="s3">🎧 S3 语音考点</button>
    </div>
    <div id="sbox" class="mt16"></div>
  </div>`;
  ssub('s1');
}
function ssub(which){
  let html='';
  if(which==='s1'){
    html='<h3 style="margin-top:0">🎤 S1 发音专项</h3>'
      +'<div class="card" style="border-left:4px solid var(--rust)"><h4>🌊 颤音 р 专项突破</h4><div class="note info">'+esc(RU.trill.plan)+'</div><ol style="padding-left:20px">'+RU.trill.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol>'
      +'<div class="case-item">'+RU.trill.errors.join('<br>')+'</div>'
      +'<div class="cyr mt8">跟读：рабо́та '+spkWord('рабо́та')+' ｜ Росси́я '+spkWord('Россия')+' ｜ ру́сский '+spkWord('ру́сский')+'</div></div>'
      +'<div class="card mt12" style="border-left:4px solid var(--gold)"><h4>软辅音（腭化）专项</h4><p class="tiny">'+esc(RU.soft.rule)+'</p>'
      +'<div>最小对立对：'+RU.soft.pairs.map(p=>'<span class="cyr">'+esc(p[0])+ '</span> vs <span class="cyr">'+esc(p[1])+'</span> '+spkWord(p[1].replace(/[̀-ͯ]/g,''))).join(' ｜ ')+'</div>'
      +'<div class="case-item">⚠️ '+esc(RU.soft.err)+'</div></div>';
  } else if(which==='s2'){
    html='<h3 style="margin-top:0">📅 S2 差异化学习计划</h3>'
      +'<div class="card" style="border-left:4px solid var(--navy)"><h4>日常交流导向（12周）</h4><div class="tiny">语法够用即可：名词一二四六格 + 动词现在时 + 基础前置词；每天必有口语输出，场景化学习。</div>'
      +'<ul style="margin:8px 0;padding-left:20px"><li>阶段1（1–4周）：字母+发音+基础问候</li><li>阶段2（5–8周）：高频句型（购物/问路/点餐）+ 名词四格速成</li><li>阶段3（9–12周）：情景对话强化 + 数字时间 + 自我介绍</li></ul>'
      +'<div class="note info">每日：发音10 + 句型20 + 情景对话20 分钟。</div></div>'
      +'<div class="card mt12" style="border-left:4px solid var(--gold)"><h4>ТРКИ 应试导向（16周）</h4><div class="tiny">语法词汇30% / 听力20% / 阅读15% / 写作15% / 口语20%。严格按五模块分值分配，真题题型贯穿。</div>'
      +'<ul style="margin:8px 0;padding-left:20px"><li>阶段1（1–6周）：语法系统（六格+体+变位）</li><li>阶段2（7–12周）：分模块专项 + 真题</li><li>阶段3（13–16周）：限时模拟 + 查漏</li></ul></div>';
  } else if(which==='s3'){
    html='<h3 style="margin-top:0">🎧 S3 语音考点专项提取</h3><table class="tbl"><tr><th>考点编号</th><th>语音现象</th><th>规则</th><th>例词</th><th>难点</th></tr>'
      +RU.phonPoints.map(p=>'<tr><td>'+esc(p.id)+'</td><td>'+esc(p.ph)+'</td><td>'+esc(p.rule)+'</td><td class="cyr">'+esc(p.ex)+' '+spkWord(p.ex.replace(/[̀-ͯ]/g,''))+'</td><td>'+esc(p.diff)+'</td></tr>').join('')
      +'</table><div class="note warn mt12">按语音现象分类（不混词法句法）；每考点配例词+难点等级，并关联到听力/口语模块。</div>';
  }
  $('#sbox').innerHTML=html;
}

/* ===================================================================
   教材书目 / M8 单词学习 / M9 句子学习 / 每日一练 / 自测测评
   =================================================================== */
function bankWords(sid){ const sc=RU.scenes.find(s=>s.id===sid); const b=RU.wordbank && RU.wordbank[sid]; return b ? b.map(a=>({ru:a[0],pos:a[1],zh:a[2],lv:a[3],scene:sc.title,sid})) : sc.words.map(w=>({...w,scene:sc.title,sid})); }
function bankSent(sid){ const sc=RU.scenes.find(s=>s.id===sid); const b=RU.sentbank && RU.sentbank[sid]; return b ? b.map(a=>({ru:a[0],zh:a[1],scene:sc.title,sid})) : sc.sentences.map(x=>({...x,scene:sc.title,sid})); }
function allSceneWords(){ return RU.scenes.flatMap(s=>bankWords(s.id)); }
function allSceneSent(){ return RU.scenes.flatMap(s=>bankSent(s.id)); }

/* ---------- 教材书目 ---------- */
function renderBooks(){
  const b=RU.books;
  let series='';
  b.series.forEach(se=>{
    series+='<div class="card mt16"><div class="flex between"><b>'+esc(se.name)+'</b><span class="tag sm">'+esc(se.lang)+'</span></div>'
      +'<div class="tiny muted">'+esc(se.publisher)+'</div>'
      +'<table class="tbl mt8"><tr><th>册次</th><th>阶段</th><th>核心内容</th><th>对应模块</th></tr>'
      +se.vols.map(v=>'<tr><td>'+esc(v.v)+'</td><td>'+esc(v.stage)+'</td><td>'+esc(v.focus)+'</td><td>'+v.map.map(m=>'<span class="tag gold sm">'+esc(m)+'</span>').join(' ')+'</td></tr>').join('')
      +'</table></div>';
  });
  let sup='<div class="grid c2 mt12">'+b.supplementary.map(s=>'<div class="card" style="border-left:4px solid var(--navy)"><b>'+esc(s.name)+'</b><div class="tiny">'+esc(s.use)+'</div><div class="mt4">'+s.map.map(m=>'<span class="tag info sm">'+esc(m)+'</span>').join(' ')+'</div></div>').join('')+'</div>';
  view().innerHTML = `
  <div class="card pad-lg">
    <div class="section-title"><h2>📖 教材书目</h2><span class="sub">系统罗列全部学习书目 · 内容已扩充映射</span></div>
    <div class="note info">💡 ${esc(b.note)}</div>
    <h3 class="mt16">📚 主系列教材</h3>
    ${series}
    <h3 class="mt16">🧩 配套与进阶书目</h3>
    ${sup}
    <div class="note warn mt16">⚠️ 教材版本术语差异（如「第六格」vs предло́жный паде́ж）已在本系统统一处理；内容与重音以你所用教材为准。</div>
  </div>`;
}

/* ---------- M8 单词学习 ---------- */
function renderM8(){
  view().innerHTML = `
  <div class="card pad-lg">
    <div class="section-title"><h2>🔤 M8 单词学习</h2><span class="sub">12 情景板块 · 主题词汇（标重音 + 朗读 + 已学标记）</span></div>
    <div class="row wrap" id="m8tabs">${RU.scenes.map((s,i)=>'<button class="btn '+(i===0?'gold':'ghost')+'" data-act="m8tab" data-arg="'+s.id+'">'+esc(s.title)+'</button>').join('')}</div>
    <div id="m8box" class="mt16"></div>
    <div id="m8stats" class="mt16"></div>
  </div>`;
  m8Tab('greet');
}
function m8Tab(id){
  document.querySelectorAll('#m8tabs .btn').forEach(b=>b.classList.toggle('gold', b.getAttribute('data-arg')===id));
  App._m8cur=id;
  const sc=RU.scenes.find(s=>s.id===id); if(!sc) return;
  const words=bankWords(id);
  const learned=lsGet('ru_m8_learned',{});
  let html='<div class="card" style="border-left:4px solid var(--gold)"><div class="flex between"><b>'+esc(sc.title)+'</b><span class="tag sm">'+esc(sc.book)+'</span></div>'
    +'<div class="tiny muted">'+words.length+' 个主题词汇 ｜ 点击 🔊 听标准发音</div>'
    +'<table class="tbl mt8"><tr><th class="cyr">俄语（重音）</th><th>词性</th><th>中文</th><th>级</th><th>学</th></tr>';
  words.forEach((w,i)=>{
    const key='w_'+sc.id+'_'+i; const done=!!learned[key];
    html+='<tr class="'+(done?'done-row':'')+'"><td class="cyr">'+esc(w.ru)+' '+spkWord(w.ru)+'</td><td>'+esc(w.pos)+'</td><td>'+esc(w.zh)+'</td><td>'+esc(w.lv)+'</td>'
      +'<td><input type="checkbox" '+(done?'checked':'')+' onchange="App.m8Toggle(\''+key+'\')"></td></tr>';
  });
  html+='</table></div>';
  $('#m8box').innerHTML=html;
  const total=allSceneWords().length;
  const done=Object.values(learned).filter(Boolean).length;
  const pct=Math.round(done/total*100);
  $('#m8stats').innerHTML='<div class="grid c3"><div class="stat"><div class="n">'+done+'</div><div class="l">已学单词</div></div><div class="stat"><div class="n">'+total+'</div><div class="l">总词量</div></div><div class="stat"><div class="n">'+pct+'%</div><div class="l">掌握度</div></div></div><div class="bar mt12"><i style="width:'+pct+'%"></i></div>';
}
function m8Toggle(key){ const s=lsGet('ru_m8_learned',{}); s[key]=!s[key]; lsSet('ru_m8_learned',s); m8Tab(App._m8cur||'greet'); }

/* ---------- M9 句子学习 ---------- */
function renderM9(){
  view().innerHTML = `
  <div class="card pad-lg">
    <div class="section-title"><h2>💬 M9 句子学习</h2><span class="sub">12 情景板块 · 日常句型（整句朗读 + 跟读 + 已学标记）</span></div>
    <div class="row wrap" id="m9tabs">${RU.scenes.map((s,i)=>'<button class="btn '+(i===0?'gold':'ghost')+'" data-act="m9tab" data-arg="'+s.id+'">'+esc(s.title)+'</button>').join('')}</div>
    <div id="m9box" class="mt16"></div>
  </div>`;
  m9Tab('greet');
}
function m9Tab(id){
  document.querySelectorAll('#m9tabs .btn').forEach(b=>b.classList.toggle('gold', b.getAttribute('data-arg')===id));
  App._m9cur=id;
  const sc=RU.scenes.find(s=>s.id===id); if(!sc) return;
  const sents=bankSent(id);
  const learned=lsGet('ru_m9_learned',{});
  let html='<div class="card" style="border-left:4px solid var(--navy)"><div class="flex between"><b>'+esc(sc.title)+'</b><span class="tag sm">'+esc(sc.book)+'</span></div><div class="tiny muted">'+sents.length+' 个情景句型 ｜ 点击 🔊 听整句</div>';
  sents.forEach((x,i)=>{
    const key='s_'+sc.id+'_'+i; const done=!!learned[key];
    html+='<div class="case-item '+(done?'done-row':'')+'"><div class="flex between"><span class="cyr" style="font-size:17px">'+esc(x.ru)+' '+spkWord(x.ru)+'</span><input type="checkbox" '+(done?'checked':'')+' onchange="App.m9Toggle(\''+key+'\')"></div><div class="tiny muted">'+esc(x.zh)+'</div></div>';
  });
  html+='</div>';
  $('#m9box').innerHTML=html;
}
function m9Toggle(key){ const s=lsGet('ru_m9_learned',{}); s[key]=!s[key]; lsSet('ru_m9_learned',s); m9Tab(App._m9cur||'greet'); }

/* ---------- M10 文章阅读（听 · 翻译 · 习题） ---------- */
let m10cur=null, m10Timer=null;
function renderM10(){
  const lvs=['全部','A1','A2','B1'];
  view().innerHTML = `
  <div class="card pad-lg">
    <div class="section-title"><h2>📖 M10 文章阅读</h2><span class="sub">${RU.articles.length} 篇分级文章 · 全文朗读 + 中文译文 + 听力理解题 + 翻译练习</span></div>
    <div class="row" id="m10pick">${lvs.map((l,i)=>'<button class="btn '+(i===0?'gold':'ghost')+'" data-act="m10list" data-arg="'+l+'">'+l+'</button>').join('')}</div>
    <div id="m10list" class="mt16"></div>
    <div id="m10body" class="mt16"></div>
  </div>`;
  m10list('全部');
}
function m10list(lv){
  App._m10lv=lv;
  const arr = lv==='全部' ? RU.articles : RU.articles.filter(a=>a.lv===lv);
  document.querySelectorAll('#m10pick .btn').forEach(b=>b.classList.toggle('gold', b.getAttribute('data-arg')===lv));
  $('#m10list').innerHTML = '<div class="tiny muted">'+esc(lv)+' 共 '+arr.length+' 篇（🟢 A1 · 🟡 A2 · 🔴 B1）</div><div class="row wrap mt8">'
    + arr.map(a=>'<button class="btn soft sm" data-act="m10open" data-arg="'+a.id+'">'+(a.lv==='A1'?'🟢':a.lv==='A2'?'🟡':'🔴')+' '+esc(a.t)+'</button>').join('')
    +'</div>';
}
function m10open(id){
  const a=RU.articles.find(x=>String(x.id!==undefined?x.id:x.a)===String(id)); if(!a) return;
  m10cur=a; App._m10tr=false;
  const clean=t=>t.replace(/[̀-ͯ]/g,'');
  const qs=a.qs.map((q,i)=>'<div class="case-item"><b>👂 '+esc(q[0])+'</b><br><button class="btn ghost sm" onclick="App.m10Ans('+a.id+','+i+')">查看答案</button> <span class="tag ok sm" id="qa'+a.id+'_'+i+'" style="display:none">'+esc(q[1])+'</span></div>').join('');
  const ex=a.ex.map((e,i)=>'<div class="case-item"><b>✍️ '+esc(e[0])+'</b><br><button class="btn ghost sm" onclick="App.m10Ans2('+a.id+','+i+')">查看答案</button> <span class="tag ok sm" id="exa'+a.id+'_'+i+'" style="display:none">'+esc(e[1])+'</span></div>').join('');
  $('#m10body').innerHTML =
    '<div class="card pad-lg" style="border-left:4px solid var(--gold)">'
    +'<div class="flex between"><h3 style="margin:0">'+esc(a.t)+'</h3><span class="tag">'+esc(a.lv)+' · '+esc(a.bk)+'</span></div>'
    +'<div class="tiny muted mt4">主题：'+esc(a.th)+' ｜ '+esc(a.zh)+'</div>'
    +'<div class="row mt8" style="align-items:center"><button class="speak" data-act="speak" data-t="'+encodeURIComponent(clean(a.txt))+'">🔊 听全文</button> '
    +'<button class="btn soft sm" onclick="App.m10Play('+a.id+')">⏯ 逐句播放</button> '
    +'<button class="btn ghost sm" onclick="App.m10Tr()">🌐 译文</button></div>'
    +'<div class="case-item mt12 cyr" style="line-height:1.9;font-size:16px">'+esc(a.txt)+'</div>'
    +'<div id="m10tr" class="mt8"></div>'
    +'<h4 class="mt16">🧩 听力理解题（边听边答，点击查看答案）</h4>'+qs
    +'<h4 class="mt16">✍️ 翻译练习（先自译，再对照）</h4>'+ex
    +'<div class="note info mt12">💡 方法：先不看译文听 2–3 遍 → 跟读 → 自译 → 对照答案 → 把生词加入 M8 单词学习。</div>'
    +'</div>';
}
function m10Play(id){
  clearInterval(m10Timer);
  const a=RU.articles.find(x=>String(x.id!==undefined?x.id:x.a)===String(id)); if(!a) return;
  const ss=a.txt.split(/(?<=[.!?…])\s+/).filter(Boolean);
  let i=0;
  m10Timer=setInterval(()=>{
    if(i>=ss.length){ clearInterval(m10Timer); return; }
    speak(ss[i].replace(/[̀-ͯ]/g,''));
    i++;
  }, 3200);
}
function m10Tr(){
  const a=m10cur; if(!a) return;
  App._m10tr=!App._m10tr;
  $('#m10tr').innerHTML = App._m10tr ? '<div class="note info">'+esc(a.tr)+'</div>' : '';
}
function m10Ans(id,i){ const el=document.getElementById('qa'+id+'_'+i); if(el){ el.style.display='inline-block'; } }
function m10Ans2(id,i){ const el=document.getElementById('exa'+id+'_'+i); if(el){ el.style.display='inline-block'; } }

/* ---------- 每日一练 ---------- */
function dailyHash(s){ let h=0; for(let i=0;i<s.length;i++){ h=(h*131+s.charCodeAt(i))>>>0; } return h; }
function renderDaily(off){
  const W=allSceneWords(), S=allSceneSent();
  const dt=dstr();
  const seed=dailyHash(dt)+(off||0);
  const count=8+(seed%3);                 // 8–10 个生词
  const start=((seed%W.length)+W.length)%W.length;
  const words=[]; for(let i=0;i<count;i++){ words.push(W[(start+i)%W.length]); }
  const sstart=((seed*7+3)%S.length+S.length)%S.length;
  const sents=[]; for(let i=0;i<3;i++){ sents.push(S[(sstart+i)%S.length]); }
  const doneArr=lsGet('ru_daily_done',[]);
  const isDone=doneArr.includes(dt);
  App._dailyWords=words; App._dailySents=sents;
  const previewNote = (off&&off!==0)?'<div class="note warn">↻ 这是预览组（非今日正式组）。今日正式组请点「标记今日完成」对应的内容。</div>':'';
  view().innerHTML = `
  <div class="card pad-lg">
    <div class="section-title"><h2>📅 每日一练</h2><span class="sub">${dt} ｜ 今日 ${count} 个生词 + 3 个句子</span></div>
    <div class="note info">每天自动推送一组新内容（按日期确定性生成，当天稳定）。完成学习后点击「标记今日完成」，连续天数会自动累计。</div>
    ${previewNote}
    <div class="row mt12">
      <button class="btn gold" onclick="App._dailySpeakAll()">🔊 全部朗读</button>
      <button class="btn ghost" onclick="App._dailyRegen()">↻ 换一组（预览）</button>
      <button class="btn ${(isDone?'soft':'gold')}" onclick="App._dailyDone()">${isDone?'✅ 今日已完成':'✓ 标记今日完成'}</button>
    </div>
    <div id="dailyStreak" class="mt12"></div>
  </div>
  <div class="card pad-lg mt16">
    <h3 style="margin-top:0">🔤 今日生词（${count}）</h3>
    <div class="letter-grid" id="dailyWords"></div>
  </div>
  <div class="card pad-lg mt16">
    <h3 style="margin-top:0">💬 今日句型（3）</h3>
    <div id="dailySents"></div>
  </div>`;
  $('#dailyWords').innerHTML = words.map(w=>'<div class="letter-card"><div class="big cyr">'+esc(w.ru)+'</div><div class="name">'+esc(w.pos)+' · '+esc(w.lv)+'</div><div class="ex">'+esc(w.zh)+'</div><div class="row" style="margin-top:6px"><button class="speak" data-act="speak" data-t="'+encodeURIComponent(w.ru)+'">🔊</button></div></div>').join('');
  $('#dailySents').innerHTML = sents.map(x=>'<div class="case-item"><span class="cyr" style="font-size:17px">'+esc(x.ru)+' '+spkWord(x.ru)+'</span><div class="tiny muted">'+esc(x.zh)+'</div></div>').join('');
  renderDailyStreak(doneArr, isDone);
}
function renderDailyStreak(doneArr, isDone){
  const streak=calcStreak(doneArr);
  const milestones=[[7,"一周坚持"],[21,"21天习惯"],[30,"月度达人"],[60,"两月通关"],[100,"百日俄语人"]];
  const nextM=milestones.find(m=>streak<m[0])||[100,"已封神"];
  const left=Math.max(0,nextM[0]-streak);
  $('#dailyStreak').innerHTML='<div class="note ok">🔥 连续完成 <b>'+streak+'</b> 天 ｜ 再坚持 <b>'+left+'</b> 天达成「'+nextM[1]+'」'+(isDone?' ｜ 今天已打卡 ✅':'')+'</div>';
}
function _dailyDone(){
  const dt=dstr(); const a=lsGet('ru_daily_done',[]);
  if(!a.includes(dt)){ a.push(dt); lsSet('ru_daily_done',a); toast('✅ 今日一练完成！'); }
  else toast('今天已经完成了~');
  renderDaily();
}
function _dailySpeakAll(){
  const items = App._dailyWords.map(w=>w.ru).concat(App._dailySents.map(s=>s.ru));
  items.forEach((t,i)=> setTimeout(()=>speak(t.replace(/[̀-ͯ]/g,'')), i*1500));
}
function _dailyRegen(){ App._dailyOff=(App._dailyOff||0)+1; renderDaily(App._dailyOff); }

/* ---------- 自测测评（听/说/读/写 四维） ---------- */
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function sampleOthers(pool, item, key, n){ return shuffle(pool.filter(x=>x[key]!==item[key])).slice(0,n).map(x=>x[key]); }
function buildTest(){
  const W=allSceneWords(), S=allSceneSent();
  const q=[];
  for(let i=0;i<4;i++){ const w=pick(W); q.push({dim:'听',type:'choice',prompt:w.ru,audio:w.ru,answer:w.zh,options:shuffle([w.zh].concat(sampleOthers(W,w,'zh',3)))}); }
  for(let i=0;i<4;i++){ const w=pick(W); q.push({dim:'读',type:'choice',prompt:w.ru,answer:w.zh,options:shuffle([w.zh].concat(sampleOthers(W,w,'zh',3)))}); }
  for(let i=0;i<4;i++){ const s=pick(S); q.push({dim:'说',type:'input',prompt:s.zh,accept:s.ru}); }
  for(let i=0;i<4;i++){ const w=pick(W); q.push({dim:'写',type:'input',prompt:w.zh,accept:w.ru}); }
  return q;
}
function dimLabel(d){ return {听:'👂 听（听力理解）',读:'👀 读（词汇识别）',说:'🗣 说（口语产出）',写:'✍️ 写（拼写产出）'}[d]; }
function renderSelfTest(){
  view().innerHTML = `
  <div class="card pad-lg" id="stWrap">
    <div class="section-title"><h2>🏆 自测测评</h2><span class="sub">听 / 说 / 读 / 写 四维综合 · 自动评分 + 优化建议</span></div>
    <div id="stBody">
      <p class="muted">本测评从四个维度检验你的俄语水平：</p>
      <div class="grid c4">
        <div class="card" style="border-left:4px solid var(--navy)"><b>👂 听</b><div class="tiny">听单词发音，选择正确中文释义</div></div>
        <div class="card" style="border-left:4px solid var(--gold)"><b>👀 读</b><div class="tiny">看俄文单词，选择正确中文释义</div></div>
        <div class="card" style="border-left:4px solid var(--rust)"><b>🗣 说</b><div class="tiny">看中文句意，说出/写出俄文句子</div></div>
        <div class="card" style="border-left:4px solid var(--green)"><b>✍️ 写</b><div class="tiny">看中文词义，写出俄文单词</div></div>
      </div>
      <div class="note info mt12">共 16 题（每维 4 题），约 8–10 分钟。提交后自动打分并给出针对性学习建议。</div>
      <button class="btn gold block mt12" onclick="App._startTest()">▶ 开始测评</button>
    </div>
  </div>`;
}
function _startTest(){
  App._test = buildTest();
  const dims=['听','读','说','写'];
  let html='<div class="card pad-lg"><div class="flex between"><b>自测进行中…</b><button class="btn gold" onclick="App._scoreTest()">提交并评分</button></div>';
  dims.forEach(dim=>{
    const qs=App._test.filter(q=>q.dim===dim);
    html+='<h4 class="mt16">'+dimLabel(dim)+'</h4><div class="scrolly">';
    qs.forEach(q=>{
      const idx=App._test.indexOf(q);
      html+='<div class="case-item"><b>'+dim+'：</b> ';
      if(q.dim==='听'){ html+='<button class="speak" data-act="speak" data-t="'+encodeURIComponent(q.audio)+'">🔊 听</button> '; }
      html+='<span class="cyr">'+esc(q.prompt)+'</span>';
      if(q.type==='choice'){
        html+='<div class="row mt8"><select class="input" id="t'+idx+'"><option value="">— 请选择 —</option>'+q.options.map(o=>'<option value="'+esc(o)+'">'+esc(o)+'</option>').join('')+'</select></div>';
      } else {
        html+='<div class="row mt8"><input class="input" id="t'+idx+'" placeholder="输入俄文…"></div>';
      }
      html+='</div>';
    });
    html+='</div>';
  });
  html+='<button class="btn gold block mt16" onclick="App._scoreTest()">提交并评分</button></div>';
  $('#stBody').innerHTML=html;
}
function _scoreTest(){
  const q=App._test; const score={听:0,读:0,说:0,写:0};
  q.forEach((item,idx)=>{
    let ok=false;
    if(item.type==='choice'){ ok=($('#t'+idx).value===item.answer); }
    else { const g=norm($('#t'+idx).value), a=norm(item.accept); ok=(g===a||g.indexOf(a)>=0||a.indexOf(g)>=0); }
    if(ok) score[item.dim]++;
  });
  const total=q.length; const totalRight=Object.values(score).reduce((a,b)=>a+b,0);
  const pct=Math.round(totalRight/total*100);
  const adv={
    听:'多做 M6 分级听力与精听，注意元音弱化（о→[а]）与清浊同化；每日泛听磨耳朵 10–20 分钟。',
    读:'用 M8 单词学习 + M9 句子学习巩固词汇识别，放慢拼读并结合 TTS 跟读。',
    说:'用 M5 发音入门与跟读纠音，重点突破 ы、р 颤音、软辅音；多用语音输入跟读。',
    写:'用 M4 背诵打卡默写变格表 + M7 手写体；重音是硬指标，写作务必标注重音。'
  };
  let html='<div class="card pad-lg"><h3 style="margin-top:0">🏆 测评报告</h3>';
  html+='<div class="grid c4">';
  ['听','读','说','写'].forEach(d=>{ const n=score[d]; const p=Math.round(n/4*100); html+='<div class="stat"><div class="n">'+n+'/4</div><div class="l">'+dimLabel(d).split(' ')[0]+' '+p+'%</div></div>'; });
  html+='</div><div class="bar mt12"><i style="width:'+pct+'%"></i></div>';
  html+='<div class="note '+(pct>=75?'ok':'warn')+' mt12">总分 <b>'+totalRight+'/'+total+'（'+pct+'%）</b> — '+(pct>=85?'优秀，保持节奏！':pct>=60?'良好，个别维度需加强。':'基础需巩固，建议从每日一练与 M8/M9 起步。')+'</div>';
  html+='<h4 class="mt16">🎯 针对性学习优化建议</h4>';
  let anyWeak=false;
  ['听','读','说','写'].forEach(d=>{ const n=score[d]; if(n<3){ anyWeak=true; html+='<div class="case-item">⚠️ <b>'+dimLabel(d)+'</b> 偏弱（'+n+'/4）：'+adv[d]+'</div>'; } });
  if(!anyWeak) html+='<div class="note ok">四个维度均达标，继续保持！可挑战更高阶教材与 ТРКИ 模拟。</div>';
  html+='<div class="mt12"><button class="btn gold" onclick="App._startTest()">再来一次</button> <button class="btn ghost" onclick="App.renderSelfTest()">返回说明</button></div></div>';
  $('#stBody').innerHTML=html;
}

/* ----------------------- 初始化 ----------------------- */
function toast(msg){
  let t=document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='toast'; t.style.cssText='position:fixed;left:50%;bottom:30px;transform:translateX(-50%);background:var(--navy);color:#fff;padding:10px 18px;border-radius:24px;z-index:200;box-shadow:var(--sh-lg);font-size:14px;opacity:0;transition:opacity .25s'; document.body.appendChild(t); }
  t.textContent=msg; t.style.opacity='1';
  clearTimeout(t._t); t._t=setTimeout(()=>{ t.style.opacity='0'; }, 1800);
}
function calcStreak(dates){
  dates = (dates||[]).slice().sort();
  function has(y,m,d){ const p=n=>String(n).padStart(2,'0'); return dates.includes(y+'-'+p(m)+'-'+p(d)); }
  let d=new Date(); d.setHours(0,0,0,0);
  if(!has(d.getFullYear(),d.getMonth()+1,d.getDate())){ d.setDate(d.getDate()-1); }
  let streak=0;
  while(has(d.getFullYear(),d.getMonth()+1,d.getDate())){ streak++; d.setDate(d.getDate()-1); }
  return streak;
}

/* 全局点击委托 */
document.addEventListener('click', e=>{
  const t=e.target.closest('[data-act]'); if(!t) return;
  const act=t.getAttribute('data-act'); const arg=t.getAttribute('data-arg');
  if(act==='speak'){ speak(decodeURIComponent(t.getAttribute('data-t'))); return; }
  if(act==='go'){ go(arg); return; }
  // 兼容 data-act 全小写 vs App 方法驼峰命名（如 m8tab→m8Tab、m4flash→m4Flash）
  const names=[act];
  if(act){ names.push(act.replace(/([0-9])([a-z])/g,(m,p,c)=>p+c.toUpperCase()), act.charAt(0).toUpperCase()+act.slice(1)); }
  let fn; for(const n of names){ if(App && typeof App[n]==='function'){ fn=App[n]; break; } }
  if(typeof fn==='function'){ fn(arg, t); }
});
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeModal(); });
document.getElementById('menuBtn') && document.getElementById('menuBtn').addEventListener('click', openSidebar);

/* 暴露 API */
window.App = {
  go, closeModal, closeSidebar, speak,
  m1Search, m1Apply, m1detail, m1Import, m1ShowUserVocab,
  m2Gen, m2Save, m2Progress, m2Sprint,
  m4Tab, toggleCheck, m4Flash, m4Checkin,
  m5sub, m5follow, m5scene, m5topic, _rec, _recText, _sceneReply, _topicCheck,
  m6sub, m6ln, m6dict, _dictCheck, _extSave, _errAdd,
  m7sub, m7Alpha, m7key, _kbdCheck,
  ssub,
  // 新模块
  renderBooks, renderM8, renderM9, m8Tab, m8Toggle, m9Tab, m9Toggle,
  renderM10, m10list, m10open, m10Play, m10Tr, m10Ans, m10Ans2,
  renderDaily, _dailyDone, _dailySpeakAll, _dailyRegen,
  renderSelfTest, _startTest, _scoreTest,
  // 内部函数（供内联 onXXX 调用）
  _fcShow:()=>{}, _fcCheck:()=>{}, _fcNext:()=>{}, _decCheck:()=>{},
  _showRec, _rec, _recText
};

/* 启动 */
buildNav();
go('overview');

})();
