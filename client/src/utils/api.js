const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export function getToken(){return localStorage.getItem('token') || ''}
export async function api(path, options={}){
 const res=await fetch(`${API_URL}${path}`,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${getToken()}`,...options.headers}});
 if(!res.ok) throw new Error((await res.json().catch(()=>({error:res.statusText}))).error||res.statusText);
 return res.json();
}
