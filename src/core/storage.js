// Local storage keys
const KEYS = {
  QUESTIONS: 'qp_questions',
  ANSWERS: 'qp_answer_records',
  WRONG: 'qp_wrong_stats',
  META: 'qp_meta_sets'
};

function load(key, def){
  try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
}
function save(key, val){
  localStorage.setItem(key, JSON.stringify(val));
}

export function getAllQuestions(){ return load(KEYS.QUESTIONS, []); }
export function saveAllQuestions(list){ save(KEYS.QUESTIONS, list); }

export function getAnswerRecords(){ return load(KEYS.ANSWERS, []);} 
export function saveAnswerRecords(list){ save(KEYS.ANSWERS, list);} 

export function getWrongStats(){ return load(KEYS.WRONG, {});} 
export function saveWrongStats(obj){ save(KEYS.WRONG, obj);} 

export function getMetaSets(){ return load(KEYS.META, { grades: [], subjects: [], papers: []}); }
export function saveMetaSets(meta){ save(KEYS.META, meta); }

export function upsertMeta(value, field){
  const meta = getMetaSets();
  if(!meta[field]) meta[field] = [];
  if(value && !meta[field].includes(value)) meta[field].push(value);
  saveMetaSets(meta);
  return meta;
}

export function generateId(){
  return 'q_' + Math.random().toString(36).slice(2,9) + Date.now().toString(36);
}

export function recordAnswer(question, userAnswer, correct){
  const records = getAnswerRecords();
  records.push({ questionId: question.id, userAnswer, correct, timestamp: Date.now(), type: question.type });
  saveAnswerRecords(records);
  if(!correct){
    const ws = getWrongStats();
    if(!ws[question.id]) ws[question.id] = { questionId: question.id, wrongCount:0, lastWrongAt:0 };
    ws[question.id].wrongCount += 1;
    ws[question.id].lastWrongAt = Date.now();
    saveWrongStats(ws);
  }
}

export function markMastered(questionId){
  const ws = getWrongStats();
  if(ws[questionId]){ delete ws[questionId]; saveWrongStats(ws); }
}

export function computeStats(){
  const recs = getAnswerRecords();
  const total = recs.length;
  const correct = recs.filter(r=>r.correct).length;
  const byType = {};
  const byPaper = {};
  recs.forEach(r=>{ byType[r.type] = byType[r.type] || { total:0, correct:0 }; byType[r.type].total++; if(r.correct) byType[r.type].correct++; });
  const questions = getAllQuestions();
  const qMap = Object.fromEntries(questions.map(q=>[q.id,q]));
  recs.forEach(r=>{ const paper = qMap[r.questionId]?.paper || '未设置'; byPaper[paper] = byPaper[paper] || { total:0, correct:0 }; byPaper[paper].total++; if(r.correct) byPaper[paper].correct++; });
  return { total, correct, accuracy: total? (correct/total) : 0, byType, byPaper };
}
