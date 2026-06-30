import { RoomCanvas } from "@/components/RoomCanvas";

interface PageProps {
  params: Promise<{
    roomid: string;
  }>;
}

export default async function Canvas({ params }: PageProps) {
  const resolvedParams = await params;
  const roomId = resolvedParams.roomid;
  return <RoomCanvas roomId={roomId} />;
}