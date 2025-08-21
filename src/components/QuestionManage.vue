<template>
  <div class="grid" style="gap:24px;">
    <div class="card" style="max-width:600px;">
      <h2 style="margin-top:0; font-size:18px;">添加题目</h2>
      <form @submit.prevent="handleAdd">
        <div class="grid" style="gap:12px; grid-template-columns:1fr 1fr 1fr;">
          <div>
            <label>年级</label>
            <div class="flex" style="gap:4px;">
              <select v-model="form.grade">
                <option value="">选择</option>
                <option v-for="g in meta.grades" :key="g" :value="g">{{g}}</option>
              </select>
              <input v-model="newGrade" placeholder="新增" style="width:80px;" />
            </div>
          </div>
          <div>
            <label>科目</label>
            <div class="flex" style="gap:4px;">
              <select v-model="form.subject">
                <option value="">选择</option>
                <option v-for="s in meta.subjects" :key="s" :value="s">{{s}}</option>
              </select>
              <input v-model="newSubject" placeholder="新增" style="width:80px;" />
            </div>
          </div>
          <div>
            <label>试卷</label>
            <div class="flex" style="gap:4px;">
              <select v-model="form.paper">
                <option value="">选择</option>
                <option v-for="p in meta.papers" :key="p" :value="p">{{p}}</option>
              </select>
              <input v-model="newPaper" placeholder="新增" style="width:80px;" />
            </div>
          </div>
        </div>
        <div style="margin-top:12px;">
          <label>题型</label>
          <select v-model="form.type">
            <option value="choice">选择题</option>
            <option value="judge">判断题</option>
            <option value="blank">填空题</option>
          </select>
        </div>
        <div style="margin-top:12px;">
          <label>题干</label>
          <textarea v-model="form.stem" rows="3" placeholder="输入题干"></textarea>
        </div>
        <div v-if="form.type==='choice'" style="margin-top:12px;">
          <label>选项</label>
          <div v-for="(opt,i) in form.options" :key="i" class="flex" style="gap:4px; margin-bottom:4px;">
            <input v-model="form.options[i]" placeholder="选项内容" />
            <button type="button" @click="removeOption(i)" class="danger" v-if="form.options.length>2">×</button>
          </div>
          <button type="button" class="outline" @click="addOption">+ 选项</button>
          <div style="margin-top:8px;">
            <label>正确答案(输入选项序号 A/B/C...)</label>
            <input v-model="choiceAnswer" placeholder="例如 A" />
          </div>
        </div>
        <div v-if="form.type==='judge'" style="margin-top:12px;">
          <label>正确答案</label>
          <select v-model="judgeAnswer">
            <option :value="true">对</option>
            <option :value="false">错</option>
          </select>
        </div>
        <div v-if="form.type==='blank'" style="margin-top:12px;">
          <label>填空数量</label>
          <input type="number" min="1" v-model.number="blankCount" />
          <div style="margin-top:8px;">
            <label>标准答案（支持一个空多种写法，用 | 分隔）</label>
            <div v-for="(_,i) in blankCount" :key="i" style="margin-bottom:4px;">
              <input v-model="blankAnswers[i]" placeholder="第 {{i+1}} 空答案，如: 光合作用|photosynthesis" />
            </div>
          </div>
        </div>
        <div style="margin-top:12px;">
          <label>解析</label>
          <textarea v-model="form.analysis" rows="2" placeholder="解析说明"></textarea>
        </div>
        <div style="margin-top:16px;">
          <button class="primary" type="submit">保存题目</button>
          <button type="button" class="outline" @click="resetForm">重置</button>
        </div>
        <div v-if="message.text" class="alert" :class="message.type">{{ message.text }}</div>
      </form>
    </div>
    <div class="card" style="flex:1;">
      <h2 style="margin-top:0; font-size:18px;">题目列表 ({{ questions.length }})</h2>
      <table class="table" v-if="questions.length">
        <thead><tr><th>题干</th><th>类型</th><th>分类</th><th>操作</th></tr></thead>
        <tbody>
          <tr v-for="q in questions" :key="q.id">
            <td style="max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" :title="q.stem">{{ q.stem }}</td>
            <td>{{ typeLabel(q.type) }}</td>
            <td>{{ q.grade }}/{{ q.subject }}/{{ q.paper }}</td>
            <td>
              <button class="outline" @click="editQuestion(q)">编辑</button>
              <button class="danger" @click="deleteQuestion(q.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else>暂无题目</div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import { getAllQuestions, saveAllQuestions, getMetaSets, upsertMeta, generateId } from '../core/storage';

const questions = ref(getAllQuestions());
const meta = ref(getMetaSets());

const blankCount = ref(1);
const blankAnswers = ref([]);
const choiceAnswer = ref('');
const judgeAnswer = ref(true);

const newGrade = ref('');
const newSubject = ref('');
const newPaper = ref('');

const message = reactive({ text:'', type:'' });

const form = reactive({ id:null, type:'choice', grade:'', subject:'', paper:'', stem:'', options:['',''], analysis:'' });

function resetForm(){
  form.id = null; form.type='choice'; form.grade=''; form.subject=''; form.paper=''; form.stem=''; form.options=['','']; form.analysis='';
  blankCount.value=1; blankAnswers.value=[]; choiceAnswer.value=''; judgeAnswer.value=true; newGrade.value=''; newSubject.value=''; newPaper.value='';
}

function validate(){
  if(!form.stem.trim()) return '题干不能为空';
  const grade = newGrade.value || form.grade; if(!grade) return '年级必填';
  const subject = newSubject.value || form.subject; if(!subject) return '科目必填';
  const paper = newPaper.value || form.paper; if(!paper) return '试卷必填';
  if(form.type==='choice'){
    const opts = form.options.filter(o=>o.trim());
    if(opts.length < 2) return '选择题至少两个有效选项';
    if(!choiceAnswer.value.trim()) return '选择题需要正确答案(如 A)';
  } else if(form.type==='blank'){
    if(blankCount.value < 1) return '填空题空数错误';
    if(blankAnswers.value.length < blankCount.value) return '请填写所有空答案';
    if(blankAnswers.value.some(a=>!a || !a.trim())) return '存在空的填空答案';
  }
  return '';
}

function addOption(){ form.options.push(''); }
function removeOption(i){ form.options.splice(i,1); }

function handleAdd(){
  const err = validate();
  if(err){ flash(err,'error'); return; }
  const grade = (newGrade.value || form.grade).trim();
  const subject = (newSubject.value || form.subject).trim();
  const paper = (newPaper.value || form.paper).trim();
  meta.value = upsertMeta(grade,'grades');
  meta.value = upsertMeta(subject,'subjects');
  meta.value = upsertMeta(paper,'papers');
  if(form.id){
    const idx = questions.value.findIndex(q=>q.id===form.id);
    if(idx>-1){
      questions.value[idx] = buildQuestionObject(form.id, grade, subject, paper);
    }
    flash('已更新题目','success');
  } else {
    const q = buildQuestionObject(generateId(), grade, subject, paper);
    questions.value.push(q);
    flash('已添加题目','success');
  }
  saveAllQuestions(questions.value);
  resetForm();
}

function buildQuestionObject(id, grade, subject, paper){
  let answer;
  if(form.type==='choice'){
    const letter = choiceAnswer.value.trim().toUpperCase();
    answer = letter;
  } else if(form.type==='judge') {
    answer = judgeAnswer.value;
  } else if(form.type==='blank') {
    answer = blankAnswers.value.slice(0, blankCount.value).map(v=>v.trim());
  }
  return {
    id,
    type: form.type,
    grade, subject, paper,
    stem: form.stem.trim(),
    options: form.type==='choice' ? form.options.map(o=>o.trim()) : undefined,
    answer,
    analysis: form.analysis.trim(),
    blanks: form.type==='blank' ? blankCount.value : undefined,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function flash(text,type){ message.text=text; message.type=type; setTimeout(()=>{ message.text=''; }, 2500); }

function editQuestion(q){
  form.id = q.id; form.type=q.type; form.grade=q.grade; form.subject=q.subject; form.paper=q.paper; form.stem=q.stem; form.analysis=q.analysis||'';
  if(q.type==='choice'){ form.options = [...q.options]; choiceAnswer.value = q.answer; }
  if(q.type==='judge'){ judgeAnswer.value = q.answer; }
  if(q.type==='blank'){ blankCount.value = q.blanks || q.answer.length; blankAnswers.value = [...q.answer]; }
  window.scrollTo({ top:0, behavior:'smooth' });
}

function deleteQuestion(id){
  if(!confirm('确认删除该题目?')) return;
  questions.value = questions.value.filter(q=>q.id!==id);
  saveAllQuestions(questions.value);
}

function typeLabel(t){ return t==='choice'?'选择':'judge'===t?'判断':'填空'; }

watch(blankCount,(n)=>{ if(n>blankAnswers.value.length){ for(let i=blankAnswers.value.length;i<n;i++) blankAnswers.value.push(''); } else if(n<blankAnswers.value.length){ blankAnswers.value.splice(n); } });
</script>
