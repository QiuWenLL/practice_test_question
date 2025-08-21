<template>
  <div class="card" style="max-width:860px; margin:0 auto;">
    <h2 style="margin-top:0;font-size:18px;">刷题</h2>
    <div class="grid" style="gap:12px; grid-template-columns:repeat(auto-fit,minmax(150px,1fr));">
      <div>
        <label>年级</label>
        <select v-model="filters.grade">
          <option value="">全部</option>
          <option v-for="g in meta.grades" :key="g" :value="g">{{g}}</option>
        </select>
      </div>
      <div>
        <label>科目</label>
        <select v-model="filters.subject">
          <option value="">全部</option>
          <option v-for="s in meta.subjects" :key="s" :value="s">{{s}}</option>
        </select>
      </div>
      <div>
        <label>试卷(必选)</label>
        <select v-model="filters.paper">
          <option value="">请选择</option>
          <option v-for="p in meta.papers" :key="p" :value="p">{{p}}</option>
        </select>
      </div>
      <div class="flex" style="align-items:flex-end;">
        <button class="primary" :disabled="!filters.paper" @click="start">开始随机</button>
      </div>
    </div>
    <div v-if="current" style="margin-top:20px;">
      <div class="badge">{{ labelType(current.type) }}</div>
      <div style="font-weight:600; margin:8px 0; white-space:pre-wrap;">{{ current.stem }}</div>
      <div v-if="current.type==='choice'" style="margin-top:12px;">
        <div v-for="(opt,i) in current.options" :key="i" class="flex" style="margin-bottom:6px;">
          <label style="cursor:pointer;">
            <input type="radio" name="choice" :value="letter(i)" v-model="answerInput" />
            <strong style="width:28px; display:inline-block;">{{ letter(i) }}.</strong>
            {{ opt }}
          </label>
        </div>
      </div>
      <div v-if="current.type==='judge'" style="margin:12px 0;">
        <label><input type="radio" value="true" v-model="answerInput" /> 对</label>
        <label style="margin-left:16px;"><input type="radio" value="false" v-model="answerInput" /> 错</label>
      </div>
      <div v-if="current.type==='blank'" style="margin-top:12px;">
        <div v-for="(b,i) in current.answer.length" :key="i" style="margin-bottom:6px;">
          <input v-model="blankInputs[i]" placeholder="第 {{i+1}} 空" />
        </div>
      </div>
      <div style="margin-top:12px;">
        <button class="primary" @click="submit" :disabled="submitted">提交</button>
        <button class="outline" @click="next" :disabled="!submitted">下一题</button>
      </div>
      <div v-if="submitted" style="margin-top:16px;">
        <div class="alert" :class="isCorrect? 'success':'error'">
          {{ isCorrect? '回答正确':'回答错误' }}
        </div>
        <div style="font-size:14px;">
          <strong>正确答案：</strong>{{ formatAnswer(current) }}
        </div>
        <div v-if="current.analysis" style="margin-top:8px; font-size:13px; background:#fafafa; padding:8px; border:1px solid #eee; border-radius:4px; white-space:pre-wrap;">
          {{ current.analysis }}
        </div>
      </div>
    </div>
    <div v-else style="margin-top:24px; color:#666;">请选择条件并开始</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { getAllQuestions, getMetaSets, recordAnswer } from '../core/storage';

const meta = reactive(getMetaSets());
const allQuestions = ref(getAllQuestions());
const filters = reactive({ grade:'', subject:'', paper:'' });

const pool = ref([]);
const recentIds = ref([]);
const current = ref(null);
const answerInput = ref('');
const blankInputs = ref([]);
const submitted = ref(false);
const isCorrect = ref(false);

function start(){
  const list = allQuestions.value.filter(q=> q.paper===filters.paper && (!filters.grade || q.grade===filters.grade) && (!filters.subject || q.subject===filters.subject));
  pool.value = list;
  next();
}

function next(){
  if(!pool.value.length){ current.value=null; return; }
  answerInput.value=''; blankInputs.value=[]; submitted.value=false; isCorrect.value=false;
  let candidates = pool.value.filter(q=> !recentIds.value.includes(q.id));
  if(!candidates.length) { recentIds.value=[]; candidates = pool.value.slice(); }
  const idx = Math.floor(Math.random()*candidates.length);
  current.value = candidates[idx];
  recentIds.value.push(current.value.id);
  if(recentIds.value.length>5) recentIds.value.shift();
  if(current.value.type==='blank') blankInputs.value = new Array(current.value.answer.length).fill('');
}

function letter(i){ return String.fromCharCode(65+i); }
function labelType(t){ return t==='choice'?'选择题': t==='judge'?'判断题':'填空题'; }

function submit(){
  if(!current.value) return;
  let correct=false; let userAnswer;
  if(current.value.type==='choice'){
    userAnswer = answerInput.value.trim().toUpperCase();
    if(!userAnswer) return;
    correct = userAnswer === current.value.answer;
  } else if(current.value.type==='judge') {
    userAnswer = (answerInput.value === 'true');
    correct = userAnswer === current.value.answer;
  } else if(current.value.type==='blank') {
    userAnswer = blankInputs.value.map(v=>v.trim());
    if(userAnswer.some(v=>!v)) return; // require all filled
    // 支持多个写法: 标准答案单元里用 | 分隔
    correct = userAnswer.every((ans,i)=>{
      const std = current.value.answer[i];
      const variants = std.split('|').map(s=>s.trim());
      return variants.some(v=> equalsFlexible(v, ans));
    });
  }
  isCorrect.value = correct;
  submitted.value = true;
  recordAnswer(current.value, userAnswer, correct);
}

function equalsFlexible(a,b){
  return a.toLowerCase().replace(/\s+/g,'') === b.toLowerCase().replace(/\s+/g,'');
}

function formatAnswer(q){
  if(q.type==='choice') return q.answer;
  if(q.type==='judge') return q.answer? '对':'错';
  if(q.type==='blank') return q.answer.map(a=> a.replace(/\|/g,' / ')).join(' ; ');
  return '';
}
</script>
