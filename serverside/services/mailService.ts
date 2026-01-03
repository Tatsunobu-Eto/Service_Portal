import nodemailer from "nodemailer"

const transporter = process.env.EMAIL_SERVER_USER ? nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
}) : null

// 接続テスト (エラーでプロセスを止めないように監視のみ)
if (transporter && process.env.NODE_ENV !== "test") {
  transporter.verify((error, success) => {
    if (error) {
      console.warn("SMTP_CONNECTION_WARNING (Skipping email functionality):", error.message);
    } else {
      console.log("SMTP_SERVER_READY (Gmail)");
    }
  });
}

export async function sendRegistrationEmail(to: string, url: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Service Portal" <noreply@example.com>',
    to,
    subject: "【重要】サービスポータルへの本登録を完了してください",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">サービスポータルへようこそ</h2>
        <p>ご利用申請が管理者によって承認（仮）されました。</p>
        <p>下記ボタンをクリックして、パスワードの有効化と本登録を完了させてください。</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${url}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">本登録を完了する</a>
        </div>
        <p style="font-size: 0.8em; color: #666;">このリンクの有効期限は24時間です。</p>
        <p style="font-size: 0.8em; color: #666;">心当たりがない場合は、このメールを無視してください。</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 0.7em; color: #999;">Service Portal System</p>
      </div>
    `,
  }

  // 設定がない場合や本番環境でも接続エラーが想定される場合はスキップ
  if (!transporter || !process.env.EMAIL_SERVER_USER) {
    console.log("--- EMAIL SEND SKIP (No Credentials or Transporter) ---")
    console.log("To:", to)
    console.log("URL:", url)
    console.log("------------------------------------------")
    return { skipped: true }
  }

  console.log(`Attempting to send email to: ${to}...`);
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("EMAIL_SENT_SUCCESS:", info.messageId);
    return info;
  } catch (error: any) {
    // メール送信エラーでシステム全体を止めないよう、エラーをスローせずログのみ出力
    console.error("EMAIL_SEND_ERROR_IN_SERVICE (Non-fatal):", error.message);
    return { error: error.message };
  }
}
