import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { appLogger as logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: template, error } = await supabase
      .from("system_email_templates")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      logger.error("Error fetching email template", {
        error,
        templateId: params.id,
      });
      return NextResponse.json(
        {
          error: "Failed to fetch email template",
        },
        { status: 500 },
      );
    }

    if (!template) {
      return NextResponse.json(
        {
          error: "Template not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({ template });
  } catch (error) {
    logger.error("Error in email template API", {
      error,
      templateId: params.id,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();
    const { name, subject, content, is_active, variables } = body;

    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build update object
    const updateData: {
      name?: string;
      type?: string;
      subject?: string;
      content?: string;
      variables?: Record<string, unknown>;
      is_active?: boolean;
      updated_at?: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (content !== undefined) updateData.content = content;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (variables !== undefined)
      updateData.variables = Array.isArray(variables)
        ? variables
        : JSON.parse(variables || "[]");

    const { data: template, error } = await supabase
      .from("system_email_templates")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      logger.error("Error updating email template", {
        error,
        templateId: params.id,
      });
      return NextResponse.json(
        {
          error: "Failed to update email template",
          details: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    logger.error("Error in update email template API", {
      error,
      templateId: params.id,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();

    // Check admin authorization
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("system_email_templates")
      .delete()
      .eq("id", params.id);

    if (error) {
      logger.error("Error deleting email template", {
        error,
        templateId: params.id,
      });
      return NextResponse.json(
        {
          error: "Failed to delete email template",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    logger.error("Error in delete email template API", {
      error,
      templateId: params.id,
    });
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
