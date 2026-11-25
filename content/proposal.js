const menu=document.querySelector('.menu-toggle');
const nav=document.querySelector('#main-nav');
menu?.addEventListener('click',()=>{
 const open=menu.getAttribute('aria-expanded')!=='true';
 menu.setAttribute('aria-expanded',String(open));
 menu.setAttribute('aria-label',open?'Tutup navigasi':'Buka navigasi');
 nav.classList.toggle('is-open',open);
});
nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
 nav.classList.remove('is-open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Buka navigasi');
}));
document.querySelectorAll('[data-print]').forEach(button=>button.addEventListener('click',()=>window.print()));
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
 const filter=button.dataset.filter;
 document.querySelectorAll('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 let count=0;
 document.querySelectorAll('.scope-row').forEach(row=>{row.hidden=filter!=='all'&&row.dataset.category!==filter;if(!row.hidden)count++;});
 document.querySelector('.scope-count').textContent=`${count} kebutuhan`;
}));
function revealHash(){const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(target?.matches('details'))target.open=true;}
document.querySelectorAll('[data-open-detail]').forEach(link=>link.addEventListener('click',()=>{const target=document.getElementById(link.hash.slice(1));if(target?.matches('details'))target.open=true;}));
window.addEventListener('hashchange',revealHash);revealHash();
const dialog=document.querySelector('#approval-dialog');
document.querySelectorAll('[data-approve]').forEach(button=>button.addEventListener('click',()=>dialog?.showModal()));
document.querySelector('[data-close-dialog]')?.addEventListener('click',()=>dialog.close());
dialog?.addEventListener('click',event=>{if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();});
let approvalText='';
document.querySelector('#approval-form')?.addEventListener('submit',event=>{
 event.preventDefault();
 const name=document.querySelector('#client-name').value.trim();
 const role=document.querySelector('#client-role').value.trim();
 if(!name||!role){document.querySelector('#client-name').focus();return;}
 const subject='Persetujuan Proposal Pengembangan CorExa — Rp15.000.000';
 approvalText=`Yth. CV Jaya Digital Konsultan,\n\nSaya ${name}, ${role}, menyampaikan persetujuan atas penawaran evaluasi, perbaikan, dan pengembangan Sistem CorExa untuk Program Studi S1 Akuntansi FEB Universitas Pancasila.\n\nRingkasan penawaran:\n- Nilai paket jasa: Rp15.000.000.\n- Lingkup: 10 kebutuhan surat 061/UM/Ka.Prodi/FEB/X/2026, berikut audit, pengujian, dokumentasi, pelatihan, dan penerapan.\n- Estimasi pelaksanaan: 8 minggu sejak akses dan kesepakatan siap.\n- Termin: 30% (Rp4.500.000), 40% (Rp6.000.000), 30% (Rp4.500.000), mengikuti kemajuan dan penerimaan pekerjaan.\n- Pemeliharaan korektif: 60 hari kalender sejak BAST.\n- Perlakuan pajak dan administrasi final dikonfirmasi dalam kesepakatan kerja.\n\nMohon koordinasi lanjutan untuk konfirmasi lingkup, jadwal kickoff, penunjukan PIC, dan administrasi pelaksanaan.\n\nHormat saya,\n${name}\n${role}`;
 approvalText=approvalText.replace('\n\nHormat saya,','\n\nKetentuan yang saya pahami:\n- Dua putaran revisi minor terkoordinasi termasuk pada tahap UAT.\n- Perbaikan bug terhadap baseline termasuk dalam penerimaan dan 60 hari pemeliharaan, tanpa mengurangi kuota revisi minor.\n- Perubahan mayor dikenai biaya tambahan melalui Change Request yang merinci lingkup, biaya, dan dampak jadwal serta disetujui tertulis sebelum dikerjakan.\n- Dokumen acuan: proposal formal COREXA-JDK-2026-R4.\n\nHormat saya,');
 document.querySelector('#approval-email').href=`mailto:jaya.digitalkonsultan@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(approvalText)}`;
 document.querySelector('#approval-preview').textContent=approvalText;
 document.querySelector('#approval-form').hidden=true;
 document.querySelector('#approval-ready').hidden=false;
 document.querySelector('#approval-email').focus();
});
document.querySelector('#edit-approval')?.addEventListener('click',()=>{document.querySelector('#approval-form').hidden=false;document.querySelector('#approval-ready').hidden=true;document.querySelector('#client-name').focus();});
document.querySelector('#download-approval')?.addEventListener('click',()=>{
 const url=URL.createObjectURL(new Blob([approvalText],{type:'text/plain;charset=utf-8'}));
 const anchor=document.createElement('a');anchor.href=url;anchor.download='Draf-Persetujuan-Proposal-CorExa.txt';document.body.append(anchor);anchor.click();anchor.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
});
let printState=[];
window.addEventListener('beforeprint',()=>{printState=[...document.querySelectorAll('details')].map(item=>[item,item.open]);printState.forEach(([item])=>item.open=true);});
window.addEventListener('afterprint',()=>printState.forEach(([item,open])=>item.open=open));

const systemCopy={
 sesi:['Sesi berlanjut. Waktu tetap konsisten.','Pemulihan percobaan yang sama dengan durasi 100 menit berbasis server.'],
 jawaban:['Jawaban tersimpan. Riwayat dapat ditelusuri.','Status simpan terkonfirmasi, kontrol revisi, dan sinkronisasi setelah gangguan.'],
 penilaian:['Kunci sesuai. Hasil dapat diverifikasi.','Pilihan peserta, bobot, dan versi kunci menjadi dasar pemeriksaan nilai akhir.']
};
const systemTabs=[...document.querySelectorAll('[data-system]')];
function chooseSystem(button){
 const key=button.dataset.system;const art=document.querySelector('.editorial-art');if(!art)return;
 art.dataset.focus=key;
 systemTabs.forEach(tab=>{const active=tab===button;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
 const panel=document.querySelector('#diagram-description');panel.setAttribute('aria-labelledby',button.id);
 panel.querySelector('strong').textContent=systemCopy[key][0];panel.querySelector('p').textContent=systemCopy[key][1];
}
systemTabs.forEach((tab,index)=>{
 tab.addEventListener('click',()=>chooseSystem(tab));
 tab.addEventListener('keydown',event=>{
  const shifts={ArrowRight:1,ArrowLeft:-1,Home:-index,End:systemTabs.length-1-index};
  if(!(event.key in shifts))return;
  event.preventDefault();const target=systemTabs[(index+shifts[event.key]+systemTabs.length)%systemTabs.length];chooseSystem(target);target.focus();
 });
});
const progress=document.querySelector('.reading-progress');
const sectionLinks=[...document.querySelectorAll('.nav-links a[href^="#"]')].map(link=>({link,target:document.getElementById(link.hash.slice(1))})).filter(item=>item.target);
let scrollQueued=false;
function updateReading(){
 scrollQueued=false;
 if(progress){const range=document.documentElement.scrollHeight-innerHeight;progress.style.width=`${range>0?Math.min(100,Math.max(0,scrollY/range*100)):0}%`;}
 let current=null;for(const item of sectionLinks)if(item.target.getBoundingClientRect().top<=180)current=item;
 for(const item of sectionLinks){const active=item===current;item.link.classList.toggle('is-current',active);if(active)item.link.setAttribute('aria-current','location');else item.link.removeAttribute('aria-current');}
}
window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateReading);}},{passive:true});
window.addEventListener('resize',updateReading);updateReading();
