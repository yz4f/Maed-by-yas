import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionActor, requestHasTrustedOrigin, getClientIp } from '@/lib/request-security';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
import { archiveAnnouncement, countAnnouncementRecipients, deleteAnnouncement, listAnnouncements, publishAnnouncement, saveAnnouncement } from '@/lib/announcements';
import { StoreDB } from '@/lib/store-db';
export const dynamic = 'force-dynamic';
const form = z.object({ id: z.string().trim().min(6).max(180), titleAr: z.string().trim().min(2).max(120), titleEn: z.string().trim().min(2).max(120), contentAr: z.string().trim().min(2).max(4000), contentEn: z.string().trim().min(2).max(4000), type: z.enum(['INFO','WARNING','UPDATE','IMPORTANT']), audienceType: z.enum(['ALL','ACTIVE','PRODUCT','ROLE','USER']), audienceValue: z.string().trim().max(180).default(''), startsAt: z.string().datetime(), expiresAt: z.string().datetime().nullable(), pinned: z.boolean(), dismissible: z.boolean(), priority: z.number().int().min(0).max(100) }).refine((value) => !value.expiresAt || new Date(value.expiresAt) > new Date(value.startsAt), { message: 'تاريخ الانتهاء يجب أن يأتي بعد تاريخ البداية.' });
const estimate = z.object({action:z.literal('estimate'),audienceType:z.enum(['ALL','ACTIVE','PRODUCT','ROLE','USER']),audienceValue:z.string().trim().max(180).default('')});
const actionSchema = z.discriminatedUnion('action', [z.object({action:z.literal('save'),announcement:form}),z.object({action:z.literal('publish'),id:z.string().min(1).max(180)}),z.object({action:z.literal('archive'),id:z.string().min(1).max(180)}),z.object({action:z.literal('delete'),id:z.string().min(1).max(180)}),estimate]);
export async function GET() { if(!await isAuthorizedAdmin('announcements.view')) return NextResponse.json({success:false,error:'غير مصرح بعرض الإعلانات.'},{status:403}); try{return NextResponse.json({success:true,announcements:await listAnnouncements()});}catch(error){console.error('Admin announcements load failed:',error);return NextResponse.json({success:false,error:'تعذر تحميل الإعلانات.'},{status:500});} }
export async function POST(request:NextRequest) {
 if(!requestHasTrustedOrigin(request)) return NextResponse.json({success:false,error:'مصدر الطلب غير موثوق.'},{status:403});
 const actor=await getSessionActor(); if(!actor)return NextResponse.json({success:false,error:'يجب تسجيل الدخول أولاً.'},{status:401});
 try {
  const input=actionSchema.parse(await request.json());
  const permission=input.action==='publish'?'announcements.publish':input.action==='delete'||input.action==='archive'?'announcements.delete':'announcements.create';
  if(!await isAuthorizedAdmin(permission))return NextResponse.json({success:false,error:'لا تملك صلاحية تنفيذ هذا الإجراء.'},{status:403});
  if(input.action==='estimate'){
    if(!['ALL','ACTIVE'].includes(input.audienceType)&&!input.audienceValue)return NextResponse.json({success:false,error:'اختر المستلم المطلوب أولاً.'},{status:400});
    return NextResponse.json({success:true,recipientCount:await countAnnouncementRecipients(input.audienceType,input.audienceValue)});
  }
  let result;
  if(input.action==='save')result=await saveAnnouncement(input.announcement,actor);
  else if(input.action==='publish') {
    const draft=(await listAnnouncements()).find((item)=>item.id===input.id);
    if(!draft)throw new Error('الإعلان غير موجود.');
    const recipientCount=await countAnnouncementRecipients(draft.audienceType,draft.audienceValue);
    result=await publishAnnouncement(input.id,recipientCount);
  }
  else if(input.action==='archive')result=await archiveAnnouncement(input.id);
  else{await deleteAnnouncement(input.id);result=null;}
  const id=input.action==='save'?input.announcement.id:input.id;
  await StoreDB.addLog('Announcement Updated',`${actor.name} performed ${input.action} on announcement ${id}.`,actor.discordId,actor.name,getClientIp(request),{eventType:'announcement_updated',actorDiscordId:actor.discordId,actorName:actor.name,metadata:{action:input.action,announcementId:id}});
  return NextResponse.json({success:true,announcement:result});
 }catch(error){const message=error instanceof z.ZodError?'بيانات الإعلان غير صالحة.':error instanceof Error?error.message:'تعذر تنفيذ الإجراء.';return NextResponse.json({success:false,error:message},{status:400});}
}
