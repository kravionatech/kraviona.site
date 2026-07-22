'use client';
import {FormEvent,useState} from 'react';
import {API} from '../lib/api';

export default function InquiryForm({services=[]}:{services:any[]}){
  const [state,setState]=useState<'idle'|'sending'|'sent'|'error'>('idle');
  const [message,setMessage]=useState('');
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setState('sending');setMessage('');
    const form=event.currentTarget;const data=Object.fromEntries(new FormData(form));
    const selected=services.find(service=>service._id===data.service);
    try{const response=await fetch(`${API}/inquiries`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,serviceName:selected?.title||''})});const body=await response.json();if(!response.ok)throw new Error(body.error||'Could not send your enquiry');setState('sent');setMessage(body.message);form.reset()}catch(error:any){setState('error');setMessage(error.message||'Please try again.')} 
  }
  return <form className="inquiry-form" onSubmit={submit}>
    <div className="inquiry-form__row"><label>Your name<input name="name" required minLength={2} autoComplete="name" placeholder="How should we address you?"/></label><label>Work email<input name="email" type="email" required autoComplete="email" placeholder="you@company.com"/></label></div>
    <div className="inquiry-form__row"><label>Phone / WhatsApp<input name="phone" autoComplete="tel" placeholder="+91 …"/></label><label>Company<input name="company" autoComplete="organization" placeholder="Company or brand"/></label></div>
    <div className="inquiry-form__row"><label>Service<select name="service" defaultValue=""><option value="">Not sure yet</option>{services.map(service=><option key={service._id} value={service._id}>{service.title}</option>)}</select></label><label>Indicative budget<select name="budget" defaultValue=""><option value="">Choose a range</option><option>Under ₹50,000</option><option>₹50,000 – ₹1,50,000</option><option>₹1,50,000 – ₹5,00,000</option><option>₹5,00,000+</option></select></label></div>
    <label>What are you trying to build or improve?<textarea name="message" required minLength={10} maxLength={4000} rows={6} placeholder="Tell us the goal, current problem, and ideal timeline."/></label>
    <label className="form-trap" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
    <div className="inquiry-form__submit"><button disabled={state==='sending'}>{state==='sending'?'Sending…':'Send project brief →'}</button><span>Direct to the Kraviona team · Usually replies within 1 business day</span></div>
    {message&&<p className={`inquiry-message inquiry-message--${state}`} role="status">{message}</p>}
  </form>
}
