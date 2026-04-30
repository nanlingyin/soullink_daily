import { BotCreateForm } from "@/components/bot/BotCreateForm";
import { PageHeader } from "@/components/ui/PageHeader";

export default function NewBotPage() {
  return (
    <main>
      <PageHeader title="创建 AI Bot" description="上传角色图像，填写人设、性格、说话风格和日程偏好。第一版会基于这些信息生成日程、动态和聊天回复。" />
      <BotCreateForm />
    </main>
  );
}
