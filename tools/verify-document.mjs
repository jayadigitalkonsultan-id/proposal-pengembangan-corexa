import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import http from 'node:http';
import { chromium } from 'playwright';
import { DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';
Object.assign(globalThis,{DOMMatrix,ImageData,Path2D});
const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
await fs.mkdir('artifacts',{recursive:true});
const files=new Set(['index.html','company-profile.html','Proposal-CorExa-JDK.pdf','Lembar-Persetujuan-CorExa.pdf','Form-Perubahan-Lingkup-CorExa.pdf','Company-Profile-JDK.pdf']);
const server=http.createServer(async(req,res)=>{
 try{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';if(!files.has(name)){res.writeHead(404);res.end();return;}
  const bytes=await fs.readFile(path.resolve(name));res.setHeader('Content-Type',name.endsWith('.pdf')?'application/pdf':'text/html; charset=utf-8');if(name.endsWith('.pdf'))res.setHeader('Content-Disposition',`attachment; filename="${name}"`);res.end(bytes);
 }catch{res.writeHead(500);res.end();}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
try{
 for(const [source,pdfName] of [['index.html','artifacts/Proposal-CorExa-JDK-Web.pdf'],['company-profile.html','Company-Profile-JDK.pdf']]){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`${origin}/${source}`);
  await page.evaluate(()=>document.fonts.ready);
  assert(await page.evaluate(()=>document.fonts.check('16px Manrope')),'Embedded Manrope font must load');
  assert.equal(await page.locator('.page').count(),0,'Paged document layout must be removed');
  const assets=await page.evaluate(()=>[...document.images].every(img=>img.complete&&img.naturalWidth));
  assert(assets,'Logo must load');
  const links=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].every(a=>document.getElementById(a.hash.slice(1))));
  assert(links,'All internal links resolve');
  const html=await fs.readFile(source,'utf8');
  assert(!/42\.550\.000|42\.650\.000|56 orang-hari|21 halaman|4 halaman/.test(html),'Outdated proposal content');
  const viewportChecks=[];
  for(const width of [360,390,768,1024,1440]){
   await page.setViewportSize({width,height:1000});
   const dimensions=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
   assert.equal(dimensions.document,dimensions.viewport,`${source}: horizontal overflow at ${width}`);
   viewportChecks.push(dimensions);
  }
  await page.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=true));
  for(const width of [360,390,768,1440]){
   await page.setViewportSize({width,height:1000});
   const dimension=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
   assert.equal(dimension.document,dimension.viewport,`${source}: expanded detail overflow at ${width}`);
  }
  await page.evaluate(()=>document.querySelectorAll('details').forEach(d=>d.open=false));
  await page.screenshot({path:`artifacts/${source==='index.html'?'proposal':'profile'}-desktop.png`});
  if(source==='index.html'){
   await page.locator('[data-system="jawaban"]').click();
   assert.equal(await page.locator('.editorial-art').getAttribute('data-focus'),'jawaban');
   assert((await page.locator('#diagram-description').textContent()).includes('Riwayat dapat ditelusuri'));
   await page.locator('[data-system="jawaban"]').press('ArrowRight');
   assert.equal(await page.locator('[data-system="penilaian"]').getAttribute('aria-selected'),'true');
   assert.equal(await page.locator('#diagram-description').getAttribute('aria-labelledby'),'focus-penilaian');
   await page.locator('[data-system="penilaian"]').press('Home');
   assert.equal(await page.locator('.editorial-art').getAttribute('data-focus'),'sesi');
   await page.locator('#persetujuan').screenshot({path:'artifacts/proposal-acceptance-section.png',style:'.site-header,.reading-progress,.skip-link{visibility:hidden}'});
   await page.locator('#solusi').screenshot({path:'artifacts/proposal-summary.png',style:'.site-header,.reading-progress,.skip-link{visibility:hidden}'});
   const sum=await page.locator('.cost-row').evaluateAll(rows=>rows.reduce((value,row)=>value+Number(row.dataset.amount),0));
   assert.equal(sum,15000000);assert.equal(await page.locator('[data-total]').textContent(),'Rp15.000.000');
   const pdfDownloadPromise=page.waitForEvent('download');
   await page.locator('[data-formal-download]').click();
   const pdfDownload=await pdfDownloadPromise;
   assert.equal(pdfDownload.suggestedFilename(),'Proposal-CorExa-JDK.pdf');
   const downloadedDoc=await getDocument({data:new Uint8Array(await fs.readFile(await pdfDownload.path())),useSystemFonts:true}).promise;
   assert.equal(downloadedDoc.numPages,28,'Download must be the formal PDF');
   const downloadedFields=await downloadedDoc.getFieldObjects();
   assert(downloadedFields instanceof Map?downloadedFields.has('client.nama'):'client.nama' in downloadedFields,'Formal download must retain fillable approval');
   assert.equal(await page.locator('.scope-row').count(),10);
   for(const [filter,count] of [['keandalan',5],['administrasi',3],['penilaian',2],['all',10]]){
    await page.locator(`[data-filter="${filter}"]`).click();
    assert.equal(await page.locator('.scope-row:visible').count(),count);
   }
   await page.locator('a[href="#detail-sesi"][data-open-detail]').first().click();
   assert.equal(await page.locator('#detail-sesi').getAttribute('open'),'');
   await page.locator('#detail-sesi > summary').click();
   await page.locator('[data-approve]').first().click();
   assert(await page.locator('#approval-dialog').isVisible());
   await page.locator('#client-name').fill('Perwakilan Prodi');
   await page.locator('#client-role').fill('S1 Akuntansi FEB Universitas Pancasila');
   assert.equal(await page.locator('#approval-form').evaluate(form=>form.checkValidity()),false);
   await page.locator('#approval-terms').check();
   await page.locator('#client-role').press('Enter');
   assert(await page.locator('#approval-dialog').isVisible(),'Keyboard submit must keep dialog open');
   const mail=await page.locator('#approval-email').getAttribute('href');
   assert(mail.startsWith('mailto:jaya.digitalkonsultan@gmail.com?'));
   assert(decodeURIComponent(mail).includes('Rp15.000.000'));
   assert(decodeURIComponent(mail).includes('Perwakilan Prodi'));
   assert.equal(await page.locator('#approval-preview script').count(),0);
   await page.screenshot({path:'artifacts/proposal-approval.png'});
   const downloadPromise=page.waitForEvent('download');
   await page.locator('#download-approval').click();
   const download=await downloadPromise;await download.saveAs('artifacts/draft-approval-test.txt');
   assert((await fs.readFile('artifacts/draft-approval-test.txt','utf8')).includes('Rp15.000.000'));
   await page.locator('#edit-approval').click();
   assert(await page.locator('#approval-form').isVisible());
   await page.keyboard.press('Escape');
   assert(!(await page.locator('#approval-dialog').isVisible()));
   await page.locator('#investasi').screenshot({path:'artifacts/proposal-investment.png',style:'.site-header,.reading-progress,.skip-link{visibility:hidden}.offer-card{position:static}'});
   await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  }
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>document.activeElement?.blur());
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:`artifacts/${source==='index.html'?'proposal':'profile'}-mobile.png`});
  await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');
  await page.locator('#main-nav a').last().click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({media:'print'});
  await page.evaluate(()=>{document.querySelectorAll('details').forEach(d=>d.open=true);document.querySelectorAll('.scope-row').forEach(r=>r.hidden=false);});
  await page.pdf({path:pdfName,format:'A4',preferCSSPageSize:true,printBackground:true,displayHeaderFooter:false});
  const doc=await getDocument({data:new Uint8Array(await fs.readFile(pdfName)),useSystemFonts:true}).promise;
  let text='';const pages=[];
  for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i);const t=(await p.getTextContent()).items.map(x=>x.str).join(' ');assert(t.length>80,`Unexpected blank PDF page ${i}`);pages.push({page:i,chars:t.length});text+=t+'\n';}
  assert(!text.includes('42.550.000'));
  if(source==='index.html'){assert(text.includes('15.000.000'));assert(text.includes('U14'));}
  assert.equal(errors.length,0);
  results.push({source,viewports:viewportChecks,pdfPages:doc.numPages,pages,errors,checks:'passed'});
  await page.close();
 }
}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
await fs.writeFile('artifacts/verification.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(({source,pdfPages,checks,errors})=>({source,pdfPages,checks,errors})),null,2));
