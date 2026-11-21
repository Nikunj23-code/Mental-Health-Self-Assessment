'use client';
import {ResponsiveContainer,LineChart,Line,XAxis,YAxis,Tooltip,CartesianGrid,Legend} from 'recharts';
type Point={date:string;phq9?:number;gad7?:number};
export function LongitudinalChart({data}:{data:Point[]}) {
 if(!data.length)return <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl bg-slate-50 px-4 text-center"><p className="font-bold text-slate-800">No results saved yet</p><p className="mt-1 text-sm text-slate-500">Complete a screening to start your timeline.</p></div>;
 const rows=data.map((p,i)=>({...p,point:i+1}));
 return <div className="h-80 w-full" aria-label="PHQ-9 and GAD-7 assessment history line chart">
  <ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{top:20,right:24,left:-14,bottom:8}}>
   <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3"/>
   <XAxis dataKey="point" type="number" domain={[1,'dataMax']} allowDecimals={false} tick={{fontSize:11}} label={{value:'Assessment sequence',position:'insideBottom',offset:-4,fontSize:11}}/>
   <YAxis domain={[0,27]} allowDecimals={false} tick={{fontSize:11}}/>
   <Tooltip labelFormatter={(label)=>{const i=Number(label)-1;return rows[i]?new Date(rows[i].date).toLocaleString('en-IN'):'Screening';}} formatter={(v:any,name:any)=>[String(v),String(name)]}/>
   <Legend verticalAlign="top" height={36}/>
   <Line type="linear" name="Depression (PHQ-9, /27)" dataKey="phq9" stroke="#0f766e" strokeWidth={3} dot={{r:5}} connectNulls/>
   <Line type="linear" name="Anxiety (GAD-7, /21)" dataKey="gad7" stroke="#2563eb" strokeWidth={3} dot={{r:5}} connectNulls/>
  </LineChart></ResponsiveContainer>
 </div>;
}
