import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.LEDPI_CONFIG || {};
const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.SUPABASE_URL || "") && (config.SUPABASE_ANON_KEY || "").length > 30 && !String(config.SUPABASE_ANON_KEY).includes("YOUR_");
const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat("th-TH",{style:"currency",currency:"THB",maximumFractionDigits:0}).format(Number(n)||0);
const safe = (s) => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let supabase, session, profile, activeOrg, properties=[], isSignup=false, currentView="overview";

function toast(message,error=false){const el=$("toast");el.textContent=message;el.classList.remove("hidden","error");if(error)el.classList.add("error");setTimeout(()=>el.classList.add("hidden"),4200)}
function notice(message,type=""){const el=$("notice");el.textContent=message;el.className="notice"+(type?" "+type:"");el.classList.remove("hidden")}
function clearNotice(){$("notice").classList.add("hidden")}
function showAuth(){ $("boot").classList.add("hidden");$("appView").classList.add("hidden");$("authView").classList.remove("hidden"); }
function showApp(){ $("boot").classList.add("hidden");$("authView").classList.add("hidden");$("appView").classList.remove("hidden");$("userEmail").textContent=session.user.email||"";$("userAvatar").textContent=(session.user.email||"U").slice(0,1).toUpperCase(); }
function setAuthMode(signup){isSignup=signup;$("authTitle").textContent=signup?"สร้างบัญชี LED-PI":"เข้าสู่ระบบ";$("authDescription").textContent=signup?"สมัครบัญชีเพื่อสร้าง Workspace และเริ่มจัดการข้อมูลทรัพย์":"เข้าสู่พื้นที่ทำงานเพื่อจัดการข้อมูลทรัพย์และวิเคราะห์การลงทุน";$("authSubmit").textContent=signup?"สมัครสมาชิก":"เข้าสู่ระบบ";$("toggleAuth").textContent=signup?"มีบัญชีแล้ว? เข้าสู่ระบบ":"ยังไม่มีบัญชี? สมัครสมาชิก";$("authPassword").autocomplete=signup?"new-password":"current-password";}
async function loadWorkspace(){
 const {data:memberships,error}=await supabase.from("organization_members").select("organization_id,role,organizations(id,name)").order("created_at");
 if(error)throw error;
 if(!memberships?.length){
   const {data,error:createError}=await supabase.rpc("create_workspace",{workspace_name:"My LED-PI Workspace"});
   if(createError)throw createError;
   const {data:again,error:againError}=await supabase.from("organization_members").select("organization_id,role,organizations(id,name)").order("created_at");
   if(againError)throw againError;
   if(!again?.length)throw new Error("สร้าง Workspace แล้วแต่ยังไม่พบสิทธิ์สมาชิก กรุณาเข้าสู่ระบบใหม่");
   activeOrg=again[0];
 }else activeOrg=memberships[0];
 $("workspaceName").textContent=activeOrg.organizations?.name||"Workspace";
}
async function refreshProperties(){
 const {data,error}=await supabase.from("properties").select("*").eq("organization_id",activeOrg.organization_id).order("created_at",{ascending:false}).limit(1000);
 if(error)throw error;properties=data||[];renderAll();
}
function statusLabel(s){return ({watchlist:"ติดตาม",reviewing:"กำลังพิจารณา",passed:"ไม่ลงทุน",won:"ประมูลได้"})[s]||s||"—"}
function rowMarkup(p){return `<tr><td><b>${safe(p.asset_code||"—")}</b><br><span class="muted">${safe(p.title)}</span></td><td>${safe(p.asset_type||"—")}</td><td>${safe(p.district||"—")} ${safe(p.province||"")}</td><td>${p.government_assessed==null?"—":money(p.government_assessed)}</td><td>${p.auction_date?safe(p.auction_date):"—"}</td><td><span class="tag ${safe(p.status)}">${safe(statusLabel(p.status))}</span></td></tr>`}
function tableMarkup(rows){if(!rows.length)return '<div class="empty">ยังไม่มีข้อมูลในรายการนี้</div>';return `<table class="data-table"><thead><tr><th>รหัส / รายละเอียดทรัพย์</th><th>ประเภท</th><th>พื้นที่</th><th>ราคาประเมินราชการ</th><th>วันขาย</th><th>สถานะ</th></tr></thead><tbody>${rows.map(rowMarkup).join("")}</tbody></table>`}
function renderAll(){
 $("statTotal").textContent=properties.length.toLocaleString("th-TH");$("statWatch").textContent=properties.filter(p=>p.status==="watchlist").length.toLocaleString("th-TH");
 const assessed=properties.reduce((s,p)=>s+(Number(p.government_assessed)||0),0);$("statValue").textContent=money(assessed);
 $("statProvince").textContent=new Set(properties.map(p=>p.province).filter(Boolean)).size.toLocaleString("th-TH");
 $("recentProperties").innerHTML=tableMarkup(properties.slice(0,5));renderProperties();renderTeam();
}
function renderProperties(){
 const q=($("searchInput").value||"").trim().toLowerCase(),province=$("provinceFilter").value,status=$("statusFilter").value;
 const rows=properties.filter(p=>(!province||p.province===province)&&(!status||p.status===status)&&(!q||[p.title,p.asset_code,p.province,p.district,p.asset_type].some(v=>String(v||"").toLowerCase().includes(q))));
 $("propertyCount").textContent=rows.length.toLocaleString("th-TH")+" รายการ";$("propertiesTable").innerHTML=tableMarkup(rows);
 const provinces=[...new Set(properties.map(p=>p.province).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"th"));const previous=$("provinceFilter").value;
 $("provinceFilter").innerHTML='<option value="">ทุกจังหวัด</option>'+provinces.map(p=>`<option value="${safe(p)}">${safe(p)}</option>`).join("");$("provinceFilter").value=previous;
}
async function renderTeam(){
 const {data,error}=await supabase.from("organization_members").select("user_id,role,created_at,profiles(email)").eq("organization_id",activeOrg.organization_id);
 if(error){$("teamList").innerHTML='<div class="empty">ไม่สามารถโหลดสมาชิกได้</div>';return}
 $("teamList").innerHTML=(data||[]).map(m=>`<div class="team-member"><span>${safe(m.profiles?.email||"สมาชิก")}</span><small>${safe(m.role)}</small></div>`).join("")||'<div class="empty">ยังไม่มีสมาชิก</div>';
}
function switchView(name){
 currentView=name;document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));$(name+"View").classList.remove("hidden");
 document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
 const titles={overview:["OVERVIEW","ภาพรวม"],properties:["PROPERTY REGISTER","ทะเบียนทรัพย์"],calculator:["INVESTMENT ANALYSIS","วิเคราะห์ลงทุน"],team:["WORKSPACE TEAM","สมาชิกทีม"]};$("pageEyebrow").textContent=titles[name][0];$("pageTitle").textContent=titles[name][1];
}
async function saveProperty(form){
 const f=new FormData(form),num=(key)=>f.get(key)?Number(f.get(key)):null;
 const record={organization_id:activeOrg.organization_id,asset_code:f.get("asset_code")||null,title:f.get("title"),asset_type:f.get("asset_type"),province:f.get("province")||null,district:f.get("district")||null,government_assessed:num("government_assessed"),listing_asking:num("listing_asking"),auction_date:f.get("auction_date")||null,status:f.get("status"),source_url:f.get("source_url")||null,created_by:session.user.id};
 const {error}=await supabase.from("properties").insert(record);if(error)throw error;
 await refreshProperties();toast("บันทึกข้อมูลทรัพย์แล้ว");$("propertyDialog").close();form.reset();
}
function parseCsv(text){
 const rows=[];let row=[],cell="",quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++}else if(c==='"'){quoted=!quoted}else if(c===","&&!quoted){row.push(cell);cell=""}else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&text[i+1]==="\n")i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell=""}else cell+=c}
 if(cell.length||row.length){row.push(cell);rows.push(row)}return rows;
}
async function importCsv(file){
 const text=await file.text(),rows=parseCsv(text.replace(/^\uFEFF/,""));if(rows.length<2)throw new Error("ไม่พบข้อมูลใน CSV");
 const headers=rows.shift().map(h=>h.trim().toLowerCase());const idx=(...names)=>headers.findIndex(h=>names.includes(h));
 const map={title:idx("title","name","ชื่อทรัพย์","รายละเอียดทรัพย์"),asset_code:idx("asset_code","code","รหัสทรัพย์"),asset_type:idx("asset_type","type","ประเภททรัพย์"),province:idx("province","จังหวัด"),district:idx("district","อำเภอ","เขต"),government_assessed:idx("government_assessed","appraisal","ราคาประเมินราชการ"),listing_asking:idx("listing_asking","asking_price","ราคาประกาศขาย"),auction_date:idx("auction_date","วันขายทอดตลาด"),status:idx("status","สถานะ")};
 if(map.title<0)throw new Error("CSV ต้องมีคอลัมน์ title หรือ ชื่อทรัพย์");
 const payload=rows.filter(r=>r.length).map(r=>{const val=k=>map[k]>=0?(r[map[k]]||"").trim():"";const numeric=k=>val(k)?Number(val(k).replace(/,/g,"")):null;return {organization_id:activeOrg.organization_id,created_by:session.user.id,title:val("title"),asset_code:val("asset_code")||null,asset_type:val("asset_type")||"ไม่ระบุ",province:val("province")||null,district:val("district")||null,government_assessed:numeric("government_assessed"),listing_asking:numeric("listing_asking"),auction_date:val("auction_date")||null,status:val("status")||"watchlist"};}).filter(r=>r.title);
 if(!payload.length)throw new Error("ไม่พบแถวข้อมูลที่มีชื่อทรัพย์");
 for(let i=0;i<payload.length;i+=100){const {error}=await supabase.from("properties").insert(payload.slice(i,i+100));if(error)throw error}
 await refreshProperties();toast("นำเข้า "+payload.length+" รายการสำเร็จ");
}
function exportCsv(){const cols=["asset_code","title","asset_type","province","district","government_assessed","listing_asking","auction_date","status"];const lines=[cols.join(","),...properties.map(p=>cols.map(k=>'"'+String(p[k]??"").replace(/"/g,'""')+'"').join(","))];const blob=new Blob(["\uFEFF"+lines.join("\r\n")],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="led-pi-properties.csv";a.click();URL.revokeObjectURL(url)}
function calculate(){const val=id=>Math.max(0,Number($(id).value)||0),cost=val("bid")+val("transfer")+val("renovation")+val("holding")+val("selling"),profit=val("resale")-cost; $("netProfit").textContent=money(profit);$("netProfit").style.color=profit>=0?"#176b56":"#a13d2c";$("totalCost").textContent=money(cost);$("roi").textContent=cost?((profit/cost)*100).toFixed(2)+"%":"—";$("breakEven").textContent=money(cost)}
async function init(){
 if(!configured){$("boot").classList.add("hidden");showAuth();$("authView").querySelector(".auth-card").insertAdjacentHTML("afterbegin",'<div class="notice error">ยังไม่ได้ตั้งค่า Supabase กรุณากำหนด URL และ anon key ในไฟล์ config.js ก่อน</div>');$("authForm").querySelector("button").disabled=true;return}
 supabase=createClient(config.SUPABASE_URL,config.SUPABASE_ANON_KEY);
 const {data}=await supabase.auth.getSession();session=data.session;
 supabase.auth.onAuthStateChange((_event,newSession)=>{session=newSession;if(!newSession)showAuth();});
 if(!session){showAuth();return}
 try{await startWorkspace()}catch(e){showAuth();toast(e.message||"ไม่สามารถโหลด Workspace",true)}
}
async function startWorkspace(){session=(await supabase.auth.getSession()).data.session;if(!session){showAuth();return}showApp();clearNotice();try{await loadWorkspace();await refreshProperties();switchView("overview")}catch(e){notice(e.message||"โหลดข้อมูลไม่สำเร็จ กรุณาตรวจสอบ Database schema และ RLS","error")}}
$("toggleAuth").addEventListener("click",()=>setAuthMode(!isSignup));
$("authForm").addEventListener("submit",async e=>{e.preventDefault();const email=$("authEmail").value,password=$("authPassword").value;$("authSubmit").disabled=true;try{const result=isSignup?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});if(result.error)throw result.error;if(isSignup&&!result.data.session){toast("สมัครแล้ว กรุณายืนยันอีเมล จากนั้นเข้าสู่ระบบ");setAuthMode(false)}else{session=result.data.session;await startWorkspace()}}catch(err){toast(err.message||"เข้าสู่ระบบไม่สำเร็จ",true)}finally{$("authSubmit").disabled=false}});
$("signOut").addEventListener("click",async()=>{await supabase.auth.signOut();session=null;showAuth()});
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));
document.querySelectorAll('[data-action="add-property"]').forEach(b=>b.addEventListener("click",()=> $("propertyDialog").showModal()));
["closeDialog","cancelDialog"].forEach(id=>$(id).addEventListener("click",()=> $("propertyDialog").close()));
$("propertyForm").addEventListener("submit",async e=>{e.preventDefault();try{await saveProperty(e.currentTarget)}catch(err){toast(err.message||"บันทึกไม่สำเร็จ",true)}});
["searchInput","provinceFilter","statusFilter"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",renderProperties));
$("importCsv").addEventListener("click",()=>$("csvFile").click());$("csvFile").addEventListener("change",async e=>{if(e.target.files[0])try{await importCsv(e.target.files[0])}catch(err){toast(err.message||"นำเข้าไม่สำเร็จ",true)}e.target.value=""});
$("exportCsv").addEventListener("click",exportCsv);$("calculate").addEventListener("click",calculate);calculate();
$("inviteButton").addEventListener("click",async()=>{const email=$("inviteEmail").value.trim(),role=$("inviteRole").value;if(!email)return toast("กรุณาระบุอีเมล",true);const {error}=await supabase.rpc("invite_workspace_member",{target_email:email,target_role:role,workspace_id:activeOrg.organization_id});if(error)return toast(error.message,true);$("inviteEmail").value="";await renderTeam();toast("เพิ่มคำเชิญแล้ว เมื่อผู้ใช้สมัครด้วยอีเมลนี้จะเข้าร่วม Workspace")});
init().catch(e=>{showAuth();toast(e.message||"เริ่มระบบไม่สำเร็จ",true)});
