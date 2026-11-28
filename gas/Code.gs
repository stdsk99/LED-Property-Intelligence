/**
 * LED-PI Google Apps Script backend.
 * Deploy as USER_DEPLOYING. Every data method verifies a Google ID token and allowlist.
 * Script Properties: GOOGLE_OAUTH_CLIENT_ID, ALLOWED_EMAILS, ADMIN_EMAILS, SPREADSHEET_ID.
 */
const SHEETS = {
  Properties: ["property_id","asset_code","title","asset_type","province","district","subdistrict","address","area_rai","area_ngan","area_sq_wah","government_assessed","listing_asking","verified_transaction","auction_date","auction_status","status","source_url","notes","created_by","created_at","updated_at"],
  AuditLog: ["event_id","actor_email","action","entity_type","entity_id","details_json","created_at"]
};
function doGet() {
  const t=HtmlService.createTemplateFromFile("Index");
  t.googleClientId=PropertiesService.getScriptProperties().getProperty("GOOGLE_OAUTH_CLIENT_ID")||"";
  return t.evaluate().setTitle("LED Property Intelligence").addMetaTag("viewport","width=device-width, initial-scale=1");
}
function include(name){return HtmlService.createHtmlOutputFromFile(name).getContent();}

/** Run once from editor; creates a private spreadsheet and required tabs. */
function initializeLedPi(){
  const p=PropertiesService.getScriptProperties();let id=p.getProperty("SPREADSHEET_ID"),ss;
  if(id)ss=SpreadsheetApp.openById(id);else{ss=SpreadsheetApp.create("LED-PI Database");id=ss.getId();p.setProperty("SPREADSHEET_ID",id);}
  Object.keys(SHEETS).forEach(name=>{let sh=ss.getSheetByName(name);if(!sh)sh=ss.insertSheet(name);if(sh.getLastRow()===0)sh.getRange(1,1,1,SHEETS[name].length).setValues([SHEETS[name]]);sh.setFrozenRows(1);});
  const first=ss.getSheetByName("Sheet1");if(first&&first.getLastRow()===0&&ss.getSheets().length>1)ss.deleteSheet(first);
  return {spreadsheetId:id,spreadsheetUrl:ss.getUrl(),tabs:Object.keys(SHEETS)};
}

/** Verify signed Google ID token at Google's tokeninfo endpoint. Never trust browser-supplied email. */
function verifyUser_(token){
  if(!token||typeof token!=="string"||token.length>10000)throw new Error("กรุณาเข้าสู่ระบบด้วย Google");
  const p=PropertiesService.getScriptProperties(),clientId=p.getProperty("GOOGLE_OAUTH_CLIENT_ID");
  if(!clientId)throw new Error("ผู้ดูแลระบบยังไม่ได้ตั้งค่า GOOGLE_OAUTH_CLIENT_ID");
  const digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,token);
  const key="gis_"+Utilities.base64EncodeWebSafe(digest).replace(/=+$/,""),cache=CacheService.getScriptCache();
  let c=cache.get(key);
  if(!c){
    const res=UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token="+encodeURIComponent(token),{muteHttpExceptions:true});
    if(res.getResponseCode()!==200)throw new Error("Google token ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    const claims=JSON.parse(res.getContentText());
    if(claims.aud!==clientId||claims.email_verified!=="true"||!claims.email)throw new Error("ไม่สามารถยืนยันบัญชี Google นี้ได้");
    if(claims.iss!=="accounts.google.com"&&claims.iss!=="https://accounts.google.com")throw new Error("Google token issuer ไม่ถูกต้อง");
    if(!claims.exp||Number(claims.exp)*1000<Date.now()+30000)throw new Error("Google token ใกล้หมดอายุ กรุณาเข้าสู่ระบบใหม่");
    c=JSON.stringify({email:claims.email,aud:claims.aud,email_verified:claims.email_verified,iss:claims.iss,exp:claims.exp});cache.put(key,c,Math.min(240,Math.max(1,Math.floor(Number(claims.exp)-Date.now()/1000-30)));
  }
  const claims=JSON.parse(c);
  if(claims.aud!==clientId||claims.email_verified!=="true"||(claims.iss!=="accounts.google.com"&&claims.iss!=="https://accounts.google.com")||Number(claims.exp)*1000<Date.now())throw new Error("Google identity ไม่ผ่านการตรวจสอบ");
  const email=String(claims.email).trim().toLowerCase();
  const allowed=(p.getProperty("ALLOWED_EMAILS")||"").split(/[;,\n]/).map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(!allowed.includes(email))throw new Error("บัญชี "+email+" ยังไม่ได้รับอนุญาตให้ใช้ LED-PI");
  const admins=(p.getProperty("ADMIN_EMAILS")||"").split(/[;,\n]/).map(x=>x.trim().toLowerCase()).filter(Boolean);
  return {email:email,role:admins.includes(email)?"admin":"editor"};
}
function safeSheetText_(value,maxLength){
  let s=String(value==null?"":value).trim().slice(0,maxLength||500);
  if(/^[=+@\\t\\r]/.test(s))s="'"+s;
  return s;
}
function db_(){const id=PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");if(!id)throw new Error("ยังไม่ได้ initialize ฐานข้อมูล");return SpreadsheetApp.openById(id);}
function getBootstrap(token){const user=verifyUser_(token);return {user:user,properties:listPropertiesInternal_(),limits:{maxUsers:30,storage:"Google Sheets"}};}
function listProperties(token){verifyUser_(token);return listPropertiesInternal_();}
function listPropertiesInternal_(){
  const values=db_().getSheetByName("Properties").getDataRange().getValues();if(values.length<2)return [];
  const h=values[0];return values.slice(1).filter(r=>r[0]).map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i] instanceof Date?Utilities.formatDate(r[i],Session.getScriptTimeZone(),"yyyy-MM-dd"):r[i]);return o;}).reverse().slice(0,2000);
}
function saveProperty(token,input){
  const user=verifyUser_(token);if(!input||typeof input!=="object")throw new Error("ข้อมูลทรัพย์ไม่ถูกต้อง");
  const title=String(input.title||"").trim();if(!title||title.length>250)throw new Error("กรุณาระบุชื่อทรัพย์ (ไม่เกิน 250 ตัวอักษร)");
  const record={title:title},numeric=["area_rai","area_ngan","area_sq_wah","government_assessed","listing_asking","verified_transaction"];
  numeric.forEach(k=>{const v=input[k];if(v===""||v==null)record[k]="";else{const n=Number(v);if(!Number.isFinite(n)||n<0)throw new Error("ค่าตัวเลขไม่ถูกต้อง: "+k);record[k]=n;}});
  ["asset_code","asset_type","province","district","subdistrict","address","auction_date","auction_status","status","source_url","notes"].forEach(k=>record[k]=safeSheetText_(input[k],k==="notes"?3000:500));
  record.status=record.status||"watchlist";if(!["watchlist","reviewing","passed","won"].includes(record.status))throw new Error("สถานะทรัพย์ไม่ถูกต้อง");
  if(record.source_url&&!/^https:\/\//i.test(record.source_url))throw new Error("Source URL ต้องเป็น HTTPS");
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const sh=db_().getSheetByName("Properties"),now=new Date(),id=String(input.property_id||Utilities.getUuid()),data=sh.getDataRange().getValues(),h=data[0];let rowNo=-1;
    for(let i=1;i<data.length;i++)if(String(data[i][0])===id){rowNo=i+1;break;}
    const old=rowNo>0?data[rowNo-1]:null;
    const row=h.map(k=>k==="property_id"?id:k==="created_by"?(old?old[h.indexOf(k)]:user.email):k==="created_at"?(old?old[h.indexOf(k)]:now):k==="updated_at"?now:(record[k]!==undefined?record[k]:(old?old[h.indexOf(k)]:"")));
    if(rowNo>0)sh.getRange(rowNo,1,1,row.length).setValues([row]);else sh.appendRow(row);
    audit_(user.email,old?"update":"create","property",id,{title:title});return {success:true,property_id:id};
  }finally{lock.releaseLock();}
}
function importCsv(token,csvText){
  const user=verifyUser_(token);if(typeof csvText!=="string"||!csvText.trim()||csvText.length>500000)throw new Error("CSV ว่างหรือมีขนาดเกิน 500 KB");
  const rows=Utilities.parseCsv(csvText);if(rows.length<2)throw new Error("CSV ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 แถว");
  const aliases={"\\ufefftitle":"title","ชื่อทรัพย์":"title","รายละเอียดทรัพย์":"title","รหัสทรัพย์":"asset_code","ประเภททรัพย์":"asset_type","จังหวัด":"province","อำเภอ":"district","ตำบล":"subdistrict","ราคาประเมินราชการ":"government_assessed","ราคาประกาศขาย":"listing_asking","ราคาซื้อขายจริง":"verified_transaction","วันขายทอดตลาด":"auction_date","สถานะ":"status"};
  const headers=rows[0].map((h,i)=>String(h).replace(/^\\ufeff/,"").trim().toLowerCase()).map(h=>aliases[h]||h),allowed=SHEETS.Properties;
  if(!headers.includes("title"))throw new Error("CSV ต้องมีคอลัมน์ title หรือ ชื่อทรัพย์");
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const sh=db_().getSheetByName("Properties"),now=new Date(),out=[];
    rows.slice(1).forEach((r,idx)=>{if(!r.some(v=>String(v).trim()))return;const o={};headers.forEach((h,i)=>{if(allowed.includes(h))o[h]=r[i]||"";});if(!String(o.title||"").trim())throw new Error("CSV แถว "+(idx+2)+" ไม่มีชื่อทรัพย์");
      if(o.status&&!["watchlist","reviewing","passed","won"].includes(String(o.status)))throw new Error("CSV แถว "+(idx+2)+" มีสถานะไม่ถูกต้อง");
      if(o.source_url&&!/^https:\\/\\//i.test(String(o.source_url)))throw new Error("CSV แถว "+(idx+2)+" Source URL ต้องเป็น HTTPS");
      ["government_assessed","listing_asking","verified_transaction","area_rai","area_ngan","area_sq_wah"].forEach(k=>{if(o[k]!==undefined&&o[k]!==""){const n=Number(String(o[k]).replace(/,/g,""));if(!Number.isFinite(n)||n<0)throw new Error("CSV แถว "+(idx+2)+" มีค่า "+k+" ไม่ถูกต้อง");o[k]=n;}});
      out.push(allowed.map(k=>k==="property_id"?Utilities.getUuid():k==="created_by"?user.email:k==="created_at"||k==="updated_at"?now:k==="status"?(o[k]||"watchlist"):["title","asset_code","asset_type","province","district","subdistrict","address","auction_status","source_url","notes"].includes(k)?safeSheetText_(o[k],k==="notes"?3000:500):(o[k]||"")));
    });
    if(!out.length)throw new Error("ไม่พบแถวข้อมูลที่นำเข้าได้");if(sh.getLastRow()+out.length>5001)throw new Error("MVP จำกัดทะเบียนทรัพย์ 5,000 รายการ");
    sh.getRange(sh.getLastRow()+1,1,out.length,allowed.length).setValues(out);audit_(user.email,"import_csv","property",String(out.length),{rows:out.length});return {imported:out.length};
  }finally{lock.releaseLock();}
}
function audit_(email,action,type,id,details){db_().getSheetByName("AuditLog").appendRow([Utilities.getUuid(),email,action,type,id,JSON.stringify(details||{}),new Date()]);}
