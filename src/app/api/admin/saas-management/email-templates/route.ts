import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { appLogger as logger } from "@/lib/logger";
import { requireRoot } from "@/lib/api/root-middleware";
import { AuthorizationError } from "@/lib/api/errors";
import type { IsAdminParams, IsAdminResult } from "@/types/supabase-rpc";

export async function GET(request: NextRequest) {
  try {
    // Require root or dev role for SaaS management
    await requireRoot(request);

    const supabase = await createClient();

    // Fetch SaaS-level templates

    // Fetch SaaS-level templates
    const { data: templates, error } = await supabase
      .from("system_email_templates")
      .select("*")
      .eq("category", "saas")
      .order("type", { ascending: true });

    if (error) {
      logger.error("Error fetching SaaS email templates", { error });
      return NextResponse.json(
        { error: "Failed to fetch email templates" },
        { status: 500 },
      );
    }

    return NextResponse.json({ templates: templates || [] });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    logger.error("Error in SaaS email templates API", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require root or dev role for SaaS management
    const { userId } = await requireRoot(request);

    const body = await request.json();
    const {
      name,
      type,
      subject,
      content,
      variables = [],
      is_active = true,
    } = body;

    const supabase = await createClient();

    // Create the SaaS template
    const { data: template, error: templateError } = await supabase
      .from("system_email_templates")
      .insert({
        name,
        type,
        subject,
        content,
        variables: JSON.stringify(variables),
        is_active,
        is_system: false,
        category: "saas",
        created_by: userId,
      })
      .select()
      .single();

    if (templateError) {
      logger.error("Error creating SaaS email template", {
        error: templateError,
      });
      return NextResponse.json(
        { error: "Failed to create SaaS email template" },
        { status: 500 },
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    logger.error("Error in create SaaS email template API", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
