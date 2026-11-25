import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PDFDocument,PDFTextField,PDFCheckBox,PDFRadioGroup,StandardFonts} from 'pdf-lib';
import {DOMMatrix,ImageData,Path2D,createCanvas} from '@napi-rs/canvas';
Object.assign(globalThis,{DOMMatrix,ImageData,Path2D});
const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
const report=JSON.parse(await fs.readFile('artifacts/formal-export.json','utf8'));
const layout=JSON.parse(await fs.readFile('artifacts/formal-layout.json','utf8'));
assert.equal(report.documentCode,'COREXA-JDK-2026-R4');assert.equal(layout.filter(p=>p.overflow).length,0);
const results=[];
for(const file of report.exports){
 const bytes=await fs.readFile(file.file),pdf=await PDFDocument.load(bytes),form=pdf.getForm();
 assert.equal(pdf.getPageCount(),file.pages);assert.equal(form.getFields().length,file.fields);
 for(const p of pdf.getPages()){assert(Math.abs(p.getWidth()-595.28)<1);assert(Math.abs(p.getHeight()-841.89)<1);}
 for(const f of form.getFields()){
  if(f instanceof PDFTextField)assert(!f.getText(),`Blank text field expected: ${f.getName()}`);
  if(f instanceof PDFCheckBox)assert(!f.isChecked(),`Unchecked consent expected: ${f.getName()}`);
  if(f instanceof PDFRadioGroup)assert.equal(f.getSelected(),undefined,`Unselected decision expected: ${f.getName()}`);
 }
 const doc=await getDocument({data:new Uint8Array(bytes),useSystemFonts:true}).promise;
 const visibleFields=[];for(let i=1;i<=doc.numPages;i++){const p=await doc.getPage(i),annotations=await p.getAnnotations();for(const a of annotations)if(a.subtype==='Widget')visibleFields.push({name:a.fieldName,page:i,rect:a.rect});}
 assert.equal(visibleFields.length,file.widgets);
 for(const item of visibleFields)assert(item.rect[0]>=0&&item.rect[1]>=0&&item.rect[2]<=596&&item.rect[3]<=843,'Widget inside page');
 if(file.file!=='Form-Perubahan-Lingkup-CorExa.pdf'){
  form.getTextField('client.nama').setText('Perwakilan Prodi');form.getTextField('client.jabatan').setText('Penanggung Jawab Ujian');form.getTextField('client.institusi').setText('S1 Akuntansi FEB Universitas Pancasila');form.getTextField('client.catatan').setText('Contoh pengisian untuk pemeriksaan. Jadwal kickoff dikonfirmasi bersama.');form.getRadioGroup('client.keputusan').select('Setuju_dengan_catatan');form.getCheckBox('client.memahami_perubahan').check();
 }else{form.getTextField('cr.nomor').setText('CR-CONTOH');form.getTextField('cr.biaya').setText('Sesuai penawaran terpisah');form.getRadioGroup('cr.keputusan').select('Perlu_klarifikasi');}
 form.updateFieldAppearances(await pdf.embedFont(StandardFonts.Helvetica));
 const edited=await pdf.save(),parsed=await PDFDocument.load(edited);
 if(file.file!=='Form-Perubahan-Lingkup-CorExa.pdf'){assert.equal(parsed.getForm().getTextField('client.nama').getText(),'Perwakilan Prodi');assert.equal(parsed.getForm().getRadioGroup('client.keputusan').getSelected(),'Setuju_dengan_catatan');assert(parsed.getForm().getCheckBox('client.memahami_perubahan').isChecked());}
 if(file.file==='Lembar-Persetujuan-CorExa.pdf'){
  await fs.writeFile('artifacts/persetujuan-test-filled.pdf',edited);
  const filled=await getDocument({data:new Uint8Array(edited),useSystemFonts:true}).promise;
  for(let i=1;i<=2;i++){const p=await filled.getPage(i),viewport=p.getViewport({scale:1.5}),canvas=createCanvas(Math.ceil(viewport.width),Math.ceil(viewport.height));await p.render({canvasContext:canvas.getContext('2d'),viewport}).promise;await fs.writeFile(`artifacts/persetujuan-filled-${i}.png`,canvas.toBuffer('image/png'));}
 }
 results.push({file:file.file,pages:file.pages,fields:file.fields,widgets:visibleFields.length,blankDefaults:true,fillAndSave:'passed'});
}
await fs.writeFile('artifacts/formal-verification.json',JSON.stringify(results,null,2));console.log(JSON.stringify({formalVerification:results},null,2));
