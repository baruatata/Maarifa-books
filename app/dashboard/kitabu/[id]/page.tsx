import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateSellerBook,deleteSellerBook } from "@/app/dashboard/kitabu/actions";
import { ReplaceBookPdf } from "@/components/replace-book-pdf";

export default async function EditSellerBookPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{error?:string}>}) {
 const {id}=await params; const query=await searchParams;
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect("/ingia");
 const {data:application}=await supabase.from("seller_applications").select("status").eq("user_id",user.id).maybeSingle();
 if(application?.status!=="approved") redirect("/wauzaji");
 const {data:book}=await supabase.from("books").select("id,title,author_name,description,category,language,price_tzs,format,status,file_path").eq("id",id).eq("seller_id",user.id).maybeSingle();
 if(!book) notFound();
 async function save(formData:FormData) { "use server"; const result=await updateSellerBook(id,formData); if(!result.ok) redirect("/dashboard/kitabu/"+id+"?error="+encodeURIComponent(result.error)); redirect("/dashboard?saved=book"); }
 async function remove() { "use server"; const result=await deleteSellerBook(id); if(!result.ok) redirect("/dashboard/kitabu/"+id+"?error="+encodeURIComponent(result.error)); redirect("/dashboard?deleted=book"); }
 return <main className="page"><Link href="/dashboard" className="book-detail-back">← Dashibodi ya muuzaji</Link><p className="eyebrow">USIMAMIZI WA KITABU</p><h1>Hariri kitabu</h1><p className="muted">Ukibadilisha taarifa, kitabu kitarudi kwa Admin kukaguliwa kabla ya kuonekana tena kwa wateja.</p>{query.error&&<p className="message">{query.error}</p>}
 <form action={save} className="panel form"><div className="field"><label htmlFor="edit-title">Jina la kitabu</label><input id="edit-title" name="title" defaultValue={book.title} required maxLength={180}/></div><div className="field"><label htmlFor="edit-author">Mwandishi</label><input id="edit-author" name="author_name" defaultValue={book.author_name||""}/></div><div className="field"><label htmlFor="edit-description">Maelezo</label><textarea id="edit-description" name="description" defaultValue={book.description||""}/></div><div className="field"><label htmlFor="edit-category">Kategoria</label><select id="edit-category" name="category" defaultValue={book.category||"nyingine"}><option value="elimu">Elimu</option><option value="biashara">Biashara</option><option value="maendeleo-binafsi">Maendeleo binafsi</option><option value="hadithi">Hadithi na fasihi</option><option value="dini">Dini</option><option value="teknolojia">Teknolojia</option><option value="nyingine">Nyingine</option></select></div><div className="field"><label htmlFor="edit-language">Lugha</label><select id="edit-language" name="language" defaultValue={book.language}><option value="sw">Kiswahili</option><option value="en">English</option><option value="other">Nyingine</option></select></div><div className="field"><label htmlFor="edit-price">Bei ya kitabu (TZS)</label><input id="edit-price" name="price_tzs" type="number" min="0" max="100000000" step="1" defaultValue={book.price_tzs} required/><small className="muted">Weka 0 kwa kitabu cha bure. Sampuli ya kitabu cha kulipia hutengenezwa kiotomatiki wakati wa kupakia PDF/EPUB.</small></div><p className="muted">Muundo: {String(book.format).toUpperCase()} · Bei: {book.price_tzs > 0 ? "TSh " + new Intl.NumberFormat("sw-TZ").format(book.price_tzs) : "BURE"} · Hali: {book.status}</p><button className="btn">Hifadhi mabadiliko</button></form>
 {book.format === "pdf" && <ReplaceBookPdf bookId={book.id} currentFilePath={book.file_path} format={book.format} isPaid={book.price_tzs > 0}/>}
 <section className="panel seller-delete-panel"><h2>Futa kitabu</h2><p className="muted">Unaweza kufuta kitabu ambacho bado hakijanunuliwa. Vitabu vilivyouzwa haviwezi kufutwa kabisa ili kulinda historia ya wanunuzi.</p><form action={remove}><button className="btn btn-outline" type="submit">Futa kitabu hiki</button></form></section>
 </main>;
}
