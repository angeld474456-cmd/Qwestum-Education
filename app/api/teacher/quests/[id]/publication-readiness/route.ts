import { NextResponse } from "next/server";
import { getOwnedQuestPublicationReadiness } from "@/services/teacher-publication.server";
type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,{params}:Context){const result=await getOwnedQuestPublicationReadiness((await params).id);if(result.status==="ok")return NextResponse.json(result.readiness);if(result.status==="unauthorized")return NextResponse.json({error:"Unauthorized."},{status:401});if(result.status==="not_found")return NextResponse.json({error:"Quest not found."},{status:404});return NextResponse.json({error:"Unable to check publication readiness."},{status:500});}
