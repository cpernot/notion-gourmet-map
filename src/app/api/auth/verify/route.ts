import { NextResponse } from "next/server";

function verifyKey(key?: string | null): boolean {
  const serverSecret = process.env.ADMIN_SECRET_KEY;
  // もしサーバーに ADMIN_SECRET_KEY が未設定なら、誰でも登録可能（開発環境やデフォルト）
  if (!serverSecret) {
    return true;
  }
  return !!key && key === serverSecret;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    const isValid = verifyKey(key);
    return NextResponse.json({
      valid: isValid,
      error: isValid ? undefined : "管理者キーが一致しません。",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "認証チェック中にエラーが発生しました。";
    return NextResponse.json({ valid: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let key: string | undefined;
    try {
      const body = await request.json();
      key = body.key;
    } catch {
      key = undefined;
    }

    const isValid = verifyKey(key);
    return NextResponse.json({
      valid: isValid,
      error: isValid ? undefined : "管理者キーが一致しません。",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "認証チェック中にエラーが発生しました。";
    return NextResponse.json({ valid: false, error: msg }, { status: 500 });
  }
}

