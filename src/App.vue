<template>
  <div class="app-root">
    <header class="card" style="margin:12px;">
      <h1 style="margin:0;font-size:20px;">刷题练习系统 (MVP)</h1>
      <small>本地存储 · 无需登录</small>
      <nav class="tabs" style="margin-top:12px;">
        <button v-for="t in tabs" :key="t.key" :class="{active: currentTab===t.key}" @click="currentTab=t.key">{{ t.label }}</button>
      </nav>
    </header>
    <main class="container" style="flex:1 1 auto; width:100%;">
      <component :is="currentComponent" />
    </main>
    <footer style="text-align:center; padding:24px 0; font-size:12px; color:#666;">© 2025 Quiz Practice MVP</footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import QuestionManage from './components/QuestionManage.vue';
import Practice from './components/Practice.vue';
import WrongBook from './components/WrongBook.vue';
import StatsPanel from './components/StatsPanel.vue';

const tabs = [
  { key: 'manage', label: '题目管理', comp: QuestionManage },
  { key: 'practice', label: '刷题', comp: Practice },
  { key: 'wrong', label: '错题本', comp: WrongBook },
  { key: 'stats', label: '统计', comp: StatsPanel },
];
const currentTab = ref('manage');
const currentComponent = computed(()=> tabs.find(t=>t.key===currentTab.value).comp );
</script>

<style scoped>
.app-root { min-height:100vh; display:flex; flex-direction:column; }
</style>
