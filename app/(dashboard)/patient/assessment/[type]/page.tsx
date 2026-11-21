'use client';
import {useState,useEffect,useMemo,useRef} from 'react';
import {useParams,useRouter} from 'next/navigation';
import Link from 'next/link';
import {ArrowLeft,ShieldCheck,AlertCircle,Loader2} from 'lucide-react';
import AdaptiveQuestionCard from '@/components/assessment/AdaptiveQuestionCard';
import CrisisSafetyModal from '@/components/assessment/CrisisSafetyModal';
import {loadAssessmentSchema,recordSafetySignal,submitAssessment} from '@/server/actions/assessment';

type Question={key:string;text:string;is_crisis_trigger?:boolean};
type Scale={value:number;label:string};
type Schema={id:string;type:string;version:number;title:string;description:string;schema_json:{questions:Question[];scale:Scale[];instructions?:string}};
export default function AssessmentRunnerPage(){
 const {type}=useParams<{type:string}>();
 const router=useRouter();
 const assessmentType=type==='phq-9'?'PHQ-9':type==='gad-7'?'GAD-7':null;
 const [schema,setSchema]=useState<Schema|null>(null);
 const [loading,setLoading]=useState(true);
 const [currentIndex,setCurrentIndex]=useState(0);
 const [answers,setAnswers]=useState<Record<string,number>>({});
 const [submitting,setSubmitting]=useState(false);
 const [error,setError]=useState('');
 const [showSafety,setShowSafety]=useState(false);
 const [safetyError,setSafetyError]=useState('');
 const eventId=useRef<string>('');
 const lastItem9Score=useRef<number>(0);
 useEffect(()=>{
  let active=true;
  if(!assessmentType){setError('Unknown screening instrument.');setLoading(false);return;}
  setLoading(true);
  loadAssessmentSchema(assessmentType).then((res)=>{
   if(!active)return;
   if('error' in res){setError(res.error||'Assessment unavailable');setSchema(null);}
   else {
    const row=res.schema as unknown as Schema;
    const n=assessmentType==='PHQ-9'?9:7;
    const expectedPrefix=assessmentType==='PHQ-9'?'phq9_q':'gad7_q';
    if(!row?.schema_json?.questions || row.schema_json.questions.length!==n ||
       row.schema_json.questions.some((q,i)=>q.key!==expectedPrefix+(i+1))){
      setError('This assessment is temporarily unavailable. Please contact support.');
    } else setSchema(row);
   }
   setLoading(false);
  }).catch(()=>{if(active){setLoading(false);setError('Unable to load assessment. Please retry.')}});
  return()=>{active=false};
 },[assessmentType]);
 const questions=schema?.schema_json.questions||[];
 const options=schema?.schema_json.scale||[];
 const current=questions[currentIndex];
 const answered=questions.filter(q=>answers[q.key]!==undefined).length;
 const percentage=questions.length?Math.round(answered/questions.length*100):0;
 const onSelect=async(value:number)=>{
  if(!current)return;
  setAnswers(prev=>({...prev,[current.key]:value}));
  if(current.key==='phq9_q9'&&value>0){
   setShowSafety(true);setSafetyError('');
   if(!eventId.current)eventId.current=crypto.randomUUID();
   lastItem9Score.current=value;
   try{
    const r=await recordSafetySignal(eventId.current,value,false);
    if(!r.success)setSafetyError('The safety acknowledgement could not be saved. Support information is still available below.');
   }catch{setSafetyError('Unable to save the safety event. Support information is still available.');}
  }
 };
 const onAcknowledge=async()=>{
  setShowSafety(false);
  if(eventId.current&&lastItem9Score.current>0){
   try{await recordSafetySignal(eventId.current,lastItem9Score.current,true)}catch{}
  }
 };
 const submit=async()=>{
  if(!assessmentType||!schema||questions.some(q=>answers[q.key]===undefined)){setError('Answer every question before submitting.');return;}
  setSubmitting(true);setError('');
  try{
   const result=await submitAssessment({assessmentType,answers,schemaId:schema.id});
   if(!result.success||!result.data?.assessmentId){setError(result.error||'Unable to save assessment. Try again.');setSubmitting(false);return;}
   router.replace('/patient/assessment/result/'+result.data.assessmentId);
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'Unable to submit. Your answers are still here.');setSubmitting(false);}
 };
 if(!assessmentType)return <section className="mx-auto max-w-xl px-6 py-24"><h1 className="text-2xl font-bold">Unknown assessment</h1><Link href="/patient/assessment" className="text-teal-700">View assessments</Link></section>;
 return <section className="min-h-[75vh] bg-gradient-to-b from-teal-50/40 via-white to-slate-50 px-4 py-10 sm:px-6">
  <div className="mx-auto max-w-2xl">
   <Link href="/patient/assessment" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-700"><ArrowLeft className="size-4"/> Back to assessments</Link>
   <div className="mb-7">
    <p className="text-xs font-bold uppercase tracking-widest text-teal-700">Evidence-based screening</p>
    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">{assessmentType==='PHQ-9'?'Depression screening':'Anxiety screening'}</h1>
    <p className="mt-2 text-sm text-slate-600">Answer based on your experiences during the past two weeks. This is a screening tool, not a medical diagnosis.</p>
   </div>
   {error&&<div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="size-5 shrink-0"/>{error}</div>}
   {loading?<div className="flex min-h-52 items-center justify-center gap-3 text-slate-600"><Loader2 className="size-5 animate-spin"/> Loading assessment...</div>:schema&&current?<>
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
     <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-600"><span>Question {currentIndex+1} of {questions.length}</span><span>{answered}/{questions.length} answered · {percentage}%</span></div>
     <div role="progressbar" aria-label="Assessment completion" aria-valuenow={answered} aria-valuemin={0} aria-valuemax={questions.length} className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600 transition-all" style={{width:percentage+'%'}}/></div>
    </div>
    <AdaptiveQuestionCard questionNumber={currentIndex+1} totalQuestions={questions.length} questionText={current.text}
     instruction={schema.schema_json.instructions||'Over the last two weeks, how often have you experienced this?'}
     isCrisisTrigger={current.key==='phq9_q9'} options={options} selectedValue={answers[current.key]} onSelect={onSelect}/>
    <div className="mt-6 flex items-center justify-between gap-3">
     <button type="button" onClick={()=>setCurrentIndex(Math.max(0,currentIndex-1))} disabled={currentIndex===0} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 disabled:opacity-40">Previous</button>
     {currentIndex<questions.length-1?<button type="button" disabled={answers[current.key]===undefined} onClick={()=>setCurrentIndex(currentIndex+1)}
     className="rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-40">Next question</button>:
     <button type="button" disabled={submitting||answered!==questions.length} onClick={submit}
     className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-40">
     {submitting&&<Loader2 className="size-4 animate-spin"/>}{submitting?'Validating and saving...':'View my result'}</button>}
    </div>
    <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-500"><ShieldCheck className="size-4"/>Your score is calculated from all your answers and saved securely to your account.</p>
   </>:null}
   {safetyError&&<p role="alert" className="mt-4 text-sm text-rose-700">{safetyError}</p>}
   <CrisisSafetyModal isOpen={showSafety} onAcknowledge={onAcknowledge}/>
  </div>
 </section>;
}
