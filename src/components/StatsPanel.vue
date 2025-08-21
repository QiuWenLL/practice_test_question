<template>
  <div class="card" style="max-width:800px; margin:0 auto;">
    <h2 style="margin-top:0;font-size:18px;">统计</h2>
    <div v-if="stats.total===0">暂无作答记录</div>
    <div v-else>
      <div class="stat-grid" style="margin-bottom:20px;">
        <div class="stat-box">
          <div style="font-size:12px;color:#666;">总答题</div>
          <div style="font-size:20px;font-weight:600;">{{ stats.total }}</div>
        </div>
        <div class="stat-box">
          <div style="font-size:12px;color:#666;">正确</div>
            <div style="font-size:20px;font-weight:600;">{{ stats.correct }}</div>
        </div>
        <div class="stat-box">
          <div style="font-size:12px;color:#666;">正确率</div>
          <div style="font-size:20px;font-weight:600;">{{ (stats.accuracy*100).toFixed(1) }}%</div>
        </div>
      </div>
      <h3 style="margin:12px 0 4px; font-size:16px;">按题型</h3>
      <table class="table" v-if="Object.keys(stats.byType).length">
        <thead><tr><th>题型</th><th>答题数</th><th>正确数</th><th>正确率</th></tr></thead>
        <tbody>
          <tr v-for="(v,k) in stats.byType" :key="k">
            <td>{{ labelType(k) }}</td>
            <td>{{ v.total }}</td>
            <td>{{ v.correct }}</td>
            <td>{{ (v.correct/v.total*100).toFixed(1) }}%</td>
          </tr>
        </tbody>
      </table>
      <h3 style="margin:20px 0 4px; font-size:16px;">按试卷</h3>
      <table class="table" v-if="Object.keys(stats.byPaper).length">
        <thead><tr><th>试卷</th><th>答题数</th><th>正确数</th><th>正确率</th></tr></thead>
        <tbody>
          <tr v-for="(v,k) in stats.byPaper" :key="k">
            <td>{{ k }}</td>
            <td>{{ v.total }}</td>
            <td>{{ v.correct }}</td>
            <td>{{ (v.correct/v.total*100).toFixed(1) }}%</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:24px;">
        <button class="outline" @click="refresh">刷新</button>
        <button class="danger" style="margin-left:12px;" @click="clearData">清空所有数据</button>
      </div>
      <div v-if="message" class="alert" :class="messageType" style="margin-top:12px;">{{ message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { computeStats, saveAllQuestions, saveAnswerRecords, saveWrongStats, saveMetaSets, getAllQuestions, getAnswerRecords, getWrongStats, getMetaSets } from '../core/storage';

const stats = ref(computeStats());
const message = ref('');
const messageType = ref('success');

function refresh(){ stats.value = computeStats(); flash('已刷新','success'); }
function clearData(){
  if(!confirm('确认清空所有题目与记录? 操作不可恢复')) return;
  saveAllQuestions([]); saveAnswerRecords([]); saveWrongStats({}); saveMetaSets({ grades:[], subjects:[], papers:[]});
  stats.value = computeStats();
  flash('已清空','success');
}
function flash(text,type){ message.value=text; messageType.value=type; setTimeout(()=> message.value='', 2000); }
function labelType(t){ return t==='choice'?'选择':'judge'===t?'判断':'填空'; }
</script>
