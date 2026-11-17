import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copyText } from '../src/lib/copyText.js';
import { homeCapabilities } from '../src/features/home/capabilities.js';
import { routeHref,parseRoute } from '../src/lib/routing.js';
import { profile } from '../src/data/profile.js';
import { safeExternalUrl } from '../src/lib/urls.js';
test('email copying uses Clipboard API and reports unavailable environments honestly',async()=>{
 let copied;assert.equal(await copyText(profile.email,{clipboard:{writeText:async value=>{copied=value;}},document:null}),true);assert.equal(copied,profile.email);
 assert.equal(await copyText(profile.email,{clipboard:{writeText:async()=>{throw new Error('denied');}},document:null}),false);
});
test('copy fallback removes its temporary field and restores focus and selection',async()=>{
 let removed=false,focused=false,value,command;const range={cloneRange(){return this;}},selection={rangeCount:1,getRangeAt:()=>range,removeAllRanges(){},addRange(item){assert.equal(item,range);}};
 const field={setAttribute(){},style:{},focus(){},select(){value=this.value;},remove(){removed=true;}};
 const document={activeElement:{focus(){focused=true;}},getSelection:()=>selection,createElement:()=>field,body:{appendChild(){}},execCommand:name=>{command=name;return true;}};
 assert.equal(await copyText(profile.email,{clipboard:null,document}),true);assert.equal(value,profile.email);assert.equal(command,'copy');assert.ok(removed&&focused);
});
test('home capability links select published showcase projects in the combined page',()=>{
 const records=JSON.parse(readFileSync(new URL('../src/data/projects.json',import.meta.url)));assert.equal(homeCapabilities.length,3);
 for(const item of homeCapabilities){assert.ok(records.some(project=>project.id===item.projectId&&project.visibility==='published'));const route=parseRoute(routeHref('/projects',{focus:item.projectId}));assert.equal(route.path,'/projects');assert.equal(route.params.get('focus'),item.projectId);}
});
test('all requested social profiles resolve to safe existing owner URLs',()=>{
 for(const key of ['facebook','X','TIKTOK','linkedin','github'])assert.ok(safeExternalUrl(profile[key]));
});
