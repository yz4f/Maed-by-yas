import { NextResponse } from 'next/server';
import { getAuthenticatedActor } from '@/lib/request-actor';
import { getRolePermissions } from '@/lib/permissions';
import { isAuthorizedAdmin } from '@/lib/admin-auth';
export const dynamic='force-dynamic';
export async function GET(){const actor=await getAuthenticatedActor();if(!actor)return NextResponse.json({success:false,error:'يجب تسجيل الدخول.'},{status:401});if(!await isAuthorizedAdmin('roles.view'))return NextResponse.json({success:false,error:'لا تملك صلاحية عرض الأدوار والصلاحيات.'},{status:403});return NextResponse.json({success:true,permissions:await getRolePermissions(actor.role)});}
