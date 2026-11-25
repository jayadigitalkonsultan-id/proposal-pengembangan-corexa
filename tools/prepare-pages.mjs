import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const destination=path.join(root,'dist');
const manifest=[
 ['index.html','index.html'],
 ['company-profile.html','company-profile.html'],
 ['formal-proposal.html','formal-proposal.html'],
 ['Proposal-CorExa-JDK.pdf','Proposal-CorExa-JDK.pdf'],
 ['Lembar-Persetujuan-CorExa.pdf','Lembar-Persetujuan-CorExa.pdf'],
 ['Form-Perubahan-Lingkup-CorExa.pdf','Form-Perubahan-Lingkup-CorExa.pdf'],
 ['Company-Profile-JDK.pdf','Company-Profile-JDK.pdf'],
 ['Proposal-CorExa-JDK.zip','Proposal-CorExa-JDK.zip'],
 ['BACA-DULU.txt','BACA-DULU.txt'],
 ['content/fonts/OFL-Manrope.txt','OFL-Manrope.txt'],
];
await fs.mkdir(destination,{recursive:true});
const expected=new Set([...manifest.map(([,file])=>file),'.nojekyll']);
const existing=await fs.readdir(destination);
assert(existing.every(file=>expected.has(file)),'dist contains unexpected files; use a new empty output directory');
for(const [source,file]of manifest){
 const bytes=await fs.readFile(path.join(root,source));assert(bytes.length>0,`Missing or empty deployment asset: ${source}`);
 if(file.endsWith('.pdf'))assert(bytes.subarray(0,5).toString()==='%PDF-',`Invalid PDF: ${file}`);
 await fs.writeFile(path.join(destination,file),bytes);
}
await fs.writeFile(path.join(destination,'.nojekyll'),'');
for(const file of manifest.map(([,file])=>file).filter(file=>file.endsWith('.html'))){
 const html=await fs.readFile(path.join(destination,file),'utf8');
 assert(!/href=["']\//i.test(html),'Root-relative links break project Pages hosting');
 assert(!/file:\/\/|C:\\Users\\|C:\/Users\//.test(html),'Local-only paths found in published HTML');
 for(const match of html.matchAll(/href="([^"#][^"]*)"/g)){
  const href=match[1];if(/^(?:https?:|mailto:|tel:|data:)/i.test(href))continue;
  const target=decodeURIComponent(href.split(/[?#]/)[0]);if(!target)continue;
  assert(expected.has(target),`Unknown published link: ${file} -> ${target}`);await fs.access(path.join(destination,target));
 }
}
console.log(JSON.stringify({directory:destination,files:[...expected],status:'ready'},null,2));
