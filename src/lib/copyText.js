/** Clipboard API first; retain a local fallback for older/insecure browser contexts. */
export async function copyText(text,{clipboard=globalThis.navigator?.clipboard,document=globalThis.document}={}){
 try{if(clipboard?.writeText){await clipboard.writeText(text);return true;}}catch{}
 if(!document?.body||!document.execCommand)return false;
 const active=document.activeElement,selection=document.getSelection?.(),ranges=[];
 for(let i=0;i<(selection?.rangeCount??0);i++)ranges.push(selection.getRangeAt(i).cloneRange());
 const field=document.createElement('textarea');field.value=text;field.setAttribute('readonly','');field.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';document.body.appendChild(field);
 try{field.focus();field.select();return document.execCommand('copy');}catch{return false;}
 finally{field.remove();active?.focus?.({preventScroll:true});if(selection){selection.removeAllRanges();ranges.forEach(range=>selection.addRange(range));}}
}
