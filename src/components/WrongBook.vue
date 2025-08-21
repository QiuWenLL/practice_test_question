<template>
  <div class="card" style="max-width:960px; margin:0 auto;">
    <h2 style="margin-top:0;font-size:18px;">错题本</h2>
    <div v-if="wrongList.length">
      <table class="table">
        <thead>
          <tr><th style="width:40px;">#</th><th>题干</th><th>类型</th><th>错次数</th><th>最后错题时间</th><th>操作</th></tr>
        </thead>
        <tbody>
          <tr v-for="(w,i) in wrongList" :key="w.questionId">
            <td>{{ i+1 }}</td>
            <td style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" :title="questionMap[w.questionId].stem">{{ questionMap[w.questionId].stem }}</td>
            <td>{{ labelType(questionMap[w.questionId].type) }}</td>
            <td>{{ w.wrongCount }}</td>
            <td>{{ formatTime(w.lastWrongAt) }}</td>
            <td>
              <button class="outline" @click="practiceSingle(w.questionId)">练习</button>
              <button class="danger" @click="remove(w.questionId)">已掌握</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:16px;">
        <button class="primary" @click="practiceAll" :disabled="!wrongList.length">错题重练 (顺序)</button>
      </div>
    </div>
    <div v-else>暂无错题</div>

    <div v-if="current" style="margin-top:28px; border-top:1px solid #eee; padding-top:20px;">
      <h3 style="margin:0 0 12px;">练习错题</h3>
      <div class="badge">{{ labelType(current.type) }}</div>
      <div style="font-weight:600; margin:8px 0; white-space:pre-wrap;">{{ current.stem }}</div>
      <div v-if="current.type==='choice'" style="margin-top:12px;">
        <div v-for="(opt,i) in current.options" :key="i">
          <label><input type="radio" name="wrong_choice" :value="letter(i)" v-model="answerInput" /> {{ letter(i) }}. {{ opt }}</label>
        </div>
      </div>
      <div v-if="current.type==='judge'" style="margin:12px 0;">
        <label><input type="radio" value="true" v-model="answerInput" /> 对</label>
        <label style="margin-left:16px;"><input type="radio" value="false" v-model="answerInput" /> 错</label>
      </div>
      <div v-if="current.type==='blank'" style="margin-top:12px;">
        <div v-for="(_,i) in current.answer.length" :key="i" style="margin-bottom:6px;">
          <input v-model="blankInputs[i]" placeholder="第 {{i+1}} 空" />
        </div>
      </div>
      <div style="margin-top:12px;">
        <button class="primary" @click="submit" :disabled="submitted">提交</button>
        <button class="outline" @click="next" :disabled="!submitted">下一题</button>
      </div>
      <div v-if="submitted" style="margin-top:16px;">
        <div class="alert" :class="isCorrect? 'success':'error'">{{ isCorrect? '正确':'错误' }}</div>
        <div><strong>正确答案：</strong>{{ formatAnswer(current) }}</div>
        <div v-if="current.analysis" style="margin-top:8px; font-size:13px; background:#fafafa; padding:8px; border:1px solid #eee; border-radius:4px; white-space:pre-wrap;">{{ current.analysis }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { getWrongStats, getAllQuestions, markMastered, recordAnswer } from '../core/storage';

const wrongStats = ref(getWrongStats());
const questions = ref(getAllQuestions());
const questionMap = computed(()=> Object.fromEntries(questions.value.map(q=>[q.id,q])));

const wrongList = computed(()=> Object.values(wrongStats.value).sort((a,b)=> b.wrongCount - a.wrongCount));

const queue = ref([]);
const current = ref(null);
const answerInput = ref('');
const blankInputs = ref([]);
const submitted = ref(false);
const isCorrect = ref(false);

function practiceAll(){
  queue.value = wrongList.value.map(w=> w.questionId);
  loadNext();
}
function practiceSingle(id){
  queue.value = [id];
  loadNext();
}
function loadNext(){
  if(!queue.value.length){ current.value=null; return; }
  const id = queue.value[0];
  current.value = questionMap.value[id];
  answerInput.value=''; submitted.value=false; isCorrect.value=false; blankInputs.value = current.value.type==='blank'? new Array(current.value.answer.length).fill(''):[];
}
function next(){ if(queue.value.length){ queue.value.shift(); loadNext(); } }

function submit(){
  if(!current.value) return;
  let correct=false; let userAnswer;
  if(current.value.type==='choice'){
    userAnswer = answerInput.value.trim().toUpperCase(); if(!userAnswer) return; correct = userAnswer === current.value.answer;
  } else if(current.value.type==='judge') { userAnswer = (answerInput.value==='true'); correct = userAnswer === current.value.answer; }
  else if(current.value.type==='blank') { userAnswer = blankInputs.value.map(v=>v.trim()); if(userAnswer.some(v=>!v)) return; correct = userAnswer.every((ans,i)=>{ const variants = current.value.answer[i].split('|').map(s=>s.trim()); return variants.some(v=> equalsFlexible(v, ans)); }); }
  isCorrect.value = correct; submitted.value=true; recordAnswer(current.value,userAnswer,correct);
}

function remove(id){ if(confirm('确认标记已掌握?')){ markMastered(id); wrongStats.value = getWrongStats(); if(current.value?.id===id){ next(); } } }

function letter(i){ return String.fromCharCode(65+i); }
function labelType(t){ return t==='choice'?'选择':'judge'===t?'判断':'填空'; }
function formatAnswer(q){ if(q.type==='choice') return q.answer; if(q.type==='judge') return q.answer? '对':'错'; if(q.type==='blank') return q.answer.map(a=> a.replace(/\|/g,' / ')).join(' ; '); return ''; }
function formatTime(ts){ const d = new Date(ts); return d.toLocaleString(); }
function equalsFlexible(a,b){ return a.toLowerCase().replace(/\s+/g,'') === b.toLowerCase().replace(/\s+/g,''); }
</script>
