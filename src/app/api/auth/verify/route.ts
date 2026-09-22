import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { key } = await request.json();
    const serverSecret = process.env.ADMIN_SECRET_KEY;

    // もしサーバーに ADMIN_SECRET_KEY が未設定なら、誰でも登録可能（キー検証不要）
    if (!serverSecret) {
      return NextResponse.json({ valid: true, message: "管理者キーは未設定です。" });
    }

    if (key && key === serverSecret) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json(
      { valid: false, error: "管理者キーが一致しません。" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { valid: false, error: "認証チェック中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
